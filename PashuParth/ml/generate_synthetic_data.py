"""
PashuParth ML Pipeline — Synthetic Multi-Modal Data Generator
Generates synthetic animal-day telemetry records for Cattle (Gir, Sahiwal, HF Cross) 
and Buffalo (Murrah, Jaffrabadi) for subclinical mastitis forecasting.
"""

import os
import random
import pandas as pd
import numpy as np

def generate_synthetic_dataset(num_animals=100, days=30, output_path="synthetic_mastitis_dataset.csv"):
    random.seed(42)
    np.random.seed(42)
    
    species_list = ['Cattle', 'Buffalo']
    cattle_breeds = ['Gir', 'Sahiwal', 'HF Cross']
    buffalo_breeds = ['Murrah', 'Jaffrabadi']
    
    records = []
    
    for animal_idx in range(1, num_animals + 1):
        species = random.choice(species_list)
        breed = random.choice(cattle_breeds) if species == 'Cattle' else random.choice(buffalo_breeds)
        rfid = f"982 0001839{animal_idx:05d}"
        animal_id = f"pp-a{animal_idx:03d}"
        days_in_milk = random.randint(30, 220)
        lactation = random.randint(1, 5)
        
        # Baseline offset calibration based on species/breed
        ec_baseline = 5.2 if species == 'Cattle' else 5.5 # Buffalo baseline slightly higher
        
        # Simulate disease onset for ~20% of animals starting around day 15
        has_disease_trajectory = random.random() < 0.20
        disease_start_day = random.randint(12, 20) if has_disease_trajectory else 999
        affected_quarter = random.choice(['front_left', 'front_right', 'back_left', 'back_right'])
        
        for day in range(1, days + 1):
            date_str = f"2026-09-{day:02d}"
            
            # Disease progression multiplier
            if has_disease_trajectory and day >= disease_start_day:
                progression = min(1.0, (day - disease_start_day + 1) / 8.0)
            else:
                progression = 0.0
                
            # Teat telemetry
            fl_ec = ec_baseline + random.uniform(-0.2, 0.2) + (progression * 2.8 if affected_quarter == 'front_left' else 0.0)
            fr_ec = ec_baseline + random.uniform(-0.2, 0.2) + (progression * 2.8 if affected_quarter == 'front_right' else 0.0)
            bl_ec = ec_baseline + random.uniform(-0.2, 0.2) + (progression * 2.8 if affected_quarter == 'back_left' else 0.0)
            br_ec = ec_baseline + random.uniform(-0.2, 0.2) + (progression * 2.8 if affected_quarter == 'back_right' else 0.0)
            
            max_ec = max(fl_ec, fr_ec, bl_ec, br_ec)
            
            # pH (Normal 6.5-6.6, Subclinical up to 6.9-7.2)
            fl_ph = 6.5 + (progression * 0.5 if affected_quarter == 'front_left' else random.uniform(-0.1, 0.1))
            
            # Collar Telemetry
            body_temp = 38.4 + (progression * 1.1) + random.uniform(-0.2, 0.2)
            rumination_mins = max(250, int(510 - (progression * 140) + random.randint(-20, 20)))
            activity_idx = max(20, int(75 - (progression * 30) + random.randint(-10, 10)))
            
            # Barn Environment (THI)
            thi_index = round(74.0 + random.uniform(-4, 6), 1)
            
            # SCC proxy score derivation
            scc_proxy = int(150000 + (progression * 850000) + random.randint(-20000, 20000))
            
            # Target Risk Band
            if max_ec > 7.0 or progression >= 0.7:
                risk_band = 'High Risk'
                risk_score = min(98, int(70 + progression * 28))
            elif max_ec > 6.0 or progression >= 0.3:
                risk_band = 'Moderate Risk'
                risk_score = int(45 + progression * 24)
            elif max_ec > 5.6 or progression > 0:
                risk_band = 'Low Risk'
                risk_score = int(25 + progression * 18)
            else:
                risk_band = 'No Risk'
                risk_score = random.randint(8, 22)
                
            records.append({
                'date': date_str,
                'animal_id': animal_id,
                'rfid_tag': rfid,
                'species': species,
                'breed': breed,
                'lactation_number': lactation,
                'days_in_milk': days_in_milk,
                'fl_ec': round(fl_ec, 2),
                'fr_ec': round(fr_ec, 2),
                'bl_ec': round(bl_ec, 2),
                'br_ec': round(br_ec, 2),
                'max_teat_ec': round(max_ec, 2),
                'fl_ph': round(fl_ph, 2),
                'body_temp': round(body_temp, 2),
                'rumination_minutes': rumination_mins,
                'activity_index': activity_idx,
                'thi_index': thi_index,
                'scc_proxy': scc_proxy,
                'risk_score': risk_score,
                'risk_band': risk_band
            })
            
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"✅ Generated synthetic dataset with {len(df)} records ({num_animals} animals over {days} days) saved to {output_path}")
    return df

if __name__ == '__main__':
    os.makedirs('ml/data', exist_ok=True)
    generate_synthetic_dataset(num_animals=50, days=20, output_path='ml/data/synthetic_mastitis_dataset.csv')
