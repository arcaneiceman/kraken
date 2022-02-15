package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.domain.PasswordList;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.utils.PasswordListService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${application.context-path}")
public class PasswordListController {

    private PasswordListService passwordListService;

    public PasswordListController(PasswordListService passwordListService) {
        this.passwordListService = passwordListService;
    }

    @Validated
    @GetMapping("/password-list")
    @Secured(AuthoritiesConstants.CONSUMER)
    @ResponseStatus(HttpStatus.OK)
    Page<PasswordList> list(Pageable pageable,
                            @RequestHeader(value = "Authorization") String bearerToken,
                            @RequestHeader(value = "Version") String apiVersion) {
        return passwordListService.list(pageable);
    }
}
