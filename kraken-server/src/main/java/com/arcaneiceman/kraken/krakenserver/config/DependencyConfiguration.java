package com.arcaneiceman.kraken.krakenserver.config;

import com.arcaneiceman.kraken.krakenserver.util.ConsoleCommandUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Configuration
public class DependencyConfiguration {

    private static Logger log = LoggerFactory.getLogger(DependencyConfiguration.class);

    @Autowired
    public DependencyConfiguration() throws IOException, InterruptedException, ExecutionException {
        String testCap2Hccapx = ConsoleCommandUtil.executeCommandInConsole(
                1, TimeUnit.SECONDS, ConsoleCommandUtil.OutputStream.ERROR, "cap2hccapx");
        if (testCap2Hccapx != null && testCap2Hccapx.contains("usage"))
            log.info("Cap2Hccapx Found");
        else
            throw new RuntimeException("Cap2Hccapx was not found on this machine!");
        String testCrunch = ConsoleCommandUtil.executeCommandInConsole(
                1, TimeUnit.SECONDS, ConsoleCommandUtil.OutputStream.ERROR, "crunch");
        if (testCrunch != null && testCrunch.contains("Crunch"))
            log.info("Crunch Found");
        else
            throw new RuntimeException("Crunch was not found on this machine!");
    }


}
