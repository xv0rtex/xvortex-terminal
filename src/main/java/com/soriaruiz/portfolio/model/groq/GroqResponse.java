package com.soriaruiz.portfolio.model.groq;

import java.util.List;

public class GroqResponse {
    private String id;
    private String object;
    private long created;
    private String model;
    private List<Choice> choices;

    public List<Choice> getChoices() { return choices; }
    public void setChoices(List<Choice> choices) { this.choices = choices; }

    public static class Choice {
        private int index;
        private Message message;
        private String finish_reason;

        public Message getMessage() { return message; }
        public void setMessage(Message message) { this.message = message; }
    }

    public static class Message {
        private String role;
        private String content;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
