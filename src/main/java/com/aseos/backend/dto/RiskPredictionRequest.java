package com.aseos.backend.dto;

public class RiskPredictionRequest {
    private String bugTrend;         // "increasing", "stable", "decreasing"
    private int sprintVelocity;      // e.g. 10 to 60
    private String technicalDebt;    // "low", "medium", "high"
    private int codeQualityIndex;    // 0 to 100

    public RiskPredictionRequest() {}

    public RiskPredictionRequest(String bugTrend, int sprintVelocity, String technicalDebt, int codeQualityIndex) {
        this.bugTrend = bugTrend;
        this.sprintVelocity = sprintVelocity;
        this.technicalDebt = technicalDebt;
        this.codeQualityIndex = codeQualityIndex;
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
}
