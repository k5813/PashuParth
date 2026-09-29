import React, { useState } from 'react';
import { FarmCluster } from '../mockData';
import { MapPin, Info, Radio } from 'lucide-react';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 12 }}>
      {/* Interactive GIS Spatial Map Area */}
      <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={18} />
              GIS Epidemiological Risk Hotspots
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Real-time spatial clustering of subclinical mastitis risk (Gujarat Dairy Region)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['All', 'Outbreak Risk', 'Alert', 'Normal'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
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

        {/* GIS Canvas */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            minHeight: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'absolute', top: 10, left: 10, color: '#94A3B8', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Radio size={12} color="#10B981" />
            LORA / NB-IOT LIVE STREAM
          </div>

          <div style={{ position: 'absolute', top: '15%', left: '15%', color: '#64748B', fontSize: 11, fontWeight: 800 }}>BANASKANTHA</div>
          <div style={{ position: 'absolute', top: '35%', left: '45%', color: '#64748B', fontSize: 11, fontWeight: 800 }}>MEHSANA</div>
          <div style={{ position: 'absolute', top: '60%', left: '55%', color: '#64748B', fontSize: 11, fontWeight: 800 }}>KHEDA</div>
          <div style={{ position: 'absolute', top: '75%', left: '70%', color: '#64748B', fontSize: 11, fontWeight: 800 }}>ANAND</div>

          {filteredClusters.map((cluster, idx) => {
            const isSelected = selectedCluster?.farm_id === cluster.farm_id;
            const positions = [
              { top: '72%', left: '68%' },
              { top: '58%', left: '52%' },
              { top: '38%', left: '42%' },
              { top: '18%', left: '22%' }
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
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    opacity: isSelected ? 0.35 : 0.2,
                    animation: 'pulse 2s infinite'
                  }}
                />
                <div
                  style={{
                    backgroundColor: nodeColor,
                    color: '#FFF',
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800,
                    boxShadow: isSelected ? '0 0 0 3px rgba(255,255,255,0.8)' : '0 2px 6px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <MapPin size={12} />
                  <span>{cluster.district}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cluster Details */}
      <div className="glass-card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={16} color="var(--primary)" />
          Cluster Inspection
        </h4>

        {selectedCluster ? (
          <div>
            <div style={{ backgroundColor: 'var(--surface-subtle)', padding: 10, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{selectedCluster.farm_name}</div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>District: {selectedCluster.district}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Last Sync: {selectedCluster.last_sync}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ fontWeight: 800, color: selectedCluster.status === 'Outbreak Risk' ? '#DC2626' : '#D97706' }}>
                  {selectedCluster.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Head:</span>
                <span style={{ fontWeight: 700 }}>{selectedCluster.total_animals} (Cattle {selectedCluster.cattle_count} / Buffalo {selectedCluster.buffalo_count})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>High-Risk Count:</span>
                <span style={{ fontWeight: 800, color: '#DC2626' }}>{selectedCluster.high_risk_count} Head</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mean Teat EC:</span>
                <span style={{ fontWeight: 700 }}>{selectedCluster.avg_ec_ms} mS/cm</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Select a map pin to inspect.</div>
        )}
      </div>
    </div>
  );
};
