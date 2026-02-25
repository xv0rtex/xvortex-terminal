package com.soriaruiz.portfolio.service;

import com.soriaruiz.portfolio.model.groq.GroqRequest;
import com.soriaruiz.portfolio.model.groq.GroqResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    @Value("${groq.system.prompt}")
    private String systemPrompt;

    private final WebClient webClient;

    public GroqService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://api.groq.com/openai/v1").build();
    }

    public Mono<String> chat(String userMessage) {
        String safeApiKey = apiKey.trim();
        GroqRequest request = GroqRequest.builder()
                .model(model)
                .messages(List.of(
                        GroqRequest.Message.builder()
                                .role("system")
                                .content(systemPrompt)
                                .build(),
                        GroqRequest.Message.builder()
                                .role("user")
                                .content(userMessage)
                                .build()
                ))
                .build();

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + safeApiKey)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new RuntimeException("Error de API: " + clientResponse.statusCode() + " - " + errorBody))))
                .bodyToMono(GroqResponse.class)
                .map(response -> {
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        return response.getChoices().get(0).getMessage().getContent();
                    }
                    return "Error: Sin respuesta de la IA.";
                })
                .onErrorResume(e -> Mono.just("Error al comunicarse con el servicio de IA: " + e.getMessage()));
    }
}
