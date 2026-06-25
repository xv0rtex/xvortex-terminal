package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.model.BlogPost;
import com.soriaruiz.portfolio.model.Event;
import com.soriaruiz.portfolio.service.BlogService;
import com.soriaruiz.portfolio.service.EventService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class EventController {

    private final EventService eventService;
    private final BlogService blogService;

    public EventController(EventService eventService, BlogService blogService) {
        this.eventService = eventService;
        this.blogService = blogService;
    }

    @GetMapping("/events")
    public List<Event> getEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/events/{tag}/posts")
    public List<Map<String, String>> getEventPosts(@PathVariable String tag) {
        List<BlogPost> posts = blogService.getPostsByTag(tag);
        return posts.stream().map(p -> {
            Map<String, String> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("excerpt", p.getExcerpt());
            map.put("date", p.getDate() != null ? p.getDate().toString() : "");
            map.put("type", p.getType());
            return map;
        }).collect(Collectors.toList());
    }
}
