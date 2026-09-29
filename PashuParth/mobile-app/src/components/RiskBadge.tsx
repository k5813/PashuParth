import React from 'react';
import { RiskBand } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';

interface Props {
  band: RiskBand;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<Props> = ({ band, score, size = 'md' }) => {
  const getColors = () => {
    switch (band) {
      case 'No Risk':
        return {
          bg: 'var(--risk-none-bg)',
          color: 'var(--risk-none)',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: ShieldCheck
        };
      case 'Low Risk':
        return {
          bg: 'var(--risk-low-bg)',
          color: 'var(--risk-low)',
          border: 'rgba(132, 204, 22, 0.3)',
          icon: ShieldCheck
        };
      case 'Moderate Risk':
        return {
          bg: 'var(--risk-moderate-bg)',
          color: 'var(--risk-moderate)',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: AlertTriangle
        };
      case 'High Risk':
        return {
          bg: 'var(--risk-high-bg)',
          color: 'var(--risk-high)',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: AlertCircle
        };
    }
  };

  const style = getColors();
  const IconComponent = style.icon;

  const sizeStyles = {
    sm: { padding: '3px 8px', fontSize: '11px', iconSize: 13 },
    md: { padding: '5px 12px', fontSize: '13px', iconSize: 15 },
    lg: { padding: '8px 16px', fontSize: '15px', iconSize: 18 }
  }[size];

  return (
    <span
      className="badge-pill"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize
      }}
    >
      <IconComponent size={sizeStyles.iconSize} />
      <span>{band}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.85, fontWeight: 700, marginLeft: 2 }}>
          ({score}%)
        </span>
      )}
    </span>
  );
};
