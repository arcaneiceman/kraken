package com.arcaneiceman.kraken.krakenserver.security.filters;

import com.arcaneiceman.kraken.krakenserver.service.utils.VersionService;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static com.arcaneiceman.kraken.krakenserver.config.Constants.VERSION_HEADER;

public class VersionFilter extends GenericFilterBean {

    private VersionService versionService;

    public VersionFilter(VersionService versionService) {
        this.versionService = versionService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        if (((HttpServletRequest) request).getRequestURI().contains("/api/"))
            if (versionService.isVersionEqual(httpServletRequest.getHeader(VERSION_HEADER)))
                filterChain.doFilter(request, response);
            else
                ((HttpServletResponse) response).sendError(HttpServletResponse.SC_PRECONDITION_FAILED,
                        VERSION_HEADER + " header does not match " + versionService.getApiVersion());
        else
            filterChain.doFilter(request, response);
    }
}
