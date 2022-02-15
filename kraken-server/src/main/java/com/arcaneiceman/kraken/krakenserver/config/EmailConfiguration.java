package com.arcaneiceman.kraken.krakenserver.config;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

import javax.annotation.PostConstruct;
import javax.mail.MessagingException;
import java.util.Map;
import java.util.Properties;

/**
 * Created by Wali on 08/03/18.
 */
@Configuration
public class EmailConfiguration {

    @Getter
    private final Logger log = LoggerFactory.getLogger(EmailConfiguration.class);

    @Getter
    private JavaMailSenderImpl client;

    @Getter
    private boolean isConfigured = false;

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private Integer port;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Getter
    @Value("${application.mail.is-in-debug}")
    public Boolean isInDebug;

    @Getter
    @Value("${application.mail.retry-attempts}")
    private Integer retryAttempts;

    @Getter
    @Value("${application.mail.retry-interval}")
    private Long retryInterval;

    @Getter
    private RetryTemplate retryTemplate;

    @Bean
    public JavaMailSender getJavaMailSender() {
        client = new JavaMailSenderImpl();
        client.setHost(host);
        client.setPort(port);

        Properties props = client.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        return client;
    }

    public void generateClients() {
        try{
            // Create Retry Template
            retryTemplate = new RetryTemplate();
            retryTemplate.setRetryPolicy(new SimpleRetryPolicy(getRetryAttempts()));
            ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
            backOffPolicy.setInitialInterval(getRetryInterval());
            retryTemplate.setBackOffPolicy(backOffPolicy);

            // Create Mail Client
            getJavaMailSender();

            // Test Connection
            client.testConnection();

            log.info("Successfully configured Email Configuration");
            isConfigured = true;
        }
        catch (Exception e){
            log.error("Email Configuration was not configured properly : " + e.getMessage());
        }
    }



    @PostConstruct
    public void postConstruct() {
        // Check for Required Fields
        if (getRetryAttempts() == null)
            throw new IllegalStateException("Email Configuration : number of retry attempts not defined!");
        if (getRetryInterval() == null)
            throw new IllegalStateException("Email Configuration : retry interval not defined ");

        // Generate Client(s)
        generateClients();
    }

}
