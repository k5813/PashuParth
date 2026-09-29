import React from 'react';
import { SHAPFactor } from '../types';
import { Cpu, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface Props {
  factors: SHAPFactor[];
  leadDays: number;
}

export const SHAPExplainabilityCard: React.FC<Props> = ({ factors, leadDays }) => {
  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={16} color="var(--primary)" />
          AI Explainability (SHAP Risk Factors)
        </h4>
        <span style={{ fontSize: 11, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, padding: '3px 8px', borderRadius: 12 }}>
          Predicting {leadDays}-Day Horizon
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Top contributing sensor & telemetry signals driving XGBoost + LSTM prediction model:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {factors.map((f, i) => (
          <div key={i} style={{ borderBottom: i === factors.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {f.impact === 'positive' ? (
                  <ArrowUpRight size={14} color="#EF4444" />
                ) : (
                  <ArrowDownRight size={14} color="#10B981" />
                )}
                {f.factor}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: f.impact === 'positive' ? '#DC2626' : '#059669' }}>
                {f.weight}% weight
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, backgroundColor: 'var(--surface-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${f.weight}%`,
                  backgroundColor: f.impact === 'positive' ? 'var(--risk-high)' : 'var(--risk-none)',
                  borderRadius: 3
                }}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {f.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
