package com.aseos.backend.dto;

import java.util.List;
import java.util.Map;

public class RiskPredictionResult {
    private int riskScore;
    private String riskLevel;
    private double failureProbabilityPercent;
    private Map<String, String> factorAnalysis;
    private List<String> recommendations;

    public RiskPredictionResult() {}

    public RiskPredictionResult(int riskScore, String riskLevel, double failureProbabilityPercent,
                                Map<String, String> factorAnalysis, List<String> recommendations) {
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.failureProbabilityPercent = failureProbabilityPercent;
        this.factorAnalysis = factorAnalysis;
        this.recommendations = recommendations;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public double getFailureProbabilityPercent() {
        return failureProbabilityPercent;
    }

    public void setFailureProbabilityPercent(double failureProbabilityPercent) {
        this.failureProbabilityPercent = failureProbabilityPercent;
    }

    public Map<String, String> getFactorAnalysis() {
        return factorAnalysis;
    }

    public void setFactorAnalysis(Map<String, String> factorAnalysis) {
        this.factorAnalysis = factorAnalysis;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }
}
