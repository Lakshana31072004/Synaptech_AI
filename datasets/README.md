# Synaptech AI Platform: Benchmark Dataset Suite

This directory contains the foundational, structured datasets utilized across all 5 intelligent modules of the **Synaptech AI (ASEOS)** platform.

---

## Dataset Directory Structure

```
datasets/
├── module1_requirements_dataset.csv       # Module 1: Requirements & NLP Ambiguity Dataset
├── module2_agile_sprint_dataset.csv       # Module 2: Agile Velocity & Sprint Telemetry Dataset
├── module3_architecture_patterns_dataset.csv # Module 3: Software Architecture Patterns Dataset
├── module4_code_vulnerabilities_dataset.csv # Module 4: OWASP & Static Code Vulnerability Dataset
├── module5_project_risk_telemetry_dataset.csv # Module 5: Project Risk & Telemetry Failure Dataset
└── README.md                              # Dataset documentation and metadata
```

---

## 1. Module 1: Software Requirements & NLP Ambiguity Dataset
* **File:** [`module1_requirements_dataset.csv`](./module1_requirements_dataset.csv)
* **Standard:** Conforms to **IEEE 830 / ISO/IEC/IEEE 29148** and the **PROMISE NFR Classification** corpus.
* **Columns:**
  * `requirement_id`: Unique identifier (e.g. `REQ-001`)
  * `project_domain`: Domain context (E-Commerce, FinTech, Healthcare, IoT, ERP)
  * `requirement_text`: Raw natural language specification sentence
  * `category`: Functional (F) vs Non-Functional Subcategory (Security, Performance, Usability, Scalability, Fault Tolerance)
  * `classification`: Bounded system capability
  * `ambiguity_detected`: Boolean flag indicating vague adjectives (*"fast"*, *"user-friendly"*, *"robust"*)
  * `risk_level`: Evaluated requirement ambiguity risk (Low, Medium, High)

---

## 2. Module 2: Agile Sprint Velocity & Capacity Dataset
* **File:** [`module2_agile_sprint_dataset.csv`](./module2_agile_sprint_dataset.csv)
* **Standard:** Derived from open-source Jira Agile sprint tracking (Apache, Eclipse, Spring projects).
* **Columns:**
  * `sprint_id`: Sprint reference code (e.g. `SPR-101`)
  * `team_id`: Engineering squad identifier
  * `sprint_number`: Incremental iteration index
  * `planned_story_points`: Estimated backlog size committed at sprint kickoff
  * `completed_story_points`: Verified story points accepted at sprint review
  * `velocity_throughput`: Realized team velocity (points/sprint)
  * `spillover_points`: Incomplete story points pushed to subsequent iteration
  * `team_capacity_hours`: Total engineering hours available
  * `defect_count`: Bugs logged during the active sprint window
  * `velocity_health`: Qualitative sprint stability status

---

## 3. Module 3: Software Architecture Recommendation Dataset
* **File:** [`module3_architecture_patterns_dataset.csv`](./module3_architecture_patterns_dataset.csv)
* **Standard:** Conforms to **Software Engineering Institute (SEI) Attribute-Driven Design (ADD)** and **Martin Fowler Architecture Patterns**.
* **Columns:**
  * `scenario_id`: Architecture evaluation scenario code
  * `project_type`: Target system type (Web Application, IoT Streaming, Mobile Backend, etc.)
  * `scalability_target`: User volume threshold (<10k, 10k–500k, >1M users)
  * `latency_requirement`: SLA sensitivity (<100ms, <500ms, Flexible)
  * `team_size`: Engineering concurrency count
  * `deployment_target`: Infrastructure topology (Kubernetes, Cloud Managed, Serverless, VM)
  * `budget_constraint`: Operational cost profile (Balanced, Performance-First, Cost-Constrained)
  * `recommended_architecture`: Top-scoring architectural design pattern
  * `confidence_score`: Synthesis confidence (0–100%)
  * `primary_protocol`: Dominant communication standard (gRPC, REST, Kafka, MQTT)
  * `database_pattern`: Data layer topology (Database-per-Service, CQRS Read Replicas, etc.)

---

## 4. Module 4: OWASP Vulnerability & Static Code Review Dataset
* **File:** [`module4_code_vulnerabilities_dataset.csv`](./module4_code_vulnerabilities_dataset.csv)
* **Standard:** Aligned with **OWASP Top 10:2021** and **MITRE Common Weakness Enumeration (CWE)**.
* **Columns:**
  * `sample_id`: Code audit sample code
  * `language`: Target programming language (Java, JavaScript, Python)
  * `vulnerability_type`: Security weakness title
  * `owasp_category`: Top 10 designation (e.g. `OWASP A03:2021 - Injection`)
  * `cwe_id`: MITRE standard identifier (e.g. `CWE-89`, `CWE-798`, `CWE-775`)
  * `severity`: Risk classification (Critical, High, Medium, Low)
  * `cyclomatic_complexity`: McCabe control flow branch complexity score
  * `code_snippet`: Vulnerable code example
  * `safe_refactored_code`: Production-safe remediation

---

## 5. Module 5: Project Risk & Telemetry Telemetry Dataset
* **File:** [`module5_project_risk_telemetry_dataset.csv`](./module5_project_risk_telemetry_dataset.csv)
* **Standard:** Based on **NASA Metrics Data Program (MDP JM1/KC1)** and empirical project failure metrics.
* **Columns:**
  * `project_id`: Project telemetry snapshot identifier
  * `timestamp`: Telemetry recording timestamp
  * `bug_trend`: Defect influx rate (`increasing`, `stable`, `decreasing`)
  * `sprint_velocity`: Team throughput (points / sprint)
  * `technical_debt`: Codebase architectural coupling (`low`, `medium`, `high`)
  * `code_quality_index`: Health score (0–100)
  * `lines_of_code`: Total physical lines of code
  * `cyclomatic_complexity`: Average class cyclomatic complexity
  * `failure_probability_percent`: Evaluated risk of milestone slippage
  * `risk_level`: Qualitative risk rating (Low, Moderate, High, Critical)
  * `risk_score`: Calibrated compound project risk index (0–100)
