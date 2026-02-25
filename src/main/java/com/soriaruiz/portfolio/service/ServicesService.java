package com.soriaruiz.portfolio.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ServicesService {

    private final Map<String, ServiceSession> sessions = new ConcurrentHashMap<>();

    private static final String ROOT_MENU = 
            "[1] security_audit\n" +
            "[2] infrastructure\n" +
            "[3] development\n" +
            "[4] network_security";

    private static final String SECURITY_AUDIT_MENU = 
            "[1] Basic Security Review\n" +
            "[2] Server Hardening Audit\n" +
            "[3] Exposure & Surface Scan\n" +
            "[4] Backup & Recovery Review\n" +
            "[0] back";

    private static final String INFRASTRUCTURE_MENU = 
            "[1] Server Setup & Deployment\n" +
            "[2] Docker / Containerization Setup\n" +
            "[3] Virtualization (Proxmox) Deployment\n" +
            "[4] Architecture Design\n" +
            "[0] back";

    private static final String DEVELOPMENT_MENU = 
            "[1] Backend Development (Spring Boot)\n" +
            "[2] Secure API Design\n" +
            "[3] Internal Tools / Automation\n" +
            "[4] Web Application Development\n" +
            "[0] back";

    private static final String NETWORK_SECURITY_MENU = 
            "[1] Firewall Configuration\n" +
            "[2] Network Segmentation (VLAN)\n" +
            "[3] Secure Home Network Setup\n" +
            "[4] SME Network Hardening\n" +
            "[0] back";

    public String processCommand(String sessionId, String command, String ipAddress) {
        ServiceSession session = sessions.computeIfAbsent(sessionId, k -> new ServiceSession());

        // If not in service mode, check if we should enter it
        if (!session.isActive()) {
            if ("ls services/".equals(command.trim()) || "ls services".equals(command.trim())) {
                session.setActive(true);
                session.setCurrentState(State.ROOT);
                return ROOT_MENU;
            }
            return null; // Not handled by this service
        }

        // Handle navigation and form input
        return handleState(session, command.trim(), ipAddress);
    }

    private String handleState(ServiceSession session, String input, String ipAddress) {
        State currentState = session.getCurrentState();

        // Allow re-listing services at any point if explicitly requested, or reset to root
        if ("ls services/".equals(input) || "ls services".equals(input)) {
             if (currentState == State.ROOT) {
                 return ROOT_MENU;
             }
             // If in submenu, maybe we shouldn't reset, or maybe we should.
             // Let's assume "ls services/" always goes to root menu.
             session.setCurrentState(State.ROOT);
             return ROOT_MENU;
        }

        if (currentState == State.ROOT) {
            switch (input) {
                case "1":
                case "security_audit":
                    session.setCurrentState(State.SECURITY_AUDIT);
                    return SECURITY_AUDIT_MENU;
                case "2":
                case "infrastructure":
                    session.setCurrentState(State.INFRASTRUCTURE);
                    return INFRASTRUCTURE_MENU;
                case "3":
                case "development":
                    session.setCurrentState(State.DEVELOPMENT);
                    return DEVELOPMENT_MENU;
                case "4":
                case "network_security":
                    session.setCurrentState(State.NETWORK_SECURITY);
                    return NETWORK_SECURITY_MENU;
                case "exit":
                case "quit":
                    session.reset();
                    return "Exited services menu.";
                default:
                    return "Invalid selection. Please choose [1-4] or type 'exit'.\n" + ROOT_MENU;
            }
        } else if (isMenuState(currentState)) {
            if ("0".equals(input) || "back".equals(input)) {
                session.setCurrentState(State.ROOT);
                return ROOT_MENU;
            }
            
            // Check for valid service selection (1-4)
            if (input.matches("[1-4]")) {
                String serviceName = getServiceName(currentState, input);
                session.setSelectedService(serviceName);
                session.setCurrentState(State.FORM_NAME);
                return "Initializing service intake... (Type 'exit' to cancel)\n\nComplete the following:\n\n- Nombre:";
            }
            
            return "Invalid selection. Please choose [1-4] or [0] to go back.\n" + getMenuText(currentState);
        } else if (isFormState(currentState)) {
            return handleFormInput(session, input, ipAddress);
        }

        return null;
    }

    private String handleFormInput(ServiceSession session, String input, String ipAddress) {
        if ("exit".equalsIgnoreCase(input.trim())) {
            session.setCurrentState(State.ROOT);
            session.getFormData().clear();
            session.setSelectedService(null);
            return "Form cancelled.\n" + ROOT_MENU;
        }

        State currentState = session.getCurrentState();
        Map<String, String> formData = session.getFormData();

        switch (currentState) {
            case FORM_NAME:
                formData.put("Nombre", input);
                session.setCurrentState(State.FORM_EMAIL);
                return "- Email:";
            case FORM_EMAIL:
                formData.put("Email", input);
                session.setCurrentState(State.FORM_PHONE);
                return "- Número de teléfono (opcional):";
            case FORM_PHONE:
                formData.put("Teléfono", input);
                session.setCurrentState(State.FORM_DESCRIPTION);
                return "- Descripción:";
            case FORM_DESCRIPTION:
                formData.put("Descripción", input);
                saveForm(session, ipAddress);
                session.reset(); // Reset session after completion but keep it active? No, user probably done.
                return "Formulario guardado correctamente. Nos pondremos en contacto contigo pronto.";
            default:
                return "Error in form processing.";
        }
    }

    private void saveForm(ServiceSession session, String ipAddress) {
        try {
            Path formDir = Paths.get("form");
            if (!Files.exists(formDir)) {
                Files.createDirectories(formDir);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            String filename = "service_request_" + timestamp + ".txt";
            Path filePath = formDir.resolve(filename);

            StringBuilder content = new StringBuilder();
            content.append("Fecha: ").append(LocalDateTime.now()).append("\n");
            content.append("IP: ").append(ipAddress).append("\n");
            content.append("Servicio: ").append(session.getSelectedService()).append("\n");
            content.append("----------------------------------------\n");
            
            Map<String, String> formData = session.getFormData();
            content.append("Nombre: ").append(formData.get("Nombre")).append("\n");
            content.append("Email: ").append(formData.get("Email")).append("\n");
            content.append("Teléfono: ").append(formData.get("Teléfono")).append("\n");
            content.append("Descripción: ").append(formData.get("Descripción")).append("\n");

            Files.writeString(filePath, content.toString(), StandardOpenOption.CREATE, StandardOpenOption.WRITE);
        } catch (IOException e) {
            e.printStackTrace(); // Log error properly in real app
        }
    }

    private boolean isMenuState(State state) {
        return state == State.SECURITY_AUDIT || state == State.INFRASTRUCTURE || 
               state == State.DEVELOPMENT || state == State.NETWORK_SECURITY;
    }

    private boolean isFormState(State state) {
        return state.name().startsWith("FORM_");
    }

    private String getMenuText(State state) {
        switch (state) {
            case SECURITY_AUDIT: return SECURITY_AUDIT_MENU;
            case INFRASTRUCTURE: return INFRASTRUCTURE_MENU;
            case DEVELOPMENT: return DEVELOPMENT_MENU;
            case NETWORK_SECURITY: return NETWORK_SECURITY_MENU;
            default: return ROOT_MENU;
        }
    }

    private String getServiceName(State category, String selection) {
        // Simplified mapping based on prompt
        String prefix = "";
        switch (category) {
            case SECURITY_AUDIT:
                switch(selection) {
                    case "1": return "Basic Security Review";
                    case "2": return "Server Hardening Audit";
                    case "3": return "Exposure & Surface Scan";
                    case "4": return "Backup & Recovery Review";
                }
                break;
            case INFRASTRUCTURE:
                switch(selection) {
                    case "1": return "Server Setup & Deployment";
                    case "2": return "Docker / Containerization Setup";
                    case "3": return "Virtualization (Proxmox) Deployment";
                    case "4": return "Architecture Design";
                }
                break;
            case DEVELOPMENT:
                switch(selection) {
                    case "1": return "Backend Development (Spring Boot)";
                    case "2": return "Secure API Design";
                    case "3": return "Internal Tools / Automation";
                    case "4": return "Web Application Development";
                }
                break;
            case NETWORK_SECURITY:
                switch(selection) {
                    case "1": return "Firewall Configuration";
                    case "2": return "Network Segmentation (VLAN)";
                    case "3": return "Secure Home Network Setup";
                    case "4": return "SME Network Hardening";
                }
                break;
        }
        return "Unknown Service";
    }

    private enum State {
        ROOT,
        SECURITY_AUDIT,
        INFRASTRUCTURE,
        DEVELOPMENT,
        NETWORK_SECURITY,
        FORM_NAME,
        FORM_EMAIL,
        FORM_PHONE,
        FORM_DESCRIPTION
    }

    private static class ServiceSession {
        private boolean active = false;
        private State currentState = State.ROOT;
        private String selectedService;
        private final Map<String, String> formData = new HashMap<>();

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public State getCurrentState() { return currentState; }
        public void setCurrentState(State currentState) { this.currentState = currentState; }
        public String getSelectedService() { return selectedService; }
        public void setSelectedService(String selectedService) { this.selectedService = selectedService; }
        public Map<String, String> getFormData() { return formData; }
        
        public void reset() {
            active = false;
            currentState = State.ROOT;
            selectedService = null;
            formData.clear();
        }
    }
}
