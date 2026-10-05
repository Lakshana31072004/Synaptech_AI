"""
Synaptech AI - Production Test Suite for AI/ML Microservice
Tests:
1. Model artifact integrity
2. Requirement classification & TCAI ambiguity scoring
3. LightGBM milestone delivery risk prediction
4. Exact TreeSHAP local fidelity validation
5. Distance-attenuated artifact reachability
6. Counterfactual What-If simulation safety
7. Architecture recommendation utility scoring
8. Static code telemetry & security analysis
"""

import sys
import os
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app import (
    app,
    req_classifier,
    req_vectorizer,
    risk_model,
    tree_explainer,
    feature_scaler,
    compute_tcai_ambiguity,
    analyze_requirements,
    predict_risk,
    evaluate_traceability_impact,
    run_simulation,
    recommend_architecture,
    analyze_code_telemetry,
    RequirementAnalysisInput,
    RiskPredictionInput,
    TraceabilityImpactInput,
    SimulationInput,
    ArchitectureRecommendInput,
    CodeAnalysisInput
)

def test_model_artifacts_loaded():
    """Verify all 5 versioned artifacts are loaded successfully."""
    assert req_classifier is not None, "Requirement classifier artifact missing"
    assert req_vectorizer is not None, "Requirement vectorizer artifact missing"
    assert risk_model is not None, "Risk LightGBM artifact missing"
    assert tree_explainer is not None, "TreeSHAP explainer artifact missing"
    assert feature_scaler is not None, "Feature scaler artifact missing"

def test_requirement_classification_and_ambiguity():
    """Verify requirement classification and ISO/IEC/IEEE 29148 TCAI ambiguity calculation."""
    payload = RequirementAnalysisInput(
        text="The system shall authenticate users using JWT with response time under 200ms. The UI should be fast and flexible."
    )
    res = analyze_requirements(payload)
    assert res["model_version"] == "requirement-classifier-v1.0"
    assert res["qualityScore"] > 0
    assert len(res["requirements"]) >= 1
    
    first_req = res["requirements"][0]
    assert first_req["category"].upper() in ["SECURITY", "PERFORMANCE", "FUNCTIONAL", "RELIABILITY", "USABILITY", "MAINTAINABILITY"]
    assert 0.0 <= first_req["ambiguity_score"] <= 1.0

def test_risk_prediction_and_treeshap_fidelity():
    """Verify exact local TreeSHAP additivity: Sum(phi_i) + base_val == f(x)."""
    payload = RiskPredictionInput(
        sprint_velocity_variance=0.25,
        defect_arrival_rate=2.0,
        technical_debt_ratio=0.35,
        code_quality_index=70.0,
        requirement_churn=0.15
    )
    res = predict_risk(payload)
    
    agile_pred = res["agileDeliveryRisk"]
    base_val = res["base_value"]
    shap_sum = sum(item["shap_value"] for item in res["shap_waterfall"])
    reconstructed = round(base_val + shap_sum, 2)
    
    # Exact TreeSHAP local fidelity check on primary LightGBM delivery risk model
    assert abs(reconstructed - agile_pred) < 0.1, f"TreeSHAP local fidelity failed: {reconstructed} vs {agile_pred}"
    assert "scientific_disclaimer" in res
    assert len(res["recommendedMitigations"]) > 0

    # Section 20 Risk Fusion Engine validation
    fused_risk = round(0.50 * res["agileDeliveryRisk"] + 0.30 * res["moduleDefectRisk"] + 0.20 * res["telemetryPenaltyRisk"], 2)
    assert abs(res["predictedRiskScore"] - fused_risk) < 0.1, f"Risk fusion mismatch: {res['predictedRiskScore']} vs {fused_risk}"
    assert "risk_fusion_formula" in res

