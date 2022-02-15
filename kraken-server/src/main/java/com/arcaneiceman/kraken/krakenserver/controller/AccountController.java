package com.arcaneiceman.kraken.krakenserver.controller;

import com.arcaneiceman.kraken.krakenserver.controller.io.AccountIO;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.AccountService;
import io.swagger.annotations.ApiParam;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.annotation.Secured;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("${application.context-path}")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @Validated
    @PostMapping(value = "/account/register")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiParam
    public void register(@Valid @RequestBody AccountIO.Register.Request requestDTO,
                         @RequestHeader(value = "User-Agent", required = false) String userAgent,
                         @RequestHeader(value = "Version") String apiVersion) {
        accountService.register(requestDTO, userAgent);
    }

    @Validated
    @PostMapping(value = "/account/resend-activation-email")
    @ResponseStatus(HttpStatus.OK)
    public void resendActivationEmail(@Valid @RequestBody AccountIO.Common.EmailRequest requestDTO,
                                      @RequestHeader(value = "Version") String apiVersion) {
        accountService.resendActivationEmail(requestDTO);
    }

    @Validated
    @PostMapping(value = "/account/activate")
    @ResponseStatus(HttpStatus.OK)
    public AccountIO.Common.TokenResponse activate(@Valid @RequestBody AccountIO.Activate.Request requestDTO,
                                                   @RequestHeader(value = "Version") String apiVersion) {
        return accountService.activate(requestDTO);
    }

    @Validated
    @PostMapping(value = "/account/authenticate")
    @ResponseStatus(HttpStatus.OK)
    public AccountIO.Common.TokenResponse authenticate(@Valid @RequestBody AccountIO.Authenticate.Request requestDTO,
                                                       @RequestHeader(value = "User-Agent", required = false) String userAgent,
                                                       @RequestHeader(value = "Version") String apiVersion) {
        return accountService.authenticate(requestDTO, userAgent);
    }

    @Validated
    @PostMapping(value = "/account/social-authenticate")
    @ResponseStatus(HttpStatus.OK)
    public AccountIO.Common.TokenResponse social(@Valid @RequestBody AccountIO.SocialAuthenticate.Request requestDTO,
                                                 @RequestHeader(value = "Version") String apiVersion) {
        return accountService.socialAuthenticate(requestDTO);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @PostMapping(value = "/account/refresh")
    @ResponseStatus(HttpStatus.OK)
    public AccountIO.Common.TokenResponse refresh(@RequestHeader(value = "Authorization") String bearerToken,
                                                  @RequestHeader(value = "Version") String apiVersion) {
        return accountService.refresh();
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @PostMapping(value = "/account/logout")
    @ResponseStatus(HttpStatus.OK)
    public void logout(@RequestHeader(value = "Version") String apiVersion,
                       @RequestHeader(value = "Authorization") String bearerToken,
                       HttpServletRequest httpServletRequest) {
        accountService.logout(httpServletRequest);
    }

    @Validated
    @PostMapping(value = "/account/request-new-password")
    @ResponseStatus(HttpStatus.OK)
    public void requestResetPassword(@Valid @RequestBody AccountIO.Common.EmailRequest requestDTO,
                                     @RequestHeader(value = "Version") String apiVersion) {
        accountService.requestNewPassword(requestDTO);
    }

    @Validated
    @Secured(AuthoritiesConstants.CONSUMER)
    @PostMapping(value = "/account/change-password")
    @ResponseStatus(HttpStatus.OK)
    public void changePassword(@Valid @RequestBody AccountIO.ChangePassword.Request requestDTO,
                               @RequestHeader(value = "Authorization") String bearerToken,
                               @RequestHeader(value = "Version") String apiVersion) {
        accountService.changePassword(requestDTO);
    }

}
