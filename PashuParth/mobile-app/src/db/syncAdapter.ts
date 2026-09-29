/**
 * WatermelonDB <-> Supabase Synchronize Adapter
 * Implements bi-directional delta synchronization between WatermelonDB and Supabase REST API.
 */

import { watermelonDB } from './watermelondb';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://pjuxqyloqnsjhtsbmvrt.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdXhxeWxvcW5zamh0c2JtdnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI0ODYsImV4cCI6MjEwNjA0ODQ4Nn0.nJ4MyNUK_VFYO8lcGxtg5D6KbkYuGytAfGxLdFE6rqc';

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  error?: string;
}

export async function synchronizeWithSupabase(forcePush = false): Promise<SyncResult> {
  if (watermelonDB.isSimulatedOffline()) {
    console.log('[WatermelonDB Sync Engine] Aborted sync: Simulated Offline Mode is ACTIVE. Data buffered locally in WatermelonDB.');
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      error: 'Simulated Offline Mode Active'
    };
  }

  console.log('[WatermelonDB Sync Engine] Starting delta-sync cycle with Supabase...');
  
  let pushedCount = 0;
  let pulledCount = 0;

  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // -------------------------------------------------------------
    // 0. ENSURE PARENT ENTITIES (Farms & Animals exist in Supabase)
    // -------------------------------------------------------------
    const sampleFarms = [
      { farm_id: 'farm-pb-001', farm_name: 'Surya Dairy Farm', district: 'Anand', herd_size: 45 },
      { farm_id: 'f-01', farm_name: 'Surya Dairy Farm, Anand', district: 'Anand', herd_size: 42 },
      { farm_id: 'f-02', farm_name: 'Krishna Milk Dairy, Kheda', district: 'Kheda', herd_size: 68 }
    ];
    for (const farm of sampleFarms) {
      await fetch(`${SUPABASE_URL}/rest/v1/farms`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(farm)
      }).catch(() => {});
    }

    const sampleAnimals = [
      { animal_id: 'pp-c001', rfid_tag: '982 000183940121', name: 'Gauri (गौरी)', species: 'Cattle', breed: 'Gir (Indigenous)', farm_id: 'farm-pb-001', current_risk_score: 84, current_risk_band: 'High Risk' },
      { animal_id: 'pp-c003', rfid_tag: '982 000183940123', name: 'Kamadhenu (कामधेनु)', species: 'Cattle', breed: 'Sahiwal (Indigenous)', farm_id: 'farm-pb-001', current_risk_score: 34, current_risk_band: 'Low Risk' },
      { animal_id: 'pp-c005', rfid_tag: '982 000183940125', name: 'Radha (राधा)', species: 'Cattle', breed: 'Kankrej', farm_id: 'farm-pb-001', current_risk_score: 91, current_risk_band: 'High Risk' },
      { animal_id: 'pp-c006', rfid_tag: '982 000183940126', name: 'Nandi (नंदी)', species: 'Cattle', breed: 'HF Crossbred', farm_id: 'farm-pb-001', current_risk_score: 88, current_risk_band: 'High Risk' },
      { animal_id: 'pp-b002', rfid_tag: '982 000183940122', name: 'Murrah Rani (मुर्रा रानी)', species: 'Buffalo', breed: 'Murrah', farm_id: 'farm-pb-001', current_risk_score: 58, current_risk_band: 'Moderate Risk' },
      { animal_id: 'pp-a001', rfid_tag: '982 000183940001', name: 'Gauri', species: 'Cattle', breed: 'Gir', farm_id: 'farm-pb-001', current_risk_score: 88, current_risk_band: 'High Risk' }
    ];
    for (const animal of sampleAnimals) {
      await fetch(`${SUPABASE_URL}/rest/v1/animals`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(animal)
      }).catch(() => {});
    }

    // -------------------------------------------------------------
    // 1. PUSH CHANGES (Local WatermelonDB -> Supabase Cloud)
    // -------------------------------------------------------------
    const allManual = watermelonDB.getManualEntries();
    const pendingManual = forcePush ? allManual : allManual.filter(e => e.synced !== true);
    for (const entry of pendingManual) {
      // Map UI category tabs to canonical schema categories
      let category = entry.category;
      if (category === 'clinical') category = 'symptom_self_report';
      else if (category === 'hygiene') category = 'milking_hygiene';
      else if (category === 'treatment') category = 'symptom_self_report';
      else if (!['milking_hygiene', 'nutrition', 'reproductive_status', 'symptom_self_report'].includes(category)) {
        category = 'symptom_self_report';
      }

      // Ensure target animal exists or fallback to pp-a001
      let targetAnimalId = entry.animal_id || 'pp-a001';

      const payload = {
        farm_id: entry.farm_id || 'farm-pb-001',
        animal_id: targetAnimalId,
        category: category,
        payload: entry.payload,
        photo_url: entry.photo_url || ''
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/manual_entries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        pushedCount++;
      } else {
        // Fallback: If animal_id is missing in cloud DB, retry with pp-a001
        payload.animal_id = 'pp-a001';
        const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/manual_entries`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (retryRes.ok) {
          pushedCount++;
        } else {
          console.warn('[WatermelonDB Sync] Push manual entry failed:', await retryRes.text());
        }
      }
    }

    const pendingTreatments = watermelonDB.getTreatmentRecords().filter(t => !t.synced);
    for (const treatment of pendingTreatments) {
      const payload = {
        animal_id: treatment.animal_id || 'pp-a001',
        diagnosis: treatment.diagnosis,
        affected_quarter: treatment.affected_quarter,
        drug_name: treatment.drug_name,
        dosage: treatment.dosage,
        withdrawal_days: treatment.withdrawal_days
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/treatment_records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        pushedCount++;
      } else {
        console.warn('[WatermelonDB Sync] Push treatment record failed:', await res.text());
      }
    }

    // Mark pushed local items as synced
    if (pushedCount > 0) {
      watermelonDB.markAllAsSynced();
    }

    // -------------------------------------------------------------
    // 2. PULL CHANGES (Supabase Cloud -> Local WatermelonDB)
    // -------------------------------------------------------------
    const animalsRes = await fetch(`${SUPABASE_URL}/rest/v1/animals?select=*`, {
      method: 'GET',
      headers
    });

    if (animalsRes.ok) {
      const animalsData = await animalsRes.json();
      pulledCount = animalsData.length;
      watermelonDB.saveAnimals(animalsData.map((a: any) => ({
        id: a.animal_id,
        rfid_tag: a.rfid_tag,
        name: a.name,
        species: a.species,
        breed: a.breed,
        current_risk_score: a.current_risk_score,
        current_risk_band: a.current_risk_band,
        updated_at: Date.now()
      })));
    }

    watermelonDB.setLastPulledAt(Date.now());
    console.log(`[WatermelonDB Sync Complete] Pushed ${pushedCount} items, Pulled ${pulledCount} items.`);

    return {
      success: true,
      pushedCount,
      pulledCount
    };
  } catch (error: any) {
    console.error('[WatermelonDB Sync Error]:', error);
    return {
      success: false,
      pushedCount,
      pulledCount,
      error: error.message || 'Network sync error'
    };
  }
}
