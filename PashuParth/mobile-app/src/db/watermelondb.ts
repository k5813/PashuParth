/**
 * WatermelonDB Offline Datastore Engine
 * Manages local IndexedDB storage, offline mutations, and queue status.
 */

import { LocalAnimal, LocalManualEntry, LocalTreatmentRecord, LocalAlert } from './schema';

const STORAGE_KEYS = {
  ANIMALS: 'pashuparth_wdb_animals',
  MANUAL_ENTRIES: 'pashuparth_wdb_manual_entries',
  TREATMENTS: 'pashuparth_wdb_treatments',
  ALERTS: 'pashuparth_wdb_alerts',
  LAST_PULLED_AT: 'pashuparth_wdb_last_pulled_at'
};

class WatermelonLocalDatabase {
  private simulatedOffline: boolean = false;

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public setSimulatedOffline(status: boolean): void {
    this.simulatedOffline = status;
    console.log(`[WatermelonDB] Simulated Offline Mode set to: ${status}`);
    window.dispatchEvent(new CustomEvent('watermelon-db-change'));
  }

  private getStorage<T>(key: string, defaultValue: T[] = []): T[] {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[WatermelonDB] Failed to read ${key}:`, e);
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[WatermelonDB] Failed to write ${key}:`, e);
    }
  }

  // --- Animals ---
  public getAnimals(): LocalAnimal[] {
    return this.getStorage<LocalAnimal>(STORAGE_KEYS.ANIMALS, [
      {
        id: 'pp-a001',
        rfid_tag: '982 000183940121',
        name: 'Gauri',
        species: 'Cattle',
        breed: 'Gir',
        current_risk_score: 88,
        current_risk_band: 'High Risk',
        updated_at: Date.now()
      }
    ]);
  }

  public saveAnimals(animals: LocalAnimal[]): void {
    this.setStorage(STORAGE_KEYS.ANIMALS, animals);
  }

  // --- Manual Entries ---
  public getManualEntries(): LocalManualEntry[] {
    return this.getStorage<LocalManualEntry>(STORAGE_KEYS.MANUAL_ENTRIES, []);
  }

  public addManualEntry(entry: Omit<LocalManualEntry, 'id' | 'synced' | 'created_at'>): LocalManualEntry {
    const entries = this.getManualEntries();
    const newEntry: LocalManualEntry = {
      ...entry,
      id: `local-me-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      synced: false,
      created_at: Date.now()
    };
    entries.unshift(newEntry);
    this.setStorage(STORAGE_KEYS.MANUAL_ENTRIES, entries);
    window.dispatchEvent(new CustomEvent('watermelon-db-change'));
    return newEntry;
  }

  // --- Treatment Records ---
  public getTreatmentRecords(): LocalTreatmentRecord[] {
    return this.getStorage<LocalTreatmentRecord>(STORAGE_KEYS.TREATMENTS, []);
  }

  public addTreatmentRecord(record: Omit<LocalTreatmentRecord, 'id' | 'synced' | 'created_at'>): LocalTreatmentRecord {
    const records = this.getTreatmentRecords();
    const newRecord: LocalTreatmentRecord = {
      ...record,
      id: `local-tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      synced: false,
      created_at: Date.now()
    };
    records.unshift(newRecord);
    this.setStorage(STORAGE_KEYS.TREATMENTS, records);
    window.dispatchEvent(new CustomEvent('watermelon-db-change'));
    return newRecord;
  }

  // --- Queue Metrics ---
  public getPendingUnsyncedCount(): number {
    const unsyncedManual = this.getManualEntries().filter(e => !e.synced).length;
    const unsyncedTreatments = this.getTreatmentRecords().filter(t => !t.synced).length;
    return unsyncedManual + unsyncedTreatments;
  }

  public markAllAsSynced(): void {
    const entries = this.getManualEntries().map(e => ({ ...e, synced: true }));
    this.setStorage(STORAGE_KEYS.MANUAL_ENTRIES, entries);

    const treatments = this.getTreatmentRecords().map(t => ({ ...t, synced: true }));
    this.setStorage(STORAGE_KEYS.TREATMENTS, treatments);
    window.dispatchEvent(new CustomEvent('watermelon-db-change'));
  }

  public getLastPulledAt(): number {
    const val = localStorage.getItem(STORAGE_KEYS.LAST_PULLED_AT);
    return val ? parseInt(val, 10) : 0;
  }

  public setLastPulledAt(timestamp: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_PULLED_AT, timestamp.toString());
  }
}

export const watermelonDB = new WatermelonLocalDatabase();
