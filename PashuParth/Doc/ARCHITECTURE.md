# System Architecture
## PashuParth — AI/IoT Mastitis Forecasting Platform

This document describes the overall system architecture, technology stack, folder
structure, data flow, and key design decisions for PashuParth.

## 1. High-Level Architecture

```
[Handheld Probe] [Collar] [Barn Sensors] [Claw/Flow Sensor]
        │             │           │               │
        └─────────────┴────BLE/LoRa/NB-IoT─────────┘
                            │
                   Data Integration Layer
        (4 source adapters → validate/clean → entity
         resolution + time alignment)
                            │
              Canonical Animal-Day Data Store
                   (hot tier / cold tier)
                            │
              ┌─────────────┴─────────────┐
       ML Engine (per-animal)     Herd Epidemiological Layer
   XGBoost + LSTM/TFT + SHAP      (contact clustering, hygiene,
   TinyML/TFLite Micro (edge)      seasonal, GIS clustering)
              │                             │
        Risk Score / Band              Herd Risk + Hotspots
              │                             │
              └─────────────┬───────────────┘
                             │
              Offline-First Mobile App (React Native)
          Farmer │ Vet │ Field Personnel │ Admin roles
                             │
                 Alerts (push/SMS) + Cooperative/
                 Authority Web Dashboard (GIS)
```

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile App | React Native + TypeScript (bare/Expo prebuild) | Farmer/Vet/Field/Admin UI, offline-first |
| Local DB / Sync | WatermelonDB | Offline data capture + background sync |
| BLE | `react-native-ble-plx` | Sensor pairing (probe, collar) |
| Firmware | ESP32 (Arduino C++ framework) | Sensor data acquisition |
| Connectivity | Bluetooth, LoRa/NB-IoT, GSM | Sensor-to-gateway / gateway-to-cloud comms |
| Edge ML | TinyML / TFLite Micro | On-device inference where connectivity is poor |
| ML Models | XGBoost, LSTM / Temporal Fusion Transformer | Snapshot classification + 7–14 day forecasting |
| Explainability | SHAP | Per-prediction risk factor attribution |
| Federated Learning | FedAvg | Cross-farm model improvement without centralizing raw data |
| Backend / API | *(to be finalized)* | Data ingestion, orchestration, auth |
| Dashboard | Web + GIS visualization | Herd/cooperative/authority views |
| Storage | Hot/cold tiered canonical store | Time-series + historical animal-day records |

## 3. Folder Structure

```
pashuparth/
├── hardware/
│   ├── probe/                 # EC/pH/temp/RFID handheld probe firmware + schematics
│   ├── collar/                # Wearable collar firmware + schematics
│   ├── barn-sensor/           # Barn environment sensor kit
│   └── clamp-on-retrofit/     # Tier 2 in-line sensor CAD + demo firmware
├── mobile-app/
│   ├── src/app/(farmer|vet|field|admin)/   # Role-based screens
│   ├── src/components/        # Reusable UI components
│   ├── src/features/(auth|animals|alerts|sync)/
│   ├── src/lib/                # Shared utilities
│   └── src/services/(ble|sync|notifications)/
├── ml/
│   ├── data/                  # Synthetic data generation, preprocessing
│   ├── models/(xgboost|lstm-tft|scc-proxy)/
│   ├── explainability/        # SHAP pipelines
│   └── federated/             # FedAvg scoping/implementation
├── backend/
│   ├── api/
│   ├── data-integration/      # 4 source-specific ingestion adapters
│   └── canonical-store/
├── dashboard/                 # Web dashboard + GIS hotspot mapping
└── docs/                      # PRD, ARCHITECTURE, RULES, DESIGN, TASKS, MEMORY
```

## 4. Data Flow

1. Sensors (probe, collar, barn kit, claw/flow extension) capture raw readings.
2. Data transmitted via BLE/LoRa/NB-IoT to the Data Integration Layer.
3. Four source-specific adapters ingest raw data → validation and cleaning.
4. Entity resolution and time alignment map readings to the correct animal-day record.
5. Records land in the canonical animal-day data store (hot tier for recent, cold tier
   for historical).
6. Feature engineering feeds the per-animal ML engine (XGBoost snapshot + LSTM/TFT
   forecast) and the herd-level epidemiological layer.
7. Risk scores/bands and herd-level outputs are pushed to the mobile app (alerts) and
   the cooperative/authority dashboard (GIS hotspots, trends).

## 5. Database Schema (Overview)

Canonical **animal-day** record (illustrative fields):

- `animal_id`, `farm_id`, `date`, `species` (cattle/buffalo), `breed`
- `scc_proxy` (EC/pH-derived), `scc_lab` (if available)
- `milk_yield`, `milk_quality_flags`, `flow_rate_profile`
- `body_temp`, `udder_temp`, `activity_level`, `rumination_time`
- `environment` (THI, ammonia, CO₂, humidity, bedding moisture)
- `manual_inputs` (6 domains: identity/history, clinical/treatment, farm/herd
  management, milking hygiene, nutrition, reproductive status)
- `risk_score`, `risk_band`, `prediction_horizon_days`

## 6. Key Architectural Decisions

- **Breed-level calibration** (not farm-level) is the primary offset mechanism for the
  prototype — it transfers across farms with the same breed without local lab data and
  integrates cleanly with federated learning.
- **Two-tier offline resilience**: TinyML at the edge + offline-first app with
  WatermelonDB sync, since rural connectivity cannot be assumed.
- **Herd vs. individual models are separated**: Tier 1 is per-animal time-series
  forecasting; Tier 2 is a herd-level epidemiological layer built on individual scores
  plus contact clustering, housing density, hygiene, and seasonal data.
- **Config-driven schema mapping** was chosen over LLM-assisted inference for the
  prototype's Data Integration Layer, for predictability and low ops cost.
- **Hardware Tier 2** (clamp-on retrofit for vacuum-bucket machines) is deliberately
  scoped as roadmap/demo, not core — robotic AMS integration was explicitly rejected
  given negligible Indian market penetration.

## 7. Security Considerations

- Role-based access control (Farmer / Vet / Field Personnel / Admin)
- Encrypted data in transit and during sync
- Device authentication for RFID/BLE pairing
- Audit logging for vet/admin actions on animal records

## 8. Scalability & Future Enhancements

- Full FedAvg federated learning rollout across cooperatives
- Clamp-on in-line sensor rollout for vacuum-bucket machines at scale
- Farm-level residual calibration refinement
- Multilingual, voice-first UI

## 9. External Services

- SMS/push notification gateway
- GIS mapping service for hotspot visualization
- Cloud storage/compute provider *(to be finalized)*

## 10. Environment Setup

- Node.js + React Native CLI (bare/Expo prebuild) for mobile-app
- Python environment for ML (XGBoost, LSTM/TFT training, SHAP)
- Arduino/ESP-IDF toolchain for ESP32 firmware
- Git + GitHub for version control

## 11. Summary

PashuParth's architecture is built around India-ground-truth constraints: low-cost,
rugged hardware; offline-first mobile delivery; breed-aware calibration; and a clear
separation between individual-animal forecasting and herd-level epidemiological
analysis — all feeding a single canonical data store that both the ML engine and the
dashboards draw from.
