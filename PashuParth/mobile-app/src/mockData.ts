import { Animal, AlertItem } from './types';

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

export const INITIAL_ANIMALS: Animal[] = [
  {
    animal_id: "pp-c001",
    rfid_tag: "982 000183940121",
    name: "Gauri (गौरी)",
    species: "Cattle",
    breed: "Gir (Indigenous)",
    lactation_number: 3,
    days_in_milk: 78,
    farm_id: "f-01",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 84,
    current_risk_band: "High Risk",
    forecast_lead_days: 9,
    last_tested_at: "10 mins ago",
    body_temp: 39.4,
    rumination_minutes: 380,
    activity_index: 42,
    teats: {
      front_left: { ec: 7.8, ph: 6.9, temp: 39.6, clot_detected: true },
      front_right: { ec: 5.4, ph: 6.6, temp: 38.5, clot_detected: false },
      back_left: { ec: 5.5, ph: 6.5, temp: 38.6, clot_detected: false },
      back_right: { ec: 5.2, ph: 6.6, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Front-Left Teat EC", impact: "positive", description: "Elevated EC (7.8 mS/cm vs 5.2 baseline)", weight: 42 },
      { factor: "Rumination Drop", impact: "positive", description: "Rumination time decreased by 75 mins/day", weight: 28 },
      { factor: "Udder Surface Temp", impact: "positive", description: "Localized temperature spike (+1.2°C)", weight: 18 },
      { factor: "Barn THI Index", impact: "positive", description: "Heat stress index (THI 79) accelerating risk", weight: 12 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 18, band: "No Risk" },
      { day: "Sep 12", score: 25, band: "No Risk" },
      { day: "Sep 14", score: 42, band: "Low Risk" },
      { day: "Sep 16", score: 62, band: "Moderate Risk" },
      { day: "Sep 18", score: 75, band: "High Risk" },
      { day: "Sep 20", score: 84, band: "High Risk" }
    ]
  },
  {
    animal_id: "pp-c005",
    rfid_tag: "982 000183940125",
    name: "Radha (राधा)",
    species: "Cattle",
    breed: "Kankrej",
    lactation_number: 2,
    days_in_milk: 65,
    farm_id: "f-02",
    farm_name: "Krishna Milk Dairy, Kheda",
    farmer_name: "Mahesh Bhai (महेश भाई)",
    farmer_phone: "+91 98980 12345",
    current_risk_score: 91,
    current_risk_band: "High Risk",
    forecast_lead_days: 7,
    last_tested_at: "5 mins ago",
    body_temp: 39.8,
    rumination_minutes: 310,
    activity_index: 35,
    teats: {
      front_left: { ec: 8.2, ph: 7.1, temp: 40.1, clot_detected: true },
      front_right: { ec: 7.9, ph: 7.0, temp: 39.8, clot_detected: true },
      back_left: { ec: 5.6, ph: 6.6, temp: 38.6, clot_detected: false },
      back_right: { ec: 5.4, ph: 6.5, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Dual Teat EC Spike", impact: "positive", description: "Front quarters EC above 7.9 mS/cm", weight: 50 },
      { factor: "High Fever Spike", impact: "positive", description: "Udder temp 40.1°C indicating acute inflammation", weight: 30 }
    ],
    historical_risk: [
      { day: "Sep 14", score: 30, band: "Low Risk" },
      { day: "Sep 16", score: 55, band: "Moderate Risk" },
      { day: "Sep 18", score: 78, band: "High Risk" },
      { day: "Sep 20", score: 91, band: "High Risk" }
    ]
  },
  {
    animal_id: "pp-c006",
    rfid_tag: "982 000183940126",
    name: "Nandi (नंदी)",
    species: "Cattle",
    breed: "HF Crossbred",
    lactation_number: 3,
    days_in_milk: 90,
    farm_id: "f-02",
    farm_name: "Krishna Milk Dairy, Kheda",
    farmer_name: "Mahesh Bhai (महेश भाई)",
    farmer_phone: "+91 98980 12345",
    current_risk_score: 88,
    current_risk_band: "High Risk",
    forecast_lead_days: 8,
    last_tested_at: "15 mins ago",
    body_temp: 39.6,
    rumination_minutes: 340,
    activity_index: 40,
    teats: {
      front_left: { ec: 5.4, ph: 6.5, temp: 38.5, clot_detected: false },
      front_right: { ec: 5.3, ph: 6.5, temp: 38.4, clot_detected: false },
      back_left: { ec: 8.0, ph: 7.0, temp: 39.9, clot_detected: true },
      back_right: { ec: 5.5, ph: 6.6, temp: 38.5, clot_detected: false }
    },
    shap_factors: [
      { factor: "Back-Left Teat EC", impact: "positive", description: "Severe quarter conductivity rise (8.0 mS/cm)", weight: 58 }
    ],
    historical_risk: [
      { day: "Sep 14", score: 20, band: "No Risk" },
      { day: "Sep 16", score: 48, band: "Low Risk" },
      { day: "Sep 18", score: 70, band: "High Risk" },
      { day: "Sep 20", score: 88, band: "High Risk" }
    ]
  },
  {
    animal_id: "pp-b002",
    rfid_tag: "982 000183940122",
    name: "Murrah Rani (मुर्रा रानी)",
    species: "Buffalo",
    breed: "Murrah",
    lactation_number: 2,
    days_in_milk: 110,
    farm_id: "f-01",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 58,
    current_risk_band: "Moderate Risk",
    forecast_lead_days: 12,
    last_tested_at: "1 hour ago",
    body_temp: 38.8,
    rumination_minutes: 440,
    activity_index: 58,
    teats: {
      front_left: { ec: 5.6, ph: 6.6, temp: 38.6, clot_detected: false },
      front_right: { ec: 6.4, ph: 6.8, temp: 39.1, clot_detected: false },
      back_left: { ec: 5.5, ph: 6.5, temp: 38.5, clot_detected: false },
      back_right: { ec: 5.4, ph: 6.6, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Front-Right Teat EC", impact: "positive", description: "Moderate EC rise (6.4 mS/cm)", weight: 48 },
      { factor: "Milking Hygiene Score", impact: "positive", description: "Teat dip compliance missed in morning shift", weight: 32 },
      { factor: "Breed Offset Shift", impact: "negative", description: "Murrah baseline EC calibration applied", weight: 20 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 15, band: "No Risk" },
      { day: "Sep 12", score: 20, band: "No Risk" },
      { day: "Sep 14", score: 32, band: "Low Risk" },
      { day: "Sep 16", score: 45, band: "Low Risk" },
      { day: "Sep 18", score: 52, band: "Moderate Risk" },
      { day: "Sep 20", score: 58, band: "Moderate Risk" }
    ]
  },
  {
    animal_id: "pp-c003",
    rfid_tag: "982 000183940123",
    name: "Kamadhenu (कामधेनु)",
    species: "Cattle",
    breed: "Sahiwal (Indigenous)",
    lactation_number: 4,
    days_in_milk: 45,
    farm_id: "f-01",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 34,
    current_risk_band: "Low Risk",
    forecast_lead_days: 14,
    last_tested_at: "3 hours ago",
    body_temp: 38.5,
    rumination_minutes: 490,
    activity_index: 70,
    teats: {
      front_left: { ec: 5.3, ph: 6.5, temp: 38.4, clot_detected: false },
      front_right: { ec: 5.4, ph: 6.6, temp: 38.5, clot_detected: false },
      back_left: { ec: 5.8, ph: 6.7, temp: 38.7, clot_detected: false },
      back_right: { ec: 5.2, ph: 6.5, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Back-Left Teat EC", impact: "positive", description: "Slight EC elevation (5.8 mS/cm)", weight: 55 },
      { factor: "Activity Index", impact: "negative", description: "Normal grazing & movement behavior", weight: 45 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 12, band: "No Risk" },
      { day: "Sep 12", score: 14, band: "No Risk" },
      { day: "Sep 14", score: 18, band: "No Risk" },
      { day: "Sep 16", score: 26, band: "Low Risk" },
      { day: "Sep 18", score: 30, band: "Low Risk" },
      { day: "Sep 20", score: 34, band: "Low Risk" }
    ]
  },
  {
    animal_id: "pp-c004",
    rfid_tag: "982 000183940124",
    name: "Lakshmi (लक्ष्मी)",
    species: "Cattle",
    breed: "HF Crossbred",
    lactation_number: 1,
    days_in_milk: 160,
    farm_id: "f-01",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 12,
    current_risk_band: "No Risk",
    forecast_lead_days: 14,
    last_tested_at: "30 mins ago",
    body_temp: 38.4,
    rumination_minutes: 530,
    activity_index: 82,
    teats: {
      front_left: { ec: 5.1, ph: 6.5, temp: 38.3, clot_detected: false },
      front_right: { ec: 5.0, ph: 6.5, temp: 38.3, clot_detected: false },
      back_left: { ec: 5.2, ph: 6.5, temp: 38.4, clot_detected: false },
      back_right: { ec: 5.1, ph: 6.5, temp: 38.3, clot_detected: false }
    },
    shap_factors: [
      { factor: "Teat Symmetry", impact: "negative", description: "Balanced conductivity across all 4 quarters", weight: 60 },
      { factor: "High Rumination", impact: "negative", description: "Optimal digestive health (530 mins/day)", weight: 40 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 10, band: "No Risk" },
      { day: "Sep 12", score: 11, band: "No Risk" },
      { day: "Sep 14", score: 12, band: "No Risk" },
      { day: "Sep 16", score: 10, band: "No Risk" },
      { day: "Sep 18", score: 11, band: "No Risk" },
      { day: "Sep 20", score: 12, band: "No Risk" }
    ]
  },
  {
    animal_id: "pp-c007",
    rfid_tag: "982 000183940127",
    name: "Ganga (गंगा)",
    species: "Cattle",
    breed: "Gir (Indigenous)",
    lactation_number: 2,
    days_in_milk: 120,
    farm_id: "f-03",
    farm_name: "Anand Milk Dairy #14, Anand",
    farmer_name: "Suresh Patel (सुरेश पटेल)",
    farmer_phone: "+91 98123 45678",
    current_risk_score: 28,
    current_risk_band: "Low Risk",
    forecast_lead_days: 14,
    last_tested_at: "2 hours ago",
    body_temp: 38.6,
    rumination_minutes: 510,
    activity_index: 75,
    teats: {
      front_left: { ec: 5.2, ph: 6.5, temp: 38.4, clot_detected: false },
      front_right: { ec: 5.5, ph: 6.6, temp: 38.5, clot_detected: false },
      back_left: { ec: 5.3, ph: 6.5, temp: 38.4, clot_detected: false },
      back_right: { ec: 5.2, ph: 6.5, temp: 38.3, clot_detected: false }
    },
    shap_factors: [
      { factor: "Stable Feed Intake", impact: "negative", description: "No digestive disturbance", weight: 80 }
    ],
    historical_risk: [
      { day: "Sep 14", score: 20, band: "No Risk" },
      { day: "Sep 20", score: 28, band: "Low Risk" }
    ]
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    alert_id: "alt-903",
    animal_id: "pp-c005",
    animal_name: "Radha (राधा)",
    rfid_tag: "982 000183940125",
    farm_name: "Krishna Milk Dairy, Kheda",
    farmer_name: "Mahesh Bhai (महेश भाई)",
    farmer_phone: "+91 98980 12345",
    risk_band: "High Risk",
    message: "CRITICAL ALERT: Acute Subclinical Mastitis risk predicted within 7 days. Front quarters EC elevated to 8.2 mS/cm.",
    recommended_action: "Immediate CMT test & physical quarter palpation. Isolate animal from milking machine cluster. Contact Dr. Sharma immediately.",
    created_at: "5 mins ago",
    status: "unread",
    vet_notified: true
  },
  {
    alert_id: "alt-904",
    animal_id: "pp-c006",
    animal_name: "Nandi (नंदी)",
    rfid_tag: "982 000183940126",
    farm_name: "Krishna Milk Dairy, Kheda",
    farmer_name: "Mahesh Bhai (महेश भाई)",
    farmer_phone: "+91 98980 12345",
    risk_band: "High Risk",
    message: "High Mastitis Risk: Back-Left quarter conductivity spiked to 8.0 mS/cm with localized udder temperature rise (39.9°C).",
    recommended_action: "Administer pre-milking teat dip, check vacuum pressure line, and perform California Mastitis Test.",
    created_at: "15 mins ago",
    status: "unread",
    vet_notified: true
  },
  {
    alert_id: "alt-901",
    animal_id: "pp-c001",
    animal_name: "Gauri (गौरी)",
    rfid_tag: "982 000183940121",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    risk_band: "High Risk",
    message: "Predictive AI warning: Subclinical Mastitis risk predicted for Front-Left teat within 7-9 days. EC elevated to 7.8 mS/cm.",
    recommended_action: "Perform California Mastitis Test (CMT) verification & isolate teat during vacuum milking. Contact Dr. Sharma.",
    created_at: "10 mins ago",
    status: "unread",
    vet_notified: true
  },
  {
    alert_id: "alt-902",
    animal_id: "pp-b002",
    animal_name: "Murrah Rani (मुर्रा रानी)",
    rfid_tag: "982 000183940122",
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    risk_band: "Moderate Risk",
    message: "Subclinical risk rising (Score 58). Front-Right quarter EC trending upward over past 48 hours.",
    recommended_action: "Apply post-milking teat dip (0.5% Iodine) & review bedding moisture levels in Barn #2.",
    created_at: "1 hour ago",
    status: "unread",
    vet_notified: false
  }
];

export const FARM_CLUSTERS: FarmCluster[] = [
  {
    farm_id: 'f-001',
    farm_name: 'Surya Cooperative Farm #1',
    district: 'Anand',
    lat: 22.5645,
    lng: 72.9289,
    total_animals: 42,
    cattle_count: 26,
    buffalo_count: 16,
    high_risk_count: 3,
    mod_risk_count: 5,
    avg_ec_ms: 6.8,
    last_sync: '10 mins ago',
    status: 'Outbreak Risk'
  },
  {
    farm_id: 'f-002',
    farm_name: 'Amul Producer Member Unit #12',
    district: 'Kheda',
    lat: 22.7533,
    lng: 72.8596,
    total_animals: 68,
    cattle_count: 40,
    buffalo_count: 28,
    high_risk_count: 1,
    mod_risk_count: 4,
    avg_ec_ms: 5.6,
    last_sync: '25 mins ago',
    status: 'Alert'
  },
  {
    farm_id: 'f-003',
    farm_name: 'Dudhsagar Cooperative Cluster #4',
    district: 'Mehsana',
    lat: 23.6000,
    lng: 72.4000,
    total_animals: 110,
    cattle_count: 65,
    buffalo_count: 45,
    high_risk_count: 0,
    mod_risk_count: 2,
    avg_ec_ms: 5.2,
    last_sync: '5 mins ago',
    status: 'Normal'
  },
  {
    farm_id: 'f-004',
    farm_name: 'Banas Dairy Producer Hub #8',
    district: 'Banaskantha',
    lat: 24.1724,
    lng: 72.4346,
    total_animals: 85,
    cattle_count: 50,
    buffalo_count: 35,
    high_risk_count: 2,
    mod_risk_count: 6,
    avg_ec_ms: 6.2,
    last_sync: '12 mins ago',
    status: 'Alert'
  }
];

export const AMR_RECORDS: AMRRecord[] = [
  {
    log_id: 'amr-501',
    animal_id: 'pp-c001',
    animal_name: 'Gauri (गौरी)',
    rfid_tag: '982 000183940121',
    farm_name: 'Surya Cooperative Farm #1',
    drug_name: 'Cefquinome Intramammary Infusion',
    dosage: '75 mg / teat (3 days)',
    vet_name: 'Dr. R. K. Sharma (Registration #GJ-4921)',
    administered_date: '2026-09-18',
    withdrawal_days: 4,
    withdrawal_ends_date: '2026-09-22',
    status: 'Active Withdrawal'
  },
  {
    log_id: 'amr-502',
    animal_id: 'pp-b002',
    animal_name: 'Murrah Rani (मुर्रा रानी)',
    rfid_tag: '982 000183940122',
    farm_name: 'Surya Cooperative Farm #1',
    drug_name: 'Herbal Mastilept Spray & Iodine Dip',
    dosage: 'Topical Application (5 days)',
    vet_name: 'Dr. R. K. Sharma (Registration #GJ-4921)',
    administered_date: '2026-09-15',
    withdrawal_days: 0,
    withdrawal_ends_date: '2026-09-15',
    status: 'Cleared for Milking'
  }
];
