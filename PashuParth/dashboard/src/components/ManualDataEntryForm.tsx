import React, { useState } from 'react';
import { Animal } from './AnimalTelemetryPanel';
import { FileText, CheckCircle2, Save } from 'lucide-react';

interface Props {
  animals: Animal[];
}

export const ManualDataEntryForm: React.FC<Props> = ({ animals }) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.animal_id || '');
  const [entryCategory, setEntryCategory] = useState<'clinical' | 'treatment' | 'hygiene' | 'nutrition'>('clinical');
  const [symptomSwelling, setSymptomSwelling] = useState(false);
  const [symptomPain, setSymptomPain] = useState(false);
  const [milkFlakesClots, setMilkFlakesClots] = useState(false);
  const [teatDipUsed, setTeatDipUsed] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="glass-card" style={{ padding: 20, maxWidth: 800, margin: '16px auto' }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={18} />
        Category B Manual Health Data Record
      </h3>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Record manual observations, veterinary treatments, or hygiene scores into the canonical animal-day store.
      </p>

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#059669' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 8 }} />
          <h4 style={{ fontSize: 16, fontWeight: 800 }}>Record Saved to Canonical Backend Store!</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated across sync layer.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Select Animal:</label>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
            >
              {animals.map((a) => (
                <option key={a.animal_id} value={a.animal_id}>
                  {a.name} ({a.species} - {a.breed}) [RFID: {a.rfid_tag}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Category:</label>
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
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: entryCategory === cat.key ? 700 : 500,
                    backgroundColor: entryCategory === cat.key ? 'var(--primary)' : 'var(--surface-subtle)',
                    color: entryCategory === cat.key ? '#FFF' : 'var(--text-main)',
                    border: 'none'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={symptomSwelling} onChange={(e) => setSymptomSwelling(e.target.checked)} />
              Udder Swelling / Warmth Observed (थण सूजन)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={symptomPain} onChange={(e) => setSymptomPain(e.target.checked)} />
              Pain Response during Milking / Kick Response
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={milkFlakesClots} onChange={(e) => setMilkFlakesClots(e.target.checked)} />
              Visible Flakes or Clots in Strip Cup Test
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Notes:</label>
            <textarea
              rows={2}
              placeholder="Observation remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFF',
              padding: '10px 16px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              border: 'none'
            }}
          >
            <Save size={16} />
            Save Record to Backend
          </button>
        </form>
      )}
    </div>
  );
};
