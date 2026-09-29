import React, { useState } from 'react';
import { Animal, AlertItem, RiskBand, Species, UserRole } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { AlertCircle, PhoneCall, Filter, Search, PlusCircle, ChevronRight, Activity, Thermometer, Radio, User, X, MapPin, Eye, CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface Props {
  animals: Animal[];
  alerts: AlertItem[];
  onSelectAnimal: (animal: Animal) => void;
  onOpenManualEntry: () => void;
  onOpenSensorPairing: () => void;
  lang: 'EN' | 'HI';
  role: UserRole;
}

interface FarmerGroup {
  farmer_name: string;
  farmer_phone?: string;
  farm_name: string;
  high_risk_count: number;
  mod_risk_count: number;
  total_count: number;
  animals: Animal[];
}

export const FarmerHomeScreen: React.FC<Props> = ({
  animals,
  alerts,
  onSelectAnimal,
  onOpenManualEntry,
  onOpenSensorPairing,
  lang,
  role
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<'All' | Species>('All');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'All' | RiskBand>('All');
  const [selectedFarmerFilter, setSelectedFarmerFilter] = useState<string>('All');
  const [selectedFarmerModal, setSelectedFarmerModal] = useState<FarmerGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({});

  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlertIds((prev) => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  const extractTimeLeft = (alt: AlertItem, animalList: Animal[]) => {
    const match = alt.message.match(/within\s+([0-9–\-]+\s*days?)/i);
    if (match) {
      return match[1];
    }
    const matchedAnimal = animalList.find((a) => a.animal_id === alt.animal_id || a.rfid_tag === alt.rfid_tag);
    if (matchedAnimal?.forecast_lead_days) {
      return `${matchedAnimal.forecast_lead_days} days`;
    }
    return '7–14 days';
  };

  // Summary counts
  const highRiskCount = animals.filter((a) => a.current_risk_band === 'High Risk').length;
  const modRiskCount = animals.filter((a) => a.current_risk_band === 'Moderate Risk').length;
  const lowRiskCount = animals.filter((a) => a.current_risk_band === 'Low Risk').length;
  const noRiskCount = animals.filter((a) => a.current_risk_band === 'No Risk').length;

  // Group animals by Farmer for Vet Priority View
  const farmerGroupsMap = animals.reduce<Record<string, FarmerGroup>>((acc, animal) => {
    const key = animal.farmer_name || 'Ramesh Patel (रमेश पटेल)';
    if (!acc[key]) {
      acc[key] = {
        farmer_name: key,
        farmer_phone: animal.farmer_phone || '+91 98765 43210',
        farm_name: animal.farm_name,
        high_risk_count: 0,
        mod_risk_count: 0,
        total_count: 0,
        animals: []
      };
    }
    acc[key].total_count += 1;
    if (animal.current_risk_band === 'High Risk') acc[key].high_risk_count += 1;
    if (animal.current_risk_band === 'Moderate Risk') acc[key].mod_risk_count += 1;
    acc[key].animals.push(animal);
    return acc;
  }, {});

  // Priority ranking: Farmers with highest count of High Risk animals ranked first
  const rankedFarmers = Object.values(farmerGroupsMap).sort((a, b) => {
    if (b.high_risk_count !== a.high_risk_count) return b.high_risk_count - a.high_risk_count;
    if (b.mod_risk_count !== a.mod_risk_count) return b.mod_risk_count - a.mod_risk_count;
    return b.total_count - a.total_count;
  });

  const handleFilterHerdByFarmer = (farmerName: string) => {
    const nextFilter = selectedFarmerFilter === farmerName ? 'All' : farmerName;
    setSelectedFarmerFilter(nextFilter);
    if (nextFilter !== 'All') {
      setTimeout(() => {
        document.getElementById('herd-grid-container')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    const matchesSpecies = selectedSpecies === 'All' || a.species === selectedSpecies;
    const matchesRisk = selectedRiskFilter === 'All' || a.current_risk_band === selectedRiskFilter;
    const matchesFarmer = selectedFarmerFilter === 'All' || a.farmer_name === selectedFarmerFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.rfid_tag.includes(searchQuery) ||
      a.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.farmer_name && a.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.farm_name && a.farm_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpecies && matchesRisk && matchesFarmer && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px' }}>
      {/* Role Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(47, 111, 78, 0.2)' }}>
            {lang === 'HI' ? `भूमिका: ${role}` : `${role} View`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {lang === 'HI'
              ? '7–14 दिवस AI पूर्व-लक्षण पूर्वानुमान नेटवर्क'
              : '7–14 Day Pre-Clinical AI Early Warning Network'}
          </span>
        </div>
        <div>
          <button
            onClick={onOpenManualEntry}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary)',
              color: '#FFF',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(47, 111, 78, 0.2)'
            }}
          >
            <PlusCircle size={14} />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Vet Risk Priority Directory */}
      {(role === 'Vet' || role === 'Admin') && (
        <div style={{ marginBottom: 24 }} className="glass-card">
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              backgroundColor: 'var(--surface-subtle)'
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color="var(--primary)" />
                {lang === 'HI' ? 'किसान जोखिम प्राथमिकता सूची (Farm Visit Priority)' : 'Vet Farm Visit Risk Priority Directory'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Farmers automatically ranked by high-risk subclinical mastitis cases requiring urgent veterinarian visits.
              </p>
            </div>
            {selectedFarmerFilter !== 'All' && (
              <button
                onClick={() => setSelectedFarmerFilter('All')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <X size={13} />
                Clear Farmer Filter (Showing All {animals.length})
              </button>
            )}
          </div>

          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {rankedFarmers.map((farmer, idx) => {
              const isSelected = selectedFarmerFilter === farmer.farmer_name;
              const rankColor = idx === 0 ? '#DC2626' : idx === 1 ? '#D97706' : '#2F6F4E';
              const rankBg = idx === 0 ? '#FEF2F2' : idx === 1 ? '#FFFBEB' : '#EBF4EF';

              return (
                <div
                  key={farmer.farmer_name}
                  style={{
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: isSelected ? '0 4px 14px rgba(47, 111, 78, 0.15)' : 'var(--shadow-sm)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Rank Header Accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: rankColor }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              backgroundColor: rankBg,
                              color: rankColor,
                              border: `1px solid ${rankColor}40`,
                              fontSize: 11,
                              fontWeight: 900,
                              padding: '2px 8px',
                              borderRadius: 6,
                              letterSpacing: '0.02em'
                            }}
                          >
                            RANK #{idx + 1}
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                            {farmer.farmer_name}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--primary)" />
                          {farmer.farm_name}
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedFarmerModal(farmer)}
                        style={{
                          backgroundColor: 'var(--surface-subtle)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </div>

                    {/* High Risk Badge Only */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: farmer.high_risk_count > 0 ? '#DC2626' : '#64748B',
                          backgroundColor: farmer.high_risk_count > 0 ? '#FEF2F2' : '#F1F5F9',
                          border: `1px solid ${farmer.high_risk_count > 0 ? '#FCA5A5' : '#CBD5E1'}`,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        🚨 {farmer.high_risk_count} High Risk
                      </span>
                    </div>
                  </div>

                  {/* Filter Herd Button */}
                  <button
                    onClick={() => handleFilterHerdByFarmer(farmer.farmer_name)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--primary)' : '#FFFFFF',
                      color: isSelected ? '#FFF' : 'var(--primary)',
                      border: '1.5px solid var(--primary)',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <Filter size={14} />
                    {isSelected ? 'Filtered Below (Click to Reset)' : `Filter Herd by ${farmer.farmer_name.split(' ')[0]}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 14, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL HERD</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{animals.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cattle & Buffalo</div>
        </div>

        <div className="glass-card" style={{ padding: 14, borderLeft: '4px solid var(--risk-high)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>HIGH RISK</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--risk-high)' }}>{highRiskCount}</div>
          <div style={{ fontSize: 10, color: 'var(--risk-high)' }}>Requires Urgent Vet Action</div>
        </div>

        <div className="glass-card" style={{ padding: 14, borderLeft: '4px solid var(--risk-moderate)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>MODERATE RISK</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--risk-moderate)' }}>{modRiskCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Monitor Teat EC Trends</div>
        </div>

        <div className="glass-card" style={{ padding: 14, borderLeft: '4px solid var(--risk-none)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>HEALTHY / NO RISK</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--risk-none)' }}>{noRiskCount + lowRiskCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Optimal Productivity</div>
        </div>
      </div>

      {/* High-Risk Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={18} color="#EF4444" />
              {lang === 'HI' ? 'अति आवश्यक चेतावनी (Urgent AI Alerts)' : 'Urgent AI Pre-Clinical Early Warning Alerts'}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {lang === 'HI' ? 'विवरण देखने के लिए कार्ड पर क्लिक करें' : 'Click alert card to expand major details'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((alt) => {
              const isExpanded = !!expandedAlertIds[alt.alert_id];
              const timeLeftStr = extractTimeLeft(alt, animals);
              const isHigh = alt.risk_band === 'High Risk';
              const isMod = alt.risk_band === 'Moderate Risk';

              const bgColor = isHigh ? '#FEF2F2' : isMod ? '#FFFBEB' : '#ECFDF5';
              const borderColor = isHigh ? '#FCA5A5' : isMod ? '#FDE68A' : '#A7F3D0';
              const textColor = isHigh ? '#7F1D1D' : isMod ? '#78350F' : '#065F46';

              return (
                <div
                  key={alt.alert_id}
                  style={{
                    backgroundColor: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded ? '0 4px 14px rgba(220, 38, 38, 0.12)' : 'var(--shadow-sm)'
                  }}
                >
                  {/* Outer / Summary Bar (Always Visible - Clicking Toggles Major Details) */}
                  <div
                    onClick={() => toggleAlertExpand(alt.alert_id)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: textColor }}>{alt.animal_name}</span>
                      <RiskBadge band={alt.risk_band} size="sm" />

                      {/* Outer Visible Days Left / Time Horizon Badge */}
                      <span
                        style={{
                          backgroundColor: isHigh ? '#FEE2E2' : isMod ? '#FEF3C7' : '#D1FAE5',
                          color: isHigh ? '#991B1B' : isMod ? '#92400E' : '#065F46',
                          border: `1px solid ${isHigh ? '#FCA5A5' : isMod ? '#FDE68A' : '#A7F3D0'}`,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 12,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Clock size={13} />
                        {lang === 'HI' ? `${timeLeftStr} शेष` : `${timeLeftStr} Left`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAlertExpand(alt.alert_id);
                        }}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          color: textColor,
                          border: `1px solid ${borderColor}`,
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? (
                          <>
                            {lang === 'HI' ? 'छिपाएं' : 'Hide Details'}
                            <ChevronUp size={15} />
                          </>
                        ) : (
                          <>
                            {lang === 'HI' ? 'विवरण देखें' : 'View Details'}
                            <ChevronDown size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inner Major Details (Visible Only After Click) */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderTop: `1px dashed ${borderColor}`,
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ color: textColor, fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#FFF', padding: '3px 8px', borderRadius: 4, border: `1px solid ${borderColor}` }}>
                          RFID: {alt.rfid_tag}
                        </span>
                        {alt.farmer_name && (
                          <span style={{ fontWeight: 700, color: textColor }}>
                            👤 Farmer: {alt.farmer_name} • 📍 {alt.farm_name}
                          </span>
                        )}
                      </div>

                      {/* Full Message Text */}
                      <p style={{ fontSize: 13, color: '#374151', margin: '4px 0', fontWeight: 500, lineHeight: 1.5 }}>
                        <strong>{lang === 'HI' ? 'AI चेतावनी विवरण:' : 'Predictive AI Warning:'}</strong> {alt.message}
                      </p>

                      {/* Recommended Action Box */}
                      <div
                        style={{
                          backgroundColor: '#FFF',
                          border: '1px solid #FED7AA',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px',
                          fontSize: 12,
                          color: '#9A3412',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8
                        }}
                      >
                        <span>💡</span>
                        <div>
                          <strong>{lang === 'HI' ? 'अनुशंसित कार्रवाई:' : 'Recommended Action:'}</strong> {alt.recommended_action}
                        </div>
                      </div>

                      {/* Call Action Buttons */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        {alt.farmer_phone && (role === 'Vet' || role === 'Admin') && (
                          <a
                            href={`tel:${alt.farmer_phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#2563EB',
                              color: '#FFF',
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <PhoneCall size={14} />
                            Call Farmer
                          </a>
                        )}
                        <a
                          href="tel:18001801551"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: '#DC2626',
                            color: '#FFF',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <PhoneCall size={14} />
                          Call Vet (डॉक्टर)
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar Anchor */}
      <div id="herd-grid-container" style={{ scrollMarginTop: 80 }}>
        {/* Active Farmer Filter Banner */}
        {selectedFarmerFilter !== 'All' && (
          <div
            style={{
              backgroundColor: 'var(--primary-light)',
              border: '1.5px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
                Filtered View: Showing herd belonging to <u>{selectedFarmerFilter}</u> ({filteredAnimals.length} Head)
              </span>
            </div>
            <button
              onClick={() => setSelectedFarmerFilter('All')}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFF',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reset to Full Herd
            </button>
          </div>
        )}

        <div
          className="glass-card"
          style={{
            padding: 14,
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder={lang === 'HI' ? 'नाम, किसान या RFID से खोजें...' : 'Search by name, farmer, RFID, breed...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                fontSize: 13
              }}
            />
          </div>

          {/* Species Switcher */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['All', 'Cattle', 'Buffalo'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSpecies(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: selectedSpecies === s ? 700 : 500,
                  backgroundColor: selectedSpecies === s ? 'var(--primary)' : 'var(--surface-subtle)',
                  color: selectedSpecies === s ? '#FFF' : 'var(--text-muted)'
                }}
              >
                {s === 'Cattle' ? 'गाय (Cattle)' : s === 'Buffalo' ? 'भैंस (Buffalo)' : 'All Species'}
              </button>
            ))}
          </div>

          {/* Risk Filter Pills */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {(['All', 'High Risk', 'Moderate Risk', 'Low Risk', 'No Risk'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRiskFilter(r)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 11,
                  fontWeight: selectedRiskFilter === r ? 700 : 500,
                  backgroundColor: selectedRiskFilter === r ? 'var(--text-main)' : 'var(--surface-subtle)',
                  color: selectedRiskFilter === r ? '#FFF' : 'var(--text-muted)'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Animal Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {filteredAnimals.map((animal) => {
            const maxEC = Math.max(...Object.values(animal.teats).map((t) => t.ec));
            const isHighEC = maxEC >= 6.5;
            const isModEC = maxEC >= 5.8 && maxEC < 6.5;

            const riskBorderColor =
              animal.current_risk_band === 'High Risk'
                ? 'var(--risk-high)'
                : animal.current_risk_band === 'Moderate Risk'
                ? 'var(--risk-moderate)'
                : animal.current_risk_band === 'Low Risk'
                ? 'var(--risk-low)'
                : 'var(--risk-none)';

            return (
              <div
                key={animal.animal_id}
                className="glass-card"
                onClick={() => onSelectAnimal(animal)}
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Top Colored Risk Accent Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: riskBorderColor }} />

                <div>
                  {/* Header Row: Animal Name & Risk Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingTop: 4 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                        {animal.name}
                      </h4>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
                        {animal.species} • {animal.breed}
                      </div>
                    </div>
                    <RiskBadge band={animal.current_risk_band} score={animal.current_risk_score} size="sm" />
                  </div>

                  {/* Owner & Location Info */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    {animal.farmer_name && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={13} color="var(--primary)" />
                        {animal.farmer_name}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', backgroundColor: '#FFF', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        RFID: {animal.rfid_tag}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} color="var(--text-muted)" />
                        {animal.farm_name}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border)', padding: '8px 4px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>DIM</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{animal.days_in_milk} days</div>
                    </div>

                    <div style={{ backgroundColor: isHighEC ? '#FEF2F2' : isModEC ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${isHighEC ? '#FCA5A5' : isModEC ? '#FDE68A' : 'var(--border)'}`, padding: '8px 4px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: isHighEC ? '#991B1B' : isModEC ? '#92400E' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Max Teat EC</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isHighEC ? '#DC2626' : isModEC ? '#D97706' : 'var(--text-main)', marginTop: 2 }}>
                        {maxEC} mS/cm
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border)', padding: '8px 4px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Rumination</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{animal.rumination_minutes}m</div>
                    </div>
                  </div>
                </div>

                {/* AI Forecast Banner */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid rgba(47, 111, 78, 0.15)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--primary)',
                    marginTop: 4
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} color="var(--primary)" />
                    {animal.forecast_lead_days}-Day AI Forecast Horizon
                  </span>
                  <ChevronRight size={15} color="var(--primary)" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Farmer Details Modal */}
      {selectedFarmerModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setSelectedFarmerModal(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 20,
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800
                  }}
                >
                  👤
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {selectedFarmerModal.farmer_name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="var(--primary)" />
                    {selectedFarmerModal.farm_name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedFarmerModal(null)}
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  padding: 6,
                  borderRadius: '50%',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Direct Contact Bar */}
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid rgba(47, 111, 78, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>REGISTERED FARMER CONTACT</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  {selectedFarmerModal.farmer_phone}
                </div>
              </div>

              {selectedFarmerModal.farmer_phone && (
                <a
                  href={`tel:${selectedFarmerModal.farmer_phone}`}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={14} />
                  Call Farmer Directly
                </a>
              )}
            </div>

            {/* Herd Risk Summary Breakdown */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
                Herd Mastitis Risk Breakdown ({selectedFarmerModal.total_count} Cattle Registered)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedFarmerModal.animals.map((anim) => (
                  <div
                    key={anim.animal_id}
                    onClick={() => {
                      setSelectedFarmerModal(null);
                      onSelectAnimal(anim);
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-subtle)',
                      border: `1.5px solid ${
                        anim.current_risk_band === 'High Risk'
                          ? '#FCA5A5'
                          : anim.current_risk_band === 'Moderate Risk'
                          ? '#FDE68A'
                          : 'var(--border)'
                      }`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{anim.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{anim.rfid_tag}</span>
                        <RiskBadge band={anim.current_risk_band} score={anim.current_risk_score} size="sm" />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {anim.species} ({anim.breed}) • Max Teat EC: <strong>{Math.max(...Object.values(anim.teats).map((t) => t.ec))} mS/cm</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                      <span>View Telemetry</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setSelectedFarmerModal(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  const name = selectedFarmerModal.farmer_name;
                  setSelectedFarmerModal(null);
                  handleFilterHerdByFarmer(name);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Filter size={14} />
                Filter Herd Below
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


