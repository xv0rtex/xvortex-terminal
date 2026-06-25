package com.soriaruiz.portfolio.service;

import com.soriaruiz.portfolio.model.BlogPost;
import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class BlogService {

    @Value("${blog.posts.directory}")
    private String postsDirectory;

    private List<BlogPost> posts = new ArrayList<>();

    private final Parser parser;
    private final HtmlRenderer renderer;

    public BlogService() {
        List<Extension> extensions = Arrays.asList(TablesExtension.create());
        this.parser = Parser.builder().extensions(extensions).build();
        this.renderer = HtmlRenderer.builder().extensions(extensions).build();
    }

    @PostConstruct
    public void init() {
        loadPosts();
    }

    public void loadPosts() {
        posts.clear();
        try (Stream<Path> paths = Files.walk(Paths.get(postsDirectory))) {
            paths.filter(Files::isRegularFile)
                 .filter(path -> path.toString().endsWith(".md"))
                 .forEach(this::processFile);
        } catch (IOException e) {
            e.printStackTrace();
        }
        // Sort by date descending
        posts.sort(Comparator.comparing(BlogPost::getDate).reversed());
    }

    private void processFile(Path path) {
        try {
            String filename = path.getFileName().toString();
            String type = path.getParent().getFileName().toString(); // e.g., "blog" or "proyects"
            String fileSlug = filename.replace(".md", "");
            String content = Files.readString(path);

            BlogPost post = new BlogPost();
            post.setRawContent(content);
            post.setType(type);
            
            // Extract date from content "Date: dd-MM-yyyy"
            LocalDate date = extractDateFromContent(content);
            
            if (date == null) {
                // Fallback to filename
                date = extractDateFromFilename(fileSlug);
            }
            post.setDate(date != null ? date : LocalDate.now());

            // Extract Custom Slug (ID) from content "Slug: my-custom-url"
            String customSlug = extractSlugFromContent(content);
            post.setId(customSlug != null ? customSlug : fileSlug);

            // Extract Tags
            post.setTags(extractTags(content));

            // Remove "Tags: ...", "Date: ..." and "Slug: ..." lines from content before rendering HTML
            String contentWithoutTags = content.lines()
                    .filter(line -> !line.trim().toLowerCase().startsWith("tags:"))
                    .filter(line -> !line.trim().toLowerCase().startsWith("date:"))
                    .filter(line -> !line.trim().toLowerCase().startsWith("slug:"))
                    .collect(Collectors.joining("\n"));

            // Process image paths - use fileSlug because images are stored in folder matching filename
            contentWithoutTags = processImagePaths(contentWithoutTags, type + "/" + fileSlug);

            // Render Markdown to HTML
            Node document = parser.parse(contentWithoutTags);
            String html = renderer.render(document);
            post.setContent(html);

            // Extract Title from first H1 or filename
            String title = extractTitle(content);
            if (title == null) {
                title = fileSlug.replace("-", " ");
                // Remove date part if present
                if (date != null) {
                    // This logic might be fragile if fileSlug doesn't start with date but date was found in content
                    // But usually filenames have date. Let's keep it simple.
                    if (fileSlug.matches("^\\d{4}-\\d{2}-\\d{2}-.*")) {
                         title = title.substring(11);
                    }
                }
            }
            post.setTitle(title);
            
            // Extract excerpt (first paragraph)
            post.setExcerpt(extractExcerpt(html));

            posts.add(post);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private LocalDate extractDateFromFilename(String filename) {
        Pattern pattern = Pattern.compile("^(\\d{4}-\\d{2}-\\d{2})-");
        Matcher matcher = pattern.matcher(filename);
        if (matcher.find()) {
            try {
                return LocalDate.parse(matcher.group(1));
            } catch (DateTimeParseException e) {
                // ignore
            }
        }
        return null; // or LocalDate.now()
    }

    private LocalDate extractDateFromContent(String content) {
        // Look for line starting with "Date:" or "date:" with format dd-MM-yyyy
        Optional<String> dateLine = content.lines()
                .filter(line -> line.trim().toLowerCase().startsWith("date:"))
                .findFirst();

        if (dateLine.isPresent()) {
            String datePart = dateLine.get().substring(5).trim();
            try {
                return LocalDate.parse(datePart, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            } catch (DateTimeParseException e) {
                // ignore
            }
        }
        return null;
    }

    private String extractSlugFromContent(String content) {
        // Look for line starting with "Slug:" or "slug:"
        Optional<String> slugLine = content.lines()
                .filter(line -> line.trim().toLowerCase().startsWith("slug:"))
                .findFirst();

        if (slugLine.isPresent()) {
            return slugLine.get().substring(5).trim();
        }
        return null;
    }

    private String extractTitle(String markdown) {
        // Look for first line starting with #
        Optional<String> titleLine = markdown.lines()
                .filter(line -> line.trim().startsWith("# "))
                .findFirst();
        return titleLine.map(s -> s.substring(2).trim()).orElse(null);
    }
    
    private String extractExcerpt(String html) {
        // Simple extraction of first <p> tag content
        Pattern p = Pattern.compile("<p>(.*?)</p>");
        Matcher m = p.matcher(html);
        if (m.find()) {
            String excerpt = m.group(1).replaceAll("<[^>]*>", ""); // strip tags inside
            return excerpt.length() > 150 ? excerpt.substring(0, 150) + "..." : excerpt;
        }
        return "";
    }

    private List<String> extractTags(String markdown) {
        // Look for line starting with "Tags:" or "tags:"
        Optional<String> tagLine = markdown.lines()
                .filter(line -> line.trim().toLowerCase().startsWith("tags:"))
                .findFirst();
        
        if (tagLine.isPresent()) {
            String tagsPart = tagLine.get().substring(5).trim();
            if (!tagsPart.isEmpty()) {
                return Arrays.stream(tagsPart.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }
        }
        return new ArrayList<>();
    }

    private String processImagePaths(String content, String slug) {
        // First: turn ![alt](file.mp4|webm|mov) into an HTML <video> block.
        // Covers both relative and absolute/external URLs.
        Pattern videoPattern = Pattern.compile("!\\[(.*?)\\]\\(([^)\\s]+?\\.(?:mp4|webm|mov))\\)", Pattern.CASE_INSENSITIVE);
        Matcher videoMatcher = videoPattern.matcher(content);
        StringBuffer sb = new StringBuffer();
        while (videoMatcher.find()) {
            String src = videoMatcher.group(2);
            if (!src.startsWith("http") && !src.startsWith("/")) {
                src = "/posts/" + slug + "/" + src;
            }
            String replacement = "\n<video controls preload=\"metadata\" src=\"" + src + "\"></video>\n";
            videoMatcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        videoMatcher.appendTail(sb);
        String result = sb.toString();

        // Then: rewrite remaining relative image paths to /posts/slug/...
        return result.replaceAll("!\\[(.*?)\\]\\((?!http|/)(.*?)\\)", "![$1](/posts/" + slug + "/$2)");
    }

    public List<BlogPost> getAllPosts() {
        return posts;
    }

    public List<BlogPost> getPostsByTag(String tag) {
        if (tag == null || tag.isEmpty()) return posts;
        return posts.stream()
                .filter(p -> p.getTags().stream().anyMatch(t -> t.equalsIgnoreCase(tag)))
                .collect(Collectors.toList());
    }

    public List<BlogPost> getPostsByType(String type) {
        if (type == null || type.isEmpty()) return posts;
        return posts.stream()
                .filter(p -> type.equalsIgnoreCase(p.getType()))
                .collect(Collectors.toList());
    }

    public List<BlogPost> getPostsByTypeAndTag(String type, String tag) {
        return getPostsByType(type).stream()
                .filter(p -> tag == null || tag.isEmpty() || p.getTags().stream().anyMatch(t -> t.equalsIgnoreCase(tag)))
                .collect(Collectors.toList());
    }

    public Set<String> getAllTags() {
        return posts.stream()
                .flatMap(p -> p.getTags().stream())
                .collect(Collectors.toSet());
    }

    public Set<String> getTagsByType(String type) {
        return getPostsByType(type).stream()
                .flatMap(p -> p.getTags().stream())
                .collect(Collectors.toSet());
    }

    public Optional<BlogPost> getPost(String id) {
        return posts.stream().filter(p -> p.getId().equals(id)).findFirst();
    }
}
