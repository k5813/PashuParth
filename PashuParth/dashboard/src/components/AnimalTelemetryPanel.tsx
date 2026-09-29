import React, { useState } from 'react';
import { TeatGauges, QuarterTeats } from './TeatGauges';
import { SHAPExplainabilityCard, SHAPFactor } from './SHAPExplainabilityCard';
import { RiskBadge, RiskBand } from './RiskBadge';
import { Activity, PhoneCall, Zap, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface Animal {
  animal_id: string;
  rfid_tag: string;
  name: string;
  species: 'Cattle' | 'Buffalo';
  breed: string;
  lactation_number: number;
  days_in_milk: number;
  farm_name: string;
  farmer_name?: string;
  farmer_phone?: string;
  current_risk_score: number;
  current_risk_band: RiskBand;
  forecast_lead_days: number;
  last_tested_at: string;
  body_temp: number;
  rumination_minutes: number;
  teats: QuarterTeats;
  shap_factors: SHAPFactor[];
  historical_risk: { day: string; score: number; band: RiskBand }[];
}

interface Props {
  animals: Animal[];
}

export const AnimalTelemetryPanel: React.FC<Props> = ({ animals }) => {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal>(animals[0]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, marginTop: 12 }}>
      {/* Animal Selection List */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>
          Monitored Herd Animals
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {animals.map((a) => {
            const isSelected = selectedAnimal.animal_id === a.animal_id;
            return (
              <div
                key={a.animal_id}
                onClick={() => setSelectedAnimal(a)}
                style={{
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface-subtle)',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                    {a.name}
                  </span>
                  <RiskBadge band={a.current_risk_band} score={a.current_risk_score} size="sm" />
                </div>
                {a.farmer_name && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
                    👤 {a.farmer_name}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {a.species} • {a.breed} • DIM: {a.days_in_milk}d
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  RFID: {a.rfid_tag}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Animal Telemetry & SHAP View */}
      <div>
        {/* Header card */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{selectedAnimal.name}</h3>
                <RiskBadge band={selectedAnimal.current_risk_band} score={selectedAnimal.current_risk_score} size="md" />
              </div>
              {selectedAnimal.farmer_name && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                  👤 Owner: {selectedAnimal.farmer_name} {selectedAnimal.farmer_phone ? `(${selectedAnimal.farmer_phone})` : ''}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {selectedAnimal.species} ({selectedAnimal.breed}) • Lactation #{selectedAnimal.lactation_number} • DIM: {selectedAnimal.days_in_milk} days
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                RFID Tag: {selectedAnimal.rfid_tag} • Farm: {selectedAnimal.farm_name}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedAnimal.farmer_phone && (
                <a
                  href={`tel:${selectedAnimal.farmer_phone}`}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={14} />
                  Call Farmer
                </a>
              )}
              {selectedAnimal.current_risk_band === 'High Risk' && (
                <a
                  href="tel:18001801551"
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={14} />
                  Call Vet (डॉक्टर)
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 4-Teat Gauges */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <TeatGauges teats={selectedAnimal.teats} />
        </div>

        {/* 14-Day Forecasting Trend Chart */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} color="var(--primary)" />
            7–14 Day Pre-Clinical AI Risk Forecast Trend
          </h4>

          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedAnimal.historical_risk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedAnimal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={selectedAnimal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" style={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} style={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val}% Risk Score`, 'AI Rating']} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={selectedAnimal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskGradDash)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SHAP Factors */}
        <SHAPExplainabilityCard factors={selectedAnimal.shap_factors} leadDays={selectedAnimal.forecast_lead_days} />
      </div>
    </div>
  );
};
