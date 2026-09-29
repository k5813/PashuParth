import React from 'react';
import { AMRRecord } from '../mockData';
import { FileCheck, Clock, CheckCircle } from 'lucide-react';

interface Props {
  records: AMRRecord[];
}

export const AMRLogTable: React.FC<Props> = ({ records }) => {
  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCheck size={18} />
            Veterinary AMR Treatment Log
          </h4>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Antibiotic milk withdrawal period tracking for milk residue safety.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 11 }}>
              <th style={{ padding: '8px' }}>ANIMAL</th>
              <th style={{ padding: '8px' }}>DRUG / DOSAGE</th>
              <th style={{ padding: '8px' }}>VET</th>
              <th style={{ padding: '8px' }}>WITHDRAWAL UNTIL</th>
              <th style={{ padding: '8px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const isWithdrawal = r.status === 'Active Withdrawal';
              return (
                <tr key={r.log_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px' }}>
                    <div style={{ fontWeight: 700 }}>{r.animal_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.rfid_tag}</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{r.drug_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.dosage}</div>
                  </td>
                  <td style={{ padding: '8px', fontSize: 11 }}>{r.vet_name}</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{r.withdrawal_ends_date}</td>
                  <td style={{ padding: '8px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: isWithdrawal ? '#FEF2F2' : '#ECFDF5',
                        color: isWithdrawal ? '#DC2626' : '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isWithdrawal ? <Clock size={11} /> : <CheckCircle size={11} />}
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
