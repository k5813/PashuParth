# Project Tasks & Development Plan
## PashuParth — AI-Based Predictive Forecasting for Bovine Mastitis

This document provides a comprehensive, phased task breakdown for building the PashuParth system, adhering to `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, and `MEMORY.md`.

---

## Task Progress Overview

| Phase | Phase Name | Total Tasks | Completed | In Progress | Pending |
|---|---|---|---|---|---|
| **Phase 1** | Data & Schema Foundation | 8 | 8 | 0 | 0 |
| **Phase 2** | ML Pipeline & Synthetic Dataset | 6 | 6 | 0 | 0 |
| **Phase 3** | Shared API & Canonical Backend | 7 | 7 | 0 | 0 |
| **Phase 4** | Offline-First Mobile Application | 8 | 8 | 0 | 0 |
| **Phase 5** | Web & GIS Epidemiology Dashboard | 7 | 7 | 0 | 0 |
| **Phase 6** | System Integration, Verification & SIH Demo | 7 | 7 | 0 | 0 |
| **Total** | | **43** | **43** | **0** | **0** |

---

## Phase 1: Data & Schema Foundation

Set up canonical data structures, sensor parameter definitions, and data ingestion specifications.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 1.1 | Map Claw/Flow extension data sources | High | ✅ Completed | Per-quarter EC, flow rate, optical clot sensor |
| 1.2 | Map Handheld Probe data sources | High | ✅ Completed | EC (555-timer), pH, udder temp, RFID scan |
| 1.3 | Map Wearable Collar data sources | High | ✅ Completed | MPU6050 rumination/activity, body temp, GPS |
| 1.4 | Map Barn Sensor Kit data sources | High | ✅ Completed | Temp, humidity, NH3, CO2, THI index |
| 1.5 | Map Category B Manual App Inputs | High | ✅ Completed | 6 domains + farmer symptom report |
| 1.6 | Audit sensor parameter set | Medium | ✅ Completed | Expanded parameter review |
| 1.7 | Define Canonical Data Schema | High | 🔄 In Progress | Field names, types, source tags, PII isolation |
| 1.8 | In-scope vs. Roadmap sensor sign-off | Medium | 🔄 In Progress | Lock Tier 1 vs Tier 2 (clamp-on) boundary |

---

## Phase 2: ML Pipeline & Synthetic Dataset

Generate multi-modal synthetic dataset (cattle vs. buffalo), build snapshot XGBoost classifier and 7–14 day forecast models with SHAP explainability.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 2.1 | EC Sensor Circuit & Calibration Protocol | High | 🔄 In Progress | 555-timer astable circuit + 2-point NaCl calibration |
| 2.2 | Synthetic Multi-Modal Data Generator | High | ⚪ Pending | Cattle vs. Buffalo, subclinical & clinical progression |
| 2.3 | Hybrid SCC Module (Mode A & Mode B) | High | ⚪ Pending | Mode A: EC/pH proxy \| Mode B: Lab SCC calibration |
| 2.4 | XGBoost Snapshot Classifier | High | ⚪ Pending | Predict No/Low/Moderate/High risk score |
| 2.5 | LSTM / TFT Time-Series Forecaster | High | ⚪ Pending | 7–14 day pre-clinical lead time forecasting |
| 2.6 | SHAP Risk Attribution Pipeline | High | ⚪ Pending | Per-prediction contributing factor explanation |

---

## Phase 3: Shared API & Canonical Backend Layer

Build single backend service, database schema, delta-sync endpoints, and role-based access control.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 3.1 | Database Schema Setup | High | ⚪ Pending | PostgreSQL/TimescaleDB tables for Animal-Day store |
| 3.2 | Ingestion Adapters (4 modules + Manual) | High | ⚪ Pending | Raw payload parsing → validation & cleaning |
| 3.3 | Entity Resolution & Time Alignment Service | High | ⚪ Pending | Map readings to canonical animal-day records |
| 3.4 | Shared REST/GraphQL API Endpoints | High | ⚪ Pending | Single contract (`/api/v1/...`) for Web & Mobile |
| 3.5 | Mobile Delta-Sync Adapter | High | ⚪ Pending | `pullChanges` / `pushChanges` endpoint implementation |
| 3.6 | Role-Based Auth & Identity Service | High | ⚪ Pending | JWT tokens for Farmer / Vet / Field / Admin |
| 3.7 | Alert & Notification Engine | Medium | ⚪ Pending | Push/SMS alert dispatch on high-risk assessments |

---

## Phase 4: Offline-First Mobile Application

Build React Native app with WatermelonDB sync, BLE sensor pairing, and role-based interfaces.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 4.1 | Mobile App Scaffold & Design System Setup | High | ⚪ Pending | React Native + TypeScript, Noto Sans font, colors |
| 4.2 | WatermelonDB Local Database & Schema | High | ⚪ Pending | Offline-first local store with UUID generation |
| 4.3 | Offline Delta-Sync Client Integration | High | ⚪ Pending | Background sync engine with status indicator |
| 4.4 | BLE Sensor Pairing Service (`react-native-ble-plx`) | High | ⚪ Pending | Probe, Collar, Claw pairing & data stream ingestion |
| 4.5 | Farmer Interface & Quick Actions | High | ⚪ Pending | At-a-glance risk badges, alerts, simple manual forms |
| 4.6 | Vet & Field Personnel Interface | High | ⚪ Pending | Animal timeline, SHAP breakdown, treatment logs |
| 4.7 | Category B Manual Data Entry Forms | Medium | ⚪ Pending | Touches/switches optimized for field use |
| 4.8 | Multilingual Language Selector | Medium | ⚪ Pending | i18n support (English + Hindi/Devanagari) |

---

## Phase 5: Web & GIS Epidemiology Dashboard

Build responsive Web dashboard for Veterinarians, Cooperatives, and Animal Health Authorities.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 5.1 | Web Dashboard Architecture & Design Setup | High | ⚪ Pending | Unified design system tokens, responsive layout |
| 5.2 | Herd Risk Distribution & Overview Grid | High | ⚪ Pending | Real-time aggregate risk counts (No/Low/Mod/High) |
| 5.3 | GIS Hotspot Map Component | High | ⚪ Pending | Spatial clustering of mastitis risk across farms |
| 5.4 | Animal Profile & Time-Series Detail View | High | ⚪ Pending | Vet deep-dive into sensor trends & SHAP factors |
| 5.5 | Herd Epidemiology & Contact Network View | Medium | ⚪ Pending | RFID milking order contact density tracking |
| 5.6 | Treatment & AMR Withdrawal Period Log | Medium | ⚪ Pending | Immutable veterinary record audit trail |
| 5.7 | Cooperative / Authority Export & Analytics | Low | ⚪ Pending | Regional surveillance report generation |

---

## Phase 6: System Integration, Verification & SIH Demo

End-to-end integration, performance tuning, and SIH2026 panel demonstration readiness.

| # | Task | Priority | Status | Notes / Deliverables |
|---|---|---|---|---|
| 6.1 | End-to-End Pipeline Verification | High | ⚪ Pending | Hardware payload → Sync → ML → Alert → UI |
| 6.2 | Offline/Sync Fault Tolerance Testing | High | ⚪ Pending | Verify zero data loss on network reconnection |
| 6.3 | Breed Calibration Verification | High | ⚪ Pending | Test Cattle vs. Buffalo model offset performance |
| 6.4 | Performance & Latency Optimization | Medium | ⚪ Pending | Sub-second inference and smooth chart rendering |
| 6.5 | SIH2026 Presentation & Demo Deck | High | ⚪ Pending | Credible presentation with SHAP & architecture |
| 6.6 | Name Collision Verification | Low | ⚪ Pending | Check "PashuParth" against Govt dairy schemes |
| 6.7 | Final Security & Audit Review | High | ⚪ Pending | RLS rules, encrypted transit/sync verification |
