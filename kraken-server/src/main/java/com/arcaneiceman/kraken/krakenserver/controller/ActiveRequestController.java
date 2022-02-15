package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.controller.io.ActiveRequestIO;
import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.ActiveRequestService;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.annotations.ApiParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.io.IOException;
import java.util.concurrent.ExecutionException;

/**
 * Created by Wali on 4/1/2018.
 */
@RestController
@RequestMapping("${application.context-path}")
public class ActiveRequestController {

    private final ActiveRequestService activeRequestService;

    public ActiveRequestController(ActiveRequestService activeRequestService) {
        this.activeRequestService = activeRequestService;
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @PostMapping(value = "/active-request")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiParam(name = "ActiveRequestCreate")
    public ActiveRequest create(@Valid @RequestBody ActiveRequestIO.Create.Request requestDTO,
                                @RequestHeader(value = "Authorization") String bearerToken,
                                @RequestHeader(value = "Version") String apiVersion) {
        return activeRequestService.create(requestDTO);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @GetMapping(value = "/active-request")
    @ResponseStatus(HttpStatus.OK)
    public Page<ActiveRequest> list(Pageable pageable,
                                    @RequestHeader(value = "Authorization") String bearerToken,
                                    @RequestHeader(value = "Version") String apiVersion) {
        return activeRequestService.list(pageable);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @GetMapping(value = "/active-request/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ActiveRequest get(@PathVariable String id,
                             @RequestHeader(value = "Authorization") String bearerToken,
                             @RequestHeader(value = "Version") String apiVersion) {
        return activeRequestService.get(id);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @DeleteMapping(value = "/active-request/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id,
                       @RequestHeader(value = "Authorization") String bearerToken,
                       @RequestHeader(value = "Version") String apiVersion) throws JsonProcessingException {
        activeRequestService.delete(id, TrackingStatus.CANCELLED);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @GetMapping(value = "/active-request/summary")
    @ResponseStatus(HttpStatus.OK)
    public ActiveRequestIO.Summary.Response summary(@RequestHeader(value = "Authorization") String bearerToken,
                                                    @RequestHeader(value = "Version") String apiVersion) {
        return activeRequestService.summary();
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    @PostMapping(value = "/active-request/get-job")
    public ActiveRequestIO.GetJob.Response getJob(@Valid @RequestBody ActiveRequestIO.GetJob.Request requestDTO,
                                                  @RequestHeader(value = "Authorization") String bearerToken,
                                                  @RequestHeader(value = "Version") String apiVersion)
            throws InterruptedException, ExecutionException, IOException {
        return activeRequestService.getJob(requestDTO);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @PostMapping(value = "/active-request/report-job")
    @ResponseStatus(HttpStatus.OK)
    public void reportJob(@Valid @RequestBody ActiveRequestIO.ReportJob.Request requestDTO,
                          @RequestHeader(value = "Authorization") String bearerToken,
                          @RequestHeader(value = "Version") String apiVersion) {
        activeRequestService.reportJob(requestDTO);
    }


}
