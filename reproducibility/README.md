# Synaptech AI — Research Reproducibility Package

This directory provides complete instructions, manifests, and scripts to reproduce all empirical experiments, model training pipelines, statistical tests, and publication artifacts for the **Synaptech AI Platform** (M.Tech Final Year Thesis in Software Engineering).

---

## 1. Quick Reproduction (One-Command Execution)

To reproduce all benchmarks, models, statistical tests, and publication plots from scratch:

```bash
python reproducibility/run_all_experiments.py
```

This single command executes:
1. **Dataset Integrity Verification**: Computes SHA-256 hashes of all 4 benchmarks and checks against `dataset_manifest.json`.
2. **NASA MDP Model Training**: Trains cost-sensitive Random Forest and LightGBM defect classifiers and density regressors.
3. **Requirement Model Training**: Encodes PROMISE NFR requirements with `all-MiniLM-L6-v2` 384-D dense embeddings and trains N-Gram & sentence transformer classifiers.
4. **Agile Sprint Model Training**: Trains the LightGBM sprint shortfall regressor on Apache Jira telemetry and serializes the TreeSHAP explainer.
5. **Master Evaluation & Plotting**: Runs 10-fold cross-validation, verifies TreeSHAP exact additivity fidelity, executes true out-of-fold Wilcoxon signed-rank tests, computes Cliff's delta, and outputs publication figures to `experiments/plots/`.

---

## 2. Directory Structure

```
reproducibility/
├── README.md                  # This guide
├── environment.txt            # Complete dependency and runtime version matrix
├── dataset_manifest.json      # Checksums, sizes, and licensing for all 4 datasets
├── model_manifest.json        # Serialized models, algorithms, and hyperparameters
├── experiment_manifest.json   # Research questions mapped to executable scripts
└── run_all_experiments.py     # Automated end-to-end master runner
```

---

## 3. Step-by-Step Manual Reproduction

If you prefer to run experiments individually:

### Step 3.1: Dataset Integrity & Leakage Audit
```bash
python ai-services/training/audit_datasets_and_leakage.py
```
*Output: `experiments/metadata/dataset_integrity_audit.json`*

### Step 3.2: Train NASA MDP Defect Models
```bash
python ai-services/training/train_nasa_defect_model.py
```
*Artifacts: `ai-services/artifacts/nasa_defect_model_v1.joblib`, `nasa_defect_scaler_v1.joblib`*

### Step 3.3: Train Requirement Classifier & Precompute Sentence Embeddings
```bash
python ai-services/training/train_requirements_model.py
```
*Artifacts: `ai-services/artifacts/requirement_classifier_v1.joblib`, `promise_nfr_minilm_embeddings.joblib`*

### Step 3.4: Train Agile Risk LightGBM & TreeSHAP
```bash
python ai-services/training/train_risk_model.py
```
*Artifacts: `ai-services/artifacts/risk_lightgbm_v1.joblib`, `tree_explainer_v1.joblib`*

### Step 3.5: Master Validation & Statistical Significance Testing
```bash
python ai-services/training/verify_models_and_statistics.py
```
*Outputs: `experiments/processed_results/`, `experiments/statistical_tests/`, `experiments/plots/`*

---

## 4. Verification & Testing Across All Tiers

### Backend (Spring Boot 3.3.4)
```bash
.\mvnw.cmd test
```
*Expected: 12 / 12 tests passing (`BUILD SUCCESS`)*

### Python AI Microservice (FastAPI & Pytest)
```bash
python -m pytest ai-services/tests/test_ai_engine.py -v
```
*Expected: 9 / 9 tests passing*

### React Frontend (React 18 & Jest)
```bash
cmd /c npm test -- --watchAll=false
```
*Expected: 5 / 5 test suites, 6 / 6 tests passing*

---

## 5. Research Contact & License

Synaptech AI Platform is released under the MIT Open Source License for academic research reproducibility. Datasets remain under their respective open-science licenses detailed in `dataset_manifest.json`.
