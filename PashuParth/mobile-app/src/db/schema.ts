/**
 * WatermelonDB Offline-First Schema Definition
 * Mirrors Supabase cloud tables locally for zero-latency offline operation.
 */

export interface LocalAnimal {
  id: string;
  rfid_tag: string;
  name: string;
  species: 'Cattle' | 'Buffalo';
  breed: string;
  current_risk_score: number;
  current_risk_band: string;
  updated_at: number;
}

export interface LocalManualEntry {
  id: string;
  farm_id: string;
  animal_id: string;
  category: string;
  payload: Record<string, any>;
  photo_url?: string;
  synced: boolean;
  created_at: number;
}

export interface LocalTreatmentRecord {
  id: string;
  animal_id: string;
  diagnosis: string;
  affected_quarter: string;
  drug_name: string;
  dosage: string;
  withdrawal_days: number;
  synced: boolean;
  created_at: number;
}

export interface LocalAlert {
  id: string;
  animal_id: string;
  title: string;
  severity: string;
  lead_time: string;
  shap_driver: string;
  status: 'unread' | 'read';
  created_at: number;
}

export const WATERMELON_SCHEMA_VERSION = 1;
