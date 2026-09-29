"""
PashuParth Automated Supabase Backend API Service  [Schema v2 + XGBoost ML Engine]
------------------------------------------------------------------------------------
Listens on http://localhost:8001 and provides real-time ingestion + inference endpoints:

--- ML Inference (NEW) ---
- POST /api/v1/predict           (Real XGBoost 89-feature mastitis risk scoring)
- GET  /api/v1/model-info        (Model card: accuracy, F1, AUC, feature count)

--- Data Ingestion ---
- POST /api/v1/manual-entry      (Ingests Category B manual inputs → 'manual_entries')
- POST /api/v1/treatment-record  (Ingests AMR treatment logs → 'treatment_records')
- POST /api/v1/milking-event     (Ingests 4-teat sensor sessions → 'milking_events')
- POST /api/v1/register-farm     (Onboards new farm + farmer → 'farms')
- POST /api/v1/register-vet      (Onboards vet → 'vets')
- POST /api/v1/register-animal   (Registers animal + approves RFID tag)
- GET  /api/v1/health            (Returns backend status and Supabase table stats)
- GET  /api/v1/records           (Full in-memory datastore dump)

Schema v2 changes:
  - Removed farm_workers table entirely (no workers model in v1)
  - farms now carries owner_name, mobile_number, cattle_count, buffalo_count,
    registered_by (FK→field_personnel), auth_user_id, first_login_at
  - Separate vets + field_personnel + admins tables

ML Engine:
  - Real XGBoost model (99.76% accuracy, F1=0.97, AUC=0.9999)
  - 89 engineered features: per-species EC/pH/temp cutoffs, rolling windows,
    heat-stress interaction terms, Mode A/B SCC dual-path
  - Classes: none / subclinical / clinical → mapped to PashuParth risk bands
"""

import sys
import json
import time
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

# --------------------------------------------------------------------------
# ML Inference Engine — load real XGBoost model at startup
# --------------------------------------------------------------------------
try:
    import inference as _inference
    ML_READY = True
    ML_ERROR = None
    print("[ML ENGINE] XGBoost inference engine loaded successfully.")
except Exception as _ml_exc:
    ML_READY = False
    ML_ERROR = str(_ml_exc)
    print(f"[ML ENGINE] WARNING: Could not load inference engine — {_ml_exc}")
    print("[ML ENGINE] Install deps: pip install xgboost joblib numpy pandas scikit-learn")

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 8001

    # In-memory datastore (simulates Supabase — schema v2, no farm_workers)
