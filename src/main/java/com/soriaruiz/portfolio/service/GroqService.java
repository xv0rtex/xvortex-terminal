package com.soriaruiz.portfolio.service;

import com.soriaruiz.portfolio.model.BlogPost;
import com.soriaruiz.portfolio.model.groq.GroqRequest;
import com.soriaruiz.portfolio.model.groq.GroqResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    @Value("${groq.system.prompt}")
    private String systemPrompt;

    @Value("${groq.system.rules}")
    private String systemRules;

    @Value("${groq.hack.system.prompt}")
    private String hackSystemPrompt;

    private final WebClient webClient;
    private final BlogService blogService;

    public GroqService(WebClient.Builder webClientBuilder, BlogService blogService) {
        this.webClient = webClientBuilder.baseUrl("https://api.groq.com/openai/v1").build();
        this.blogService = blogService;
    }

    public Mono<String> chat(String userMessage, List<GroqRequest.Message> history) {
        List<BlogPost> allPosts = blogService.getAllPosts();
        
        // LIMITAR LA LISTA DE POSTS (Solo título e ID para ahorrar tokens)
        String postsList = allPosts.stream()
                .map(p -> String.format("- ID: %s | Título: %s", p.getId(), p.getTitle()))
                .collect(Collectors.joining("\n"));

        String baseSystemPrompt = systemPrompt + "\n\n" +
                "LISTA DE POSTS Y PROYECTOS DISPONIBLES:\n" +
                postsList + "\n\n" +
                systemRules + "\n\n" +
                "Si te pide detalles de uno en concreto, el sistema te pasará el contenido resumido.";

        String findPostPrompt = "Dado el siguiente mensaje y lista de posts, ¿por qué post está preguntando el usuario?\n" +
                "Posts:\n" + postsList + "\n\n" +
                "Mensaje: " + userMessage + "\n\n" +
                "Responde ÚNICAMENTE con el ID del post. Si no pregunta por uno específico, responde 'NONE'.";

        return callGroqApi(findPostPrompt, "ID o NONE", null)
                .flatMap(response -> {
                    String identifiedId = response.trim();
                    String finalSystemPrompt = baseSystemPrompt;

                    if (!identifiedId.equalsIgnoreCase("NONE")) {
                        Optional<BlogPost> matchedPost = allPosts.stream()
                                .filter(p -> identifiedId.contains(p.getId()))
                                .findFirst();

                        if (matchedPost.isPresent()) {
                            BlogPost post = matchedPost.get();
                            // REDUCIR DRÁSTICAMENTE EL TAMAÑO DEL POST A PASAR (de 8000 a 2000)
                            String content = post.getRawContent() != null ? post.getRawContent() : "";
                            if (content.length() > 2000) {
                                content = content.substring(0, 2000) + "\n... [truncado]";
                            }

                            finalSystemPrompt += "\n\n--- POST SOLICITADO ---\n" +
                                    "Título: " + post.getTitle() + "\n" +
                                    "Contenido:\n" + content + "\n" +
                                    "----------------------\n";
                        }
                    }

                    return callGroqApi(finalSystemPrompt, userMessage, history);
                });
    }

    public Mono<String> hackChat(String userMessage, List<GroqRequest.Message> history) {
        return callGroqApi(hackSystemPrompt, userMessage, history);
    }

    private Mono<String> callGroqApi(String systemContent, String userMessage, List<GroqRequest.Message> history) {
        String safeApiKey = apiKey.trim();
        
        List<GroqRequest.Message> apiMessages = new ArrayList<>();
        apiMessages.add(GroqRequest.Message.builder().role("system").content(systemContent).build());
        
        if (history != null) {
            apiMessages.addAll(history);
        }
        
        apiMessages.add(GroqRequest.Message.builder().role("user").content(userMessage).build());

        GroqRequest request = GroqRequest.builder()
                .model(model)
                .messages(apiMessages)
                .build();

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + safeApiKey)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new RuntimeException("API Error: " + clientResponse.statusCode() + " - " + errorBody))))
                .bodyToMono(GroqResponse.class)
                .map(response -> {
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        return response.getChoices().get(0).getMessage().getContent();
                    }
                    return "Parece que mis circuitos están saturados ahora mismo (Error de comunicación). ¿Podrías intentarlo de nuevo en unos segundos?";
                })
                .onErrorResume(e -> {
                    if (e.getMessage().contains("429")) {
                        return Mono.just("Estoy recibiendo demasiadas peticiones ahora mismo y he alcanzado mi límite (Rate Limit Exceeded). Por favor, espera unos segundos e inténtalo de nuevo.");
                    }
                    return Mono.just("Lo siento, ha habido un problema de conexión con mi núcleo principal. Inténtalo de nuevo en un momento.");
                });
    }
}
