# Design System
## PashuParth — Clear. Field-Ready. Trustworthy.

This document defines the visual design system, UI components, and user-experience
principles for PashuParth. The goal is a modern, low-literacy-friendly, multilingual-
ready interface usable outdoors on a farm, by people with varying levels of digital
fluency.

## 1. Design Principles

| Principle | Meaning |
|---|---|
| **Farmer-First** | Every screen must be usable by someone with limited literacy and limited smartphone experience. |
| **Offline-Clarity** | Sync/offline state must always be visible — never let a farmer wonder if data was saved. |
| **Minimal & Actionable** | Every screen leads with a risk score and one clear next action, not raw data dumps. |
| **Consistent Role-Based Theming** | Farmer, Vet, Field Personnel, and Admin views share one system but surface different depth of detail. |

## 2. Color Palette

| Color | Hex | Usage |
|---|---|---|
| Primary | `#2F6F4E` | Brand color — buttons, active states, headers (pasture green) |
| Secondary | `#4A90A4` | Secondary actions, links (calm blue) |
| No Risk | `#10B981` | Risk badge — animal healthy |
| Low Risk | `#84CC16` | Risk badge — monitor |
| Moderate Risk | `#F59E0B` | Risk badge — attention needed |
| High Risk | `#EF4444` | Risk badge — urgent, vet alert |
| Background | `#F8FAFC` | Page background |
| Text | `#1E293B` | Primary text |

## 3. Typography

- **Primary font family: Noto Sans + Noto Sans Devanagari** (and other Noto Sans
  regional variants as needed) — chosen specifically for multilingual support (Hindi
  and regional Indic scripts), clean rendering, and high legibility outdoors.
- Headings: bold, large touch-friendly sizes (min. 18–20px on mobile).
- Body text: minimum 16px for outdoor/low-vision readability.

## 4. UI Components

- **Buttons**: Primary, Secondary, Destructive — large touch targets (min. 44×44px)
- **Risk Badge**: color-coded pill (No / Low / Moderate / High Risk) with icon, never
  color alone
- **Animal Card**: photo/RFID tag, breed, species, current risk badge, last-updated
  timestamp
- **Alert Card**: risk change, recommended action, "Call Vet" quick action
- **Sync Status Indicator**: persistent online / offline / syncing indicator
- **Dashboard Charts**: herd risk distribution, trend lines, GIS hotspot map (Vet/Admin
  views)
- **Role-Based Bottom Navigation**: Home / Animals / Alerts / Profile (Farmer role)

## 5. Iconography

- Simple, universally recognizable icons paired with short text labels and color —
  never icon-only or text-only, since literacy levels vary among field users.

## 6. Layout & Navigation

- Mobile-first, single-column layout.
- Bottom tab navigation for the Farmer role (lowest-friction pattern).
- Larger touch targets throughout for outdoor/gloved-hand use.
- High-contrast mode for bright sunlight readability.

## 7. Accessibility

- Minimum WCAG AA contrast ratios.
- Large touch targets (44×44px minimum).
- Voice-assist readiness flagged as a roadmap item (multilingual voice-first UI).
- Designed to remain legible in direct outdoor sunlight.

## 8. Dashboard (Vet / Admin / Cooperative Views)

- GIS hotspot map for herd/region-level mastitis risk clustering
- Herd risk distribution charts (No/Low/Moderate/High breakdown)
- Trend lines over time, filterable by farm, breed, and date range
