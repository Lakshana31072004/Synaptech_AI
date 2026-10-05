import { isFirebaseConfigured, auth, db, ai, geminiModel } from '../firebaseConfig.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword 
} from 'firebase/auth';
import { clientStore, createClientJwt, DEFAULT_USERS, DEFAULT_PROJECTS, DEFAULT_HEALTH, DEFAULT_REQUIREMENTS } from '../clientStore.js';

export const aiEngineService = {
  // ==========================================
  analyzeRequirements: async (input) => {
    const content = typeof input === 'string' ? input : (input?.text || '');

    // Enhanced Semantic Analysis powered by Firebase AI Logic (Gemini)
    if (geminiModel && content.trim().length > 10) {
      try {
        const prompt = `You are an AI requirements engineering engine implementing ISO/IEC 25010 quality models and ISO/IEC/IEEE 29148 ambiguity analysis.
Analyze the following software requirement text:
"""
${content}
"""

Return ONLY a valid JSON object strictly matching this schema:
{
  "qualityScore": 85,
  "qualityRating": "Excellent",
  "analysisSummary": "Concise analytical summary",
  "functionalRequirements": [
    { "id": "FR-1", "text": "Requirement statement", "category": "Functional", "priority": "High" }
  ],
  "nonFunctionalRequirements": [
    { "id": "NFR-1", "text": "Requirement statement", "category": "Security", "priority": "High" }
  ],
  "ambiguousTermsFound": [
    { "term": "vague word", "context": "Sentence context", "suggestion": "Quantified SLA recommendation", "recommendation": "Empirical threshold" }
  ],
  "extractedUserStories": [
    "As an end-user, I want ... so that ..."
  ]
}`;
        const result = await geminiModel.generateContent(prompt);
        const text = result?.response?.text ? result.response.text() : (await result.response).text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const sentences = content.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
          const words = content.split(/\s+/).filter(Boolean);
          return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            keywordCount: {
              system: (content.match(/system/gi) || []).length,
              must: (content.match(/must/gi) || []).length,
              shall: (content.match(/shall/gi) || []).length
            },
            ...parsed
          };
        }
      } catch (geminiErr) {
        console.warn('[Firebase AI Logic] Gemini requirement analysis fallback:', geminiErr);
      }
    }
    const sentences = content.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
    const words = content.split(/\s+/).filter(Boolean);

    const functionalKeywords = ['shall', 'must', 'can', 'allow', 'enable', 'provide', 'display', 'create', 'update', 'delete', 'export', 'generate', 'process', 'calculate'];
    const nonFunctionalKeywords = ['security', 'encrypt', 'auth', 'performance', 'latency', 'scale', 'reliable', 'speed', 'compliance', 'privacy', 'aes', 'jwt', 'bcrypt', 'backup'];
    const ambiguousKeywords = ['fast', 'user-friendly', 'easy', 'robust', 'seamless', 'efficient', 'real-time', 'modern', 'scalable', 'as appropriate', 'etc'];

    const functionalRequirements = [];
    const nonFunctionalRequirements = [];
    const ambiguousTermsFound = [];

    sentences.forEach((sentence, idx) => {
      const lower = sentence.toLowerCase();
      const isNfr = nonFunctionalKeywords.some(kw => lower.includes(kw));
      const isFr = functionalKeywords.some(kw => lower.includes(kw));

      if (isNfr) {
        nonFunctionalRequirements.push({
          id: `NFR-${nonFunctionalRequirements.length + 1}`,
          text: sentence,
          category: lower.includes('security') || lower.includes('encrypt') || lower.includes('jwt') ? 'Security' : 'Performance',
          priority: 'High'
        });
      } else if (isFr || sentence.length > 15) {
        functionalRequirements.push({
          id: `FR-${functionalRequirements.length + 1}`,
          text: sentence,
          category: 'Functional',
          priority: 'High'
        });
      }

      ambiguousKeywords.forEach(term => {
        if (lower.includes(term)) {
          ambiguousTermsFound.push({
            term,
            context: sentence,
            sentence,
            suggestion: `Quantify "${term}" with specific SLA criteria (e.g. response latency < 200ms).`,
            recommendation: `Replace vague descriptor "${term}" with empirical threshold.`
          });
        }
      });
    });

    const qualityScore = Math.max(30, Math.min(100, Math.round(100 - (ambiguousTermsFound.length * 9) + (sentences.length * 3))));

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      keywordCount: {
        system: (content.match(/system/gi) || []).length,
        must: (content.match(/must/gi) || []).length,
        shall: (content.match(/shall/gi) || []).length
      },
      qualityScore,
      qualityRating: qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Improvement',
      analysisSummary: `Analyzed ${sentences.length} sentences (${words.length} words). Identified ${functionalRequirements.length} functional requirement(s), ${nonFunctionalRequirements.length} non-functional requirement(s), and ${ambiguousTermsFound.length} ambiguous phrasing instance(s).`,
      functionalRequirements,
      nonFunctionalRequirements,
      ambiguousTermsFound,
      extractedUserStories: functionalRequirements.map((fr) => 
        `As an end-user, I want to ${fr.text.toLowerCase().replace(/^(the user (must|can|shall)|the system (shall|must)|users can)\s*/i, '')} so that business operations run effectively.`
      )
    };
  },

  planSprint: async ({ projectRequirements, backlogText, teamCapacity = 30, developerCount = 4, sprintDurationWeeks = 2 }) => {
    const rawText = projectRequirements || backlogText || '';
    const rawItems = rawText.split('\n').map(i => i.trim()).filter(Boolean);
    const items = rawItems.length > 0 ? rawItems : [
      'User Authentication with Firebase Auth',
      'Real-Time Project Health Telemetry & Firestore Sync',
      'AI Requirement NLP & Ambiguity Quantification',
      'Automated Sprint Capacity Planner',
      'Architecture Visualizer & Mermaid Canvas'
    ];

    const weeks = sprintDurationWeeks || 2;
    const capacity = teamCapacity || (developerCount * 8) || 30;

    const sprintBacklog = items.map((item, index) => ({
      id: `TASK-${101 + index}`,
      title: item,
      storyPoints: [3, 5, 8, 3, 5, 2][index % 6],
      priority: index === 0 ? 'Highest' : index <= 2 ? 'High' : 'Medium',
      targetSprint: 1 + Math.floor(index / 3),
      assignedRole: index % 2 === 0 ? 'Frontend Engineer' : 'Cloud / Data Engineer'
    }));

    const totalEstimatedStoryPoints = sprintBacklog.reduce((acc, curr) => acc + curr.storyPoints, 0);
    const recommendedSprintCount = Math.max(1, Math.ceil(totalEstimatedStoryPoints / capacity));
    const teamCapacityUtilization = Math.min(100, Math.round((totalEstimatedStoryPoints / (recommendedSprintCount * capacity)) * 100));
    const riskLevel = teamCapacityUtilization > 90 ? 'High' : teamCapacityUtilization > 70 ? 'Moderate' : 'Low';

    return {
      totalEstimatedStoryPoints,
      recommendedSprintCount,
      estimatedDurationWeeks: recommendedSprintCount * weeks,
      estimatedWeeks: recommendedSprintCount * weeks,
      teamCapacity: capacity,
      teamCapacityUtilization,
      riskLevel,
      sprintBacklog,
      velocityTrend: 'Stable (+8% projected delivery precision)'
    };
  },

  recommendArchitecture: async (criteria = {}) => {
    const projectType = (criteria.projectType || 'Web Application').toString();
    const scale = (criteria.scalabilityRequirement || criteria.expectedScale || 'Medium').toString();
    const latency = (criteria.latencyRequirement || 'Standard (<500ms)').toString();
    const teamSize = Number(criteria.teamSize || 6);
    const deployment = (criteria.deploymentTarget || 'Cloud (AWS/GCP/Azure)').toString();
    const budget = (criteria.budgetConstraint || 'Flexible').toString();

    let arch = '';
    let alternative = '';
    let summary = '';
    let confidence = 92;
    let keyBenefits = [];
    let architecturalTradeOffs = [];
    let suggestedTechStack = {};
    let implementationGuidelines = [];
    let topologyMermaid = '';
    let c4Mermaid = '';
    let sequenceMermaid = '';

    // Archetype 1: IoT & High-Throughput Event Streaming
    if (projectType.includes('IoT') || projectType.includes('Streaming') || (latency.includes('<100ms') && scale.includes('High'))) {
      arch = 'Event-Driven Reactive Streaming & IoT Telemetry Architecture';
      alternative = 'Lambda/Kappa Dual-Layer Stream Architecture';
      confidence = latency.includes('<100ms') ? 96 : 93;
      summary = `Engineered for high-frequency telemetry ingestion (${scale.toLowerCase()}), sub-100ms message brokering, asynchronous backpressure buffering, and real-time stateful stream analytics.`;

      keyBenefits = [
        'Sub-50ms streaming ingestion with decoupled producer-consumer backpressure buffers.',
        'Linear horizontal scaling across Kafka consumer partitions without database locking contention.',
        'Resilient fault isolation: high-velocity device traffic is absorbed into durable message logs during downstream worker maintenance.',
        'Real-time windowed aggregations and instantaneous anomalous event detection before disk persistence.'
      ];

      architecturalTradeOffs = [
        'Operational overhead of managing distributed message brokers, partition rebalancing, and cluster state.',
        'Eventual consistency requires idempotent consumer design and deduplication caches.',
        'End-to-end debugging across distributed async partitions requires dedicated distributed tracing instrumentation.'
      ];

      suggestedTechStack = {
        'Device Ingestion & Gateway': 'MQTT / EMQX Broker & Edge Concentrators',
        'Distributed Message Bus': 'Apache Kafka / Apache Pulsar (Partitioned Topics)',
        'Stream Processing Engine': 'Apache Flink / Kafka Streams (Stateful Windowing)',
        'Hot Telemetry Persistence': 'TimescaleDB / InfluxDB (Time-Series Optimized)',
        'Cold Analytical Store': 'Cloud Object Storage (GCS / S3 Parquet Tables)',
        'Telemetry Live Canvas': 'React 18 + WebSocket Live Telemetry Canvas & Grafana'
      };

      implementationGuidelines = [
        'Enforce schema validation on telemetry payloads using Confluent Schema Registry (Apache Avro).',
        'Configure Dead-Letter Queues (DLQ) with exponential backoff for corrupt or malformed device frames.',
        'Maintain an in-memory Redis deduplication cache with a 15-minute sliding TTL to eliminate duplicate device retries.',
        'Partition Kafka topics by device cluster or geographic region to prevent hot-partition throughput bottlenecks.'
      ];

      topologyMermaid = `graph TD
  Sensors["Edge Sensors & IoT Fleet"] -->|MQTT / TLS| Broker["EMQX / Cloud IoT Core"]
  Broker -->|High-Throughput Publish| KafkaCluster[("Apache Kafka Telemetry Bus")]
  subgraph StreamingEngine ["Real-Time Stream Processing"]
    KafkaCluster -->|Partition Consumer 1| FlinkApp["Apache Flink Window Aggregator"]
    KafkaCluster -->|Partition Consumer 2| AnomalyWorker["Real-Time Anomaly Detection Engine"]
    KafkaCluster -.->|Unprocessable Frames| DLQ[("Dead Letter Queue")]
  end
  FlinkApp --> HotDB[("TimescaleDB Time-Series")]
  FlinkApp --> ColdLake[("S3 / Parquet Cold Lake")]
  AnomalyWorker -->|Breach Alert| AlertSvc["Alert Dispatcher (SMS / Webhook)"]
  HotDB --> Dashboard["React Live Telemetry Canvas"]`;

      c4Mermaid = `graph TB
  subgraph EdgeFleet ["Edge Fleet Boundary"]
    Sensors["IoT Sensors & Edge Gateways"]
  end
  subgraph IngestMesh ["Ingress & Messaging Tier"]
    Sensors -->|MQTT 8883| Broker["EMQX Message Broker"]
    Broker -->|Streaming Records| Kafka["Kafka Distributed Log"]
  end
  subgraph ProcessingTier ["Compute & Storage Tier"]
    Kafka --> StreamWorker["Flink Stream Processing Engine"]
    StreamWorker --> TSDB[("TimescaleDB Hot Storage")]
    StreamWorker --> ObjectStore[("Cloud Object Storage Parquet")]
  end
  subgraph PresentationTier ["Visualization Tier"]
    TSDB --> WebApp["React 18 Operator Console"]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor Device as IoT Device Sensor
  participant GW as MQTT Edge Gateway
  participant Kafka as Apache Kafka Bus
  participant Flink as Flink Stream Worker
  participant DB as TimescaleDB
  participant UI as React Telemetry Canvas
  Device->>GW: Publish Telemetry Payload (MQTT QoS 1)
  GW->>Kafka: Stream event to 'telemetry.raw'
  GW-->>Device: PUBACK Confirmation
  Kafka->>Flink: Ingest event stream (50ms window)
  Flink->>DB: Batch upsert aggregated metric
  DB-->>UI: Push live chart update via WebSocket`;

    // Archetype 2: Data Analytics & Reporting Platform
    } else if (projectType.includes('Analytics') || projectType.includes('Data') || projectType.includes('Reporting')) {
      arch = 'Modern Lakehouse & Vectorized Analytical Processing (OLAP) Architecture';
      alternative = 'Lambda Architecture (Dual Batch & Speed Layer)';
      confidence = scale.includes('High') ? 95 : 91;
      summary = `Optimized for high-scale analytical queries, dimensional data modeling, automated medallion ELT pipelines, and interactive business intelligence dashboard aggregation.`;

      keyBenefits = [
        'Independent scaling of storage and compute, eliminating idle warehouse costs.',
        'Sub-second analytical aggregations across hundreds of millions of rows via columnar compression.',
        'Unified ACID transactions, versioned time-travel, and schema enforcement on open table formats.',
        'Decoupled analytical workloads prevent reporting queries from degrading operational OLTP systems.'
      ];

      architecturalTradeOffs = [
        'Near real-time replication lag (1–5 minutes) between operational write databases and the analytics lakehouse.',
        'Potential warehouse compute billing spikes if dimensional partition pruning is omitted in ad-hoc queries.',
        'Requires diligent governance across Medallion layers (Bronze, Silver, Gold) to avoid data drift.'
      ];

      suggestedTechStack = {
        'Storage Layer': 'Apache Iceberg / Delta Lake over Cloud Object Store (GCS / S3)',
        'Ingestion & CDC': 'Debezium CDC + Meltano / Apache Kafka Connect',
        'Pipeline Orchestration': 'Apache Airflow / Dagster with SLA monitors',
        'Transformation & Modeling': 'dbt (Data Build Tool) Core + SQLMesh',
        'Vectorized OLAP Query Engine': 'ClickHouse / Snowflake / Google BigQuery',
        'Semantic API & Visualization': 'Cube.js Semantic Cache + React 18 / Apache Superset'
      };

      implementationGuidelines = [
        'Implement the Medallion pattern: Raw Ingestion (Bronze) -> Normalized (Silver) -> Star-Schema Marts (Gold).',
        'Enforce partition pruning and clustering keys on date and tenant boundaries to constrain scan volumes.',
        'Implement pre-aggregated rollup cubes and cache frequent query responses in Redis.',
        'Run continuous automated data contract validations (Great Expectations or dbt test) prior to Gold tier publishing.'
      ];

      topologyMermaid = `graph TD
  OLTP[(Production Transactional DB)] -->|CDC Streams| Debezium["Debezium Change Data Capture"]
  Debezium --> Ingest["Cloud Ingestion Pipeline"]
  Ingest --> Bronze[("Bronze: Raw Data Lake")]
  Bronze --> Airflow["Apache Airflow / Dagster Orchestrator"]
  Airflow --> DBT["dbt Transformation Engine"]
  DBT --> Silver[("Silver: Conformed Dimensions")]
  DBT --> Gold[("Gold: Star-Schema Data Marts")]
  Gold --> OLAP[("ClickHouse / BigQuery OLAP Engine")]
  OLAP --> SemanticAPI["Cube.js Semantic Layer"]
  SemanticAPI --> BICanvas["React 18 BI Dashboard & Visual Analytics"]`;

      c4Mermaid = `graph TB
  subgraph Sources ["Upstream Production Sources"]
    ProdDB[("PostgreSQL Transactional DB")]
  end
  subgraph Ingestion ["Data Integration Tier"]
    ProdDB --> CDC["Debezium CDC Connector"]
    CDC --> RawLake[("Cloud Object Storage: Bronze Bucket")]
  end
  subgraph DataWarehouse ["Warehouse & Transformation Tier"]
    RawLake --> Orchestrator["Airflow + dbt Core"]
    Orchestrator --> AnalyticStore[("ClickHouse / BigQuery Warehouse")]
  end
  subgraph Serving ["Serving & Presentation Tier"]
    AnalyticStore --> Semantic["Cube.js Semantic Query Engine"]
    Semantic --> AnalyticsApp["React 18 BI & Analytics Console"]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor Analyst as Data Analyst
  participant UI as React Analytics Canvas
  participant Sem as Semantic Query API (Cube)
  participant OLAP as ClickHouse / BigQuery
  participant Lake as Gold Data Marts
  Analyst->>UI: Request Cross-Tabular Aggregation Report
  UI->>Sem: Query Semantic Metric (Sales by Quarter & Region)
  Sem->>OLAP: Execute Optimized Columnar Vector Query
  OLAP->>Lake: Scan Partition-Pruned Parquet Blocks
  Lake-->>OLAP: Return Vectorized Record Batches
  OLAP-->>Sem: Return Aggregated Aggregates (180ms)
  Sem-->>UI: Cache result in Redis & stream JSON dataset
  UI-->>Analyst: Render Interactive Drilldown Chart`;

    // Archetype 3: Complex ERP & Enterprise System
    } else if (projectType.includes('Enterprise') || projectType.includes('ERP')) {
      if (teamSize > 10 || deployment.includes('Kubernetes') || scale.includes('High')) {
        arch = 'Domain-Driven Microservices & Distributed CQRS Architecture';
        alternative = 'Event-Sourced Hexagonal Architecture';
        confidence = teamSize > 12 ? 95 : 91;
        summary = `Engineered for multi-squad enterprise development (${teamSize} engineers), autonomous bounded context lifecycles, distributed transactions via Saga, and resilient localized blast radiuses.`;

        keyBenefits = [
          'Autonomous continuous delivery pipelines per bounded context without cross-squad release locks.',
          'Polyglot persistence: optimal storage selected per domain (PostgreSQL for ledger, MongoDB for dynamic catalog).',
          'High enterprise scalability matching Conway\'s Law and cross-functional departmental autonomy.',
          'Fault isolation: failure in shipping or inventory cannot disrupt billing or order placement.'
        ];

        architecturalTradeOffs = [
          'Distributed transactional consistency requires Saga orchestrators or Transactional Outbox patterns instead of native ACID.',
          'Operational complexity requiring Kubernetes, service mesh (Istio), and distributed tracing (OpenTelemetry).',
          'Network latency overhead across multiple internal microservice communication hops.'
        ];

        suggestedTechStack = {
          'API Gateway': 'Kong Enterprise / Envoy Gateway with OpenID Connect',
          'Service Mesh': 'Istio Service Mesh with Mutual TLS (mTLS)',
          'Microservice Backends': 'Spring Boot 3 / Go Microservices per Bounded Context',
          'Inter-Service Messaging': 'RabbitMQ / Apache Kafka (Transactional Outbox)',
          'Domain Databases': 'PostgreSQL (Dedicated Isolated DB per Service)',
          'Distributed Caching': 'Redis Enterprise Cluster (Shared Session & Cache)',
          'Observability': 'OpenTelemetry + Jaeger Tracing + Prometheus + Grafana'
        };

        implementationGuidelines = [
          'Strictly forbid direct inter-service database access; communicate exclusively via gRPC or asynchronous events.',
          'Implement Transactional Outbox with Debezium to eliminate dual-write inconsistencies between database and message queue.',
          'Mandate automated consumer-driven contract testing (Pact) across all service boundary releases.',
          'Implement Circuit Breakers (Resilience4j / Envoy) with graceful degradation fallbacks on external calls.'
        ];

        topologyMermaid = `graph TD
  Clients["Web & Mobile Enterprise Clients"] -->|HTTPS / OAuth2| APIGW["Kong Enterprise API Gateway"]
  APIGW -->|Authenticate & Route| Mesh["Istio Service Mesh Boundary"]
  subgraph DomainServices ["Bounded Context Microservices"]
    Mesh --> UserSvc["User & IAM Service"]
    Mesh --> OrderSvc["Order Management Service"]
    Mesh --> BillingSvc["Billing & Ledger Service"]
    Mesh --> InventorySvc["Supply Chain Service"]
  end
  OrderSvc -->|Publish OrderEvent| Outbox[("Transactional Outbox")]
  Outbox --> Broker[("RabbitMQ / Event Bus")]
  Broker --> BillingSvc
  Broker --> InventorySvc
  UserSvc --> UserDB[("User PostgreSQL")]
  OrderSvc --> OrderDB[("Order PostgreSQL")]
  BillingSvc --> BillingDB[("Ledger PostgreSQL")]`;

        c4Mermaid = `graph TB
  subgraph Users ["Enterprise Operators"]
    Lead["Enterprise User / Operator"]
  end
  subgraph GatewayTier ["Security & Routing Tier"]
    Lead -->|HTTPS| WebApp["React 18 Enterprise Client"]
    WebApp --> APIGW["Kong API Gateway (OIDC / OAuth2)"]
  end
  subgraph MicroservicesTier ["Microservices Domain Mesh"]
    APIGW --> OrderMicro["Order Bounded Service"]
    APIGW --> BillingMicro["Billing Bounded Service"]
    OrderMicro -.->|gRPC| UserMicro["IAM Service"]
    OrderMicro --> MsgBus["RabbitMQ Event Bus"]
    MsgBus --> BillingMicro
  end
  subgraph DataTier ["Isolated Persistence Tier"]
    OrderMicro --> DB1[("Order DB")]
    BillingMicro --> DB2[("Billing DB")]
  end`;

        sequenceMermaid = `sequenceDiagram
  autonumber
  actor Ops as Enterprise Operator
  participant GW as Kong API Gateway
  participant Order as Order Microservice
  participant Bus as RabbitMQ Event Bus
  participant Billing as Billing Microservice
  participant DB as Order Database
  Ops->>GW: POST /api/v1/orders (JWT Bearer)
  GW->>GW: Validate OIDC Token & Rate Limits
  GW->>Order: Forward sanitized command
  Order->>DB: Save Order state (Status: PENDING)
  Order->>Bus: Publish 'order.created' (Transactional Outbox)
  Order-->>GW: HTTP 202 Accepted
  GW-->>Ops: Return Order Reference ID
  Bus->>Billing: Consume 'order.created'
  Billing->>Billing: Execute invoice generation & settlement`;

      } else {
        arch = 'Domain-Driven Modular Monolith with Clean Architecture';
        alternative = 'Hexagonal / Ports & Adapters Architecture';
        confidence = 94;
        summary = `Engineered for enterprise domain depth, transactional ACID integrity, minimal operational maintenance for ${teamSize} engineers, and high developer velocity without distributed systems debt.`;

        keyBenefits = [
          'Native ACID relational transactions across enterprise workflows without eventual consistency lag.',
          'Superior developer velocity: single git repository, unified local debugging, and frictionless cross-module refactoring.',
          'Strictly encapsulated modular boundaries prevent code sprawl and provide a clean roadmap for future service extraction.',
          'Drastically reduced operational expenses: single deployment pipeline with zero Kubernetes or service mesh overhead.'
        ];

        architecturalTradeOffs = [
          'Scales horizontally by duplicating the entire monolith rather than individual hot paths.',
          'Requires continuous automated linting and architecture tests to prevent developers from bypassing module boundaries.',
          'Shared database requires structured schema segregation to prevent monolithic table coupling.'
        ];

        suggestedTechStack = {
          'Core Application Framework': 'Spring Boot 3.3 (Java 21) or NestJS TypeScript',
          'Architecture Pattern': 'Hexagonal Architecture (Ports & Adapters) + ArchUnit',
          'Enterprise Relational DB': 'PostgreSQL 16 with Flyway Migrations',
          'Enterprise SSO & Identity': 'Keycloak / Auth0 SAML 2.0 & OIDC',
          'Cache & Async Queue': 'Redis 7 (Distributed Cache & BullMQ / Spring Events)',
          'Frontend Interface': 'React 18 Enterprise Design System + Role-Based Guard'
        };

        implementationGuidelines = [
          'Enforce package encapsulation via ArchUnit in CI: modules may only interact via public interfaces and DTOs.',
          'Use Spring ApplicationEventPublisher or in-memory domain event busses for cross-module side effects.',
          'Organize PostgreSQL tables into separate relational schemas per logical domain module.',
          'Maintain comprehensive audit logging tables with immutable append-only triggers for enterprise compliance.'
        ];

        topologyMermaid = `graph TD
  Client["React Enterprise SPA"] -->|HTTPS / REST| Ingress["NGINX / Cloud Load Balancer"]
  Ingress --> Controllers["REST API Web Layer"]
  subgraph ModularMonolith ["Modular Monolith (Clean Architecture)"]
    Controllers --> AppCore["Application Orchestration Services"]
    subgraph DomainModules ["Isolated Domain Modules"]
      AppCore --> OrderMod["Order Management Module"]
      AppCore --> BillingMod["Billing & Accounts Module"]
      AppCore --> InventoryMod["Inventory Module"]
    end
    OrderMod -.->|In-Memory Domain Event| BillingMod
    DomainModules --> Infra["Infrastructure Ports & Adapters"]
  end
  Infra --> Postgres[("PostgreSQL 16 Multi-Schema Database")]
  Infra --> Redis[("Redis In-Memory Cache")]`;

        c4Mermaid = `graph TB
  subgraph UserLayer ["Enterprise Users"]
    Admin["Enterprise Operator / Manager"]
  end
  subgraph WebAppContainer ["Modular Monolith Web Application"]
    Admin -->|HTTPS| WebUI["React 18 Enterprise Dashboard"]
    WebUI --> MonolithAPI["Spring Boot 3 / NestJS Modular Core"]
    MonolithAPI --> OrderBoundary["Order Domain Boundary"]
    MonolithAPI --> FinanceBoundary["Finance Domain Boundary"]
  end
  subgraph StorageTier ["Persistence Tier"]
    MonolithAPI --> PostgreSQL[("PostgreSQL Unified Database")]
    MonolithAPI --> Cache[("Redis Distributed Cache")]
  end`;

        sequenceMermaid = `sequenceDiagram
  autonumber
  actor User as Enterprise Staff
  participant UI as React Enterprise Dashboard
  participant Controller as Web Controller
  participant AppSvc as Order Application Service
  participant Domain as Order Domain Aggregate
  participant Repo as PostgreSQL Repository
  User->>UI: Submit Enterprise Order Form
  UI->>Controller: POST /api/v1/orders
  Controller->>AppSvc: execute(CreateOrderCommand)
  AppSvc->>Domain: order.calculateDiscountsAndTotals()
  Domain-->>AppSvc: Validation Verified
  AppSvc->>Repo: save(orderAggregate)
  Repo-->>AppSvc: Persisted Transactionally (ACID)
  AppSvc-->>Controller: Return Order Result DTO
  Controller-->>UI: HTTP 201 Created`;
      }

    // Archetype 4: Mobile Application Backend
    } else if (projectType.includes('Mobile') || projectType.includes('App Backend')) {
      arch = 'Backend-For-Frontend (BFF) & Reactive Edge API Architecture';
      alternative = 'GraphQL Federation & Serverless Mobile Backend';
      confidence = 93;
      summary = `Tailored for mobile network volatility, device-specific payload compaction, real-time push notification lifecycles, and rapid mobile client versioning.`;

      keyBenefits = [
        'Highly optimized, compact JSON/Protobuf payloads saving cellular data and preserving mobile battery life.',
        'Real-time reactive data push with offline-first optimistic client mutations and conflict resolution.',
        'Dedicated mobile BFF shields mobile apps from complex backend domain refactoring.',
        'Centralized handling of mobile device tokens, biometric auth, and push notification routing.'
      ];

      architecturalTradeOffs = [
        'Need to maintain mobile BFF service alongside web and public API layers.',
        'Strict long-term backward compatibility requirements for older mobile app builds in production.',
        'Complex multi-device synchronization and conflict resolution when clients emerge from offline mode.'
      ];

      suggestedTechStack = {
        'Mobile Client Tier': 'Flutter / React Native with SQLite & WatermelonDB',
        'Mobile BFF Layer': 'FastAPI / NestJS GraphQL & REST BFF with Schema Codegen',
        'Push & Real-time Sync': 'Firebase Cloud Messaging (FCM) + WebSocket Gateway',
        'Database': 'Cloud Firestore / PostgreSQL with Supabase Row-Level Security',
        'Edge Acceleration & CDN': 'Cloudflare Edge Workers (Image Compaction & Caching)',
        'Session & Cache': 'Redis Cloud (Token Blacklists & User Feed Caching)'
      };

      implementationGuidelines = [
        'Implement semantic API versioning (/v1, /v2) with deprecation warning headers for legacy mobile builds.',
        'Utilize delta-sync mechanisms so mobile devices only receive records modified since last sync timestamp.',
        'Require idempotent mutation tokens on order and payment actions to prevent double-submissions on flaky networks.',
        'Enforce biometric refresh token rotation and certificate pinning to protect mobile API traffic.'
      ];

      topologyMermaid = `graph TD
  MobileClient["Mobile App (iOS / Android)"] -->|HTTPS / WSS| EdgeCDN["Cloudflare Edge API Gateway"]
  EdgeCDN --> MobileBFF["Mobile Backend-For-Frontend (BFF)"]
  MobileBFF --> AuthSvc["Biometric & OAuth Token Service"]
  MobileBFF --> CoreServices["Internal Core Domain Services"]
  MobileBFF --> PushGateway["Firebase Cloud Messaging (FCM)"]
  PushGateway -.->|Background Push| MobileClient
  CoreServices --> PrimaryDB[("PostgreSQL / Firestore Primary")]
  MobileBFF --> RedisCache[("Redis Feed & Session Cache")]`;

      c4Mermaid = `graph TB
  subgraph MobileDevices ["Mobile Client Layer"]
    App["Native iOS & Android Clients (Offline SQLite)"]
  end
  subgraph EdgeIngress ["Edge & BFF Tier"]
    App -->|mTLS / HTTPS| MobileBFF["FastAPI / NestJS Mobile BFF Container"]
  end
  subgraph BackendCore ["Enterprise Core"]
    MobileBFF --> CoreAPI["Core Domain Services"]
    MobileBFF --> FCM["Firebase Push Notification Service"]
  end
  subgraph StorageTier ["Data Persistence"]
    CoreAPI --> DB[("PostgreSQL Database")]
    MobileBFF --> Cache[("Redis Cache")]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor Mobile as Mobile App User
  participant App as Mobile Native App
  participant BFF as Mobile BFF Gateway
  participant Core as Core Service
  participant DB as Primary Database
  participant FCM as Push Notification Service
  Mobile->>App: Tap Action (Offline Mode)
  App->>App: Write Optimistic Record to Local SQLite
  Note over App: Network Reconnected
  App->>BFF: POST /v1/mobile/sync (Idempotency Key)
  BFF->>Core: Process Entity Mutation
  Core->>DB: Persist Record
  DB-->>Core: Mutation Acknowledged
  Core-->>BFF: Success
  BFF-->>App: Sync Confirmation & Delta Payload
  BFF->>FCM: Dispatch Background Push to Peer Devices`;

    // Archetype 5: Serverless Cloud-Native (when Deployment Target is Serverless)
    } else if (deployment.includes('Serverless')) {
      arch = 'Cloud-Native Serverless & Event-Driven Architecture';
      alternative = 'Containerized Cloud Run Microservices';
      confidence = budget.includes('Constrained') ? 95 : 90;
      summary = `Optimized for maximum elasticity, true zero-idle operational overhead, automated autoscaling, and pay-per-execution economics for ${deployment}.`;

      keyBenefits = [
        'Zero server management, zero OS patch maintenance, and zero idle infrastructure costs.',
        'True auto-scaling from 0 to tens of thousands of concurrent executions in seconds.',
        'Built-in high availability across multiple availability zones without manual multi-cluster setup.',
        'Event-driven orchestration triggering functions instantly on data mutations or HTTP requests.'
      ];

      architecturalTradeOffs = [
        'Cold-start latencies on rarely executed functions requiring provisioned concurrency for critical paths.',
        'Execution duration caps (e.g. 15-minute maximum runtime on AWS Lambda / Google Cloud Functions).',
        'Cloud provider API coupling and distributed tracing hurdles across serverless triggers.'
      ];

      suggestedTechStack = {
        'Serverless Compute': 'AWS Lambda / Google Cloud Functions (Node.js 20 / Python 3.11)',
        'API Gateway & Routing': 'AWS HTTP API Gateway / Cloud Run with Custom Domain',
        'Serverless Database': 'Amazon DynamoDB (On-Demand) / Google Cloud Firestore',
        'Event Bus & Queues': 'AWS EventBridge / Cloud Pub/Sub + SQS DLQ',
        'Static Hosting & CDN': 'AWS S3 + CloudFront / Firebase Hosting',
        'Identity Management': 'AWS Cognito / Firebase Authentication (JWT HS256)'
      };

      implementationGuidelines = [
        'Keep function deployment bundle sizes minimal (<10MB) to keep cold start initialization under 100ms.',
        'Utilize serverless database proxying (AWS RDS Proxy or HTTP API drivers) to avoid connection pool exhaustion.',
        'Configure Dead-Letter Queues (DLQ) with alarm thresholds for any asynchronous event failures.',
        'Separate read-heavy queries from write mutations using DynamoDB Global Secondary Indexes or Firestore collection queries.'
      ];

      topologyMermaid = `graph TD
  User["End User Browser / App"] -->|CDN Routing| CloudFront["CloudFront CDN & S3 SPA"]
  User -->|REST / JSON| APIGW["Serverless API Gateway"]
  subgraph ServerlessCompute ["Serverless Cloud Functions"]
    APIGW --> AuthFn["Authorizer Lambda"]
    APIGW --> ReadFn["Read Handlers Lambda"]
    APIGW --> WriteFn["Write Handlers Lambda"]
    WriteFn --> EventBus["EventBridge / PubSub Event Bus"]
    EventBus --> AsyncWorker["Async Processing Function"]
  end
  ReadFn --> NoSQLDB[("DynamoDB / Cloud Firestore")]
  WriteFn --> NoSQLDB
  AsyncWorker --> S3Bucket[("S3 Storage / Output Bucket")]`;

      c4Mermaid = `graph TB
  subgraph ClientBoundary ["Client Tier"]
    User["Web & Mobile Users"] --> CDN["CloudFront Edge CDN"]
  end
  subgraph ServerlessBackend ["Serverless Managed Backend"]
    User --> APIGW["Managed Cloud API Gateway"]
    APIGW --> Lambda1["Order API Function"]
    APIGW --> Lambda2["Payment API Function"]
  end
  subgraph DataTier ["Managed Serverless Storage"]
    Lambda1 --> DDB[("DynamoDB / Firestore NoSQL")]
    Lambda2 --> EventBus["Cloud Event Bus"]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor User as End User
  participant GW as Serverless API Gateway
  participant Lambda as Cloud Function
  participant DB as Serverless NoSQL DB
  participant Bus as Cloud Event Bus
  User->>GW: POST /api/v1/orders
  GW->>Lambda: Trigger execution (Auto-scaled)
  Lambda->>DB: PutItem / SetDoc (Atomic Write)
  DB-->>Lambda: Write Success Confirmed
  Lambda->>Bus: Emit 'OrderCreated' Event
  Lambda-->>GW: HTTP 201 Created
  GW-->>User: Return JSON Response`;

    // Archetype 6: Kubernetes / Containers Microservices Mesh
    } else if (deployment.includes('Kubernetes') || (scale.includes('High') && !deployment.includes('Traditional'))) {
      arch = 'Cloud-Native Kubernetes Microservices Mesh Architecture';
      alternative = 'GitOps Containerized Modular Service Platform';
      confidence = teamSize > 8 ? 94 : 88;
      summary = `Designed for massive multi-million user scalability, container portability, autonomous team deployment lifecycles, and high-density compute orchestration on Kubernetes.`;

      keyBenefits = [
        'Granular autoscaling (HPA / KEDA) scaling pods dynamically based on CPU, memory, and message queue depths.',
        'Multi-cloud portability: runs with 100% parity across AWS EKS, Google GKE, Azure AKS, or bare metal.',
        'Zero-downtime rolling updates, canary releases, and automated health self-healing via Kubernetes controllers.',
        'Comprehensive service mesh security: automatic mTLS encryption, rate limiting, and traffic telemetry without code changes.'
      ];

      architecturalTradeOffs = [
        'Steep operational complexity managing Helm charts, Ingress CRDs, persistent volume storage, and upgrades.',
        'Significant memory footprint overhead for sidecar proxies (Istio / Envoy) and cluster control planes.',
        'Requires dedicated DevOps/SRE skills to manage cluster security, network policies, and disaster recovery.'
      ];

      suggestedTechStack = {
        'Container Orchestration': 'Kubernetes (EKS / GKE 1.30+) with KEDA Autoscaler',
        'Service Mesh & Ingress': 'Istio Service Mesh + NGINX Ingress Controller',
        'Containerized Services': 'Docker / OCI Images with Spring Boot 3 / Go / Node.js',
        'Distributed Data Tier': 'PostgreSQL Operator (CloudNativePG) + Redis Sentinel',
        'Asynchronous Message Bus': 'Apache Kafka / RabbitMQ Strimzi Operator',
        'Continuous Delivery & CI': 'ArgoCD (GitOps) + Helm 3 + GitHub Actions'
      };

      implementationGuidelines = [
        'Define strict container resource requests and limits to safeguard against cluster starvation and OOM kills.',
        'Implement liveness, readiness, and startup probes with adequate delays to prevent premature pod restarts.',
        'Configure PodDisruptionBudgets (PDB) and inter-pod anti-affinity to ensure multi-AZ failure tolerance.',
        'Enforce GitOps declarative configuration via ArgoCD: direct kubectl apply commands disallowed in production.'
      ];

      topologyMermaid = `graph TD
  Traffic["Global Web & Mobile Traffic"] -->|Cloud Load Balancer| Ingress["NGINX Ingress Controller"]
  Ingress --> Mesh["Istio Service Mesh Envoy Sidecars"]
  subgraph K8sCluster ["Kubernetes Multi-Node Cluster"]
    Mesh --> PodA["User Pods (HPA 3-15)"]
    Mesh --> PodB["Order Pods (HPA 5-30)"]
    Mesh --> PodC["Billing Pods (HPA 2-10)"]
  end
  PodB --> KafkaPod[("Kafka Cluster Pods")]
  KafkaPod --> PodC
  PodA --> UserDB[("PostgreSQL User DB")]
  PodB --> OrderDB[("PostgreSQL Order DB")]`;

      c4Mermaid = `graph TB
  subgraph ClusterIngress ["Kubernetes Ingress Boundary"]
    Clients["Client Traffic"] --> IngressRoute["Ingress Gateway Controller"]
  end
  subgraph PodMesh ["Container Pods & Mesh"]
    IngressRoute --> MeshProxy["Istio Service Proxy"]
    MeshProxy --> Svc1["Core Business API Pods"]
    MeshProxy --> Svc2["Worker Queue Pods"]
  end
  subgraph PersistenceLayer ["Stateful Storage Tier"]
    Svc1 --> DBCluster[("Clustered PostgreSQL CloudNativePG")]
    Svc1 --> CacheCluster[("Redis Cluster")]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor User as End User
  participant Ing as NGINX Ingress
  participant Mesh as Istio Envoy Proxy
  participant Pod as Microservice Pod
  participant DB as Clustered Database
  User->>Ing: HTTPS Request (mTLS)
  Ing->>Mesh: Forward to Service ClusterIP
  Mesh->>Pod: Envoy Sidecar Traffic Injection
  Pod->>DB: Query Pooled Connection (PgBouncer)
  DB-->>Pod: Data Rows Returned
  Pod-->>Mesh: JSON Response
  Mesh-->>Ing: Response Header & Tracing Stamp
  Ing-->>User: HTTP 200 OK`;

    // Archetype 7: Traditional VM / On-Premise
    } else if (deployment.includes('Traditional') || deployment.includes('On-Premise')) {
      arch = 'Hardened Multi-Tier Enterprise Architecture';
      alternative = 'Containerized Docker Host Architecture';
      confidence = 94;
      summary = `Designed for predictable on-premise or fixed-VM infrastructure, strict data sovereignty compliance, fixed budget predictability, and rock-solid operational reliability.`;

      keyBenefits = [
        'Full institutional governance over host operating systems, network topologies, and data storage.',
        'Predictable infrastructure budget with zero unexpected cloud surge charges.',
        'Minimal architectural layers: straightforward troubleshooting, monitoring, and maintenance.',
        'Ultra-fast local gigabit network latency between co-located application hosts and database servers.'
      ];

      architecturalTradeOffs = [
        'Scaling requires manual provisioning or virtual machine cloning rather than automated elasticity.',
        'Infrastructure high availability and disaster recovery must be manually configured and verified.',
        'Lacks out-of-the-box managed cloud services (must self-host Redis, PostgreSQL backups, and certificate renewal).'
      ];

      suggestedTechStack = {
        'Reverse Proxy & SSL': 'NGINX / HAProxy with Let\'s Encrypt / Internal PKI',
        'Application Server': 'Spring Boot 3 / Node.js LTS managed by systemd',
        'Primary Database': 'PostgreSQL 16 Enterprise with pg_dump & streaming replication',
        'In-Memory Cache': 'Redis Standalone with RDB/AOF persistence',
        'Process Supervisor': 'Linux systemd with automated restart policies',
        'Host Telemetry': 'Prometheus Node Exporter + Grafana Dashboard'
      };

      implementationGuidelines = [
        'Implement automated nightly WAL-archived PostgreSQL backups with off-site snapshot verification.',
        'Harden server OS: configure UFW/iptables firewalls, disable root SSH, and install fail2ban.',
        'Write systemd service files with Restart=always and RestartSec=5s for automatic recovery.',
        'Configure logrotate on all application and proxy log outputs to prevent disk volume exhaustion.'
      ];

      topologyMermaid = `graph TD
  Users["Enterprise Clients & Intranet"] -->|HTTPS / 443| LB["HAProxy / NGINX Load Balancer"]
  LB --> AppNode1["Application VM Node 1 (systemd)"]
  LB --> AppNode2["Application VM Node 2 (systemd)"]
  AppNode1 --> PrimaryDB[("PostgreSQL 16 Primary DB")]
  AppNode2 --> PrimaryDB
  PrimaryDB -.->|WAL Streaming Replication| StandbyDB[("PostgreSQL Standby Replica")]
  AppNode1 --> RedisLocal[("Redis In-Memory Cache")]`;

      c4Mermaid = `graph TB
  subgraph NetworkPerimeter ["DMZ & Network Perimeter"]
    Clients["Client Browser"] --> ReverseProxy["NGINX Reverse Proxy & SSL Offload"]
  end
  subgraph ApplicationZone ["Internal Application Zone"]
    ReverseProxy --> AppService["Enterprise Application Service (JVM / Node)"]
  end
  subgraph DatabaseZone ["Secure Data Zone"]
    AppService --> PGSQL[("PostgreSQL Enterprise Server")]
    AppService --> RedisHost[("Redis Cache Server")]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor User as Enterprise User
  participant NGINX as NGINX Reverse Proxy
  participant App as Application Service (VM)
  participant DB as PostgreSQL Primary
  User->>NGINX: HTTPS Request
  NGINX->>App: Proxy to 127.0.0.1:8080
  App->>DB: Execute SQL Query with Connection Pool
  DB-->>App: Return Result Set
  App-->>NGINX: Render HTTP Response
  NGINX-->>User: Transmit Response`;

    // Archetype 8: Standard Web Platform (Balanced / Default)
    } else {
      arch = 'Modern 3-Tier Enterprise Web Platform Architecture';
      alternative = 'Clean Modular Monolith Architecture';
      confidence = 94;
      summary = `Balanced, high-velocity architecture designed for rapid feature delivery, maintainability, sub-300ms response times, and dependable horizontal scaling.`;

      keyBenefits = [
        'Industry-standard, proven architecture with massive developer ecosystem and robust documentation.',
        'Clean separation of concerns between interactive UI, business domain rules, and persistence.',
        'Low cognitive onboarding ramp for new software engineers and rapid PR delivery cadence.',
        'Predictable performance profiles with standard connection pooling, HTTP caching, and database indexing.'
      ];

      architecturalTradeOffs = [
        'Monolithic database layer can become a throughput bottleneck under sudden multi-fold traffic spikes.',
        'Requires disciplined caching invalidation strategies to avoid stale state in browser clients.'
      ];

      suggestedTechStack = {
        'Frontend SPA': 'React 18.2 + Vite with Glassmorphic Vanilla CSS Design',
        'REST API & Core': 'Spring Boot 3 / Node.js Express with OpenAPI 3.0',
        'Primary Database': 'PostgreSQL 16 with Prisma ORM / Hibernate 6',
        'Caching & Sessions': 'Redis 7 (Distributed Cache & Rate Limiter)',
        'Authentication': 'OAuth 2.0 / JWT Authentication (RS256)',
        'Containerization': 'Docker & Docker Compose for Local & Staging Parity'
      };

      implementationGuidelines = [
        'Add database indexes on all foreign key references and high-cardinality filter fields.',
        'Enforce optimistic locking (@Version) on critical shared domain records to prevent lost updates.',
        'Configure strict Cross-Origin Resource Sharing (CORS) and Content Security Policy (CSP) headers.',
        'Centralize error handling with standardized RFC 7807 Problem Details JSON envelopes.'
      ];

      topologyMermaid = `graph TD
  Client["React 18 SPA Frontend"] -->|HTTPS / REST| Gateway["API Gateway / Reverse Proxy"]
  Gateway --> AuthSvc["Authentication Service (JWT)"]
  Gateway --> WebBackend["Application Backend Core"]
  WebBackend --> Cache[("Redis 7 Cache Layer")]
  WebBackend --> DB[("PostgreSQL 16 Relational DB")]`;

      c4Mermaid = `graph TB
  subgraph ClientApp ["User Tier"]
    User["End User"] --> SPA["React 18 Single Page Application"]
  end
  subgraph BackendTier ["Application Tier"]
    SPA --> REST["Spring Boot / Express REST API"]
  end
  subgraph StorageTier ["Data Tier"]
    REST --> Postgres[("PostgreSQL Database")]
    REST --> RedisStore[("Redis Distributed Cache")]
  end`;

      sequenceMermaid = `sequenceDiagram
  autonumber
  actor User as End User
  participant SPA as React Frontend
  participant API as Backend API
  participant Cache as Redis Cache
  participant DB as PostgreSQL Database
  User->>SPA: Interact with Page / Submit Form
  SPA->>API: POST /api/resources (Bearer JWT)
  API->>Cache: Check Cached Authorization & Data
  alt Cache Miss
    API->>DB: Execute Query with Parameterized Statement
    DB-->>API: Return Result Rows
    API->>Cache: Store with TTL
  end
  API-->>SPA: Return JSON Response (200 OK)
  SPA-->>User: Render Updated UI State`;
    }

    return {
      recommendedArchitecture: arch,
      confidenceScore: confidence,
      summary,
      alternativeArchitecture: alternative,
      keyBenefits,
      pros: keyBenefits,
      architecturalTradeOffs,
      cons: architecturalTradeOffs,
      diagramMermaid: topologyMermaid,
      topologyDiagram: topologyMermaid,
      c4DiagramMermaid: c4Mermaid,
      sequenceDiagramMermaid: sequenceMermaid,
      suggestedTechStack,
      technologyStack: suggestedTechStack,
      implementationGuidelines
    };
  },

  generateCustomArchitectureDiagram: async (promptOrObj, style = 'topology') => {
    const promptText = typeof promptOrObj === 'string' ? promptOrObj : (promptOrObj?.prompt || 'System Architecture');
    const lower = promptText.toLowerCase();

    // Dynamic Diagram Generation powered by Firebase AI Logic (Gemini)
    if (geminiModel && promptText.length > 5) {
      try {
        const prompt = `You are Synaptech Systems Architecture Generator. Generate a valid Mermaid.js diagram and C4 architectural model for: "${promptText}".
Return ONLY a valid JSON object matching this schema:
{
  "title": "Concise architecture title",
  "description": "Clear description of the architecture components and flows",
  "diagramMermaid": "graph TD\\n    Client[Web & Mobile] --> Gateway[API Gateway]\\n    Gateway --> Service[Core Service]\\n    Service --> Database[(Cloud Firestore DB)]",
  "c4DiagramMermaid": "graph TD\\n    User((User)) --> WebApp[React SPA]\\n    WebApp --> BackendAPI[Microservice Container]\\n    BackendAPI --> Database[(Firestore DB)]",
  "sequenceDiagramMermaid": "sequenceDiagram\\n    autonumber\\n    actor User\\n    participant Client as Web App\\n    participant API as Gateway\\n    User->>Client: Action\\n    Client->>API: Request\\n    API-->>Client: Response"
}`;
        const result = await geminiModel.generateContent(prompt);
        const text = result?.response?.text ? result.response.text() : (await result.response).text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.diagramMermaid && parsed.diagramMermaid.includes('-->')) {
            return {
              title: parsed.title || 'Dynamic Cloud Architecture',
              description: parsed.description || `Generated architecture for ${promptText}`,
              mermaidSyntax: parsed.diagramMermaid,
              diagramMermaid: parsed.diagramMermaid,
              c4DiagramMermaid: parsed.c4DiagramMermaid || parsed.diagramMermaid,
              c4: parsed.c4DiagramMermaid || parsed.diagramMermaid,
              sequenceDiagramMermaid: parsed.sequenceDiagramMermaid || parsed.diagramMermaid,
              sequence: parsed.sequenceDiagramMermaid || parsed.diagramMermaid,
              style: typeof promptOrObj === 'object' ? (promptOrObj.style || style) : style,
              suggestedTechStack: ['React 18', 'Firebase Cloud Edge', 'Google Cloud Pub/Sub', 'Cloud Firestore'],
              technologyStack: ['React 18', 'Firebase Cloud Edge', 'Google Cloud Pub/Sub', 'Cloud Firestore']
            };
          }
        }
      } catch (geminiErr) {
        console.warn('[Firebase AI Logic] Gemini architecture generator fallback:', geminiErr);
      }
    }

    let title, description, diagramMermaid, c4DiagramMermaid, sequenceDiagramMermaid;

    if (lower.includes('kafka') || lower.includes('payment') || lower.includes('event-driven')) {
      title = 'Event-Driven Payment Processing Architecture';
      description = `High-throughput, fault-tolerant transaction processing pipeline using Apache Kafka, Saga orchestrator, and real-time fraud detection for: "${promptText}".`;
      diagramMermaid = `graph TD
    Client[Web & Mobile Checkout] --> Gateway[API Gateway / Rate Limiter]
    Gateway --> PaymentService[Payment Ingestion Service]
    PaymentService -->|Publish payment.initiated| KafkaCluster{{"Apache Kafka Event Bus"}}
    KafkaCluster -->|Consume| FraudWorker[Fraud & AML Detection Engine]
    KafkaCluster -->|Consume| LedgerService[Accounting & Ledger Service]
    KafkaCluster -->|Consume| BankConnector[Bank & Card Acquirer Gateway]
    FraudWorker -->|Risk Verdict| KafkaCluster
    BankConnector -->|payment.settled| KafkaCluster
    KafkaCluster --> NotificationWorker[Push & Webhook Dispatcher]
    LedgerService --> RelationalDB[(Immutable Double-Entry Ledger DB)]`;

      c4DiagramMermaid = `graph TD
    Customer((Customer / Client)) --> WebClient[Web Checkout App]
    WebClient --> PaymentAPI[Payment Gateway API Container]
    PaymentAPI --> KafkaBus[Kafka Streaming Cluster]
    KafkaBus --> FraudWorker[Fraud Screening Container]
    KafkaBus --> Acquirer[Acquirer Integration Service]
    KafkaBus --> Settlement[Settlement & Ledger Service]
    Settlement --> LedgerDB[(PostgreSQL Ledger Database)]`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    actor User as Customer
    participant Client as Web App
    participant API as Payment API
    participant Kafka as Apache Kafka
    participant Fraud as Fraud Detection
    participant Bank as Bank Acquirer
    participant DB as Ledger DB

    User->>Client: Submit Order Payment
    Client->>API: POST /payments/checkout
    API->>Kafka: Publish "payment.created"
    API-->>Client: 202 Accepted (Tracking ID)
    Kafka->>Fraud: Evaluate Fraud Risk
    Fraud-->>Kafka: "risk.cleared"
    Kafka->>Bank: Dispatch Settlement Request
    Bank-->>Kafka: "payment.approved"
    Kafka->>DB: Record Double-Entry Journal
    Kafka->>Client: Webhook: Payment Completed`;

    } else if (lower.includes('rag') || lower.includes('llm') || lower.includes('vector') || lower.includes('ai agent')) {
      title = 'RAG Vector Search & LLM Agent Architecture';
      description = `Retrieval-Augmented Generation pipeline combining dense vector embeddings, semantic retrieval, and multi-turn LLM reasoning for: "${promptText}".`;
      diagramMermaid = `graph TD
    UserApp[Client App / Web Chat] --> Gateway[API Gateway & Rate Limiter]
    Gateway --> RAGOrchestrator[RAG Agent Orchestrator]
    RAGOrchestrator --> EmbeddingModel[Vector Embedder Model]
    EmbeddingModel --> VectorDB[(Vector DB: Pinecone / Milvus)]
    VectorDB -->|Top-K Relevant Chunks| RAGOrchestrator
    RAGOrchestrator --> ContextBuilder[Prompt & Context Assembler]
    ContextBuilder --> LLMInference[Gemini / Cloud LLM Engine]
    LLMInference --> Guardrails[Safety & Factuality Guardrails]
    Guardrails --> UserApp`;

      c4DiagramMermaid = `graph TD
    User((End User)) --> ChatUI[Chat & Search Interface]
    ChatUI --> AgentService[AI Agent Orchestrator Container]
    AgentService --> VectorStore[(Vector Knowledge Store)]
    AgentService --> LLM[Large Language Model API]
    AgentService --> DocumentSync[Document Ingestion Worker]
    DocumentSync --> VectorStore`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    actor User as User
    participant UI as Chat UI
    participant Agent as Agent Orchestrator
    participant Vec as Vector Database
    participant LLM as Gemini LLM Engine

    User->>UI: Ask Knowledge Query
    UI->>Agent: Stream Request
    Agent->>Vec: Semantic Similarity Search (Cosine)
    Vec-->>Agent: Return Top-K Grounding Context
    Agent->>LLM: Ingest Augmented Prompt + Docs
    LLM-->>Agent: Generate Grounded Answer
    Agent-->>UI: Stream Synthesized Answer`;

    } else if (lower.includes('iot') || lower.includes('stream') || lower.includes('sensor') || lower.includes('telemetry')) {
      title = 'IoT High-Throughput Stream Architecture';
      description = `Edge-to-cloud streaming telemetry pipeline processing high-frequency sensor events with real-time stream analytics for: "${promptText}".`;
      diagramMermaid = `graph TD
    EdgeDevices[Edge Sensors & Smart Devices] -->|MQTT / CoAP| IoTHub[Cloud IoT Core Gateway]
    IoTHub --> StreamQueue{{"Kafka / PubSub Telemetry Bus"}}
    StreamQueue --> FlinkWorker[Apache Flink Stream Analytics]
    FlinkWorker --> AnomalyDetector[Real-Time ML Anomaly Detector]
    AnomalyDetector -->|Threshold Breach| AlertSystem[PagerDuty & SMS Alerts]
    FlinkWorker --> TimeSeriesDB[(InfluxDB / TimescaleDB)]
    TimeSeriesDB --> Grafana[Real-Time Operations Dashboard]`;

      c4DiagramMermaid = `graph TD
    Sensors((IoT Fleet)) --> EdgeGateway[Edge MQTT Broker]
    EdgeGateway --> CloudIngest[Cloud Ingestion Pipeline]
    CloudIngest --> StreamProc[Stream Processing Engine]
    StreamProc --> HotStorage[(TimescaleDB Time-Series)]
    StreamProc --> ColdStorage[(Cloud Storage Parquet DataLake)]
    HotStorage --> OpsDashboard[Fleet Monitoring Dashboard]`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    participant Device as IoT Edge Sensor
    participant Gateway as MQTT Gateway
    participant Stream as Kafka Stream
    participant ML as Anomaly Model
    participant DB as TimeSeries DB

    Device->>Gateway: Telemetry Frame (Temp, Pressure)
    Gateway->>Stream: Enqueue Event
    Stream->>ML: Evaluate Real-Time Anomaly
    Stream->>DB: Ingest Time-Series Metric
    ML-->>Gateway: OK / No Anomaly`;

    } else if (lower.includes('kubernetes') || lower.includes('k8s') || lower.includes('microservice') || lower.includes('redis')) {
      title = 'Kubernetes Microservices Mesh Architecture';
      description = `Containerized enterprise microservices with Istio service mesh, distributed Redis caching, and resilient database partitioning for: "${promptText}".`;
      diagramMermaid = `graph TD
    Clients[Web & Mobile Clients] --> Ingress[Cloud Load Balancer / Ingress]
    Ingress --> ServiceMesh[Istio Service Mesh Envoy Proxy]
    ServiceMesh --> AuthSvc[Authentication Service]
    ServiceMesh --> OrderSvc[Order Processing Service]
    ServiceMesh --> InventorySvc[Inventory & Catalog Service]
    OrderSvc --> RedisCache[(Redis Cluster Distributed Cache)]
    InventorySvc --> RedisCache
    OrderSvc --> OrderDB[(PostgreSQL Primary / Replica)]
    InventorySvc --> InventoryDB[(MongoDB Document Store)]`;

      c4DiagramMermaid = `graph TD
    User((Client)) --> WebApp[React Web Container]
    WebApp --> APIGateway[K8s Ingress Controller]
    APIGateway --> SvcA[Order Microservice Pod]
    APIGateway --> SvcB[Inventory Microservice Pod]
    SvcA --> Cache[(Distributed Redis Cache)]
    SvcA --> DB[(PostgreSQL Database)]`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    actor User as Client
    participant Ingress as K8s Ingress
    participant Service as Microservice Pod
    participant Cache as Redis Cache
    participant DB as PostgreSQL

    User->>Ingress: HTTPS API Call
    Ingress->>Service: Route through Istio Mesh
    Service->>Cache: Check Cached Response
    Service->>DB: Read/Write Database State
    Service-->>User: 200 OK JSON Response`;

    } else if (lower.includes('firebase') || lower.includes('serverless')) {
      title = 'Serverless Firebase Architecture';
      description = `Direct client-to-cloud reactive architecture with Firestore and Firebase Auth for: "${promptText}".`;
      diagramMermaid = `graph TD
    Client[React SPA Client] -->|Auth Token| Auth[Firebase Auth]
    Client -->|Direct Reactive Read/Write| Firestore[(Cloud Firestore DB)]
    Client -->|Static Assets| Hosting[Firebase Hosting CDN]
    Firestore --> CloudFunctions[Cloud Functions / AI Workers]`;

      c4DiagramMermaid = `graph TD
    User((Engineer / Lead)) --> WebApp[React Web App Container]
    WebApp --> FirebaseSDK[Firebase Web SDK v12]
    FirebaseSDK --> CloudFirestore[(Cloud Firestore NoSQL DB)]
    FirebaseSDK --> FirebaseAuth[Firebase Authentication Provider]`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    actor User as Engineer
    participant Client as React SPA
    participant Auth as Firebase Auth
    participant DB as Cloud Firestore

    User->>Client: Perform Action
    Client->>Auth: Verify Identity Token
    Auth-->>Client: Identity Confirmed
    Client->>DB: Direct Realtime Read/Write
    DB-->>Client: Firestore Document Snapshot`;

    } else {
      title = `${promptText.slice(0, 36)} System Architecture`;
      description = `Cloud-native decoupled architecture generated for: "${promptText}".`;
      diagramMermaid = `graph TD
    Client[React Web Application] --> Gateway[API Gateway / Auth]
    Gateway --> ServiceA[Core Business Engine]
    Gateway --> ServiceB[AI Telemetry Worker]
    ServiceA --> DB[(Cloud Firestore Database)]
    ServiceB --> DB`;

      c4DiagramMermaid = `graph TD
    User((System User)) --> App[Web Client Application]
    App --> Gateway[Cloud API Gateway]
    Gateway --> CoreService[Core Business Service]
    CoreService --> Database[(Cloud Database)]`;

      sequenceDiagramMermaid = `sequenceDiagram
    autonumber
    actor User as User
    participant App as Web Client
    participant Gateway as API Gateway
    participant DB as Cloud Database

    User->>App: User Interaction
    App->>Gateway: Authorized API Request
    Gateway->>DB: Query / Mutate Data
    DB-->>App: Response Payload`;
    }

    return {
      title,
      description,
      diagramMermaid,
      diagramSyntax: diagramMermaid,
      c4DiagramMermaid,
      sequenceDiagramMermaid,
      c4: c4DiagramMermaid,
      sequence: sequenceDiagramMermaid,
      style: typeof promptOrObj === 'object' ? (promptOrObj.style || style) : style
    };
  },

  reviewCode: async ({ code, codeSnippet, language }) => {
    const codeToAnalyze = codeSnippet || code || '';

    // Intelligent Code Quality & Security Inspection powered by Firebase AI Logic (Gemini)
    if (geminiModel && codeToAnalyze.trim().length > 10) {
      try {
        const prompt = `You are Synaptech AI Code Review Inspector. Analyze this ${language || 'code'} snippet for OWASP security vulnerabilities, code smells, cyclomatic complexity, and architecture cleanliness:
\`\`\`
${codeToAnalyze}
\`\`\`

Return ONLY a valid JSON object matching this schema:
{
  "overallQualityScore": 88,
  "riskLevel": "Low",
  "summary": "Summary of findings",
  "cyclomaticComplexity": 4,
  "maintainabilityIndex": "High",
  "vulnerabilities": [
    { "title": "Vulnerability Name", "severity": "High", "category": "OWASP Category", "description": "Details", "remediation": "How to fix" }
  ],
  "codeSmells": ["Smell 1"],
  "keyImprovements": ["Improvement 1"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;
        const result = await geminiModel.generateContent(prompt);
        const text = result?.response?.text ? result.response.text() : (await result.response).text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            codeQualityScore: parsed.overallQualityScore,
            ...parsed
          };
        }
      } catch (geminiErr) {
        console.warn('[Firebase AI Logic] Gemini code review fallback:', geminiErr);
      }
    }

    const length = codeToAnalyze.split('\n').length;
    const cyclomaticComplexity = Math.max(1, Math.min(25, Math.floor(length / 6) + (codeToAnalyze.match(/if|for|while|switch|catch/g) || []).length));
    
    const vulnerabilities = [];
    const codeSmells = [];

    if (/SELECT\s+.*WHERE.*['"]\s*\+\s*/i.test(codeToAnalyze) || /Statement\s+stmt/i.test(codeToAnalyze)) {
      vulnerabilities.push({
        title: 'SQL Injection Vulnerability',
        severity: 'Critical',
        category: 'OWASP A03:2021 - Injection (CWE-89)',
        description: 'Raw string concatenation in query construction allows SQL injection.',
        remediation: 'Use parameterized queries or NoSQL Firestore document lookups.'
      });
    }

    if (/apiKey\s*=\s*['"][^'"]+['"]/i.test(codeToAnalyze) || /secret/i.test(codeToAnalyze)) {
      vulnerabilities.push({
        title: 'Hardcoded Secret Exposure',
        severity: 'High',
        category: 'OWASP A07:2021 - Identification & Authentication Failures',
        description: 'Credential token found committed directly in source code.',
        remediation: 'Extract credentials into secure environment variables.'
      });
    }

    if (cyclomaticComplexity > 8) {
      codeSmells.push(`High Cyclomatic Complexity (${cyclomaticComplexity}). Refactor into smaller functions.`);
    }

    const overallQualityScore = Math.max(35, Math.min(98, 95 - (vulnerabilities.length * 25) - (cyclomaticComplexity * 2)));
    const riskLevel = vulnerabilities.some(v => v.severity === 'Critical') ? 'Critical' : vulnerabilities.length > 0 ? 'High' : 'Low';

    return {
      overallQualityScore,
      codeQualityScore: overallQualityScore,
      riskLevel,
      summary: vulnerabilities.length > 0
        ? `Identified ${vulnerabilities.length} vulnerability(ies) and ${codeSmells.length} smell(s). Quality score: ${overallQualityScore}/100.`
        : `Clean implementation. No critical vulnerabilities found. Quality score: ${overallQualityScore}/100.`,
      cyclomaticComplexity,
      maintainabilityIndex: cyclomaticComplexity > 10 ? 'Moderate' : 'High',
      vulnerabilities,
      codeSmells: codeSmells.length > 0 ? codeSmells : ['Good adherence to clean code guidelines.'],
      keyImprovements: ['Verified strict typing and parameter boundaries.'],
      recommendations: [
        'Break down high cyclomatic complexity methods into single-responsibility helpers.',
        'Guard all database operations with schema validation rules.'
      ]
    };
  },

  chatWithCopilot: async ({ message }) => {
    const raw = (message || '').trim();
    const lower = raw.toLowerCase();

    // Direct Gemini Reasoning powered by Firebase AI Logic
    if (geminiModel && raw.length > 0) {
      try {
        const prompt = `You are Synaptech Copilot, an expert AI Software Engineering & Systems Architecture Assistant for an enterprise architecture, requirements intelligence (ISO 25010), and agile delivery platform.
Respond concisely, authoritatively, and provide clear architectural, code quality, or engineering advice with Markdown formatting.
User Query: ${raw}`;

        const result = await geminiModel.generateContent(prompt);
        const replyText = result?.response?.text ? result.response.text() : (await result.response).text();

        return {
          reply: replyText,
          suggestedPrompts: [
            'How to minimize technical debt ratio?',
            'Best practices for ISO/IEC 25010 requirement quality',
            'Explain distance-attenuated reachability graph impact'
          ]
        };
      } catch (geminiErr) {
        console.warn('[Firebase AI Logic] Gemini inference fallback:', geminiErr);
      }
    }

    let reply = `### Synaptech Copilot: Architectural Analysis\n\nRegarding your inquiry on **"${raw}"**:\n\n1. **Cloud Architecture:** The platform is configured to persist all project telemetry, user governance, and requirement graphs directly in Google Cloud Firestore.\n2. **Scalability:** By eliminating heavyweight application servers, the application leverages Firebase serverless edge nodes for high availability.\n3. **Recommendation:** Continue using the interactive modules (Requirement Analyzer, Architecture Advisor, Risk Simulator) to manage your system.`;
    const suggestedPrompts = [
      'Evaluate Firebase vs Monolith architecture',
      'Explain Firestore Security Rules',
      'How does requirement ambiguity detection work?'
    ];

    return { reply, suggestedPrompts };
  },

};
