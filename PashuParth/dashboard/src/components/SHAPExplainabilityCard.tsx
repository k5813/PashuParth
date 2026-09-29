import React from 'react';
import { Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface SHAPFactor {
  factor: string;
  impact: 'positive' | 'negative';
  description: string;
  weight: number;
}

interface Props {
  factors: SHAPFactor[];
  leadDays: number;
}

export const SHAPExplainabilityCard: React.FC<Props> = ({ factors, leadDays }) => {
  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={16} color="var(--primary)" />
          AI Explainability (SHAP Risk Factors)
        </h4>
        <span style={{ fontSize: 11, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
          {leadDays}-Day Horizon
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {factors.map((f, i) => (
          <div key={i} style={{ borderBottom: i === factors.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {f.impact === 'positive' ? (
                  <ArrowUpRight size={13} color="#EF4444" />
                ) : (
                  <ArrowDownRight size={13} color="#10B981" />
                )}
                {f.factor}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.impact === 'positive' ? '#DC2626' : '#059669' }}>
                {f.weight}% weight
              </span>
            </div>

            <div style={{ height: 5, backgroundColor: 'var(--surface-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 2 }}>
              <div
                style={{
                  height: '100%',
                  width: `${f.weight}%`,
                  backgroundColor: f.impact === 'positive' ? 'var(--risk-high)' : 'var(--risk-none)',
                  borderRadius: 3
                }}
              />
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {f.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
