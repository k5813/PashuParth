# PashuParth Mastitis Risk — Test Bench (FastAPI + Streamlit)

Serves the trained XGBoost mastitis-risk classifier behind a FastAPI backend,
with a Streamlit frontend for interactive testing — including 11 curated
extreme/edge/outlier cases.

## Structure

```
app/
├── backend/
│   ├── main.py              FastAPI app (/health, /predict, /example-cases, /feature-importance)
│   ├── inference.py         raw reading -> 89-feature row -> model prediction
│   ├── test_cases.json      11 curated extreme/edge/outlier cases
│   ├── requirements.txt
│   └── artifacts/           bundled trained model + encoders (from earlier steps)
│       ├── xgb_mastitis_model.joblib
│       ├── ordinal_encoder.joblib
│       ├── target_label_encoder.joblib
│       ├── model_card.json
│       └── shap_vs_spec_weights.csv
└── frontend/
    ├── app.py                Streamlit UI
    └── requirements.txt
```

## Run

Terminal 1 — backend:
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Terminal 2 — frontend:
```
cd frontend
pip install -r requirements.txt
streamlit run app.py
```

Then open the Streamlit URL it prints (usually http://localhost:8501).
If the backend runs somewhere other than localhost:8000, set
`PASHUPARTH_API_URL` before launching Streamlit.

## API quick reference

- `GET /health` — model info, classes, training-time test accuracy/F1
- `GET /example-cases` — the 11 preset cases below, as JSON
- `GET /feature-importance` — SHAP-vs-spec-weight comparison from training
- `POST /predict` — score one reading (see `AnimalReading` schema in `main.py`
  for every field; Pydantic bounds are intentionally wide so extreme values
  still reach the model rather than being rejected outright)

## The 11 preset extreme/edge cases

| Case | What it probes |
|---|---|
| `healthy_cattle_baseline` / `healthy_buffalo_baseline` | Sanity check — clean readings should predict "none" confidently |
| `clinical_mastitis_cattle_severe` / `..._buffalo_severe` | Every parameter deep in High-Risk, no heat confound — should predict "clinical" |
| `heat_stress_false_positive_cattle` | THI Emergency (88) drives up EC/temperature readings with no other mastitis signal — the exact false-positive scenario the spec's Section 4 warns about |
| `exact_boundary_case_cattle` | Every value sits exactly on its own published cutoff |
| `sensor_malfunction_extreme` | Physiologically impossible readings (EC 12, pH 9, body temp 44°C, THI 110) — an out-of-distribution stress test, not a "correct answer" test |
| `species_conditioning_demo_as_cattle` / `..._as_buffalo` | Identical raw numbers (EC 4.6, pH 6.8), only `species` differs — shows the same reading is Low-Risk for cattle but Moderate-Risk for buffalo |
| `borderline_subclinical_multi_weak_signal` | No single High-Risk reading, but every parameter is simultaneously Moderate — tests whether the model aggregates weak signals correctly |
| `vaccinated_history_but_currently_healthy` | 3 prior episodes + vaccination, but today's readings are clean — fairness check that history doesn't override clean current data |

## What running these actually showed (from local testing)

- The model resisted the heat-stress false positive (predicted "none", 79%
  confidence) while the Section 7 composite heuristic called it "Moderate
  Risk" — a concrete example of the learned model outperforming the hand-tuned
  heuristic on exactly the confound the spec flagged.
- On the borderline multi-weak-signal case, the model correctly called
  "subclinical" while the composite heuristic's score landed almost exactly
  on its own "High Risk" cutoff — another case where naive weighted-sum
  scoring overstates severity relative to the trained model.
- On the sensor-malfunction case, the model returned "none" with 97%
  confidence despite physically nonsensical inputs — a reminder that this
  model (like most classifiers) doesn't know when its input is garbage.
  A production deployment should put a plausibility/range-check layer in
  front of the model, not rely on it to flag its own out-of-distribution
  inputs.
- One boundary nuance worth knowing: the shared `risk_level()` cutoff
  function (used consistently since `generate_mastitis_dataset.py`) treats
  every band boundary as a strict "<" comparison. That matches how the EC/pH/
  etc. tables in the spec are written ("No Risk: <4.50"), but the THI table
  in Section 4 is written with an inclusive upper bound ("Normal ≤72"). At
  exactly THI=72 or THI=83 this pipeline will band one tier higher than a
  literal reading of the THI table — visible in `exact_boundary_case_cattle`
  where THI=83 is classified "Emergency" rather than "Danger". Worth fixing
  in `inference.py`/`generate_mastitis_dataset.py` if THI boundary precision
  matters for production use.
