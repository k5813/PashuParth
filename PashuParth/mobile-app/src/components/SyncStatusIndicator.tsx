import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { watermelonDB } from '../db/watermelondb';
import { synchronizeWithSupabase } from '../db/syncAdapter';

export const SyncStatusIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [pendingQueue, setPendingQueue] = useState<number>(0);

  // Update pending queue badge count
  const refreshQueueCount = () => {
    const pending = watermelonDB.getPendingUnsyncedCount();
    setPendingQueue(pending);
  };

  useEffect(() => {
    refreshQueueCount();
    
    const handleDBChange = () => {
      refreshQueueCount();
    };

    // Auto sync when browser comes online
    const handleOnline = async () => {
      setSyncState('syncing');
      await synchronizeWithSupabase();
      refreshQueueCount();
      setSyncState('synced');
    };

    const handleOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('watermelon-db-change', handleDBChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('watermelon-db-change', handleDBChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    watermelonDB.setSimulatedOffline(false);
    setSyncState('syncing');
    const res = await synchronizeWithSupabase();
    refreshQueueCount();
    setSyncState(res.success ? 'synced' : 'offline');
  };

  const toggleOfflineMode = () => {
    if (syncState === 'synced') {
      watermelonDB.setSimulatedOffline(true);
      setSyncState('offline');
      refreshQueueCount();
    } else if (syncState === 'offline') {
      watermelonDB.setSimulatedOffline(false);
      handleManualSync({ stopPropagation: () => {} } as any);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleManualSync}
        title="WatermelonDB Offline Datastore - Click to Sync with Supabase"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 'var(--radius-full, 9999px)',
          backgroundColor: syncState === 'offline' ? '#FEF2F2' : syncState === 'syncing' ? '#EFF6FF' : '#ECFDF5',
          color: syncState === 'offline' ? '#DC2626' : syncState === 'syncing' ? '#2563EB' : '#059669',
          border: `1px solid ${syncState === 'offline' ? '#FCA5A5' : syncState === 'syncing' ? '#93C5FD' : '#A7F3D0'}`,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        {syncState === 'synced' && (
          <>
            <CheckCircle2 size={14} />
            <span>WatermelonDB Synced</span>
          </>
        )}
        {syncState === 'syncing' && (
          <>
            <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Syncing Supabase...</span>
          </>
        )}
        {syncState === 'offline' && (
          <>
            <WifiOff size={14} />
            <span>Offline ({pendingQueue} queued in WatermelonDB)</span>
          </>
        )}
      </button>

      <button
        onClick={toggleOfflineMode}
        title="Toggle Offline Sim Mode"
        style={{
          fontSize: 10,
          color: '#6B7280',
          background: 'none',
          border: 'none',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
      >
        {syncState === 'offline' ? 'Simulate Online' : 'Simulate Offline'}
      </button>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

