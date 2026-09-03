package com.aseos.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> rootInfo() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("system", "Autonomous Software Engineering Operating System (ASEOS) - Backend API");
        response.put("message", "The Spring Boot REST API is running successfully. Please access the web application interface at http://localhost:3000");
        response.put("frontendUrl", "http://localhost:3000");
        response.put("h2ConsoleUrl", "http://localhost:8081/h2-console");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("Authentication", "POST /api/auth/login");
        endpoints.put("Project Health", "GET /api/projects");
        endpoints.put("AI Risk Simulation", "POST /api/projects/predict-risk");
        endpoints.put("Requirement Analyzer", "POST /api/analyze-requirements");
        endpoints.put("Sprint Planner", "POST /api/plan-sprint");
        endpoints.put("Architecture Advisor", "POST /api/recommend-architecture");
        response.put("apiEndpoints", endpoints);

        return ResponseEntity.ok(response);
    }
}
