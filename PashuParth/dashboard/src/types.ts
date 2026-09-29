export interface FarmCluster {
  farm_id: string;
  farm_name: string;
  district: string;
  lat: number;
  lng: number;
  total_animals: number;
  cattle_count: number;
  buffalo_count: number;
  high_risk_count: number;
  mod_risk_count: number;
  avg_ec_ms: number;
  last_sync: string;
  status: 'Normal' | 'Alert' | 'Outbreak Risk';
}

export interface AMRRecord {
  log_id: string;
  animal_id: string;
  animal_name: string;
  rfid_tag: string;
  farm_name: string;
  drug_name: string;
  dosage: string;
  vet_name: string;
  administered_date: string;
  withdrawal_days: number;
  withdrawal_ends_date: string;
  status: 'Active Withdrawal' | 'Cleared for Milking';
}
