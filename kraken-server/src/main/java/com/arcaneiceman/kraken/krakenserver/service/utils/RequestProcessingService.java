package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.util.ConsoleCommandUtil;
import com.arcaneiceman.kraken.krakenserver.util.HccapxKataiStruct;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import io.kaitai.struct.ByteBufferKaitaiStream;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.zalando.problem.Status.BAD_REQUEST;

@Service
public class RequestProcessingService {

    public RequestProcessingResult verifyActiveRequest(String requestType,
                                                       Map<String, String> requestMetadata,
                                                       String valueToMatchInBase64) {
        try {
            RequestProcessingResult result = new RequestProcessingResult(requestMetadata,
                    Base64.getDecoder().decode(valueToMatchInBase64), null, null, null);
            switch (requestType) {
                case "2500": // WPA/WPA2
                    verifyWPAWPA2(result);
                    break;
                case "0": // MD5
                    verifyMD5(result);
                    break;
                case "1000": // NTLM
                    verifyNTLM(result);
                    break;
                default:
                    throw new RuntimeException("Unknown Request Type");
            }
            result.setValueInBase64(Base64.getEncoder().encodeToString(result.getPackedValue()));
            return result;
        } catch (Exception e) {
            throw new SystemException(43, "Input and metadata error: " + e.getMessage(), BAD_REQUEST);
        }
    }

    private void verifyWPAWPA2(RequestProcessingResult result)
            throws IOException, ExecutionException, InterruptedException {
        // Attempt to convert file cap/pcap -> hccapx
        Path inputFile = Paths.get(System.getProperty("java.io.tmpdir"), UUID.randomUUID().toString());
        Path outputFile = Paths.get(System.getProperty("java.io.tmpdir"), UUID.randomUUID().toString());
        HccapxKataiStruct data;
        try {
            if (!Files.exists(inputFile))
                Files.createDirectories(inputFile.getParent());
            Files.write(inputFile, result.getUnpackedValue());

            Pattern extractNumberPattern = Pattern.compile("\\d+");
            Pattern handshakeCountPattern = Pattern.compile("Written [1-9]\\d* WPA Handshakes");

            // Run cap2hccapx. If successful, update valueToMatch with hccapx file bytes.
            String response = ConsoleCommandUtil.executeCommandInConsole(
                    1, TimeUnit.SECONDS, ConsoleCommandUtil.OutputStream.OUT,
                    "cap2hccapx", inputFile.toString(), outputFile.toString());
            if (response != null && response.startsWith("Networks detected")) {
                String[] tokens = response.split("\n");
                Matcher m = extractNumberPattern.matcher(tokens[0]);
                if (m.find())
                    result.getRequestMetadata().put("Networks Detected", m.group(0));
                m = extractNumberPattern.matcher(tokens[tokens.length - 1]);
                if (m.find())
                    result.getRequestMetadata().put("Handshakes Written", m.group(0));
                data = HccapxKataiStruct.fromFile(outputFile.toString());
            } else
                data = new HccapxKataiStruct(new ByteBufferKaitaiStream(result.getUnpackedValue()));
        } finally {
            // Delete temporary files
            Files.deleteIfExists(inputFile);
            Files.deleteIfExists(outputFile);
        }

        // Read data as hccapx (throws exception if failed)
        List<String> foundESSIDs = data.records().stream()
                .map(hccapxRecord -> new String(hccapxRecord.essid())).distinct().collect(Collectors.toList());
        result.getRequestMetadata().put("Found SSIDs", String.join(", ", foundESSIDs));

        // Filter Hccapx records based in metadata filter and mark their locations in the katai stream
        result.getRequestMetadata().putIfAbsent("Filter On", "");
        List<String> filterOn = Arrays.stream(result.getRequestMetadata().get("Filter On").split("[\\s\\n,|;:]+"))
                .filter(string -> !string.equals("")).map(String::trim).collect(Collectors.toList());
        List<Long> startPositionMarkers = new ArrayList<>();
        List<String> targetSSIDs = new ArrayList<>();
        for (int i = 0; i < data.records().size(); i++) {
            if (filterOn.isEmpty() || filterOn.contains(new String(data.records().get(i).essid()))) {
                if (!targetSSIDs.contains(new String(data.records().get(i).essid()))) {
                    targetSSIDs.add(new String(data.records().get(i).essid()));
                    startPositionMarkers.add(i * 393L);
                }
            }
        }

        // Check Targets and to Metadata
        if (targetSSIDs.isEmpty())
            throw new RuntimeException("0 targets matched criteria");
        result.getRequestMetadata().put("Target SSIDs", String.join(", ", targetSSIDs));

        // Read Katai stream at relevant locations and return
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        for (long startPositionMarker : startPositionMarkers) {
            data._io().seek(startPositionMarker);
            bos.write(data._io().readBytes(393));
        }

        result.setTargetCount(targetSSIDs.size());
        result.setPackedValue(bos.toByteArray());
    }

    private void verifyMD5(RequestProcessingResult result) {
        List<String> filteredValues = Arrays.stream(new String(result.getUnpackedValue()).split("[\\s\\n,|;:]+"))
                .filter(md5Value -> !Objects.equals(md5Value.toLowerCase(), "d41d8cd98f00b204e9800998ecf8427e"))
                .collect(Collectors.toList());
        if (filteredValues.isEmpty())
            throw new RuntimeException("0 targets matched criteria");
        result.setTargetCount(filteredValues.size());
        result.setPackedValue(String.join(" ", filteredValues).getBytes());
    }

    private void verifyNTLM(RequestProcessingResult result) {
        List<String> filteredValues = Arrays.stream(new String(result.getUnpackedValue()).split("[\\s\\n,|;:]+"))
                .filter(ntlmValue -> !Objects.equals(ntlmValue.toLowerCase(), "31d6cfe0d16ae931b73c59d7e0c089c0"))
                .collect(Collectors.toList());
        if (filteredValues.isEmpty())
            throw new RuntimeException("0 targets matched criteria");
        result.setTargetCount(filteredValues.size());
        result.setPackedValue(String.join(" ", filteredValues).getBytes());
    }

    @Data
    @AllArgsConstructor
    public static class RequestProcessingResult {
        // Inputs
        private Map<String, String> requestMetadata;
        private byte[] unpackedValue;

        // Outputs
        private Integer targetCount;
        private byte[] packedValue;

        // Final
        private String valueInBase64;
    }
}


