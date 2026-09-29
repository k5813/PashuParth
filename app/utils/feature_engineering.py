#!/usr/bin/env python3
"""
feature_engineering.py

Feature engineering for the PashuParth mastitis synthetic dataset
(`generate_mastitis_dataset.py` output), matching how the spec says the two
target model families should each be fed:

  - XGBoost handles categoricals and missing values natively (Section 1's
    own instruction: SCC should be "a nullable feature" the model can use
    *if present*, never imputed to look real) -> a `*_xgb.csv` table with
    ordinal-encoded categoricals and NaNs left as NaN.
  - LSTM/TFT need dense, scaled, fully-imputed numeric input with static
    covariates one-hot/ordinal encoded -> a `*_nn.csv` table, fully imputed
    and standardized, ready to reshape into (animal, time, feature)
    sequences.

Leakage discipline
-------------------
- All encoders/scalers/imputers are FIT ON THE TRAIN SPLIT ONLY, then reused
  to transform validation/test — never fit on the full dataset.
- The split is GROUPED by `animal_id` (GroupShuffleSplit), so no animal's
  days leak across train/val/test — a plain random row split would leak
  through the per-animal random baseline offset and trajectory.
- `true_latent_severity` / `true_mastitis_status` are kept as targets only,
  never as features. `composite_score_modeA/B` and `composite_risk_band_*`
  (Section 7's v0 heuristic) are dropped from the feature matrix entirely —
  they're a deterministic reweighting of columns already in the feature set,
  and the spec is explicit that they're a stopgap to be replaced by the
  trained model's own output, not an input to it. They're kept in a
  reference-only sidecar file so SHAP output can still be compared against
  them per the doc's closing instructions.

Time-series features
---------------------
Per-animal rolling means/stds and day-over-day deltas are added for the
core leading/lagging signals, using `.shift(1)` before any rolling/diff so
a row only ever sees *past* days of that same animal — never the current or
future day's own value of another engineered column.

Saved artifacts (under --artifacts-dir)
----------------------------------------
- ordinal_encoder.joblib          (ordinal categoricals -> XGBoost path)
- onehot_encoder.joblib           (nominal categoricals -> NN path)
- numeric_imputer.joblib          (median imputer -> NN path only)
- numeric_scaler.joblib           (StandardScaler -> NN path only)
- target_label_encoder.joblib     (true_mastitis_status -> class ids)
- feature_metadata.json           (column lists, split sizes, category orders)

Usage:
    python feature_engineering.py --input data/mastitis_synthetic_dataset.csv --output-dir ./fe_output --artifacts-dir ./fe_output/encoders
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

# --------------------------------------------------------------------------
# Column groups
# --------------------------------------------------------------------------

ID_COLS = ["animal_id", "farm_id", "day"]

TARGET_COLS = ["true_latent_severity", "true_mastitis_status"]

# Section 7 heuristic outputs: reference-only, never a model feature.
HEURISTIC_COLS = [
    "composite_score_modeA", "composite_risk_band_modeA",
    "composite_score_modeB", "composite_risk_band_modeB",
]

BOOL_COLS = [
    "prior_mastitis_history", "vaccination_status", "SCC_available", "abnormal_flow_flag",
]

NOMINAL_COLS = ["species", "breed_category"]

ORDINAL_COLS = {
    "lactation_stage": ["early", "mid", "late"],
    "parity_bucket": ["1", "2-3", "4+"],
    "THI_band": ["Normal", "Alert", "Danger", "Emergency"],
}

TIME_SERIES_NUMERIC = [
    "EC_mScm", "pH", "udder_temp_C", "milk_temp_C",
    "yield_deviation_pct", "duration_deviation_pct",
    "body_temp_C", "rumination_drop_pct", "standing_lying_deviation_pct",
    "THI",
]

STATIC_NUMERIC = [
    "prior_mastitis_episodes", "ammonia_ppm", "co_ppm", "co2_ppm",
]

RISK_LEVEL_COLS = [
    "EC_risk_level", "pH_risk_level", "SCC_risk_level", "udder_temp_risk_level",
    "milk_temp_risk_level", "yield_risk_level", "duration_risk_level", "flow_risk_level",
    "body_temp_risk_level", "rumination_risk_level", "standing_lying_risk_level",
]

SCC_RAW_COL = "SCC_x1e5_ml"

ROLL_WINDOWS = [3, 7]



def add_time_series_features(df):
    df = df.sort_values(["animal_id", "day"]).reset_index(drop=True)
    g = df.groupby("animal_id", sort=False)

    new_cols = {}
    for col in TIME_SERIES_NUMERIC:
        past = g[col].shift(1)
        for w in ROLL_WINDOWS:
            new_cols[f"{col}_roll{w}_mean"] = past.groupby(df["animal_id"]).transform(
                lambda s: s.rolling(w, min_periods=1).mean()
            )
            new_cols[f"{col}_roll{w}_std"] = past.groupby(df["animal_id"]).transform(
                lambda s: s.rolling(w, min_periods=1).std()
            )
        new_cols[f"{col}_delta1"] = df[col] - past

    ts_df = pd.DataFrame(new_cols)
    for col in TIME_SERIES_NUMERIC:
        for w in ROLL_WINDOWS:
            ts_df[f"{col}_roll{w}_mean"] = ts_df[f"{col}_roll{w}_mean"].fillna(df[col])
            ts_df[f"{col}_roll{w}_std"] = ts_df[f"{col}_roll{w}_std"].fillna(0.0)
        ts_df[f"{col}_delta1"] = ts_df[f"{col}_delta1"].fillna(0.0)

    return pd.concat([df, ts_df], axis=1)


def add_interaction_features(df):
    """
    Section 4: THI is a MODIFIER on milk-quality/body-temp features, not an
    independent classifier input. Encode that relationship explicitly as
    interaction terms so a heat-wave-driven EC/temp bump is distinguishable
    from a mastitis-driven one, rather than relying on the model to discover
    the interaction purely from THI's own column.
    """
    heat_flag = df["THI_band"].isin(["Danger", "Emergency"]).astype(int)
    df["heat_stress_flag"] = heat_flag
    df["EC_x_heat_stress"] = df["EC_mScm"] * heat_flag
    df["udder_temp_x_heat_stress"] = df["udder_temp_C"] * heat_flag
    df["body_temp_x_heat_stress"] = df["body_temp_C"] * heat_flag
    return df



def fit_encoders(train_df):
    encoders = {}

    ordinal_source = train_df[list(ORDINAL_COLS.keys())].astype(str)
    ordinal_categories = [ORDINAL_COLS[c] for c in ORDINAL_COLS]
    ordinal_enc = OrdinalEncoder(
        categories=ordinal_categories,
        handle_unknown="use_encoded_value", unknown_value=-1,
    )
    ordinal_enc.fit(ordinal_source)
    encoders["ordinal"] = ordinal_enc

    onehot_enc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    onehot_enc.fit(train_df[NOMINAL_COLS].astype(str))
    encoders["onehot"] = onehot_enc

    target_enc = LabelEncoder()
    target_enc.fit(train_df["true_mastitis_status"].astype(str))
    encoders["target"] = target_enc

    return encoders


def fit_nn_numeric_transforms(train_df, numeric_cols):
    imputer = SimpleImputer(strategy="median")
    imputer.fit(train_df[numeric_cols])

    scaler = StandardScaler()
    scaler.fit(imputer.transform(train_df[numeric_cols]))

    return imputer, scaler


def build_xgb_table(df, encoders, numeric_cols):
    out = df[ID_COLS + TARGET_COLS].copy()

    ordinal_vals = encoders["ordinal"].transform(df[list(ORDINAL_COLS.keys())].astype(str))
    for i, col in enumerate(ORDINAL_COLS.keys()):
        out[f"{col}_ord"] = ordinal_vals[:, i]

    for col in NOMINAL_COLS:
        out[col] = df[col].astype("category")

    for col in BOOL_COLS:
        out[col] = df[col].astype(int)

    for col in numeric_cols:
        out[col] = df[col]
    for col in RISK_LEVEL_COLS:
        out[col] = df[col]
    out[SCC_RAW_COL] = df[SCC_RAW_COL]

    for col in ["heat_stress_flag", "EC_x_heat_stress", "udder_temp_x_heat_stress", "body_temp_x_heat_stress"]:
        out[col] = df[col]

    out["true_mastitis_status_id"] = encoders["target"].transform(df["true_mastitis_status"].astype(str))
    return out


def build_nn_table(df, encoders, imputer, scaler, numeric_cols):
    out = df[ID_COLS + TARGET_COLS].copy()

    ordinal_vals = encoders["ordinal"].transform(df[list(ORDINAL_COLS.keys())].astype(str))
    for i, col in enumerate(ORDINAL_COLS.keys()):
        out[f"{col}_ord"] = ordinal_vals[:, i]

    onehot_vals = encoders["onehot"].transform(df[NOMINAL_COLS].astype(str))
    onehot_names = encoders["onehot"].get_feature_names_out(NOMINAL_COLS)
    for i, name in enumerate(onehot_names):
        out[name] = onehot_vals[:, i]

    for col in BOOL_COLS:
        out[col] = df[col].astype(int)

    numeric_full = numeric_cols + RISK_LEVEL_COLS + [SCC_RAW_COL]
    imputed = imputer.transform(df[numeric_full])
    scaled = scaler.transform(imputed)
    for i, col in enumerate(numeric_full):
        out[f"{col}_scaled"] = scaled[:, i]

    for col in ["heat_stress_flag", "EC_x_heat_stress", "udder_temp_x_heat_stress", "body_temp_x_heat_stress"]:
        out[col] = df[col]

    out["true_mastitis_status_id"] = encoders["target"].transform(df["true_mastitis_status"].astype(str))
    return out



def main():
    ap = argparse.ArgumentParser(description="Feature-engineer the PashuParth mastitis dataset.")
    ap.add_argument("--input", type=str, required=True)
    ap.add_argument("--output-dir", type=str, default="./fe_output")
    ap.add_argument("--artifacts-dir", type=str, default=None,
                     help="Defaults to <output-dir>/encoders")
    ap.add_argument("--test-size", type=float, default=0.15)
    ap.add_argument("--val-size", type=float, default=0.15)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    artifacts_dir = args.artifacts_dir or os.path.join(args.output_dir, "encoders")
    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)

    print(f"Loading {args.input} ...")
    df = pd.read_csv(args.input)

    print("Adding time-series (lag/rolling) features ...")
    df = add_time_series_features(df)

    print("Adding THI interaction features ...")
    df = add_interaction_features(df)

    numeric_cols = TIME_SERIES_NUMERIC + STATIC_NUMERIC + [
        c for c in df.columns
        if any(c.startswith(f"{base}_roll") or c.endswith("_delta1") for base in TIME_SERIES_NUMERIC)
    ]
    numeric_cols = sorted(set(numeric_cols))

    print("Splitting by animal_id (group split, no leakage across splits) ...")
    gss1 = GroupShuffleSplit(n_splits=1, test_size=args.test_size, random_state=args.seed)
    trainval_idx, test_idx = next(gss1.split(df, groups=df["animal_id"]))
    trainval_df, test_df = df.iloc[trainval_idx], df.iloc[test_idx]

    val_fraction_of_trainval = args.val_size / (1 - args.test_size)
    gss2 = GroupShuffleSplit(n_splits=1, test_size=val_fraction_of_trainval, random_state=args.seed)
    train_idx, val_idx = next(gss2.split(trainval_df, groups=trainval_df["animal_id"]))
    train_df = trainval_df.iloc[train_idx]
    val_df = trainval_df.iloc[val_idx]

    print(f"  train: {len(train_df):,} rows / {train_df['animal_id'].nunique():,} animals")
    print(f"  val:   {len(val_df):,} rows / {val_df['animal_id'].nunique():,} animals")
    print(f"  test:  {len(test_df):,} rows / {test_df['animal_id'].nunique():,} animals")

    print("Fitting encoders on train split only ...")
    encoders = fit_encoders(train_df)
    numeric_full_for_nn = numeric_cols + RISK_LEVEL_COLS + [SCC_RAW_COL]
    imputer, scaler = fit_nn_numeric_transforms(train_df, numeric_full_for_nn)

    splits = {"train": train_df, "val": val_df, "test": test_df}
    for name, split_df in splits.items():
        print(f"Encoding '{name}' split ...")
        xgb_table = build_xgb_table(split_df, encoders, numeric_cols)
        nn_table = build_nn_table(split_df, encoders, imputer, scaler, numeric_cols)

        heuristic_ref = split_df[["animal_id", "day"] + HEURISTIC_COLS].copy()

        xgb_table.to_csv(os.path.join(args.output_dir, f"{name}_xgb.csv"), index=False)
        nn_table.to_csv(os.path.join(args.output_dir, f"{name}_nn.csv"), index=False)
        heuristic_ref.to_csv(os.path.join(args.output_dir, f"{name}_heuristic_reference.csv"), index=False)

    print(f"Saving fitted encoders/scalers to {artifacts_dir} ...")
    joblib.dump(encoders["ordinal"], os.path.join(artifacts_dir, "ordinal_encoder.joblib"))
    joblib.dump(encoders["onehot"], os.path.join(artifacts_dir, "onehot_encoder.joblib"))
    joblib.dump(encoders["target"], os.path.join(artifacts_dir, "target_label_encoder.joblib"))
    joblib.dump(imputer, os.path.join(artifacts_dir, "numeric_imputer.joblib"))
    joblib.dump(scaler, os.path.join(artifacts_dir, "numeric_scaler.joblib"))

    metadata = {
        "id_cols": ID_COLS,
        "target_cols": TARGET_COLS,
        "target_classes": list(encoders["target"].classes_),
        "heuristic_reference_cols": HEURISTIC_COLS,
        "bool_cols": BOOL_COLS,
        "nominal_cols": NOMINAL_COLS,
        "ordinal_cols_and_order": ORDINAL_COLS,
        "time_series_numeric_base_cols": TIME_SERIES_NUMERIC,
        "rolling_windows": ROLL_WINDOWS,
        "static_numeric_cols": STATIC_NUMERIC,
        "risk_level_cols": RISK_LEVEL_COLS,
        "scc_raw_col": SCC_RAW_COL,
        "numeric_cols_used_for_nn_impute_scale": numeric_full_for_nn,
        "split_sizes": {k: {"rows": len(v), "animals": int(v["animal_id"].nunique())} for k, v in splits.items()},
        "split_seed": args.seed,
        "test_size": args.test_size,
        "val_size": args.val_size,
        "notes": [
            "Fit only on train split; val/test are transform-only.",
            "composite_score_modeA/B and composite_risk_band_modeA/B are excluded "
            "from both feature tables and saved separately as *_heuristic_reference.csv "
            "for comparing trained-model SHAP output against the spec's proposed weights.",
            "xgb_*.csv keeps SCC and its risk level as native NaN (no imputation); "
            "nn_*.csv median-imputes and standardizes them, with SCC_available as a flag.",
        ],
    }
    with open(os.path.join(args.output_dir, "feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    print("Done.")
    print(f"Outputs written to: {args.output_dir}")
    print(f"Artifacts written to: {artifacts_dir}")


if __name__ == "__main__":
    main()