# Product Requirements Document (PRD)
## PashuParth — AI-Based Predictive Forecasting for Bovine Mastitis

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | Sep 20, 2026 |
| **Author** | Team PashuParth |
| **Status** | Draft |
| **Target Milestone** | SIH 2026 Prototype (PS 26109) |

---

## 1. Product Overview

PashuParth (formerly MastiGuard) is an AI/IoT-enabled predictive forecasting system for
early detection of bovine mastitis in Indian dairy farms. It fuses low-cost sensor
hardware (handheld milk-testing probe, animal collar, barn sensor kit) with a two-stage
ML pipeline (XGBoost snapshot classification + LSTM/Temporal Fusion Transformer
forecasting) to flag subclinical and clinical mastitis risk **7–14 days before clinical
onset**, at both the individual-animal and herd level. Predictions, alerts, and
recommendations are delivered through an offline-first mobile app to farmers,
veterinarians, field personnel, and dairy authorities.

## 2. Problem Statement

Bovine mastitis is one of the most prevalent and economically significant diseases
affecting dairy cattle and buffaloes in India. It is typically detected only after
clinical signs appear, by which point milk yield, milk quality, and animal health have
already been compromised — and treatment usually means indiscriminate antimicrobial use.
Digital dairy technologies (sensors, wearables, farm management software) make it
possible to predict risk before symptoms appear, but no integrated, India-ground-truth
solution currently exists for smallholder and mid-size farms.

## 3. Goals

- Predict mastitis risk **7–14 days** before clinical signs appear.
- Design for actual Indian dairy realities: hand-milking and portable vacuum-bucket
  machines — not robotic Automated Milking Systems (AMS).
- Differentiate cattle vs. buffalo and indigenous vs. crossbred breeds via calibration.
- Reduce antimicrobial resistance (AMR) risk through earlier, targeted intervention.
- Deliver a working hardware + software + ML prototype credible to an SIH2026 panel.

## 4. Target Users

| Role | Description |
|---|---|
| **Farmer** | Primary field user; may have limited literacy; needs a simple, multilingual, low-friction app |
| **Veterinarian** | Reviews risk scores, treatment history, and recommendations |
| **Field Personnel** | Assists with data capture, device deployment, and farmer support |
| **Admin / Animal Health Authority** | Herd- and region-level dashboards, GIS hotspot tracking |

## 5. Core Features (MVP)

1. Handheld milk-testing probe — EC, pH, temperature, RFID scan
2. Wearable animal collar — body temperature, activity, rumination
3. Barn sensor kit — temperature, humidity, ammonia, CO₂ (THI derivation)
4. Data Integration Layer — 4 source-specific ingestion adapters → canonical animal-day store
5. Subclinical SCC module — Mode A (EC/pH proxy with risk bands), Mode B (lab SCC calibration)
6. XGBoost snapshot classifier + LSTM/TFT 7–14 day forecaster
7. Risk categorization: **No Risk / Low Risk / Moderate Risk / High Risk**
8. Offline-first mobile app (React Native + WatermelonDB sync)
9. Real-time alerts to farmers and vets (push / SMS)
10. Herd-level epidemiological layer + GIS hotspot dashboard for cooperatives/authorities
11. Role-based access: Farmer / Vet / Field Personnel / Admin

## 6. Out of Scope (for MVP)

- Robotic AMS integration (negligible penetration in Indian dairy market)
- Full federated learning execution (architecturally scoped only for MVP)
- Complete multilingual localization (roadmap item)
- Tier 2 clamp-on retrofit sensor at production scale (demo-only CAD for MVP)

## 7. Success Criteria

- Demonstrated 7–14 day early-warning lead time on synthetic/test data
- End-to-end pipeline working: sensor → data layer → ML → alert → dashboard
- Panel-credible accuracy metrics with SHAP explainability
- Functional offline capture + sync on at least one mobile device

## 8. Future Enhancements

- Full FedAvg federated learning rollout across cooperatives
- Multilingual, voice-first UI for low-literacy field adoption
- Clamp-on in-line sensor for vacuum-bucket machines at production scale
- Farm-level residual calibration refinement (beyond breed-level offsets)
- AMR usage analytics integration for policy reporting

## 9. Assumptions

- Farms have access to at least a basic smartphone and intermittent connectivity
- RFID tagging at milking time is operationally feasible
- Lab SCC data access is limited → synthetic data + EC/pH proxy required for MVP

## 10. Risks & Dependencies

| Risk | Mitigation |
|---|---|
| No existing India-specific multi-modal mastitis dataset | Synthetic data generation (cattle + buffalo) as bridge |
| Hardware cost/power constraints in field conditions | Battery/solar-powered, rugged, low-cost design |
| Rural connectivity gaps | Offline-first app + TinyML edge inference |
| Calibration drift across breeds/farms | Two-point calibration protocol after any hardware change |

## 11. Stakeholders

- Dairy farmers and cooperatives
- Veterinarians and field personnel
- State Animal Husbandry Departments / dairy authorities
- SIH2026 evaluation panel
- Team PashuParth

## 12. Revision History

| Version | Date | Change |
|---|---|---|
| 1.0 | Sep 20, 2026 | Initial PRD drafted |
