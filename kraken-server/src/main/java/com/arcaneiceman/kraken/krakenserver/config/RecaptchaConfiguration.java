package com.arcaneiceman.kraken.krakenserver.config;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Locale;

@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "application.recaptcha")
public class RecaptchaConfiguration {

    private Logger log = LoggerFactory.getLogger(RecaptchaConfiguration.class);

    @Getter
    private boolean isConfigured = false;

    @Getter
    @Value("${application.recaptcha.is-in-debug}")
    private Boolean isInDebug;

    @Getter
    @Value("${application.recaptcha.url}")
    private String recaptchaUrl;

    @Getter
    @Value("${application.recaptcha.secret}")
    private String recaptchaSecret;

    @Getter
    @Value("${application.recaptcha.retry-attempts}")
    private Integer retryAttempts;

    @Getter
    @Value("${application.recaptcha.retry-interval}")
    private Long retryInterval;

    @Getter
    private RetryTemplate retryTemplate;

    @Getter
    private RestTemplate restTemplate;

    public void generateClients() {
        try{
            new URL(recaptchaUrl);

            restTemplate = new RestTemplateBuilder().build();
            retryTemplate = new RetryTemplate();
            retryTemplate.setRetryPolicy(new SimpleRetryPolicy(getRetryAttempts()));
            ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
            backOffPolicy.setInitialInterval(getRetryInterval());
            retryTemplate.setBackOffPolicy(backOffPolicy);

            restTemplate.getForEntity(recaptchaUrl, String.class);

            isConfigured = true;
            log.info("Successfully configured Recaptcha Configuration");
        }
        catch (Exception e){
            log.error("Recaptcha Configuration was not configured properly : " + e.getMessage());
        }
    }

    @PostConstruct
    public void postConstruct() {
        // Generate Client(s)
        generateClients();
    }
}
