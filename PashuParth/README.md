# PashuParth — AI-Based Predictive Modeling for Bovine Mastitis Early Forecasting
## Smart India Hackathon 2026 (Problem Statement PS 26109)

PashuParth is an AI/IoT-enabled predictive forecasting platform designed to identify subclinical and clinical bovine mastitis risk in Indian dairy cattle and buffaloes **7 to 14 days before clinical onset**.

---

## 🚀 Currently Running Live Services

Both development servers are currently **RUNNING LIVE** in the background:

| Component | Status | Local URL | Network URL | Port |
|---|---|---|---|---|
| 📱 **PashuParth Mobile Application** | 🟢 LIVE | [http://localhost:5173/](http://localhost:5173/) | `http://192.168.1.9:5173/` | `5173` |
| 🌐 **PashuParth Web GIS Dashboard** | 🟢 LIVE | [http://localhost:8002/](http://localhost:8002/) | `http://192.168.1.9:8002/` | `8002` |
| 🧠 **ML Classifier Engine** | 🟢 READY | Trained (99.50% Accuracy) | Local Python Runtime | N/A |

---

## 📖 Manual Run Guide (For Any User)

Follow these step-by-step instructions to run all 3 components manually on any machine:

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.9 or higher

---

### Step 1: Run PashuParth Mobile Application (Port `5173`)
The Mobile App is the primary focus interface for Farmers, Veterinarians, and Field Personnel.

```bash
# 1. Navigate to the mobile-app directory
cd mobile-app

# 2. Install dependencies (if running for the first time)
npm install

# 3. Start the development server on fixed port 5173
npm run dev
```
👉 Access the Mobile App at: **[http://localhost:5173](http://localhost:5173)**

---

### Step 2: Run PashuParth Web GIS Dashboard (Port `8002`)
The Web Dashboard is the command center for Dairy Cooperatives and Animal Health Authorities.

```bash
# 1. Navigate to the dashboard directory
cd dashboard

# 2. Install dependencies (if running for the first time)
npm install

# 3. Start the development server on fixed port 8002
npm run dev
```
👉 Access the Web Dashboard at: **[http://localhost:8002](http://localhost:8002)**

---

### Step 3: Run ML Pipeline & Classifier Script
Generates multi-modal synthetic Cattle/Buffalo dataset and evaluates the subclinical risk classifier with SHAP attribution.

```bash
# 1. Navigate to the project root directory
cd PashuParth

# 2. Execute the ML Classifier script
python ml/train_xgboost_classifier.py
```
👉 Outputs prediction accuracy metrics and SHAP risk factor attribution weights.

---

## 🎨 Design System & Visual Token Reference

- **Primary Brand Color**: `#2F6F4E` (Pasture Green)
- **Secondary Accent**: `#4A90A4` (Calm Blue)
- **No Risk Band**: `#10B981` (Emerald Green)
- **Low Risk Band**: `#84CC16` (Lime Green)
- **Moderate Risk Band**: `#F59E0B` (Amber)
- **High Risk Band**: `#EF4444` (Crimson Alert)
- **Typography**: Google Noto Sans + Noto Sans Devanagari (Multilingual EN / हिन्दी support)

---

## 📁 Repository Structure

```
PashuParth/
├── mobile-app/              # Primary Focus Mobile App UI & Web App (Port 5173)
├── dashboard/               # Web GIS & Epidemiology Dashboard (Port 8002)
├── ml/                      # Synthetic data generator & XGBoost classifier
├── Doc/                     # PRD, ARCHITECTURE, RULES, DESIGN, TASKS, MEMORY
├── Workflow/                # Project workflow documentation
└── README.md                # Project overview & manual run guide
```
