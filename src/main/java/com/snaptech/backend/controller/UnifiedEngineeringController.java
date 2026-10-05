package com.snaptech.backend.controller;

import com.snaptech.backend.dto.RiskPredictionRequest;
import com.snaptech.backend.dto.RiskPredictionResult;
import com.snaptech.backend.model.*;
import com.snaptech.backend.repository.ProjectHealthRepository;
import com.snaptech.backend.repository.ProjectRepository;
import com.snaptech.backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/projects/{projectId}")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UnifiedEngineeringController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectHealthRepository projectHealthRepository;

    @Autowired
    private RequirementService requirementService;

    @Autowired
    private RiskPredictionService riskPredictionService;

    @Autowired
    private TraceabilityGraphService traceabilityGraphService;

    @Autowired
    private SimulationService simulationService;

    // --- Requirements Endpoints ---

    @GetMapping("/requirements")
    public ResponseEntity<List<Requirement>> getRequirements(@PathVariable Long projectId) {
        return ResponseEntity.ok(requirementService.getRequirementsByProject(projectId));
    }

    @PostMapping("/requirements")
    public ResponseEntity<Requirement> createRequirement(@PathVariable Long projectId, @RequestBody Requirement requirement) {
        try {
            Requirement created = requirementService.createAndAnalyzeRequirement(projectId, requirement);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- Risk Intelligence Endpoints ---

    @PostMapping("/risk/predict")
    public ResponseEntity<RiskPredictionResult> predictProjectRisk(
            @PathVariable Long projectId,
            @RequestBody RiskPredictionRequest request) {
        return projectRepository.findById(projectId).map(project -> {
            RiskPredictionResult prediction = riskPredictionService.predictRisk(request);

            // Record snapshot in ProjectHealth
            ProjectHealth health = new ProjectHealth();
            health.setProject(project);
            health.setRiskScore(prediction.getRiskScore());
            health.setBugTrend(request.getBugTrend() != null ? request.getBugTrend() : "stable");
            health.setSprintVelocity(request.getSprintVelocity());
            health.setTechnicalDebt(request.getTechnicalDebt() != null ? request.getTechnicalDebt() : "medium");
            health.setCodeQualityIndex(request.getCodeQualityIndex());
            health.setTeamProductivity(request.getSprintVelocity() >= 35 ? "high" : "medium");
            health.setProjectProgress(50);
            health.setTimestamp(LocalDateTime.now());
            projectHealthRepository.save(health);

            return ResponseEntity.ok(prediction);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/risk/history")
    public ResponseEntity<List<ProjectHealth>> getProjectRiskHistory(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectHealthRepository.findByProjectIdOrderByTimestampDesc(projectId));
    }

    // --- Traceability & Impact Endpoints ---

    @GetMapping("/traceability")
    public ResponseEntity<Map<String, Object>> getTraceabilityGraph(@PathVariable Long projectId) {
        return ResponseEntity.ok(traceabilityGraphService.getGraphData(projectId));
    }

    @PostMapping("/traceability/impact")
    public ResponseEntity<Map<String, Object>> evaluateTraceabilityImpact(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> request) {
        String rootNodeId = request.get("root_node_id");
        if (rootNodeId == null || rootNodeId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "root_node_id is required"));
        }
        return ResponseEntity.ok(traceabilityGraphService.calculateChangeImpact(projectId, rootNodeId));
    }

    // --- What-If Simulation Endpoints ---

    @PostMapping("/simulations/run")
    public ResponseEntity<Map<String, Object>> runWhatIfSimulation(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> payload) {
        String scenarioName = (String) payload.getOrDefault("scenario_name", "What-If Scenario");
        @SuppressWarnings("unchecked")
        Map<String, Object> mutation = (Map<String, Object>) payload.getOrDefault("mutation", Collections.emptyMap());

        try {
            Map<String, Object> result = simulationService.executeScenarioSimulation(projectId, scenarioName, mutation);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/simulations")
    public ResponseEntity<List<ChangeSimulation>> getProjectSimulations(@PathVariable Long projectId) {
        return ResponseEntity.ok(simulationService.getSimulationsByProject(projectId));
    }
}
