"""
PashuParth Live Supabase Data Ingestion CLI Tool
------------------------------------------------
Sends real data directly to your live Supabase database tables via HTTP REST API.
"""

import sys
import json
import urllib.request
import urllib.error
import argparse
from datetime import datetime, timezone

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://pjuxqyloqnsjhtsbmvrt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdXhxeWxvcW5zamh0c2JtdnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI0ODYsImV4cCI6MjEwNjA0ODQ4Nn0.nJ4MyNUK_VFYO8lcGxtg5D6KbkYuGytAfGxLdFE6rqc"

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def seed_parent_entities():
    """Ensure sample farm and animal exist in Supabase so foreign key constraints pass."""
    headers = get_supabase_headers()
    headers["Prefer"] = "resolution=merge-duplicates"
    
    # 1. Seed Farm
    farm_data = {
        "farm_id": "farm-pb-001",
        "farm_name": "Surya Dairy Farm",
        "district": "Anand",
        "latitude": 22.5645,
        "longitude": 72.9289,
        "total_animals": 45,
        "herd_size": 45
    }
    req_farm = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/farms",
        data=json.dumps(farm_data).encode('utf-8'),
        headers=headers
    )
    try:
        with urllib.request.urlopen(req_farm) as resp:
            pass
    except Exception:
        pass

    # 2. Seed Animal
    animal_data = {
        "animal_id": "pp-a001",
        "rfid_tag": "982 000183940121",
        "name": "Gauri",
        "species": "Cattle",
        "breed": "Gir",
        "farm_id": "farm-pb-001",
        "current_risk_score": 88,
        "current_risk_band": "High Risk"
    }
    req_animal = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/animals",
        data=json.dumps(animal_data).encode('utf-8'),
        headers=headers
    )
    try:
        with urllib.request.urlopen(req_animal) as resp:
            pass
    except Exception:
        pass

def submit_manual_entry(animal_id="pp-a001", category="symptom_self_report", note="Udder swelling observed on FL teat"):
    seed_parent_entities()
    
    # Do NOT pass entry_id so PostgreSQL auto-generates a valid UUID
    payload = {
        "farm_id": "farm-pb-001",
        "animal_id": animal_id,
        "category": category,
        "payload": {
            "symptom_note": note,
            "swelling_observed": True,
            "milk_discoloration": "Yellowish",
            "behavior_change": "Lethargic",
            "recorded_at": datetime.now(timezone.utc).isoformat()
        },
        "photo_url": "https://storage.pashuparth.in/photos/gauri_fl_teat.jpg"
    }
    
    endpoint = f"{SUPABASE_URL}/rest/v1/manual_entries"
    headers = get_supabase_headers()
    
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            inserted_record = res_data[0] if isinstance(res_data, list) else res_data
            print("=========================================================================")
            print("[SUCCESS] Manual Entry Ingested & Saved into LIVE Supabase Database!")
            print(f"Entry UUID:  {inserted_record.get('entry_id')}")
            print(f"Category:    {inserted_record.get('category')}")
            print(f"Animal ID:   {inserted_record.get('animal_id')}")
            print(f"Direct Link: https://supabase.com/dashboard/project/pjuxqyloqnsjhtsbmvrt/editor/manual_entries")
            print("=========================================================================\n")
            return inserted_record
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"[ERROR] Supabase REST API Rejected Insert (HTTP {e.code}): {err_msg}")
        if "policy" in err_msg.lower() or "row-level security" in err_msg.lower() or e.code == 401 or e.code == 403:
            print("\n[SOLUTION]: Execute the RLS permission fix in Supabase SQL Editor.")
        return None
    except Exception as e:
        print(f"[ERROR] Failed to insert data into Supabase: {e}")
        return None

def submit_treatment_record(animal_id="pp-a001", drug_name="Cefquinome Sulfate", withdrawal_days=4):
    seed_parent_entities()
    
    payload = {
        "animal_id": animal_id,
        "diagnosis": "Subclinical Mastitis Warning",
        "affected_quarter": "Front-Left (FL)",
        "drug_name": drug_name,
        "dosage": "1.0 mg/kg",
        "withdrawal_days": withdrawal_days
    }
    
    endpoint = f"{SUPABASE_URL}/rest/v1/treatment_records"
    headers = get_supabase_headers()
    
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            inserted_record = res_data[0] if isinstance(res_data, list) else res_data
            print("=========================================================================")
            print("[SUCCESS] AMR Treatment Record Saved into LIVE Supabase Database!")
            print(f"Treatment UUID: {inserted_record.get('treatment_id')}")
            print(f"Drug Name:      {inserted_record.get('drug_name')}")
            print(f"Withdrawal:     {inserted_record.get('withdrawal_days')} Days")
            print(f"Direct Link:    https://supabase.com/dashboard/project/pjuxqyloqnsjhtsbmvrt/editor/treatment_records")
            print("=========================================================================\n")
            return inserted_record
    except Exception as e:
        print(f"[ERROR] Failed to insert treatment record into Supabase: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PashuParth Live Supabase Auto Ingest CLI")
    parser.add_argument("--type", choices=["manual", "treatment"], default="manual")
    parser.add_argument("--animal", default="pp-a001")
    parser.add_argument("--category", default="symptom_self_report")
    parser.add_argument("--note", default="Udder swelling observed on FL teat")
    parser.add_argument("--drug", default="Cefquinome Sulfate")
    parser.add_argument("--days", type=int, default=4)
    
    args = parser.parse_args()
    
    if args.type == "manual":
        submit_manual_entry(animal_id=args.animal, category=args.category, note=args.note)
    elif args.type == "treatment":
        submit_treatment_record(animal_id=args.animal, drug_name=args.drug, withdrawal_days=args.days)
