package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.controller.io.ActiveRequestIO;
import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.Job;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.repository.ActiveRequestRepository;
import com.arcaneiceman.kraken.krakenserver.service.utils.EmailService;
import com.arcaneiceman.kraken.krakenserver.service.utils.RequestProcessingService;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import lombok.SneakyThrows;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.zalando.problem.Status.BAD_REQUEST;
import static org.zalando.problem.Status.NOT_FOUND;

@Service
@Transactional
public class ActiveRequestService {

    private final Logger log = LoggerFactory.getLogger(ActiveRequestService.class);

    private final UserService userService;
    private final WorkerService workerService;
    private final ActiveRequestRepository activeRequestRepository;
    private final RequestProcessingService requestProcessingService;
    private final JobService jobService;
    private final EmailService emailService;
    private final TrackedListService trackedListService;
    private final CompleteRequestService completeRequestService;

    public ActiveRequestService(UserService userService,
                                WorkerService workerService,
                                ActiveRequestRepository activeRequestRepository,
                                RequestProcessingService requestProcessingService,
                                JobService jobService,
                                EmailService emailService,
                                TrackedListService trackedListService,
                                CompleteRequestService completeRequestService) {
        this.userService = userService;
        this.workerService = workerService;
        this.activeRequestRepository = activeRequestRepository;
        this.requestProcessingService = requestProcessingService;
        this.jobService = jobService;
        this.emailService = emailService;
        this.trackedListService = trackedListService;
        this.completeRequestService = completeRequestService;
    }

    @SneakyThrows
    public ActiveRequest create(ActiveRequestIO.Create.Request requestDTO) {
        if (requestDTO.getTrackedLists().isEmpty())
            throw new SystemException(232, "No lists have been specified", BAD_REQUEST);
        RequestProcessingService.RequestProcessingResult requestProcessingResult = requestProcessingService.verifyActiveRequest(
                requestDTO.getRequestType(), requestDTO.getRequestMetadata(), requestDTO.getValueToMatchInBase64());
        ActiveRequest activeRequest = activeRequestRepository.save(new ActiveRequest(
                // From DTO
                null, requestDTO.getRequestName(), requestDTO.getRequestType(), "",
                // From Request Processor
                requestProcessingResult.getTargetCount(), requestProcessingResult.getValueInBase64(),
                "{}", null, userService.getUserOrThrow()));
        // From Request Processor;
        activeRequest.setRequestMetadataOverride(requestProcessingResult.getRequestMetadata());
        // From Tracked List Service
        requestDTO.getTrackedLists().forEach(listName -> trackedListService.createTrackedList(listName, activeRequest));
        return activeRequestRepository.save(activeRequest);
    }

