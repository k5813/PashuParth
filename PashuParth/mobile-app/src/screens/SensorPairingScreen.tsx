import React, { useState } from 'react';
import { ArrowLeft, Radio, CheckCircle2, RefreshCw, Cpu, Zap, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
  lang: 'EN' | 'HI';
}

export const SensorPairingScreen: React.FC<Props> = ({ onBack, lang }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  const modules = [
    {
      id: 'probe-01',
      name: 'Handheld Milk Probe (हैंडहेल्ड प्रोब)',
      type: 'EC / pH / Udder Temp / RFID',
      status: 'Connected',
      battery: '88%',
      mac: 'ESP32-9A:4F:C1',
      details: '555-timer astable circuit with SS304 electrodes'
    },
    {
      id: 'collar-02',
      name: 'Wearable Collar (पशु कॉलर)',
      type: 'MPU6050 Rumination / Body Temp / GPS',
      status: 'Connected',
      battery: '74%',
      mac: 'ESP32-3B:11:88',
      details: 'Telemetry stream every 15 mins'
    },
    {
      id: 'barn-03',
      name: 'Barn Sensor Kit (गोशाला किट)',
      type: 'THI / NH3 / CO2 / Bedding Moisture',
      status: 'Connected (LoRa)',
      battery: 'Solar Powered',
      mac: 'ESP32-88:DD:02',
      details: 'Ambient THI index 78.4'
    },
    {
      id: 'claw-04',
      name: 'Vacuum Claw / Flow Extension',
      type: 'Per-Quarter EC & Optical Clot',
      status: 'Standby (BLE)',
      battery: '92%',
      mac: 'ESP32-C4:90:12',
      details: 'Portable vacuum-bucket milking extension'
    }
  ];

  const handleRunCalibration = () => {
    setCalibrating(true);
    setCalibratedSuccess(false);
    setTimeout(() => {
      setCalibrating(false);
      setCalibratedSuccess(true);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
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
        Back
      </button>

      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={20} />
          BLE & LoRa Hardware Sensor Network
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Active ESP32 sensor modules paired with PashuParth mobile ingestion app. Automatic offline buffering enabled.
        </p>
      </div>

      {/* Module list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {modules.map((m) => (
          <div key={m.id} className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</h4>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{m.type}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  padding: '3px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <CheckCircle2 size={12} />
                {m.status}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {m.details}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span>MAC: {m.mac}</span>
              <span>Power: <strong>{m.battery}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Calibration Protocol Card (2-Point NaCl Calibration) */}
      <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={16} />
          Two-Point NaCl EC Probe Recalibration Protocol
        </h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Required after electrode cleaning or op-amp/diode component substitution to correct for diode voltage drop & electrode geometry offsets.
        </p>

        {calibratedSuccess && (
          <div style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: 10, borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            ✓ Probe Recalibrated Successfully! Baseline offsets updated: Zero-point offset = 0.04 mS/cm, Slope multiplier = 1.02.
          </div>
        )}

        <button
          onClick={handleRunCalibration}
          disabled={calibrating}
          style={{
            backgroundColor: 'var(--primary)',
            color: '#FFF',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: calibrating ? 'not-allowed' : 'pointer'
          }}
        >
          {calibrating ? <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Cpu size={16} />}
          {calibrating ? 'Executing 2-Point NaCl Calibration...' : 'Run Probe 2-Point Recalibration'}
        </button>
      </div>
    </div>
  );
};
