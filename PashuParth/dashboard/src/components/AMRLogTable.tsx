import React from 'react';
import { AMRRecord } from '../types';
import { FileCheck, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

interface Props {
  records: AMRRecord[];
}

export const AMRLogTable: React.FC<Props> = ({ records }) => {
  return (
    <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCheck size={18} />
            Veterinary Treatment & Antimicrobial Resistance (AMR) Audit Trail
          </h4>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Immutable withdrawal period monitoring to prevent antibiotic residues in cooperative milk supply.
          </p>
        </div>

        <span style={{ fontSize: 11, backgroundColor: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
          100% Audit Compliance
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 11 }}>
              <th style={{ padding: '10px 12px' }}>ANIMAL & RFID</th>
              <th style={{ padding: '10px 12px' }}>FARM</th>
              <th style={{ padding: '10px 12px' }}>DRUG / TREATMENT</th>
              <th style={{ padding: '10px 12px' }}>ATTENDING VET</th>
              <th style={{ padding: '10px 12px' }}>WITHDRAWAL UNTIL</th>
              <th style={{ padding: '10px 12px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const isWithdrawal = r.status === 'Active Withdrawal';
              return (
                <tr key={r.log_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.animal_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.rfid_tag}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 12 }}>{r.farm_name}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{r.drug_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.dosage}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 12 }}>{r.vet_name}</td>
                  <td style={{ padding: '12px', fontSize: 12, fontWeight: 700 }}>{r.withdrawal_ends_date}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: isWithdrawal ? '#FEF2F2' : '#ECFDF5',
                        color: isWithdrawal ? '#DC2626' : '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isWithdrawal ? <Clock size={12} /> : <CheckCircle size={12} />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
