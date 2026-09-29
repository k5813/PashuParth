"""
inference.py

Turns one raw sensor/context reading into the exact 89-feature row the
trained XGBoost model expects, then returns predictions in a UI-friendly
shape. Mirrors the logic in `generate_mastitis_dataset.py` and
`feature_engineering.py` from earlier in this project so a live reading is
scored the same way the training data was built.

Single-reading assumption
--------------------------
The API scores ONE point-in-time reading with no prior history for that
animal. The model was trained with rolling-window/delta features computed
from real day-over-day history; here, exactly like a brand-new animal's
first day in `feature_engineering.py`'s `add_time_series_features`, the
rolling mean is set to the current value, rolling std to 0, and the
day-over-day delta to 0 — i.e. "no evidence of a trend yet" rather than
"no trend exists". This is documented in the API response so it's never
confused with a real multi-day trend read.
"""

import json
import os

import joblib
import numpy as np
import pandas as pd

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")

# --------------------------------------------------------------------------
# Spec cutoff tables (identical to generate_mastitis_dataset.py Sections 1-4)
# --------------------------------------------------------------------------

CUTOFFS = {
    "EC": {"Cattle": (4.50, 4.90, 5.30), "Buffalo": (3.80, 4.30, 5.00)},
    "pH": {"Cattle": (6.70, 6.85, 6.95), "Buffalo": (6.55, 6.70, 6.90)},
    "SCC": {"Cattle": (2.0, 3.5, 5.0), "Buffalo": (2.0, 3.5, 5.0)},
    "udder_temp": {"Cattle": (33.80, 34.30, 34.80), "Buffalo": (33.70, 34.00, 34.30)},
    "milk_temp": {"Cattle": (34.00, 34.30, 34.70), "Buffalo": (33.50, 34.50, 35.30)},
    "yield_dev": {"Cattle": (5, 10, 20), "Buffalo": (5, 10, 20)},
    "duration_dev": {"Cattle": (10, 20, 35), "Buffalo": (10, 20, 35)},
    "body_temp": {"Cattle": (39.2, 39.5, 40.0), "Buffalo": (38.8, 39.2, 39.7)},
    "rumination_drop": {"Cattle": (5, 15, 25), "Buffalo": (5, 15, 25)},
    "standing_lying_dev": {"Cattle": (10, 20, 35), "Buffalo": (10, 20, 35)},
    "THI": {"Cattle": (72, 78, 83), "Buffalo": (74, 78, 83)},
}
THI_BAND_NAMES = ["Normal", "Alert", "Danger", "Emergency"]
ORDINAL_ORDER = {
    "lactation_stage": ["early", "mid", "late"],
    "parity_bucket": ["1", "2-3", "4+"],
    "THI_band": THI_BAND_NAMES,
}
SPECIES_CATEGORIES = ["Cattle", "Buffalo"]
BREED_CATEGORIES = ["indigenous", "crossbred", "exotic"]

# Section 7 composite score weights (Mode A/B), for the reference heuristic
WEIGHTS_MODE_A = {
    "EC": 0.30, "pH": 0.22, "udder_temp": 0.08, "milk_temp": 0.05,
    "yield_dev": 0.08, "duration_dev": 0.04, "flow_flag": 0.04,
    "body_temp": 0.10, "rumination_drop": 0.10, "standing_lying_dev": 0.03,
}
WEIGHTS_MODE_B = {
    "EC": 0.20, "pH": 0.15, "SCC": 0.25, "udder_temp": 0.08, "milk_temp": 0.05,
    "yield_dev": 0.08, "duration_dev": 0.04, "flow_flag": 0.04,
    "body_temp": 0.10, "rumination_drop": 0.10, "standing_lying_dev": 0.03,
}
COMPOSITE_BAND_CUTOFFS = (0.50, 1.20, 2.00)


def risk_level(value, cutoffs):
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    no_max, low_max, mod_max = cutoffs
    if value < no_max:
        return 0
    if value < low_max:
        return 1
    if value < mod_max:
        return 2
    return 3


RISK_BAND_NAMES = ["No Risk", "Low Risk", "Moderate Risk", "High Risk"]


