package com.soriaruiz.portfolio.service;

import com.soriaruiz.portfolio.model.BlogPost;
import com.soriaruiz.portfolio.model.groq.GroqRequest;
import com.soriaruiz.portfolio.model.groq.GroqResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    @Value("${groq.system.prompt}")
    private String systemPrompt;

    @Value("${groq.hack.system.prompt}")
    private String hackSystemPrompt;

    @Value("${groq.classification.prompt}")
    private String classificationPrompt;

    private final WebClient webClient;
    private final BlogService blogService;

    public GroqService(WebClient.Builder webClientBuilder, BlogService blogService) {
        this.webClient = webClientBuilder.baseUrl("https://api.groq.com/openai/v1").build();
        this.blogService = blogService;
    }

    public Mono<String> chat(String userMessage) {
        return isBlogRelatedQuery(userMessage)
                .flatMap(isBlogRelated -> {
                    String finalSystemPrompt = systemPrompt;
                    if (Boolean.TRUE.equals(isBlogRelated)) {
                        // Pass user query to build relevant context
                        String blogContext = buildBlogContext(userMessage);
                        finalSystemPrompt = systemPrompt + "\n\n" + 
                            "CONTEXTO ADICIONAL SOBRE LOS POSTS DEL BLOG:\n" + 
                            "Usa la siguiente información sobre los artículos publicados para responder preguntas específicas sobre ellos.\n" + 
                            "Se te proporciona el contenido completo solo de los posts más relevantes o recientes. Del resto solo tienes el título.\n" +
                            "Si el usuario pregunta por un post antiguo del que solo tienes el título, indícale que tienes un resumen pero no el detalle completo.\n\n" + 
                            blogContext;
                    }
                    return callGroqApi(finalSystemPrompt, userMessage);
                });
    }

    public Mono<String> hackChat(String userMessage) {
        return callGroqApi(hackSystemPrompt, userMessage);
    }

    private Mono<Boolean> isBlogRelatedQuery(String userMessage) {
        // Simple keyword check first to save API calls
        String lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.contains("post") || lowerMsg.contains("blog") || lowerMsg.contains("artículo") || lowerMsg.contains("escrito")) {
            return Mono.just(true);
        }

        String fullClassificationPrompt = classificationPrompt.replace("{userMessage}", userMessage);

        return callGroqApi(fullClassificationPrompt, "Clasifica este mensaje: " + userMessage)
                .map(response -> response.trim().toUpperCase().contains("BLOG"))
                .onErrorReturn(false); 
    }

    private Mono<String> callGroqApi(String systemContent, String userMessage) {
        String safeApiKey = apiKey.trim();
        GroqRequest request = GroqRequest.builder()
                .model(model)
                .messages(List.of(
                        GroqRequest.Message.builder()
                                .role("system")
                                .content(systemContent)
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
                                .flatMap(errorBody -> Mono.error(new RuntimeException("API Error: " + clientResponse.statusCode() + " - " + errorBody))))
                .bodyToMono(GroqResponse.class)
                .map(response -> {
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        return response.getChoices().get(0).getMessage().getContent();
                    }
                    return "Error: No response from AI.";
                })
                .onErrorResume(e -> Mono.just("Error communicating with AI service: " + e.getMessage()));
    }

    private String buildBlogContext(String userQuery) {
        List<BlogPost> posts = blogService.getAllPosts();
        if (posts.isEmpty()) {
            return "No hay posts disponibles actualmente.";
        }

        String lowerQuery = userQuery.toLowerCase();
        boolean isLatestPostQuery = lowerQuery.contains("último") || lowerQuery.contains("ultimo") || 
                                  lowerQuery.contains("nuevo") || lowerQuery.contains("reciente") ||
                                  lowerQuery.contains("actual");

        // Strategy:
        // 1. Check for specific post matches (title or strong tag match)
        // 2. Check for "latest post" intent
        // 3. If matches found -> Send FULL content of those specific posts
        // 4. If NO matches found -> Send ONLY the list of titles/dates so AI can ask for clarification

        List<BlogPost> matchingPosts = posts.stream()
                .filter(post -> post.getTitle().toLowerCase().contains(lowerQuery) || 
                               post.getTags().stream().anyMatch(tag -> lowerQuery.contains(tag.toLowerCase())))
                .collect(Collectors.toList());

        // If user asks for "latest", add the most recent post if not already matched
        if (isLatestPostQuery && !posts.isEmpty()) {
            BlogPost latest = posts.get(0);
            if (!matchingPosts.contains(latest)) {
                matchingPosts.add(0, latest);
            }
        }

        if (!matchingPosts.isEmpty()) {
            // FOUND SPECIFIC POSTS -> Send full content (limit 8000 chars to be safe but generous)
            return matchingPosts.stream()
                    .map(post -> {
                        String content = post.getRawContent() != null ? post.getRawContent() : "";
                        // Llama 3.1 has 128k context, but let's be reasonable with 8000 chars (~2000 tokens) per post
                        if (content.length() > 8000) {
                            content = content.substring(0, 8000) + "\n... (contenido truncado)";
                        }
                        return String.format(
                                "--- POST ENCONTRADO ---\nTitle: %s\nDate: %s\nTags: %s\nContent:\n%s\n--- END POST ---\n",
                                post.getTitle(),
                                post.getDate(),
                                String.join(", ", post.getTags()),
                                content
                        );
                    })
                    .collect(Collectors.joining("\n"));
        } else {
            // NO SPECIFIC MATCH -> Send list of all titles for disambiguation
            String titlesList = posts.stream()
                    .map(p -> String.format("- %s (%s)", p.getTitle(), p.getDate()))
                    .collect(Collectors.joining("\n"));
            
            return "No he encontrado un post específico que coincida con la búsqueda del usuario.\n" +
                   "Aquí tienes la lista completa de posts disponibles. \n" +
                   "Por favor, indícale al usuario que no encuentras el post específico y muéstrale algunos títulos relevantes o pregúntale a cuál se refiere de la siguiente lista:\n\n" +
                   titlesList;
        }
    }
}
