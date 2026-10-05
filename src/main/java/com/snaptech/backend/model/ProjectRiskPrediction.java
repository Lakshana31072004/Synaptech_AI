package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_risk_predictions")
public class ProjectRiskPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metric_snapshot_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "project"})
    private ProjectMetric metricSnapshot;

    @Column(name = "defect_risk")
    private double defectRisk = 0.0;

    @Column(name = "agile_risk")
    private double agileRisk = 0.0;

    @Column(name = "overall_risk_score", nullable = false)
    private double overallRiskScore = 0.0;

    @Column(name = "risk_band", length = 20)
    private String riskBand = "LOW"; // LOW, MODERATE, CRITICAL

    @Column(name = "confidence_lower")
    private double confidenceLower = 0.0;

    @Column(name = "confidence_upper")
    private double confidenceUpper = 100.0;

    @Column(name = "model_version", length = 50)
    private String modelVersion = "lightgbm-risk-v1.0";

    @Column(name = "predicted_at")
    private LocalDateTime predictedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "prediction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RiskExplanation> explanations = new ArrayList<>();

    public ProjectRiskPrediction() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public ProjectMetric getMetricSnapshot() {
        return metricSnapshot;
    }

    public void setMetricSnapshot(ProjectMetric metricSnapshot) {
        this.metricSnapshot = metricSnapshot;
    }

    public double getDefectRisk() {
        return defectRisk;
    }

    public void setDefectRisk(double defectRisk) {
        this.defectRisk = defectRisk;
    }

    public double getAgileRisk() {
        return agileRisk;
    }

    public void setAgileRisk(double agileRisk) {
        this.agileRisk = agileRisk;
    }

    public double getOverallRiskScore() {
        return overallRiskScore;
    }

    public void setOverallRiskScore(double overallRiskScore) {
        this.overallRiskScore = overallRiskScore;
    }

    public String getRiskBand() {
        return riskBand;
    }

    public void setRiskBand(String riskBand) {
        this.riskBand = riskBand;
    }

    public double getConfidenceLower() {
        return confidenceLower;
    }

    public void setConfidenceLower(double confidenceLower) {
        this.confidenceLower = confidenceLower;
    }

    public double getConfidenceUpper() {
        return confidenceUpper;
    }

    public void setConfidenceUpper(double confidenceUpper) {
        this.confidenceUpper = confidenceUpper;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public LocalDateTime getPredictedAt() {
        return predictedAt;
    }

    public void setPredictedAt(LocalDateTime predictedAt) {
        this.predictedAt = predictedAt;
    }

    public List<RiskExplanation> getExplanations() {
        return explanations;
    }

    public void setExplanations(List<RiskExplanation> explanations) {
        this.explanations = explanations;
    }

    public void addExplanation(RiskExplanation explanation) {
        explanations.add(explanation);
        explanation.setPrediction(this);
    }
}
