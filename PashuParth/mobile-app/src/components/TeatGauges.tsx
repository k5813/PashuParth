import React from 'react';
import { QuarterTeats } from '../types';
import { Activity, AlertTriangle, Zap, Thermometer } from 'lucide-react';

interface Props {
  teats: QuarterTeats;
}

export const TeatGauges: React.FC<Props> = ({ teats }) => {
  const quarterList = [
    { key: 'front_left', name: 'Front-Left (FL)', data: teats.front_left },
    { key: 'front_right', name: 'Front-Right (FR)', data: teats.front_right },
    { key: 'back_left', name: 'Back-Left (BL)', data: teats.back_left },
    { key: 'back_right', name: 'Back-Right (BR)', data: teats.back_right }
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={16} color="var(--primary)" />
          4-Quarter Teat Sensor Telemetry (EC & pH)
        </h4>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Probe Model: 555-Timer Astable SS304</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {quarterList.map((q) => {
          const isHighEC = q.data.ec >= 6.5;
          const isClot = q.data.clot_detected;

          return (
            <div
              key={q.key}
              style={{
                backgroundColor: isHighEC ? '#FEF2F2' : 'var(--surface-subtle)',
                border: `1.5px solid ${isHighEC ? '#FCA5A5' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: 12,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isHighEC ? '#B91C1C' : 'var(--text-main)' }}>
                  {q.name}
                </span>
                {isClot && (
                  <span style={{ fontSize: 10, backgroundColor: '#EF4444', color: '#FFF', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    CLOT DETECTED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
                <div style={{ backgroundColor: 'var(--surface)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>EC</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isHighEC ? '#DC2626' : 'var(--primary)' }}>
                    {q.data.ec}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>mS/cm</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>pH</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                    {q.data.ph}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>pH unit</div>
                </div>

                <div style={{ backgroundColor: 'var(--surface)', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Temp</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: q.data.temp > 39 ? '#D97706' : 'var(--text-main)' }}>
                    {q.data.temp}°C
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Udder</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