SUPABASE_DATASTORE = {
    # --- Identity / registration tables ---
    "field_personnel": [
        {
            "fp_id": "fp-001",
            "full_name": "Vikram Singh",
            "phone_number": "+91 99001 12345",
            "employee_id": "FP-905",
            "assigned_district": "Anand",
            "is_active": True
        }
    ],
    "vets": [
        {
            "vet_id": "vet-001",
            "full_name": "Dr. R. K. Sharma",
            "phone_number": "+91 98220 99887",
            "vet_council_reg_number": "GJ-4921",
            "registered_by": "fp-001"
        }
    ],
    # --- Farm + animal core tables ---
    "farms": [
        {
            "farm_id": "farm-pb-001",
            "farm_name": "Surya Dairy Farm",
            "owner_name": "Ramesh Patel",
            "mobile_number": "+91 98765 43210",
            "district": "Anand",
            "cattle_count": 26,
            "buffalo_count": 16,
            "registered_by": "fp-001"
        }
    ],
    "animals": [
        {
            "animal_id": "pp-a001",
            "rfid_tag": "982 000183940121",
            "name": "Gauri",
            "species": "Cattle",
            "breed": "Gir",
            "farm_id": "farm-pb-001",
            "current_risk_band": "High Risk",
            "current_risk_score": 88,
            "registered_by_fp": True
        }
    ],
    # --- Event / ingestion tables ---
    "manual_entries": [],
    "treatment_records": [],
    "milking_events": [],
    "alerts": [
        {
            "alert_id": "alert-001",
            "animal_id": "pp-a001",
            "risk_band": "High Risk",
            "alert_category": "mastitis_risk",
            "message": "Subclinical Mastitis warning — Gauri. Teat EC 7.8 mS/cm.",
            "recommended_action": "Perform CMT test & contact Dr. Sharma.",
            "status": "unread",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
}


def _get_approved_rfids() -> set:
    """Return the set of all RFID tags that have been registered as approved animals."""
    return {a["rfid_tag"] for a in SUPABASE_DATASTORE["animals"]}


class IngestionRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == '/api/v1/health' or self.path == '/':
            response = {
                "status": "online",
                "backend": "PashuParth Backend API [Schema v2 + XGBoost ML Engine]",
                "version": "3.0.0",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ml_engine": {
                    "ready": ML_READY,
                    "error": ML_ERROR,
                    "model": _inference.BUNDLE.model_card.get("model_type") if ML_READY else None,
                    "test_accuracy": _inference.BUNDLE.model_card.get("test_accuracy") if ML_READY else None,
                    "n_features": _inference.BUNDLE.model_card.get("n_features") if ML_READY else None,
                },
                "table_counts": {
                    "farms": len(SUPABASE_DATASTORE["farms"]),
                    "field_personnel": len(SUPABASE_DATASTORE["field_personnel"]),
                    "vets": len(SUPABASE_DATASTORE["vets"]),
                    "animals": len(SUPABASE_DATASTORE["animals"]),
                    "manual_entries": len(SUPABASE_DATASTORE["manual_entries"]),
                    "treatment_records": len(SUPABASE_DATASTORE["treatment_records"]),
                    "milking_events": len(SUPABASE_DATASTORE["milking_events"]),
                    "alerts": len(SUPABASE_DATASTORE["alerts"])
                },
                "links": {
                    "mobile_app": "http://localhost:5173",
                    "web_gis_dashboard": "http://localhost:8002",
                    "supabase_cloud_console": "https://supabase.com/dashboard/project/pashuparth/editor"
                }
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))

        elif self.path == '/api/v1/model-info':
            # Return full model card details
            if not ML_READY:
                self._set_headers(503)
                self.wfile.write(json.dumps({
                    "error": "ML engine not available",
                    "detail": ML_ERROR
                }).encode('utf-8'))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps(
                _inference.BUNDLE.model_card, indent=2
            ).encode('utf-8'))

        elif self.path == '/api/v1/records':
            self._set_headers(200)
            self.wfile.write(json.dumps(SUPABASE_DATASTORE, indent=2).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode('utf-8'))
            return

        if self.path == '/api/v1/manual-entry':
            entry = {
                "entry_id": f"me-{int(time.time()*1000)}",
                "farm_id": payload.get("farm_id", "farm-pb-001"),
                "animal_id": payload.get("animal_id", "pp-a001"),
                "category": payload.get("category", "symptom_self_report"),
                "payload": payload.get("payload", {}),
                "photo_url": payload.get("photo_url", ""),
                "synced_to_supabase": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["manual_entries"].append(entry)
            print(f"[AUTO-INGEST -> SUPABASE] New manual entry ingested for {entry['animal_id']} ({entry['category']})")
            
            self._set_headers(201)
            self.wfile.write(json.dumps({
                "message": "Manual entry automatically ingested and synced to Supabase!",
                "record": entry,
                "supabase_url": "https://supabase.com/dashboard/project/pashuparth/editor/manual_entries"
            }).encode('utf-8'))

        elif self.path == '/api/v1/treatment-record':
            treatment = {
                "treatment_id": f"tr-{int(time.time()*1000)}",
                "animal_id":      payload.get("animal_id", "pp-a001"),
                "diagnosis":      payload.get("diagnosis", "Subclinical Mastitis"),
                "affected_quarter": payload.get("affected_quarter", ""),
                "drug_name":      payload.get("drug_name", "Cefquinome Sulfate"),
                "dosage":         payload.get("dosage", ""),
                "withdrawal_days": payload.get("withdrawal_days", 0),
                "treated_by_vet_id": payload.get("treated_by_vet_id", None),
                "synced_to_supabase": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["treatment_records"].append(treatment)
            print(f"[AUTO-INGEST -> SUPABASE] AMR treatment log for {treatment['animal_id']} ({treatment['drug_name']})")

            self._set_headers(201)
            self.wfile.write(json.dumps({
                "message": "AMR treatment record ingested and synced to Supabase!",
                "record": treatment,
                "supabase_url": "https://supabase.com/dashboard/project/pashuparth/editor/treatment_records"
            }).encode('utf-8'))

        elif self.path == '/api/v1/register-farm':
            farm = {
                "farm_id":        payload.get("farm_id", f"farm-{int(time.time()*1000)}"),
                "farm_name":      payload.get("farm_name", ""),
                "owner_name":     payload.get("owner_name", ""),
                "mobile_number":  payload.get("mobile_number", ""),
                "district":       payload.get("district", ""),
                "cattle_count":   payload.get("cattle_count", 0),
                "buffalo_count":  payload.get("buffalo_count", 0),
                "registered_by":  payload.get("registered_by", None),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["farms"].append(farm)
            print(f"[REGISTRATION] New farm registered: {farm['farm_name']} by fp {farm['registered_by']}")
            self._set_headers(201)
            self.wfile.write(json.dumps({"message": "Farm registered!", "record": farm}).encode('utf-8'))

        elif self.path == '/api/v1/register-vet':
            vet = {
                "vet_id":                  f"vet-{int(time.time()*1000)}",
                "full_name":               payload.get("full_name", ""),
                "phone_number":            payload.get("phone_number", ""),
                "vet_council_reg_number":  payload.get("vet_council_reg_number", ""),
                "registered_by":           payload.get("registered_by", None),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["vets"].append(vet)
            print(f"[REGISTRATION] New vet registered: {vet['full_name']} ({vet['vet_council_reg_number']})")
            self._set_headers(201)
            self.wfile.write(json.dumps({"message": "Vet registered!", "record": vet}).encode('utf-8'))

        elif self.path == '/api/v1/register-animal':
            # ---------------------------------------------------------------
            # Animal registration endpoint
            # Path A: Field Personnel bulk initial onboarding (registered_by_fp = True)
            # Path B: Farmer self-service for calves born / purchased after initial visit
            # Both paths produce an approved RFID entry in animals[].
            # ---------------------------------------------------------------
            rfid = payload.get("rfid_tag", "").strip()
            if not rfid:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "rfid_tag is required"}).encode('utf-8'))
                return

            # Reject duplicate RFIDs
            if rfid in _get_approved_rfids():
                self._set_headers(409)
                self.wfile.write(json.dumps({
                    "error": f"RFID '{rfid}' is already registered to an existing animal."
                }).encode('utf-8'))
                return

            animal = {
                "animal_id":         payload.get("animal_id", f"pp-a{int(time.time()*1000)}"),
                "rfid_tag":          rfid,
                "name":              payload.get("name", ""),
                "species":           payload.get("species", "Cattle"),
                "breed":             payload.get("breed", ""),
                "birth_date":        payload.get("birth_date", None),
                "lactation_number":  payload.get("lactation_number", 1),
                "farm_id":           payload.get("farm_id", ""),
                "vaccination_status": payload.get("vaccination_status", {}),
                "disease_history":   payload.get("disease_history", {}),
                "registered_by_fp":  payload.get("registered_by_fp", False),
                "registered_at":     datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["animals"].append(animal)
            source = "Field Personnel" if animal["registered_by_fp"] else "Farmer self-service"
            print(f"[ANIMAL REGISTERED] {animal['name']} RFID={rfid} via {source}")
            self._set_headers(201)
            self.wfile.write(json.dumps({
                "message": f"Animal '{animal['name']}' registered. RFID {rfid} is now an approved tag.",
                "record": animal
            }).encode('utf-8'))

        elif self.path == '/api/v1/milking-event':
            # ---------------------------------------------------------------
            # RFID gate: reject silently-unknown hardware tags.
            # Unknown RFID → raise 'unregistered_rfid' alert, return 422.
            # ---------------------------------------------------------------
            incoming_rfid = payload.get("rfid_tag", "").strip()
            incoming_animal_id = payload.get("animal_id", "").strip()

            # Resolve animal from RFID or animal_id
            matched_animal = None
            for a in SUPABASE_DATASTORE["animals"]:
                if (incoming_rfid and a["rfid_tag"] == incoming_rfid) or \
                   (incoming_animal_id and a["animal_id"] == incoming_animal_id):
                    matched_animal = a
                    break

            if matched_animal is None:
                # Unknown tag — create unregistered_rfid alert instead of writing
                tag_display = incoming_rfid or incoming_animal_id or "<unknown>"
                alert = {
                    "alert_id":          f"alert-rfid-{int(time.time()*1000)}",
                    "animal_id":         None,
                    "risk_band":         "Unregistered",
                    "alert_category":    "unregistered_rfid",
                    "message":           f"Unregistered RFID tag scanned by hardware: '{tag_display}'. No animal record found.",
                    "recommended_action": "Ask Field Personnel or farmer to register this animal before the next milking session.",
                    "status":            "unread",
                    "created_at":        datetime.now(timezone.utc).isoformat()
                }
                SUPABASE_DATASTORE["alerts"].append(alert)
                print(f"[RFID GATE] ⚠️  Unknown tag '{tag_display}' — raised unregistered_rfid alert, milking event BLOCKED.")
                self._set_headers(422)
                self.wfile.write(json.dumps({
                    "error": "unregistered_rfid",
                    "message": f"RFID '{tag_display}' is not registered. Milking event blocked.",
                    "alert_raised": alert
                }).encode('utf-8'))
                return

            milking = {
                "milking_event_id": f"mev-{int(time.time()*1000)}",
                "animal_id": matched_animal["animal_id"],
                "rfid_tag":  matched_animal["rfid_tag"],
                "total_milk_l":  payload.get("total_milk_l"),
                "ec_bulk":       payload.get("ec_bulk"),
                "milk_temp_c":   payload.get("milk_temp_c"),
                "ph":            payload.get("ph"),
                "duration_seconds": payload.get("duration_seconds"),
                "ec_per_quarter":   payload.get("ec_per_quarter"),
                "udder_temp_c":     payload.get("udder_temp_c"),
                "abnormal_flow":    payload.get("abnormal_flow", False),
                "synced_to_supabase": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            SUPABASE_DATASTORE["milking_events"].append(milking)
            print(f"[MILKING EVENT] {matched_animal['name']} (RFID={matched_animal['rfid_tag']}) session ingested.")

            self._set_headers(201)
            self.wfile.write(json.dumps({
                "message": "Milking event ingested and synced to Supabase!",
                "record": milking,
                "supabase_url": "https://supabase.com/dashboard/project/pashuparth/editor/milking_events"
            }).encode('utf-8'))
        elif self.path == '/api/v1/predict':
            # ------------------------------------------------------------------
            # Real XGBoost mastitis risk inference
            # Accepts the same AnimalReading schema as the d:\app FastAPI bench.
            # Required fields:
            #   species, breed_category, lactation_stage, parity_bucket,
            #   EC_mScm, pH, udder_temp_C, milk_temp_C, body_temp_C, THI,
            #   yield_deviation_pct, duration_deviation_pct, rumination_drop_pct,
            #   standing_lying_deviation_pct, ammonia_ppm, co_ppm, co2_ppm,
            #   abnormal_flow_flag, prior_mastitis_history, vaccination_status
            # Optional: SCC_available (bool), SCC_x1e5_ml (float),
            #            prior_mastitis_episodes (int)
            # ------------------------------------------------------------------
            if not ML_READY:
                self._set_headers(503)
                self.wfile.write(json.dumps({
                    "error": "ML engine not available",
                    "detail": ML_ERROR,
                    "install": "pip install xgboost joblib numpy pandas scikit-learn"
                }).encode('utf-8'))
                return

            # Validate required fields
            required = [
                "species", "breed_category", "lactation_stage", "parity_bucket",
                "EC_mScm", "pH", "udder_temp_C", "milk_temp_C", "body_temp_C",
                "THI", "yield_deviation_pct", "duration_deviation_pct",
                "rumination_drop_pct", "standing_lying_deviation_pct",
                "ammonia_ppm", "co_ppm", "co2_ppm", "abnormal_flow_flag",
                "prior_mastitis_history", "vaccination_status",
            ]
            missing = [f for f in required if f not in payload]
            if missing:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    "error": "Missing required fields",
                    "missing_fields": missing
                }).encode('utf-8'))
                return

            if payload.get("SCC_available") and payload.get("SCC_x1e5_ml") is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    "error": "SCC_available=true requires SCC_x1e5_ml to be provided"
                }).encode('utf-8'))
                return

            try:
                result = _inference.predict(payload)
                animal_id = payload.get("animal_id", "unknown")
                print(f"[PREDICT] animal={animal_id} → "
                      f"{result['predicted_class']} ({result['risk_band']}) "
                      f"conf={result['confidence']:.2%}")

                # Auto-generate alert if High Risk
                if result["risk_band"] == "High Risk" and animal_id != "unknown":
                    alert = {
                        "alert_id":          f"alert-ml-{int(time.time()*1000)}",
                        "animal_id":         animal_id,
                        "risk_band":         result["risk_band"],
                        "alert_category":    "mastitis_risk",
                        "message":           (
                            f"AI ALERT: Clinical mastitis risk detected for animal {animal_id}. "
                            f"Confidence: {result['confidence']:.0%}. "
                            f"Top sensor signal: {list(result['per_parameter_risk_band'].keys())[0]}."
                        ),
                        "recommended_action": "Perform CMT test & contact veterinarian immediately.",
                        "status":            "unread",
                        "created_at":        datetime.now(timezone.utc).isoformat()
                    }
                    SUPABASE_DATASTORE["alerts"].append(alert)
                    result["alert_raised"] = alert

                self._set_headers(200)
                self.wfile.write(json.dumps(result, indent=2).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    "error": "Inference failed",
                    "detail": str(e)
                }).encode('utf-8'))

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Unknown POST endpoint"}).encode('utf-8'))

