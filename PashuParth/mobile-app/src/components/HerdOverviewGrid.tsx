import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

export const HerdOverviewGrid: React.FC = () => {
  const speciesData = [
    { name: 'Gir / Sahiwal Cattle', value: 1850, color: '#2F6F4E' },
    { name: 'HF / Jersey Cross', value: 1420, color: '#4A90A4' },
    { name: 'Murrah Buffalo', value: 1250, color: '#F59E0B' },
    { name: 'Other Buffalo', value: 300, color: '#84CC16' }
  ];

  const regionalTrends = [
    { month: 'May', healthy: 4200, subclinical: 340, clinical: 80 },
    { month: 'Jun', healthy: 4100, subclinical: 420, clinical: 95 },
    { month: 'Jul', healthy: 3950, subclinical: 580, clinical: 110 },
    { month: 'Aug', healthy: 4120, subclinical: 460, clinical: 70 },
    { month: 'Sep', healthy: 4320, subclinical: 380, clinical: 45 }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
      {/* Species Distribution Chart */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={16} color="var(--primary)" />
          Cattle & Buffalo Breeds Monitored
        </h4>

        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={speciesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                {speciesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val} Head`, 'Monitored Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
          {speciesData.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{s.name}: <strong>{s.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Interventions Chart */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} color="var(--primary)" />
          Early AI Detection Impact Trend
        </h4>

        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="subclinical" name="AI Early Interventions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clinical" name="Clinical Mastitis Cases" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, textAlign: 'center', marginTop: 6 }}>
          ✓ 59% Clinical Outbreak Reduction
        </div>
      </div>
    </div>
  );
};
