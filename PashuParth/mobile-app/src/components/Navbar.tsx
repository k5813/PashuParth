import React from 'react';
import { UserAccount } from '../services/authService';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { Sun, Globe, LogOut, UserCheck } from 'lucide-react';

interface Props {
  currentUser: UserAccount | null;
  onLogout: () => void;
  lang: 'EN' | 'HI';
  onLangToggle: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onLogout,
  lang,
  onLangToggle,
  isHighContrast,
  onToggleHighContrast
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '10px 16px'
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#FFF',
              boxShadow: '0 2px 8px rgba(47, 111, 78, 0.25)'
            }}
          >
            🐄
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              PashuParth
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
              {lang === 'HI' ? 'पशुपार्थ — दुग्ध AI पूर्वाभास' : 'AI Bovine Mastitis Early Warning'}
            </div>
          </div>
        </div>

        {/* Sync & Active User Session Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SyncStatusIndicator />

          {/* Active Logged-In User Profile */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--primary-light)',
                  padding: '4px 10px',
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
                onClick={onLogout}
                title="Log out of PashuParth session"
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
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

          {/* Outdoor Mode & Lang Toggle */}
          <button
            onClick={onToggleHighContrast}
            title="Toggle Outdoor High-Contrast Sunlight Mode"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: isHighContrast ? '#000000' : 'var(--surface-subtle)',
              color: isHighContrast ? '#FFFFFF' : 'var(--text-main)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Sun size={14} />
            <span>{isHighContrast ? 'Outdoor Hi-Vis' : 'Standard'}</span>
          </button>

          <button
            onClick={onLangToggle}
            title="Toggle Multilingual Language (English / हिन्दी)"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Globe size={14} />
            <span>{lang === 'EN' ? 'EN | हिन्दी' : 'हिन्दी | EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
