package com.snaptech.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "risk_explanations")
public class RiskExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ProjectRiskPrediction prediction;

    @Column(name = "feature_name", length = 100, nullable = false)
    private String featureName;

    @Column(name = "shapley_value", nullable = false)
    private double shapleyValue = 0.0;

    @Column(name = "feature_value")
    private double featureValue = 0.0;

    @Column(name = "baseline_value")
    private double baselineValue = 0.0;

    @Column(length = 50)
    private String direction = "INCREASES_RISK"; // INCREASES_RISK, DECREASES_RISK

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "attribution_rank")
    private int attributionRank = 1;

    public RiskExplanation() {}

    public RiskExplanation(String featureName, double shapleyValue, double featureValue, double baselineValue, String direction, String recommendation, int rank) {
        this.featureName = featureName;
        this.shapleyValue = shapleyValue;
        this.featureValue = featureValue;
        this.baselineValue = baselineValue;
        this.direction = direction;
        this.recommendation = recommendation;
        this.attributionRank = rank;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProjectRiskPrediction getPrediction() {
        return prediction;
    }

    public void setPrediction(ProjectRiskPrediction prediction) {
        this.prediction = prediction;
    }

    public String getFeatureName() {
        return featureName;
    }

    public void setFeatureName(String featureName) {
        this.featureName = featureName;
    }

    public double getShapleyValue() {
        return shapleyValue;
    }

    public void setShapleyValue(double shapleyValue) {
        this.shapleyValue = shapleyValue;
    }

    public double getFeatureValue() {
        return featureValue;
    }

    public void setFeatureValue(double featureValue) {
        this.featureValue = featureValue;
    }

    public double getBaselineValue() {
        return baselineValue;
    }

    public void setBaselineValue(double baselineValue) {
        this.baselineValue = baselineValue;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public int getAttributionRank() {
        return attributionRank;
    }

    public void setAttributionRank(int attributionRank) {
        this.attributionRank = attributionRank;
    }
}
