package com.arcaneiceman.kraken.krakenserver.config;

import com.amazonaws.ClientConfiguration;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

/**
 * Created by Wali on 27/02/18.
 */
@Configuration
public class FileStorageConfiguration {

    private Logger log = LoggerFactory.getLogger(FileStorageConfiguration.class);

    @Getter
    private boolean isConfigured = false;

    @Getter
    @Value("${file-storage.accesskey}")
    private String accessKey;

    @Getter
    @Value("${file-storage.secretkey}")
    private String secretKey;

    @Getter
    @Value("${file-storage.bucketname}")
    private String bucketName;

    @Getter
    @Value("${file-storage.region}")
    private String region;

    @Getter
    @Value("${file-storage.url}")
    private String url;

    private AmazonS3 generatedS3Client;

    public AmazonS3 getGeneratedClient() {
        return generatedS3Client;
    }

    public void generateClients() {
        try {
            // Generate Client
            ClientConfiguration clientConfiguration = new ClientConfiguration();
            clientConfiguration.setSignerOverride("AWSS3V4SignerType");

            generatedS3Client = AmazonS3ClientBuilder
                    .standard()
                    .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(url, region))
                    .withPathStyleAccessEnabled(true)
                    .withClientConfiguration(clientConfiguration)
                    .withCredentials(new AWSStaticCredentialsProvider(
                            new BasicAWSCredentials(accessKey, secretKey)))
                    .build();

            log.info("Successfully configured S3 File Storage Configuration");
            isConfigured = true;
        }
        catch (Exception e){
            log.error("File Storage Configuration was not configured properly : " + e.getMessage());
        }
    }

    @PostConstruct
    public void postConstruct() {
        // Check for required Fields
        if (region == null)
            throw new IllegalStateException("File Storage Configuration : No region specified!");
        if (accessKey == null || accessKey.isEmpty())
            throw new IllegalStateException("File Storage Configuration : No AWS access key specified!");
        if (secretKey == null || secretKey.isEmpty())
            throw new IllegalStateException("File Storage Configuration : No AWS secret key specified!");
        if (bucketName == null || bucketName.isEmpty())
            throw new IllegalStateException("File Storage Configuration : No Bucket Name specified!");

        // Generate Client(s)
        generateClients();
    }
}