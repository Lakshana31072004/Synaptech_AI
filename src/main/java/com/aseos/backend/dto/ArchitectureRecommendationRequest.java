package com.aseos.backend.dto;

public class ArchitectureRecommendationRequest {
    private String projectType;
    private String scalabilityRequirement;
    private String latencyRequirement;
    private int teamSize;
    private String deploymentTarget;
    private String budgetConstraint;

    public ArchitectureRecommendationRequest() {}

    public String getProjectType() {
        return projectType;
    }

    public void setProjectType(String projectType) {
        this.projectType = projectType;
    }

    public String getScalabilityRequirement() {
        return scalabilityRequirement;
    }

    public void setScalabilityRequirement(String scalabilityRequirement) {
        this.scalabilityRequirement = scalabilityRequirement;
    }

    public String getLatencyRequirement() {
        return latencyRequirement;
    }

    public void setLatencyRequirement(String latencyRequirement) {
        this.latencyRequirement = latencyRequirement;
    }

    public int getTeamSize() {
        return teamSize;
    }

    public void setTeamSize(int teamSize) {
        this.teamSize = teamSize;
    }

    public String getDeploymentTarget() {
        return deploymentTarget;
    }

    public void setDeploymentTarget(String deploymentTarget) {
        this.deploymentTarget = deploymentTarget;
    }

    public String getBudgetConstraint() {
        return budgetConstraint;
    }

    public void setBudgetConstraint(String budgetConstraint) {
        this.budgetConstraint = budgetConstraint;
    }
}
