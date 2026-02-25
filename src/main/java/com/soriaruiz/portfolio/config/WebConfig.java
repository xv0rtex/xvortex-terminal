package com.soriaruiz.portfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve images from the posts directory - restrict to common image types to prevent LFI/source exposure
        registry.addResourceHandler("/posts/**/*.png", 
                                  "/posts/**/*.jpg", 
                                  "/posts/**/*.jpeg", 
                                  "/posts/**/*.gif", 
                                  "/posts/**/*.webp", 
                                  "/posts/**/*.svg")
                .addResourceLocations("classpath:/posts/");
    }
}
