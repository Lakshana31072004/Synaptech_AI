package com.snaptech.backend.service;

import com.snaptech.backend.dto.RiskPredictionRequest;
import com.snaptech.backend.dto.RiskPredictionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;

@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final WebClient webClient;
    private final String aiServiceUrl;

    public AiServiceClient(@Value("${ai.service.url:http://localhost:5000}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
        this.webClient = WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    /**
     * Call Python AI to predict milestone delivery risk with TreeSHAP local attributions.
     */
    public Optional<RiskPredictionResult> predictRiskViaModel(RiskPredictionRequest request) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("bugTrend", request.getBugTrend() != null ? request.getBugTrend() : "stable");
            payload.put("sprintVelocity", request.getSprintVelocity());
            payload.put("technicalDebt", request.getTechnicalDebt() != null ? request.getTechnicalDebt() : "medium");
            payload.put("codeQualityIndex", request.getCodeQualityIndex());

            // Forward agile telemetry mapped dynamically from request
            double velVar = request.getSprintVelocity() >= 40 ? 0.08 : (request.getSprintVelocity() <= 20 ? 0.45 : 0.18);
            double defectRate = "increasing".equalsIgnoreCase(request.getBugTrend()) ? 3.8 : ("decreasing".equalsIgnoreCase(request.getBugTrend()) ? 0.3 : 1.1);
            double debtRatio = "high".equalsIgnoreCase(request.getTechnicalDebt()) ? 0.52 : ("low".equalsIgnoreCase(request.getTechnicalDebt()) ? 0.08 : 0.20);
            double cqIndex = (double) request.getCodeQualityIndex();
            double reqChurn = request.getSprintVelocity() >= 40 ? 0.05 : 0.30;

            payload.put("sprint_velocity_variance", velVar);
            payload.put("defect_arrival_rate", defectRate);
            payload.put("technical_debt_ratio", debtRatio);
            payload.put("code_quality_index", cqIndex);
            payload.put("requirement_churn", reqChurn);

            RiskPredictionResult response = webClient.post()
                    .uri("/api/ai/risk/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(RiskPredictionResult.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorResume(e -> {
                        log.warn("AI microservice predict-risk failed at {}: {}. Using resilient rule engine.", aiServiceUrl, e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("Failed to call AI microservice at {}: {}. Using resilient local fallback.", aiServiceUrl, ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Call Python AI for requirement classification and ISO/IEC/IEEE 29148 TCAI ambiguity scoring.
     */
    public Map<String, Object> analyzeRequirementsViaModel(String text) {
        try {
            Map<String, Object> payload = Collections.singletonMap("text", text);
            Map<String, Object> response = webClient.post()
                    .uri("/api/ai/requirements/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofSeconds(5))
                    .onErrorResume(e -> {
                        log.warn("AI requirements analysis failed: {}. Falling back to default response.", e.getMessage());
                        return Mono.just(Collections.<String, Object>emptyMap());
                    })
                    .block();

            return response != null ? response : Collections.emptyMap();
        } catch (Exception ex) {
            log.warn("AI service unavailable for requirements analysis: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Call Python AI for distance-attenuated artifact reachability and change impact score.
     */
    public Map<String, Object> evaluateTraceabilityImpact(String rootNodeId, List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("root_node_id", rootNodeId);
            payload.put("nodes", nodes != null ? nodes : Collections.emptyList());
            payload.put("edges", edges != null ? edges : Collections.emptyList());
            payload.put("attenuation_gamma", 0.75);
            payload.put("max_depth", 5);

            Map<String, Object> response = webClient.post()
                    .uri("/api/ai/traceability/impact")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofSeconds(5))
                    .onErrorResume(e -> {
                        log.warn("AI traceability impact calculation failed: {}", e.getMessage());
                        return Mono.just(Collections.<String, Object>emptyMap());
                    })
                    .block();

            return response != null ? response : Collections.emptyMap();
        } catch (Exception ex) {
            log.warn("AI service unavailable for traceability impact: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Call Python AI to run What-If counterfactual scenario simulations.
     */
    public Map<String, Object> runSimulation(Map<String, Object> baseline, Map<String, Object> mutation) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("baseline_features", baseline != null ? baseline : Collections.emptyMap());
            payload.put("mutation", mutation != null ? mutation : Collections.emptyMap());
            payload.put("mode", "delta");

            Map<String, Object> response = webClient.post()
                    .uri("/api/ai/simulation/run")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofSeconds(5))
                    .onErrorResume(e -> {
                        log.warn("AI simulation run failed: {}", e.getMessage());
                        return Mono.just(Collections.<String, Object>emptyMap());
                    })
                    .block();

            return response != null ? response : Collections.emptyMap();
        } catch (Exception ex) {
            log.warn("AI service unavailable for simulation: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }
}
