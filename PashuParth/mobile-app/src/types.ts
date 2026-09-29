export type RiskBand = 'No Risk' | 'Low Risk' | 'Moderate Risk' | 'High Risk';
export type Species = 'Cattle' | 'Buffalo';
export type UserRole = 'Farmer' | 'Vet' | 'Field Personnel' | 'Admin';

export interface TeatTelemetry {
  ec: number;        // mS/cm (Electrical Conductivity)
  ph: number;        // pH level
  temp: number;      // Udder temperature °C
  clot_detected: boolean;
}

export interface QuarterTeats {
  front_left: TeatTelemetry;
  front_right: TeatTelemetry;
  back_left: TeatTelemetry;
  back_right: TeatTelemetry;
}

export interface SHAPFactor {
  factor: string;
  impact: 'positive' | 'negative';
  description: string;
  weight: number; // percentage contribution
}

export interface Animal {
  animal_id: string;
  rfid_tag: string;
  name: string;
  species: Species;
  breed: string;
  lactation_number: number;
  days_in_milk: number;
  farm_id: string;
  farm_name: string;
  farmer_name?: string;
  farmer_phone?: string;
  current_risk_score: number; // 0 - 100
  current_risk_band: RiskBand;
  forecast_lead_days: number; // 7 to 14 days
  last_tested_at: string;
  teats: QuarterTeats;
  body_temp: number; // °C
  rumination_minutes: number; // per day
  activity_index: number;
  shap_factors: SHAPFactor[];
  historical_risk: { day: string; score: number; band: RiskBand }[];
}

export interface AlertItem {
  alert_id: string;
  animal_id: string;
  animal_name: string;
  rfid_tag: string;
  farm_name?: string;
  farmer_name?: string;
  farmer_phone?: string;
  risk_band: RiskBand;
  message: string;
  recommended_action: string;
  created_at: string;
  status: 'unread' | 'read' | 'actioned';
  vet_notified: boolean;
}

export interface ManualEntryRecord {
  record_id: string;
  animal_id: string;
  entry_type: 'clinical' | 'treatment' | 'hygiene' | 'nutrition' | 'reproductive' | 'symptom_report';
  payload: Record<string, any>;
  entered_by: string;
  role: UserRole;
  recorded_at: string;
  synced: boolean;
}
