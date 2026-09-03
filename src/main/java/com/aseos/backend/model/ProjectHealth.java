package com.aseos.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_health")
public class ProjectHealth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    private int riskScore;
    private String bugTrend;
    private int sprintVelocity;
    private String technicalDebt;
    private int codeQualityIndex;
    private String teamProductivity;
    private int projectProgress;
    private LocalDateTime timestamp;

    public ProjectHealth() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
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

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getBugTrend() {
        return bugTrend;
    }

    public void setBugTrend(String bugTrend) {
        this.bugTrend = bugTrend;
    }

    public int getSprintVelocity() {
        return sprintVelocity;
    }

    public void setSprintVelocity(int sprintVelocity) {
        this.sprintVelocity = sprintVelocity;
    }

    public String getTechnicalDebt() {
        return technicalDebt;
    }

    public void setTechnicalDebt(String technicalDebt) {
        this.technicalDebt = technicalDebt;
    }

    public int getCodeQualityIndex() {
        return codeQualityIndex;
    }

    public void setCodeQualityIndex(int codeQualityIndex) {
        this.codeQualityIndex = codeQualityIndex;
    }

    public String getTeamProductivity() {
        return teamProductivity;
    }

    public void setTeamProductivity(String teamProductivity) {
        this.teamProductivity = teamProductivity;
    }

    public int getProjectProgress() {
        return projectProgress;
    }

    public void setProjectProgress(int projectProgress) {
        this.projectProgress = projectProgress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
