package com.snaptech.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.snaptech.backend.model.ChangeSimulation;
import com.snaptech.backend.model.Project;
import com.snaptech.backend.model.ProjectHealth;
import com.snaptech.backend.repository.ChangeSimulationRepository;
import com.snaptech.backend.repository.ProjectHealthRepository;
import com.snaptech.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SimulationService {

    @Autowired
    private ChangeSimulationRepository changeSimulationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectHealthRepository projectHealthRepository;

    @Autowired
    private AiServiceClient aiServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<ChangeSimulation> getSimulationsByProject(Long projectId) {
        return changeSimulationRepository.findByProjectId(projectId);
    }

    public Map<String, Object> executeScenarioSimulation(Long projectId, String scenarioName, Map<String, Object> mutation) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new IllegalArgumentException("Project not found with id: " + projectId);
        }
        Project project = projectOpt.get();

        // Retrieve current baseline telemetry snapshot
        Optional<ProjectHealth> healthOpt = projectHealthRepository.findTopByProjectIdOrderByTimestampDesc(projectId);
        Map<String, Object> baseline = new HashMap<>();
        if (healthOpt.isPresent()) {
            ProjectHealth h = healthOpt.get();
            baseline.put("sprint_velocity_variance", 0.18);
            baseline.put("defect_arrival_rate", "increasing".equalsIgnoreCase(h.getBugTrend()) ? 2.5 : 1.0);
            baseline.put("technical_debt_ratio", "high".equalsIgnoreCase(h.getTechnicalDebt()) ? 0.38 : 0.18);
            baseline.put("code_quality_index", (double) h.getCodeQualityIndex());
            baseline.put("requirement_churn", 0.12);
        } else {
            baseline.put("sprint_velocity_variance", 0.15);
            baseline.put("defect_arrival_rate", 1.2);
            baseline.put("technical_debt_ratio", 0.20);
            baseline.put("code_quality_index", 75.0);
            baseline.put("requirement_churn", 0.10);
        }

        // Call Python AI Microservice for isolated counterfactual evaluation
        Map<String, Object> simResult = aiServiceClient.runSimulation(baseline, mutation);

        double baseRisk = simResult.get("baseline_risk") != null ? ((Number) simResult.get("baseline_risk")).doubleValue() : 40.0;
        double simRisk = simResult.get("simulated_risk") != null ? ((Number) simResult.get("simulated_risk")).doubleValue() : 45.0;
        double deltaRisk = simResult.get("delta_risk") != null ? ((Number) simResult.get("delta_risk")).doubleValue() : 5.0;

        String mutationJson = "{}";
        String driversJson = "[]";
        try {
            mutationJson = objectMapper.writeValueAsString(mutation);
            if (simResult.get("top_delta_drivers") != null) {
                driversJson = objectMapper.writeValueAsString(simResult.get("top_delta_drivers"));
            }
        } catch (Exception ignored) {}

        // Persist simulation scenario audit record (baseline remains untouched!)
        ChangeSimulation cs = new ChangeSimulation(
                project,
                scenarioName != null ? scenarioName : "What-If Scenario",
                mutationJson,
                baseRisk,
                simRisk,
                deltaRisk,
                1
        );
        cs.setTopDriversJson(driversJson);
        cs.setExecutedAt(LocalDateTime.now());
        ChangeSimulation saved = changeSimulationRepository.save(cs);

        Map<String, Object> response = new HashMap<>(simResult);
        response.put("baseline_risk", baseRisk);
        response.put("simulated_risk", simRisk);
        response.put("delta_risk", deltaRisk);
        response.put("savedSimulationId", saved.getId());
        response.put("scenarioName", saved.getScenarioName());
        response.put("executedAt", saved.getExecutedAt());
        return response;
    }
}
