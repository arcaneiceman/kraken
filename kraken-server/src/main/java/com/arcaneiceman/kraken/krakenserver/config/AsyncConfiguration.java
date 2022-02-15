package com.arcaneiceman.kraken.krakenserver.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@EnableScheduling
@PropertySource("application.yaml")
public class AsyncConfiguration implements AsyncConfigurer {

    @Value("${application.async.core-pool-size}")
    private int corePoolSize;

    @Value("${application.async.max-pool-size}")
    private int maxPoolSize;

    @Value("${application.async.queue-capacity}")
    private int queueCapacity;

    @Value("${application.async.thread-name}")
    private String threadName;

    @Override
    public Executor getAsyncExecutor() {
        corePoolSize = corePoolSize == 0 ? 5 : corePoolSize;
        maxPoolSize = maxPoolSize == 0 ? 5 : maxPoolSize;
        queueCapacity = queueCapacity == 0 ? 100 : queueCapacity;
        threadName = threadName == null ? "Async Executor Thread" : threadName;
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix(threadName);
        executor.initialize();
        return executor;
    }

}
