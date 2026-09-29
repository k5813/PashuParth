import React, { useState } from 'react';
import { LoginScreen, UserAccount } from './components/LoginScreen';
import { GISHotspotMap } from './components/GISHotspotMap';
import { HerdOverviewGrid } from './components/HerdOverviewGrid';
import { AMRLogTable } from './components/AMRLogTable';
import { AnimalTelemetryPanel, Animal } from './components/AnimalTelemetryPanel';
import { ManualDataEntryForm } from './components/ManualDataEntryForm';
import { SensorPairingPanel } from './components/SensorPairingPanel';
import { UserRegistrationDirectory } from './components/UserRegistrationDirectory';
import { FARM_CLUSTERS, AMR_RECORDS } from './mockData';
import { LayoutDashboard, MapPin, FileCheck, Activity, PlusCircle, Radio, UserPlus, LogOut, UserCheck, Lock } from 'lucide-react';

const DASHBOARD_ANIMALS: Animal[] = [
  {
    animal_id: "pp-c001",
    rfid_tag: "982 000183940121",
    name: "Gauri (गौरी)",
    species: "Cattle",
    breed: "Gir (Indigenous)",
    lactation_number: 3,
    days_in_milk: 78,
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 84,
    current_risk_band: "High Risk",
    forecast_lead_days: 9,
    last_tested_at: "10 mins ago",
    body_temp: 39.4,
    rumination_minutes: 380,
    teats: {
      front_left: { ec: 7.8, ph: 6.9, temp: 39.6, clot_detected: true },
      front_right: { ec: 5.4, ph: 6.6, temp: 38.5, clot_detected: false },
      back_left: { ec: 5.5, ph: 6.5, temp: 38.6, clot_detected: false },
      back_right: { ec: 5.2, ph: 6.6, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Front-Left Teat EC", impact: "positive", description: "Elevated EC (7.8 mS/cm vs 5.2 baseline)", weight: 42 },
      { factor: "Rumination Drop", impact: "positive", description: "Rumination time decreased by 75 mins/day", weight: 28 },
      { factor: "Udder Surface Temp", impact: "positive", description: "Localized temperature spike (+1.2°C)", weight: 18 },
      { factor: "Barn THI Index", impact: "positive", description: "Heat stress index (THI 79) accelerating risk", weight: 12 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 18, band: "No Risk" },
      { day: "Sep 12", score: 25, band: "No Risk" },
      { day: "Sep 14", score: 42, band: "Low Risk" },
      { day: "Sep 16", score: 62, band: "Moderate Risk" },
      { day: "Sep 18", score: 75, band: "High Risk" },
      { day: "Sep 20", score: 84, band: "High Risk" }
    ]
  },
  {
    animal_id: "pp-c005",
    rfid_tag: "982 000183940125",
    name: "Radha (राधा)",
    species: "Cattle",
    breed: "Kankrej",
    lactation_number: 2,
    days_in_milk: 65,
    farm_name: "Krishna Milk Dairy, Kheda",
    farmer_name: "Mahesh Bhai (महेश भाई)",
    farmer_phone: "+91 98980 12345",
    current_risk_score: 91,
    current_risk_band: "High Risk",
    forecast_lead_days: 7,
    last_tested_at: "5 mins ago",
    body_temp: 39.8,
    rumination_minutes: 310,
    teats: {
      front_left: { ec: 8.2, ph: 7.1, temp: 40.1, clot_detected: true },
      front_right: { ec: 7.9, ph: 7.0, temp: 39.8, clot_detected: true },
      back_left: { ec: 5.6, ph: 6.6, temp: 38.6, clot_detected: false },
      back_right: { ec: 5.4, ph: 6.5, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Dual Teat EC Spike", impact: "positive", description: "Front quarters EC above 7.9 mS/cm", weight: 50 },
      { factor: "High Fever Spike", impact: "positive", description: "Udder temp 40.1°C indicating acute inflammation", weight: 30 }
    ],
    historical_risk: [
      { day: "Sep 14", score: 30, band: "Low Risk" },
      { day: "Sep 16", score: 55, band: "Moderate Risk" },
      { day: "Sep 18", score: 78, band: "High Risk" },
      { day: "Sep 20", score: 91, band: "High Risk" }
    ]
  },
  {
    animal_id: "pp-b002",
    rfid_tag: "982 000183940122",
    name: "Murrah Rani (मुर्रा रानी)",
    species: "Buffalo",
    breed: "Murrah",
    lactation_number: 2,
    days_in_milk: 110,
    farm_name: "Surya Dairy Farm, Anand",
    farmer_name: "Ramesh Patel (रमेश पटेल)",
    farmer_phone: "+91 98765 43210",
    current_risk_score: 58,
    current_risk_band: "Moderate Risk",
    forecast_lead_days: 12,
    last_tested_at: "1 hour ago",
    body_temp: 38.8,
    rumination_minutes: 440,
    teats: {
      front_left: { ec: 5.6, ph: 6.6, temp: 38.6, clot_detected: false },
      front_right: { ec: 6.4, ph: 6.8, temp: 39.1, clot_detected: false },
      back_left: { ec: 5.5, ph: 6.5, temp: 38.5, clot_detected: false },
      back_right: { ec: 5.4, ph: 6.6, temp: 38.4, clot_detected: false }
    },
    shap_factors: [
      { factor: "Front-Right Teat EC", impact: "positive", description: "Moderate EC rise (6.4 mS/cm)", weight: 48 },
      { factor: "Milking Hygiene Score", impact: "positive", description: "Teat dip compliance missed in morning shift", weight: 32 },
      { factor: "Breed Offset Shift", impact: "negative", description: "Murrah baseline EC calibration applied", weight: 20 }
    ],
    historical_risk: [
      { day: "Sep 10", score: 15, band: "No Risk" },
      { day: "Sep 12", score: 20, band: "No Risk" },
      { day: "Sep 14", score: 32, band: "Low Risk" },
      { day: "Sep 16", score: 45, band: "Low Risk" },
      { day: "Sep 18", score: 52, band: "Moderate Risk" },
      { day: "Sep 20", score: 58, band: "Moderate Risk" }
    ]
  }
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'gis' | 'herd' | 'telemetry' | 'amr' | 'onboarding' | 'manual' | 'sensors'>('gis');

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'Admin') setActiveTab('gis');
    else if (user.role === 'Field Personnel') setActiveTab('onboarding');
    else setActiveTab('telemetry');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const currentRole = currentUser?.role || 'Admin';

  const getNavTabs = () => {
    switch (currentRole) {
      case 'Farmer':
        return [
          { key: 'telemetry', label: 'My Herd Telemetry', icon: Activity }
        ];
      case 'Vet':
        return [
          { key: 'telemetry', label: 'Animal Telemetry', icon: Activity },
          { key: 'amr', label: 'AMR Logs', icon: FileCheck },
          { key: 'manual', label: 'Manual Entry', icon: PlusCircle }
        ];
      case 'Field Personnel':
        return [
          { key: 'onboarding', label: 'User Directory', icon: UserPlus },
          { key: 'manual', label: 'Manual Entry', icon: PlusCircle }
        ];
      case 'Admin':
        return [
          { key: 'gis', label: 'GIS Hotspots', icon: MapPin },
          { key: 'herd', label: 'Herd Analytics', icon: LayoutDashboard },
          { key: 'telemetry', label: 'Animal Telemetry', icon: Activity },
          { key: 'amr', label: 'AMR Logs', icon: FileCheck },
          { key: 'onboarding', label: 'User Directory', icon: UserPlus },
          { key: 'manual', label: 'Manual Entry', icon: PlusCircle },
          { key: 'sensors', label: 'BLE Sensors', icon: Radio }
        ];
    }
  };

  const navTabs = getNavTabs();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '12px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#FFF',
                boxShadow: '0 4px 12px rgba(47, 111, 78, 0.25)'
              }}
            >
              🐄
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                PashuParth Command Center
              </h1>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                Dairy Cooperative & State Animal Health Early Detection Network
              </p>
            </div>
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--primary-light)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(47, 111, 78, 0.2)'
                }}
              >
                <UserCheck size={14} color="var(--primary)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                  {currentUser.name} ({currentUser.role})
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              🔒 Authentication Required
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      {!currentUser ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Sub Nav Bar */}
          <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {navTabs.map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        fontWeight: active ? 700 : 600,
                        backgroundColor: active ? 'var(--primary)' : 'var(--surface-subtle)',
                        color: active ? '#FFF' : 'var(--text-muted)',
                        border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <IconComp size={14} color={active ? '#FFF' : 'var(--text-muted)'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'var(--surface-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                <Lock size={12} color="var(--primary)" />
                <span>Active Portal: <strong>{currentUser.role} View</strong></span>
              </div>
            </div>
          </div>

          <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
            {activeTab === 'gis' && <GISHotspotMap clusters={FARM_CLUSTERS} />}
            {activeTab === 'herd' && <HerdOverviewGrid />}
            {activeTab === 'telemetry' && <AnimalTelemetryPanel animals={DASHBOARD_ANIMALS} />}
            {activeTab === 'amr' && <AMRLogTable records={AMR_RECORDS} />}
            {activeTab === 'onboarding' && <UserRegistrationDirectory />}
            {activeTab === 'manual' && <ManualDataEntryForm animals={DASHBOARD_ANIMALS} />}
            {activeTab === 'sensors' && <SensorPairingPanel />}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
