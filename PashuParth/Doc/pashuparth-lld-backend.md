# PashuParth — Low-Level Design (LLD) Part 1: Backend & Logic

**Scope:** Internal service layers, data models, state management pattern, and security protocols. Logic is decoupled from UI to remain platform-agnostic across Web and Mobile.

> Hardware-facing ingestion logic reflects PashuParth's actual sensor modules. Backend framework, database engine, and library choices remain `[PLACEHOLDER]` per current stack-finalization status.

---

## 1. Service Layer Architecture

Backend logic is organized as independently deployable/testable services, each with a single responsibility. No service directly accesses another's internal state — all cross-service interaction goes through defined interfaces.

| Service | Responsibility |
|---|---|
| **Ingestion Adapter Service** | One adapter per hardware module (Claw, Probe, Collar, Barn) + one for Category B manual input. Parses raw payloads into a common internal schema. |
| **Validation & Cleaning Service** | Range checks, sensor-health flags, staleness/duplicate rejection, unit normalization. |
| **Entity Resolution Service** | Resolves RFID/animal_id/farm_id references, aligns readings to the animal-day canonical record, handles late-arriving/out-of-order data. |
| **Canonical Store Access Layer** | Single point of read/write to `[DATABASE_ENGINE]` / `[TIMESERIES_ENGINE]` / `[GEO_ENGINE]`. All other services access data only through this layer, never direct DB calls. |
| **Sync Adapter Service** | Implements the Mobile delta-sync contract (`pullChanges` / `pushChanges`), independent of the Web-facing REST/GraphQL layer, both ultimately writing through the Canonical Store Access Layer. |
| **ML Inference Service** | Feature assembly from canonical store → risk scoring (snapshot) and forecasting (7–14 day horizon) → writes Risk Assessment records. |
| **Alerting Service** | Subscribes to new Risk Assessment writes; evaluates role-scoped thresholds; dispatches via `[NOTIFICATION_PROVIDER]`. |
| **Herd Epidemiology Service** | Aggregates individual Risk Assessments with contact clustering (RFID milking-order), housing density, and hygiene scores into herd-level output for GIS/dashboard consumption. |
| **Auth & Identity Service** | Issues and validates role-scoped tokens (Farmer / Vet / Field Personnel / Admin-Authority) via `[AUTH_PROVIDER]`; single source of truth consumed by both API paths. |

**Dependency rule:** Services depend downward only (Ingestion → Validation → Entity Resolution → Canonical Store). ML, Alerting, and Herd Epidemiology depend on the Canonical Store Access Layer only — never on ingestion internals. This keeps hardware-format changes isolated to the adapter layer.

---

## 2. Data Models (Canonical Entities)

Structural definitions — field-level schema to be finalized against Section 1's "convert to canonical schema" milestone.

### 2.1 `Animal`
- `animal_id` (client-generated UUID)
- `rfid_tag`
- `species` (cattle | buffalo)
- `breed`
- `date_of_birth`
- `lactation_number`
- `calving_date` → derives `days_in_milk`
- `farm_id` (FK)
- `vaccination_records[]`
- `disease_history[]`

### 2.2 `SensorReading` (partitioned by module)
- `reading_id` (client-generated UUID)
- `animal_id` (FK, nullable for barn-level readings)
- `farm_id` (FK)
- `module_type` (claw | probe | collar | barn)
- `payload` (module-specific structured fields — see HLD §2.1 for the parameter set per module)
- `recorded_at` (device timestamp)
- `synced_at` (server timestamp)
- `sensor_health_flag`

### 2.3 `ManualInputRecord` (Category B)
- `record_id` (client-generated UUID)
- `animal_id` (FK)
- `entry_type` (clinical | treatment | nutrition | reproductive | hygiene | symptom-report | herd-management)
- `payload` (entry-type-specific fields)
- `entered_by` (user_id, role)
- `recorded_at`

### 2.4 `RiskAssessment`
- `assessment_id`
- `animal_id` (FK, nullable for herd-level)
- `scope` (individual | herd)
- `risk_category` (No / Low / Moderate / High)
- `risk_score` (continuous)
- `contributing_factors[]` (SHAP-derived)
- `forecast_horizon_days`
- `model_mode` (Mode A: EC/pH proxy | Mode B: lab-SCC calibrated)
- `generated_at`

### 2.5 `Alert`
- `alert_id`
- `risk_assessment_id` (FK)
- `recipient_role`
- `delivery_channel`
- `status` (pending | delivered | acknowledged)

### 2.6 `User` / `Role`
- `user_id`
- `role` (Farmer | Vet | Field Personnel | Admin/Authority)
- `farm_scope[]` / `assigned_farms[]`

**Change tracking:** every entity carries `last_modified` + participates in a changelog table, required by the Sync Adapter Service (see HLD §5).

---

## 3. State Management Pattern

Platform-agnostic pattern description (library choice deferred):

- **Server/backend state:** Single source of truth = Canonical Store. All services read current state through the Canonical Store Access Layer; no service maintains independent mutable state beyond in-flight request scope.
- **Client state (Web & Mobile, shared pattern):**
  - **Remote-derived state** — fetched via the shared API contract, cached client-side (`[STATE_MANAGEMENT_LIB]`), treated as eventually-consistent.
  - **Local-first state (Mobile only)** — persisted in `[LOCAL_DB_ENGINE]`, is the durable source of truth on-device until synced; UI reads from local state, not directly from network responses.
  - **Sync status** is modeled as an explicit, observable state dimension (`pending` / `syncing` / `synced` / `conflict`) — never inferred implicitly from network state, so UI components can render correctly whether online or offline.
- **Unidirectional flow:** UI dispatches intents → service/logic layer mutates local or remote state → state change propagates back to UI via subscription, not direct mutation from UI components. This holds identically on Web (remote-only) and Mobile (local-first + sync).

---

## 4. Security Protocols

- **Authentication:** Token-based (`[AUTH_PROVIDER]`), role-scoped, identical token format consumed by Web and Mobile.
- **Authorization:** Row-level access control enforced at the Canonical Store Access Layer (not just at the API edge) — Farmer scoped to own herd, Vet scoped to assigned farms, Field Personnel scoped to assigned tasks, Admin/Authority scoped to aggregated/anonymized cross-farm views.
- **Transport security:** TLS for all Web/Mobile ↔ Backend traffic; BLE payloads between hardware and Mobile app encrypted at the application layer (not relying on BLE-native security alone) given field-deployment threat model.
- **Data-at-rest:** Encryption at rest for the Canonical Store, including sensitive treatment/AMR records.
- **Sync-path parity:** RLS/authorization rules validated against both the direct-request path (Web) and the batch delta-sync path (Mobile) — a common gap is enforcing policy only on the former.
- **Auditability:** Treatment records (AMR tracking) and diagnosis entries are append-only / immutable-history, not overwrite-in-place, to preserve a defensible audit trail for veterinary and regulatory review.
- **PII/farm-data isolation:** Cross-farm aggregation for Admin/Authority views is computed server-side on de-identified/aggregated data — raw farm-identifiable records never reach the Admin/Authority client surface directly.
