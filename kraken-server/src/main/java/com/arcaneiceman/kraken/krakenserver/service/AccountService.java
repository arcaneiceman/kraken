package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.controller.io.AccountIO;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.service.utils.*;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import lombok.SneakyThrows;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.util.Objects;

import static com.arcaneiceman.kraken.krakenserver.config.Constants.BLACKLIST_DIGEST_KEY;
import static org.zalando.problem.Status.BAD_REQUEST;

@Service
@Transactional
public class AccountService {

    private final Logger log = LoggerFactory.getLogger(AccountService.class);
    private final OAuthUserService oAuthUserService;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserService userService;
    private final EmailService emailService;
    private final RecaptchaService recaptchaService;

    public AccountService(OAuthUserService oAuthUserService,
                          AuthenticationManager authenticationManager,
                          TokenService tokenService,
                          TokenBlacklistService tokenBlacklistService,
                          UserService userService,
                          EmailService emailService,
                          RecaptchaService recaptchaService) {
        this.oAuthUserService = oAuthUserService;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.userService = userService;
        this.emailService = emailService;
        this.recaptchaService = recaptchaService;
    }

    @SneakyThrows
    public void register(AccountIO.Register.Request requestDTO, String userAgent) {
        if (!Objects.equals(requestDTO.getPassword(), requestDTO.getConfirmPassword()))
            throw new SystemException(232, "Password and confirmation does not match", BAD_REQUEST);
        if (userService.getUserExistsByEmail(requestDTO.getEmail()))
            throw new SystemException(365, "Account with this email already exists", BAD_REQUEST);
        if (!userAgent.contains("Electron"))
            recaptchaService.verifyRecaptcha(requestDTO.getRecaptchaResponse());
        User user = userService.createUser(requestDTO.getEmail(), requestDTO.getName(), requestDTO.getPassword(),
                AuthoritiesConstants.CONSUMER, false, RandomStringUtils.randomAlphanumeric(10));
        emailService.sendWelcomeEmail(user);
    }

    @SneakyThrows
    public void resendActivationEmail(AccountIO.Common.EmailRequest requestDTO) {
        User user = userService.getUserByEmail(requestDTO.getEmail());
        if (user == null)
            throw new SystemException(2342, "No Account with this email exists", BAD_REQUEST);
        emailService.sendWelcomeEmail(user);
    }

    public AccountIO.Common.TokenResponse activate(AccountIO.Activate.Request requestDTO) {
        User user = userService.activateUser(requestDTO.getEmail(), requestDTO.getActivationKey());
        String jwt = tokenService.createToken(user.getUsername(), user.getAuthority());
        return new AccountIO.Common.TokenResponse(jwt);
    }

    public AccountIO.Common.TokenResponse authenticate(AccountIO.Authenticate.Request requestDTO, String userAgent) {
        authenticateAndSet(requestDTO.getEmail(), requestDTO.getPassword());
        if (!userAgent.contains("Electron"))
            recaptchaService.verifyRecaptcha(requestDTO.getRecaptchaResponse());
        User user = userService.getUserOrThrow();
        if (!user.getIsActive())
            throw new SystemException(3234, "User not active!", BAD_REQUEST);
        String jwt = tokenService.createToken(user.getUsername(), user.getAuthority());
        log.info("Authenticating {}", requestDTO.getEmail());
        return new AccountIO.Common.TokenResponse(jwt);
    }

    @SneakyThrows
    public AccountIO.Common.TokenResponse socialAuthenticate(AccountIO.SocialAuthenticate.Request requestDTO) {
        User user = oAuthUserService.findUser(requestDTO.getProvider(), requestDTO.getAccessToken());
        if (!userService.getUserExistsByEmail(user.getEmail())) {
            user = userService.createUser(user.getEmail(), user.getName(), null, AuthoritiesConstants.CONSUMER, true, null);
            emailService.sendWelcomeEmail(user);
        }
        String jwt = tokenService.createToken(user.getUsername(), user.getAuthority());
        log.info("Authenticating {}", user.getEmail());
        return new AccountIO.Common.TokenResponse(jwt);
    }

    public AccountIO.Common.TokenResponse refresh() {
        User user = userService.getUserOrThrow();
        String jwt = tokenService.createToken(user.getUsername(), user.getAuthority());
        return new AccountIO.Common.TokenResponse(jwt);
    }

    public void logout(HttpServletRequest httpServletRequest) {
        String tokenDigest = (String) httpServletRequest.getAttribute(BLACKLIST_DIGEST_KEY);
        tokenBlacklistService.addToBlackList(tokenDigest);
    }

    public void requestNewPassword(AccountIO.Common.EmailRequest requestDTO) {
        String randomPassword = RandomStringUtils.randomAlphanumeric(10);
        User user = userService.requestPasswordReset(requestDTO.getEmail(), randomPassword);
        emailService.sendNewPasswordEmail(user, randomPassword);
    }

    public void changePassword(AccountIO.ChangePassword.Request requestDTO) {
        User user = userService.getUserOrThrow();
        try {
            authenticateAndSet(user.getUsername(), requestDTO.getOldPassword());
        } catch (Exception ignored) {
            throw new SystemException(94, "Old password is not correct", BAD_REQUEST);
        }
        if (!Objects.equals(requestDTO.getNewPassword(), requestDTO.getNewConfirmPassword()))
            throw new SystemException(232, "Password and confirmation does not match", BAD_REQUEST);
        userService.changePassword(requestDTO.getOldPassword(), requestDTO.getNewPassword());
        emailService.sendChangedPasswordEmail(user);
    }

    private void authenticateAndSet(String username, String password) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(username, password);
        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

}