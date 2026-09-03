package com.aseos.backend.dto;

import java.util.List;

public class SprintPlanningReport {
    private int totalEstimatedStoryPoints;
    private int recommendedSprintCount;
    private int estimatedDurationWeeks;
    private double teamCapacityUtilization;
    private String riskLevel;
    private List<SprintStory> sprintBacklog;

    public static class SprintStory {
        private String id;
        private String title;
        private int storyPoints;
        private String priority;
        private int targetSprint;

        public SprintStory() {}
        public SprintStory(String id, String title, int storyPoints, String priority, int targetSprint) {
            this.id = id;
            this.title = title;
            this.storyPoints = storyPoints;
            this.priority = priority;
            this.targetSprint = targetSprint;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public int getStoryPoints() { return storyPoints; }
        public void setStoryPoints(int storyPoints) { this.storyPoints = storyPoints; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public int getTargetSprint() { return targetSprint; }
        public void setTargetSprint(int targetSprint) { this.targetSprint = targetSprint; }
    }

    public SprintPlanningReport() {}

    public SprintPlanningReport(int totalEstimatedStoryPoints, int recommendedSprintCount, int estimatedDurationWeeks,
                                double teamCapacityUtilization, String riskLevel, List<SprintStory> sprintBacklog) {
        this.totalEstimatedStoryPoints = totalEstimatedStoryPoints;
        this.recommendedSprintCount = recommendedSprintCount;
        this.estimatedDurationWeeks = estimatedDurationWeeks;
        this.teamCapacityUtilization = teamCapacityUtilization;
        this.riskLevel = riskLevel;
        this.sprintBacklog = sprintBacklog;
    }

    public int getTotalEstimatedStoryPoints() { return totalEstimatedStoryPoints; }
    public void setTotalEstimatedStoryPoints(int totalEstimatedStoryPoints) { this.totalEstimatedStoryPoints = totalEstimatedStoryPoints; }
    public int getRecommendedSprintCount() { return recommendedSprintCount; }
    public void setRecommendedSprintCount(int recommendedSprintCount) { this.recommendedSprintCount = recommendedSprintCount; }
    public int getEstimatedDurationWeeks() { return estimatedDurationWeeks; }
    public void setEstimatedDurationWeeks(int estimatedDurationWeeks) { this.estimatedDurationWeeks = estimatedDurationWeeks; }
    public double getTeamCapacityUtilization() { return teamCapacityUtilization; }
    public void setTeamCapacityUtilization(double teamCapacityUtilization) { this.teamCapacityUtilization = teamCapacityUtilization; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public List<SprintStory> getSprintBacklog() { return sprintBacklog; }
    public void setSprintBacklog(List<SprintStory> sprintBacklog) { this.sprintBacklog = sprintBacklog; }
}