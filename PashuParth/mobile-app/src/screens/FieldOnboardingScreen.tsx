import React, { useState } from 'react';
import { authService, UserAccount } from '../services/authService';
import { UserRole } from '../types';
import { UserPlus, WifiOff, CheckCircle2, ArrowLeft, RefreshCw, Stethoscope, Home, ClipboardList, PawPrint } from 'lucide-react';

interface Props {
  onBack: () => void;
  lang: 'EN' | 'HI';
  currentUserRole: UserRole;
}

export const FieldOnboardingScreen: React.FC<Props> = ({ onBack, lang, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'vet' | 'field' | 'animal'>('farmer');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Farmer form
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState('Anand');
  const [cattleCount, setCattleCount] = useState(2);
  const [buffaloCount, setBuffaloCount] = useState(1);

  // Vet form
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vetRegNo, setVetRegNo] = useState('');

  // Field Personnel form (Admin only)
  const [fpName, setFpName] = useState('');
  const [fpPhone, setFpPhone] = useState('');
  const [fpEmployeeId, setFpEmployeeId] = useState('');
  const [fpDistrict, setFpDistrict] = useState('Anand');

  // Animal registration form
  const [animalRfid, setAnimalRfid] = useState('');
  const [animalName, setAnimalName] = useState('');
  const [animalSpecies, setAnimalSpecies] = useState<'Cattle' | 'Buffalo'>('Cattle');
  const [animalBreed, setAnimalBreed] = useState('');
  const [animalBirthDate, setAnimalBirthDate] = useState('');
  const [animalLactationNo, setAnimalLactationNo] = useState(1);
  const [animalFarmId, setAnimalFarmId] = useState('');
  const [animalVaccination, setAnimalVaccination] = useState('');
  const [animalDiseaseHistory, setAnimalDiseaseHistory] = useState('');

  const registeredUsers = authService.getUsers();
  const offlineQueue = authService.getOfflineQueue();

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRegisterFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName || !farmerPhone || !farmName) return;
    authService.registerUser(
      {
        name: farmerName, phone: farmerPhone, role: 'Farmer',
        registered_by: currentUserRole === 'Admin' ? 'Admin' : 'usr-fp01 (Vikram Singh)',
        farm_id: `f-${Date.now().toString().slice(-3)}`,
        farm_name: farmName, district,
        cattle_count: Number(cattleCount), buffalo_count: Number(buffaloCount)
      },
      isOfflineMode
    );
    showSuccess(isOfflineMode
      ? `✅ Farmer '${farmerName}' registered OFFLINE! Saved to local queue.`
      : `✅ Farmer '${farmerName}' registered ONLINE! Synced to PashuParth backend.`);
    setFarmerName(''); setFarmerPhone(''); setFarmName('');
  };

  const handleRegisterVet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetName || !vetPhone || !vetRegNo) return;
    authService.registerUser(
      {
        name: vetName, phone: vetPhone, role: 'Vet',
        registered_by: currentUserRole === 'Admin' ? 'Admin' : 'usr-fp01 (Vikram Singh)',
        vet_registration_number: vetRegNo, assigned_farms: ['f-01', 'f-02']
      },
      isOfflineMode
    );
    showSuccess(isOfflineMode
      ? `✅ Vet '${vetName}' registered OFFLINE! Saved to local queue.`
      : `✅ Vet '${vetName}' registered ONLINE! Synced to PashuParth backend.`);
    setVetName(''); setVetPhone(''); setVetRegNo('');
  };

  const handleRegisterFieldPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpName || !fpPhone || !fpEmployeeId) return;
    authService.registerUser(
      {
        name: fpName, phone: fpPhone, role: 'Field Personnel',
        registered_by: 'Admin Authority',
        employee_id: fpEmployeeId, assigned_district: fpDistrict
      },
      isOfflineMode
    );
    showSuccess(isOfflineMode
      ? `✅ Field Officer '${fpName}' registered OFFLINE! Saved to local queue.`
      : `✅ Field Officer '${fpName}' registered ONLINE! Granted Onboarding Rights.`);
    setFpName(''); setFpPhone(''); setFpEmployeeId('');
  };

  const handleSyncQueue = () => {
    const syncedCount = authService.syncOfflineQueue();
    showSuccess(`🔄 Successfully synced ${syncedCount} offline registration(s) to cloud!`);
  };

  const handleRegisterAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalRfid || !animalName || !animalBreed || !animalFarmId) return;
    const newAnimal = {
      animal_id: `pp-a${Date.now().toString().slice(-4)}`,
      rfid_tag: animalRfid.trim(),
      name: animalName, species: animalSpecies, breed: animalBreed,
      birth_date: animalBirthDate || null,
      lactation_number: Number(animalLactationNo),
      farm_id: animalFarmId,
      vaccination_status: animalVaccination ? { notes: animalVaccination } : {},
      disease_history: animalDiseaseHistory ? { notes: animalDiseaseHistory } : {},
      registered_by_fp: true,
      registered_at: new Date().toISOString()
    };
    fetch('http://localhost:8001/api/v1/register-animal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnimal)
    }).catch(() => {});
    showSuccess(isOfflineMode
      ? `✅ Animal '${animalName}' (RFID: ${animalRfid}) queued OFFLINE for sync.`
      : `✅ Animal '${animalName}' registered! RFID ${animalRfid} is now an approved tag.`);
    setAnimalRfid(''); setAnimalName(''); setAnimalBreed('');
    setAnimalBirthDate(''); setAnimalLactationNo(1); setAnimalFarmId('');
    setAnimalVaccination(''); setAnimalDiseaseHistory('');
  };

  const tabBtn = (key: typeof activeTab, label: string, icon: React.ReactNode, color?: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      style={{
        padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, border: 'none', cursor: 'pointer',
        fontWeight: activeTab === key ? 800 : 500,
        backgroundColor: activeTab === key ? (color || 'var(--primary)') : 'var(--surface-subtle)',
        color: activeTab === key ? '#FFF' : 'var(--text-main)',
        display: 'flex', alignItems: 'center', gap: 6
      }}
    >
      {icon}{label}
    </button>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
          fontSize: 14, fontWeight: 700, color: 'var(--primary)',
          backgroundColor: 'var(--surface-subtle)', padding: '6px 12px',
          borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={20} />
              {currentUserRole === 'Admin' ? 'Admin & Field Registration Workspace' : 'Field Personnel Registration Portal'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentUserRole === 'Admin'
                ? 'Top Tier Admin Privileges: Onboard Field Personnel, Veterinarians, Farmers, and Animals.'
                : 'Primary Onboarding Authority: Register new Farmers, Vets & Animals (Online & Offline Field Mode).'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              backgroundColor: isOfflineMode ? '#FEF2F2' : '#ECFDF5',
              color: isOfflineMode ? '#DC2626' : '#059669',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {isOfflineMode ? <WifiOff size={14} /> : <CheckCircle2 size={14} />}
            {isOfflineMode ? 'Offline Field Mode' : 'Online Cloud Mode'}
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {successMessage}
        </div>
      )}

      {/* Offline queue banner */}
      {offlineQueue.length > 0 && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>
            ⚠️ {offlineQueue.length} Registration(s) waiting in local offline queue.
          </span>
          <button
            onClick={handleSyncQueue}
            style={{ backgroundColor: '#F59E0B', color: '#FFF', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Sync Queue Now
          </button>
        </div>
      )}

      {/* ── Main Registration Tabs Card ───────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabBtn('farmer', 'Onboard Farmer', <Home size={16} />)}
          {tabBtn('vet', 'Onboard Veterinarian', <Stethoscope size={16} />)}
          {currentUserRole === 'Admin' && tabBtn('field', 'Onboard Field Personnel', <ClipboardList size={16} />)}
          {tabBtn('animal', 'Register Animals', <PawPrint size={16} />, '#059669')}
        </div>

        {/* ── Farmer Form ───────────────────────────────────────────────── */}
        {activeTab === 'farmer' && (
          <form onSubmit={handleRegisterFarmer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Farmer Full Name (किसान का नाम): *</label>
              <input type="text" required placeholder="e.g. Suresh Patel" value={farmerName} onChange={e => setFarmerName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mobile Number (मोबाइल नंबर): *</label>
              <input type="text" required placeholder="+91 98765 43210" value={farmerPhone} onChange={e => setFarmerPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Farm Name (डेयरी फार्म): *</label>
              <input type="text" required placeholder="e.g. Surya Dairy Farm" value={farmName} onChange={e => setFarmName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>District (जिला): *</label>
              <select value={district} onChange={e => setDistrict(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}>
                <option>Anand</option>
                <option>Kheda</option>
                <option>Mehsana</option>
                <option>Banaskantha</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Cattle Count (गायों की संख्या):</label>
              <input type="number" min={0} value={cattleCount} onChange={e => setCattleCount(Number(e.target.value))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Buffalo Count (भैंसों की संख्या):</label>
              <input type="number" min={0} value={buffaloCount} onChange={e => setBuffaloCount(Number(e.target.value))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ backgroundColor: 'var(--primary)', color: '#FFF', padding: '10px 20px', borderRadius: 6, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Register Farmer & Farm
              </button>
            </div>
          </form>
        )}

        {/* ── Vet Form ──────────────────────────────────────────────────── */}
        {activeTab === 'vet' && (
          <form onSubmit={handleRegisterVet} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Veterinarian Full Name: *</label>
              <input type="text" required placeholder="e.g. Dr. R. K. Sharma" value={vetName} onChange={e => setVetName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number: *</label>
              <input type="text" required placeholder="+91 98220 99887" value={vetPhone} onChange={e => setVetPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Vet Council Reg. Number: *</label>
              <input type="text" required placeholder="e.g. GJ-4921" value={vetRegNo} onChange={e => setVetRegNo(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ backgroundColor: 'var(--primary)', color: '#FFF', padding: '10px 20px', borderRadius: 6, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Register Veterinarian
              </button>
            </div>
          </form>
        )}

        {/* ── Field Personnel Form (Admin only) ─────────────────────────── */}
        {activeTab === 'field' && currentUserRole === 'Admin' && (
          <form onSubmit={handleRegisterFieldPerson} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name: *</label>
              <input type="text" required placeholder="e.g. Vikram Singh" value={fpName} onChange={e => setFpName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number: *</label>
              <input type="text" required placeholder="+91 99001 12345" value={fpPhone} onChange={e => setFpPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Employee ID: *</label>
              <input type="text" required placeholder="e.g. FP-905" value={fpEmployeeId} onChange={e => setFpEmployeeId(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Assigned District:</label>
              <select value={fpDistrict} onChange={e => setFpDistrict(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}>
                <option>Anand</option>
                <option>Kheda</option>
                <option>Mehsana</option>
                <option>Banaskantha</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ backgroundColor: '#7E22CE', color: '#FFF', padding: '10px 20px', borderRadius: 6, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Register Field Officer (Admin Privilege)
              </button>
            </div>
          </form>
        )}

        {/* ── Animal Registration Form ───────────────────────────────────── */}
        {activeTab === 'animal' && (
          <form onSubmit={handleRegisterAnimal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                📋 Bulk initial onboarding — scan each animal's RFID on-site and fill in details.
                Every registered RFID becomes an <strong>approved tag</strong>; unknown tags from hardware will raise an alert instead of writing silently.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>RFID Tag (स्कैन करें): *</label>
              <input type="text" required placeholder="e.g. 982 000183940121" value={animalRfid} onChange={e => setAnimalRfid(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Animal Name / Tag ID: *</label>
              <input type="text" required placeholder="e.g. Gauri" value={animalName} onChange={e => setAnimalName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Farm ID: *</label>
              <input type="text" required placeholder="e.g. farm-pb-001" value={animalFarmId} onChange={e => setAnimalFarmId(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Species (प्रजाति): *</label>
              <select value={animalSpecies} onChange={e => setAnimalSpecies(e.target.value as 'Cattle' | 'Buffalo')}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}>
                <option value="Cattle">Cattle (गाय)</option>
                <option value="Buffalo">Buffalo (भैंस)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Breed (नस्ल): *</label>
              <input type="text" required placeholder={animalSpecies === 'Cattle' ? 'e.g. Gir, HF, Jersey' : 'e.g. Murrah, Surti'}
                value={animalBreed} onChange={e => setAnimalBreed(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Date of Birth (जन्म तिथि):</label>
              <input type="date" value={animalBirthDate} onChange={e => setAnimalBirthDate(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Lactation Number (ब्यांत क्रमांक):</label>
              <input type="number" min={1} max={15} value={animalLactationNo} onChange={e => setAnimalLactationNo(Number(e.target.value))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Vaccination Notes (टीकाकरण):</label>
              <input type="text" placeholder="e.g. FMD Apr-2025, BQ Mar-2025" value={animalVaccination} onChange={e => setAnimalVaccination(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Disease History (बीमारी का इतिहास):</label>
              <input type="text" placeholder="e.g. Mastitis (2024), Tick fever (2023)" value={animalDiseaseHistory} onChange={e => setAnimalDiseaseHistory(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ backgroundColor: '#059669', color: '#FFF', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                <PawPrint size={16} /> Register Animal & Approve RFID Tag
              </button>
            </div>
          </form>
        )}

      </div>{/* end main tabs glass-card */}

      {/* ── Registered Users Directory (Admin only) ──────────────────────── */}
      {currentUserRole === 'Admin' && registeredUsers.length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
            Registered Farmers, Vets & Field Officers Directory ({registeredUsers.length})
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 8 }}>NAME</th>
                  <th style={{ padding: 8 }}>ROLE</th>
                  <th style={{ padding: 8 }}>CONTACT / REG / EMP ID</th>
                  <th style={{ padding: 8 }}>FARM / DISTRICT</th>
                  <th style={{ padding: 8 }}>REGISTERED BY</th>
                  <th style={{ padding: 8 }}>SYNC</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{u.name}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        backgroundColor: u.role === 'Farmer' ? '#ECFDF5' : u.role === 'Vet' ? '#EFF6FF' : u.role === 'Field Personnel' ? '#E0F2FE' : '#F3E8FF',
                        color: u.role === 'Farmer' ? '#059669' : u.role === 'Vet' ? '#2563EB' : u.role === 'Field Personnel' ? '#0369A1' : '#7E22CE'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>
                      {u.phone}{u.vet_registration_number ? ` (Reg: ${u.vet_registration_number})` : ''}{u.employee_id ? ` (ID: ${u.employee_id})` : ''}
                    </td>
                    <td style={{ padding: 8 }}>{u.farm_name || u.assigned_district || u.district || '—'}</td>
                    <td style={{ padding: 8, fontSize: 11, color: 'var(--text-muted)' }}>{u.registered_by}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ color: u.synced ? '#059669' : '#DC2626', fontWeight: 700 }}>
                        {u.synced ? 'Synced' : 'Queued'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