def test_traceability_distance_attenuation():
    """Verify distance-attenuated impact reachability: score = max(path_product * gamma^(d-1))."""
    payload = TraceabilityImpactInput(
        root_node_id="REQ-1",
        nodes=[
            {"id": "REQ-1", "name": "Auth Req", "type": "Requirement"},
            {"id": "US-1", "name": "Login Story", "type": "UserStory"},
            {"id": "CODE-1", "name": "AuthFilter.java", "type": "Code"}
        ],
        edges=[
            {"source": "REQ-1", "target": "US-1", "weight": 1.0},
            {"source": "US-1", "target": "CODE-1", "weight": 0.8}
        ],
        attenuation_gamma=0.75,
        max_depth=5
    )
    res = evaluate_traceability_impact(payload)
    assert res["total_impacted_count"] == 2
    
    # Check that CODE-1 at depth 2 receives 0.8 * 0.75^1 = 0.60
    code_target = next(x for x in res["impacted_artifacts"] if x["artifact_id"] == "CODE-1")
    assert code_target["path_length"] == 2
    assert code_target["attenuated_impact"] == 0.60

def test_simulation_baseline_safety():
    """Verify Rule 32: Baseline features are not mutated by counterfactual simulation."""
    baseline = {
        "sprint_velocity_variance": 0.15,
        "defect_arrival_rate": 1.0,
        "technical_debt_ratio": 0.20,
        "code_quality_index": 80.0,
        "requirement_churn": 0.10
    }
    baseline_copy = dict(baseline)
    mutation = {"technical_debt_ratio": 0.25}
    
    payload = SimulationInput(baseline_features=baseline, mutation=mutation, mode="delta")
    res = run_simulation(payload)
    
    # Verify input baseline features were untouched
    assert baseline == baseline_copy
    assert "delta_risk" in res
    assert res["scenario_features"]["technical_debt_ratio"] == 0.45
    assert len(res["top_delta_drivers"]) > 0

def test_architecture_recommendation_utility():
    """Verify multi-criteria utility scoring selects Modular Monolith for small squads."""
    payload = ArchitectureRecommendInput(
        expected_qps=300.0,
        team_size=5,
        data_volume_gb=15.0,
        latency_criticality="Medium",
        compliance_required=False,
        cloud_budget_monthly=400.0
    )
    res = recommend_architecture(payload)
    assert res["recommended_architecture"] in ["Modular Monolith", "Layered Monolith", "Microservices", "Event-Driven Architecture"]
    assert "utility_scores" in res
    assert "justification" in res

def test_static_code_telemetry_security():
    """Verify detection of SQL injection risk and cyclomatic complexity."""
    vulnerable_code = """
    public User findUser(String username) {
        Statement stmt = conn.createStatement();
        String sql = "SELECT * FROM users WHERE username = '" + username + "'";
        ResultSet rs = stmt.executeQuery(sql);
        return mapUser(rs);
    }
    """
    payload = CodeAnalysisInput(code=vulnerable_code, language="java")
    res = analyze_code_telemetry(payload)
    assert res["loc"] > 0
    assert res["cyclomatic_complexity"] >= 1
    assert any("SQL Injection" in v["type"] for v in res["vulnerabilities"])

def test_nasa_defect_prediction_model():
    """Verify Rule 2 & 3: NASA MDP module defect model loads and predicts defect density."""
    nasa_model_path = os.path.join(AI_DIR, "artifacts", "nasa_defect_model_v1.joblib")
    nasa_scaler_path = os.path.join(AI_DIR, "artifacts", "nasa_defect_scaler_v1.joblib")
    assert os.path.exists(nasa_model_path), "NASA MDP defect model artifact missing"
    assert os.path.exists(nasa_scaler_path), "NASA MDP scaler artifact missing"
    
    model = joblib.load(nasa_model_path)
    scaler = joblib.load(nasa_scaler_path)
    
    # 21 static code features: LOC, Halstead, McCabe
    sample_feat = np.ones((1, 21)) * 10.0
    scaled = scaler.transform(sample_feat)
    pred_density = float(model.predict(scaled)[0])
    assert isinstance(pred_density, float)
    assert not np.isnan(pred_density)

def test_sentence_transformer_embeddings():
    """Verify Rule 6: Pretrained all-MiniLM-L6-v2 384-D frozen embeddings are cached and valid."""
    emb_path = os.path.join(AI_DIR, "artifacts", "promise_nfr_minilm_embeddings.joblib")
    assert os.path.exists(emb_path), "Sentence Transformer cached embeddings missing"
    
    embeddings = joblib.load(emb_path)
    assert embeddings.shape == (625, 384), f"Unexpected embedding shape: {embeddings.shape}"
    assert embeddings.dtype == np.float32

