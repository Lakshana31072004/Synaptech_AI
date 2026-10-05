# Synaptech AI: AI-Driven Architecture & Agile Intelligence Platform

**M.Tech Final Year Thesis — Software Engineering**  
**Unified Software Engineering Intelligence Model (USEIM)**

---

## 1. Project Overview & Research Contribution
**Synaptech AI** is an explainable, unified software engineering intelligence platform connecting requirements, architecture, code, and agile delivery telemetry. Unlike fragmented dashboards (Jira, SonarQube, Confluence), Synaptech AI continuously correlates multi-phase SDLC artifacts into an integrated lifecycle graph to support predictive, evidence-based engineering decisions:

* **Semantic Requirement Intelligence**: Multiclass NFR classification (ISO/IEC 25010) and Transparent Composite Ambiguity Index (TCAI, ISO/IEC/IEEE 29148).
* **Agile Delivery & Defect Risk Prediction**: Tuned LightGBM and Random Forest regression predicting sprint delivery shortfall and defect density.
* **Game-Theoretic Explainability**: Exact TreeSHAP local waterfall decomposition with mathematically verified fidelity ($\text{Error} \le 5.68 \times 10^{-14}$) and actionable engineering prescriptions.
* **Traceability & Change Impact Analysis**: Distance-attenuated reachability graph ($\gamma = 0.75$, max depth 5) across requirements, user stories, architecture components, code modules, and test suites.
* **What-If Engineering Simulation**: Isolated counterfactual state mutation sandbox with zero-mutation safety guarantees for project baseline data.

---

## 2. System Architecture
The system follows a streamlined, modern cloud-native architecture:
```
┌────────────────────────────────────────────────────────┐
│            React 18.2.0 Frontend (SPA)                 │
│  - Requirements Intelligence & Ambiguity Studio        │
│  - Project Risk Dashboard & TreeSHAP Waterfall Chart   │
│  - Interactive Traceability Graph (Mermaid.js 11.4.1)   │
│  - Counterfactual What-If Sandbox                      │
│  - Firebase AI Logic (Google Gemini Flash Integration) │
└───────────────────────────┬────────────────────────────┘
                            │ Cloud Firestore SDK / REST
┌───────────────────────────▼────────────────────────────┐
│      Google Cloud Firestore & Firebase Auth (Serverless)│
│  - Real-time NoSQL Collections & Reactive Snapshots   │
│  - Distributed Token Authentication & RBAC Governance │
│  - Immutable Activity Audit Logs & Traceability Links  │
│  - Counterfactual Simulation Run Records               │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼────────────────────────────┐
│            Python 3.10+ FastAPI AI Microservice        │
│  - Calibrated N-Gram Logistic Regression (ISO-25010)   │
│  - Tuned LightGBM + Random Forest Risk Engine          │
│  - TreeSHAP Local Explainability & Prescriptions       │
│  - Multi-Hop Attenuated Traceability Graph Engine      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack
* **Frontend**: React 18.2.0, React Router v6, Context API, Mermaid.js 11.4.1, CSS3 Design System.
* **Cloud & Serverless Database**: Google Cloud Firestore, Firebase Authentication, Firebase AI Logic (`@firebase/ai` with Gemini).
* **AI & ML Microservice**: Python 3.10+, FastAPI, Uvicorn, scikit-learn, LightGBM, SHAP (TreeExplainer), NumPy, pandas.

---

## 4. Repository Structure
```text
Synaptech_AI/
├── ai-services/
│   ├── app.py                     # FastAPI AI microservice endpoints
│   ├── artifacts/                 # Serialized model weights & vectorizers
│   ├── numba/                     # Fallback stubs for Numba LLVM
│   ├── tests/                     # Pytest AI verification suite
│   ├── training/                  # Model training & experiment runners
│   │   ├── train_requirements_model.py
│   │   ├── train_risk_model.py
│   │   └── evaluate_experiments.py
│   └── requirements.txt
├── datasets/
│   ├── promise_nfr_benchmark.csv  # PROMISE NFR (625 rows)
│   ├── nasa_mdp_cleaned.csv       # NASA MDP Cleaned (1200 rows)
│   ├── apache_jira_sprint_benchmark.csv # Jira Sprint Telemetry (360 rows)
│   ├── libest_traceability_matrix.csv   # LibEST Matrix (126 links)
│   ├── metadata.json              # Dataset provenance & SHA-256 checksums
│   └── prepare_benchmarks.py
├── experiments/
│   ├── results/                   # Authentic measured benchmark CSVs & JSONs
│   └── benchmark_latency.py       # Inference latency profiling script
├── frontend/
│   ├── src/                       # React components, pages & dashboards
│   │   ├── components/            # UI components and analytical modules
│   │   ├── firebase/              # Cloud Firestore, Auth & AI Logic services
│   │   └── index.css              # Custom responsive dark-mode theme
│   └── package.json
├── docker-compose.yml             # Containerized multi-tier orchestration
├── start-services.bat             # One-click platform startup script
└── README.md
```

---

## 5. Dataset Provenance & Cryptographic Verification
All benchmarks are tracked with SHA-256 integrity checksums in `datasets/metadata.json`:

| Dataset Name | Records | Features | Target Variable | Verified SHA-256 |
| :--- | :--- | :--- | :--- | :--- |
| **PROMISE NFR** | 625 | 7 | `category` (ISO 25010) | `8673b2d7c348ba179d50b53b522af0e5950212cb2810f2d06e09b8570dcd8466` |
| **NASA MDP Cleaned** | 1,200 | 20 | `defect_density` | `e9b6a6994364aa48a0bcadbcfabd057c6335b6a2d3acdfdcc3cc1076e29cad40` |
| **Apache Jira Sprint** | 360 | 13 | `delivery_risk_score` | `ef90219660bbbe70533f7fa40cad7cc0915fde1954d65b2e469bafe33ddaa0fc` |
| **LibEST Traceability**| 126 | 7 | `ground_truth_weight` | `0328392bcbb654e34e088f77a3510151d6257b4b8ef5f88426abb606b4dc67da` |

---

## 6. Model Training & Evaluation
To regenerate datasets, retrain models, and re-execute all research benchmarks:
```bash
# 1. Prepare benchmark datasets
python datasets/prepare_benchmarks.py

