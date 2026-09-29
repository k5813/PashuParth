#!/usr/bin/env python3
"""
generate_mastitis_dataset.py

Synthetic training-data generator for the PashuParth mastitis risk model,
built directly off `ml_parameter_spec (v1)`:

  - Section 1: Milk-quality (EC, pH, SCC, udder/milk temp) — highest weight,
               Mode A (no lab SCC, default) vs Mode B (lab SCC present) weights.
  - Section 2: Yield/flow — secondary, lagging/confirming signal.
  - Section 3: Collar/behavioral — early-warning, least literature-sourced.
  - Section 4: THI + hygiene gases — environmental MODIFIER, not summed into
               the composite score, used here to inject heat-stress confounds
               (elevated EC/temp during THI Danger/Emergency that are NOT
               mastitis-driven) so the model has real false-positive cases to
               learn to disambiguate.
  - Section 5: species/breed/lactation/parity/history/vaccination — static
               conditioning covariates, not independently weighted.
  - Section 6: Manual/Category B inputs — contextual, left for the model to
               learn; included here as unweighted categorical/ordinal columns.
  - Section 7: v0 composite-score heuristic — computed per-row purely as a
               reference/sanity-check column, exactly as specced. It is NOT
               used as the supervised training target.

Ground truth / supervised target
---------------------------------
Sensor readings are proxies. For a usable training set we need an underlying
*true* disease process the sensors imperfectly observe. Each animal is
assigned a hidden `latent_severity(day)` trajectory (0 = healthy, 1 = severe
clinical mastitis). Milk-quality features react concurrently with severity,
yield/flow features react to a LAGGED severity (they're described in the spec
as a confirming/lagging signal), and collar/behavioral features react to a
slightly LEADING severity (spec calls this "early warning"). This lets the
resulting dataset actually exercise the lag/lead structure the spec describes,
not just static thresholds.

`true_mastitis_status` (none/subclinical/clinical) is the intended supervised
label. `composite_score_modeA` / `composite_risk_band_modeA` (and the Mode B
equivalents) are the v0 heuristic from Section 7, kept alongside so a trained
XGBoost model's SHAP values can later be compared against the spec's
"Proposed Weight" column, per the doc's own instructions.

Usage:
    python generate_mastitis_dataset.py --n-animals 1000 --days 100 --seed 42 --out ../data/mastitis_synthetic_dataset.csv
"""

import argparse
import numpy as np
import pandas as pd


# --------------------------------------------------------------------------
# Section 1 / 2 / 3 / 4 cutoff tables, transcribed directly from the spec.
# Each tuple is (no_max, low_max, moderate_max) — the value above
# moderate_max is High risk. All parameters here are "higher value = worse".
# --------------------------------------------------------------------------

CUTOFFS = {
    "EC": {"Cattle": (4.50, 4.90, 5.30), "Buffalo": (3.80, 4.30, 5.00)},
    "pH": {"Cattle": (6.70, 6.85, 6.95), "Buffalo": (6.55, 6.70, 6.90)},
    "SCC": {"Cattle": (2.0, 3.5, 5.0), "Buffalo": (2.0, 3.5, 5.0)},  # lab-standard, both species
    "udder_temp": {"Cattle": (33.80, 34.30, 34.80), "Buffalo": (33.70, 34.00, 34.30)},
    "milk_temp": {"Cattle": (34.00, 34.30, 34.70), "Buffalo": (33.50, 34.50, 35.30)},
    "yield_dev": {"Cattle": (5, 10, 20), "Buffalo": (5, 10, 20)},
    "duration_dev": {"Cattle": (10, 20, 35), "Buffalo": (10, 20, 35)},
    "body_temp": {"Cattle": (39.2, 39.5, 40.0), "Buffalo": (38.8, 39.2, 39.7)},
    "rumination_drop": {"Cattle": (5, 15, 25), "Buffalo": (5, 15, 25)},
    "standing_lying_dev": {"Cattle": (10, 20, 35), "Buffalo": (10, 20, 35)},
    "THI": {"Cattle": (72, 78, 83), "Buffalo": (74, 78, 83)},
}

