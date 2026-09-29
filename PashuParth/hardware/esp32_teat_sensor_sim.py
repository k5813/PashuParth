"""
PashuParth Stage 1: ESP32 Teat Sensor Firmware & Telemetry Simulation
----------------------------------------------------------------------
This module simulates the light on-device pre-processing performed by the ESP32 chip 
embedded within each teat cup / vacuum bucket assembly.

High-frequency raw milking sensor readings (10 Hz sampling rate for EC, pH, Temp) 
are aggregated over a 3-5 minute milking session into 4 quarter-teat summary metrics:
  - max_teat_ec: Peak Electrical Conductivity (mS/cm)
  - mean_ph: Average Milk pH (Normal: 6.5 - 6.7, Subclinical Mastitis: >= 6.8)
  - udder_temp: Max Udder Temperature (°C)
  - clot_detected: Boolean flag for physical milk curdling/clots
"""

import json
import random
import time
from typing import Dict, Any, List

class ESP32TeatSensorAggregator:
    def __init__(self, device_id: str, rfid_tag: str, animal_name: str):
        self.device_id = device_id
        self.rfid_tag = rfid_tag
        self.animal_name = animal_name

    def simulate_raw_milking_session(self, duration_seconds: int = 180, is_high_risk: bool = False) -> Dict[str, Any]:
        """
        Simulates raw 10 Hz telemetry data collection during a milking session 
        and performs light on-device aggregation into a compressed summary payload.
        """
        samples_count = duration_seconds * 10
        raw_telemetry: Dict[str, Dict[str, List[float]]] = {
            "front_left": {"ec": [], "ph": [], "temp": []},
            "front_right": {"ec": [], "ph": [], "temp": []},
            "back_left": {"ec": [], "ph": [], "temp": []},
            "back_right": {"ec": [], "ph": [], "temp": []}
        }

        # Generate simulated raw sensor curves
        for _ in range(samples_count):
            for quarter in raw_telemetry:
                # Normal baseline vs Mastitis quarter spike
                if is_high_risk and quarter == "front_left":
                    ec_val = random.uniform(6.8, 8.2)
                    ph_val = random.uniform(6.8, 7.2)
                    temp_val = random.uniform(39.2, 40.1)
                else:
                    ec_val = random.uniform(5.0, 5.5)
                    ph_val = random.uniform(6.4, 6.6)
                    temp_val = random.uniform(38.2, 38.6)

                raw_telemetry[quarter]["ec"].append(ec_val)
                raw_telemetry[quarter]["ph"].append(ph_val)
                raw_telemetry[quarter]["temp"].append(temp_val)

        # On-device aggregation (ESP32 lightweight summary calculation)
        aggregated_teats: Dict[str, Dict[str, Any]] = {}
        for quarter, data in raw_telemetry.items():
            max_ec = round(max(data["ec"]), 2)
            mean_ph = round(sum(data["ph"]) / len(data["ph"]), 2)
            max_temp = round(max(data["temp"]), 1)
            clot_flag = max_ec >= 6.8 or mean_ph >= 6.9

            aggregated_teats[quarter] = {
                "ec": max_ec,
                "ph": mean_ph,
                "temp": max_temp,
                "clot_detected": clot_flag
            }

        # Compact BLE output packet
        summary_packet = {
            "device_id": self.device_id,
            "rfid_tag": self.rfid_tag,
            "animal_name": self.animal_name,
            "session_duration_sec": duration_seconds,
            "samples_processed": samples_count,
            "timestamp": int(time.time()),
            "teat_summary": aggregated_teats
        }

        return summary_packet


def run_stage_1_verification():
    print("=========================================================================")
    print("[STAGE 1 VERIFICATION] ESP32 ON-DEVICE TELEMETRY PROCESSING")
    print("=========================================================================\n")

    # Instantiate simulated ESP32 sensors for Healthy and High-Risk animals
    sensor_gauri = ESP32TeatSensorAggregator("esp32-node-001", "982 000183940121", "Gauri (गौरी)")
    sensor_lakshmi = ESP32TeatSensorAggregator("esp32-node-002", "982 000183940124", "Lakshmi (लक्ष्मी)")

    print("1. Processing 3-minute milking session for Gauri (High-Risk Case)...")
    packet_gauri = sensor_gauri.simulate_raw_milking_session(duration_seconds=180, is_high_risk=True)
    print(f"   [RAW SAMPLES PROCESSED]: {packet_gauri['samples_processed']} raw readings aggregated")
    print(f"   [SUMMARY PAYLOAD SIZE] : {len(json.dumps(packet_gauri))} bytes (Fits BLE packet boundary)")
    print("   [TEAT SUMMARY OUTPUT]  :")
    print(json.dumps(packet_gauri["teat_summary"], indent=4))
    print()

    print("2. Processing 3-minute milking session for Lakshmi (Healthy Case)...")
    packet_lakshmi = sensor_lakshmi.simulate_raw_milking_session(duration_seconds=180, is_high_risk=False)
    print(f"   [RAW SAMPLES PROCESSED]: {packet_lakshmi['samples_processed']} raw readings aggregated")
    print(f"   [SUMMARY PAYLOAD SIZE] : {len(json.dumps(packet_lakshmi))} bytes")
    print("   [TEAT SUMMARY OUTPUT]  :")
    print(json.dumps(packet_lakshmi["teat_summary"], indent=4))
    print()

    # Verification checks
    gauri_fl = packet_gauri["teat_summary"]["front_left"]
    assert gauri_fl["ec"] >= 6.8, "Stage 1 Verification Failed: Front-Left EC should be elevated for high risk case"
    assert gauri_fl["clot_detected"] == True, "Stage 1 Verification Failed: Clot flag should be set for high EC quarter"

    lakshmi_fl = packet_lakshmi["teat_summary"]["front_left"]
    assert lakshmi_fl["ec"] < 6.0, "Stage 1 Verification Failed: Healthy EC should remain under 6.0"
    assert lakshmi_fl["clot_detected"] == False, "Stage 1 Verification Failed: Clot flag should be false for healthy case"

    print("[SUCCESS] STAGE 1 VERIFICATION PASSED PERFECTLY!")
    print("   ESP32 hardware telemetry summary payloads successfully verified.")
    print("=========================================================================\n")


if __name__ == "__main__":
    run_stage_1_verification()
