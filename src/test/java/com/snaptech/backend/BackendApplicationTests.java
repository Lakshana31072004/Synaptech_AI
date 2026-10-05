package com.snaptech.backend;

import com.snaptech.backend.controller.ArchitectureRecommendationController;
import com.snaptech.backend.controller.ProjectHealthController;
import com.snaptech.backend.controller.RequirementAnalyzerController;
import com.snaptech.backend.controller.SprintPlannerController;
import com.snaptech.backend.dto.*;
import com.snaptech.backend.model.Project;
import com.snaptech.backend.service.RiskPredictionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private RequirementAnalyzerController requirementAnalyzerController;

    @Autowired
    private SprintPlannerController sprintPlannerController;

    @Autowired
    private ArchitectureRecommendationController architectureRecommendationController;

    @Autowired
    private ProjectHealthController projectHealthController;

    @Autowired
    private RiskPredictionService riskPredictionService;

    @Test
    void contextLoads() {
        assertNotNull(requirementAnalyzerController);
        assertNotNull(sprintPlannerController);
        assertNotNull(architectureRecommendationController);
        assertNotNull(projectHealthController);
        assertNotNull(riskPredictionService);
    }

    @Test
    void testRequirementAnalyzerWithAmbiguityAndClassification() {
        RequirementAnalysisRequest request = new RequirementAnalysisRequest();
        request.setText("The system must be fast and provide a user-friendly UI. The system shall encrypt all passwords using AES-256. Users can export sprint backlogs to CSV.");
        RequirementAnalysisReport report = requirementAnalyzerController.analyzeRequirements(request);
        assertNotNull(report);
        assertTrue(report.getWordCount() > 0);
        assertTrue(report.getSentenceCount() > 0);
        assertTrue(report.getQualityScore() > 0 && report.getQualityScore() <= 100);
        assertNotNull(report.getQualityRating());

        // Check functional and non-functional requirements
        assertFalse(report.getFunctionalRequirements().isEmpty());
        assertFalse(report.getNonFunctionalRequirements().isEmpty());

        // Check ambiguity detection (fast, user-friendly)
        assertFalse(report.getAmbiguousTermsFound().isEmpty());
        boolean hasFast = report.getAmbiguousTermsFound().stream().anyMatch(a -> "fast".equalsIgnoreCase(a.getTerm()));
        assertTrue(hasFast, "Expected 'fast' to be flagged as ambiguous");

        // Check extracted user stories
        assertFalse(report.getExtractedUserStories().isEmpty());
    }

    @Test
    void testSprintPlanner() {
        SprintPlanningRequest request = new SprintPlanningRequest(
                "User authentication\nProject dashboard\nAPI security",
                30,
                3,
                2
        );
        SprintPlanningReport report = sprintPlannerController.planSprint(request);
        assertNotNull(report);
        assertTrue(report.getTotalEstimatedStoryPoints() > 0);
        assertTrue(report.getRecommendedSprintCount() >= 1);
        assertEquals(3, report.getSprintBacklog().size());
    }

    @Test
    void testRiskPredictionServiceHighRisk() {
        RiskPredictionRequest request = new RiskPredictionRequest("increasing", 15, "high", 50);
        RiskPredictionResult result = riskPredictionService.predictRisk(request);
        assertNotNull(result);
        assertTrue(result.getRiskScore() >= 55, "Expected elevated risk score for critical parameters");
        assertTrue("High".equalsIgnoreCase(result.getRiskLevel()) || "Critical".equalsIgnoreCase(result.getRiskLevel()));
        assertFalse(result.getRecommendations().isEmpty());
        assertFalse(result.getFactorAnalysis().isEmpty());
    }

    @Test
    void testRiskPredictionServiceLowRisk() {
        RiskPredictionRequest request = new RiskPredictionRequest("decreasing", 50, "low", 95);
        RiskPredictionResult result = riskPredictionService.predictRisk(request);
        assertNotNull(result);
        assertTrue(result.getRiskScore() < 50, "Expected low/moderate risk score for optimal parameters");
        assertNotNull(result.getRiskLevel());
    }

    @Test
    void testArchitectureRecommendationEventDriven() {
        ArchitectureRecommendationRequest request = new ArchitectureRecommendationRequest(
                "IoT / Real-time Event Streaming",
                "High (Millions of users)",
                "Low Latency (<100ms)",
                10,
                "Kubernetes / Microservices Mesh",
                "Flexible"
        );
        ResponseEntity<ArchitectureRecommendationReport> response = architectureRecommendationController.recommendArchitecture(request);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        ArchitectureRecommendationReport report = response.getBody();
        assertNotNull(report);
        assertTrue(report.getRecommendedArchitecture().contains("Event-Driven"));
        assertTrue(report.getConfidenceScore() >= 85);
        assertFalse(report.getKeyBenefits().isEmpty());
        assertFalse(report.getArchitecturalTradeOffs().isEmpty());
        assertTrue(report.getSuggestedTechStack().containsKey("Event Broker"));
    }

    @Test
    void testArchitectureRecommendationModularMonolith() {
        ArchitectureRecommendationRequest request = new ArchitectureRecommendationRequest(
                "Enterprise Web Platform",
                "Medium",
                "Standard (<500ms)",
                4,
                "Cloud (AWS/GCP/Azure)",
                "Flexible"
        );
        ResponseEntity<ArchitectureRecommendationReport> response = architectureRecommendationController.recommendArchitecture(request);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        ArchitectureRecommendationReport report = response.getBody();
        assertNotNull(report);
        assertTrue(report.getRecommendedArchitecture().contains("Modular Monolith") || report.getRecommendedArchitecture().contains("Clean Architecture"));
    }

    @Test
    void testProjectHealthEndpoints() {
        ResponseEntity<List<Project>> projectsResp = projectHealthController.getAllProjects();
        assertNotNull(projectsResp);
        assertEquals(200, projectsResp.getStatusCode().value());
        List<Project> projects = projectsResp.getBody();
        assertNotNull(projects);
        assertFalse(projects.isEmpty(), "Expected pre-seeded projects from DataInitializer");

        Long testProjectId = projects.get(0).getId();
        RiskPredictionRequest simRequest = new RiskPredictionRequest("stable", 35, "medium", 80);
        ResponseEntity<RiskPredictionResult> standaloneRisk = projectHealthController.predictRiskStandalone(simRequest);
        assertNotNull(standaloneRisk.getBody());
        assertTrue(standaloneRisk.getBody().getRiskScore() > 0);
    }

    @Autowired
    private com.snaptech.backend.service.AdminService adminService;

    @Autowired
    private com.snaptech.backend.repository.UserRepository userRepository;

    @Autowired
    private com.snaptech.backend.service.ActivityLogService activityLogService;

    @Test
    void testDeleteUserWithAssociatedRecords() {
        // 1. Create a user to delete
        com.snaptech.backend.dto.UserDto created = adminService.createUserByAdmin("testdeleteuser", "Password@123", List.of("ROLE_USER"));
        assertNotNull(created);
        Long userId = created.getId();

        com.snaptech.backend.model.User userEntity = userRepository.findById(userId).orElseThrow();

        // 2. Attach activity logs to simulate user activity
        activityLogService.logActivity(userEntity, "LOGIN", "User logged in for testing.");
        activityLogService.logActivity(userEntity, "PROFILE_VIEW", "User viewed profile.");

        // 3. Admin deletes the user
        assertDoesNotThrow(() -> adminService.deleteUser(userId, "admin"));

        // 4. Verify user is gone
        assertTrue(userRepository.findById(userId).isEmpty(), "Deleted user should no longer exist in repository");
    }

    @Autowired
    private com.snaptech.backend.service.RequirementService requirementService;

    @Autowired
    private com.snaptech.backend.service.TraceabilityGraphService traceabilityGraphService;

    @Autowired
    private com.snaptech.backend.service.SimulationService simulationService;

    @Autowired
    private com.snaptech.backend.controller.UnifiedEngineeringController unifiedEngineeringController;

    @Test
    void testRequirementServiceCreateAndAnalyze() {
        ResponseEntity<List<Project>> projectsResp = projectHealthController.getAllProjects();
        Long testProjectId = projectsResp.getBody().get(0).getId();

        com.snaptech.backend.model.Requirement req = new com.snaptech.backend.model.Requirement();
        req.setTitle("Zero-Trust Microsegmentation");
        req.setDescription("The system shall enforce mTLS mutual authentication with sub-50ms handshake latency. The system should be fast.");
        req.setCategory("SECURITY");

        com.snaptech.backend.model.Requirement saved = requirementService.createAndAnalyzeRequirement(testProjectId, req);
        assertNotNull(saved);
        assertNotNull(saved.getId());
        assertEquals("SECURITY", saved.getCategory());
        assertTrue(saved.getQualityScore() > 0.0);
    }

    @Test
    void testTraceabilityGraphAndDistanceAttenuatedImpact() {
        ResponseEntity<List<Project>> projectsResp = projectHealthController.getAllProjects();
        Long testProjectId = projectsResp.getBody().get(0).getId();

        java.util.Map<String, Object> graph = traceabilityGraphService.getGraphData(testProjectId);
        assertNotNull(graph);
        assertTrue(graph.containsKey("nodes"));
        assertTrue(graph.containsKey("edges"));
        assertTrue(graph.containsKey("mermaidDiagram"));

        java.util.Map<String, Object> impact = traceabilityGraphService.calculateChangeImpact(testProjectId, "REQ-1");
        assertNotNull(impact);
        assertTrue(impact.containsKey("blast_radius"));
        assertTrue(impact.containsKey("impacted_artifacts"));
    }

    @Test
    void testWhatIfSimulationExecutionAndSafety() {
        ResponseEntity<List<Project>> projectsResp = projectHealthController.getAllProjects();
        Long testProjectId = projectsResp.getBody().get(0).getId();

        java.util.Map<String, Object> mutation = new java.util.HashMap<>();
        mutation.put("technical_debt_ratio", 0.25);
        mutation.put("sprint_velocity_variance", 0.10);

        java.util.Map<String, Object> simResult = simulationService.executeScenarioSimulation(testProjectId, "JUnit Stress Test", mutation);
        assertNotNull(simResult);
        assertTrue(simResult.containsKey("baseline_risk"));
        assertTrue(simResult.containsKey("simulated_risk"));
        assertTrue(simResult.containsKey("delta_risk"));
        assertTrue(simResult.containsKey("savedSimulationId"));
    }
}