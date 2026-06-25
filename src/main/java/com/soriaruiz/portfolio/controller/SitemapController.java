package com.soriaruiz.portfolio.controller;

import com.soriaruiz.portfolio.model.BlogPost;
import com.soriaruiz.portfolio.service.BlogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Controller
public class SitemapController {

    @Autowired
    private BlogService blogService;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @ResponseBody
    public String sitemap(HttpServletRequest request) {
        String baseUrl = buildBaseUrl(request);
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        StringBuilder xml = new StringBuilder("""
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                """);

        addUrl(xml, baseUrl + "/", today, "weekly", "1.0");
        addUrl(xml, baseUrl + "/about", today, "monthly", "0.8");
        addUrl(xml, baseUrl + "/blog", today, "weekly", "0.9");
        addUrl(xml, baseUrl + "/proyectos", today, "weekly", "0.9");
        addUrl(xml, baseUrl + "/services", today, "monthly", "0.7");
        addUrl(xml, baseUrl + "/chat", today, "monthly", "0.6");

        List<BlogPost> blogPosts = blogService.getPostsByType("blog");
        for (BlogPost post : blogPosts) {
            String lastmod = post.getDate() != null ? post.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : today;
            addUrl(xml, baseUrl + "/blog/" + post.getId(), lastmod, "monthly", "0.8");
        }

        List<BlogPost> projects = blogService.getPostsByType("proyects");
        for (BlogPost post : projects) {
            String lastmod = post.getDate() != null ? post.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : today;
            addUrl(xml, baseUrl + "/proyectos/" + post.getId(), lastmod, "monthly", "0.8");
        }

        xml.append("</urlset>");
        return xml.toString();
    }

    private void addUrl(StringBuilder xml, String loc, String lastmod, String changefreq, String priority) {
        xml.append("  <url>\n")
           .append("    <loc>").append(escapeXml(loc)).append("</loc>\n")
           .append("    <lastmod>").append(lastmod).append("</lastmod>\n")
           .append("    <changefreq>").append(changefreq).append("</changefreq>\n")
           .append("    <priority>").append(priority).append("</priority>\n")
           .append("  </url>\n");
    }

    private String escapeXml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String buildBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int port = request.getServerPort();
        String contextPath = request.getContextPath();
        boolean isDefaultPort = (scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443);
        return scheme + "://" + serverName + (isDefaultPort ? "" : ":" + port) + contextPath;
    }
}