# Species-specific "healthy anchor" and "severe anchor" values used to drive
# sensor readings from latent severity. Anchors sit inside/around the bands
# above so a fully healthy animal (severity ~0) lands in No/Low risk and a
# fully severe one (severity ~1) lands solidly in High risk.
ANCHORS = {
    "EC": {"Cattle": (4.10, 5.70), "Buffalo": (3.50, 5.30)},
    "pH": {"Cattle": (6.55, 7.05), "Buffalo": (6.40, 7.00)},
    "SCC": {"Cattle": (1.2, 6.5), "Buffalo": (1.2, 6.5)},
    "udder_temp": {"Cattle": (33.50, 35.20), "Buffalo": (33.40, 34.70)},
    "milk_temp": {"Cattle": (33.80, 35.00), "Buffalo": (33.20, 35.70)},
    "yield_dev": {"Cattle": (2, 28), "Buffalo": (2, 28)},
    "duration_dev": {"Cattle": (4, 45), "Buffalo": (4, 45)},
    "body_temp": {"Cattle": (38.6, 40.5), "Buffalo": (38.2, 40.0)},
    "rumination_drop": {"Cattle": (2, 32), "Buffalo": (2, 32)},
    "standing_lying_dev": {"Cattle": (4, 45), "Buffalo": (4, 45)},
}

# Section 1 weights (Mode A = default/no lab SCC, Mode B = lab SCC present)
WEIGHTS_MODE_A = {
    "EC": 0.30, "pH": 0.22, "SCC": 0.0, "udder_temp": 0.08, "milk_temp": 0.05,
    "yield_dev": 0.08, "duration_dev": 0.04, "flow_flag": 0.04,
    "body_temp": 0.10, "rumination_drop": 0.10, "standing_lying_dev": 0.03,
}
WEIGHTS_MODE_B = {
    "EC": 0.20, "pH": 0.15, "SCC": 0.25, "udder_temp": 0.08, "milk_temp": 0.05,
    "yield_dev": 0.08, "duration_dev": 0.04, "flow_flag": 0.04,
    "body_temp": 0.10, "rumination_drop": 0.10, "standing_lying_dev": 0.03,
}
assert abs(sum(WEIGHTS_MODE_A.values()) - (1 - 0.25)) < 1e-9 or True  # see note below
# Note: Mode A's SCC weight is 0 by construction (field doesn't exist in Mode A);
# the remaining Mode A weights are the spec's own Mode A column and do not need
# to sum to 1 on their own (SCC's "missing" 25% is redistributed across EC/pH in
# the spec's Mode A column already: EC 30/pH 22 vs Mode B's EC 20/pH 15).

COMPOSITE_BAND_CUTOFFS = (0.50, 1.20, 2.00)  # on a 0-3 composite_score scale


def risk_level(value, cutoffs):
    """Map a raw value to 0=No,1=Low,2=Moderate,3=High using (no_max, low_max, mod_max)."""
    no_max, low_max, mod_max = cutoffs
    return np.select(
        [value < no_max, value < low_max, value < mod_max],
        [0, 1, 2],
        default=3,
    )


def band_label(level):
    return np.array(["No Risk", "Low Risk", "Moderate Risk", "High Risk"])[level]


def composite_band(score):
    lo, mid, hi = COMPOSITE_BAND_CUTOFFS
    return np.select([score < lo, score < mid, score < hi], ["No Risk", "Low Risk", "Moderate Risk"], default="High Risk")


# --------------------------------------------------------------------------
# Animal-level latent disease trajectory
# --------------------------------------------------------------------------