    public ActiveRequest get(String id) {
        return activeRequestRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(131, "Active Request with id " + id + " not found", NOT_FOUND));
    }

    public Page<ActiveRequest> list(Pageable pageable) {
        return activeRequestRepository.findByOwner(pageable, userService.getUserOrThrow());
    }

    @SneakyThrows
    public void delete(String id, TrackingStatus status) {
        ActiveRequest activeRequest = activeRequestRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(131, "Active Request with id " + id + " not found", NOT_FOUND));
        // Create Corresponding Completed Request
        completeRequestService.create(activeRequest.getRequestType(), activeRequest.getRequestName(),
                activeRequest.getRequestMetadata(), activeRequest.getTargetCount(), activeRequest.getTrackedLists(),
                activeRequest.getResults(), status);
        // Delete Active Request
        activeRequestRepository.delete(activeRequest);
        // Send Email
        emailService.sendRequestCompleteEmail(activeRequest.getOwner(), activeRequest, status);
    }

    public ActiveRequestIO.Summary.Response summary() {
        List<ActiveRequest> activeRequestList = activeRequestRepository.findByOwner(userService.getUserOrThrow());
        Long totalJobCount = activeRequestList.stream().map(activeRequest ->
                activeRequest.getTrackedLists().stream().mapToLong(TrackedList::getTotalJobCount).sum())
                .reduce(0L, Long::sum);
        Long completedJobCount = activeRequestList.stream().map(activeRequest ->
                activeRequest.getTrackedLists().stream().mapToLong(TrackedList::getCompletedJobCount).sum())
                .reduce(0L, Long::sum);
        Long errorJobCount = activeRequestList.stream().map(activeRequest ->
                activeRequest.getTrackedLists().stream().mapToLong(TrackedList::getErrorJobCount).sum())
                .reduce(0L, Long::sum);
        return new ActiveRequestIO.Summary.Response(activeRequestList.size(), totalJobCount, completedJobCount, errorJobCount);
    }

    @Transactional(noRollbackFor = {SystemException.class,
            InterruptedException.class, ExecutionException.class, IOException.class})
    public ActiveRequestIO.GetJob.Response getJob(ActiveRequestIO.GetJob.Request requestDTO)
            throws InterruptedException, ExecutionException, IOException {
        Worker worker = workerService.heartbeat(requestDTO.getWorkerId());

        // Get First Available Request
        ActiveRequest activeRequest = activeRequestRepository.findFirstByOwner(userService.getUserOrThrow());
        if (activeRequest == null)
            throw new SystemException(23, "No Active Request Available", BAD_REQUEST);

        // Try to Fetch A Job
        // If Exception, the tracked list probably had an error check if complete
        Job job;
        try {
            job = trackedListService.getNextJob(activeRequest, worker, requestDTO.getMultiplier());
        } catch (Exception e) {
            if (checkIfActiveRequestComplete(activeRequest))
                delete(activeRequest.getId(), TrackingStatus.ERROR);
            throw e;
        }

        //  If Job is null, there were no jobs available
        if (job == null) {
            if (checkIfActiveRequestComplete(activeRequest))
                delete(activeRequest.getId(), TrackingStatus.ERROR);
            throw new SystemException(3242, "No Jobs Available", BAD_REQUEST);
        }

        return new ActiveRequestIO.GetJob.Response(
                activeRequest.getRequestType(),
                activeRequest.getRequestMetadataOverride(),
                activeRequest.getValueToMatchInBase64(),
                job.getOwner().getOwner().getId(),
                job.getOwner().getId(),
                job.getId(),
                job.getMultiplier(),
                job.getValues());
    }

    @SneakyThrows
    public void reportJob(ActiveRequestIO.ReportJob.Request requestDTO) {
        if (requestDTO.getTrackingStatus() != TrackingStatus.ERROR &&
                requestDTO.getTrackingStatus() != TrackingStatus.COMPLETE)
            throw new SystemException(342, "Reported status can only be either ERROR or COMPLETE", BAD_REQUEST);
        Worker worker = workerService.get(requestDTO.getWorkerId()); // "Get" or else self reporting causes concurrent mod exception

        ActiveRequest activeRequest = activeRequestRepository.findByIdAndOwner(
                requestDTO.getRequestId(), userService.getUserOrThrow()).orElseThrow(() ->
                new SystemException(131, "Active Request with id " + requestDTO.getRequestId() +
                        " not found", NOT_FOUND));
        // Add Results
        Map<String, String> results = activeRequest.getResultsOverride();
        if (!requestDTO.getResults().isEmpty()) {
            results.putAll(requestDTO.getResults());
            activeRequest.setResultsOverride(results);
            activeRequestRepository.save(activeRequest);
        }

        if (results.keySet().size() >= activeRequest.getTargetCount()) {
            delete(activeRequest.getId(), TrackingStatus.COMPLETE);
        } else {
            // Report Job to Tracked List
            trackedListService.reportJob(requestDTO.getJobId(), requestDTO.getListId(), activeRequest,
                    requestDTO.getTrackingStatus(), worker);
            // Check if complete
            if (checkIfActiveRequestComplete(activeRequest))
                delete(activeRequest.getId(), TrackingStatus.COMPLETE);
        }
    }

    private boolean checkIfActiveRequestComplete(ActiveRequest activeRequest) {
        return activeRequest.getTrackedLists().stream().allMatch(trackedList ->
                trackedList.getTrackingStatus() == TrackingStatus.COMPLETE ||
                        trackedList.getTrackingStatus() == TrackingStatus.ERROR);
    }

    @Scheduled(initialDelayString = "${application.job-settings.job-expiry-window-in-milliseconds}",
            fixedDelayString = "${application.job-settings.job-expiry-window-in-milliseconds}")
    public void performJobTimeout() {
        log.info("Running: Job Timeout Task");
        try (Stream<Job> expiredJobStream = jobService.getExpiredJobs()) {
            expiredJobStream.forEach(job -> {
                log.info("\t Job id {} needs to be timed-out", job.getId());
                Worker worker = job.getWorker();

                // Set Temporary Security Principal
                setTemporarySecurityPrincipal(worker.getOwner());

                ActiveRequestIO.ReportJob.Request removeJobRequest =
                        new ActiveRequestIO.ReportJob.Request(worker.getId(), job.getOwner().getOwner().getId(),
                                job.getOwner().getId(), job.getId(), TrackingStatus.ERROR, new HashMap<>());

                // Report Job As Error
                reportJob(removeJobRequest);
            });
        }
        log.info("Complete: Job Timeout Task");
    }

    @Scheduled(initialDelayString = "${application.worker-settings.worker-expiry-window-in-milliseconds}",
            fixedRateString = "${application.worker-settings.worker-expiry-window-in-milliseconds}")
    public void performWorkerTimeout() {
        log.info("Running: Worker Timeout Task");
        try (Stream<Worker> expiredWorkerStream = workerService.getWorkersToExpire()) {
            expiredWorkerStream.forEach(worker -> {
                log.info("\t Worker id {}, name {} needs to be expired", worker.getId(), worker.getName());

                // Set Temporary Security Principal
                setTemporarySecurityPrincipal(worker.getOwner());

                // Report Job As Error (if has Job)
                if (worker.getJobList() != null && !worker.getJobList().isEmpty()) {
                    worker.getJobList().forEach(job -> {
                        log.info("\t\t Job id {} needs to be reported-error", job.getId());
                        ActiveRequestIO.ReportJob.Request removeJobRequest =
                                new ActiveRequestIO.ReportJob.Request(worker.getId(), job.getOwner().getOwner().getId(),
                                        job.getOwner().getId(), job.getId(), TrackingStatus.ERROR, new HashMap<>());

                        // Report Job As Error
                        reportJob(removeJobRequest);
                    });
                }
                // Expire Worker
                workerService.expireWorker(worker);
                // Send Email
                //emailService.sendWorkerOfflineEmail(worker.getOwner(), worker);
            });
        }
        log.info("Complete: Worker Timeout Task");
    }

    private void setTemporarySecurityPrincipal(User user) {
        // Set Temporary Security Principal
        Collection<? extends GrantedAuthority> authorities = Arrays.stream(user.getAuthority().split(":"))
                .map(SimpleGrantedAuthority::new).collect(Collectors.toList());
        org.springframework.security.core.userdetails.User principal =
                new org.springframework.security.core.userdetails.User(user.getUsername(), "", authorities);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, "", authorities));
    }

}
