import React, { useState } from 'react';
import {
  Scan,
  Flashlight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  History
} from 'lucide-react';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';

export default function QRScanner({
  onAllowEntry,
  history = [],
  onClearHistory
}) {
  const [scanState, setScanState] = useState('idle'); // 'idle' | 'valid' | 'invalid' | 'expired' | 'cancelled'
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history'
  const [torchOn, setTorchOn] = useState(false);
  const [scannedPass, setScannedPass] = useState(null);

  // Demo scan triggers
  const triggerScan = (type) => {
    setScanState(type);
    if (type === 'valid') {
      setScannedPass({
        passId: 'GP-TF26-9481',
        name: 'Aarav Shah',
        event: 'TechFest 2026',
        authority: 'Participant',
        permissions: ['General Area', 'Workshop Area'],
        gate: 'Gate A',
        status: 'Active'
      });
    } else if (type === 'invalid') {
      setScannedPass({
        passId: 'GP-INV-0919',
        name: 'Unknown',
        event: 'Unverified Signature',
        authority: 'None',
        permissions: [],
        gate: 'Gate A',
        status: 'Invalid'
      });
    } else if (type === 'expired') {
      setScannedPass({
        passId: 'GP-EXP-2025',
        name: 'Kunal Patil',
        event: 'TechFest 2025 (Last Year)',
        authority: 'Participant',
        permissions: [],
        gate: 'Gate A',
        status: 'Expired'
      });
    } else if (type === 'cancelled') {
      setScannedPass({
        passId: 'GP-WF26-0921',
        name: 'Rohan Verma',
        event: 'Waves Campus Fest 2026',
        authority: 'Participant',
        permissions: [],
        gate: 'Gate A',
        status: 'Cancelled'
      });
    }
  };

  const handleAllowEntry = () => {
    if (scannedPass && onAllowEntry) {
      onAllowEntry({
        passId: scannedPass.passId,
        participant: scannedPass.name,
        event: scannedPass.event,
        gate: 'Gate A',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: 'Valid'
      });
    }
    setScanState('idle');
    setScannedPass(null);
  };

  const handleReset = () => {
    setScanState('idle');
    setScannedPass(null);
  };

  return (
    <div
      className="gateapass-verifier-screen"
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        textAlign: 'left',
        boxShadow: 'none'
      }}
    >
      {/* Top Header matching Screenshot 28 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-gray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-white)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Verify pass
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
            TechFest 2026 · Gate A &nbsp;|&nbsp; Verifier: Riya Nair
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'scan' ? 'history' : 'scan')}
            style={{
              padding: '6px 10px',
              backgroundColor: activeTab === 'history' ? 'var(--color-light-violet)' : 'var(--color-off-white)',
              color: activeTab === 'history' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
              border: '1px solid var(--color-gray)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <History size={14} />
            History ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div style={{ padding: '20px', minHeight: '440px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Check-in History</h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                style={{ fontSize: '12px', color: 'var(--color-muted-text)', textDecoration: 'underline' }}
              >
                Clear Log
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-muted-text)' }}>
              No check-ins recorded yet this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      {item.participant}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                      {item.passId} · {item.gate} · {item.time}
                    </div>
                  </div>
                  <StatusBadge status={item.result} />
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            fullWidth
            style={{ marginTop: '20px' }}
            onClick={() => setActiveTab('scan')}
          >
            Back to Scanner
          </Button>
        </div>
      ) : (
        <>
          {/* Dark Scanner Camera Viewport matching Screenshot 28 */}
          <div
            style={{
              backgroundColor: 'var(--color-near-black)',
              height: '280px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Scanner Target Frame */}
            <div
              style={{
                width: '180px',
                height: '180px',
                border:
                  scanState === 'valid'
                    ? '2.5px solid var(--color-success)'
                    : scanState === 'invalid' || scanState === 'cancelled'
                    ? '2.5px solid var(--color-error)'
                    : scanState === 'expired'
                    ? '2.5px solid var(--color-warning)'
                    : '2.5px solid var(--color-violet)',
                borderRadius: '8px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                transition: 'border-color 0.2s ease'
              }}
            >
              {/* Illustrative QR or scanning beam */}
              <div style={{ opacity: 0.9 }}>
                <svg viewBox="0 0 24 24" width="100" height="100" fill="white">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm8-2h3v3h-3v-3zm5 0h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3z" />
                </svg>
              </div>

              {/* Scanning indicator animated bar */}
              {scanState === 'idle' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'var(--color-violet)',
                    boxShadow: '0 0 8px var(--color-violet)'
                  }}
                />
              )}
            </div>

            {/* Torch toggle */}
            <button
              type="button"
              onClick={() => setTorchOn(!torchOn)}
              aria-label="Toggle flashlight"
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                backgroundColor: torchOn ? 'var(--color-white)' : 'rgba(255,255,255,0.2)',
                color: torchOn ? 'var(--color-black)' : 'var(--color-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flashlight size={18} />
            </button>
          </div>

          {/* Verification Status & Details Area */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {scanState === 'idle' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scan size={20} style={{ color: 'var(--color-violet)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    Ready to scan
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
                  Align the QR code inside the frame. The attendee's event, payment and entry status will be checked automatically.
                </p>
              </>
            )}

            {scanState === 'valid' && scannedPass && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={22} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>
                    ✓ Valid Pass
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-off-white)',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Name:</span>
                    <span style={{ fontWeight: 600 }}>{scannedPass.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Pass ID:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-deep-violet)' }}>{scannedPass.passId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Event:</span>
                    <span>{scannedPass.event}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Authority:</span>
                    <span style={{ fontWeight: 600 }}>{scannedPass.authority}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Permissions:</span>
                    <span>{scannedPass.permissions.join(', ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted-text)' }}>Status:</span>
                    <StatusBadge status="Valid" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" onClick={handleReset} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAllowEntry} style={{ flex: 1 }}>
                    Allow Entry
                  </Button>
                </div>
              </div>
            )}

            {scanState === 'invalid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={22} style={{ color: 'var(--color-error)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-error)' }}>
                    ✕ Invalid Pass
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>
                  This pass has an unrecognized cryptographic signature or does not match any registered event.
                </p>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Another Pass
                </Button>
              </div>
            )}

            {scanState === 'expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={22} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-warning)' }}>
                    Pass Expired
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>
                  This pass was issued for a past date or the gate check-in window has elapsed.
                </p>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Another Pass
                </Button>
              </div>
            )}

            {scanState === 'cancelled' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={22} style={{ color: 'var(--color-error)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-error)' }}>
                    Pass Cancelled
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>
                  This pass has been refunded or suspended by the event organizers. Do not permit entry.
                </p>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Another Pass
                </Button>
              </div>
            )}

            {/* Quick Demo Simulator Bar for testing all scanner scenarios */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-gray)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                Test Verifier States:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => triggerScan('valid')}
                  style={{
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-success)',
                    color: 'var(--color-success)'
                  }}
                >
                  ✓ Valid
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('invalid')}
                  style={{
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)'
                  }}
                >
                  ✕ Invalid
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('expired')}
                  style={{
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-warning)',
                    color: 'var(--color-warning)'
                  }}
                >
                  Expired
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('cancelled')}
                  style={{
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)'
                  }}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
