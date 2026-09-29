# PashuParth — Low-Level Design (LLD) Part 2: UI/UX & Component Library

**Scope:** Unified design system, component-based architecture mapped across Web and Mobile, navigation patterns, and responsive constraints.

> Design system tokens (color, typography) and platform frameworks remain `[PLACEHOLDER]` per current stack-finalization status. Screen/component inventory reflects PashuParth's actual functional scope (roles, risk workflow, hardware pairing) since this is core product structure, not a tech-stack decision.

---

## 1. Unified Design System

**Principle:** One design-token source, consumed by both Web (`[WEB_FRAMEWORK]`) and Mobile (`[MOBILE_FRAMEWORK]`), so the two platforms render as one product rather than two visually distinct apps.

### 1.1 Color Palette (token structure — values pending)
| Token | Purpose |
|---|---|
| `[COLOR_PRIMARY]` | Brand/primary action color |
| `[COLOR_SECONDARY]` | Secondary accents |
| `[COLOR_SURFACE]` / `[COLOR_BACKGROUND]` | Layout surfaces |
| `[COLOR_RISK_NONE]` | No Risk indicator |
| `[COLOR_RISK_LOW]` | Low Risk indicator |
| `[COLOR_RISK_MODERATE]` | Moderate Risk indicator |
| `[COLOR_RISK_HIGH]` | High Risk indicator (alert-critical) |
| `[COLOR_SUCCESS]` / `[COLOR_WARNING]` / `[COLOR_ERROR]` | System feedback states |

> Risk-category colors are a functional requirement (must be immediately distinguishable at a glance, colorblind-safe) even though exact hex values are deferred.

### 1.2 Typography
| Token | Purpose |
|---|---|
| `[FONT_FAMILY_PRIMARY]` | Body/UI text — must support multilingual rendering (Devanagari and other Indian scripts, per PS multilingual requirement) |
| `[FONT_SCALE]` | Type scale ratio (headings → body → caption) |
| `[FONT_WEIGHT_TOKENS]` | Regular / medium / bold usage rules |

### 1.3 Spacing & Layout Grid
| Token | Purpose |
|---|---|
| `[SPACING_UNIT]` | Base spacing unit (e.g., 4pt/8pt grid — value deferred) |
| `[BREAKPOINT_TOKENS]` | Responsive breakpoints shared conceptually between Web layout and Mobile device classes |
| `[RADIUS_TOKENS]` | Corner-radius scale for cards, buttons, inputs |

**Cross-platform token delivery:** Design tokens defined once in a platform-agnostic format and consumed by both `[WEB_FRAMEWORK]` and `[MOBILE_FRAMEWORK]` build pipelines — avoids parallel, drift-prone token definitions per platform.

---

## 2. Component-Based Architecture

Components are defined at the **functional/structural level** here; concrete implementation (React components vs. Flutter widgets, etc.) maps 1:1 per platform against this shared inventory.

### 2.1 Shared Component Inventory (Web + Mobile parity)

| Component | Function | Role Visibility |
|---|---|---|
| `RiskBadge` | Renders risk category (No/Low/Moderate/High) using shared risk color tokens | All roles |
| `AnimalProfileCard` | Summary card: identity, DIM, lactation number, latest risk score | Farmer, Vet, Field Personnel |
| `AnimalTimelinePanel` | Time-series view of sensor readings + manual entries for one animal | Vet, Field Personnel |
| `RiskAssessmentDetail` | Full risk breakdown with SHAP contributing factors + recommended interventions | Vet, Field Personnel |
| `AlertFeedList` | Chronological alert stream, filterable by role scope | Farmer, Vet, Field Personnel, Admin |
| `HerdDashboardGrid` | Herd-level aggregate risk view across animals | Farmer, Vet, Admin |
| `GISHotspotMap` | Geo-visualization of herd/farm risk clustering | Admin/Authority, Cooperative |
| `ManualInputForm` (variant per entry type) | Category B data entry — clinical, treatment, nutrition, reproductive, hygiene, symptom-report | Farmer, Vet, Field Personnel |
| `SensorPairingPanel` | BLE device discovery/pairing/health status for Claw, Probe, Collar | Field Personnel, Farmer |
| `SyncStatusIndicator` | Visualizes local/synced/conflict state (Mobile-primary, relevant to Web for last-sync display) | All roles |
| `TreatmentAMRLog` | Immutable treatment/withdrawal-period record view | Vet, Admin/Authority |
| `MultilingualToggle` | Language selection control | All roles |

### 2.2 Platform Mapping

| Concern | Web (`[WEB_FRAMEWORK]`) | Mobile (`[MOBILE_FRAMEWORK]`) |
|---|---|---|
| Component primitive | `[WEB_COMPONENT_PRIMITIVE]` | `[MOBILE_COMPONENT_PRIMITIVE]` |
| Styling mechanism | `[WEB_STYLING_APPROACH]` | `[MOBILE_STYLING_APPROACH]` |
| Data binding to shared API/state layer | Consumes shared API contract directly (always-connected) | Consumes local-first state layer (`[LOCAL_DB_ENGINE]`-backed), reconciled via sync |
| Hardware-facing components (`SensorPairingPanel`) | Not applicable (no BLE) | Native BLE integration (`[BLE_LIBRARY]`) |

**Parity rule:** Every shared component in §2.1 must exist on both platforms with identical data contract and visual token usage; platform-exclusive components (e.g., `SensorPairingPanel` on Mobile) are explicitly scoped, not accidental drift.

---

## 3. Navigation Patterns

### 3.1 Web
- **Pattern:** Persistent sidebar navigation (`[WEB_NAVIGATION_LIBRARY]`), role-scoped menu items rendered conditionally by the Auth & Identity Service's role claim.
- **Primary routes:** Herd Dashboard → Animal Profile → Risk Detail; Alert Feed; GIS Hotspot Map (Admin/Cooperative only); AMR/Treatment Log.

### 3.2 Mobile
- **Pattern:** Bottom tab navigation for top-level sections (`[MOBILE_NAVIGATION_LIBRARY]`) — Home/Dashboard, Alerts, Animal List, Sensor Pairing, Profile — with stack-based drill-down per section.
- **Offline-aware navigation:** Route transitions do not block on network state; screens render from local-first state regardless of sync status, with `SyncStatusIndicator` surfaced contextually rather than gating navigation.

### 3.3 Shared Constraint
- **Deep-link parity:** Any entity reachable on Web (e.g., a specific `AnimalProfileCard`) must be reachable via an equivalent Mobile route using the same `animal_id` reference — supports Vet workflows that span both surfaces (e.g., review on Web, act on Mobile in-field).

---

## 4. Responsive Design Constraints

- **Web:** Fluid layout across desktop and tablet breakpoints (`[BREAKPOINT_TOKENS]`); `HerdDashboardGrid` and `GISHotspotMap` reflow from multi-column to single-column below tablet breakpoint; sidebar collapses to icon-only rail on narrow viewports.
- **Mobile:** Single-column-first design; `AnimalProfileCard` and `AlertFeedList` are the primary at-a-glance surfaces optimized for field use in bright outdoor light (high-contrast risk color tokens) and single-hand operation during milking.
- **Field-use constraint:** Mobile UI components used during active milking/sensor-pairing workflows (`SensorPairingPanel`, `ManualInputForm`) prioritize large touch targets and minimal text entry (toggles/checkboxes over free text) given field personnel operating with wet/gloved hands.
- **Multilingual layout tolerance:** All text-bearing components must tolerate variable string length (Indian-language translations) without breaking fixed-width layouts — no hardcoded pixel widths on label containers.
