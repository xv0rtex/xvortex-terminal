package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.model.groq.GroqRequest;
import com.soriaruiz.portfolio.service.GroqService;
import com.soriaruiz.portfolio.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
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

        HttpSession session = servletRequest.getSession();
        @SuppressWarnings("unchecked")
        List<GroqRequest.Message> history = (List<GroqRequest.Message>) session.getAttribute("chatHistory");
        if (history == null) {
            history = new ArrayList<>();
        }

        List<GroqRequest.Message> finalHistory = history;

        return groqService.chat(message, finalHistory)
                .doOnNext(response -> {
                    finalHistory.add(new GroqRequest.Message("user", message));
                    finalHistory.add(new GroqRequest.Message("assistant", response));
                    // Keep the last 10 messages (5 pairs) to not exceed context length
                    if (finalHistory.size() > 10) {
                        finalHistory.subList(0, finalHistory.size() - 10).clear();
                    }
                    session.setAttribute("chatHistory", finalHistory);
                })
                .map(response -> Map.of("response", response));
    }
}
