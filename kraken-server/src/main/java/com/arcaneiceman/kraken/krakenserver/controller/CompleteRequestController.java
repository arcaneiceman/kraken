package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.controller.io.CompleteRequestIO;
import com.arcaneiceman.kraken.krakenserver.domain.CompleteRequest;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.CompleteRequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("${application.context-path}")
public class CompleteRequestController {

    private CompleteRequestService completeRequestService;

    public CompleteRequestController(CompleteRequestService completeRequestService) {
        this.completeRequestService = completeRequestService;
    }

    @Validated
    @GetMapping("/complete-request")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    public Page<CompleteRequest> list(Pageable pageable,
                                      @RequestHeader(value = "Authorization") String bearerToken,
                                      @RequestHeader(value = "Version") String apiVersion) {
        return completeRequestService.list(pageable);
    }

    @Validated
    @GetMapping(value = "/complete-request/{id}")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    public CompleteRequest get(@Valid @PathVariable String id,
                               @RequestHeader(value = "Authorization") String bearerToken,
                               @RequestHeader(value = "Version") String apiVersion) {
        return completeRequestService.get(id);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @GetMapping(value = "/complete-request/summary")
    @ResponseStatus(HttpStatus.OK)
    public CompleteRequestIO.Summary.Response summary(@RequestHeader(value = "Authorization") String bearerToken,
                                                      @RequestHeader(value = "Version") String apiVersion) {
        return completeRequestService.summary();
    }

    @Validated
    @DeleteMapping(value = "/complete-request/{id}")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Valid @PathVariable String id,
                       @RequestHeader(value = "Authorization") String bearerToken,
                       @RequestHeader(value = "Version") String apiVersion) {
        completeRequestService.delete(id);
    }
}
