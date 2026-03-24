package com.soriaruiz.portfolio.interceptor;

import com.soriaruiz.portfolio.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class VisitorInterceptor implements HandlerInterceptor {

    private final LogService logService;

    public VisitorInterceptor(LogService logService) {
        this.logService = logService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        String userAgent = request.getHeader("User-Agent");
        String path = request.getRequestURI();

        logService.logVisit(ip, userAgent, path);
        
        return true;
    }
}