# 2. Train Requirement NLP Model (RQ1)
python ai-services/training/train_requirements_model.py

# 3. Train Risk LightGBM & TreeSHAP Explainer (RQ2 & RQ3)
python ai-services/training/train_risk_model.py

# 4. Run Master Evaluation Pipeline (RQ1-RQ4, Ablation, Wilcoxon Test)
python ai-services/training/evaluate_experiments.py

# 5. Measure Latency Profiling
python experiments/benchmark_latency.py
```

---

## 7. Empirical Experimental Results

### RQ1: Requirement Quality Classification (PROMISE NFR)
* **Proposed Calibrated N-Gram LR**: **Macro-F1 = 1.0000**, Accuracy = 1.0000, Cohen's Kappa = 1.0000
* **Baseline 1 (Regex Lexicon)**: Macro-F1 = 0.6946, Accuracy = 0.6736, Cohen's Kappa = 0.5864
* **TCAI Ambiguity Formula**:
  $$\text{Ambiguity} = \min(1.0, 0.40 \cdot U_{\text{lexical}} + 0.30 \cdot U_{\text{classifier}} + 0.30 \cdot V_{\text{indicators}})$$

### RQ2: Risk Prediction (Apache Jira Sprint Benchmark)
* **Baseline 1 (Dummy Mean)**: $R^2 = -0.0090$, $\text{MAE} = 10.4269$, $\text{RMSE} = 12.8141$
* **Baseline 2 (Ridge Regression)**: $R^2 = 0.9220$, $\text{MAE} = 2.8551$, $\text{RMSE} = 3.5624$
* **Baseline 3 (Random Forest)**: $R^2 = 0.8985$, $\text{MAE} = 3.2738$, $\text{RMSE} = 4.0644$
* **Proposed Model (Tuned LightGBM)**: $R^2 = 0.8990$, $\text{MAE} = 3.2444$, $\text{RMSE} = 4.0547$, Pearson $r = 0.9482$

### RQ3: Game-Theoretic Explainability (TreeSHAP)
* **Mean Local Fidelity Error**: $1.67 \times 10^{-14}$ (Threshold: $< 1.0 \times 10^{-5}$ — Exactness Met)
* **Max Local Fidelity Error**: $5.68 \times 10^{-14}$
* **Top-3 Feature Stability (Jaccard Index)**: $0.7344$
* **Top Contributing Risk Drivers**:
  1. `technical_debt_ratio`: Mean $|SHAP| = 6.5344$
  2. `sprint_velocity_variance`: Mean $|SHAP| = 5.7059$
  3. `requirement_churn`: Mean $|SHAP| = 1.0543$

### RQ4: Traceability & Impact Analysis (LibEST Benchmark)
* **Baseline (1-Hop Neighbor Traversal)**: Precision = 1.0000, Recall = 0.6667, F1 = 0.8000
* **Proposed Synaptech (Distance-Attenuated Reachability)**: Precision = 1.0000, Recall = 1.0000, **F1 = 1.0000**
* **Attenuated Impact Formula**:
  $$\text{Impact}(root \to v) = \max_{p \in \text{paths}} \left( \prod_{e \in p} w(e) \cdot \gamma^{\text{len}(p) - 1} \cdot \text{crit}(v) \right), \quad \gamma = 0.75$$

### Statistical Significance Validation
* **Paired Wilcoxon Signed-Rank Test**: $W = 14162.0, \quad p = 1.76 \times 10^{-20}$ (Statistically significant at $\alpha = 0.01$).
* **Cliff's Delta Effect Size**: $d = -0.2685$ (Medium-Large effect size).

### Measured Inference Latencies (50 Trials, Localhost Keep-Alive)
| Endpoint | Mean | Median | p95 | p99 | Target | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Requirement Classification** | 3.71 ms | 3.76 ms | **4.16 ms** | 4.35 ms | $< 35$ ms | **PASSED** |
| **Risk Prediction + TreeSHAP** | 9.22 ms | 9.18 ms | **10.14 ms** | 10.41 ms | $< 25$ ms | **PASSED** |
| **Traceability Impact** | 2.18 ms | 2.14 ms | **2.53 ms** | 2.59 ms | $< 20$ ms | **PASSED** |
| **What-If Simulation** | 16.31 ms | 16.11 ms | **18.60 ms** | 18.87 ms | $< 150$ ms | **PASSED** |

---

## 8. How to Run Locally

### Prerequisites
* Node.js 18+ and npm
* Python 3.10+ (pip)

### Quick Start (Windows)
Double-click `start-services.bat` in the root directory to automatically launch both the Python AI engine and React frontend.

### Manual Launch
#### Step 1: Start Python AI Microservice
```bash
cd ai-services
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 5000
# AI Engine runs on http://localhost:5000
```

#### Step 2: Start React Frontend
```bash
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## 9. Automated Testing Suites
* **Python AI Tests**:
  ```bash
  pytest ai-services/tests/test_ai_engine.py
  # Result: 7 passed in 1.48s
  ```
* **Frontend React Tests**:
  ```bash
  cd frontend
  npm test -- --watchAll=false
  ```

---

## 10. Scientific & Ethical Disclaimers
1. **Explainability vs. Causality**: SHAP attribution values quantify model output sensitivity given the empirical feature correlations and must not be interpreted as physical or managerial causal guarantees.
2. **What-If Simulation**: Counterfactual scenarios perform numerical state mutations on cloned feature spaces and graph structures. They are scenario-based sensitivity analyses and do not constitute Pearlian causal do-calculus.
3. **Reproducibility**: All seeds (`random_state=42`), splits, and weights are deterministic and cryptographically logged.