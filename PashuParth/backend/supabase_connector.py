"""
PashuParth Supabase Live Cloud Sync & Seeding Helper
---------------------------------------------------
Connects to your live Supabase project, verifies table existence,
and seeds initial sample data.

Usage:
  python backend/supabase_connector.py --url "https://xyz.supabase.co" --key "eyJhbGciOi..."
"""

import sys
import json
import urllib.request
import urllib.error
import argparse

def test_and_seed_supabase(supabase_url: str, supabase_key: str):
    supabase_url = supabase_url.rstrip('/')
    print("=========================================================================")
    print("[PASHUPARTH LIVE SUPABASE CLOUD CONNECTOR]")
    print(f"Connecting to Target Project: {supabase_url}")
    print("=========================================================================\n")

    # Clean URL reference ID extraction
    project_ref = supabase_url.replace("https://", "").replace("http://", "").split(".")[0]
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # 1. Test connection to animals table
    test_endpoint = f"{supabase_url}/rest/v1/farms?select=*"
    req = urllib.request.Request(test_endpoint, headers=headers)

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("1. [SUCCESS] Successfully authenticated with live Supabase project!")
            print(f"   Existing farms in live database: {len(data)}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("[NOTICE] Authentication succeeded, but tables are not created yet.")
            print("Please paste 'backend/supabase_schema.sql' into the Supabase SQL Editor and click 'Run'.")
        else:
            print(f"[ERROR] Failed to authenticate with Supabase (HTTP {e.code}): {e.read().decode('utf-8')}")
            return
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return

    # Seed sample farm using v2 schema columns
    sample_farm = {
        "farm_id":        "farm-pb-001",
        "farm_name":      "Surya Dairy Farm",
        "owner_name":     "Ramesh Patel",
        "mobile_number":  "+91 98765 43210",
        "district":       "Anand",
        "cattle_count":   26,
        "buffalo_count":  16,
        "latitude":       22.5645,
        "longitude":      72.9289
    }
    
    seed_req = urllib.request.Request(
        f"{supabase_url}/rest/v1/farms",
        data=json.dumps(sample_farm).encode('utf-8'),
        headers={**headers, "Prefer": "resolution=merge-duplicates"}
    )
    
    try:
        with urllib.request.urlopen(seed_req) as resp:
            print("2. [SUCCESS] Seeded default farm ('Surya Dairy Farm') into live Supabase database!")
    except Exception as e:
        print(f"   Note: Farm seeding step: {e}")

    print("\n=========================================================================")
    print("YOUR REAL LIVE SUPABASE TABLE DIRECT LINKS:")
    print("=========================================================================")
    print(f"  * Table Editor Home      : https://supabase.com/dashboard/project/{project_ref}/editor")
    print(f"  * Field Personnel Table  : https://supabase.com/dashboard/project/{project_ref}/editor/field_personnel")
    print(f"  * Vets Table             : https://supabase.com/dashboard/project/{project_ref}/editor/vets")
    print(f"  * Admins Table           : https://supabase.com/dashboard/project/{project_ref}/editor/admins")
    print(f"  * Farms Table            : https://supabase.com/dashboard/project/{project_ref}/editor/farms")
    print(f"  * Animals Master Table   : https://supabase.com/dashboard/project/{project_ref}/editor/animals")
    print(f"  * Manual Entries Table   : https://supabase.com/dashboard/project/{project_ref}/editor/manual_entries")
    print(f"  * AMR Treatments Table   : https://supabase.com/dashboard/project/{project_ref}/editor/treatment_records")
    print(f"  * Milking Events Table   : https://supabase.com/dashboard/project/{project_ref}/editor/milking_events")
    print(f"  * Urgent Alerts Table    : https://supabase.com/dashboard/project/{project_ref}/editor/alerts")
    print("=========================================================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PashuParth Supabase Live Connector")
    parser.add_argument("--url", required=True, help="Your Supabase Project URL (e.g., https://xyz.supabase.co)")
    parser.add_argument("--key", required=True, help="Your Supabase anon or service_role API key")
    args = parser.parse_args()

    test_and_seed_supabase(args.url, args.key)
