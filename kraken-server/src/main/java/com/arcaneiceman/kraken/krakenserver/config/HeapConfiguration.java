package com.arcaneiceman.kraken.krakenserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

@Configuration
public class HeapConfiguration {

    private Logger log = LoggerFactory.getLogger(HeapConfiguration.class);

    public static String formatSize(long v) {
        if (v < 1024) return v + " B";
        int z = (63 - Long.numberOfLeadingZeros(v)) / 10;
        return String.format("%.1f %sB", (double) v / (1L << (z * 10)), " KMGTPE".charAt(z));
    }

    @PostConstruct
    public void printHeapValues() {
        log.info("Total Memory : {}", formatSize(Runtime.getRuntime().totalMemory()));
        log.info("Maximum Memory : {}", formatSize(Runtime.getRuntime().maxMemory()));
    }
}
