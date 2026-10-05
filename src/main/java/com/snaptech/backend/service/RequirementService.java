package com.snaptech.backend.service;

import com.snaptech.backend.model.Project;
import com.snaptech.backend.model.Requirement;
import com.snaptech.backend.repository.ProjectRepository;
import com.snaptech.backend.repository.RequirementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AiServiceClient aiServiceClient;

    public List<Requirement> getRequirementsByProject(Long projectId) {
        return requirementRepository.findByProjectId(projectId);
    }

    public Requirement createAndAnalyzeRequirement(Long projectId, Requirement req) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new IllegalArgumentException("Project not found with id: " + projectId);
        }
        Project project = projectOpt.get();
        req.setProject(project);

        if (req.getReqCode() == null || req.getReqCode().trim().isEmpty()) {
            long count = requirementRepository.findByProjectId(projectId).size() + 1;
            req.setReqCode(String.format("REQ-%03d", count));
        }

        // Call Python AI Microservice for NLP Classification & Ambiguity Scoring
        Map<String, Object> aiResult = aiServiceClient.analyzeRequirementsViaModel(req.getDescription());
        if (aiResult != null && aiResult.containsKey("requirements")) {
            List<?> reqsList = (List<?>) aiResult.get("requirements");
            if (!reqsList.isEmpty() && reqsList.get(0) instanceof Map) {
                Map<?, ?> first = (Map<?, ?>) reqsList.get(0);
                if (first.get("category") != null) {
                    req.setCategory(String.valueOf(first.get("category")).toUpperCase());
                }
                if (first.get("ambiguity_score") != null) {
                    req.setAmbiguityScore(((Number) first.get("ambiguity_score")).doubleValue());
                }
                if (first.get("quality_score") != null) {
                    req.setQualityScore(((Number) first.get("quality_score")).doubleValue() / 100.0);
                }
                req.setQualityStatus(req.getAmbiguityScore() > 0.40 ? "NEEDS_REVISION" : "APPROVED");
            }
        }

        req.setCreatedAt(LocalDateTime.now());
        req.setUpdatedAt(LocalDateTime.now());
        return requirementRepository.save(req);
    }

    public Optional<Requirement> getRequirementById(Long id) {
        return requirementRepository.findById(id);
    }
}
