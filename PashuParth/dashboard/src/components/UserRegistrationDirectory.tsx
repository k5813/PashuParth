import React, { useState } from 'react';
import { UserPlus, WifiOff, CheckCircle2, UserCheck, Stethoscope, Home, ClipboardList } from 'lucide-react';

export interface UserAccount {
  user_id: string;
  name: string;
  phone: string;
  role: 'Farmer' | 'Vet' | 'Field Personnel' | 'Admin';
  registered_by: string;
  registered_at: string;
  synced: boolean;
  farm_name?: string;
  district?: string;
  vet_registration_number?: string;
  employee_id?: string;
}

const INITIAL_DIRECTORY: UserAccount[] = [
  {
    user_id: 'usr-f01',
    name: 'Ramesh Patel (रमेश पटेल)',
    phone: '+91 98765 43210',
    role: 'Farmer',
    registered_by: 'usr-fp01 (Vikram Singh)',
    registered_at: '2026-09-01',
    synced: true,
    farm_name: 'Surya Dairy Farm, Anand',
    district: 'Anand'
  },
  {
    user_id: 'usr-v01',
    name: 'Dr. R. K. Sharma',
    phone: '+91 98220 11223',
    role: 'Vet',
    registered_by: 'usr-fp01 (Vikram Singh)',
    registered_at: '2026-08-15',
    synced: true,
    vet_registration_number: 'GJ-4921'
  },
  {
    user_id: 'usr-fp01',
    name: 'Vikram Singh (फील्ड ऑफिसर)',
    phone: '+91 98111 22334',
    role: 'Field Personnel',
    registered_by: 'Admin Authority',
    registered_at: '2026-07-01',
    synced: true,
    employee_id: 'FP-802',
    district: 'Anand'
  }
];

