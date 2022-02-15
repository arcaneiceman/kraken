package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.controller.io.WorkerIO;
import com.arcaneiceman.kraken.krakenserver.domain.Job;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.WorkerStatus;
import com.arcaneiceman.kraken.krakenserver.repository.WorkerRepository;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.Date;
import java.util.List;
import java.util.stream.Stream;

import static org.zalando.problem.Status.BAD_REQUEST;
import static org.zalando.problem.Status.NOT_FOUND;

@Service
@Transactional
public class WorkerService {

    private WorkerRepository workerRepository;
    private UserService userService;

    @Value("${application.worker-settings.worker-expiry-window-in-milliseconds}")
    private String workerExpiryWindow;

    @Value("${application.worker-settings.worker-expiry-window-multiplier}")
    private String workerExpiryWindowMultiplier;

    public WorkerService(WorkerRepository workerRepository,
                         UserService userService) {
        this.workerRepository = workerRepository;
        this.userService = userService;
    }

    @PostConstruct
    public void checkVariables() {
        if (workerExpiryWindow == null || workerExpiryWindow.isEmpty())
            throw new RuntimeException("Worker Service - Worker Expiry Window Not Specified");
        if (workerExpiryWindowMultiplier == null || workerExpiryWindowMultiplier.isEmpty())
            throw new IllegalStateException("Worker Service - Worker Expiry Window Multiplier Not Specified");
    }

    public Worker create(WorkerIO.Create.Request requestDTO) {
        return workerRepository.save(new Worker(null, requestDTO.getWorkerName(), requestDTO.getWorkerType(),
                requestDTO.getPlatform(), 0L, 0L, 0L,
                WorkerStatus.ONLINE, new Date(), null, userService.getUserOrThrow()));
    }

    public Worker get(String id) {
        return workerRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(231, "Worker with id " + id + " not found", NOT_FOUND));
    }

    public Page<Worker> list(Pageable pageable) {
        return workerRepository.findByOwner(userService.getUserOrThrow(), pageable);
    }

    public void delete(String id) {
        Worker worker = workerRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(231, "Worker with id " + id + " not found", NOT_FOUND));
        if (worker.getJobList() != null && !worker.getJobList().isEmpty())
            throw new SystemException(232, "Worker " + worker.getName() + " is currently associated with jobs", BAD_REQUEST);
        workerRepository.delete(worker);
    }

    public WorkerIO.Summary.Response summary() {
        List<Worker> workerList = workerRepository.findByOwner(userService.getUserOrThrow());
        int totalOnlineWorkers = workerList.stream().map(worker -> worker.getStatus() == WorkerStatus.ONLINE ? 1 : 0)
                .reduce(0, Integer::sum);
        int totalOfflineWorkers = workerList.stream().map(worker -> worker.getStatus() == WorkerStatus.OFFLINE ? 1 : 0)
                .reduce(0, Integer::sum);
        long jobsInQueue = workerList.stream()
                .map(worker -> worker.getJobList().stream()
                        .map(Job::getMultiplier)
                        .reduce(0L, Long::sum))
                .reduce(0L, Long::sum);
        return new WorkerIO.Summary.Response(workerList.size(), totalOnlineWorkers, totalOfflineWorkers, jobsInQueue);
    }

    public Worker heartbeat(String id) {
        Worker worker = get(id);
        worker.setStatus(WorkerStatus.ONLINE);
        worker.setLastCheckIn(new Date());
        return workerRepository.save(worker);
    }

    public void expireWorker(Worker worker) {
        worker.setStatus(WorkerStatus.OFFLINE);
        workerRepository.save(worker);
    }

    // lastCheckIn < now() - ( workerExpiryWindow * window multiplier)
    public Stream<Worker> getWorkersToExpire() {
        return workerRepository.getByStatusAndLastCheckInBefore(WorkerStatus.ONLINE,
                new Date(new Date().getTime() - (Long.parseLong(workerExpiryWindow) * Long.parseLong(workerExpiryWindowMultiplier))));
    }
}
