# PashuParth — AI & IoT Bovine Mastitis Early Warning Platform
---

## 📁 Repository Structure

This repository contains the complete PashuParth ecosystem:

- **[`PashuParth/`](./PashuParth/)** — Main platform repository
  - **`mobile-app/`** — React + TypeScript + Vite Progressive Web App for Farmers, Vets, and Field Personnel
  - **`dashboard/`** — Comprehensive administrative and veterinary monitoring web dashboard
  - **`backend/`** — Python API server, Supabase schema migrations, and real-time alert dispatch
  - **`ml/`** — Early detection pipeline, SHAP interpretability, and risk stratification models
  - **`hardware/`** — IoT collar and sensor node firmware & specifications (EC, pH, somatic cell count, temperature, THI)
  - **`Doc/`** — Technical architecture, API documentation, and presentation materials

- **[`app/`](./app/)** — ML Model Benchmarking & Testing Suite
  - **`backend/`** — Model inference service and model card metadata
  - **`data/`** — Raw synthetic and empirical bovine mastitis dataset (`mastitis_synthetic_dataset.csv`)
  - **`training/`** — Model training scripts (XGBoost, Neural Network benchmarks)
  - **`utils/`** — Feature engineering and dataset generation utilities
  - **`frontend/`** — ML visualization and inference demo interface

---

## 🚀 Quick Start

### 1. PashuParth Mobile App
```bash
cd PashuParth/mobile-app
npm install
npm run dev
```

### 2. PashuParth Web Dashboard
```bash
cd PashuParth/dashboard
npm install
npm run dev
```

### 3. ML Feature Engineering & Training
```bash
cd app
python utils/feature_engineering.py
python training/train_model.py
```