export const UserRegistrationDirectory: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_DIRECTORY);
  const [activeTab, setActiveTab] = useState<'farmer' | 'vet' | 'field'>('farmer');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Farmer form
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState('Anand');

  // Vet form
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vetRegNo, setVetRegNo] = useState('');

  // Field Personnel form (Admin Privilege)
  const [fpName, setFpName] = useState('');
  const [fpPhone, setFpPhone] = useState('');
  const [fpEmployeeId, setFpEmployeeId] = useState('');
  const [fpDistrict, setFpDistrict] = useState('Anand');

  const handleRegisterFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName || !farmerPhone) return;

    const newUser: UserAccount = {
      user_id: `usr-${Date.now()}`,
      name: farmerName,
      phone: farmerPhone,
      role: 'Farmer',
      registered_by: 'Admin / Field Officer',
      registered_at: new Date().toISOString().split('T')[0],
      synced: !isOfflineMode,
      farm_name: farmName,
      district
    };

    setUsers([newUser, ...users]);
    setSuccessMessage(isOfflineMode ? `✅ Farmer '${farmerName}' queued OFFLINE for cloud sync!` : `✅ Farmer '${farmerName}' onboarded ONLINE!`);
    setFarmerName('');
    setFarmerPhone('');
    setFarmName('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRegisterVet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetName || !vetPhone || !vetRegNo) return;

    const newUser: UserAccount = {
      user_id: `usr-${Date.now()}`,
      name: vetName,
      phone: vetPhone,
      role: 'Vet',
      registered_by: 'Admin / Field Officer',
      registered_at: new Date().toISOString().split('T')[0],
      synced: !isOfflineMode,
      vet_registration_number: vetRegNo
    };

    setUsers([newUser, ...users]);
    setSuccessMessage(isOfflineMode ? `✅ Vet '${vetName}' queued OFFLINE for cloud sync!` : `✅ Vet '${vetName}' onboarded ONLINE!`);
    setVetName('');
    setVetPhone('');
    setVetRegNo('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRegisterFieldPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpName || !fpPhone || !fpEmployeeId) return;

    const newUser: UserAccount = {
      user_id: `usr-${Date.now()}`,
      name: fpName,
      phone: fpPhone,
      role: 'Field Personnel',
      registered_by: 'Admin Authority',
      registered_at: new Date().toISOString().split('T')[0],
      synced: !isOfflineMode,
      employee_id: fpEmployeeId,
      district: fpDistrict
    };

    setUsers([newUser, ...users]);
    setSuccessMessage(isOfflineMode ? `✅ Field Officer '${fpName}' queued OFFLINE!` : `✅ Field Officer '${fpName}' registered ONLINE by Admin!`);
    setFpName('');
    setFpPhone('');
    setFpEmployeeId('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '16px auto' }}>
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={20} />
              Admin User Registration & Directory Workspace
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Top Tier Privilege: Admin can onboard Field Officers, Veterinarians, and Farmers.
            </p>
          </div>

          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            style={{
              padding: '6px 12px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: isOfflineMode ? '#FEF2F2' : '#ECFDF5',
              color: isOfflineMode ? '#DC2626' : '#059669',
              border: `1px solid ${isOfflineMode ? '#FCA5A5' : '#A7F3D0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            {isOfflineMode ? <WifiOff size={14} /> : <CheckCircle2 size={14} />}
            <span>{isOfflineMode ? 'Offline Field Mode' : 'Online Cloud Mode'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {successMessage}
        </div>
      )}

      {/* Registration Workspace */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('farmer')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: activeTab === 'farmer' ? 800 : 500,
              backgroundColor: activeTab === 'farmer' ? 'var(--primary)' : 'var(--surface-subtle)',
              color: activeTab === 'farmer' ? '#FFF' : 'var(--text-main)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Home size={16} />
            Onboard New Farmer
          </button>

          <button
            onClick={() => setActiveTab('vet')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: activeTab === 'vet' ? 800 : 500,
              backgroundColor: activeTab === 'vet' ? 'var(--primary)' : 'var(--surface-subtle)',
              color: activeTab === 'vet' ? '#FFF' : 'var(--text-main)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Stethoscope size={16} />
            Onboard New Veterinarian
          </button>

          <button
            onClick={() => setActiveTab('field')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: activeTab === 'field' ? 800 : 500,
              backgroundColor: activeTab === 'field' ? 'var(--primary)' : 'var(--surface-subtle)',
              color: activeTab === 'field' ? '#FFF' : 'var(--text-main)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <ClipboardList size={16} />
            Onboard Field Personnel (Admin Privilege)
          </button>
        </div>

        {activeTab === 'farmer' && (
          <form onSubmit={handleRegisterFarmer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Farmer Full Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number:</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Farm Name:</label>
              <input
                type="text"
                required
                placeholder="Surya Dairy Farm #14"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>District:</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              >
                <option value="Anand">Anand</option>
                <option value="Kheda">Kheda</option>
                <option value="Mehsana">Mehsana</option>
                <option value="Banaskantha">Banaskantha</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <UserCheck size={16} />
                Onboard Farmer
              </button>
            </div>
          </form>
        )}

        {activeTab === 'vet' && (
          <form onSubmit={handleRegisterVet} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Vet Name:</label>
              <input
                type="text"
                required
                placeholder="Dr. R. K. Sharma"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number:</label>
              <input
                type="text"
                required
                placeholder="+91 98220 11223"
                value={vetPhone}
                onChange={(e) => setVetPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Council Reg. Number:</label>
              <input
                type="text"
                required
                placeholder="GJ-4921"
                value={vetRegNo}
                onChange={(e) => setVetRegNo(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Stethoscope size={16} />
                Onboard Veterinarian
              </button>
            </div>
          </form>
        )}

        {activeTab === 'field' && (
          <form onSubmit={handleRegisterFieldPerson} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Field Officer Name:</label>
              <input
                type="text"
                required
                placeholder="Rajesh Kumar"
                value={fpName}
                onChange={(e) => setFpName(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number:</label>
              <input
                type="text"
                required
                placeholder="+91 98333 44556"
                value={fpPhone}
                onChange={(e) => setFpPhone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Employee ID:</label>
              <input
                type="text"
                required
                placeholder="FP-905"
                value={fpEmployeeId}
                onChange={(e) => setFpEmployeeId(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Assigned District:</label>
              <select
                value={fpDistrict}
                onChange={(e) => setFpDistrict(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
              >
                <option value="Anand">Anand</option>
                <option value="Kheda">Kheda</option>
                <option value="Mehsana">Mehsana</option>
                <option value="Banaskantha">Banaskantha</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ClipboardList size={16} />
                Register Field Officer (Admin Privilege)
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Directory Table */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
          Registered Directory ({users.length})
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 8 }}>NAME</th>
                <th style={{ padding: 8 }}>ROLE</th>
                <th style={{ padding: 8 }}>CONTACT / REG / EMP ID</th>
                <th style={{ padding: 8 }}>FARM / SCOPE</th>
                <th style={{ padding: 8 }}>REGISTERED BY</th>
                <th style={{ padding: 8 }}>SYNC STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 8, fontWeight: 700 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: u.role === 'Farmer' ? '#ECFDF5' : u.role === 'Vet' ? '#EFF6FF' : u.role === 'Field Personnel' ? '#E0F2FE' : '#F3E8FF',
                        color: u.role === 'Farmer' ? '#059669' : u.role === 'Vet' ? '#2563EB' : u.role === 'Field Personnel' ? '#0369A1' : '#7E22CE'
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    {u.phone} {u.vet_registration_number && `(Reg: ${u.vet_registration_number})`} {u.employee_id && `(ID: ${u.employee_id})`}
                  </td>
                  <td style={{ padding: 8 }}>{u.farm_name || u.district || 'Assigned Scope'}</td>
                  <td style={{ padding: 8, fontSize: 11, color: 'var(--text-muted)' }}>{u.registered_by}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: u.synced ? '#059669' : '#DC2626', fontWeight: 700 }}>
                      {u.synced ? 'Synced' : 'Offline Queued'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
