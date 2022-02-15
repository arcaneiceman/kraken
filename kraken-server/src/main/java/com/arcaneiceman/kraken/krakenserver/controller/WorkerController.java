package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.controller.io.WorkerIO;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.WorkerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${application.context-path}")
public class WorkerController {

    private WorkerService workerService;

    public WorkerController(WorkerService workerService) {
        this.workerService = workerService;
    }

    @Validated
    @PostMapping(value = "/worker")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.CREATED)
    public Worker create(@RequestBody WorkerIO.Create.Request requestDTO,
                         @RequestHeader(value = "Authorization") String bearerToken,
                         @RequestHeader(value = "Version") String apiVersion) {
        return workerService.create(requestDTO);
    }

    @Validated
    @GetMapping(value = "/worker")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    public Page<Worker> list(Pageable pageable,
                             @RequestHeader(value = "Authorization") String bearerToken,
                             @RequestHeader(value = "Version") String apiVersion) {
        return workerService.list(pageable);
    }

    @Validated
    @GetMapping(value = "/worker/{id}")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Worker> get(@PathVariable String id,
                                      @RequestHeader(value = "Authorization") String bearerToken,
                                      @RequestHeader(value = "Version") String apiVersion) {
        return ResponseEntity.ok(workerService.get(id));
    }

    @Validated
    @DeleteMapping(value = "/worker/{id}")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id,
                       @RequestHeader(value = "Authorization") String bearerToken,
                       @RequestHeader(value = "Version") String apiVersion) {
        workerService.delete(id);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @GetMapping(value = "/worker/summary")
    @ResponseStatus(HttpStatus.OK)
    public WorkerIO.Summary.Response summary(@RequestHeader(value = "Authorization") String bearerToken,
                                             @RequestHeader(value = "Version") String apiVersion) {
        return workerService.summary();
    }

    @Deprecated
    @Validated
    @PostMapping(value = "/worker/{id}/heartbeat")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    public void heartbeat(@PathVariable String id,
                          @RequestHeader(value = "Authorization") String bearerToken,
                          @RequestHeader(value = "Version") String apiVersion) {
    }

}
