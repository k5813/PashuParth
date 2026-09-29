"""
main.py — FastAPI backend for the PashuParth mastitis risk model.

Endpoints:
  GET  /health              liveness/model-info check
  GET  /example-cases       named extreme/edge test cases (see test_cases.json)
  GET  /feature-importance  SHAP-vs-spec-weight comparison from training
  POST /predict              score one raw sensor/context reading

Run:
    uvicorn main:app --reload --port 8000
"""

import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal
import pandas as pd

import inference

APP_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="PashuParth Mastitis Risk API",
    description="Serves the trained XGBoost mastitis risk classifier for single-reading, what-if, and outlier testing.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local test tool; tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Request schema — generous bounds on purpose, so genuinely extreme/outlier
# readings (sensor faults, etc.) can still reach the model rather than being
# rejected outright. Only physically nonsensical values (negative pH,
# negative concentrations) are blocked.
# --------------------------------------------------------------------------

class AnimalReading(BaseModel):
    species: Literal["Cattle", "Buffalo"]
    breed_category: Literal["indigenous", "crossbred", "exotic"]
    lactation_stage: Literal["early", "mid", "late"]
    parity_bucket: Literal["1", "2-3", "4+"]
    prior_mastitis_history: bool = False
    prior_mastitis_episodes: int = Field(0, ge=0, le=20)
    vaccination_status: bool = False

    EC_mScm: float = Field(..., ge=0, le=25, description="Electrical conductivity, mS/cm")
    pH: float = Field(..., ge=0, le=14)
    SCC_available: bool = Field(False, description="Whether a lab SCC value is present (Mode B)")
    SCC_x1e5_ml: Optional[float] = Field(None, ge=0, le=50, description="Somatic cell count, x10^5/ml")

    udder_temp_C: float = Field(..., ge=-10, le=60)
    milk_temp_C: float = Field(..., ge=-10, le=60)

    yield_deviation_pct: float = Field(..., ge=0, le=500)
    duration_deviation_pct: float = Field(..., ge=0, le=500)
    abnormal_flow_flag: bool = False

    body_temp_C: float = Field(..., ge=-10, le=60)
    rumination_drop_pct: float = Field(..., ge=0, le=500)
    standing_lying_deviation_pct: float = Field(..., ge=0, le=500)

    THI: float = Field(..., ge=0, le=150)
    ammonia_ppm: float = Field(..., ge=0, le=100000)
    co_ppm: float = Field(..., ge=0, le=100000)
    co2_ppm: float = Field(..., ge=0, le=100000)

    class Config:
        json_schema_extra = {
            "example": {
                "species": "Cattle", "breed_category": "crossbred", "lactation_stage": "mid",
                "parity_bucket": "2-3", "prior_mastitis_history": False, "prior_mastitis_episodes": 0,
                "vaccination_status": True, "EC_mScm": 4.1, "pH": 6.60, "SCC_available": False,
                "SCC_x1e5_ml": None, "udder_temp_C": 33.6, "milk_temp_C": 34.0,
                "yield_deviation_pct": 2, "duration_deviation_pct": 4, "abnormal_flow_flag": False,
                "body_temp_C": 38.7, "rumination_drop_pct": 2, "standing_lying_deviation_pct": 4,
                "THI": 65, "ammonia_ppm": 10, "co_ppm": 1.0, "co2_ppm": 800,
            }
        }


class PredictionResponse(BaseModel):
    predicted_class: str
    class_probabilities: dict
    confidence: float
    per_parameter_risk_band: dict
    thi_band: str
    heat_stress_flag: bool
    heat_stress_note: Optional[str]
    composite_heuristic_score: float
    composite_heuristic_band: str
    note: str


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_type": inference.BUNDLE.model_card["model_type"],
        "classes": inference.BUNDLE.class_names,
        "n_features": inference.BUNDLE.model_card["n_features"],
        "test_accuracy_at_training": inference.BUNDLE.model_card.get("test_accuracy"),
        "test_macro_f1_at_training": inference.BUNDLE.model_card.get("test_macro_f1"),
    }


@app.get("/example-cases")
def example_cases():
    path = os.path.join(APP_DIR, "test_cases.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="test_cases.json not found")
    with open(path) as f:
        return json.load(f)


@app.get("/feature-importance")
def feature_importance():
    path = os.path.join(APP_DIR, "artifacts", "shap_vs_spec_weights.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="shap_vs_spec_weights.csv not found")
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.post("/predict", response_model=PredictionResponse)
def predict(reading: AnimalReading):
    payload = reading.model_dump()
    if payload.get("SCC_available") and payload.get("SCC_x1e5_ml") is None:
        raise HTTPException(status_code=422, detail="SCC_available=true requires SCC_x1e5_ml to be set.")
    try:
        result = inference.predict(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
