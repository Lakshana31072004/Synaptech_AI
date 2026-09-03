package com.aseos.backend;

import com.aseos.backend.controller.RequirementAnalyzerController;
import com.aseos.backend.controller.SprintPlannerController;
import com.aseos.backend.dto.RequirementAnalysisReport;
import com.aseos.backend.dto.RequirementAnalysisRequest;
import com.aseos.backend.dto.SprintPlanningReport;
import com.aseos.backend.dto.SprintPlanningRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private RequirementAnalyzerController requirementAnalyzerController;

    @Autowired
    private SprintPlannerController sprintPlannerController;

    @Test
    void contextLoads() {
        assertNotNull(requirementAnalyzerController);
        assertNotNull(sprintPlannerController);
    }

    @Test
    void testRequirementAnalyzer() {
        RequirementAnalysisRequest request = new RequirementAnalysisRequest();
        request.setText("The user must be able to log in to the system. The system should secure the database.");
        RequirementAnalysisReport report = requirementAnalyzerController.analyzeRequirements(request);
        assertNotNull(report);
        assertTrue(report.getWordCount() > 0);
        assertTrue(report.getSentenceCount() > 0);
        assertTrue(report.getKeywordCount().containsKey("user"));
        assertTrue(report.getKeywordCount().containsKey("system"));
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
}