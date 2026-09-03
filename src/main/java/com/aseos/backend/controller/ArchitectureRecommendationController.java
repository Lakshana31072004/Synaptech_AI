package com.aseos.backend.controller;

import com.aseos.backend.dto.ArchitectureRecommendationReport;
import com.aseos.backend.dto.ArchitectureRecommendationRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ArchitectureRecommendationController {

    @PostMapping("/recommend-architecture")
    public ResponseEntity<ArchitectureRecommendationReport> recommendArchitecture(
            @RequestBody ArchitectureRecommendationRequest request) {

        String projectType = Optional.ofNullable(request.getProjectType()).orElse("Web Application").toLowerCase();
        String scalability = Optional.ofNullable(request.getScalabilityRequirement()).orElse("Medium").toLowerCase();
        String latency = Optional.ofNullable(request.getLatencyRequirement()).orElse("Standard (<500ms)").toLowerCase();
        int teamSize = request.getTeamSize() > 0 ? request.getTeamSize() : 5;
        String deployment = Optional.ofNullable(request.getDeploymentTarget()).orElse("Cloud (AWS/GCP/Azure)").toLowerCase();

        String recommendedArch;
        int confidence;
        String summary;
        List<String> benefits = new ArrayList<>();
        List<String> tradeOffs = new ArrayList<>();
        Map<String, String> techStack = new LinkedHashMap<>();
        String alternativeArch;
        List<String> guidelines = new ArrayList<>();

        if (projectType.contains("iot") || latency.contains("low latency") || projectType.contains("real-time")) {
            recommendedArch = "Event-Driven Microservices Architecture";
            confidence = 94;
            summary = "Designed for high-throughput, asynchronous event streaming with decoupled producer-consumer subsystems.";
            benefits.add("Extremely low latency message brokering and asynchronous processing.");
            benefits.add("Independent horizontal scaling of bottleneck services under burst load.");
            benefits.add("Fault tolerance: failure in one consumer does not cascade to ingress traffic.");
            tradeOffs.add("Increased operational complexity managing message brokers and distributed tracing.");
            tradeOffs.add("Eventual consistency requires idempotent consumers and compensating transactions (Saga).");
            alternativeArch = "Reactive Hexagonal Monolith";

            techStack.put("Event Broker", "Apache Kafka or RabbitMQ");
            techStack.put("Backend Services", "Spring Boot (WebFlux) / Java 21");
            techStack.put("Frontend", "React with WebSocket / SSE Streams");
            techStack.put("Persistence", "PostgreSQL + Redis Cache");
            techStack.put("Orchestration", "Kubernetes (EKS / GKE)");

            guidelines.add("Enforce schema registries (Avro/Protobuf) for event contracts.");
            guidelines.add("Implement Dead Letter Queues (DLQ) to isolate poisonous messages.");
            guidelines.add("Set up OpenTelemetry for end-to-end distributed tracing.");

        } else if (teamSize > 12 && (scalability.contains("high") || deployment.contains("kubernetes"))) {
            recommendedArch = "Domain-Driven Microservices Architecture";
            confidence = 91;
            summary = "Well-suited for large, multi-functional engineering teams requiring autonomous deployment cycles and independent service scaling.";
            benefits.add("Autonomous continuous delivery pipelines per bounded context.");
            benefits.add("Polyglot technology selection per domain if necessary.");
            benefits.add("High system resilience with localized failure blast radius.");
            tradeOffs.add("Distributed data management complexity and cross-service transaction challenges.");
            tradeOffs.add("Requires mature CI/CD, service mesh, and observability infrastructure.");
            alternativeArch = "Modular Monolith";

            techStack.put("API Gateway", "Spring Cloud Gateway / Kong");
            techStack.put("Microservices", "Spring Boot REST / gRPC");
            techStack.put("Service Discovery", "Consul / Kubernetes DNS");
            techStack.put("Database", "Database-per-service (PostgreSQL)");
            techStack.put("Observability", "Prometheus + Grafana + OpenTelemetry");

            guidelines.add("Strictly align service boundaries with Domain-Driven Design (DDD) bounded contexts.");
            guidelines.add("Use an API Gateway for authentication, rate-limiting, and routing.");
            guidelines.add("Avoid shared database tables across microservice boundaries.");

        } else if (deployment.contains("serverless")) {
            recommendedArch = "Serverless Cloud-Native Architecture";
            confidence = 88;
            summary = "Optimized for pay-per-use efficiency, zero idle infrastructure management, and auto-scaling from zero to high demand.";
            benefits.add("Zero server maintenance, automatic OS security patching, and elastic scaling.");
            benefits.add("Cost-effective for variable workloads with zero idle cost.");
            benefits.add("Rapid time-to-market using managed cloud events.");
            tradeOffs.add("Cold-start latency spikes for rarely invoked functions.");
            tradeOffs.add("Vendor lock-in with cloud provider APIs.");
            alternativeArch = "Containerized Modular Web App";

            techStack.put("Compute", "AWS Lambda / Cloud Functions");
            techStack.put("API Layer", "AWS API Gateway / Cloud Run");
            techStack.put("Data Store", "Amazon DynamoDB / Cloud Firestore");
            techStack.put("Frontend Host", "S3 / Firebase Hosting / Cloudflare");
            techStack.put("Auth", "AWS Cognito / Firebase Auth");

            guidelines.add("Keep lambda bundle sizes minimal to minimize cold-start penalty.");
            guidelines.add("Use provisioned concurrency for latency-critical user-facing endpoints.");

        } else {
            recommendedArch = "Clean Architecture / Modular Monolith";
            confidence = 95;
            summary = "Ideal choice for rapid development, tight team cohesion, low operational overhead, and high maintainability without premature distributed systems complexity.";
            benefits.add("Simplicity: single deployment artifact and unified relational database transactions (ACID).");
            benefits.add("High developer velocity: frictionless debugging, refactoring, and local setup.");
            benefits.add("Domain isolation: clearly structured layers (Domain, Application, Infrastructure, UI) enable future extraction into microservices when justified.");
            tradeOffs.add("Scales vertically or as homogenous clustered instances.");
            tradeOffs.add("Requires engineering discipline to enforce package boundaries and prevent tight coupling.");
            alternativeArch = "Layered MVC Architecture";

            techStack.put("Backend Framework", "Spring Boot 3.3 / Java 21");
            techStack.put("Architecture Style", "Hexagonal / Ports & Adapters");
            techStack.put("Frontend Framework", "React 18 (SPA)");
            techStack.put("Relational DB", "PostgreSQL with Flyway Migrations");
            techStack.put("Caching", "Redis In-Memory Cache");
            techStack.put("Containerization", "Docker & Docker Compose");

            guidelines.add("Keep Domain entities free of external framework annotations and dependencies.");
            guidelines.add("Use Application Services as entry points for use cases with DTO boundaries.");
            guidelines.add("Automate architectural boundary validation using ArchUnit in CI.");
        }

        ArchitectureRecommendationReport report = new ArchitectureRecommendationReport(
                recommendedArch, confidence, summary, benefits, tradeOffs, techStack, alternativeArch, guidelines
        );

        return ResponseEntity.ok(report);
    }
}
