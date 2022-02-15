package com.arcaneiceman.kraken.krakenserver.util;

import com.amazonaws.util.IOUtils;

import java.io.IOException;
import java.util.concurrent.*;

public class ConsoleCommandUtil {

    public static String executeCommandInConsole(long timeout,
                                                 TimeUnit timeUnit,
                                                 OutputStream outputStream,
                                                 String... commands) throws IOException, InterruptedException, ExecutionException {
        // Create Two Spawned Threads for Handling output and error
        ExecutorService newFixedThreadPool = Executors.newFixedThreadPool(2);

        ProcessBuilder pb = new ProcessBuilder(commands);
        Process process = pb.start();
        Future<String> output = newFixedThreadPool.submit(() -> IOUtils.toString(process.getInputStream()));
        Future<String> error = newFixedThreadPool.submit(() -> IOUtils.toString(process.getErrorStream()));

        newFixedThreadPool.shutdown();

        if (timeout != 0 && timeUnit != null)
            if (!process.waitFor(timeout, timeUnit))
                process.destroy();
            else
                process.waitFor();

        switch (outputStream) {
            case ERROR:
                return error.get();
            case OUT:
                return output.get();
            default:
                return null;
        }
    }

    public enum OutputStream {
        ERROR, OUT
    }
}
