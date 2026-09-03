package com.aseos.backend.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RequirementAnalysisReport {

    private int wordCount;
    private int sentenceCount;
    private Map<String, Integer> keywordCount = new HashMap<>();
    private int qualityScore;
    private String qualityRating;
    private String analysisSummary;
    private List<RequirementItem> functionalRequirements = new ArrayList<>();
    private List<RequirementItem> nonFunctionalRequirements = new ArrayList<>();
    private List<AmbiguityWarning> ambiguousTermsFound = new ArrayList<>();
    private List<String> extractedUserStories = new ArrayList<>();

    public RequirementAnalysisReport() {}

    public RequirementAnalysisReport(int wordCount, int sentenceCount, Map<String, Integer> keywordCount) {
        this.wordCount = wordCount;
        this.sentenceCount = sentenceCount;
        this.keywordCount = keywordCount;
    }

    public static class RequirementItem {
        private String id;
        private String text;
        private String category;
        private String priority;

        public RequirementItem() {}

        public RequirementItem(String id, String text, String category, String priority) {
            this.id = id;
            this.text = text;
            this.category = category;
            this.priority = priority;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }

    public static class AmbiguityWarning {
        private String term;
        private String context;
        private String suggestion;

        public AmbiguityWarning() {}

        public AmbiguityWarning(String term, String context, String suggestion) {
            this.term = term;
            this.context = context;
            this.suggestion = suggestion;
        }

        public String getTerm() { return term; }
        public void setTerm(String term) { this.term = term; }
        public String getContext() { return context; }
        public void setContext(String context) { this.context = context; }
        public String getSuggestion() { return suggestion; }
        public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
    }

    // Getters and Setters
    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }

    public int getSentenceCount() { return sentenceCount; }
    public void setSentenceCount(int sentenceCount) { this.sentenceCount = sentenceCount; }

    public Map<String, Integer> getKeywordCount() { return keywordCount; }
    public void setKeywordCount(Map<String, Integer> keywordCount) { this.keywordCount = keywordCount; }

    public int getQualityScore() { return qualityScore; }
    public void setQualityScore(int qualityScore) { this.qualityScore = qualityScore; }

    public String getQualityRating() { return qualityRating; }
    public void setQualityRating(String qualityRating) { this.qualityRating = qualityRating; }

    public String getAnalysisSummary() { return analysisSummary; }
    public void setAnalysisSummary(String analysisSummary) { this.analysisSummary = analysisSummary; }

    public List<RequirementItem> getFunctionalRequirements() { return functionalRequirements; }
    public void setFunctionalRequirements(List<RequirementItem> functionalRequirements) { this.functionalRequirements = functionalRequirements; }

    public List<RequirementItem> getNonFunctionalRequirements() { return nonFunctionalRequirements; }
    public void setNonFunctionalRequirements(List<RequirementItem> nonFunctionalRequirements) { this.nonFunctionalRequirements = nonFunctionalRequirements; }

    public List<AmbiguityWarning> getAmbiguousTermsFound() { return ambiguousTermsFound; }
    public void setAmbiguousTermsFound(List<AmbiguityWarning> ambiguousTermsFound) { this.ambiguousTermsFound = ambiguousTermsFound; }

    public List<String> getExtractedUserStories() { return extractedUserStories; }
    public void setExtractedUserStories(List<String> extractedUserStories) { this.extractedUserStories = extractedUserStories; }
}