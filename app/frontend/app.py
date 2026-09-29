"""
app.py — Streamlit frontend for the PashuParth mastitis risk API.

Two ways to test the model:
  1. "Preset test cases" tab — one-click extreme/edge/outlier cases
     (healthy baselines, severe clinical cases, a heat-stress false-positive,
     exact cutoff boundaries, a sensor-malfunction stress test, a
     species-conditioning A/B pair, and a fairness check).
  2. "Manual input" tab — build any reading by hand with sliders/inputs to
     probe the model further.

Run (with the backend already running on :8000):
    streamlit run app.py
"""

import os

import requests
import streamlit as st
import pandas as pd

API_URL = os.environ.get("PASHUPARTH_API_URL", "http://localhost:8000")

st.set_page_config(page_title="PashuParth Mastitis Risk Tester", layout="wide")


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

@st.cache_data(ttl=30)
def get_health():
    r = requests.get(f"{API_URL}/health", timeout=10)
    r.raise_for_status()
    return r.json()


@st.cache_data(ttl=30)
def get_example_cases():
    r = requests.get(f"{API_URL}/example-cases", timeout=10)
    r.raise_for_status()
    return r.json()


@st.cache_data(ttl=30)
def get_feature_importance():
    r = requests.get(f"{API_URL}/feature-importance", timeout=10)
    r.raise_for_status()
    return pd.DataFrame(r.json())


def call_predict(reading: dict):
    r = requests.post(f"{API_URL}/predict", json=reading, timeout=15)
    return r.status_code, (r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text)


CLASS_COLORS = {"none": "🟢", "subclinical": "🟡", "clinical": "🔴"}
BAND_COLORS = {
    "No Risk": "🟢", "Low Risk": "🟡", "Moderate Risk": "🟠", "High Risk": "🔴",
    "N/A (no lab SCC)": "⚪",
}


def render_result(result: dict):
    cls = result["predicted_class"]
    st.markdown(f"### {CLASS_COLORS.get(cls, '⚪')} Predicted: **{cls.upper()}**  (confidence {result['confidence']:.1%})")

    cols = st.columns(3)
    for i, (name, p) in enumerate(result["class_probabilities"].items()):
        cols[i].metric(f"P({name})", f"{p:.1%}")

    if result.get("heat_stress_flag"):
        st.warning(f"🌡️ **THI band: {result['thi_band']}** — {result['heat_stress_note']}")
    else:
        st.caption(f"THI band: {result['thi_band']} (no heat-stress confound flagged)")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Per-parameter risk band** (spec cutoffs, Section 1-3)")
        risk_df = pd.DataFrame([
            {"parameter": k, "band": v} for k, v in result["per_parameter_risk_band"].items()
        ])
        st.dataframe(risk_df, hide_index=True, use_container_width=True)
    with c2:
        st.markdown("**Section 7 composite heuristic** (reference only, not model input)")
        st.metric("Composite score (0-3)", result["composite_heuristic_score"])
        st.metric("Composite band", f"{BAND_COLORS.get(result['composite_heuristic_band'], '')} {result['composite_heuristic_band']}")
        if result["composite_heuristic_band"] != cls_to_band(cls):
            st.info("ℹ️ The trained model and the hand-tuned heuristic disagree here — "
                    "worth comparing which one you'd trust more for this reading.")

    st.caption(result["note"])


def cls_to_band(cls):
    return {"none": "No Risk", "subclinical": "Moderate Risk", "clinical": "High Risk"}.get(cls, "")


# --------------------------------------------------------------------------
# Sidebar — backend status
# --------------------------------------------------------------------------

st.sidebar.title("🐄 PashuParth")
st.sidebar.caption("Mastitis risk model tester")
st.sidebar.text_input("API URL", value=API_URL, key="api_url_display", disabled=True)

try:
    health = get_health()
    st.sidebar.success("Backend connected ✅")
    st.sidebar.write(f"**Model:** {health['model_type']}")
    st.sidebar.write(f"**Classes:** {', '.join(health['classes'])}")
    st.sidebar.write(f"**Test accuracy (at training):** {health['test_accuracy_at_training']:.2%}")
    st.sidebar.write(f"**Test macro F1 (at training):** {health['test_macro_f1_at_training']:.3f}")
except Exception as e:
    st.sidebar.error(f"Backend not reachable at {API_URL}\n\n{e}")
    st.error(f"Cannot reach the FastAPI backend at `{API_URL}`. Start it with:\n\n"
             f"```\ncd backend && uvicorn main:app --reload --port 8000\n```")
    st.stop()

with st.sidebar.expander("Model vs. spec — SHAP comparison"):
    try:
        fi_df = get_feature_importance()
        st.dataframe(
            fi_df[["parameter_group", "model_importance_normalized", "spec_proposed_weight_modeA"]],
            hide_index=True, use_container_width=True,
        )
    except Exception as e:
        st.write(f"Unavailable: {e}")

st.title("Mastitis Risk Model — Test Bench")
st.write("Test the trained XGBoost model with preset extreme/outlier cases, or build your own reading.")

tab_presets, tab_manual = st.tabs(["🎯 Preset test cases", "🛠️ Manual input"])


# --------------------------------------------------------------------------
# Tab 1: preset extreme/outlier cases
# --------------------------------------------------------------------------

