# PashuParth — Manual Execution Guide

This document provides step-by-step instructions for any developer or panel evaluator to launch and run all components of the PashuParth system manually.

---

## Port Allocation Matrix

| Component | Port Flag | Target URL |
|---|---|---|
| **Mobile App (Primary)** | `--port 5173 --strictPort` | `http://localhost:5173` |
| **Web GIS Dashboard** | `--port 8002 --strictPort` | `http://localhost:8002` |
| **Backend API Service** | `--port 8001` | `http://localhost:8001` |

---

## 1. Running the Mobile Application

```bash
cd mobile-app
npm install
npm run dev
```

Key features accessible on `http://localhost:5173`:
- Outdoor High-Contrast Sunlight Mode Toggle
- Multilingual Toggle (English / हिन्दी Devanagari)
- Role Switcher (Farmer, Vet, Field Personnel, Admin)
- 4-Teat Telemetry Gauges (EC, pH, Udder Temp)
- 7–14 Day AI Forecast Trend Chart & SHAP Explainability
- Category B Manual Data Entry Forms
- BLE Sensor Network & 2-Point NaCl Calibration Trigger

---

## 2. Running the Web GIS Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Key features accessible on `http://localhost:8002`:
- GIS Hotspot Risk Surveillance Map (Gujarat Dairy Region)
- Monitored Population Species Distribution (Cattle vs. Buffalo)
- Veterinary AMR Treatment & Milk Withdrawal Period Log

---

## 3. Running the ML Predictive Pipeline

```bash
python ml/train_xgboost_classifier.py
```

Outputs:
- Synthetic dataset saved to `ml/data/synthetic_mastitis_dataset.csv`
- Model accuracy score (~99.50%)
- Feature importance / SHAP risk attribution breakdown
