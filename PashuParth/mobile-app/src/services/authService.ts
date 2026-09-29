import { UserRole } from '../types';

export interface UserAccount {
  user_id: string;
  name: string;
  phone: string;
  role: UserRole;
  registered_by: string; // user_id of Admin or Field Personnel
  registered_at: string;
  synced: boolean;
  
  // Farmer specific
  farm_id?: string;
  farm_name?: string;
  district?: string;
  cattle_count?: number;
  buffalo_count?: number;
  
  // Vet specific
  vet_registration_number?: string;
  assigned_farms?: string[];

  // Field Personnel specific
  assigned_district?: string;
  employee_id?: string;
}

export const MOCK_USERS: UserAccount[] = [
  {
    user_id: 'usr-f01',
    name: 'Ramesh Patel (रमेश पटेल)',
    phone: '+91 98765 43210',
    role: 'Farmer',
    registered_by: 'usr-fp01 (Vikram Singh)',
    registered_at: '2026-09-01',
    synced: true,
    farm_id: 'f-01',
    farm_name: 'Surya Dairy Farm, Anand',
    district: 'Anand',
    cattle_count: 3,
    buffalo_count: 1
  },
  {
    user_id: 'usr-f02',
    name: 'Mahesh Bhai (महेश भाई)',
    phone: '+91 98980 12345',
    role: 'Farmer',
    registered_by: 'usr-fp01 (Vikram Singh)',
    registered_at: '2026-09-05',
    synced: true,
    farm_id: 'f-02',
    farm_name: 'Krishna Milk Dairy, Kheda',
    district: 'Kheda',
    cattle_count: 2,
    buffalo_count: 0
  },
  {
    user_id: 'usr-v01',
    name: 'Dr. R. K. Sharma',
    phone: '+91 98220 11223',
    role: 'Vet',
    registered_by: 'usr-fp01 (Vikram Singh)',
    registered_at: '2026-08-15',
    synced: true,
    vet_registration_number: 'GJ-4921',
    assigned_farms: ['f-01', 'f-02']
  },
  {
    user_id: 'usr-fp01',
    name: 'Vikram Singh (फील्ड ऑफिसर)',
    phone: '+91 98111 22334',
    role: 'Field Personnel',
    registered_by: 'usr-adm01 (Admin)',
    registered_at: '2026-07-01',
    synced: true,
    assigned_district: 'Anand',
    employee_id: 'FP-802'
  },
  {
    user_id: 'usr-adm01',
    name: 'State Animal Husbandry Authority',
    phone: '+91 1800 180 1551',
    role: 'Admin',
    registered_by: 'system',
    registered_at: '2026-01-01',
    synced: true
  },
  {
    user_id: 'usr-adm02',
    name: 'Gagandeep Singh (State Admin)',
    phone: '+91 78270 84489',
    role: 'Admin',
    registered_by: 'Primary Authority',
    registered_at: '2026-09-20',
    synced: true
  }
];

class AuthService {
  private users: UserAccount[] = [...MOCK_USERS];

  getUsers(): UserAccount[] {
    return this.users;
  }

  registerUser(user: Omit<UserAccount, 'user_id' | 'registered_at' | 'synced'>, isOffline: boolean = false): UserAccount {
    const newUser: UserAccount = {
      ...user,
      user_id: `usr-${Date.now()}`,
      registered_at: new Date().toISOString().split('T')[0],
      synced: !isOffline
    };

    this.users.unshift(newUser);
    return newUser;
  }

  getOfflineQueue(): UserAccount[] {
    return this.users.filter((u) => !u.synced);
  }

  syncOfflineQueue(): number {
    let count = 0;
    this.users = this.users.map((u) => {
      if (!u.synced) {
        count++;
        return { ...u, synced: true };
      }
      return u;
    });
    return count;
  }
}

export const authService = new AuthService();
