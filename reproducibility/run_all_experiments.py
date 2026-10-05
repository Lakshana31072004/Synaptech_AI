"""
Synaptech AI - Master Reproducibility Runner
Orchestrates end-to-end reproduction of all empirical benchmarks:
1. Validates dataset integrity and SHA-256 cryptographic signatures
2. Trains and serializes all models (NASA defect, PROMISE requirements, Jira sprint risk)
3. Executes 10-fold cross-validation, TreeSHAP explainability, and LibEST graph reachability
4. Generates statistical significance tests, ablation comparisons, and publication plots
Usage: python reproducibility/run_all_experiments.py
"""

import os
import sys
import subprocess
import time

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def run_step(step_name, cmd):
    print("\n" + "="*80)
    print(f"  STEP: {step_name}")
    print(f"  CMD:  {' '.join(cmd)}")
    print("="*80)
    t0 = time.time()
    res = subprocess.run(cmd, cwd=PROJECT_ROOT)
    elapsed = time.time() - t0
    if res.returncode != 0:
        print(f"[-] FAILED: {step_name} (Exit code {res.returncode}, {elapsed:.2f}s)")
        sys.exit(res.returncode)
    print(f"[+] COMPLETED: {step_name} in {elapsed:.2f}s")

def main():
    print("*"*80)
    print("         SYNAPTECH AI: MASTER EMPIRICAL REPRODUCIBILITY PIPELINE         ")
    print("*"*80)
    
    # 1. Audit Datasets & Checksums
    run_step(
        "Audit Dataset Integrity & Cryptographic Checksums",
        [sys.executable, "ai-services/training/audit_datasets_and_leakage.py"]
    )
    
    # 2. Train NASA MDP Defect Prediction Pipeline
    run_step(
        "Train NASA Defect Models (Classification & Regression)",
        [sys.executable, "ai-services/training/train_nasa_defect_model.py"]
    )
    
    # 3. Train PROMISE NFR Requirement Pipeline
    run_step(
        "Train Requirement Classifier & Precompute Sentence Embeddings",
        [sys.executable, "ai-services/training/train_requirements_model.py"]
    )
    
    # 4. Train Apache Jira Sprint Risk & TreeSHAP Explainer
    run_step(
        "Train Sprint Risk LightGBM & TreeSHAP Explainer",
        [sys.executable, "ai-services/training/train_risk_model.py"]
    )
    
    # 5. Master Validation & Statistical Significance
    run_step(
        "Master Verification, Statistical Significance & Publication Plotting",
        [sys.executable, "ai-services/training/verify_models_and_statistics.py"]
    )
    
    print("\n" + "*"*80)
    print("  SUCCESS: ALL BENCHMARKS, MODELS, AND EXPERIMENTAL RESULTS REPRODUCED! ")
    print("  Artifacts available in: ai-services/artifacts/ and experiments/       ")
    print("*"*80)

if __name__ == "__main__":
    main()
