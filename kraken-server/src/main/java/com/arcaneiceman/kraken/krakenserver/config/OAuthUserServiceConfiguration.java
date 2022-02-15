package com.arcaneiceman.kraken.krakenserver.config;

import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.util.Map;

@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "application.oauth-user-service")
public class OAuthUserServiceConfiguration {

    @Getter
    private Logger log = LoggerFactory.getLogger(RecaptchaConfiguration.class);

    @Getter
    @Value("${application.oauth-user-service.is-in-debug}")
    private Boolean isInDebug;

    @Getter
    @Value("${application.oauth-user-service.retry-attempts}")
    private Integer retryAttempts;

    @Getter
    @Value("${application.oauth-user-service.retry-interval}")
    private Long retryInterval;

    @Getter
    @Setter
    private Map<String, String> providers;

    @Getter
    private RetryTemplate retryTemplate;

    @Getter
    private RestTemplate restTemplate;

    public void generateClients() {
        restTemplate = new RestTemplateBuilder().build();
        retryTemplate = new RetryTemplate();
        retryTemplate.setRetryPolicy(new SimpleRetryPolicy(getRetryAttempts()));
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(getRetryInterval());
        retryTemplate.setBackOffPolicy(backOffPolicy);
    }

    @PostConstruct
    public void postConstruct() {
        // Generate Client(s)
        generateClients();

        // TODO: Test Client
//        providers.forEach( (provider, urlAndFields) -> {
//            restTemplate.getFo(url);
//        });

        log.info("Successfully configured Oauth User Service Configuration");
    }
}
