package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.service.ServicesService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/services/chat")
public class ServicesController {

    private final ServicesService servicesService;

    public ServicesController(ServicesService servicesService) {
        this.servicesService = servicesService;
    }

    @PostMapping
    public Mono<Map<String, String>> servicesChat(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return Mono.just(Map.of("response", "Por favor ingresa un mensaje."));
        }

        HttpSession session = servletRequest.getSession(true);
        String sessionId = session.getId();
        String ip = servletRequest.getRemoteAddr();

        // Process command specifically for services
        String serviceResponse = servicesService.processCommand(sessionId, message, ip);
        
        if (serviceResponse != null) {
            return Mono.just(Map.of("response", serviceResponse));
        }

        // If command not recognized by service logic
        return Mono.just(Map.of("response", "Command not recognized in Services mode. Type 'ls services/' to start over."));
    }
}
