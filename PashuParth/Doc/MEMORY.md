# Project Memory
## PashuParth — Context, Progress & Important Notes

This document keeps track of the current state of the project, important context,
ongoing work, and things to remember. It helps maintain continuity across development
sessions and when working with AI assistants or new contributors.

| | |
|---|---|
| **Last Updated** | Sep 29, 2026 |
| **Current Phase** | Real XGBoost ML Engine Integrated into Backend |
| **Overall Progress** | ~80% (35/43 tasks) |
| **Project Status** | In Active Development — Real 89-Feature XGBoost Model Live in Backend |

## 🎯 Current Status

- ✅ Problem statement (SIH2026 PS 26109) analyzed and locked
- ✅ Architecture locked: hardware tiers, ML stack, offline two-tier resilience, federated learning via FedAvg
- ✅ Documentation suite complete (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`, `RUN_GUIDE.md`)
- ✅ **100% Cross-Platform Feature Parity Achieved** across Mobile App (`:5173`) and Web Dashboard (`:8002`).
- ✅ **Dedicated Authentication Page & Phone + OTP Login**:
  - Removed top-bar unauthenticated role-switcher pills.
  - Dedicated **`LoginScreen.tsx`** for phone-number + 4-digit OTP login.
  - **Unregistered User Flow**: Prominent card on Login Screen: *"New Farmer or Veterinarian? Contact your assigned Field Officer to get onboarded"*, with 1-tap call action to Field Officer Vikram Singh (`+91 98111 22334`).
- ✅ **Strict Registration Hierarchy**:
  - **Admin**: Can register Field Officers, Vets, and Farmers.
  - **Field Officer**: Can onboard Farmers and Vets (Online & Offline), but **CANNOT** register other Field Officers.
  - **Farmer & Vet**: Cannot self-register directly; must be onboarded by Field Officer or Admin.
- ✅ **Mobile App (`mobile-app/`)**: Port `5173` strict. Build verified clean (0 errors).
- ✅ **Web Dashboard (`dashboard/`)**: Port `8002` strict. Build verified clean (0 errors).
- ✅ **Real XGBoost ML Engine Integrated** (`backend/inference.py` + `backend/artifacts/`):
  - Real XGBoost model (99.76% accuracy, Macro F1=0.97, AUC=0.9999 on held-out test set)
  - 89 engineered features: per-species EC/pH/temp cutoffs, rolling 3/7-day windows, heat-stress interaction terms, Mode A/B SCC dual-path
  - Classes: `none` / `subclinical` / `clinical` → mapped to PashuParth No/Moderate/High Risk bands
  - Real SHAP attribution weights stored in `artifacts/shap_vs_spec_weights.csv`
  - `POST /api/v1/predict` endpoint live in `api_server.py` (v3.0.0)
  - `GET /api/v1/model-info` endpoint returns full model card
  - Auto-generates High Risk alerts into `SUPABASE_DATASTORE["alerts"]`
- ⚠️ **PashuParth/ml/ rule-based classifier**: Retained as archived demo only — NOT the real ML engine.
  The real model is `backend/inference.py` + `backend/artifacts/xgb_mastitis_model.joblib`.

## 📜 Change Log

- **Sep 29, 2026** — Integrated real XGBoost ML engine from `d:\app` test bench into PashuParth backend.
  Copied `inference.py` + 5 model artifacts (2.1 MB `.joblib`), added `POST /api/v1/predict` and `GET /api/v1/model-info`
  endpoints to `api_server.py` (bumped to v3.0.0), created `backend/requirements.txt`.
  Rule-based `ml/train_xgboost_classifier.py` retired as demo-only — real engine is now `backend/inference.py`.
- **Sep 20, 2026** — Built Dedicated Login Page (`LoginScreen.tsx`), removed top-bar role switcher pills, enforced Phone + OTP login, and implemented Field Officer onboarding authority with unregistered user contact action. Both production builds verified clean (0 errors).
