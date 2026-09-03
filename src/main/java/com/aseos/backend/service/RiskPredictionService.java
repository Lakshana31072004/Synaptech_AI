package com.aseos.backend.service;

import com.aseos.backend.dto.RiskPredictionRequest;
import com.aseos.backend.dto.RiskPredictionResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RiskPredictionService {

    public RiskPredictionResult predictRisk(RiskPredictionRequest request) {
        String bugTrend = request.getBugTrend() != null ? request.getBugTrend().toLowerCase().trim() : "stable";
        int sprintVelocity = request.getSprintVelocity() > 0 ? request.getSprintVelocity() : 30;
        String techDebt = request.getTechnicalDebt() != null ? request.getTechnicalDebt().toLowerCase().trim() : "medium";
        int codeQuality = Math.max(0, Math.min(100, request.getCodeQualityIndex() > 0 ? request.getCodeQualityIndex() : 75));

        // Base risk baseline
        double risk = 48.0;
        Map<String, String> factorAnalysis = new LinkedHashMap<>();
        List<String> recommendations = new ArrayList<>();

        // 1. Bug Trend Factor
        if ("increasing".equals(bugTrend)) {
            risk += 22.0;
            factorAnalysis.put("Bug Influx Rate", "High (+22% risk) - Defects are accumulating faster than resolution.");
            recommendations.add("Institute immediate bug triage and dedicate 20% of current sprint capacity to defect stabilization.");
        } else if ("decreasing".equals(bugTrend)) {
            risk -= 15.0;
            factorAnalysis.put("Bug Influx Rate", "Favorable (-15% risk) - Active bugs are steadily declining.");
        } else {
            risk += 6.0;
            factorAnalysis.put("Bug Influx Rate", "Neutral (+6% risk) - Defect rate is steady.");
        }

        // 2. Sprint Velocity Factor
        if (sprintVelocity < 20) {
            risk += 16.0;
            factorAnalysis.put("Velocity Throughput", "Critical Delay (+16% risk) - Velocity is below minimum sustainable pace.");
            recommendations.add("Re-scope milestone commitments; current velocity indicates projected schedule slippage.");
        } else if (sprintVelocity < 30) {
            risk += 8.0;
            factorAnalysis.put("Velocity Throughput", "Moderate (+8% risk) - Story point throughput is slightly sluggish.");
        } else if (sprintVelocity > 45) {
            risk -= 12.0;
            factorAnalysis.put("Velocity Throughput", "High Performance (-12% risk) - Team delivers stories consistently.");
        } else {
            factorAnalysis.put("Velocity Throughput", "Stable (0% risk) - Velocity matches target baseline.");
        }

        // 3. Technical Debt Factor
        if ("high".equals(techDebt)) {
            risk += 24.0;
            factorAnalysis.put("Technical Debt", "Critical (+24% risk) - High architectural coupling, deprecated dependencies, and missing tests.");
            recommendations.add("Schedule a dedicated refactoring cycle to reduce architectural debt before feature rollout.");
        } else if ("medium".equals(techDebt)) {
            risk += 8.0;
            factorAnalysis.put("Technical Debt", "Moderate (+8% risk) - Manageable debt but requires scheduled maintenance.");
        } else {
            risk -= 12.0;
            factorAnalysis.put("Technical Debt", "Low (-12% risk) - Clean modular architecture with healthy maintainability.");
        }

        // 4. Code Quality Index
        double qualityDelta = ((100.0 - codeQuality) * 0.30) - 10.0;
        risk += qualityDelta;
        if (codeQuality < 65) {
            factorAnalysis.put("Code Quality Index", "Warning (" + codeQuality + "/100) - Code smell density and complexity exceed thresholds.");
            recommendations.add("Enforce automated pre-commit SonarQube / static analysis gates to halt quality regression.");
        } else if (codeQuality >= 85) {
            factorAnalysis.put("Code Quality Index", "Excellent (" + codeQuality + "/100) - Clean code with strong test coverage.");
        } else {
            factorAnalysis.put("Code Quality Index", "Acceptable (" + codeQuality + "/100) - Quality index is within standard operating parameters.");
        }

        // Bound final risk score between 5 and 98
        int finalRiskScore = (int) Math.max(5, Math.min(98, Math.round(risk)));

        String riskLevel;
        if (finalRiskScore >= 80) {
            riskLevel = "Critical";
        } else if (finalRiskScore >= 65) {
            riskLevel = "High";
        } else if (finalRiskScore >= 40) {
            riskLevel = "Moderate";
        } else {
            riskLevel = "Low";
        }

        double failureProb = Math.round((finalRiskScore * 0.92) * 10.0) / 10.0;

        if (recommendations.isEmpty()) {
            recommendations.add("Current project metrics are healthy. Maintain current automated testing and sprint cadence.");
        }

        return new RiskPredictionResult(finalRiskScore, riskLevel, failureProb, factorAnalysis, recommendations);
    }
}
