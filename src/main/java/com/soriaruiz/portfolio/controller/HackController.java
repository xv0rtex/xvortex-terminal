package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.model.HackRanking;
import com.soriaruiz.portfolio.model.groq.GroqRequest;
import com.soriaruiz.portfolio.repository.HackRankingRepository;
import com.soriaruiz.portfolio.service.GroqService;
import com.soriaruiz.portfolio.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hack")
public class HackController {

    private final GroqService groqService;
    private final LogService logService;
    private final HackRankingRepository hackRankingRepository;

    public HackController(GroqService groqService, LogService logService, HackRankingRepository hackRankingRepository) {
        this.groqService = groqService;
        this.logService = logService;
        this.hackRankingRepository = hackRankingRepository;
    }

    @PostMapping("/chat")
    public Mono<Map<String, String>> hackChat(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return Mono.just(Map.of("response", "Please enter a message."));
        }

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = servletRequest.getRemoteAddr();
        }
        String userAgent = servletRequest.getHeader("User-Agent");

        logService.logGroqRequest(ip, userAgent, "[HACK] " + message);

        HttpSession session = servletRequest.getSession();
        @SuppressWarnings("unchecked")
        List<GroqRequest.Message> history = (List<GroqRequest.Message>) session.getAttribute("hackChatHistory");
        if (history == null) {
            history = new ArrayList<>();
        }

        List<GroqRequest.Message> finalHistory = history;

        return groqService.hackChat(message, finalHistory)
                .doOnNext(response -> {
                    finalHistory.add(new GroqRequest.Message("user", message));
                    finalHistory.add(new GroqRequest.Message("assistant", response));
                    // Keep the last 10 messages (5 pairs) to not exceed context length
                    if (finalHistory.size() > 10) {
                        finalHistory.subList(0, finalHistory.size() - 10).clear();
                    }
                    session.setAttribute("hackChatHistory", finalHistory);
                })
                .map(response -> Map.of("response", response));
    }

    @PostMapping("/ranking")
    public Mono<HackRanking> submitRanking(@RequestBody Map<String, Object> payload) {
        String nickname = (String) payload.get("nickname");
        Number timeMsObj = (Number) payload.get("timeMs");
        if (nickname == null || timeMsObj == null) {
            return Mono.error(new IllegalArgumentException("Invalid payload"));
        }
        
        HackRanking ranking = new HackRanking(nickname, timeMsObj.longValue());
        return Mono.just(hackRankingRepository.save(ranking));
    }

    @GetMapping("/ranking")
    public Mono<List<HackRanking>> getRankings() {
        return Mono.just(hackRankingRepository.findTop5ByOrderByTimeMsAsc());
    }
}

