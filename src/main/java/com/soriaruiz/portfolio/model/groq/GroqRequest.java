package com.soriaruiz.portfolio.model.groq;

import java.util.List;

public class GroqRequest {
    private String model;
    private List<Message> messages;

    public GroqRequest() {}

    public GroqRequest(String model, List<Message> messages) {
        this.model = model;
        this.messages = messages;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public List<Message> getMessages() { return messages; }
    public void setMessages(List<Message> messages) { this.messages = messages; }

    public static class Builder {
        private String model;
        private List<Message> messages;

        public Builder model(String model) {
            this.model = model;
            return this;
        }

        public Builder messages(List<Message> messages) {
            this.messages = messages;
            return this;
        }

        public GroqRequest build() {
            return new GroqRequest(model, messages);
        }
    }

    public static class Message {
        private String role;
        private String content;

        public Message() {}
        public Message(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public static class Builder {
            private String role;
            private String content;

            public Builder role(String role) {
                this.role = role;
                return this;
            }

            public Builder content(String content) {
                this.content = content;
                return this;
            }

            public Message build() {
                return new Message(role, content);
            }
        }
    }
}
