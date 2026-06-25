package com.soriaruiz.portfolio.service;

import com.soriaruiz.portfolio.model.Event;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class EventService {

    @Value("${events.file.path}")
    private String eventsFilePath;

    private List<Event> events = new ArrayList<>();

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @PostConstruct
    public void init() {
        loadEvents();
    }

    public void loadEvents() {
        events.clear();
        Path path = Paths.get(eventsFilePath);
        if (!Files.exists(path)) {
            return;
        }

        try {
            String content = Files.readString(path);
            Yaml yaml = new Yaml();
            Map<String, Object> data = yaml.load(content);

            if (data == null || !data.containsKey("events")) {
                return;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> eventList = (List<Map<String, Object>>) data.get("events");

            for (Map<String, Object> entry : eventList) {
                Event event = new Event();
                event.setNombre((String) entry.get("nombre"));
                event.setUbicacion((String) entry.get("ubicacion"));
                event.setDescripcion((String) entry.get("descripcion"));
                event.setImagen((String) entry.get("imagen"));
                event.setTag((String) entry.get("tag"));

                String fechaStr = (String) entry.get("fecha");
                if (fechaStr != null) {
                    event.setFecha(LocalDate.parse(fechaStr, DATE_FORMAT));
                } else {
                    event.setFecha(LocalDate.now());
                }

                events.add(event);
            }

            events.sort(Comparator.comparing(Event::getFecha).reversed());

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public List<Event> getAllEvents() {
        return events;
    }
}
