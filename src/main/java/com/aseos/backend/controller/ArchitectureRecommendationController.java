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

        String diagramMermaid;
        String c4DiagramMermaid;
        String sequenceDiagramMermaid;

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

            diagramMermaid = "graph TD\n" +
                    "    Client[Web & Mobile Clients] -->|HTTPS / WSS| Gateway[API Gateway / Ingress]\n" +
                    "    Gateway -->|Async Ingest| ProducerService[Ingestion Producer Service]\n" +
                    "    ProducerService -->|Publish Events| EventBroker[((Apache Kafka / Event Hub))]\n" +
                    "    subgraph Event Mesh & Consumer Group\n" +
                    "        EventBroker -->|Consumer Group 1| OrderProcessor[Order Event Consumer]\n" +
                    "        EventBroker -->|Consumer Group 2| InventoryService[Inventory Consumer]\n" +
                    "        EventBroker -->|Consumer Group 3| NotificationWorker[Notification Service]\n" +
                    "        EventBroker -.->|Failed Retries| DLQ[((Dead Letter Queue))]\n" +
                    "    end\n" +
                    "    OrderProcessor -->|Read/Write| OrderDB[(PostgreSQL Primary)]\n" +
                    "    OrderProcessor -->|Fast Lookups| RedisCache[(Redis Cache)]\n" +
                    "    InventoryService -->|Read/Write| InvDB[(Inventory DB)]\n";

            c4DiagramMermaid = "graph TB\n" +
                    "    subgraph User Layer\n" +
                    "        User[End User] -->|HTTPS| SPA[React Web Client]\n" +
                    "    end\n" +
                    "    subgraph Ingress & Routing Boundary\n" +
                    "        SPA -->|REST/JSON| Gateway[Cloud API Gateway]\n" +
                    "    end\n" +
                    "    subgraph Event Broker Boundary\n" +
                    "        Gateway --> Ingest[Producer Ingestion API]\n" +
                    "        Ingest --> Kafka[Kafka Topic: events.orders]\n" +
                    "        Kafka --> Svc1[Order Processing Service]\n" +
                    "        Kafka --> Svc2[Realtime Inventory Service]\n" +
                    "    end\n" +
                    "    subgraph Storage Boundary\n" +
                    "        Svc1 --> DB1[(Orders Database)]\n" +
                    "        Svc2 --> DB2[(Inventory Database)]\n" +
                    "    end\n";

            sequenceDiagramMermaid = "sequenceDiagram\n" +
                    "    autonumber\n" +
                    "    actor User as Client Application\n" +
                    "    participant GW as API Gateway\n" +
                    "    participant Ingest as Producer Service\n" +
                    "    participant Broker as Kafka Broker\n" +
                    "    participant Consumer as Order Worker\n" +
                    "    participant DB as PostgreSQL DB\n" +
                    "    User->>GW: POST /api/events (Order Placed)\n" +
                    "    GW->>Ingest: Validate Token & Payload\n" +
                    "    Ingest->>Broker: Publish event to 'orders.v1'\n" +
                    "    Ingest-->>User: HTTP 202 Accepted (Transaction Enqueued)\n" +
                    "    Broker->>Consumer: Stream message to consumer\n" +
                    "    Consumer->>DB: Persist state transactionally\n" +
                    "    Consumer-->>Broker: Commit offset ACK\n";

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

            diagramMermaid = "graph TD\n" +
                    "    Clients[Web & Mobile Clients] -->|HTTPS| APIGW[Spring Cloud API Gateway]\n" +
                    "    APIGW -->|JWT Validation| AuthService[Auth & Token Service]\n" +
                    "    subgraph Kubernetes Microservices Mesh\n" +
                    "        APIGW -->|Route /users| UserService[User Domain Service]\n" +
                    "        APIGW -->|Route /orders| OrderService[Order Domain Service]\n" +
                    "        APIGW -->|Route /billing| BillingService[Billing Domain Service]\n" +
                    "        OrderService -->|gRPC Internal| UserService\n" +
                    "        OrderService -->|gRPC Internal| BillingService\n" +
                    "    end\n" +
                    "    UserService --> UserDB[(User DB)]\n" +
                    "    OrderService --> OrderDB[(Order DB)]\n" +
                    "    BillingService --> BillingDB[(Billing DB)]\n";

            c4DiagramMermaid = "graph TB\n" +
                    "    subgraph Client Tier\n" +
                    "        C[End User] --> Web[Single Page Application]\n" +
                    "    end\n" +
                    "    subgraph Cloud Gateway Tier\n" +
                    "        Web --> GW[Spring Cloud Gateway]\n" +
                    "    end\n" +
                    "    subgraph Domain Contexts\n" +
                    "        GW --> S1[User Service: Spring Boot]\n" +
                    "        GW --> S2[Order Service: Spring Boot]\n" +
                    "        GW --> S3[Payment Service: Spring Boot]\n" +
                    "    end\n" +
                    "    subgraph Isolated Data Tier\n" +
                    "        S1 --> D1[(User PostgreSQL)]\n" +
                    "        S2 --> D2[(Order PostgreSQL)]\n" +
                    "        S3 --> D3[(Payment PostgreSQL)]\n" +
                    "    end\n";

            sequenceDiagramMermaid = "sequenceDiagram\n" +
                    "    autonumber\n" +
                    "    actor Client as Web Application\n" +
                    "    participant GW as API Gateway\n" +
                    "    participant OrderSvc as Order Service\n" +
                    "    participant UserSvc as User Service\n" +
                    "    participant DB as Order DB\n" +
                    "    Client->>GW: POST /api/orders (Bearer JWT)\n" +
                    "    GW->>GW: Verify Token & Rate Limit\n" +
                    "    GW->>OrderSvc: Forward sanitized request\n" +
                    "    OrderSvc->>UserSvc: gRPC: VerifyCustomerStatus(userId)\n" +
                    "    UserSvc-->>OrderSvc: Customer Active\n" +
                    "    OrderSvc->>DB: Save Order Record (State: Pending)\n" +
                    "    OrderSvc-->>GW: HTTP 201 Created\n" +
                    "    GW-->>Client: Return Order Response\n";

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

            diagramMermaid = "graph TD\n" +
                    "    User[End User] -->|Global CDN| CloudFront[CloudFront CDN & S3 SPA]\n" +
                    "    User -->|API Calls| HttpApi[HTTP API Gateway]\n" +
                    "    subgraph Serverless Execution Environment\n" +
                    "        HttpApi --> LambdaAuth[Lambda: Authorizer]\n" +
                    "        HttpApi --> Lambda1[Lambda: Read Handlers]\n" +
                    "        HttpApi --> Lambda2[Lambda: Write Handlers]\n" +
                    "        Lambda2 --> EventBridge[EventBridge Event Bus]\n" +
                    "        EventBridge --> AsyncLambda[Lambda: Async Worker]\n" +
                    "    end\n" +
                    "    Lambda1 --> DynamoDB[(DynamoDB NoSQL Table)]\n" +
                    "    Lambda2 --> DynamoDB\n" +
                    "    AsyncLambda --> S3Bucket[(S3 Reports Bucket)]\n";

            c4DiagramMermaid = "graph TB\n" +
                    "    subgraph Client\n" +
                    "        U[User Browser] --> CDN[CloudFront CDN]\n" +
                    "    end\n" +
                    "    subgraph Serverless Backend\n" +
                    "        U --> APIGateway[Cloud API Gateway]\n" +
                    "        APIGateway --> FN1[Auth Lambda]\n" +
                    "        APIGateway --> FN2[Core Processing Lambda]\n" +
                    "    end\n" +
                    "    subgraph Managed Cloud Storage\n" +
                    "        FN2 --> DDB[(DynamoDB Single-Table)]\n" +
                    "        FN2 --> Blob[(S3 Storage)]\n" +
                    "    end\n";

            sequenceDiagramMermaid = "sequenceDiagram\n" +
                    "    autonumber\n" +
                    "    actor User\n" +
                    "    participant CDN as Cloud CDN\n" +
                    "    participant GW as API Gateway\n" +
                    "    participant Lambda as Serverless Function\n" +
                    "    participant DDB as DynamoDB\n" +
                    "    User->>CDN: Request Web Assets\n" +
                    "    CDN-->>User: Cached Assets Returned (Edge)\n" +
                    "    User->>GW: POST /api/items (Payload)\n" +
                    "    GW->>Lambda: Invoke handler (Auto-scale)\n" +
                    "    Lambda->>DDB: PutItem (Document Record)\n" +
                    "    DDB-->>Lambda: Write Confirmed\n" +
                    "    Lambda-->>GW: HTTP 200 OK\n" +
                    "    GW-->>User: JSON Response\n";

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

            diagramMermaid = "graph TD\n" +
                    "    Client[React Web Application] -->|REST / JSON| Controllers[Web Controllers Layer]\n" +
                    "    subgraph Modular Monolith Boundary (Clean Architecture)\n" +
                    "        Controllers --> AppServices[Application Use Cases / Services]\n" +
                    "        AppServices --> DomainModel[Core Domain Entities & Business Rules]\n" +
                    "        AppServices --> OutgoingPorts[Repository & Integration Ports]\n" +
                    "        subgraph Infrastructure Adapters\n" +
                    "            OutgoingPorts --> JpaAdapter[Spring Data JPA Adapter]\n" +
                    "            OutgoingPorts --> RedisAdapter[Redis Cache Adapter]\n" +
                    "            OutgoingPorts --> MailAdapter[Notification Adapter]\n" +
                    "        end\n" +
                    "    end\n" +
                    "    JpaAdapter --> PostgreSQL[(PostgreSQL Database)]\n" +
                    "    RedisAdapter --> RedisCache[(Redis In-Memory Cache)]\n";

            c4DiagramMermaid = "graph TB\n" +
                    "    subgraph User Interaction\n" +
                    "        User[Software Engineer] --> UI[React Frontend SPA]\n" +
                    "    end\n" +
                    "    subgraph Modular Application Core\n" +
                    "        UI --> API[Spring Boot REST Controller]\n" +
                    "        API --> AppLayer[Application Services Layer]\n" +
                    "        AppLayer --> DomainLayer[Domain Core & Entities]\n" +
                    "        AppLayer --> InfraLayer[Infrastructure Layer: Persistence]\n" +
                    "    end\n" +
                    "    subgraph Storage\n" +
                    "        InfraLayer --> DB[(PostgreSQL Database)]\n" +
                    "    end\n";

            sequenceDiagramMermaid = "sequenceDiagram\n" +
                    "    autonumber\n" +
                    "    actor User\n" +
                    "    participant Controller as REST Controller\n" +
                    "    participant Service as Application Service\n" +
                    "    participant Domain as Domain Entity\n" +
                    "    participant Repo as Repository Adapter\n" +
                    "    participant DB as PostgreSQL\n" +
                    "    User->>Controller: POST /api/resources\n" +
                    "    Controller->>Service: executeUseCase(commandDto)\n" +
                    "    Service->>Domain: validateAndApplyBusinessRules()\n" +
                    "    Domain-->>Service: Validated State\n" +
                    "    Service->>Repo: save(entity)\n" +
                    "    Repo->>DB: INSERT INTO resources ...\n" +
                    "    DB-->>Repo: Saved Record\n" +
                    "    Service-->>Controller: Return Result DTO\n" +
                    "    Controller-->>User: HTTP 200 OK + Resource JSON\n";
        }

        ArchitectureRecommendationReport report = new ArchitectureRecommendationReport(
                recommendedArch, confidence, summary, benefits, tradeOffs, techStack, alternativeArch, guidelines,
                diagramMermaid, c4DiagramMermaid, sequenceDiagramMermaid
        );

        return ResponseEntity.ok(report);
    }

    @PostMapping("/generate-architecture-diagram")
    public ResponseEntity<Map<String, Object>> generateCustomArchitectureDiagram(
            @RequestBody Map<String, String> request) {

        String prompt = Optional.ofNullable(request.get("prompt")).orElse("Web application").toLowerCase();
        String style = Optional.ofNullable(request.get("style")).orElse("topology").toLowerCase();

        String diagramMermaid;
        String title;
        String description;

        if (prompt.contains("payment") || prompt.contains("stripe") || prompt.contains("checkout")) {
            title = "Secure Event-Driven Payment Gateway Pipeline";
            description = "Idempotent payment capture, third-party webhook dispatch, and asynchronous ledger reconciliation.";
            diagramMermaid = "graph TD\n" +
                    "    Customer[Checkout Client] -->|HTTPS POST| Ingress[Payment Gateway / Ingress]\n" +
                    "    Ingress -->|Tokenize & Authorize| PaymentSvc[Payment Orchestrator Service]\n" +
                    "    PaymentSvc -->|Card Tokenization| Stripe[Stripe / Adyen Payment Gateway]\n" +
                    "    PaymentSvc -->|Publish PaymentCaptured| KafkaBroker[((Kafka Event Broker))]\n" +
                    "    KafkaBroker -->|Subscribe| LedgerSvc[Financial Ledger Service]\n" +
                    "    KafkaBroker -->|Subscribe| ReceiptSvc[Customer Receipt Service]\n" +
                    "    PaymentSvc --> PaymentDB[(PostgreSQL ACID Ledger)]\n" +
                    "    LedgerSvc --> AuditLog[(Encrypted Audit DB)]\n";
        } else if (prompt.contains("ai") || prompt.contains("llm") || prompt.contains("rag")) {
            title = "RAG & LLM Augmented Agent Architecture";
            description = "Vector search embedding pipeline, semantic retriever, and LLM inference orchestrator.";
            diagramMermaid = "graph TD\n" +
                    "    User[Chat Application] -->|Prompt| APIGateway[FastAPI / Spring API Gateway]\n" +
                    "    APIGateway --> Guardrails[Prompt Safety Guardrails]\n" +
                    "    Guardrails --> EmbeddingSvc[Text Embedding Model]\n" +
                    "    EmbeddingSvc -->|Vector Query| VectorDB[(Pinecone / pgvector / Qdrant)]\n" +
                    "    VectorDB -->|Relevant Context| Orchestrator[Context Fusion & Orchestrator]\n" +
                    "    Orchestrator -->|Augmented Prompt| LLM[Gemini 1.5 Pro / LLM Engine]\n" +
                    "    LLM -->|Streaming Tokens| APIGateway\n" +
                    "    APIGateway -->|SSE Stream| User\n";
        } else if (prompt.contains("iot") || prompt.contains("telemetry") || prompt.contains("sensor")) {
            title = "High-Throughput IoT Telemetry Ingestion Pipeline";
            description = "Sub-second sensor metric aggregation, stream processing, and time-series persistence.";
            diagramMermaid = "graph TD\n" +
                    "    Sensors[Edge IoT Sensors] -->|MQTT Protocol| Broker[EMQX / MQTT Broker]\n" +
                    "    Broker --> Ingest[Kafka Telemetry Topic]\n" +
                    "    Ingest --> StreamProcessor[Apache Flink / Spark Streaming]\n" +
                    "    StreamProcessor -->|Anomaly Detected| AlertEngine[PagerDuty / Slack Alert Engine]\n" +
                    "    StreamProcessor --> TimeSeriesDB[(TimescaleDB / InfluxDB)]\n" +
                    "    TimeSeriesDB --> Dashboard[Grafana / Synaptech Telemetry]\n";
        } else {
            title = "Enterprise Cloud-Native Tiered Architecture";
            description = "High availability, decoupled tier architecture with multi-zone redundancy and distributed caching.";
            diagramMermaid = "graph TD\n" +
                    "    Clients[Web & Mobile Clients] -->|HTTPS / WAF| LoadBalancer[Cloud Load Balancer]\n" +
                    "    LoadBalancer --> AppCluster[Spring Boot Microservices Cluster]\n" +
                    "    AppCluster -->|Read-through Cache| RedisCluster[(Redis Distributed Cache)]\n" +
                    "    AppCluster -->|Read/Write Split| MasterDB[(PostgreSQL Primary)]\n" +
                    "    MasterDB -->|Replication| ReplicaDB[(PostgreSQL Read Replica)]\n" +
                    "    AppCluster --> S3Storage[(S3 Object Storage)]\n";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("title", title);
        response.put("description", description);
        response.put("diagramMermaid", diagramMermaid);

        return ResponseEntity.ok(response);
    }
}
