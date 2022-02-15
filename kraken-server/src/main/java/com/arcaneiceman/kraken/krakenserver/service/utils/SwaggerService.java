package com.arcaneiceman.kraken.krakenserver.service.utils;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class SwaggerService {

    @Getter
    @Value("${application.swagger.context-path}")
    private String swaggerContextPath;

    @PostConstruct
    public void checkVariable() {
        if (swaggerContextPath == null || swaggerContextPath.isEmpty())
            throw new IllegalStateException("Swagger Service : Swagger Documentation Context Path Not Found!");
    }
}
