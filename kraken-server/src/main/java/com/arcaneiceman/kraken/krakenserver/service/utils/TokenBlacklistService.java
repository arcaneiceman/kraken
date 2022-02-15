package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.domain.BlacklistToken;
import com.arcaneiceman.kraken.krakenserver.repository.TokenBlacklistRepository;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Date;
import java.util.List;

/**
 * Created by wali on 26/09/17.
 * <p>
 * Token Blacklist Cache temporarily holds blacklisted token digest.
 * <p>
 * All tokens expire after being added to cache in their validity period
 * <p>
 * If validity period = t and token was created at t1 then token expires in t1 + t.
 * <p>
 * Thus, if the token is blacklisted as soon as it is created, it will stay in cache as long as it is valid.
 */
@Service
public class TokenBlacklistService {

    private Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);

    @Getter
    @Value("${application.security.jwt-token-validity-in-milliseconds}")
    private long tokenValidityInMilliseconds;

    private TokenBlacklistRepository tokenBlacklistRepository;

    public TokenBlacklistService(TokenBlacklistRepository tokenBlacklistRepository) {
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    @PostConstruct
    public void verifyVariables() {
        if (tokenValidityInMilliseconds == 0)
            throw new IllegalStateException("No Token Validity Period Defined");
    }

    public void addToBlackList(String tokenDigest) {
        tokenBlacklistRepository.save(new BlacklistToken(tokenDigest, new Date().getTime() + tokenValidityInMilliseconds));
    }

    public boolean isInBlacklist(String tokenDigest) {
        return tokenBlacklistRepository.findByTokenDigest(tokenDigest) != null;
    }

    @Scheduled(initialDelay = 60000L, fixedDelay = 3600000L)
    public void cleanupTokens() {
        log.info("Running: Token Cleanup Task");
        List<BlacklistToken> tokensToClean = tokenBlacklistRepository.findByCleanUpTimeBefore(new Date().getTime());
        tokensToClean.forEach(blacklistToken -> tokenBlacklistRepository.delete(blacklistToken));
        log.info("Complete: Token Cleanup Task");
    }
}
