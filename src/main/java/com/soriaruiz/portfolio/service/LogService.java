package com.soriaruiz.portfolio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class LogService {

    @Value("${app.logs.directory:logs}")
    private String logsDirectory;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Path getLogPath(String filename) {
        Path dir = Paths.get(logsDirectory);
        if (!Files.exists(dir)) {
            try {
                Files.createDirectories(dir);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return dir.resolve(filename);
    }

    private void appendToFile(String filename, String content) {
        try {
            Path path = getLogPath(filename);
            String logEntry = String.format("[%s] %s%n", LocalDateTime.now().format(DATE_FORMATTER), content);
            Files.writeString(path, logEntry, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            System.err.println("Error writing to log file " + filename + ": " + e.getMessage());
        }
    }

    public void logVisit(String ip, String userAgent, String path) {
        String content = String.format("IP: %s | UA: %s | Path: %s", ip, userAgent, path);
        appendToFile("visitors.log", content);
    }

    public void logGroqRequest(String ip, String userAgent, String request) {
        String content = String.format("IP: %s | UA: %s | Request: %s", ip, userAgent, request);
        appendToFile("groq_requests.log", content);
    }
}
