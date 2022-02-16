package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.amazonaws.services.s3.model.*;
import com.amazonaws.util.IOUtils;
import com.arcaneiceman.kraken.krakenserver.config.FileStorageConfiguration;
import com.arcaneiceman.kraken.krakenserver.domain.PasswordList;
import com.arcaneiceman.kraken.krakenserver.domain.PasswordListJobDelimiter;
import com.arcaneiceman.kraken.krakenserver.repository.PasswordListRepository;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ResourceUtils;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Created by Wali on 4/22/2018.
 */
@Service
@Transactional
public class PasswordListService {

    private final Logger log = LoggerFactory.getLogger(PasswordListService.class);
    private final PasswordListRepository passwordListRepository;
    private final PasswordListJobDelimiterService passwordListJobDelimiterService;
    private final FileStorageConfiguration fileStorageConfiguration;
    private final ResourceLoader resourceLoader;

    @Value("${application.password-list-settings.password-list-refresh-task-rate-in-milliseconds}")
    private String passwordListRefreshTaskRate;

    @Value("${application.password-list-settings.min-job-size}")
    private String minJobSize;

    public PasswordListService(PasswordListRepository passwordListRepository,
                               PasswordListJobDelimiterService passwordListJobDelimiterService,
                               FileStorageConfiguration fileStorageConfiguration, ResourceLoader resourceLoader) {
        this.passwordListRepository = passwordListRepository;
        this.passwordListJobDelimiterService = passwordListJobDelimiterService;
        this.fileStorageConfiguration = fileStorageConfiguration;
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void checkValues() throws IOException {
        if (minJobSize == null || minJobSize.isEmpty())
            throw new RuntimeException("Password List Service : Job Size Not Specified");
        initializeS3();
        checkS3Bucket();
    }

    public Page<PasswordList> list(Pageable pageable) {
        return passwordListRepository.findAll(pageable);
    }

    public PasswordList get(String name) throws IOException {
        if (!fileStorageConfiguration.getGeneratedClient().doesObjectExist(
                fileStorageConfiguration.getBucketName(), name))
            throw new IOException("Could not find Password List in File Store");
        return passwordListRepository.findById(name)
                .orElseThrow(() -> new SystemException(2342, "Could not find Password List in Repo", Status.NOT_FOUND));
    }

    public List<String> getValuesForIndex(String name, Long startJobDelimiterIndexNumber, Long endJobDelimiterIndex) throws IOException {
        // Get Password List (And Check if it exists)
        PasswordList passwordList = get(name);

        // Get Start Job Delimiter
        PasswordListJobDelimiter passwordListStartJobDelimiter =
                passwordListJobDelimiterService.get(startJobDelimiterIndexNumber, passwordList);
        // Get End Job Delimiter
        PasswordListJobDelimiter passwordListEndJobDelimiter =
                passwordListJobDelimiterService.get(endJobDelimiterIndex, passwordList);

        // Create Request and Set Range
        GetObjectRequest getObjectRequest = new GetObjectRequest(
                fileStorageConfiguration.getBucketName(), passwordList.getName());
        getObjectRequest.setRange(passwordListStartJobDelimiter.getStartByte(), passwordListEndJobDelimiter.getEndByte() - 1);

        // Fetch Object
        ArrayList<String> candidateValues = new ArrayList<>();
        S3Object object = fileStorageConfiguration.getGeneratedClient().getObject(getObjectRequest);
        InputStream fileStream = new BufferedInputStream(object.getObjectContent());
        InputStreamReader decoder = new InputStreamReader(fileStream, passwordList.getCharset());
        BufferedReader buffered = new BufferedReader(decoder);
        String thisLine;
        while ((thisLine = buffered.readLine()) != null)
            candidateValues.add(thisLine);
        return candidateValues;
    }

    private void initializeS3() throws IOException {
        if (!fileStorageConfiguration.isConfigured())
            return;

        if (!fileStorageConfiguration.getGeneratedClient().doesBucketExistV2(fileStorageConfiguration.getBucketName()))
            fileStorageConfiguration.getGeneratedClient().createBucket(fileStorageConfiguration.getBucketName());

        try {
            for (Resource resource : ResourcePatternUtils.getResourcePatternResolver(resourceLoader)
                    .getResources("classpath*:lists/*")) {
                File file = new File("lists/" + resource.getFilename());
                fileStorageConfiguration.getGeneratedClient().putObject(
                        new PutObjectRequest(fileStorageConfiguration.getBucketName(), resource.getFilename(), file));
            }
        }
        catch (Exception e){
            log.error("Failed to upload sample password lists");
        }
    }

    //@Async
    @Scheduled(initialDelay = 60000L,
            fixedDelayString = "${application.password-list-settings.password-list-refresh-task-rate-in-milliseconds}")
    public void checkS3Bucket() throws IOException {
        log.info("Running: Password List Storage Task");

        if (!fileStorageConfiguration.isConfigured()){
            log.warn("File Storage not configured properly. Skipping...");
            return;
        }

        List<String> fromS3 = fileStorageConfiguration.getGeneratedClient().listObjects(
                fileStorageConfiguration.getBucketName()).getObjectSummaries().stream()
                .map(S3ObjectSummary::getKey)
                .filter(key -> !key.endsWith("/"))
                .map(key -> key.substring(key.lastIndexOf(":") + 1))
                .collect(Collectors.toList());

        // Find Lists to Remove if S3 doesn't contain them and their job sizes are the same
        List<PasswordList> toRemove = passwordListRepository.findAll().stream()
                .filter(list -> !(fromS3.contains(list.getName()) && Objects.equals(minJobSize, list.getJobSize())))
                .collect(Collectors.toList());
        for (PasswordList list : toRemove) {
            log.info("\t Could not find {} MinJobSize {} and is being removed", list.getName(), list.getJobSize());
            passwordListJobDelimiterService.delete(list);
            passwordListRepository.delete(list);
        }

        // Add New Lists
        List<String> toAdd = fromS3.stream().filter(list -> !passwordListRepository.existsById(list)).collect(Collectors.toList());
        for (String s3List : toAdd) {
            // Else Add to Local
            log.info("\t Adding {} from File Storage", s3List);

            // Create PasswordList
            PasswordList passwordList = passwordListRepository.save(
                    new PasswordList(s3List, 0L, "UTF-8", minJobSize));

            // Get Input Stream
            S3Object s3Object = fileStorageConfiguration.getGeneratedClient().getObject(
                    fileStorageConfiguration.getBucketName(), s3List);
            InputStream fileStream = new BufferedInputStream(s3Object.getObjectContent());
            // TODO : FIX THIS ENCODING
            InputStreamReader decoder = new InputStreamReader(fileStream, StandardCharsets.UTF_8);
            BufferedReader buffered = new BufferedReader(decoder);

            // Initialize Variables
            String thisLine;
            long jobDelimiterIndex = 0;
            int numOfLinesRead = 0;
            long jobStartMarker = 0;
            long jobOffsetMarker = 0;

            // While there are lines to be read...
            while ((thisLine = buffered.readLine()) != null) {
                // Increment number of lines and the jobOffsetMarker
                numOfLinesRead++;
                jobOffsetMarker = jobOffsetMarker + thisLine.length() + 1;

                // If job size limit is reached...
                if (numOfLinesRead == Integer.parseInt(minJobSize)) {
                    // Add job to delimiter set
                    passwordListJobDelimiterService.create(jobDelimiterIndex, jobStartMarker, jobOffsetMarker, passwordList);
                    // Reset the jobStartMarker
                    jobStartMarker = jobOffsetMarker;
                    // Reset number of lines read
                    numOfLinesRead = 0;
                    // Increment Job Delimiter Index
                    jobDelimiterIndex++;
                }
            }

            // If there are left over lines that werent put into the list, put them now
            if (numOfLinesRead > 0)
                passwordListJobDelimiterService.create(jobDelimiterIndex, jobStartMarker, jobOffsetMarker, passwordList);

            // Save Password List Length
            passwordList.setJobDelimiterSetSize(jobDelimiterIndex);
            passwordListRepository.save(passwordList);
        }

        if (toRemove.isEmpty() && toAdd.isEmpty())
            log.info("\t No Additions or Deletions");

        log.info("Complete: Password List Storage Task");
    }

}
