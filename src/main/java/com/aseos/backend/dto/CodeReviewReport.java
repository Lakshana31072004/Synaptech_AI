package com.aseos.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class CodeReviewReport {

    public static class VulnerabilityItem {
        private String title;
        private String severity; // Low, Moderate, High, Critical
        private String category; // e.g., OWASP A03: Injection, CWE-89
        private String description;
        private String snippet;
        private String remediation;

        public VulnerabilityItem() {}

        public VulnerabilityItem(String title, String severity, String category, String description, String snippet, String remediation) {
            this.title = title;
            this.severity = severity;
            this.category = category;
            this.description = description;
            this.snippet = snippet;
            this.remediation = remediation;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getSnippet() { return snippet; }
        public void setSnippet(String snippet) { this.snippet = snippet; }

        public String getRemediation() { return remediation; }
        public void setRemediation(String remediation) { this.remediation = remediation; }
    }

    private int overallQualityScore;
    private String riskLevel;
    private String summary;
    private List<VulnerabilityItem> vulnerabilities = new ArrayList<>();
    private List<String> codeSmells = new ArrayList<>();
    private List<String> keyImprovements = new ArrayList<>();
    private String refactoredCode;

    public CodeReviewReport() {}

    public CodeReviewReport(int overallQualityScore, String riskLevel, String summary,
                            List<VulnerabilityItem> vulnerabilities, List<String> codeSmells,
                            List<String> keyImprovements, String refactoredCode) {
        this.overallQualityScore = overallQualityScore;
        this.riskLevel = riskLevel;
        this.summary = summary;
        this.vulnerabilities = vulnerabilities;
        this.codeSmells = codeSmells;
        this.keyImprovements = keyImprovements;
        this.refactoredCode = refactoredCode;
    }

    public int getOverallQualityScore() { return overallQualityScore; }
    public void setOverallQualityScore(int overallQualityScore) { this.overallQualityScore = overallQualityScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<VulnerabilityItem> getVulnerabilities() { return vulnerabilities; }
    public void setVulnerabilities(List<VulnerabilityItem> vulnerabilities) { this.vulnerabilities = vulnerabilities; }

    public List<String> getCodeSmells() { return codeSmells; }
    public void setCodeSmells(List<String> codeSmells) { this.codeSmells = codeSmells; }

    public List<String> getKeyImprovements() { return keyImprovements; }
    public void setKeyImprovements(List<String> keyImprovements) { this.keyImprovements = keyImprovements; }

    public String getRefactoredCode() { return refactoredCode; }
    public void setRefactoredCode(String refactoredCode) { this.refactoredCode = refactoredCode; }
}
