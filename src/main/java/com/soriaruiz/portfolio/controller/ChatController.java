package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.service.GroqService;
import com.soriaruiz.portfolio.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GroqService groqService;
    private final LogService logService;

    public ChatController(GroqService groqService, LogService logService) {
        this.groqService = groqService;
        this.logService = logService;
    }

    @PostMapping
    public Mono<Map<String, String>> chat(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return Mono.just(Map.of("response", "Please enter a message."));
        }

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = servletRequest.getRemoteAddr();
        }
        String userAgent = servletRequest.getHeader("User-Agent");

        logService.logGroqRequest(ip, userAgent, message);

        return groqService.chat(message)
                .map(response -> Map.of("response", response));
    }
}
