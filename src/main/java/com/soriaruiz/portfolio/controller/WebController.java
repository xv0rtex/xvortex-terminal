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
            posts = blogService.getPostsByTypeAndTag("blog", tag);
            model.addAttribute("currentTag", tag);
        } else {
            posts = blogService.getPostsByType("blog");
        }
        
        Set<String> allTags = blogService.getTagsByType("blog");
        
        model.addAttribute("posts", posts);
        model.addAttribute("tags", allTags);
        model.addAttribute("pageTitle", "Blog");
        model.addAttribute("pageCommand", "ls -l ./posts/blog");
        model.addAttribute("pageType", "blog");
        return "blog";
    }

    @GetMapping("/proyectos")
    public String proyectos(@RequestParam(required = false) String tag, Model model) {
        List<BlogPost> posts;
        if (tag != null && !tag.isEmpty()) {
            posts = blogService.getPostsByTypeAndTag("proyects", tag);
            model.addAttribute("currentTag", tag);
        } else {
            posts = blogService.getPostsByType("proyects");
        }
        
        Set<String> allTags = blogService.getTagsByType("proyects");
        
        model.addAttribute("posts", posts);
        model.addAttribute("tags", allTags);
        model.addAttribute("pageTitle", "Proyectos");
        model.addAttribute("pageCommand", "ls -l ./posts/proyects");
        model.addAttribute("pageType", "proyectos");
        return "blog"; // Reusing the same template
    }

    @GetMapping({"/blog/{id}", "/proyectos/{id}"})
    public String blogPost(@PathVariable String id, Model model) {
        Optional<BlogPost> post = blogService.getPost(id);
        if (post.isPresent()) {
            model.addAttribute("post", post.get());
            String type = post.get().getType();
            model.addAttribute("backUrl", "proyects".equals(type) ? "/proyectos" : "/blog");
            return "post";
        }
        return "redirect:/";
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
