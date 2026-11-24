import React, { useState } from 'react';
import QRScanner from '../components/scanner/QRScanner';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

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

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleAllowEntry = (checkinData) => {
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
          maxWidth: '420px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--color-white)',
          padding: '14px 16px',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#027A48' }} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                Gate Verifier Station
              </span>
              <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
                Logged in as: {currentUser?.name || currentUser?.displayName || currentUser?.email || 'Verifier'}
              </div>
            </div>
          </div>

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

        {/* Event Selector & Gate Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-text)', display: 'block', marginBottom: '2px' }}>
              Active Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--color-gray)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-white)'
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
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--color-gray)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-white)'
              }}
            >
              <option value="Gate A">Gate A (Main)</option>
              <option value="Gate B">Gate B (Teams)</option>
              <option value="Gate VIP">Gate VIP</option>
            </select>
          </div>
        </div>

        {liveVerificationNotice && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
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
      <div style={{ width: '100%', maxWidth: '420px' }}>
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
          maxWidth: '420px',
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray)',
          borderRadius: '4px',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--color-muted-text)',
          lineHeight: '16px'
        }}
      >
        <strong>Verifier Notice:</strong> Only authorized gate verifiers, event organizers, and platform administrators can validate passes. Validated passes are marked as Used in Cloud Firestore immediately.
      </div>
    </div>
  );
}
