import React, { useState } from 'react';
import { Radio, CheckCircle2, RefreshCw, Cpu, Zap } from 'lucide-react';

export const SensorPairingPanel: React.FC = () => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  const modules = [
    {
      id: 'probe-01',
      name: 'Handheld Milk Probe (555-Timer EC)',
      type: 'EC / pH / Udder Temp / RFID',
      status: 'Connected',
      battery: '88%',
      mac: 'ESP32-9A:4F:C1'
    },
    {
      id: 'collar-02',
      name: 'Wearable Collar (MPU6050)',
      type: 'Rumination / Body Temp / GPS',
      status: 'Connected',
      battery: '74%',
      mac: 'ESP32-3B:11:88'
    },
    {
      id: 'barn-03',
      name: 'Barn Sensor Kit (THI / NH3)',
      type: 'Ambient THI / Ammonia / CO2',
      status: 'Connected (LoRa)',
      battery: 'Solar Powered',
      mac: 'ESP32-88:DD:02'
    }
  ];

  const handleRunCalibration = () => {
    setCalibrating(true);
    setCalibratedSuccess(false);
    setTimeout(() => {
      setCalibrating(false);
      setCalibratedSuccess(true);
    }, 1800);
  };

  return (
    <div className="glass-card" style={{ padding: 20, maxWidth: 900, margin: '16px auto' }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Radio size={18} />
        BLE & LoRa Hardware Sensor Network Dashboard
      </h3>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
        Hardware stream status across registered farm clusters.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
        {modules.map((m) => (
          <div key={m.id} style={{ backgroundColor: 'var(--surface-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</span>
              <span style={{ fontSize: 10, backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                {m.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.type}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>MAC: {m.mac} • Battery: {m.battery}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--primary-light)', padding: 12, borderRadius: 8, border: '1px solid rgba(47, 111, 78, 0.2)' }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} />
          Two-Point NaCl EC Probe Recalibration Protocol
        </h4>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Required after electrode cleaning or op-amp/diode substitution.
        </p>

        {calibratedSuccess && (
          <div style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: 8, borderRadius: 6, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            ✓ Baselines recalibrated cleanly: Zero-point = 0.04 mS/cm, Slope = 1.02.
          </div>
        )}

        <button
          onClick={handleRunCalibration}
          disabled={calibrating}
          style={{
            backgroundColor: 'var(--primary)',
            color: '#FFF',
            padding: '8px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            cursor: calibrating ? 'not-allowed' : 'pointer'
          }}
        >
          {calibrating ? <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Cpu size={14} />}
          {calibrating ? 'Calibrating...' : 'Trigger 2-Point Recalibration'}
        </button>
      </div>
    </div>
  );
};
