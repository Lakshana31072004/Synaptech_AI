package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_metrics")
public class ProjectMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt = LocalDateTime.now();

    @Column(name = "sprint_velocity_variance")
    private double sprintVelocityVariance = 0.20;

    @Column(name = "defect_arrival_rate")
    private double defectArrivalRate = 2.5;

    @Column(name = "technical_debt_ratio")
    private double technicalDebtRatio = 0.15;

    @Column(name = "code_quality_index")
    private double codeQualityIndex = 82.0;

    @Column(name = "requirement_churn")
    private double requirementChurn = 0.08;

    @Column(name = "lines_of_code")
    private int linesOfCode = 12500;

    @Column(name = "cyclomatic_complexity")
    private double cyclomaticComplexity = 4.2;

    public ProjectMetric() {}

    public ProjectMetric(Project project, double variance, double defectRate, double debtRatio, double qualityIndex, double churn) {
        this.project = project;
        this.sprintVelocityVariance = variance;
        this.defectArrivalRate = defectRate;
        this.technicalDebtRatio = debtRatio;
        this.codeQualityIndex = qualityIndex;
        this.requirementChurn = churn;
        this.recordedAt = LocalDateTime.now();
    }

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

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public double getSprintVelocityVariance() {
        return sprintVelocityVariance;
    }

    public void setSprintVelocityVariance(double sprintVelocityVariance) {
        this.sprintVelocityVariance = sprintVelocityVariance;
    }

    public double getDefectArrivalRate() {
        return defectArrivalRate;
    }

    public void setDefectArrivalRate(double defectArrivalRate) {
        this.defectArrivalRate = defectArrivalRate;
    }

    public double getTechnicalDebtRatio() {
        return technicalDebtRatio;
    }

    public void setTechnicalDebtRatio(double technicalDebtRatio) {
        this.technicalDebtRatio = technicalDebtRatio;
    }

    public double getCodeQualityIndex() {
        return codeQualityIndex;
    }

    public void setCodeQualityIndex(double codeQualityIndex) {
        this.codeQualityIndex = codeQualityIndex;
    }

    public double getRequirementChurn() {
        return requirementChurn;
    }

    public void setRequirementChurn(double requirementChurn) {
        this.requirementChurn = requirementChurn;
    }

    public int getLinesOfCode() {
        return linesOfCode;
    }

    public void setLinesOfCode(int linesOfCode) {
        this.linesOfCode = linesOfCode;
    }

    public double getCyclomaticComplexity() {
        return cyclomaticComplexity;
    }

    public void setCyclomaticComplexity(double cyclomaticComplexity) {
        this.cyclomaticComplexity = cyclomaticComplexity;
    }
}
