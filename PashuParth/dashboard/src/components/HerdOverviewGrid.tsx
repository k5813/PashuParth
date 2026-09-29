import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';

export const HerdOverviewGrid: React.FC = () => {
  const speciesData = [
    { name: 'Indigenous Cattle (Gir/Sahiwal)', value: 1850, color: '#2F6F4E' },
    { name: 'Crossbred Cattle (HF/Jersey)', value: 1420, color: '#4A90A4' },
    { name: 'Murrah Buffalo', value: 1250, color: '#F59E0B' },
    { name: 'Other Buffalo Breeds', value: 300, color: '#84CC16' }
  ];

  const regionalTrends = [
    { month: 'May', healthy: 4200, subclinical: 340, clinical: 80 },
    { month: 'Jun', healthy: 4100, subclinical: 420, clinical: 95 },
    { month: 'Jul', healthy: 3950, subclinical: 580, clinical: 110 },
    { month: 'Aug', healthy: 4120, subclinical: 460, clinical: 70 },
    { month: 'Sep', healthy: 4320, subclinical: 380, clinical: 45 }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
      {/* Species Distribution Chart */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={16} color="var(--primary)" />
          Monitored Dairy Population (Cattle vs. Buffalo Calibration)
        </h4>

        <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={speciesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                {speciesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val} Head`, 'Monitored Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
          {speciesData.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{s.name}: <strong>{s.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Subclinical vs Clinical Early Detection Impact */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} color="var(--primary)" />
          7–14 Day Early Interventions vs Clinical Outbreaks
        </h4>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="subclinical" name="AI Early Interventions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clinical" name="Clinical Mastitis Cases" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textAlign: 'center', marginTop: 8 }}>
          ✓ AI Early Detection reduced clinical outbreaks by 59% across participating cooperatives.
        </div>
      </div>
    </div>
  );
};
