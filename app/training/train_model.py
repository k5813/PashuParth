#!/usr/bin/env python3
"""
train_model.py

Trains, validates, and tests the PashuParth mastitis risk classifier on the
output of `feature_engineering.py` (train_xgb.csv / val_xgb.csv / test_xgb.csv).

Model choice: XGBoost multiclass classifier (see prior discussion) —
native NaN handling for the mostly-missing SCC field (Mode A default),
native categorical splits, threshold-shaped decision boundaries that match
how the spec itself defines risk (banded cutoffs), sample-efficient on a
dataset this size, and SHAP-interpretable for a vet/farmer-facing alert tool.

Target: `true_mastitis_status` (none / subclinical / clinical) — the hidden
ground-truth disease label the synthetic generator assigned, NOT the
Section 7 composite-score heuristic (which is excluded from the feature set
entirely; see feature_engineering.py's docstring).

Splits (already grouped by animal_id, no leakage, produced upstream):
  - train : fit the model
  - val   : early stopping / overfitting check during training
  - test  : untouched until the very end, final reported metrics

What this script does
----------------------
1. Loads train/val/test tables, restores categorical dtypes, builds X/y.
2. Computes balanced sample weights (classes are ~95% / 3% / 1.5%).
3. Trains XGBoost with early stopping on the val set.
4. Reports metrics on train, val, and test: accuracy, balanced accuracy,
   macro/weighted F1, per-class precision/recall/F1, confusion matrices,
   ROC-AUC (OvR) and PR-AUC per class.
5. Computes SHAP values on the test set, aggregates them back into the
   spec's original parameter groups (e.g. EC_mScm + EC_roll3_mean +
   EC_roll7_mean + EC_delta1 + EC_risk_level -> "EC"), and prints them next
   to the spec's Section 1/2/3 "Proposed Weight" column — exactly the
   sanity check the spec's own closing section asks for.
6. Saves the trained model (native XGBoost .ubj + sklearn-compatible
   .joblib), all metrics (JSON + text report), confusion matrix plots, and
   the SHAP-vs-spec comparison table.

Usage:
    python train_model.py --data-dir ./fe_output --output-dir ./model_output
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, f1_score, precision_score,
    recall_score, classification_report, confusion_matrix, roc_auc_score,
    average_precision_score, log_loss,
)
from sklearn.preprocessing import label_binarize
from sklearn.utils.class_weight import compute_sample_weight

import xgboost as xgb

ID_COLS = ["animal_id", "farm_id", "day"]
NON_FEATURE_TARGET_COLS = ["true_latent_severity", "true_mastitis_status", "true_mastitis_status_id"]
CATEGORY_COLS = ["species", "breed_category"]
CLASS_ORDER = ["none", "subclinical", "clinical"]  # matches LabelEncoder's alphabetical fit order

# Spec's Section 1/2/3 "Proposed Weight" (Mode A, default no-lab-SCC column),
# used only for the post-hoc SHAP comparison, never for training.
SPEC_WEIGHTS_MODE_A = {
    "EC": 0.30, "pH": 0.22, "SCC": 0.0, "Udder temperature": 0.08, "Milk temperature": 0.05,
    "Milk yield deviation": 0.08, "Milking duration deviation": 0.04, "Abnormal flow flag": 0.04,
    "Body temperature": 0.10, "Rumination time drop": 0.10, "Standing/lying time deviation": 0.03,
}

# Maps a spec parameter group -> every engineered column derived from it.
FEATURE_GROUPS = {
    "EC": ["EC_mScm", "EC_risk_level", "EC_x_heat_stress"],
    "pH": ["pH", "pH_risk_level"],
    "SCC": ["SCC_x1e5_ml", "SCC_risk_level", "SCC_available"],
    "Udder temperature": ["udder_temp_C", "udder_temp_risk_level", "udder_temp_x_heat_stress"],
    "Milk temperature": ["milk_temp_C", "milk_temp_risk_level"],
    "Milk yield deviation": ["yield_deviation_pct", "yield_risk_level"],
    "Milking duration deviation": ["duration_deviation_pct", "duration_risk_level"],
    "Abnormal flow flag": ["abnormal_flow_flag", "flow_risk_level"],
    "Body temperature": ["body_temp_C", "body_temp_risk_level", "body_temp_x_heat_stress"],
    "Rumination time drop": ["rumination_drop_pct", "rumination_risk_level"],
    "Standing/lying time deviation": ["standing_lying_deviation_pct", "standing_lying_risk_level"],
    "THI (environmental modifier)": ["THI", "THI_band_ord", "heat_stress_flag"],
    "Static covariates (species/breed/lactation/parity/history/vaccination)": [
        "species", "breed_category", "lactation_stage_ord", "parity_bucket_ord",
        "prior_mastitis_history", "prior_mastitis_episodes", "vaccination_status",
    ],
    "Hygiene gases (no literature threshold)": ["ammonia_ppm", "co_ppm", "co2_ppm"],
}


def load_split(path):
    df = pd.read_csv(path)
    for col in CATEGORY_COLS:
        df[col] = df[col].astype("category")
    return df


def make_xy(df):
    feature_cols = [c for c in df.columns if c not in ID_COLS + NON_FEATURE_TARGET_COLS]
    X = df[feature_cols]
    y = df["true_mastitis_status_id"].astype(int)
    return X, y, feature_cols


def evaluate_split(model, X, y, split_name, class_names, out_dir):
    proba = model.predict_proba(X)
    pred = np.argmax(proba, axis=1)

    y_bin = label_binarize(y, classes=list(range(len(class_names))))
    # guard against a split missing a class entirely (shouldn't happen here, but stay safe)
    present = sorted(y.unique())

    metrics = {
        "accuracy": float(accuracy_score(y, pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y, pred)),
        "macro_f1": float(f1_score(y, pred, average="macro")),
        "weighted_f1": float(f1_score(y, pred, average="weighted")),
        "macro_precision": float(precision_score(y, pred, average="macro", zero_division=0)),
        "macro_recall": float(recall_score(y, pred, average="macro", zero_division=0)),
        "log_loss": float(log_loss(y, proba, labels=list(range(len(class_names))))),
    }
    if len(present) > 1:
        metrics["roc_auc_macro_ovr"] = float(roc_auc_score(y_bin, proba, average="macro", multi_class="ovr"))
        metrics["pr_auc_per_class"] = {
            class_names[c]: float(average_precision_score(y_bin[:, c], proba[:, c]))
            for c in range(len(class_names))
        }

    report_dict = classification_report(
        y, pred, labels=list(range(len(class_names))), target_names=class_names,
        output_dict=True, zero_division=0,
    )
    report_text = classification_report(
        y, pred, labels=list(range(len(class_names))), target_names=class_names, zero_division=0,
    )
    metrics["per_class_report"] = report_dict

    cm = confusion_matrix(y, pred, labels=list(range(len(class_names))))
    cm_df = pd.DataFrame(cm, index=[f"true_{c}" for c in class_names], columns=[f"pred_{c}" for c in class_names])
    cm_df.to_csv(os.path.join(out_dir, f"{split_name}_confusion_matrix.csv"))

    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(class_names))); ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticks(range(len(class_names))); ax.set_yticklabels(class_names)
    ax.set_xlabel("Predicted"); ax.set_ylabel("True")
    ax.set_title(f"Confusion matrix — {split_name}")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                     color="white" if cm[i, j] > cm.max() / 2 else "black")
    fig.colorbar(im, ax=ax, fraction=0.046)
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, f"{split_name}_confusion_matrix.png"), dpi=150)
    plt.close(fig)

    with open(os.path.join(out_dir, f"{split_name}_classification_report.txt"), "w") as f:
        f.write(report_text)

    print(f"\n{'=' * 60}\n{split_name.upper()} METRICS\n{'=' * 60}")
    print(f"Accuracy:            {metrics['accuracy']:.4f}")
    print(f"Balanced accuracy:   {metrics['balanced_accuracy']:.4f}")
    print(f"Macro F1:            {metrics['macro_f1']:.4f}")
    print(f"Weighted F1:         {metrics['weighted_f1']:.4f}")
    if "roc_auc_macro_ovr" in metrics:
        print(f"ROC-AUC (macro OvR): {metrics['roc_auc_macro_ovr']:.4f}")
    print(f"Log loss:            {metrics['log_loss']:.4f}")
    print(f"\n{report_text}")
    print(f"Confusion matrix:\n{cm_df}")

    return metrics


def shap_vs_spec(model, X_test, feature_cols, out_dir):
    import shap
    print("\nComputing SHAP values on the test set (this can take a moment) ...")
    explainer = shap.TreeExplainer(model)
    # sample to keep this fast/cheap on a large test set
    sample_n = min(3000, len(X_test))
    X_sample = X_test.sample(n=sample_n, random_state=42)
    shap_values = explainer.shap_values(X_sample)

    # shap_values shape for multiclass: (n_classes, n_samples, n_features) or list-of-arrays
    if isinstance(shap_values, list):
        mean_abs = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
    else:
        mean_abs = np.abs(shap_values).mean(axis=(0, 2)) if shap_values.ndim == 3 else np.abs(shap_values).mean(axis=0)

    importance = pd.Series(mean_abs, index=feature_cols)

    rows = []
    for group, cols in FEATURE_GROUPS.items():
        present_cols = [c for c in cols if c in importance.index]
        group_importance = importance[present_cols].sum() if present_cols else 0.0
        rows.append({"parameter_group": group, "mean_abs_shap": group_importance})
    group_df = pd.DataFrame(rows)
    total = group_df["mean_abs_shap"].sum()
    group_df["model_importance_normalized"] = group_df["mean_abs_shap"] / total if total > 0 else 0.0
    group_df["spec_proposed_weight_modeA"] = group_df["parameter_group"].map(SPEC_WEIGHTS_MODE_A)
    group_df = group_df.sort_values("model_importance_normalized", ascending=False).reset_index(drop=True)

    group_df.to_csv(os.path.join(out_dir, "shap_vs_spec_weights.csv"), index=False)

    print("\n" + "=" * 78)
    print("MODEL SHAP IMPORTANCE vs. SPEC'S PROPOSED WEIGHTS (Section 1/2/3, Mode A)")
    print("=" * 78)
    with pd.option_context("display.width", 120, "display.max_colwidth", 45):
        print(group_df.to_string(index=False, float_format=lambda v: f"{v:.4f}"))

    return group_df


def main():
    ap = argparse.ArgumentParser(description="Train/validate/test the PashuParth mastitis XGBoost model.")
    ap.add_argument("--data-dir", type=str, default="./fe_output",
                     help="Directory containing train_xgb.csv, val_xgb.csv, test_xgb.csv")
    ap.add_argument("--output-dir", type=str, default="./model_output")
    ap.add_argument("--n-estimators", type=int, default=600)
    ap.add_argument("--max-depth", type=int, default=6)
    ap.add_argument("--learning-rate", type=float, default=0.05)
    ap.add_argument("--early-stopping-rounds", type=int, default=40)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--skip-shap", action="store_true", help="Skip SHAP computation (faster).")
    args = ap.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("Loading engineered splits ...")
    train_df = load_split(os.path.join(args.data_dir, "train_xgb.csv"))
    val_df = load_split(os.path.join(args.data_dir, "val_xgb.csv"))
    test_df = load_split(os.path.join(args.data_dir, "test_xgb.csv"))

    X_train, y_train, feature_cols = make_xy(train_df)
    X_val, y_val, _ = make_xy(val_df)
    X_test, y_test, _ = make_xy(test_df)

    class_names = CLASS_ORDER
    print(f"\nFeatures used ({len(feature_cols)}): {feature_cols}")
    print(f"\nClass distribution — train:\n{y_train.value_counts().sort_index()}")
    print(f"(0={class_names[0]}, 1={class_names[1]}, 2={class_names[2]})")

    # classes are heavily imbalanced (~95% / 3% / 1.5%) -> balanced sample weights
    sample_weight = compute_sample_weight(class_weight="balanced", y=y_train)

    model = xgb.XGBClassifier(
        n_estimators=args.n_estimators,
        max_depth=args.max_depth,
        learning_rate=args.learning_rate,
        objective="multi:softprob",
        num_class=len(class_names),
        eval_metric="mlogloss",
        tree_method="hist",
        enable_categorical=True,
        early_stopping_rounds=args.early_stopping_rounds,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        random_state=args.seed,
        n_jobs=-1,
    )

    print("\nTraining XGBoost (with early stopping on the validation split) ...")
    model.fit(
        X_train, y_train,
        sample_weight=sample_weight,
        eval_set=[(X_train, y_train), (X_val, y_val)],
        verbose=25,
    )
    best_iter = getattr(model, "best_iteration", None)
    print(f"\nBest iteration (early stopping): {best_iter}")

    # --- evaluate on all three splits ---
    all_metrics = {}
    all_metrics["train"] = evaluate_split(model, X_train, y_train, "train", class_names, args.output_dir)
    all_metrics["val"] = evaluate_split(model, X_val, y_val, "val", class_names, args.output_dir)
    all_metrics["test"] = evaluate_split(model, X_test, y_test, "test", class_names, args.output_dir)
    all_metrics["best_iteration"] = int(best_iter) if best_iter is not None else None
    all_metrics["n_features"] = len(feature_cols)
    all_metrics["feature_cols"] = feature_cols
    all_metrics["class_order"] = class_names

    with open(os.path.join(args.output_dir, "metrics.json"), "w") as f:
        json.dump(all_metrics, f, indent=2, default=str)

    # --- XGBoost native gain-based importance (fast, always available) ---
    booster = model.get_booster()
    gain_importance = booster.get_score(importance_type="gain")
    gain_series = pd.Series(gain_importance).sort_values(ascending=False)
    gain_series.to_csv(os.path.join(args.output_dir, "xgb_gain_importance.csv"), header=["gain"])
    print(f"\nTop 15 features by XGBoost gain importance:\n{gain_series.head(15)}")

    # --- SHAP vs spec weights comparison ---
    if not args.skip_shap:
        try:
            shap_vs_spec(model, X_test, feature_cols, args.output_dir)
        except Exception as e:
            print(f"\n[warning] SHAP comparison skipped due to error: {e}")

    # --- save the trained model ---
    model_dir = os.path.join(args.output_dir, "model")
    os.makedirs(model_dir, exist_ok=True)
    native_path = os.path.join(model_dir, "xgb_mastitis_model.ubj")
    joblib_path = os.path.join(model_dir, "xgb_mastitis_model.joblib")
    model.get_booster().save_model(native_path)
    joblib.dump(model, joblib_path)

    with open(os.path.join(model_dir, "model_card.json"), "w") as f:
        json.dump({
            "model_type": "xgboost.XGBClassifier (multi:softprob)",
            "classes": class_names,
            "n_features": len(feature_cols),
            "feature_cols": feature_cols,
            "hyperparameters": {
                "n_estimators": args.n_estimators, "max_depth": args.max_depth,
                "learning_rate": args.learning_rate,
                "early_stopping_rounds": args.early_stopping_rounds,
                "best_iteration": all_metrics["best_iteration"],
                "subsample": 0.8, "colsample_bytree": 0.8, "reg_lambda": 1.0,
            },
            "sample_weighting": "balanced (sklearn compute_sample_weight)",
            "test_accuracy": all_metrics["test"]["accuracy"],
            "test_macro_f1": all_metrics["test"]["macro_f1"],
            "test_roc_auc_macro_ovr": all_metrics["test"].get("roc_auc_macro_ovr"),
            "trained_on": "synthetic PashuParth dataset (generate_mastitis_dataset.py)",
            "target": "true_mastitis_status (ground-truth latent severity, NOT the Section 7 composite heuristic)",
        }, f, indent=2, default=str)

    print(f"\nSaved trained model to:\n  {native_path}\n  {joblib_path}")
    print(f"All metrics, confusion matrices, and SHAP comparison written to: {args.output_dir}")


if __name__ == "__main__":
    main()