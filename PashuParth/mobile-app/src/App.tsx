import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './screens/LoginScreen';
import { FarmerHomeScreen } from './screens/FarmerHomeScreen';
import { AnimalDetailScreen } from './screens/AnimalDetailScreen';
import { ManualDataEntryScreen } from './screens/ManualDataEntryScreen';
import { SensorPairingScreen } from './screens/SensorPairingScreen';
import { FieldOnboardingScreen } from './screens/FieldOnboardingScreen';
import { GISHotspotMap } from './components/GISHotspotMap';
import { HerdOverviewGrid } from './components/HerdOverviewGrid';
import { AMRLogTable } from './components/AMRLogTable';
import { INITIAL_ANIMALS, INITIAL_ALERTS, FARM_CLUSTERS, AMR_RECORDS } from './mockData';
import { Animal, UserRole } from './types';
import { UserAccount } from './services/authService';
import { LayoutDashboard, MapPin, Activity, FileCheck, PlusCircle, Radio, UserPlus, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [animals] = useState<Animal[]>(INITIAL_ANIMALS);
  const [alerts] = useState(INITIAL_ALERTS);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'detail' | 'gis' | 'analytics' | 'amr' | 'manual' | 'sensors' | 'onboarding'>('home');
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.setAttribute('data-theme', 'outdoor-high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isHighContrast]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'Farmer') setCurrentScreen('home');
    else if (user.role === 'Field Personnel') setCurrentScreen('onboarding');
    else if (user.role === 'Admin') setCurrentScreen('gis');
    else setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedAnimal(null);
  };

  const handleSelectAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('detail');
  };

  const currentRole = currentUser?.role || 'Farmer';

  // Role-Scoped Filtered Animals & Alerts
  const scopedAnimals = currentRole === 'Farmer'
    ? animals.filter((a) =>
        (currentUser?.farm_id && a.farm_id === currentUser.farm_id) ||
        (currentUser?.name && a.farmer_name?.includes(currentUser.name.split(' ')[0]))
      )
    : animals;

  const scopedAlerts = currentRole === 'Farmer'
    ? alerts.filter((alt) => scopedAnimals.some((a) => a.animal_id === alt.animal_id))
    : alerts;

  // Available tabs allowed for the current role
  const getNavTabs = () => {
    switch (currentRole) {
      case 'Farmer':
        return [
          { key: 'home', label: lang === 'HI' ? 'मेरा पशुधन' : 'My Herd & Animals', icon: LayoutDashboard }
        ];
      case 'Vet':
        return [
          { key: 'home', label: 'Assigned Herd', icon: LayoutDashboard },
          { key: 'analytics', label: 'Telemetry & SHAP', icon: Activity },
          { key: 'amr', label: 'AMR Logs', icon: FileCheck },
          { key: 'manual', label: 'Manual Entry', icon: PlusCircle }
        ];
      case 'Field Personnel':
        return [
          { key: 'onboarding', label: 'Onboard Farmer/Vet', icon: UserPlus },
          { key: 'manual', label: 'Category B Forms', icon: PlusCircle },
          { key: 'home', label: 'Field Herd View', icon: LayoutDashboard }
        ];
      case 'Admin':
        return [
          { key: 'gis', label: 'GIS Hotspots', icon: MapPin },
          { key: 'analytics', label: 'Herd Analytics', icon: Activity },
          { key: 'amr', label: 'AMR Compliance', icon: FileCheck },
          { key: 'onboarding', label: 'User Directory', icon: UserPlus },
          { key: 'home', label: 'All Animals', icon: LayoutDashboard },
          { key: 'sensors', label: 'Sensors', icon: Radio }
        ];
    }
  };

  const navTabs = getNavTabs();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        onLangToggle={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
      />

      {/* Unauthenticated View -> Login Screen */}
      {!currentUser ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} lang={lang} />
      ) : (
        <>
          {/* Role-Scoped Navigation Bar */}
          <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '6px 16px', overflowX: 'auto' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {navTabs.map((tab) => {
                  const IconComp = tab.icon;
                  const active = currentScreen === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setCurrentScreen(tab.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text-muted)',
                        border: active ? '1px solid rgba(47, 111, 78, 0.2)' : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <IconComp size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} color="var(--primary)" />
                <span>Session: <strong>{currentUser.name} ({currentUser.role})</strong></span>
              </div>
            </div>
          </div>

          <main style={{ paddingBottom: 40 }}>
            {currentScreen === 'home' && (
              <FarmerHomeScreen
                animals={scopedAnimals}
                alerts={scopedAlerts}
                onSelectAnimal={handleSelectAnimal}
                onOpenManualEntry={() => setCurrentScreen('manual')}
                onOpenSensorPairing={() => setCurrentScreen('sensors')}
                lang={lang}
                role={currentRole}
              />
            )}

            {currentScreen === 'detail' && selectedAnimal && (
              <AnimalDetailScreen
                animal={selectedAnimal}
                onBack={() => setCurrentScreen('home')}
                onOpenManualEntry={() => setCurrentScreen('manual')}
                lang={lang}
              />
            )}

            {currentScreen === 'onboarding' && (
              <FieldOnboardingScreen
                onBack={() => setCurrentScreen('home')}
                lang={lang}
                currentUserRole={currentRole}
              />
            )}

            {currentScreen === 'gis' && (
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
                <GISHotspotMap clusters={FARM_CLUSTERS} />
              </div>
            )}

            {currentScreen === 'analytics' && (
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
                <HerdOverviewGrid />
              </div>
            )}

            {currentScreen === 'amr' && (
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
                <AMRLogTable records={AMR_RECORDS} />
              </div>
            )}

            {currentScreen === 'manual' && (
              <ManualDataEntryScreen
                animals={scopedAnimals}
                onBack={() => setCurrentScreen('home')}
                role={currentRole}
                lang={lang}
              />
            )}

            {currentScreen === 'sensors' && (
              <SensorPairingScreen
                onBack={() => setCurrentScreen('home')}
                lang={lang}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
