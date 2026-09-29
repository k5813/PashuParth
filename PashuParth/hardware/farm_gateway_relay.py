"""
PashuParth Stage 2: Farm Gateway Relay & Resilient Offline Queue
----------------------------------------------------------------
This module simulates the central Farm Gateway ESP32 unit installed in each barn.
It receives Stage 1 BLE summary packets from all teat hardware on the farm and 
relays them to Supabase Cloud over WiFi / Cellular.

Offline Resiliency:
If the farm's internet connection drops, the Gateway buffers packets locally in a 
queue file and automatically flushes them once connectivity is restored.
"""

import json
import os
import time
from typing import List, Dict, Any

class FarmGatewayRelay:
    def __init__(self, farm_id: str, farm_name: str, buffer_file_path: str = "hardware/gateway_offline_queue.json"):
        self.farm_id = farm_id
        self.farm_name = farm_name
        self.buffer_file_path = buffer_file_path
        self.is_online = True
        self.cloud_storage: List[Dict[str, Any]] = []

    def receive_ble_packet(self, telemetry_packet: Dict[str, Any]):
        """Receives BLE summary packet from a Stage 1 teat sensor node."""
        envelope = {
            "farm_id": self.farm_id,
            "farm_name": self.farm_name,
            "relayed_at": int(time.time()),
            "payload": telemetry_packet
        }

        if self.is_online:
            self._upload_to_cloud(envelope)
        else:
            self._buffer_locally(envelope)

    def _upload_to_cloud(self, envelope: Dict[str, Any]):
        """Direct upload to cloud REST endpoint."""
        self.cloud_storage.append(envelope)
        print(f"   [GATEWAY CLOUD UPLOAD] Relayed packet for '{envelope['payload']['animal_name']}' to Supabase Cloud.")

    def _buffer_locally(self, envelope: Dict[str, Any]):
        """Saves telemetry envelope to local offline storage when internet is down."""
        queue = self.load_offline_queue()
        queue.append(envelope)
        with open(self.buffer_file_path, 'w', encoding='utf-8') as f:
            json.dump(queue, f, indent=4)
        print(f"   [GATEWAY OFFLINE BUFFER] Internet Down! Saved packet for '{envelope['payload']['animal_name']}' to local queue file.")

    def load_offline_queue(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.buffer_file_path):
            try:
                with open(self.buffer_file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def restore_connectivity_and_flush(self) -> int:
        """Simulates network restoration and flushes all locally buffered offline packets."""
        self.is_online = True
        queue = self.load_offline_queue()
        flushed_count = len(queue)

        if flushed_count > 0:
            print(f"\n   [NETWORK RESTORED] Reconnected to Internet! Flushing {flushed_count} buffered offline packet(s)...")
            for envelope in queue:
                self._upload_to_cloud(envelope)

            # Clear queue file after successful flush
            if os.path.exists(self.buffer_file_path):
                os.remove(self.buffer_file_path)

        return flushed_count


def run_stage_2_verification():
    print("=========================================================================")
    print("[STAGE 2 VERIFICATION] FARM GATEWAY RELAY & OFFLINE RESILIENCY")
    print("=========================================================================\n")

    gateway = FarmGatewayRelay("f-01", "Surya Dairy Farm, Anand")
    
    # Ensure fresh queue test
    if os.path.exists(gateway.buffer_file_path):
        os.remove(gateway.buffer_file_path)

    # 1. Normal Online Relay Test
    print("1. Testing Normal Online Mode (WiFi Available)...")
    sample_packet_1 = {
        "device_id": "esp32-node-001",
        "rfid_tag": "982 000183940121",
        "animal_name": "Gauri",
        "teat_summary": {"front_left": {"ec": 7.8, "ph": 6.9, "temp": 39.6, "clot_detected": True}}
    }
    gateway.receive_ble_packet(sample_packet_1)
    assert len(gateway.cloud_storage) == 1, "Stage 2 Failed: Online packet should be uploaded immediately"
    print("   [PASSED]: Online packet successfully uploaded to cloud.\n")

    # 2. Simulate Internet Outage
    print("2. Simulating Internet Network Outage (Farm WiFi Down)...")
    gateway.is_online = False
    sample_packet_2 = {
        "device_id": "esp32-node-002",
        "rfid_tag": "982 000183940125",
        "animal_name": "Radha",
        "teat_summary": {"front_left": {"ec": 8.2, "ph": 7.1, "temp": 40.1, "clot_detected": True}}
    }
    sample_packet_3 = {
        "device_id": "esp32-node-003",
        "rfid_tag": "982 000183940122",
        "animal_name": "Murrah Rani",
        "teat_summary": {"front_right": {"ec": 6.4, "ph": 6.8, "temp": 39.1, "clot_detected": False}}
    }

    gateway.receive_ble_packet(sample_packet_2)
    gateway.receive_ble_packet(sample_packet_3)

    offline_queue = gateway.load_offline_queue()
    assert len(offline_queue) == 2, "Stage 2 Failed: 2 packets should be queued locally during outage"
    print("   [PASSED]: 2 packets successfully buffered in offline queue file.\n")

    # 3. Simulate Network Recovery & Automatic Flush
    print("3. Restoring Farm Internet Connection & Flushing Queue...")
    flushed = gateway.restore_connectivity_and_flush()
    assert flushed == 2, f"Stage 2 Failed: Expected 2 flushed packets, got {flushed}"
    assert len(gateway.cloud_storage) == 3, "Stage 2 Failed: Total cloud storage should contain 3 packets"
    assert not os.path.exists(gateway.buffer_file_path), "Stage 2 Failed: Offline queue file should be cleared after flush"

    print("\n[SUCCESS] STAGE 2 VERIFICATION PASSED PERFECTLY!")
    print("   Farm Gateway relay and resilient offline buffering fully verified.")
    print("=========================================================================\n")


if __name__ == "__main__":
    run_stage_2_verification()
