import { FarmCluster, AMRRecord } from './types';

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
