package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.domain.Job;
import com.arcaneiceman.kraken.krakenserver.domain.TrackedCrunchList;
import com.arcaneiceman.kraken.krakenserver.domain.TrackedPasswordList;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.repository.JobRepository;
import com.arcaneiceman.kraken.krakenserver.service.utils.CrunchListService;
import com.arcaneiceman.kraken.krakenserver.service.utils.PasswordListService;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Date;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.stream.Stream;

import static org.zalando.problem.Status.BAD_REQUEST;
import static org.zalando.problem.Status.NOT_FOUND;

@Service
@Transactional
public class JobService {

    private final CrunchListService crunchListService;
    private final JobRepository jobRepository;
    private final PasswordListService passwordListService;

    @Value("${application.job-settings.job-expiry-window-in-milliseconds}")
    private String jobExpiryWindow;

    @Value("${application.job-settings.job-expiry-window-multiplier}")
    private String jobExpiryWindowMultiplier;

    @Value("${application.job-settings.max-multiplier}")
    private String maxMultiplier;

    public JobService(CrunchListService crunchListService,
                      JobRepository jobRepository,
                      PasswordListService passwordListService) {
        this.crunchListService = crunchListService;
        this.jobRepository = jobRepository;
        this.passwordListService = passwordListService;
    }

    @PostConstruct
    public void checkVariables() {
        if (jobExpiryWindow == null || jobExpiryWindow.isEmpty())
            throw new IllegalStateException("Job Service - Job Expiry Window Not Specified");
        if (jobExpiryWindowMultiplier == null || jobExpiryWindowMultiplier.isEmpty())
            throw new IllegalStateException("Job Service - Job Expiry Window Multiplier Not Specified");
        if (maxMultiplier == null || maxMultiplier.isEmpty())
            throw new IllegalStateException("Job Service = Job Max Multiplier Not Specified");
    }

    Job create(TrackedList trackedList, Worker worker, Long requestedMultiplier)
            throws InterruptedException, ExecutionException, IOException {
        if (requestedMultiplier > Long.parseLong(maxMultiplier))
            throw new RuntimeException("Max multiplier cannot be more than " + maxMultiplier);

        Job job = new Job(null, 0L, null, null, TrackingStatus.RUNNING,
                0, null, worker, trackedList, null);

        // Set Will Expire At
        job.setWillExpireAt(getJobWillExpireAt(job));

        // Get Start Index
        job.setStartIndex(trackedList.getNextJobIndex());

        // Calculate End Index
        Long endIndex = Math.min(trackedList.getTotalJobCount() - 1, job.getStartIndex() + requestedMultiplier - 1);

        switch (trackedList.getListType()) {
            case PASSWORD_LIST:
                // Populate Values
                job.setValues(passwordListService.getValuesForIndex(
                        ((TrackedPasswordList) trackedList).getListName(), job.getStartIndex(), endIndex));

                // Set Applied Multiplier
                job.setMultiplier((endIndex + 1) - job.getStartIndex());
                break;
            case CRUNCH:
                // Get Next Job String
                job.setStartMarker(((TrackedCrunchList) trackedList).getNextJobString());

                // Generate Values
                job.setValues(crunchListService.getValuesForStartString(
                        ((TrackedCrunchList) trackedList), job.getStartMarker(), requestedMultiplier));

                // Calculate Next Start
                String nextStartString = job.getValues().remove(job.getValues().size() - 1);

                // Update Next Job String on Tracked List
                ((TrackedCrunchList) trackedList).setNextJobString(nextStartString);

                // Set Applied Multiplier
                job.setMultiplier(new Double(Math.ceil((double) job.getValues().size() / crunchListService.getMinJobSize())).longValue());
                break;
        }

        // Update worker total jobs
        worker.setTotalJobCount(worker.getTotalJobCount() + job.getMultiplier());

        // Update Next Index on Tracked List
        trackedList.setNextJobIndex(endIndex + 1);

        return jobRepository.save(job);
    }

