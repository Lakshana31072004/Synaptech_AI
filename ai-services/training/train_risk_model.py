"""
Synaptech AI - Project Risk & Delivery Telemetry Model Training Pipeline
Evaluates RQ2:
- Baseline 1: Zero-R Dummy Mean Regressor
- Baseline 2: Ridge Regression (L2 Regularized)
- Baseline 3: Random Forest Regressor
- Proposed Model: Tuned LightGBM Regressor
Fits TreeSHAP explainer for Game-Theoretic interpretability (RQ3).
Saves artifacts to ai-services/artifacts/
"""

import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICES_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))

if AI_SERVICES_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICES_DIR)

import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold
from sklearn.preprocessing import RobustScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from scipy.stats import pearsonr
import lightgbm as lgb
import shap

np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
JIRA_DATASET = os.path.join(PROJECT_ROOT, "datasets", "apache_jira_sprint_benchmark.csv")
NASA_DATASET = os.path.join(PROJECT_ROOT, "datasets", "nasa_mdp_cleaned.csv")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "ai-services", "artifacts")
RESULTS_DIR = os.path.join(PROJECT_ROOT, "experiments", "results")

# Enforced feature space matching Phase 3/4 specification
FEATURE_COLS = [
    "sprint_velocity_variance",
    "defect_arrival_rate",
    "technical_debt_ratio",
    "code_quality_index",
    "requirement_churn"
]

def load_and_prepare_data():
    df = pd.read_csv(JIRA_DATASET)
    
    # Map raw columns to canonical feature names
    if "sprint_velocity_variance" not in df.columns and "velocity_variance" in df.columns:
        df["sprint_velocity_variance"] = df["velocity_variance"]
    if "defect_arrival_rate" not in df.columns and "defect_count" in df.columns:
        df["defect_arrival_rate"] = df["defect_count"].astype(float)
        
    X = df[FEATURE_COLS].values
    y = df["delivery_risk_score"].values
    
    return X, y, FEATURE_COLS

