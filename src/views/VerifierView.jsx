import React, { useState, useEffect, useCallback } from 'react';
import QRScanner from '../components/scanner/QRScanner';
import {
  ShieldCheck,
  ArrowLeft,
  Wifi,
  WifiOff,
  Cloud,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  downloadEventPassRoster,
  getCachedPassRoster,
  getOfflineCheckinsQueue,
  syncOfflineCheckins
} from '../services/verifierService.js';

export default function VerifierView({
  events = [],
  currentUser = null,
  checkinHistory = [],
  onRecordCheckin,
  onClearHistory,
  onBackToPortal
}) {
  const [selectedGate, setSelectedGate] = useState('Gate A');
  const [selectedEventId, setSelectedEventId] = useState(() => events[0]?.id || '');
  const [liveVerificationNotice, setLiveVerificationNotice] = useState(null);

  // Network & Offline Manifest State
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cachedPassesCount, setCachedPassesCount] = useState(0);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isDownloadingRoster, setIsDownloadingRoster] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncConflictNotice, setSyncConflictNotice] = useState(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  // Refresh cached manifest count and queue count
  const refreshOfflineStatus = useCallback(() => {
    if (selectedEventId) {
      const cached = getCachedPassRoster(selectedEventId);
      setCachedPassesCount(cached.length);
    }
    const queue = getOfflineCheckinsQueue();
    setPendingQueueCount(queue.length);
  }, [selectedEventId]);

  useEffect(() => {
    refreshOfflineStatus();
  }, [selectedEventId, refreshOfflineStatus]);

  // Handle Manual Roster Download for Offline Gate Operations
  const handleDownloadRoster = async () => {
    if (!selectedEventId || isDownloadingRoster) return;
    setIsDownloadingRoster(true);
    try {
      const result = await downloadEventPassRoster(selectedEventId);
      if (result.success) {
        setCachedPassesCount(result.count);
        setLiveVerificationNotice({
          type: 'success',
          text: `Offline Manifest updated: ${result.count} passes securely cached for gate scanning.`
        });
      } else {
        setLiveVerificationNotice({
          type: 'error',
          text: `Failed to download manifest: ${result.error || 'Check network connection'}`
        });
      }
    } catch (err) {
      setLiveVerificationNotice({
        type: 'error',
        text: `Error caching manifest: ${err.message}`
      });
    } finally {
      setIsDownloadingRoster(false);
      setTimeout(() => setLiveVerificationNotice(null), 5000);
    }
  };

  // Handle Flush / Sync Offline Check-in Queue to Cloud Firestore
  const handleSyncQueue = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncConflictNotice(null);

    try {
      const syncResult = await syncOfflineCheckins(currentUser);
      refreshOfflineStatus();

      if (syncResult.conflictCount > 0) {
        setSyncConflictNotice({
          count: syncResult.conflictCount,
          conflicts: syncResult.conflicts
        });
      }

      if (syncResult.syncedCount > 0) {
        setLiveVerificationNotice({
          type: 'success',
          text: `Cloud Sync complete: ${syncResult.syncedCount} offline check-ins verified in Firestore.`
        });
      } else if (syncResult.conflictCount === 0 && (!syncResult.errors || syncResult.errors.length === 0)) {
        setLiveVerificationNotice({
          type: 'success',
          text: 'Cloud Sync complete: All records are up to date.'
        });
      }
    } catch (err) {
      console.warn('[GateApass Verifier] Sync error:', err);
      setLiveVerificationNotice({
        type: 'error',
        text: `Sync failed: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setLiveVerificationNotice(null), 6000);
    }
  }, [currentUser, isSyncing, refreshOfflineStatus]);

  // Network listener & Auto-sync on reconnection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync queued offline scans on reconnection
      const queue = getOfflineCheckinsQueue();
      if (queue.length > 0) {
        handleSyncQueue();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleSyncQueue]);

  // Auto-download offline manifest once online when active event is loaded
  useEffect(() => {
    if (selectedEventId && isOnline && cachedPassesCount === 0) {
      downloadEventPassRoster(selectedEventId).then((res) => {
        if (res.success) setCachedPassesCount(res.count);
      }).catch(() => {});
    }
  }, [selectedEventId, isOnline, cachedPassesCount]);

  const handleAllowEntry = (checkinData) => {
    refreshOfflineStatus();

    if (checkinData.result === 'Valid') {
      setLiveVerificationNotice({
        type: 'success',
        text: `Pass ${checkinData.passId} verified: Access Granted for ${checkinData.participant}.`
      });
    } else {
      setLiveVerificationNotice({
        type: 'error',
        text: `Pass ${checkinData.passId} denied: ${checkinData.reason || 'Invalid pass.'}`
      });
    }

    if (onRecordCheckin) {
      onRecordCheckin({
        ...checkinData,
        gate: selectedGate,
        event: selectedEvent?.title || checkinData.event || 'Campus Event',
        verifier: currentUser?.name || currentUser?.displayName || 'Gate Verifier',
        verificationStatus: checkinData.result === 'Valid' ? 'Valid' : 'Warning'
      });
    }

    setTimeout(() => setLiveVerificationNotice(null), 5000);
  };

  return (
    <div
      className="gateapass-verifier-view"
      style={{
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: 'var(--color-off-white)',
        padding: '32px 16px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}
    >
      {/* Top Mobile Verifier Info Banner */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--color-white)',
          padding: '16px',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} style={{ color: '#027A48' }} />
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                Gate Verifier Station
              </span>
              <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
                Staff: {currentUser?.name || currentUser?.displayName || currentUser?.email || 'Verifier'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Network Badge */}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: isOnline ? '#ECFDF5' : '#FEF3F2',
                color: isOnline ? '#065F46' : '#991B1B',
                border: `1px solid ${isOnline ? '#A7F3D0' : '#FECACA'}`
              }}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-muted-text)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-control)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={13} />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Event Selector & Gate Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-text)', display: 'block', marginBottom: '2px' }}>
              Active Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--color-gray)',
                borderRadius: '6px',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-dark-text)'
              }}
            >
              {events.length > 0 ? (
                events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))
              ) : (
                <option value="">All Campus Events</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-text)', display: 'block', marginBottom: '2px' }}>
              Turnstile Gate:
            </label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--color-gray)',
                borderRadius: '6px',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-dark-text)'
              }}
            >
              <option value="Gate A">Gate A (Main)</option>
              <option value="Gate B">Gate B (North)</option>
              <option value="Gate VIP">Gate VIP</option>
              <option value="Gate Student">Gate Student</option>
            </select>
          </div>
        </div>

        {/* Offline Manifest & Synchronization Bar */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
            <Cloud size={14} style={{ color: '#7C3AED' }} />
            <span>
              Manifest: <strong>{cachedPassesCount}</strong> passes
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Refresh/Download Offline Manifest Button */}
            <button
              type="button"
              onClick={handleDownloadRoster}
              disabled={isDownloadingRoster || !isOnline}
              title="Download pass registry for offline scanning"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                color: isOnline ? '#7C3AED' : '#94A3B8',
                cursor: isOnline ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={12} />
              <span>{isDownloadingRoster ? 'Caching...' : 'Sync Manifest'}</span>
            </button>

            {/* Sync Pending Queue Button */}
            {pendingQueueCount > 0 && (
              <button
                type="button"
                onClick={handleSyncQueue}
                disabled={isSyncing || !isOnline}
                title="Sync queued offline check-ins to Cloud Firestore"
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#FEF3F2',
                  border: '1px solid #FECDCA',
                  borderRadius: '6px',
                  color: '#B42318',
                  cursor: isOnline ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : `Sync Queue (${pendingQueueCount})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Conflict Alert Banner */}
        {syncConflictNotice && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <AlertTriangle size={15} style={{ color: '#D97706' }} />
              <span>Offline Sync Conflict: {syncConflictNotice.count} duplicate entry attempt(s) detected!</span>
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: '15px' }}>
              One or more passes scanned offline were already admitted online at another gate. An immutable duplicate audit trail was logged to Cloud Firestore.
            </div>
          </div>
        )}

        {/* Live Status Toast Banner */}
        {liveVerificationNotice && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: liveVerificationNotice.type === 'success' ? '#ECFDF3' : '#FEF3F2',
              color: liveVerificationNotice.type === 'success' ? '#027A48' : '#B42318',
              border: `1px solid ${liveVerificationNotice.type === 'success' ? '#A6F4C5' : '#FECDCA'}`
            }}
          >
            {liveVerificationNotice.text}
          </div>
        )}
      </div>

      {/* The Mobile QR Scanner Interface */}
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <QRScanner
          history={checkinHistory}
          onAllowEntry={handleAllowEntry}
          onClearHistory={onClearHistory}
          currentEvent={selectedEvent}
          gate={selectedGate}
          verifierUser={currentUser}
        />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray)',
          borderRadius: '8px',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--color-muted-text)',
          lineHeight: '16px'
        }}
      >
        <strong>Verifier Notice:</strong> Only authorized gate verifiers, event organizers, and platform administrators can validate passes. Validated passes are marked as Used in Cloud Firestore immediately. If offline, passes are validated against the downloaded manifest and automatically synced upon reconnection.
      </div>
    </div>
  );
}
