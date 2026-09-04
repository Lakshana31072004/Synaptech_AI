package com.aseos.backend.dto;

public class CodeReviewRequest {
    private String codeSnippet;
    private String language;
    private String context;

    public CodeReviewRequest() {}

    public CodeReviewRequest(String codeSnippet, String language, String context) {
        this.codeSnippet = codeSnippet;
        this.language = language;
        this.context = context;
    }

    public String getCodeSnippet() {
        return codeSnippet;
    }

    public void setCodeSnippet(String codeSnippet) {
        this.codeSnippet = codeSnippet;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }
}
