import React, { useState } from 'react';
import { Animal, UserRole } from '../types';
import { ArrowLeft, CheckCircle2, Save, FileText } from 'lucide-react';
import { watermelonDB } from '../db/watermelondb';
import { synchronizeWithSupabase } from '../db/syncAdapter';

interface Props {
  animals: Animal[];
  onBack: () => void;
  role: UserRole;
  lang: 'EN' | 'HI';
}

export const ManualDataEntryScreen: React.FC<Props> = ({ animals, onBack, role, lang }) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.animal_id || '');
  const [entryCategory, setEntryCategory] = useState<'clinical' | 'treatment' | 'hygiene' | 'nutrition' | 'reproductive'>('clinical');

  // Form states
  const [symptomSwelling, setSymptomSwelling] = useState(false);
  const [symptomPain, setSymptomPain] = useState(false);
  const [milkFlakesClots, setMilkFlakesClots] = useState(false);
  const [teatDipUsed, setTeatDipUsed] = useState(true);
  const [beddingCleanliness, setBeddingCleanliness] = useState<'Clean' | 'Moderate' | 'Wet/Dirty'>('Clean');
  const [antibioticGiven, setAntibioticGiven] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to WatermelonDB offline local store
    if (entryCategory === 'treatment' && antibioticGiven.trim()) {
      watermelonDB.addTreatmentRecord({
        animal_id: selectedAnimalId,
        diagnosis: 'Clinical / Field Treatment',
        affected_quarter: 'Front-Left',
        drug_name: antibioticGiven.trim(),
        dosage: '1.0 mg/kg',
        withdrawal_days: 4
      });
    } else {
      watermelonDB.addManualEntry({
        farm_id: 'farm-pb-001',
        animal_id: selectedAnimalId,
        category: entryCategory,
        payload: {
          symptom_swelling: symptomSwelling,
          symptom_pain: symptomPain,
          milk_flakes_clots: milkFlakesClots,
          teat_dip_used: teatDipUsed,
          bedding_cleanliness: beddingCleanliness,
          notes: notes
        },
        photo_url: ''
      });
    }

    // Trigger sync if online and not simulated offline
    if (navigator.onLine && !watermelonDB.isSimulatedOffline()) {
      try {
        const syncRes = await synchronizeWithSupabase();
        console.log('[UI Manual Entry Sync Result]:', syncRes);
      } catch (err) {
        console.error('Sync failed:', err);
      }
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onBack();
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--primary)',
          backgroundColor: 'var(--surface-subtle)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <ArrowLeft size={16} />
        {lang === 'HI' ? 'वापस जाएं' : 'Back'}
      </button>

      <div className="glass-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginBottom: role === 'Admin' ? 4 : 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} />
          Category B Manual Health Data Record
        </h3>
        {role === 'Admin' && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Record manual field observations, veterinary treatments, or milking hygiene scores. Saved locally to WatermelonDB for background sync.
          </p>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#059669' }}>
            <CheckCircle2 size={48} style={{ marginBottom: 12 }} />
            <h4 style={{ fontSize: 18, fontWeight: 800 }}>Record Saved to Local Store!</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Will sync to server on next connection window.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Animal Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Select Animal (पशु चुनें):</label>
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  backgroundColor: 'var(--surface)'
                }}
              >
                {animals.map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.name} ({a.species} - {a.breed}) [RFID: {a.rfid_tag}]
                  </option>
                ))}
              </select>
            </div>

            {/* Entry Category tabs */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Category (श्रेणी):</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'clinical', label: 'Clinical Symptoms' },
                  { key: 'hygiene', label: 'Milking Hygiene' },
                  { key: 'treatment', label: 'Vet Treatment' },
                  { key: 'nutrition', label: 'Nutrition & Feed' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setEntryCategory(cat.key as any)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: entryCategory === cat.key ? 700 : 500,
                      backgroundColor: entryCategory === cat.key ? 'var(--primary)' : 'var(--surface-subtle)',
                      color: entryCategory === cat.key ? '#FFF' : 'var(--text-main)'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category specific fields */}
            {entryCategory === 'clinical' && (
              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={symptomSwelling}
                    onChange={(e) => setSymptomSwelling(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Udder Swelling / Warmth Observed (थण सूजन)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={symptomPain}
                    onChange={(e) => setSymptomPain(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Pain Response during Milking / Kick (दर्द की प्रतिक्रिया)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={milkFlakesClots}
                    onChange={(e) => setMilkFlakesClots(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Visible Flakes or Clots in Strip Cup Test (दूध में छीछड़े)
                </label>
              </div>
            )}

            {entryCategory === 'hygiene' && (
              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={teatDipUsed}
                    onChange={(e) => setTeatDipUsed(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Post-Milking Teat Dip Applied (0.5% Iodine)
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Barn Bedding Cleanliness:</label>
                  <select
                    value={beddingCleanliness}
                    onChange={(e) => setBeddingCleanliness(e.target.value as any)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                  >
                    <option value="Clean">Dry & Clean (Dry Straw)</option>
                    <option value="Moderate">Damp / Partially Clean</option>
                    <option value="Wet/Dirty">Wet / Muddy (High Contamination Risk)</option>
                  </select>
                </div>
              </div>
            )}

            {entryCategory === 'treatment' && (
              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Antibiotic / Treatment Name (AMR Log):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cefquinome Intramammary / Herbal Mastilept"
                    value={antibioticGiven}
                    onChange={(e) => setAntibioticGiven(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Field Notes & Remarks:</label>
              <textarea
                rows={3}
                placeholder="Enter any additional observations by field personnel..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: 13
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFF',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8
              }}
            >
              <Save size={18} />
              Save Record (सुरक्षित करें)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
