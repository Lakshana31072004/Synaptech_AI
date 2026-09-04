package com.aseos.backend.dto;

import java.time.Instant;
import java.util.List;

public class CopilotChatResponse {
    private String reply;
    private List<String> suggestedPrompts;
    private String timestamp;

    public CopilotChatResponse() {
        this.timestamp = Instant.now().toString();
    }

    public CopilotChatResponse(String reply, List<String> suggestedPrompts) {
        this.reply = reply;
        this.suggestedPrompts = suggestedPrompts;
        this.timestamp = Instant.now().toString();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<String> getSuggestedPrompts() {
        return suggestedPrompts;
    }

    public void setSuggestedPrompts(List<String> suggestedPrompts) {
        this.suggestedPrompts = suggestedPrompts;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
