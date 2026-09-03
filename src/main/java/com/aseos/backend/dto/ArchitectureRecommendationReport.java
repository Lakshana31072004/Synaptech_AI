package com.aseos.backend.dto;

import java.util.List;
import java.util.Map;

public class ArchitectureRecommendationReport {
    private String recommendedArchitecture;
    private int confidenceScore;
    private String summary;
    private List<String> keyBenefits;
    private List<String> architecturalTradeOffs;
    private Map<String, String> suggestedTechStack;
    private String alternativeArchitecture;
    private List<String> implementationGuidelines;

    // Mermaid.js architectural visualizations
    private String diagramMermaid;
    private String c4DiagramMermaid;
    private String sequenceDiagramMermaid;

    public ArchitectureRecommendationReport() {}

    public ArchitectureRecommendationReport(String recommendedArchitecture, int confidenceScore, String summary,
                                          List<String> keyBenefits, List<String> architecturalTradeOffs,
                                          Map<String, String> suggestedTechStack, String alternativeArchitecture,
                                          List<String> implementationGuidelines, String diagramMermaid,
                                          String c4DiagramMermaid, String sequenceDiagramMermaid) {
        this.recommendedArchitecture = recommendedArchitecture;
        this.confidenceScore = confidenceScore;
        this.summary = summary;
        this.keyBenefits = keyBenefits;
        this.architecturalTradeOffs = architecturalTradeOffs;
        this.suggestedTechStack = suggestedTechStack;
        this.alternativeArchitecture = alternativeArchitecture;
        this.implementationGuidelines = implementationGuidelines;
        this.diagramMermaid = diagramMermaid;
        this.c4DiagramMermaid = c4DiagramMermaid;
        this.sequenceDiagramMermaid = sequenceDiagramMermaid;
    }

    public String getRecommendedArchitecture() {
        return recommendedArchitecture;
    }

    public void setRecommendedArchitecture(String recommendedArchitecture) {
        this.recommendedArchitecture = recommendedArchitecture;
    }

    public int getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(int confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getKeyBenefits() {
        return keyBenefits;
    }

    public void setKeyBenefits(List<String> keyBenefits) {
        this.keyBenefits = keyBenefits;
    }

    public List<String> getArchitecturalTradeOffs() {
        return architecturalTradeOffs;
    }

    public void setArchitecturalTradeOffs(List<String> architecturalTradeOffs) {
        this.architecturalTradeOffs = architecturalTradeOffs;
    }

    public Map<String, String> getSuggestedTechStack() {
        return suggestedTechStack;
    }

    public void setSuggestedTechStack(Map<String, String> suggestedTechStack) {
        this.suggestedTechStack = suggestedTechStack;
    }

    public String getAlternativeArchitecture() {
        return alternativeArchitecture;
    }

    public void setAlternativeArchitecture(String alternativeArchitecture) {
        this.alternativeArchitecture = alternativeArchitecture;
    }

    public List<String> getImplementationGuidelines() {
        return implementationGuidelines;
    }

    public void setImplementationGuidelines(List<String> implementationGuidelines) {
        this.implementationGuidelines = implementationGuidelines;
    }

    public String getDiagramMermaid() {
        return diagramMermaid;
    }

    public void setDiagramMermaid(String diagramMermaid) {
        this.diagramMermaid = diagramMermaid;
    }

    public String getC4DiagramMermaid() {
        return c4DiagramMermaid;
    }

    public void setC4DiagramMermaid(String c4DiagramMermaid) {
        this.c4DiagramMermaid = c4DiagramMermaid;
    }

    public String getSequenceDiagramMermaid() {
        return sequenceDiagramMermaid;
    }

    public void setSequenceDiagramMermaid(String sequenceDiagramMermaid) {
        this.sequenceDiagramMermaid = sequenceDiagramMermaid;
    }
}
