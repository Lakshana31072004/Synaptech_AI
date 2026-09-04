package com.aseos.backend.dto;

import java.util.List;
import java.util.Map;

public class CopilotChatRequest {
    private String message;
    private List<Map<String, String>> history; // [ { "role": "user"|"assistant", "content": "..." } ]
    private Map<String, Object> context; // optional active telemetry or architecture context

    public CopilotChatRequest() {}

    public CopilotChatRequest(String message, List<Map<String, String>> history, Map<String, Object> context) {
        this.message = message;
        this.history = history;
        this.context = context;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<Map<String, String>> getHistory() {
        return history;
    }

    public void setHistory(List<Map<String, String>> history) {
        this.history = history;
    }

    public Map<String, Object> getContext() {
        return context;
    }

    public void setContext(Map<String, Object> context) {
        this.context = context;
    }
}
