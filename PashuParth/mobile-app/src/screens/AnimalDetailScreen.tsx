import React from 'react';
import { Animal } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { TeatGauges } from '../components/TeatGauges';
import { SHAPExplainabilityCard } from '../components/SHAPExplainabilityCard';
import { ArrowLeft, Activity, Calendar, Zap, PhoneCall, PlusCircle, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  animal: Animal;
  onBack: () => void;
  onOpenManualEntry: () => void;
  lang: 'EN' | 'HI';
}

export const AnimalDetailScreen: React.FC<Props> = ({ animal, onBack, onOpenManualEntry, lang }) => {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      {/* Back button */}
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
        {lang === 'HI' ? 'वापस सूची पर जाएं' : 'Back to Herd Summary'}
      </button>

      {/* Main Animal Header Card */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{animal.name}</h2>
              <RiskBadge band={animal.current_risk_band} score={animal.current_risk_score} size="lg" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Species: <strong>{animal.species}</strong> • Breed: <strong>{animal.breed}</strong> • Lactation: #{animal.lactation_number}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
              RFID Tag: {animal.rfid_tag} • Farm: {animal.farm_name}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onOpenManualEntry}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFF',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <PlusCircle size={15} />
              Log Manual Health Record
            </button>
            {animal.current_risk_band === 'High Risk' && (
              <a
                href="tel:18001801551"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFF',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none'
                }}
              >
                <PhoneCall size={15} />
                Call Vet
              </a>
            )}
          </div>
        </div>

        {/* Quick Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Days In Milk (DIM)</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{animal.days_in_milk} days</div>
          </div>
          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Body Temp</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{animal.body_temp}°C</div>
          </div>
          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rumination Time</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{animal.rumination_minutes} mins/day</div>
          </div>
          <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI Lead Horizon</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{animal.forecast_lead_days} Days</div>
          </div>
        </div>
      </div>

      {/* 4-Teat Quarter Sensors */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <TeatGauges teats={animal.teats} />
      </div>

      {/* Risk Forecasting Trend Chart */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={16} color="var(--primary)" />
          7–14 Day Pre-Clinical Risk Progression Trend
        </h4>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={animal.historical_risk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={animal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={animal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" style={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                formatter={(val: any) => [`${val}% Risk Score`, 'AI Risk Rating']}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={animal.current_risk_score > 60 ? '#EF4444' : '#2F6F4E'}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#riskGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SHAP Factors */}
      <SHAPExplainabilityCard factors={animal.shap_factors} leadDays={animal.forecast_lead_days} />
    </div>
  );
};