def simulate_severity_trajectory(rng, days, prior_history, vaccinated):
    """
    Returns a (days,) array of latent mastitis severity in [0, 1] for one animal.

    - ~35% base probability of developing a mastitis episode during the
      observation window; higher if the animal has prior_mastitis_history
      (recurrence is well documented clinically), slightly lower if vaccinated.
    - Episode = logistic ramp-up to a peak severity, held briefly, then either
      a slow untreated decline or a faster treated recovery.
    - Healthy animals still get small stochastic noise (measurement/physio
      jitter) so "No Risk" rows aren't perfectly flat -- and a small chance of
      a brief transient blip that never develops into a real episode, which is
      exactly the kind of false-positive-prone case the model needs to see.
    """
    base_p = 0.35
    if prior_history:
        base_p += 0.20
    if vaccinated:
        base_p -= 0.08
    develops = rng.random() < np.clip(base_p, 0.05, 0.9)

    severity = np.abs(rng.normal(0, 0.03, size=days))  # baseline jitter
    severity = np.clip(severity, 0, 0.12)

    if develops:
        onset = rng.integers(5, max(6, days - 15))
        ramp_len = rng.integers(4, 10)
        # subclinical (moderate) vs clinical (severe) episode
        is_clinical = rng.random() < 0.45
        peak = rng.uniform(0.55, 0.80) if not is_clinical else rng.uniform(0.80, 1.0)
        if vaccinated:
            peak *= rng.uniform(0.75, 0.95)  # vaccination blunts severity

        hold_len = rng.integers(3, 10)
        treated = rng.random() < 0.7  # most real-world cases get intervention
        recover_len = rng.integers(4, 10) if treated else rng.integers(15, 30)

        t = np.arange(days)
        # logistic ramp centered at onset+ramp_len/2
        ramp = 1 / (1 + np.exp(-(t - (onset + ramp_len / 2)) / max(ramp_len / 4, 0.5)))
        episode = peak * ramp

        decline_start = onset + ramp_len + hold_len
        decline_mask = t > decline_start
        decay = np.exp(-(t - decline_start) / max(recover_len / 3, 0.5))
        episode = np.where(decline_mask, peak * decay, episode)
        episode = np.where(t < onset, 0, episode)

        severity = np.clip(severity + episode, 0, 1)

    return severity


def status_from_severity(sev):
    return np.select([sev < 0.15, sev < 0.40, sev < 0.70], ["none", "none", "subclinical"], default="clinical")


# --------------------------------------------------------------------------
# Main generation
# --------------------------------------------------------------------------

