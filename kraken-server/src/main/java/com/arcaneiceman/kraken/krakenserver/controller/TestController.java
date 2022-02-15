package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.service.ActiveRequestService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Profile("test")
@RestController
@RequestMapping("${application.context-path}")
public class TestController {

    private final ActiveRequestService activeRequestService;

    public TestController(ActiveRequestService activeRequestService) {
        this.activeRequestService = activeRequestService;
    }

    @Validated
    @PostMapping("/expire-workers")
    @ResponseStatus(HttpStatus.OK)
    public void expireWorker() {
        activeRequestService.performWorkerTimeout();
    }

    @Validated
    @PostMapping("/expire-jobs")
    @ResponseStatus(HttpStatus.OK)
    public void expireJob() {
        activeRequestService.performJobTimeout();
    }
}
