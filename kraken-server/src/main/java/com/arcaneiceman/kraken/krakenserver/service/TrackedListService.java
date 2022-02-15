package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.domain.*;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.repository.TrackedListRepository;
import com.arcaneiceman.kraken.krakenserver.service.utils.CrunchListService;
import com.arcaneiceman.kraken.krakenserver.service.utils.PasswordListService;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

import static org.zalando.problem.Status.*;

@Service
@Transactional
public class TrackedListService {

    private final TrackedListRepository trackedListRepository;
    private final PasswordListService passwordListService;
    private final CrunchListService crunchListService;
    private final JobService jobService;

    public TrackedListService(TrackedListRepository trackedListRepository,
                              PasswordListService passwordListService,
                              CrunchListService crunchListService,
                              JobService jobService) {
        this.trackedListRepository = trackedListRepository;
        this.passwordListService = passwordListService;
        this.crunchListService = crunchListService;
        this.jobService = jobService;
    }

    TrackedList createTrackedList(String listName, ActiveRequest activeRequest) {
        if (listName.startsWith("crunch"))
            return createCrunchList(listName, activeRequest);
        else
            return createPasswordList(listName, activeRequest);
    }

    private TrackedPasswordList createPasswordList(String passwordListName, ActiveRequest activeRequest) {
        // Validate Password List
        try {
            PasswordList passwordList = passwordListService.get(passwordListName);
            return trackedListRepository.save(
                    new TrackedPasswordList(passwordList.getJobDelimiterSetSize(), passwordList.getName(), activeRequest));
        } catch (Exception e) {
            throw new SystemException(232, e.getMessage(), BAD_REQUEST);
        }
    }

    private TrackedCrunchList createCrunchList(String listName, ActiveRequest activeRequest) {
        // Validate and get Total Job
        try {
            String[] tokens = listName.split(" ");
            Integer min = Integer.parseInt(tokens[1]);
            Integer max = Integer.parseInt(tokens[2]);
            String characters = tokens[3];
            String start = "", pattern = "";
            for (int i = 0; i < tokens.length; i++) {
                if (Objects.equals(tokens[i], "-s"))
                    start = tokens[i + 1];
                if (Objects.equals(tokens[i], "-t"))
                    pattern = tokens[i + 1];
            }
            Long totalJobs = crunchListService.validateCrunchAndReturnTotalJobs(min, max, characters, start, pattern);
            return trackedListRepository.save(
                    new TrackedCrunchList(listName, totalJobs, min, max, characters, start, pattern, activeRequest));
        } catch (InterruptedException | ExecutionException | IOException e) {
            throw new SystemException(232, e.getMessage(), BAD_REQUEST);
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            throw new SystemException(232, "Crunch parameters could not be parsed", BAD_REQUEST);
        }
    }

    /**
     * Gets Next Available Job from TrackedList
     * Step 1 : Fetch First Available TrackedList with Lock
     * Step 2 : If : jobs available in queue, fetch and return from there
     * Step 3 : If : more jobs cannot be created, return null
     * Step 4 : Else : Create next job from the TrackedList
     *
     * @param owner               ActiveRequest that owns this TrackedList
     * @param worker              Worker who is asking for the job
     * @param requestedMultiplier job size requestedMultiplier increases job size
     * @return next Job to send
     */
    Job getNextJob(ActiveRequest owner, Worker worker, Long requestedMultiplier) throws IOException, ExecutionException, InterruptedException {
        // Step 1: Get with Lock (Running)
        TrackedList trackedList = trackedListRepository.findFirstByTrackingStatusAndOwner(TrackingStatus.RUNNING, owner);
        if (trackedList == null)
            trackedList = trackedListRepository.findFirstByTrackingStatusAndOwner(TrackingStatus.PENDING, owner);
        if (trackedList == null)
            return null;

        try {
            // Step 2: Get job from queue if available (and not null)
            Job job = jobService.getFromQueueIfAvailable(trackedList, worker, requestedMultiplier);
            if (job != null)
                return job;
        } catch (SocketTimeoutException e) {
            throw new SystemException(21321, "Could not reach file store! Try again in a bit", SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            trackedList.setTrackingStatus(TrackingStatus.ERROR);
            trackedList.setErrorJobCount(trackedList.getTotalJobCount() - trackedList.getCompletedJobCount());
            trackedListRepository.save(trackedList);
            throw e;
        }

        // Step 3 : Return null if more jobs cannot be created
        if (trackedList.getNextJobIndex() >= trackedList.getTotalJobCount()) {
            if (checkIfListComplete(trackedList)) {
                trackedList.setTrackingStatus(TrackingStatus.COMPLETE);
                trackedListRepository.save(trackedList);
            }
            return null;
        }

        // Step 4 : Create new Jobs from this TrackedList
        try {
            Job job = jobService.create(trackedList, worker, requestedMultiplier);

            // Not Explicitly adding mapping
            //trackedList.getJobQueue().add(job);

            // Update Status to running if it wasnt already running
            if (trackedList.getTrackingStatus() != TrackingStatus.RUNNING)
                trackedList.setTrackingStatus(TrackingStatus.RUNNING);

            // Save
            trackedListRepository.save(trackedList);

            return job;
        } catch (SocketTimeoutException e) {
            throw new SystemException(21321, "Could not reach file store! Try again in a bit", SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            trackedList.setTrackingStatus(TrackingStatus.ERROR);
            trackedList.setErrorJobCount(trackedList.getTotalJobCount() - trackedList.getCompletedJobCount());
            trackedListRepository.save(trackedList);
            throw e;
        }
    }

    /**
     * Reports job for TrackedList
     * Step 1: Fetch TrackedList with lock
     * Step 2: Based on tracking status perform updates
     * Step 3: Check if list is complete
     *
     * @param jobId          Job id being reported
     * @param trackedListId  TrackedListId reported
     * @param activeRequest  Active Request
     * @param trackingStatus result of the search
     * @param worker         Worker who reported this
     */
    void reportJob(String jobId, String trackedListId, ActiveRequest activeRequest, TrackingStatus trackingStatus, Worker worker) {
        // Step 1 : Fetch TrackedList with lock
        TrackedList trackedList = trackedListRepository.findByIdAndOwner(trackedListId, activeRequest)
                .orElseThrow(() -> new SystemException(232, "List with id " + trackedListId + " not found", NOT_FOUND));

        // Step 2: Based on tracking status, perform updates
        switch (trackingStatus) {
            case COMPLETE:
                // Complete Job and Increment Completion Count
                jobService.reportJobCompleted(jobId, trackedList, worker);
                break;
            case ERROR:
                // Report Job Error and Increment Error Count
                jobService.reportJobError(jobId, trackedList, worker);
                break;
        }

        if (checkIfListComplete(trackedList))
            trackedList.setTrackingStatus(TrackingStatus.COMPLETE);

        trackedListRepository.save(trackedList);
    }

    /**
     * If Tracked List's Complete Jobs + Error Jobs >= Total Jobs
     *
     * @param trackedList to check whether it is completed
     * @return if trackedList is complete or not
     */
    private boolean checkIfListComplete(TrackedList trackedList) {
        return trackedList.getCompletedJobCount() + trackedList.getErrorJobCount() >= trackedList.getTotalJobCount();
    }

}
