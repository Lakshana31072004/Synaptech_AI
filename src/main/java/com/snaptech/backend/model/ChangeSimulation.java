package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "change_simulations")
public class ChangeSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @Column(name = "scenario_name", length = 255, nullable = false)
    private String scenarioName;

    @Column(name = "mutation_payload", columnDefinition = "TEXT", nullable = false)
    private String mutationPayload;

    @Column(name = "baseline_risk")
    private double baselineRisk = 0.0;

    @Column(name = "simulated_risk")
    private double simulatedRisk = 0.0;

    @Column(name = "delta_risk")
    private double deltaRisk = 0.0;

    @Column(name = "impacted_artifact_count")
    private int impactedArtifactCount = 0;

    @Column(name = "impacted_artifacts_json", columnDefinition = "TEXT")
    private String impactedArtifactsJson;

    @Column(name = "top_drivers_json", columnDefinition = "TEXT")
    private String topDriversJson;

    @Column(name = "executed_at")
    private LocalDateTime executedAt = LocalDateTime.now();

    public ChangeSimulation() {}

    public ChangeSimulation(Project project, String scenarioName, String mutationPayload, double baselineRisk, double simulatedRisk, double deltaRisk, int count) {
        this.project = project;
        this.scenarioName = scenarioName;
        this.mutationPayload = mutationPayload;
        this.baselineRisk = baselineRisk;
        this.simulatedRisk = simulatedRisk;
        this.deltaRisk = deltaRisk;
        this.impactedArtifactCount = count;
        this.executedAt = LocalDateTime.now();
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

    public String getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(String scenarioName) {
        this.scenarioName = scenarioName;
    }

    public String getMutationPayload() {
        return mutationPayload;
    }

    public void setMutationPayload(String mutationPayload) {
        this.mutationPayload = mutationPayload;
    }

    public double getBaselineRisk() {
        return baselineRisk;
    }

    public void setBaselineRisk(double baselineRisk) {
        this.baselineRisk = baselineRisk;
    }

    public double getSimulatedRisk() {
        return simulatedRisk;
    }

    public void setSimulatedRisk(double simulatedRisk) {
        this.simulatedRisk = simulatedRisk;
    }

    public double getDeltaRisk() {
        return deltaRisk;
    }

    public void setDeltaRisk(double deltaRisk) {
        this.deltaRisk = deltaRisk;
    }

    public int getImpactedArtifactCount() {
        return impactedArtifactCount;
    }

    public void setImpactedArtifactCount(int impactedArtifactCount) {
        this.impactedArtifactCount = impactedArtifactCount;
    }

    public String getImpactedArtifactsJson() {
        return impactedArtifactsJson;
    }

    public void setImpactedArtifactsJson(String impactedArtifactsJson) {
        this.impactedArtifactsJson = impactedArtifactsJson;
    }

    public String getTopDriversJson() {
        return topDriversJson;
    }

    public void setTopDriversJson(String topDriversJson) {
        this.topDriversJson = topDriversJson;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }
}
