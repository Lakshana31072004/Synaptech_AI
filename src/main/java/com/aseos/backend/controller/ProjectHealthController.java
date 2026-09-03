package com.aseos.backend.controller;

import com.aseos.backend.dto.RiskPredictionRequest;
import com.aseos.backend.dto.RiskPredictionResult;
import com.aseos.backend.model.Project;
import com.aseos.backend.model.ProjectHealth;
import com.aseos.backend.repository.ProjectHealthRepository;
import com.aseos.backend.repository.ProjectRepository;
import com.aseos.backend.service.RiskPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ProjectHealthController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectHealthRepository projectHealthRepository;

    @Autowired
    private RiskPredictionService riskPredictionService;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Project saved = projectRepository.save(new Project(project.getName().trim()));

        // Create initial default health snapshot
        ProjectHealth initialHealth = new ProjectHealth();
        initialHealth.setProject(saved);
        initialHealth.setRiskScore(40);
        initialHealth.setBugTrend("stable");
        initialHealth.setSprintVelocity(30);
        initialHealth.setTechnicalDebt("medium");
        initialHealth.setCodeQualityIndex(75);
        initialHealth.setTeamProductivity("medium");
        initialHealth.setProjectProgress(10);
        initialHealth.setTimestamp(LocalDateTime.now());
        projectHealthRepository.save(initialHealth);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{projectId}/health")
    public ResponseEntity<ProjectHealth> getProjectHealth(@PathVariable Long projectId) {
        return projectHealthRepository.findTopByProjectIdOrderByTimestampDesc(projectId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{projectId}/history")
    public ResponseEntity<List<ProjectHealth>> getProjectHealthHistory(@PathVariable Long projectId) {
        List<ProjectHealth> history = projectHealthRepository.findByProjectIdOrderByTimestampDesc(projectId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{projectId}/health")
    public ResponseEntity<ProjectHealth> recordProjectHealth(@PathVariable Long projectId, @RequestBody ProjectHealth health) {
        return projectRepository.findById(projectId).map(project -> {
            health.setProject(project);
            if (health.getTimestamp() == null) {
                health.setTimestamp(LocalDateTime.now());
            }
            ProjectHealth saved = projectHealthRepository.save(health);
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/predict-risk")
    public ResponseEntity<RiskPredictionResult> predictRiskStandalone(@RequestBody RiskPredictionRequest request) {
        RiskPredictionResult result = riskPredictionService.predictRisk(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{projectId}/evaluate-risk")
    public ResponseEntity<ProjectHealth> evaluateAndSaveProjectRisk(
            @PathVariable Long projectId,
            @RequestBody RiskPredictionRequest request) {
        return projectRepository.findById(projectId).map(project -> {
            RiskPredictionResult prediction = riskPredictionService.predictRisk(request);

            ProjectHealth health = new ProjectHealth();
            health.setProject(project);
            health.setRiskScore(prediction.getRiskScore());
            health.setBugTrend(request.getBugTrend());
            health.setSprintVelocity(request.getSprintVelocity());
            health.setTechnicalDebt(request.getTechnicalDebt());
            health.setCodeQualityIndex(request.getCodeQualityIndex());
            health.setTeamProductivity(request.getSprintVelocity() >= 40 ? "high" : (request.getSprintVelocity() >= 25 ? "medium" : "low"));

            // Calculate progress increment or retention from latest snapshot
            int prevProgress = projectHealthRepository.findTopByProjectIdOrderByTimestampDesc(projectId)
                    .map(ProjectHealth::getProjectProgress)
                    .orElse(30);
            health.setProjectProgress(Math.min(100, prevProgress + 5));
            health.setTimestamp(LocalDateTime.now());

            ProjectHealth saved = projectHealthRepository.save(health);
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}