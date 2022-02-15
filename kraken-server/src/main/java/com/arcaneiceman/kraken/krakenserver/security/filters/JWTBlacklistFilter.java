package com.arcaneiceman.kraken.krakenserver.security.filters;

import com.arcaneiceman.kraken.krakenserver.config.Constants;
import com.arcaneiceman.kraken.krakenserver.service.utils.TokenBlacklistService;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Security Filter : {@link JWTBlacklistFilter}
 * <p>
 * Filter Order : Second
 * <p>
 * Checks if the  blacklist cache contains the token (token's digest to be more specific)
 * <p>
 * If it exists:
 * Throw {@link HttpServletResponse}.SC_UNAUTHORIZED error
 * Else:
 * Allow pass through
 */
public class JWTBlacklistFilter extends GenericFilterBean {

    private TokenBlacklistService tokenBlacklistService;

    public JWTBlacklistFilter(TokenBlacklistService tokenBlacklistService) {
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        String blacklist_digest = (String) servletRequest.getAttribute(Constants.BLACKLIST_DIGEST_KEY);
        if (blacklist_digest != null && tokenBlacklistService.isInBlacklist(blacklist_digest))
            ((HttpServletResponse) servletResponse).sendError(HttpServletResponse.SC_UNAUTHORIZED, "The token is blocked");
        else
            filterChain.doFilter(servletRequest, servletResponse);
    }

}
