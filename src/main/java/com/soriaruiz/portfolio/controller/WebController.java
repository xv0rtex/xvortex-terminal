package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.model.BlogPost;
import com.soriaruiz.portfolio.service.BlogService;
import com.soriaruiz.portfolio.service.ServicesService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Controller
public class WebController {

    @Autowired
    private BlogService blogService;

    @Autowired
    private ServicesService servicesService;

    @GetMapping("/")
    public String index(Model model) {
        return "index"; // Landing page
    }

    @GetMapping("/about")
    public String about(Model model) {
        return "about";
    }

    @GetMapping("/blog")
    public String blog(@RequestParam(required = false) String tag, Model model) {
        List<BlogPost> posts;
        if (tag != null && !tag.isEmpty()) {
            posts = blogService.getPostsByTag(tag);
            model.addAttribute("currentTag", tag);
        } else {
            posts = blogService.getAllPosts();
        }
        
        Set<String> allTags = blogService.getAllTags();
        
        model.addAttribute("posts", posts);
        model.addAttribute("tags", allTags);
        return "blog";
    }

    @GetMapping("/blog/{id}")
    public String blogPost(@PathVariable String id, Model model) {
        Optional<BlogPost> post = blogService.getPost(id);
        if (post.isPresent()) {
            model.addAttribute("post", post.get());
            return "post";
        }
        return "redirect:/blog";
    }

    @GetMapping("/services")
    public String services(HttpSession session, Model model) {
        String sessionId = session.getId();
        // Force initialization or get current state
        String output = servicesService.processCommand(sessionId, "ls services/", "system-init");
        
        model.addAttribute("initialTerminalOutput", output);
        model.addAttribute("apiEndpoint", "/api/services/chat");
        return "services";
    }

    @GetMapping("/chat")
    public String chat(Model model) {
        return "chat";
    }
}
