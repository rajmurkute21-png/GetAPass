import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Flashlight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  History,
  Camera,
  RefreshCw,
  Upload,
  Keyboard,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  SwitchCamera
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import StatusBadge from '../common/StatusBadge';
import { verifyPassOffline } from '../../services/verifierService';
import { verifyAndCheckinPass } from '../../services/bookingService';

export default function QRScanner({
  onAllowEntry,
  history = [],
  onClearHistory,
  currentEvent = null,
  gate = 'Gate A',
  verifierUser = null
}) {
  const [scanState, setScanState] = useState('idle'); // 'idle' | 'valid' | 'invalid' | 'already-used' | 'cancelled' | 'wrong-event' | 'expired'
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history' | 'manual'
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [scannedPass, setScannedPass] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Real Camera & Stream state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningLoopRef = useRef(null);

  // Manual & Upload Input
  const [manualCode, setManualCode] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Camera Management
  const startCamera = async (facing = facingMode) => {
    setCameraError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startBarcodeDetection();
      }
    } catch (err) {
      console.warn('[GateApass QR] Camera start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings to scan physical or digital passes.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can verify passes using manual entry or upload.');
      } else {
        setCameraError(`Camera initialization error: ${err.message || 'Please check permissions.'}`);
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanningLoopRef.current) {
      cancelAnimationFrame(scanningLoopRef.current);
      scanningLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        try {
          const nextTorch = !torchOn;
          await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
          setTorchOn(nextTorch);
        } catch (err) {
          console.warn('[GateApass QR] Torch error:', err);
        }
      } else {
        alert('Flashlight/torch is not supported by this camera.');
      }
    }
  };

  // Start Barcode Detection using native browser BarcodeDetector API
  const startBarcodeDetection = () => {
    if (typeof window === 'undefined') return;

    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const checkFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanningLoopRef.current = requestAnimationFrame(checkFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleProcessScannedCode(rawValue);
              return; // Stop loop after code detected
            }
          }
        } catch {
          // ignore detection frame drops
        }

        scanningLoopRef.current = requestAnimationFrame(checkFrame);
      };

      scanningLoopRef.current = requestAnimationFrame(checkFrame);
    }
  };

  // Turnstile verification processor for raw scanned payloads
  const handleProcessScannedCode = async (rawCode) => {
    if (!rawCode || isVerifying) return;
    setIsVerifying(true);

    let parsedPassId = String(rawCode).trim();
    // Support JSON payloads e.g. { passId: 'GP-...', eventId: '...' }
    try {
      if (parsedPassId.startsWith('{') && parsedPassId.endsWith('}')) {
        const json = JSON.parse(parsedPassId);
        parsedPassId = json.passId || json.id || parsedPassId;
      }
    } catch {}

    const targetEventId = currentEvent?.id || null;

    try {
      // 1. If online and booking service available, verify in registry
      if (!isOfflineMode && verifierUser) {
        const result = await verifyAndCheckinPass({
          passCode: parsedPassId,
          eventId: targetEventId,
          verifierUser,
          gate
        });

        if (result.valid) {
          setScanState('valid');
          setScannedPass({
            passId: parsedPassId,
            name: result.attendeeName || 'Registered Attendee',
            event: result.eventTitle || currentEvent?.title || 'Campus Event',
            authority: result.booking?.passType || 'General Entry',
            permissions: ['Campus Gate Entry', 'Authorized Seating'],
            gate: gate || 'Gate A',
            status: 'Valid'
          });
          setStatusReason('Entry verified and authorized in real-time registry.');
        } else if (result.alreadyUsed) {
          setScanState('already-used');
          setScannedPass(result.booking || { passId: parsedPassId });
          setStatusReason(result.reason || 'This pass was already used earlier today. Duplicate entry blocked.');
        } else if (result.reason?.includes('different event') || result.reason?.includes('Wrong event')) {
          setScanState('wrong-event');
          setScannedPass(result.booking || { passId: parsedPassId });
          setStatusReason(result.reason || 'Pass belongs to a different event.');
        } else if (result.booking?.status === 'Cancelled' || result.reason?.includes('Cancelled')) {
          setScanState('cancelled');
          setScannedPass(result.booking || { passId: parsedPassId });
          setStatusReason(result.reason || 'Pass has been cancelled or refunded.');
        } else if (result.booking?.status === 'Expired' || result.reason?.includes('Expired')) {
          setScanState('expired');
          setScannedPass(result.booking || { passId: parsedPassId });
          setStatusReason(result.reason || 'Pass has expired.');
        } else {
          setScanState('invalid');
          setStatusReason(result.reason || 'Unrecognized pass or invalid cryptographic signature.');
        }
      } else {
        // 2. Offline fallback mode: verify against cached pass roster
        const offlineResult = verifyPassOffline(parsedPassId, targetEventId);

        if (offlineResult.valid) {
          setScanState('valid');
          setScannedPass({
            passId: parsedPassId,
            name: offlineResult.attendeeName,
            event: offlineResult.eventTitle,
            authority: offlineResult.passType,
            permissions: ['Offline Gate Authorized'],
            gate: gate || 'Gate A',
            status: 'Valid (Offline Cached)'
          });
          setStatusReason('Verified against local offline pass roster.');
        } else if (offlineResult.status === 'Already-used') {
          setScanState('already-used');
          setStatusReason(offlineResult.reason);
        } else if (offlineResult.status === 'Wrong-event') {
          setScanState('wrong-event');
          setStatusReason(offlineResult.reason);
        } else if (offlineResult.status === 'Cancelled') {
          setScanState('cancelled');
          setStatusReason(offlineResult.reason);
        } else {
          setScanState('invalid');
          setStatusReason(offlineResult.reason || 'Pass not recognized in local offline roster.');
        }
      }
    } catch (err) {
      console.warn('[GateApass QR] Processing error:', err);
      // Fallback evaluation
      setScanState('invalid');
      setStatusReason(err?.message || 'Verification failed. Please check network or roster.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Manual Code Submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScannedCode(manualCode.trim());
    setManualCode('');
  };

  // Handle Image Upload QR decoding
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ('BarcodeDetector' in window) {
      try {
        const imageBitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          handleProcessScannedCode(barcodes[0].rawValue);
        } else {
          alert('No QR code detected in the uploaded image. Please try a clearer picture.');
        }
      } catch (err) {
        alert('Could not decode QR code from image: ' + err.message);
      }
    } else {
      alert('QR Image file detection requires modern browser support. Please use camera scan or manual code input.');
    }
  };

  // Start / Stop camera when tab changes
  useEffect(() => {
    if (activeTab === 'scan' && scanState === 'idle') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, scanState]);

  // Demo scan triggers for rapid manual / automated verification testing
  const triggerScan = (type) => {
    setScanState(type);
    if (type === 'valid') {
      setScannedPass({
        passId: 'GP-TF26-9481',
        name: 'Aarav Shah',
        event: currentEvent?.title || 'TechFest 2026',
        authority: 'VIP Admission',
        permissions: ['General Area', 'VIP Lounge', 'Workshop Area'],
        gate: gate || 'Gate A',
        status: 'Active'
      });
      setStatusReason('Entry verified and authorized.');
    } else if (type === 'already-used') {
      setScannedPass({
        passId: 'GP-USED-9021',
        name: 'Siddharth Rao',
        event: currentEvent?.title || 'TechFest 2026'
      });
      setStatusReason('This pass was already checked in today at 10:14 AM at Gate A. Duplicate scan blocked.');
    } else if (type === 'wrong-event') {
      setScannedPass({
        passId: 'GP-WRG-4412',
        name: 'Priya Sharma',
        event: 'Inter-College Sports 2026'
      });
      setStatusReason(`Wrong event: Pass is registered for "Inter-College Sports 2026", not ${currentEvent?.title || 'this event'}.`);
    } else if (type === 'invalid') {
      setScannedPass({
        passId: 'GP-INV-0919',
        name: 'Unknown Attendee',
        event: 'Unverified Signature'
      });
      setStatusReason('Unrecognized pass identifier or unverified cryptographic QR payload.');
    } else if (type === 'expired') {
      setScannedPass({
        passId: 'GP-EXP-2025',
        name: 'Kunal Patil',
        event: 'TechFest 2025'
      });
      setStatusReason('This pass was issued for a previous date and has expired.');
    } else if (type === 'cancelled') {
      setScannedPass({
        passId: 'GP-CNL-0921',
        name: 'Rohan Verma',
        event: currentEvent?.title || 'Campus Fest'
      });
      setStatusReason('This ticket was cancelled or refunded. Entry strictly denied.');
    }
  };

  const handleAllowEntry = () => {
    if (scannedPass && onAllowEntry) {
      onAllowEntry({
        passId: scannedPass.passId,
        participant: scannedPass.name,
        event: scannedPass.event,
        gate: gate || 'Gate A',
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
    setStatusReason('');
  };

  return (
    <div
      className="gateapass-verifier-screen"
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        textAlign: 'left'
      }}
    >
      {/* Top Header */}
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
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-dark-text)', margin: 0 }}>
            Gate Pass Scanner
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '2px 0 0' }}>
            {currentEvent?.title || 'Campus Event'} · {gate} &nbsp;|&nbsp; {isOfflineMode ? 'Offline Mode' : 'Live Sync'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 10px',
              backgroundColor: activeTab === 'history' ? '#F3E8FF' : '#F8FAFC',
              color: activeTab === 'history' ? '#7C3AED' : '#475569',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <History size={14} />
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Camera Scan | Manual Entry */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-gray)', backgroundColor: '#F8FAFC' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('scan'); handleReset(); }}
          style={{
            flex: 1,
            height: '40px',
            border: 'none',
            borderBottom: activeTab === 'scan' ? '2px solid #7C3AED' : 'none',
            backgroundColor: activeTab === 'scan' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'scan' ? '#7C3AED' : '#64748B',
            fontWeight: activeTab === 'scan' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Camera size={15} />
          Camera Scan
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('manual'); stopCamera(); }}
          style={{
            flex: 1,
            height: '40px',
            border: 'none',
            borderBottom: activeTab === 'manual' ? '2px solid #7C3AED' : 'none',
            backgroundColor: activeTab === 'manual' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'manual' ? '#7C3AED' : '#64748B',
            fontWeight: activeTab === 'manual' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Keyboard size={15} />
          Manual / Upload
        </button>
      </div>

      {/* VIEW 1: Check-in History */}
      {activeTab === 'history' && (
        <div style={{ padding: '20px', minHeight: '440px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Check-in History</h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                style={{ fontSize: '12px', color: '#64748B', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Clear Log
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-muted-text)', fontSize: '13px' }}>
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
                    borderRadius: '8px',
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
      )}

      {/* VIEW 2: Manual Pass ID Input & File Upload for Physical Tickets */}
      {activeTab === 'manual' && (
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Physical & Manual Pass Verification
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
              Verify printed physical tickets, digital pass IDs, or handheld laser scanner feeds.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Pass ID or Raw QR Code"
              placeholder="e.g. GP-2026-1 or paste QR string"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              helperText="Press Enter or tap Verify Pass"
            />
            <Button variant="primary" type="submit" fullWidth disabled={!manualCode.trim() || isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify Pass ID'}
            </Button>
          </form>

          <div style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Upload QR Image from Printed / Mobile Pass:
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                border: '1.5px dashed #CBD5E1',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#7C3AED'
              }}
            >
              <Upload size={18} />
              <span>Select Pass Image File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* VIEW 3: Active Scanner Camera Viewport */}
      {activeTab === 'scan' && (
        <>
          <div
            style={{
              backgroundColor: '#0F172A',
              height: '280px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Live Video Camera Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive ? 'block' : 'none'
              }}
            />

            {/* Camera Error / Permission Fallback View */}
            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#1E293B',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  gap: '12px',
                  color: '#FFFFFF'
                }}
              >
                <Camera size={36} color="#EC4899" />
                <p style={{ fontSize: '13px', margin: 0, color: '#E2E8F0', maxWidth: '320px' }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => startCamera(facingMode)}
                    style={{ backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '12px' }}
                  >
                    Retry Camera
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Keyboard}
                    onClick={() => setActiveTab('manual')}
                    style={{ fontSize: '12px' }}
                  >
                    Manual Input
                  </Button>
                </div>
              </div>
            )}

            {/* Scanner Target Frame */}
            {!cameraError && (
              <div
                style={{
                  width: '190px',
                  height: '190px',
                  border:
                    scanState === 'valid'
                      ? '3px solid #10B981'
                      : scanState === 'invalid' || scanState === 'cancelled'
                      ? '3px solid #EF4444'
                      : scanState === 'already-used' || scanState === 'expired'
                      ? '3px solid #F59E0B'
                      : scanState === 'wrong-event'
                      ? '3px solid #8B5CF6'
                      : '3px solid #7C3AED',
                  borderRadius: '12px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  transition: 'border-color 0.2s ease',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)'
                }}
              >
                {/* Illustrative QR or scanning beam */}
                {scanState === 'idle' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20%',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#7C3AED'
                    }}
                  />
                )}
              </div>
            )}

            {/* Camera Floating Controls: Flip Camera & Torch */}
            {cameraActive && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch Camera (Front/Back)"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <SwitchCamera size={18} />
                </button>
                <button
                  type="button"
                  onClick={toggleTorch}
                  title="Toggle Flashlight"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: torchOn ? '#FFFFFF' : 'rgba(0,0,0,0.6)',
                    color: torchOn ? '#000000' : '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Flashlight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Verification Status & Details Screen */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {scanState === 'idle' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scan size={20} style={{ color: '#7C3AED' }} />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    Ready to scan QR pass
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '18px', margin: 0 }}>
                  Align the digital pass on a phone or a printed physical ticket within the target frame. Pass validity, event scope, and check-in history will be validated.
                </p>
              </>
            )}

            {/* 1. VALID PASS */}
            {scanState === 'valid' && scannedPass && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={24} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#059669' }}>
                    ✓ Valid Pass – Entry Authorized
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '14px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#065F46' }}>Attendee:</span>
                    <span style={{ fontWeight: 700 }}>{scannedPass.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#065F46' }}>Pass ID:</span>
                    <span style={{ fontWeight: 800, color: '#7C3AED' }}>{scannedPass.passId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#065F46' }}>Tier / Category:</span>
                    <span style={{ fontWeight: 600 }}>{scannedPass.authority}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#065F46' }}>Event:</span>
                    <span>{scannedPass.event}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#065F46' }}>Gate:</span>
                    <span>{gate}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" onClick={handleReset} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAllowEntry} style={{ flex: 1, backgroundColor: '#059669' }}>
                    Allow Entry
                  </Button>
                </div>
              </div>
            )}

            {/* 2. ALREADY-USED PASS */}
            {scanState === 'already-used' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={24} style={{ color: '#D97706' }} />
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#D97706' }}>
                    Pass Already Used
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#92400E'
                  }}
                >
                  {statusReason || 'This individual pass has already been used for entry. Duplicate check-in denied.'}
                </div>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Next Pass
                </Button>
              </div>
            )}

            {/* 3. WRONG EVENT */}
            {scanState === 'wrong-event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={24} style={{ color: '#7C3AED' }} />
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#7C3AED' }}>
                    Wrong Event Pass
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#5B21B6'
                  }}
                >
                  {statusReason || `This pass belongs to a different event. It cannot be used at this gate.`}
                </div>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Next Pass
                </Button>
              </div>
            )}

            {/* 4. CANCELLED PASS */}
            {scanState === 'cancelled' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={24} style={{ color: '#DC2626' }} />
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#DC2626' }}>
                    Pass Cancelled / Suspended
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#991B1B'
                  }}
                >
                  {statusReason || 'This pass has been cancelled or refunded by event administrators. Entry strictly denied.'}
                </div>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Next Pass
                </Button>
              </div>
            )}

            {/* 5. INVALID PASS */}
            {scanState === 'invalid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={24} style={{ color: '#DC2626' }} />
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#DC2626' }}>
                    Invalid Pass / Signature
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#991B1B'
                  }}
                >
                  {statusReason || 'Unrecognized pass identifier or unverified cryptographic QR payload.'}
                </div>
                <Button variant="outline" fullWidth onClick={handleReset}>
                  Scan Another Pass
                </Button>
              </div>
            )}

            {/* Quick Verifier States Simulator Bar for fast verification testing */}
            <div
              style={{
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-gray)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                Test Verifier Scenarios (Digital & Printed):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => triggerScan('valid')}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #10B981',
                    color: '#059669',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Valid
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('already-used')}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F59E0B',
                    color: '#D97706',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Used
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('wrong-event')}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #8B5CF6',
                    color: '#7C3AED',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Wrong
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('cancelled')}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EF4444',
                    color: '#DC2626',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelled
                </button>
                <button
                  type="button"
                  onClick={() => triggerScan('invalid')}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EF4444',
                    color: '#DC2626',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Invalid
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
