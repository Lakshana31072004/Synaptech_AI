package com.snaptech.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RiskPredictionResult {
    private int riskScore;
    private String riskLevel;
    private double failureProbabilityPercent;
    private Map<String, String> factorAnalysis;
    private List<String> recommendations;

    // Research fields
    private String modelVersion;
    private Double predictedRiskScore;
    private String riskTier;
    private Double baseValue;
    private List<Double> confidenceInterval95;
    private List<Map<String, Object>> shapWaterfall;
    private String scientificDisclaimer;
    private List<String> recommendedMitigations;

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
        if (predictedRiskScore != null) {
            return predictedRiskScore.intValue();
        }
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        if (riskTier != null) {
            return riskTier.replace(" Risk", "");
        }
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
        if (factorAnalysis != null) {
            return factorAnalysis;
        }
        Map<String, String> map = new java.util.LinkedHashMap<>();
        if (shapWaterfall != null) {
            for (Map<String, Object> item : shapWaterfall) {
                map.put(String.valueOf(item.get("feature")), String.valueOf(item.get("direction")));
            }
        }
        if (map.isEmpty()) {
            map.put("velocityVariance", "Low Impact");
        }
        return map;
    }

    public void setFactorAnalysis(Map<String, String> factorAnalysis) {
        this.factorAnalysis = factorAnalysis;
    }

    public List<String> getRecommendations() {
        if (recommendedMitigations != null && !recommendedMitigations.isEmpty()) {
            return recommendedMitigations;
        }
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    @JsonProperty("model_version")
    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    @JsonProperty("predictedRiskScore")
    public Double getPredictedRiskScore() {
        return predictedRiskScore;
    }

    public void setPredictedRiskScore(Double predictedRiskScore) {
        this.predictedRiskScore = predictedRiskScore;
        if (predictedRiskScore != null) {
            this.riskScore = predictedRiskScore.intValue();
        }
    }

    @JsonProperty("riskTier")
    public String getRiskTier() {
        return riskTier;
    }

    public void setRiskTier(String riskTier) {
        this.riskTier = riskTier;
    }

    @JsonProperty("base_value")
    public Double getBaseValue() {
        return baseValue;
    }

    public void setBaseValue(Double baseValue) {
        this.baseValue = baseValue;
    }

    @JsonProperty("confidence_interval_95")
    public List<Double> getConfidenceInterval95() {
        return confidenceInterval95;
    }

    public void setConfidenceInterval95(List<Double> confidenceInterval95) {
        this.confidenceInterval95 = confidenceInterval95;
    }

    @JsonProperty("shap_waterfall")
    public List<Map<String, Object>> getShapWaterfall() {
        return shapWaterfall;
    }

    public void setShapWaterfall(List<Map<String, Object>> shapWaterfall) {
        this.shapWaterfall = shapWaterfall;
    }

    @JsonProperty("scientific_disclaimer")
    public String getScientificDisclaimer() {
        return scientificDisclaimer;
    }

    public void setScientificDisclaimer(String scientificDisclaimer) {
        this.scientificDisclaimer = scientificDisclaimer;
    }

    @JsonProperty("recommendedMitigations")
    public List<String> getRecommendedMitigations() {
        return recommendedMitigations;
    }

    public void setRecommendedMitigations(List<String> recommendedMitigations) {
        this.recommendedMitigations = recommendedMitigations;
    }
}
