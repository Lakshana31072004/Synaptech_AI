package com.aseos.backend.controller;

import com.aseos.backend.dto.SprintPlanningReport;
import com.aseos.backend.dto.SprintPlanningRequest;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SprintPlannerController {

    @PostMapping("/plan-sprint")
    public SprintPlanningReport planSprint(@RequestBody SprintPlanningRequest request) {
        String requirements = request.getProjectRequirements();
        int capacity = request.getTeamCapacity() > 0 ? request.getTeamCapacity() : 30;
        int durationWeeks = request.getSprintDurationWeeks() > 0 ? request.getSprintDurationWeeks() : 2;

        List<SprintPlanningReport.SprintStory> backlog = new ArrayList<>();
        if (requirements != null && !requirements.trim().isEmpty()) {
            String[] lines = requirements.split("\\r?\\n");
            int storyIndex = 1;
            int currentSprint = 1;
            int currentSprintPoints = 0;

            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                int points = Math.max(1, Math.min(13, (line.length() / 20) * 2 + 3));
                String priority = (storyIndex % 3 == 0) ? "Low" : ((storyIndex % 2 == 0) ? "Medium" : "High");

                if (currentSprintPoints + points > capacity) {
                    currentSprint++;
                    currentSprintPoints = 0;
                }

                backlog.add(new SprintPlanningReport.SprintStory(
                        "US-" + storyIndex,
                        line,
                        points,
                        priority,
                        currentSprint
                ));
                currentSprintPoints += points;
                storyIndex++;
            }
        }

        if (backlog.isEmpty()) {
            backlog.add(new SprintPlanningReport.SprintStory("US-1", "User Authentication and JWT Session", 5, "High", 1));
            backlog.add(new SprintPlanningReport.SprintStory("US-2", "Project Health Monitoring Dashboard", 8, "High", 1));
            backlog.add(new SprintPlanningReport.SprintStory("US-3", "AI Requirement Extraction Pipeline", 8, "Medium", 1));
            backlog.add(new SprintPlanningReport.SprintStory("US-4", "Automated Sprint Backlog Generator", 5, "Medium", 2));
            backlog.add(new SprintPlanningReport.SprintStory("US-5", "Developer Workload Optimizer", 8, "Low", 2));
        }

        int totalPoints = backlog.stream().mapToInt(SprintPlanningReport.SprintStory::getStoryPoints).sum();
        int recommendedSprintCount = (int) Math.ceil((double) totalPoints / capacity);
        int totalWeeks = recommendedSprintCount * durationWeeks;
        double utilization = Math.min(100.0, Math.round(((double) totalPoints / (recommendedSprintCount * capacity)) * 10000.0) / 100.0);
        String risk = utilization > 90 ? "High" : (utilization > 70 ? "Moderate" : "Low");

        return new SprintPlanningReport(totalPoints, recommendedSprintCount, totalWeeks, utilization, risk, backlog);
    }
}