    Job getFromQueueIfAvailable(TrackedList trackedList, Worker worker, Long requestedMultiplier)
            throws InterruptedException, ExecutionException, IOException {
        if (requestedMultiplier > Long.parseLong(maxMultiplier))
            throw new SystemException(9000, "Max multiplier is " + maxMultiplier, BAD_REQUEST);
        Job jobToReturn;

        // If not found, return null
        Job jobFromQueue = jobRepository.findFirstByOwnerAndTrackingStatus(trackedList, TrackingStatus.PENDING);
        if (jobFromQueue == null)
            return null;

        // If Requested Multiplier is less than jobFromQueue multiplier
        if (requestedMultiplier < jobFromQueue.getMultiplier()) {
            // Partition Job : Break the Queue Job into a smaller Job
            jobToReturn = new Job(null, jobFromQueue.getStartIndex(), jobFromQueue.getStartMarker(),
                    requestedMultiplier, TrackingStatus.RUNNING, 0, null, worker, trackedList, null);
        } else {
            // Use Job From Queue : Mark Running, New Submission Date and Worker Association
            jobFromQueue.setTrackingStatus(TrackingStatus.RUNNING);
            if (jobFromQueue.getWorker() != null)
                throw new SystemException(324, "Job is already associated with a worker", BAD_REQUEST);
            jobFromQueue.setWorker(worker);

            // Assign this as jobToReturn
            jobToReturn = jobFromQueue;
        }

        // Set Will Expire At
        jobToReturn.setWillExpireAt(getJobWillExpireAt(jobToReturn));

        // Populate Values
        switch (trackedList.getListType()) {
            case PASSWORD_LIST:
                // Calculate End Index
                Long endIndex = Math.min(trackedList.getTotalJobCount() - 1, jobToReturn.getStartIndex() + jobToReturn.getMultiplier() - 1);

                jobToReturn.setValues(passwordListService.getValuesForIndex(
                        ((TrackedPasswordList) trackedList).getListName(), jobToReturn.getStartIndex(), endIndex));

                // If Job was partitioned, update jobFromQueue's Index and Multiplier
                if (!Objects.equals(jobToReturn.getId(), jobFromQueue.getId())) {
                    jobFromQueue.setStartIndex(endIndex + 1);
                    jobFromQueue.setMultiplier(jobFromQueue.getMultiplier() - requestedMultiplier);
                    jobRepository.save(jobFromQueue);
                }

                break;
            case CRUNCH:
                jobToReturn.setValues(crunchListService.getValuesForStartString(
                        ((TrackedCrunchList) trackedList), jobToReturn.getStartMarker(), jobToReturn.getMultiplier()));

                // If Job was partitioned, update jobFromQueue's Start String and Multiplier
                if (!Objects.equals(jobToReturn.getId(), jobFromQueue.getId())) {
                    // Calculate Last String
                    String nextStartString = jobToReturn.getValues().remove(jobToReturn.getValues().size() - 1);

                    jobFromQueue.setStartMarker(nextStartString);
                    jobFromQueue.setMultiplier(jobFromQueue.getMultiplier() - requestedMultiplier);
                    jobRepository.save(jobFromQueue);
                }

                break;
        }

        // Update worker total jobs
        worker.setTotalJobCount(worker.getTotalJobCount() + jobToReturn.getMultiplier());

        return jobRepository.save(jobToReturn);
    }

    void reportJobCompleted(String id, TrackedList trackedList, Worker worker) {
        Job job = jobRepository.findByIdAndOwner(id, trackedList)
                .orElseThrow(() -> new SystemException(232, "Job with id " + id + " not found", NOT_FOUND));

        // Remove Job -> Worker Association
        if (job.getWorker() == null || !Objects.equals(job.getWorker().getId(), worker.getId()))
            throw new SystemException(2342, "This worker was not running reported job", Status.BAD_REQUEST);
        job.setWorker(null);

        // Increment Worker Complete Count
        worker.setCompletedJobCount(worker.getCompletedJobCount() + job.getMultiplier());

        // Increment Tracked List Completion Count
        trackedList.setCompletedJobCount(trackedList.getCompletedJobCount() + job.getMultiplier());

        // Job Completed Successfully... Remove it
        jobRepository.delete(job);
    }

    void reportJobError(String id, TrackedList trackedList, Worker worker) {
        Job job = jobRepository.findByIdAndOwner(id, trackedList)
                .orElseThrow(() -> new SystemException(232, "Job with id " + id + " not found", NOT_FOUND));

        // Remove Job -> Worker Association
        if (!Objects.equals(job.getWorker().getId(), worker.getId()))
            throw new SystemException(2342, "This worker was not running reported job", Status.BAD_REQUEST);
        job.setWorker(null);

        // Increment Error Count
        job.setErrorCount(job.getErrorCount() + 1);

        // If Error Count > 3
        if (job.getErrorCount() >= 3) {
            // Increment Worker Error Count
            worker.setErrorJobCount(worker.getErrorJobCount() + job.getMultiplier());

            // Increment Tracked List Error Count
            trackedList.setErrorJobCount(trackedList.getErrorJobCount() + job.getMultiplier());

            // Permanently Delete Job
            jobRepository.delete(job);
        } else {
            // Mark it Pending
            job.setTrackingStatus(TrackingStatus.PENDING);

            jobRepository.save(job);
        }
    }

    Stream<Job> getExpiredJobs() {
        // willExpireAt < currentTime
        return jobRepository.findByTrackingStatusAndWillExpireAtBefore(TrackingStatus.RUNNING, new Date());
    }

    // current Time + (expiry * multiplier * targetCount)
    private Date getJobWillExpireAt(Job job) {
        return new Date(
                new Date().getTime() + // current Time +
                        (Long.parseLong(jobExpiryWindow) * // Expiry Window *
                                Long.parseLong(jobExpiryWindowMultiplier) * // Multiplier *
                                job.getOwner().getOwner().getTargetCount())); // Target Count
    }
}
