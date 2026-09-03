package com.aseos.backend.dto;

import java.util.Map;

public class RequirementAnalysisReport {

    private int wordCount;
    private int sentenceCount;
    private Map<String, Integer> keywordCount;

    public RequirementAnalysisReport(int wordCount, int sentenceCount, Map<String, Integer> keywordCount) {
        this.wordCount = wordCount;
        this.sentenceCount = sentenceCount;
        this.keywordCount = keywordCount;
    }

    public int getWordCount() {
        return wordCount;
    }

    public void setWordCount(int wordCount) {
        this.wordCount = wordCount;
    }

    public int getSentenceCount() {
        return sentenceCount;
    }

    public void setSentenceCount(int sentenceCount) {
        this.sentenceCount = sentenceCount;
    }

    public Map<String, Integer> getKeywordCount() {
        return keywordCount;
    }

    public void setKeywordCount(Map<String, Integer> keywordCount) {
        this.keywordCount = keywordCount;
    }
}