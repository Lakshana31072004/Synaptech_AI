"""
Synaptech AI - NASA MDP Module-Level Defect Prediction Pipeline
Adheres strictly to Rule 2 (No Blind Dataset Fusion) and Rule 3 (No Ground-Truth Conflation).
Trains module-level defect models using static software engineering metrics:
- McCabe Cyclomatic, Essential, Design Complexity
- Halstead Length, Volume, Difficulty, Effort, Time
- Line of Code (LOC) metrics: Total, Executable, Blank, Comments

Evaluates:
1. Module Defect Classification (Defective vs Clean):
   - Baseline 1: Dummy (Most Frequent)
   - Baseline 2: Logistic Regression (L2 Regularized)
   - Baseline 3: Random Forest Classifier
   - Proposed Model: LightGBM Classifier
   Metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC

2. Defect Density Regression (Defects per KLOC):
   - Baseline 1: Zero-R Dummy Mean
   - Baseline 2: Ridge Regression
   - Baseline 3: Random Forest Regressor
   - Proposed Model: LightGBM Regressor
   Metrics: R^2, MAE, RMSE, Pearson r

Saves artifacts to ai-services/artifacts/ and metrics to experiments/results/
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, KFold
from sklearn.preprocessing import RobustScaler
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, roc_auc_score,
    r2_score, mean_absolute_error, mean_squared_error
)
from scipy.stats import pearsonr
import lightgbm as lgb

np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
DATASET_PATH = os.path.join(PROJECT_ROOT, "datasets", "nasa_mdp_cleaned.csv")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "ai-services", "artifacts")
RESULTS_DIR = os.path.join(PROJECT_ROOT, "experiments", "results")

FEATURE_COLS = [
    "LOC_BLANK", "BRANCH_COUNT", "LOC_CODE_AND_COMMENT", "LOC_COMMENTS",
    "CYCLOMATIC_COMPLEXITY", "DESIGN_COMPLEXITY", "ESSENTIAL_COMPLEXITY",
    "LOC_EXECUTABLE", "HALSTEAD_CONTENT", "HALSTEAD_DIFFICULTY",
    "HALSTEAD_EFFORT", "HALSTEAD_ERROR_EST", "HALSTEAD_LENGTH",
    "HALSTEAD_LEVEL", "HALSTEAD_PROG_TIME", "HALSTEAD_VOLUME",
    "NUM_OPERANDS", "NUM_OPERATORS", "NUM_UNIQUE_OPERANDS",
    "NUM_UNIQUE_OPERATORS", "LOC_TOTAL"
]

def load_data():
    df = pd.read_csv(DATASET_PATH)
    X = df[FEATURE_COLS].values
    y_cls = df["Def"].astype(int).values
    
    # Calculate defect density (defects per KLOC proxy)
    loc_safe = np.maximum(df["LOC_TOTAL"].values, 1.0)
    y_reg = (y_cls / loc_safe) * 1000.0
    
    return X, y_cls, y_reg, FEATURE_COLS

def train_and_evaluate_classification(X, y):
    print("\n--- Benchmarking NASA MDP Module Defect Classification ---")
    skf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    
    y_true_all = []
    preds_dummy, preds_lr, preds_rf, preds_lgb = [], [], [], []
    probs_dummy, probs_lr, probs_rf, probs_lgb = [], [], [], []
    
    for train_idx, test_idx in skf.split(X, y):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        y_true_all.extend(y_te)
        
        scaler = RobustScaler()
        X_tr_s = scaler.fit_transform(X_tr)
        X_te_s = scaler.transform(X_te)
        
        # 1. Dummy
        dummy = DummyClassifier(strategy="most_frequent", random_state=42)
        dummy.fit(X_tr_s, y_tr)
        preds_dummy.extend(dummy.predict(X_te_s))
        probs_dummy.extend(dummy.predict_proba(X_te_s)[:, 1])
        
        # 2. Logistic Regression
        lr = LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000, random_state=42)
        lr.fit(X_tr_s, y_tr)
        preds_lr.extend(lr.predict(X_te_s))
        probs_lr.extend(lr.predict_proba(X_te_s)[:, 1])
        
        # 3. Random Forest
        rf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42)
        rf.fit(X_tr_s, y_tr)
        preds_rf.extend(rf.predict(X_te_s))
        probs_rf.extend(rf.predict_proba(X_te_s)[:, 1])
        
        # 4. LightGBM
        lgb_cls = lgb.LGBMClassifier(n_estimators=100, learning_rate=0.05, num_leaves=20, random_state=42, verbosity=-1)
        lgb_cls.fit(X_tr_s, y_tr)
        preds_lgb.extend(lgb_cls.predict(X_te_s))
        probs_lgb.extend(lgb_cls.predict_proba(X_te_s)[:, 1])
        
    models = {
        "Baseline 1 (Dummy Most Frequent)": (preds_dummy, probs_dummy),
        "Baseline 2 (Logistic Regression)": (preds_lr, probs_lr),
        "Baseline 3 (Random Forest)": (preds_rf, probs_rf),
        "Proposed Model (LightGBM Classifier)": (preds_lgb, probs_lgb)
    }
    
    results = []
    for name, (preds, probs) in models.items():
        acc = accuracy_score(y_true_all, preds)
        p, r, f1, _ = precision_recall_fscore_support(y_true_all, preds, average="binary", zero_division=0)
        try:
            auc = roc_auc_score(y_true_all, probs)
        except Exception:
            auc = 0.50
        results.append({
            "model_name": name,
            "accuracy": round(float(acc), 4),
            "precision": round(float(p), 4),
            "recall": round(float(r), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4)
        })
        print(f"[{name}] Acc: {acc:.4f} | F1: {f1:.4f} | AUC: {auc:.4f} | Recall: {r:.4f}")
        
    res_df = pd.DataFrame(results)
    out_csv = os.path.join(RESULTS_DIR, "rq2_nasa_defect_classification_results.csv")
    res_df.to_csv(out_csv, index=False)
    print(f"Saved classification results to: {out_csv}")
    return res_df

def train_and_evaluate_regression(X, y):
    print("\n--- Benchmarking NASA MDP Defect Density Regression ---")
    kf = KFold(n_splits=10, shuffle=True, random_state=42)
    
    y_true_all = []
    preds_dummy, preds_ridge, preds_rf, preds_lgb = [], [], [], []
    
    for train_idx, test_idx in kf.split(X, y):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        y_true_all.extend(y_te)
        
        scaler = RobustScaler()
        X_tr_s = scaler.fit_transform(X_tr)
        X_te_s = scaler.transform(X_te)
        
        # 1. Dummy
        d = DummyRegressor(strategy="mean")
        d.fit(X_tr_s, y_tr)
        preds_dummy.extend(d.predict(X_te_s))
        
        # 2. Ridge
        ridge = Ridge(alpha=1.0, random_state=42)
        ridge.fit(X_tr_s, y_tr)
        preds_ridge.extend(ridge.predict(X_te_s))
        
        # 3. Random Forest
        rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
        rf.fit(X_tr_s, y_tr)
        preds_rf.extend(rf.predict(X_te_s))
        
        # 4. LightGBM
        lgb_reg = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.05, num_leaves=20, random_state=42, verbosity=-1)
        lgb_reg.fit(X_tr_s, y_tr)
        preds_lgb.extend(lgb_reg.predict(X_te_s))
        
    models = {
        "Baseline 1 (Dummy Mean)": preds_dummy,
        "Baseline 2 (Ridge Regression)": preds_ridge,
        "Baseline 3 (Random Forest Regressor)": preds_rf,
        "Proposed Model (LightGBM Regressor)": preds_lgb
    }
    
    results = []
    for name, preds in models.items():
        r2 = r2_score(y_true_all, preds)
        mae = mean_absolute_error(y_true_all, preds)
        rmse = np.sqrt(mean_squared_error(y_true_all, preds))
        try:
            r_val, _ = pearsonr(y_true_all, preds)
        except Exception:
            r_val = 0.0
        results.append({
            "model_name": name,
            "r2_score": round(float(r2), 4),
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "pearson_r": round(float(r_val), 4)
        })
        print(f"[{name}] R2: {r2:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f} | Pearson r: {r_val:.4f}")
        
    res_df = pd.DataFrame(results)
    out_csv = os.path.join(RESULTS_DIR, "rq2_nasa_defect_regression_results.csv")
    res_df.to_csv(out_csv, index=False)
    print(f"Saved regression results to: {out_csv}")
    
    # Train full production defect density model
    scaler_full = RobustScaler()
    X_full_s = scaler_full.fit_transform(X)
    prod_model = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.05, num_leaves=20, random_state=42, verbosity=-1)
    prod_model.fit(X_full_s, y)
    
    joblib.dump(prod_model, os.path.join(ARTIFACTS_DIR, "nasa_defect_model_v1.joblib"))
    joblib.dump(scaler_full, os.path.join(ARTIFACTS_DIR, "nasa_defect_scaler_v1.joblib"))
    
    meta = {
        "model_name": "nasa_defect_model_v1",
        "version": "1.0.0",
        "dataset": "NASA MDP Cleaned Benchmark (1,200 instances)",
        "features": FEATURE_COLS,
        "target": "defect_density (defects per KLOC)",
        "r2_score": float(res_df[res_df["model_name"] == "Proposed Model (LightGBM Regressor)"]["r2_score"].values[0]),
        "mae": float(res_df[res_df["model_name"] == "Proposed Model (LightGBM Regressor)"]["mae"].values[0]),
        "random_seed": 42
    }
    with open(os.path.join(ARTIFACTS_DIR, "nasa_defect_model_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
        
    print(f"Serialized NASA defect model artifact to: {ARTIFACTS_DIR}/nasa_defect_model_v1.joblib")
    return res_df

def main():
    X, y_cls, y_reg, feature_names = load_data()
    print(f"Loaded {len(X)} NASA MDP instances with {len(feature_names)} features.")
    train_and_evaluate_classification(X, y_cls)
    train_and_evaluate_regression(X, y_reg)

if __name__ == "__main__":
    main()