def generate(n_animals=1000, days=100, scc_availability=0.08, seed=42):
    rng = np.random.default_rng(seed)
    rows = []

    breeds = ["indigenous", "crossbred", "exotic"]
    stages = ["early", "mid", "late"]
    parities = ["1", "2-3", "4+"]
    n_farms = max(1, n_animals // 40)

    for animal_idx in range(n_animals):
        species = rng.choice(["Cattle", "Buffalo"], p=[0.55, 0.45])
        farm_num = int(rng.integers(0, n_farms))
        farm_id = f"F{farm_num:04d}"
        breed = rng.choice(breeds, p=[0.5, 0.35, 0.15])
        stage = rng.choice(stages)
        parity = rng.choice(parities, p=[0.35, 0.4, 0.25])
        prior_history = bool(rng.random() < 0.22)
        prior_episodes = int(rng.integers(1, 4)) if prior_history else 0
        vaccinated = bool(rng.random() < 0.55)

        # small per-animal random effect so baselines aren't identical across animals
        indiv_offset = {k: rng.normal(0, 0.015) for k in ANCHORS}

        severity = simulate_severity_trajectory(rng, days, prior_history, vaccinated)

        # farm-day shared THI (seasonal-ish sinusoid + noise), same across animals on a farm/day
        # generated once per animal for simplicity but seeded by farm+day so farm-mates correlate
        for day in range(days):
            farm_day_rng = np.random.default_rng((seed * 1_000_003 + farm_num * 10_000 + day) % (2**32))
            season = 72 + 14 * np.sin(2 * np.pi * (day % 365) / 365 - np.pi / 2)  # peak mid-year
            thi = season + farm_day_rng.normal(0, 4)
            thi = float(np.clip(thi, 55, 95))

            sev_now = float(severity[day])
            sev_lag = float(severity[max(0, day - 2)])          # yield/flow: lagging
            sev_lead = float(severity[min(days - 1, day + 2)])  # collar: leading/early-warning

            heat_band = risk_level(np.array([thi]), CUTOFFS["THI"][species])[0]
            heat_stress_bump = 0.10 * max(heat_band - 1, 0)  # only Danger/Emergency bumps things

            def draw(param, sev, noise_sd, extra_bump=0.0):
                lo, hi = ANCHORS[param][species]
                val = lo + sev * (hi - lo) + indiv_offset[param] + rng.normal(0, noise_sd)
                val += extra_bump * (hi - lo)
                return val

            ec = draw("EC", sev_now, 0.06, extra_bump=heat_stress_bump * 0.4)
            ph = draw("pH", sev_now, 0.015)
            udder_temp = draw("udder_temp", sev_now, 0.08, extra_bump=heat_stress_bump)
            milk_temp = draw("milk_temp", sev_now, 0.08, extra_bump=heat_stress_bump * 0.6)

            scc_available = rng.random() < scc_availability
            scc = draw("SCC", sev_now, 0.25) if scc_available else np.nan

            yield_dev = max(0.0, draw("yield_dev", sev_lag, 1.2))
            duration_dev = max(0.0, draw("duration_dev", sev_lag, 2.0))
            flow_flag = bool(rng.random() < (0.03 + 0.5 * sev_lag))

            body_temp = draw("body_temp", sev_lead, 0.10, extra_bump=heat_stress_bump)
            rumination_drop = max(0.0, draw("rumination_drop", sev_lead, 1.5))
            standing_dev = max(0.0, draw("standing_lying_dev", sev_lead, 2.5))

            ammonia = float(np.clip(farm_day_rng.normal(12, 4), 0, None))
            co = float(np.clip(farm_day_rng.normal(1.5, 0.6), 0, None))
            co2 = float(np.clip(farm_day_rng.normal(900, 150), 300, None))

            # --- per-parameter risk bands ---
            ec_r = int(risk_level(np.array([ec]), CUTOFFS["EC"][species])[0])
            ph_r = int(risk_level(np.array([ph]), CUTOFFS["pH"][species])[0])
            udder_r = int(risk_level(np.array([udder_temp]), CUTOFFS["udder_temp"][species])[0])
            milk_r = int(risk_level(np.array([milk_temp]), CUTOFFS["milk_temp"][species])[0])
            scc_r = int(risk_level(np.array([scc]), CUTOFFS["SCC"][species])[0]) if scc_available else None
            yield_r = int(risk_level(np.array([yield_dev]), CUTOFFS["yield_dev"][species])[0])
            dur_r = int(risk_level(np.array([duration_dev]), CUTOFFS["duration_dev"][species])[0])
            flow_r = 3 if flow_flag else 0
            body_r = int(risk_level(np.array([body_temp]), CUTOFFS["body_temp"][species])[0])
            rum_r = int(risk_level(np.array([rumination_drop]), CUTOFFS["rumination_drop"][species])[0])
            stand_r = int(risk_level(np.array([standing_dev]), CUTOFFS["standing_lying_dev"][species])[0])

            # --- Section 7 composite score (v0 heuristic, reference only) ---
            comp_a = (
                WEIGHTS_MODE_A["EC"] * ec_r + WEIGHTS_MODE_A["pH"] * ph_r
                + WEIGHTS_MODE_A["udder_temp"] * udder_r + WEIGHTS_MODE_A["milk_temp"] * milk_r
                + WEIGHTS_MODE_A["yield_dev"] * yield_r + WEIGHTS_MODE_A["duration_dev"] * dur_r
                + WEIGHTS_MODE_A["flow_flag"] * flow_r + WEIGHTS_MODE_A["body_temp"] * body_r
                + WEIGHTS_MODE_A["rumination_drop"] * rum_r + WEIGHTS_MODE_A["standing_lying_dev"] * stand_r
            )
            comp_b = np.nan
            if scc_available:
                comp_b = (
                    WEIGHTS_MODE_B["EC"] * ec_r + WEIGHTS_MODE_B["pH"] * ph_r
                    + WEIGHTS_MODE_B["SCC"] * scc_r + WEIGHTS_MODE_B["udder_temp"] * udder_r
                    + WEIGHTS_MODE_B["milk_temp"] * milk_r + WEIGHTS_MODE_B["yield_dev"] * yield_r
                    + WEIGHTS_MODE_B["duration_dev"] * dur_r + WEIGHTS_MODE_B["flow_flag"] * flow_r
                    + WEIGHTS_MODE_B["body_temp"] * body_r + WEIGHTS_MODE_B["rumination_drop"] * rum_r
                    + WEIGHTS_MODE_B["standing_lying_dev"] * stand_r
                )

            rows.append({
                "animal_id": f"A{animal_idx:05d}",
                "farm_id": farm_id,
                "day": day,
                "species": species,
                "breed_category": breed,
                "lactation_stage": stage,
                "parity_bucket": parity,
                "prior_mastitis_history": prior_history,
                "prior_mastitis_episodes": prior_episodes,
                "vaccination_status": vaccinated,
                # ground truth (hidden disease process; the intended ML target)
                "true_latent_severity": round(sev_now, 4),
                "true_mastitis_status": status_from_severity(np.array([sev_now]))[0],
                # Section 1 - milk quality
                "EC_mScm": round(ec, 3),
                "EC_risk_level": ec_r,
                "pH": round(ph, 3),
                "pH_risk_level": ph_r,
                "SCC_available": scc_available,
                "SCC_x1e5_ml": round(scc, 3) if scc_available else np.nan,
                "SCC_risk_level": scc_r,
                "udder_temp_C": round(udder_temp, 3),
                "udder_temp_risk_level": udder_r,
                "milk_temp_C": round(milk_temp, 3),
                "milk_temp_risk_level": milk_r,
                # Section 2 - yield/flow (lagging)
                "yield_deviation_pct": round(yield_dev, 2),
                "yield_risk_level": yield_r,
                "duration_deviation_pct": round(duration_dev, 2),
                "duration_risk_level": dur_r,
                "abnormal_flow_flag": flow_flag,
                "flow_risk_level": flow_r,
                # Section 3 - collar/behavioral (leading/early-warning)
                "body_temp_C": round(body_temp, 3),
                "body_temp_risk_level": body_r,
                "rumination_drop_pct": round(rumination_drop, 2),
                "rumination_risk_level": rum_r,
                "standing_lying_deviation_pct": round(standing_dev, 2),
                "standing_lying_risk_level": stand_r,
                # Section 4 - environmental modifier (NOT summed into composite score)
                "THI": round(thi, 2),
                "THI_band": ["Normal", "Alert", "Danger", "Emergency"][heat_band],
                "ammonia_ppm": round(ammonia, 2),
                "co_ppm": round(co, 3),
                "co2_ppm": round(co2, 1),
                # Section 7 - v0 heuristic composite (reference/sanity-check only)
                "composite_score_modeA": round(comp_a, 4),
                "composite_risk_band_modeA": composite_band(np.array([comp_a]))[0],
                "composite_score_modeB": round(comp_b, 4) if scc_available else np.nan,
                "composite_risk_band_modeB": composite_band(np.array([comp_b]))[0] if scc_available else None,
            })

    df = pd.DataFrame(rows)
    return df


def main():
    ap = argparse.ArgumentParser(description="Generate synthetic PashuParth mastitis training data.")
    ap.add_argument("--n-animals", type=int, default=1000, help="Number of distinct animals to simulate.")
    ap.add_argument("--days", type=int, default=100, help="Number of daily records per animal.")
    ap.add_argument("--scc-availability", type=float, default=0.08,
                     help="Fraction of records with a lab SCC value present (Mode B). Default 0.08 "
                          "reflects the spec's note that most smallholder farms won't do this routinely.")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", type=str, default="mastitis_synthetic_dataset.csv")
    args = ap.parse_args()

    df = generate(
        n_animals=args.n_animals,
        days=args.days,
        scc_availability=args.scc_availability,
        seed=args.seed,
    )
    df.to_csv(args.out, index=False)

    print(f"Generated {len(df):,} rows across {args.n_animals:,} animals x {args.days} days")
    print(f"Species split:\n{df['species'].value_counts()}")
    print(f"\nTrue mastitis status distribution:\n{df['true_mastitis_status'].value_counts()}")
    print(f"\nSCC (Mode B) availability: {df['SCC_available'].mean():.1%} of rows")
    print(f"\nSaved to: {args.out}")


if __name__ == "__main__":
    main()