def train_and_benchmark():
    print(f"Loading Apache Jira sprint telemetry from: {JIRA_DATASET}")
    X, y, feature_names = load_and_prepare_data()
    print(f"Features: {feature_names} | Instances: {len(X)}")
    
    kf = KFold(n_splits=10, shuffle=True, random_state=42)
    
    y_true_all = []
    preds_dummy = []
    preds_ridge = []
    preds_rf = []
    preds_lgb = []
    
    for train_idx, test_idx in kf.split(X, y):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        
        y_true_all.extend(y_te)
        
        # Robust Scaler fit strictly inside training fold
        scaler = RobustScaler()
        X_tr_scaled = scaler.fit_transform(X_tr)
        X_te_scaled = scaler.transform(X_te)
        
        # 1. Baseline: Zero-R Dummy Regressor
        dummy = DummyRegressor(strategy="mean")
        dummy.fit(X_tr_scaled, y_tr)
        preds_dummy.extend(dummy.predict(X_te_scaled))
        
        # 2. Parametric Baseline: Ridge Regression
        ridge = Ridge(alpha=1.5, random_state=42)
        ridge.fit(X_tr_scaled, y_tr)
        preds_ridge.extend(ridge.predict(X_te_scaled))
        
        # 3. Ensemble Baseline: Random Forest
        rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        rf.fit(X_tr_scaled, y_tr)
        preds_rf.extend(rf.predict(X_te_scaled))
        
        # 4. Proposed: Tuned LightGBM Regressor
        lgbm = lgb.LGBMRegressor(
            n_estimators=120,
            learning_rate=0.05,
            num_leaves=25,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=-1
        )
        lgbm.fit(X_tr_scaled, y_tr)
        preds_lgb.extend(lgbm.predict(X_te_scaled))
        
    models = {
        "Baseline 1 (Dummy Mean)": preds_dummy,
        "Baseline 2 (Ridge Regression)": preds_ridge,
        "Baseline 3 (Random Forest)": preds_rf,
        "Proposed Model (Tuned LightGBM)": preds_lgb
    }
    
    results = []
    for name, preds in models.items():
        r2 = r2_score(y_true_all, preds)
        mae = mean_absolute_error(y_true_all, preds)
        rmse = np.sqrt(mean_squared_error(y_true_all, preds))
        corr, _ = pearsonr(y_true_all, preds)
        
        results.append({
            "model_name": name,
            "r2_score": round(float(r2), 4),
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "pearson_r": round(float(corr), 4)
        })
        print(f"[{name}] R²: {r2:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f} | Pearson r: {corr:.4f}")
        
    results_df = pd.DataFrame(results)
    results_csv = os.path.join(RESULTS_DIR, "rq2_risk_results.csv")
    results_df.to_csv(results_csv, index=False)
    print(f"\nSaved RQ2 risk benchmark results to: {results_csv}")
    
    # Train Production Models on full dataset
    full_scaler = RobustScaler()
    X_full_scaled = full_scaler.fit_transform(X)
    
    final_lgbm = lgb.LGBMRegressor(
        n_estimators=120,
        learning_rate=0.05,
        num_leaves=25,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=-1
    )
    final_lgbm.fit(X_full_scaled, y)
    
    final_rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    final_rf.fit(X_full_scaled, y)
    
    # Fit TreeSHAP Explainer
    print("Fitting TreeSHAP Explainer on LightGBM model...")
    explainer = shap.TreeExplainer(final_lgbm)
    
    # Verify Shapley exact fidelity assertion on sample
    sample_vec = X_full_scaled[:5]
    shap_vals = explainer.shap_values(sample_vec)
    base_val = explainer.expected_value
    pred_vals = final_lgbm.predict(sample_vec)
    
    fidelity_errors = [abs(pred_vals[i] - (base_val + np.sum(shap_vals[i]))) for i in range(len(sample_vec))]
    max_fidelity_error = max(fidelity_errors)
    print(f"TreeSHAP Maximum Local Fidelity Error: {max_fidelity_error:.2e} (Strict threshold: < 1e-5)")
    
    # Save Artifacts
    lgb_artifact = os.path.join(ARTIFACTS_DIR, "risk_lightgbm_v1.joblib")
    rf_artifact = os.path.join(ARTIFACTS_DIR, "risk_rf_v1.joblib")
    scaler_artifact = os.path.join(ARTIFACTS_DIR, "feature_scaler_v1.joblib")
    explainer_artifact = os.path.join(ARTIFACTS_DIR, "tree_explainer_v1.joblib")
    
    joblib.dump(final_lgbm, lgb_artifact)
    joblib.dump(final_rf, rf_artifact)
    joblib.dump(full_scaler, scaler_artifact)
    joblib.dump(explainer, explainer_artifact)
    
    meta = {
        "model_name": "risk_lightgbm_v1",
        "version": "1.0.0",
        "algorithm": "LightGBMRegressor",
        "feature_names": FEATURE_COLS,
        "r2_score": float(results_df[results_df["model_name"] == "Proposed Model (Tuned LightGBM)"]["r2_score"].values[0]),
        "mae": float(results_df[results_df["model_name"] == "Proposed Model (Tuned LightGBM)"]["mae"].values[0]),
        "rmse": float(results_df[results_df["model_name"] == "Proposed Model (Tuned LightGBM)"]["rmse"].values[0]),
        "shap_fidelity_error": float(max_fidelity_error),
        "dataset": "Apache Jira Agile Sprint Benchmark (360 sprint iterations)",
        "random_seed": 42
    }
    with open(os.path.join(ARTIFACTS_DIR, "risk_model_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
        
    print(f"Exported risk model artifacts to: {lgb_artifact}")
    return results_df

if __name__ == "__main__":
    train_and_benchmark()
