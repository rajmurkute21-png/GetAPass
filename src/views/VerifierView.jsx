import React, { useState } from 'react';
import QRScanner from '../components/scanner/QRScanner';
import { ShieldCheck } from 'lucide-react';

export default function VerifierView({
  checkinHistory = [],
  onRecordCheckin,
  onClearHistory
}) {
  const [selectedGate, setSelectedGate] = useState('Gate A');

  const handleAllowEntry = (checkinData) => {
    onRecordCheckin({
      ...checkinData,
      gate: selectedGate
    });
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
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-white)',
          padding: '12px 16px',
          border: '1px solid var(--color-gray)',
          borderRadius: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--color-deep-violet)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Station: Turnstile #1</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>Gate:</label>
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            style={{
              padding: '2px 8px',
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

      {/* The Mobile QR Scanner Interface */}
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <QRScanner
          history={checkinHistory}
          onAllowEntry={handleAllowEntry}
          onClearHistory={onClearHistory}
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
        <strong>Verifier Notice:</strong> Optical scanners automatically verify the cryptographic SHA-256 signature embedded inside each attendee pass. Do not admit attendees showing unverified screenshots.
      </div>
    </div>
  );
}