def run_server():
    server = HTTPServer(('0.0.0.0', PORT), IngestionRequestHandler)
    print(f"==========================================================================")
    print(f"[PASHUPARTH BACKEND API v3 ONLINE] Listening at http://localhost:{PORT}")
    print(f"")
    print(f"  ML Inference Endpoints:")
    print(f"  POST /api/v1/predict            — Real XGBoost mastitis risk scoring")
    print(f"  GET  /api/v1/model-info         — Model card (accuracy, F1, AUC, features)")
    print(f"")
    print(f"  Data Ingestion Endpoints:")
    print(f"  POST /api/v1/manual-entry       — Category B manual health entries")
    print(f"  POST /api/v1/treatment-record   — AMR treatment + withdrawal logs")
    print(f"  POST /api/v1/milking-event      — 4-teat sensor session data")
    print(f"  POST /api/v1/register-farm      — Onboard farm (owner, counts, district)")
    print(f"  POST /api/v1/register-vet       — Onboard veterinarian")
    print(f"  POST /api/v1/register-animal    — Register animal & approve RFID tag")
    print(f"  GET  /api/v1/health             — Live stats + ML engine status")
    print(f"  GET  /api/v1/records            — Full in-memory datastore dump")
    print(f"==========================================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[BACKEND SERVER STOPPED]")
        server.server_close()

if __name__ == '__main__':
    run_server()
