package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.config.Constants;
import io.jsonwebtoken.*;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Token Service
 * <p>
 * This class validates tokens and parses them from strings to retrieve claims
 */
@Component
public class TokenService {

    private final Logger log = LoggerFactory.getLogger(TokenService.class);

    @Value("${application.security.jwt-token-signing-key}")
    private String secretKey;

    @Getter
    @Value("${application.security.jwt-token-validity-in-milliseconds}")
    private long tokenValidityInMilliseconds;

    @PostConstruct
    public void verifyVariables() {
        if (secretKey == null)
            throw new RuntimeException("No Secret Key Defined!");
        if (tokenValidityInMilliseconds == 0)
            throw new RuntimeException("No Token Validity Period Defined");
    }

    public Claims getClaims(String token) {
        return Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody();
    }

    public String createToken(String username, String... authorities) {
        Map<String, Object> claims = new HashMap<>();

        // Summary Token Validity
        Date now = new Date();
        Date tokenValidity = new Date(now.getTime() + tokenValidityInMilliseconds);

        // Add Authority to claims
        claims.put(Constants.AUTHORITIES_KEY, String.join(":", Arrays.asList(authorities)));

        return Jwts.builder()
                .setClaims(claims)
                .setExpiration(tokenValidity)
                .setIssuedAt(now)
                .setSubject(username)
                .signWith(SignatureAlgorithm.HS512, secretKey)
                .compact();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(secretKey).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            log.info("Invalid JWT signature.");
        } catch (MalformedJwtException e) {
            log.info("Invalid JWT token.");
        } catch (ExpiredJwtException e) {
            log.info("Expired JWT token.");
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported JWT token.");
        } catch (IllegalArgumentException e) {
            log.info("JWT token compact of handler are invalid.");
        }
        return false;
    }
}