def composite_band(score):
    lo, mid, hi = COMPOSITE_BAND_CUTOFFS
    if score < lo:
        return "No Risk"
    if score < mid:
        return "Low Risk"
    if score < hi:
        return "Moderate Risk"
    return "High Risk"


# --------------------------------------------------------------------------
# Model bundle
# --------------------------------------------------------------------------

class ModelBundle:
    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        self.model = joblib.load(os.path.join(artifacts_dir, "xgb_mastitis_model.joblib"))
        self.ordinal_encoder = joblib.load(os.path.join(artifacts_dir, "ordinal_encoder.joblib"))
        self.target_encoder = joblib.load(os.path.join(artifacts_dir, "target_label_encoder.joblib"))
        with open(os.path.join(artifacts_dir, "model_card.json")) as f:
            self.model_card = json.load(f)
        self.feature_cols = self.model_card["feature_cols"]
        self.class_names = list(self.target_encoder.classes_)  # true order, read from the fitted encoder


BUNDLE = ModelBundle()


# --------------------------------------------------------------------------
# Reading -> feature row
# --------------------------------------------------------------------------

def build_feature_row(reading: dict) -> pd.DataFrame:
    species = reading["species"]

    ec_r = risk_level(reading["EC_mScm"], CUTOFFS["EC"][species])
    ph_r = risk_level(reading["pH"], CUTOFFS["pH"][species])
    udder_r = risk_level(reading["udder_temp_C"], CUTOFFS["udder_temp"][species])
    milk_r = risk_level(reading["milk_temp_C"], CUTOFFS["milk_temp"][species])
    scc_r = risk_level(reading.get("SCC_x1e5_ml"), CUTOFFS["SCC"][species]) if reading.get("SCC_available") else None
    yield_r = risk_level(reading["yield_deviation_pct"], CUTOFFS["yield_dev"][species])
    dur_r = risk_level(reading["duration_deviation_pct"], CUTOFFS["duration_dev"][species])
    flow_r = 3 if reading["abnormal_flow_flag"] else 0
    body_r = risk_level(reading["body_temp_C"], CUTOFFS["body_temp"][species])
    rum_r = risk_level(reading["rumination_drop_pct"], CUTOFFS["rumination_drop"][species])
    stand_r = risk_level(reading["standing_lying_deviation_pct"], CUTOFFS["standing_lying_dev"][species])
    thi_r = risk_level(reading["THI"], CUTOFFS["THI"][species])
    thi_band = THI_BAND_NAMES[thi_r]
    heat_stress_flag = int(thi_band in ("Danger", "Emergency"))

    row = {
        "prior_mastitis_history": int(reading["prior_mastitis_history"]),
        "vaccination_status": int(reading["vaccination_status"]),
        "SCC_available": int(reading.get("SCC_available", False)),
        "abnormal_flow_flag": int(reading["abnormal_flow_flag"]),
        "prior_mastitis_episodes": reading.get("prior_mastitis_episodes", 0),
        "ammonia_ppm": reading["ammonia_ppm"],
        "co2_ppm": reading["co2_ppm"],
        "co_ppm": reading["co_ppm"],
        "THI": reading["THI"],
        "EC_mScm": reading["EC_mScm"],
        "pH": reading["pH"],
        "udder_temp_C": reading["udder_temp_C"],
        "milk_temp_C": reading["milk_temp_C"],
        "yield_deviation_pct": reading["yield_deviation_pct"],
        "duration_deviation_pct": reading["duration_deviation_pct"],
        "body_temp_C": reading["body_temp_C"],
        "rumination_drop_pct": reading["rumination_drop_pct"],
        "standing_lying_deviation_pct": reading["standing_lying_deviation_pct"],
        "EC_risk_level": ec_r,
        "pH_risk_level": ph_r,
        "SCC_risk_level": scc_r if scc_r is not None else np.nan,
        "udder_temp_risk_level": udder_r,
        "milk_temp_risk_level": milk_r,
        "yield_risk_level": yield_r,
        "duration_risk_level": dur_r,
        "flow_risk_level": flow_r,
        "body_temp_risk_level": body_r,
        "rumination_risk_level": rum_r,
        "standing_lying_risk_level": stand_r,
        "SCC_x1e5_ml": reading.get("SCC_x1e5_ml") if reading.get("SCC_available") else np.nan,
        "heat_stress_flag": heat_stress_flag,
        "EC_x_heat_stress": reading["EC_mScm"] * heat_stress_flag,
        "udder_temp_x_heat_stress": reading["udder_temp_C"] * heat_stress_flag,
        "body_temp_x_heat_stress": reading["body_temp_C"] * heat_stress_flag,
    }

    # no-history fallback: roll_mean = current value, roll_std = 0, delta = 0
    for base_col in [
        "EC_mScm", "pH", "udder_temp_C", "milk_temp_C", "yield_deviation_pct",
        "duration_deviation_pct", "body_temp_C", "rumination_drop_pct",
        "standing_lying_deviation_pct", "THI",
    ]:
        val = row[base_col]
        row[f"{base_col}_roll3_mean"] = val
        row[f"{base_col}_roll3_std"] = 0.0
        row[f"{base_col}_roll7_mean"] = val
        row[f"{base_col}_roll7_std"] = 0.0
        row[f"{base_col}_delta1"] = 0.0

    # ordinal encoding via the saved fitted encoder
    ord_input = pd.DataFrame(
        [[reading["lactation_stage"], reading["parity_bucket"], thi_band]],
        columns=["lactation_stage", "parity_bucket", "THI_band"],
    ).astype(str)
    ord_vals = BUNDLE.ordinal_encoder.transform(ord_input)[0]
    row["lactation_stage_ord"] = ord_vals[0]
    row["parity_bucket_ord"] = ord_vals[1]
    row["THI_band_ord"] = ord_vals[2]

    df = pd.DataFrame([row])
    df["species"] = pd.Categorical([species], categories=SPECIES_CATEGORIES)
    df["breed_category"] = pd.Categorical([reading["breed_category"]], categories=BREED_CATEGORIES)

    df = df.reindex(columns=BUNDLE.feature_cols)
    return df, {
        "EC": ec_r, "pH": ph_r, "SCC": scc_r, "udder_temp": udder_r, "milk_temp": milk_r,
        "yield_dev": yield_r, "duration_dev": dur_r, "flow_flag": flow_r,
        "body_temp": body_r, "rumination_drop": rum_r, "standing_lying_dev": stand_r,
    }, thi_band, heat_stress_flag


