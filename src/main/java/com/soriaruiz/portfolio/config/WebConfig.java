package com.soriaruiz.portfolio.config;

import com.soriaruiz.portfolio.interceptor.VisitorInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final VisitorInterceptor visitorInterceptor;

    public WebConfig(VisitorInterceptor visitorInterceptor) {
        this.visitorInterceptor = visitorInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(visitorInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/css/**", "/js/**", "/images/**", "/posts/**", "/favicon.ico", "/error");
    }

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