with tab_presets:
    cases = get_example_cases()

    case_name = st.selectbox(
        "Choose a preset case",
        options=list(cases.keys()),
        format_func=lambda k: k.replace("_", " ").title(),
    )
    case = cases[case_name]
    st.info(f"**What this tests:** {case['what_this_tests']}")
    st.caption(case["description"])

    with st.expander("Show raw reading payload"):
        st.json(case["reading"])

    if st.button("▶️ Run this case", type="primary", key="run_preset"):
        status, result = call_predict(case["reading"])
        if status == 200:
            render_result(result)
        else:
            st.error(f"API returned {status}: {result}")

    st.divider()
    st.subheader("Run all preset cases at once")
    if st.button("▶️ Run all 11 cases"):
        rows = []
        for name, c in cases.items():
            status, result = call_predict(c["reading"])
            if status == 200:
                rows.append({
                    "case": name,
                    "predicted_class": result["predicted_class"],
                    "confidence": result["confidence"],
                    "heat_stress_flag": result["heat_stress_flag"],
                    "composite_band": result["composite_heuristic_band"],
                    "model_vs_heuristic_agree": cls_to_band(result["predicted_class"]) == result["composite_heuristic_band"],
                })
            else:
                rows.append({"case": name, "predicted_class": f"ERROR {status}", "confidence": None,
                              "heat_stress_flag": None, "composite_band": None, "model_vs_heuristic_agree": None})
        st.dataframe(pd.DataFrame(rows), hide_index=True, use_container_width=True)


# --------------------------------------------------------------------------
# Tab 2: manual input
# --------------------------------------------------------------------------

with tab_manual:
    st.write("Build a reading by hand. Ranges are intentionally wide (beyond normal physiological limits) so you can push the model into out-of-distribution territory.")

    with st.form("manual_form"):
        c1, c2, c3 = st.columns(3)

        with c1:
            st.markdown("**Animal context**")
            species = st.selectbox("Species", ["Cattle", "Buffalo"])
            breed_category = st.selectbox("Breed category", ["indigenous", "crossbred", "exotic"])
            lactation_stage = st.selectbox("Lactation stage", ["early", "mid", "late"])
            parity_bucket = st.selectbox("Parity bucket", ["1", "2-3", "4+"])
            prior_mastitis_history = st.checkbox("Prior mastitis history")
            prior_mastitis_episodes = st.number_input("Prior episodes", 0, 20, 0)
            vaccination_status = st.checkbox("Vaccinated")

        with c2:
            st.markdown("**Milk quality**")
            EC_mScm = st.slider("EC (mS/cm)", 0.0, 25.0, 4.2, 0.1)
            pH = st.slider("pH", 0.0, 14.0, 6.7, 0.05)
            SCC_available = st.checkbox("Lab SCC available (Mode B)")
            SCC_x1e5_ml = st.slider("SCC (x10^5/ml)", 0.0, 50.0, 2.0, 0.1, disabled=not SCC_available)
            udder_temp_C = st.slider("Udder temp (°C)", -10.0, 60.0, 33.8, 0.1)
            milk_temp_C = st.slider("Milk temp (°C)", -10.0, 60.0, 34.1, 0.1)

        with c3:
            st.markdown("**Yield / behavior / environment**")
            yield_deviation_pct = st.slider("Yield deviation (%)", 0.0, 500.0, 4.0, 1.0)
            duration_deviation_pct = st.slider("Milking duration deviation (%)", 0.0, 500.0, 6.0, 1.0)
            abnormal_flow_flag = st.checkbox("Abnormal flow flag")
            body_temp_C = st.slider("Body temp (°C)", -10.0, 60.0, 38.8, 0.1)
            rumination_drop_pct = st.slider("Rumination drop (%)", 0.0, 500.0, 4.0, 1.0)
            standing_lying_deviation_pct = st.slider("Standing/lying deviation (%)", 0.0, 500.0, 6.0, 1.0)
            THI = st.slider("THI", 0.0, 150.0, 68.0, 1.0)
            ammonia_ppm = st.slider("Ammonia (ppm)", 0.0, 5000.0, 10.0, 1.0)
            co_ppm = st.slider("CO (ppm)", 0.0, 5000.0, 1.2, 0.1)
            co2_ppm = st.slider("CO2 (ppm)", 0.0, 20000.0, 820.0, 10.0)

        submitted = st.form_submit_button("▶️ Predict", type="primary")

    if submitted:
        reading = {
            "species": species, "breed_category": breed_category, "lactation_stage": lactation_stage,
            "parity_bucket": parity_bucket, "prior_mastitis_history": prior_mastitis_history,
            "prior_mastitis_episodes": prior_mastitis_episodes, "vaccination_status": vaccination_status,
            "EC_mScm": EC_mScm, "pH": pH, "SCC_available": SCC_available,
            "SCC_x1e5_ml": SCC_x1e5_ml if SCC_available else None,
            "udder_temp_C": udder_temp_C, "milk_temp_C": milk_temp_C,
            "yield_deviation_pct": yield_deviation_pct, "duration_deviation_pct": duration_deviation_pct,
            "abnormal_flow_flag": abnormal_flow_flag, "body_temp_C": body_temp_C,
            "rumination_drop_pct": rumination_drop_pct, "standing_lying_deviation_pct": standing_lying_deviation_pct,
            "THI": THI, "ammonia_ppm": ammonia_ppm, "co_ppm": co_ppm, "co2_ppm": co2_ppm,
        }
        status, result = call_predict(reading)
        if status == 200:
            render_result(result)
        else:
            st.error(f"API returned {status}: {result}")
