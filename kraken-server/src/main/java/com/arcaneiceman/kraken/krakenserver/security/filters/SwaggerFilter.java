package com.arcaneiceman.kraken.krakenserver.security.filters;

import com.arcaneiceman.kraken.krakenserver.service.utils.SwaggerService;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class SwaggerFilter extends GenericFilterBean {

    private final SwaggerService swaggerService;

    public SwaggerFilter(SwaggerService swaggerService) {
        this.swaggerService = swaggerService;
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        String path = ((HttpServletRequest) request).getServletPath();
        if (path.endsWith(swaggerService.getSwaggerContextPath()))
            ((HttpServletResponse) response).sendRedirect("/swagger-ui.html");
        else
            filterChain.doFilter(request, response);
    }
}
