package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.domain.TrackedCrunchList;
import com.arcaneiceman.kraken.krakenserver.util.ConsoleCommandUtil;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Service
@Transactional
public class CrunchListService {

    @Value("${application.crunch-list-settings.min-job-size}")
    private String minJobSize;

    @PostConstruct
    public void checkVariables() {
        if (minJobSize == null || minJobSize.isEmpty() || Long.parseLong(minJobSize) <= 0)
            throw new RuntimeException("Crunch List Service - Job Size Not Specified");
    }

    public Long validateCrunchAndReturnTotalJobs(Integer min, Integer max, String characters,
                                                 String start, String pattern)
            throws InterruptedException, ExecutionException, IOException {
        List<String> commands = generateCommands(min, max, characters, start, pattern);
        // Validate Crunch List
        String response = ConsoleCommandUtil.executeCommandInConsole(500, TimeUnit.MILLISECONDS,
                ConsoleCommandUtil.OutputStream.ERROR, commands.toArray(new String[0]));
        if (response == null || response.isEmpty())
            throw new IOException("Error running " + String.join(" ", commands) + ": " + response);
        Pattern p = Pattern.compile("Crunch will now generate the following number of lines: (\\d+)");
        Matcher m = p.matcher(response);
        if (!m.find())
            throw new SystemException(1231, "Error running " + String.join(" ", commands), Status.BAD_REQUEST);
        // Ceil of [Number of lines / minJobSize]
        try {
            return new Double(Math.ceil(Double.parseDouble(m.group(1)) / Double.parseDouble(minJobSize))).longValue();
        } catch (Exception e) {
            throw new SystemException(3242, "Number of jobs created by this would exceed " + Long.MAX_VALUE, Status.BAD_REQUEST);
        }
    }

    public ArrayList<String> getValuesForStartString(TrackedCrunchList trackedCrunchList, String start, Long multiplier)
            throws IOException, ExecutionException, InterruptedException {
        Integer minLength = Math.max(start.length(), trackedCrunchList.getMin());
        List<String> commands = generateCommands(minLength, trackedCrunchList.getMax(),
                trackedCrunchList.getCharacters(), start, trackedCrunchList.getPattern());
        commands.add("-c");
        commands.add(Long.toString(Long.parseLong(minJobSize) * multiplier));
        String response = ConsoleCommandUtil.executeCommandInConsole(0, TimeUnit.SECONDS,
                ConsoleCommandUtil.OutputStream.OUT, commands.toArray(new String[0]));
        if (response == null || response.isEmpty())
            throw new IOException("Could not run " + String.join(" ", commands));
        return new ArrayList<>(Arrays.asList(response.split("\n")));
    }

    public double getMinJobSize() {
        return Double.parseDouble(minJobSize);
    }

    private List<String> generateCommands(Integer min, Integer max, String characters,
                                          String start, String pattern) {
        List<String> commands = new ArrayList<>();
        commands.add("crunch");
        commands.add(min.toString());
        commands.add(max.toString());
        commands.add(characters);
        if (!(start == null || start.isEmpty())) {
            commands.add("-s");
            commands.add(start);
        }
        if (!(pattern == null || pattern.isEmpty())) {
            commands.add("-t");
            commands.add(pattern);
        }
        return commands;
    }

}