def composite_score(risk_levels: dict, scc_available: bool):
    weights = WEIGHTS_MODE_B if scc_available and risk_levels.get("SCC") is not None else WEIGHTS_MODE_A
    score = 0.0
    for k, w in weights.items():
        level = risk_levels.get(k)
        if level is None:
            continue
        score += w * level
    return round(score, 4), composite_band(score)


def predict(reading: dict) -> dict:
    X, risk_levels, thi_band, heat_stress_flag = build_feature_row(reading)
    proba = BUNDLE.model.predict_proba(X)[0]
    pred_id = int(np.argmax(proba))
    pred_class = BUNDLE.class_names[pred_id]

    probs = {cls: round(float(p), 4) for cls, p in zip(BUNDLE.class_names, proba)}
    comp_score, comp_band = composite_score(risk_levels, reading.get("SCC_available", False))

    per_param_risk = {
        k: (RISK_BAND_NAMES[v] if v is not None else "N/A (no lab SCC)")
        for k, v in risk_levels.items()
    }

    return {
        "predicted_class": pred_class,
        "class_probabilities": probs,
        "confidence": round(float(proba[pred_id]), 4),
        "per_parameter_risk_band": per_param_risk,
        "thi_band": thi_band,
        "heat_stress_flag": bool(heat_stress_flag),
        "heat_stress_note": (
            "THI is in Danger/Emergency band — elevated EC/udder/body temperature may be "
            "heat-stress-driven rather than mastitis-driven (spec Section 4)."
            if heat_stress_flag else None
        ),
        "composite_heuristic_score": comp_score,
        "composite_heuristic_band": comp_band,
        "note": (
            "Single point-in-time reading, no prior history: rolling/trend features "
            "default to 'no evidence of a trend yet', not 'stable'."
        ),
    }
