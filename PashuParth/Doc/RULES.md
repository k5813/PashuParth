# Development Rules
## PashuParth — Project Guidelines for AI & Human Collaboration

This document defines the development rules, coding standards, and best practices to
be followed while building PashuParth. These rules ensure consistency,
maintainability, security, and credibility with the SIH2026 evaluation panel. Both AI
assistants and human contributors must follow these guidelines.

## 1. General Principles

- Follow the project documentation (PRD, ARCHITECTURE, DESIGN) before making changes.
- **Honest framing over overclaiming**: unbuilt features are marked "architecturally
  scoped" or "planned for Phase X" — never presented as complete. This is a deliberate
  credibility strategy with technical panels.
- **India-ground-truth first**: assumptions must reflect actual Indian dairy market
  realities — portable vacuum-bucket machines are the mechanization norm, not robotic
  AMS; buffalo and indigenous cattle require distinct baseline calibration from
  crossbred cattle.
- Keep code clean, readable, and well-structured.
- Prioritize simplicity and maintainability over cleverness.
- Do not duplicate logic — reuse existing components, utilities, or services.
- Make small, focused changes instead of large, risky edits.
- Do not modify unrelated files.
- Write self-explanatory code with meaningful variable and function names.

## 2. Technology & Coding Standards

| Area | Rule |
|---|---|
| Mobile App Language | TypeScript. Avoid `any` unless absolutely necessary. |
| Mobile Framework | Follow React Native (bare/Expo prebuild) best practices. |
| Firmware | Arduino C++ conventions for ESP32; document pin mappings. |
| ML Code | Python; reproducible scripts over one-off notebooks for anything merged. |
| Styling | Follow the design system defined in `DESIGN.md`. |
| Linting | ESLint (app), PEP8/black (ML/Python). Fix all warnings before merge. |
| Formatting | Prettier (app), black (Python) for consistent formatting. |
| Dependencies | Use stable, well-maintained packages. Avoid unnecessary additions. |
| File Naming | Use clear, consistent naming aligned with folder structure in `ARCHITECTURE.md`. |

## 3. Project Structure

- Follow the folder structure defined in `ARCHITECTURE.md`.
- Hardware, mobile-app, ml, backend, and dashboard concerns stay in their own
  top-level directories — do not mix them.
- Place reusable UI components in `mobile-app/src/components/`.
- Feature-specific app code belongs in `mobile-app/src/features/`.
- Do not create new top-level folders without a clear, documented reason.

## 4. Data & ML Rules

- Never present synthetic data as lab-sourced data without explicit labeling.
- Any hardware calibration change (e.g., two-point NaCl calibration) must be
  re-documented after every component substitution.
- Apply **breed-level calibration before farm-level** for the prototype.
- Version datasets and trained models — never overwrite a prior model silently.
- Every risk prediction shown to a user should be traceable to a SHAP explanation.

## 5. Hardware Rules

- Recalibrate (two-point calibration) after any sensor component substitution —
  diode/electrode/op-amp changes affect readings.
- Designs must stay rugged, low-cost, and field-friendly for Indian farm conditions.
- Document battery/solar power budget for every new hardware module.

## 6. Documentation & AI Collaboration Rules

- Update `MEMORY.md` after each significant work session.
- Keep `TASKS.md` status fields current — no task should sit at a stale status.
- AI assistants must read `docs/` (PRD, ARCHITECTURE, RULES, DESIGN) before generating
  code or content for this project.
- Do not overclaim completion status in reports, pitch decks, or demos — match
  `MEMORY.md`'s current status exactly.

## 7. Git Workflow

- Branch naming: `feature/<short-description>`, `fix/<short-description>`.
- Commit messages: concise, imperative mood (e.g., "Add EC sensor calibration routine").
- All changes to `main` go through review before merge.

## 8. Security & Privacy Rules

- Farmer and animal data is sensitive — access it only through role-based permissions.
- No credentials or API keys committed to the repository.
- Encrypt data in transit and during offline sync.
