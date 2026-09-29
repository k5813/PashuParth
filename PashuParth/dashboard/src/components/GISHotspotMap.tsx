import React, { useState } from 'react';
import { FarmCluster } from '../types';
import { MapPin, AlertTriangle, ShieldCheck, Activity, Radio, Filter, Info } from 'lucide-react';

interface Props {
  clusters: FarmCluster[];
}

export const GISHotspotMap: React.FC<Props> = ({ clusters }) => {
  const [selectedCluster, setSelectedCluster] = useState<FarmCluster | null>(clusters[0]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Outbreak Risk' | 'Alert' | 'Normal'>('All');

  const filteredClusters = clusters.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
      {/* Interactive GIS Spatial Map Area */}
      <div className="glass-card" style={{ padding: 20, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={18} />
              GIS Epidemiological Risk Hotspot Surveillance Map
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Real-time spatial clustering of subclinical & clinical bovine mastitis risk (Gujarat Region)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['All', 'Outbreak Risk', 'Alert', 'Normal'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: statusFilter === st ? 700 : 500,
                  backgroundColor: statusFilter === st ? 'var(--primary)' : 'var(--surface-subtle)',
                  color: statusFilter === st ? '#FFF' : 'var(--text-muted)'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* GIS Canvas Visual Simulation */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            minHeight: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Map Overlay Watermark */}
          <div style={{ position: 'absolute', top: 12, left: 12, color: '#94A3B8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Radio size={14} color="#10B981" />
            LIVE SENSOR UPLINK ACTIVE • LORA / NB-IOT GIS STREAM
          </div>

          {/* District Labels */}
          <div style={{ position: 'absolute', top: '15%', left: '15%', color: '#64748B', fontSize: 12, fontWeight: 800 }}>BANASKANTHA</div>
          <div style={{ position: 'absolute', top: '35%', left: '45%', color: '#64748B', fontSize: 12, fontWeight: 800 }}>MEHSANA</div>
          <div style={{ position: 'absolute', top: '60%', left: '55%', color: '#64748B', fontSize: 12, fontWeight: 800 }}>KHEDA</div>
          <div style={{ position: 'absolute', top: '75%', left: '70%', color: '#64748B', fontSize: 12, fontWeight: 800 }}>ANAND (AMUL HUB)</div>

          {/* Interactive Farm Hotspot Nodes */}
          {filteredClusters.map((cluster, idx) => {
            const isSelected = selectedCluster?.farm_id === cluster.farm_id;
            const positions = [
              { top: '72%', left: '68%' }, // Anand
              { top: '58%', left: '52%' }, // Kheda
              { top: '38%', left: '42%' }, // Mehsana
              { top: '18%', left: '22%' }  // Banaskantha
            ];
            const pos = positions[idx % positions.length];

            const nodeColor =
              cluster.status === 'Outbreak Risk' ? '#EF4444' : cluster.status === 'Alert' ? '#F59E0B' : '#10B981';

            return (
              <div
                key={cluster.farm_id}
                onClick={() => setSelectedCluster(cluster)}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 10 : 2
                }}
              >
                {/* Pulse Aura */}
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: -12,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    opacity: isSelected ? 0.35 : 0.2,
                    animation: 'pulse 2s infinite'
                  }}
                />

                {/* Node pin */}
                <div
                  style={{
                    backgroundColor: nodeColor,
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: isSelected ? '0 0 0 4px rgba(255,255,255,0.8)' : '0 2px 8px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <MapPin size={14} />
                  <span>{cluster.district}</span>
                  {cluster.high_risk_count > 0 && (
                    <span style={{ backgroundColor: '#000', color: '#FFF', padding: '1px 5px', borderRadius: 8, fontSize: 10 }}>
                      {cluster.high_risk_count} High
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cluster Inspector Sidebar */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={16} color="var(--primary)" />
          Farm Cluster Details
        </h4>

        {selectedCluster ? (
          <div>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{selectedCluster.farm_name}</div>
              <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>District: {selectedCluster.district}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last Sensor Sync: {selectedCluster.last_sync}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Rating:</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: selectedCluster.status === 'Outbreak Risk' ? '#DC2626' : selectedCluster.status === 'Alert' ? '#D97706' : '#059669'
                  }}
                >
                  {selectedCluster.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Animals Monitored:</span>
                <span style={{ fontWeight: 700 }}>{selectedCluster.total_animals} (Cattle {selectedCluster.cattle_count} / Buffalo {selectedCluster.buffalo_count})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>High-Risk Animals:</span>
                <span style={{ fontWeight: 800, color: '#DC2626' }}>{selectedCluster.high_risk_count} Head</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Moderate-Risk Animals:</span>
                <span style={{ fontWeight: 700, color: '#D97706' }}>{selectedCluster.mod_risk_count} Head</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Mean Teat EC:</span>
                <span style={{ fontWeight: 700 }}>{selectedCluster.avg_ec_ms} mS/cm</span>
              </div>
            </div>

            <div style={{ marginTop: 16, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: 10, borderRadius: 8, fontSize: 12, color: '#1E40AF' }}>
              💡 <strong>Authority Recommendation:</strong> Dispatch Field Officer for California Mastitis Test (CMT) verification on Farm Cluster #{selectedCluster.farm_id}.
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>
            Select a hotspot pin on the map to inspect farm details.
          </div>
        )}
      </div>
    </div>
  );
};
