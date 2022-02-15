package com.arcaneiceman.kraken.krakenserver.service.utils;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Objects;

@Service
public class VersionService {

    @Getter
    @Value("${application.api-version}")
    private String apiVersion;

    @PostConstruct
    public void verifyVariables() {
        if (apiVersion == null || apiVersion.isEmpty())
            throw new IllegalStateException("No Api Version specified");
    }

    public boolean isVersionEqual(String fromRequest) {
        return Objects.equals(apiVersion, fromRequest);
    }
}
