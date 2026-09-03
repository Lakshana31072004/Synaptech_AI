package com.aseos.backend.dto;

public class SprintPlanningRequest {
    private String projectRequirements;
    private int teamCapacity;
    private int developerCount;
    private int sprintDurationWeeks;

    public SprintPlanningRequest() {}

    public SprintPlanningRequest(String projectRequirements, int teamCapacity, int developerCount, int sprintDurationWeeks) {
        this.projectRequirements = projectRequirements;
        this.teamCapacity = teamCapacity;
        this.developerCount = developerCount;
        this.sprintDurationWeeks = sprintDurationWeeks;
    }

    public String getProjectRequirements() { return projectRequirements; }
    public void setProjectRequirements(String projectRequirements) { this.projectRequirements = projectRequirements; }
    public int getTeamCapacity() { return teamCapacity; }
    public void setTeamCapacity(int teamCapacity) { this.teamCapacity = teamCapacity; }
    public int getDeveloperCount() { return developerCount; }
    public void setDeveloperCount(int developerCount) { this.developerCount = developerCount; }
    public int getSprintDurationWeeks() { return sprintDurationWeeks; }
    public void setSprintDurationWeeks(int sprintDurationWeeks) { this.sprintDurationWeeks = sprintDurationWeeks; }
}