import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Scan,
  Flashlight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  Keyboard,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  SwitchCamera,
  Volume2,
  VolumeX,
  Clock,
  User,
  Ticket,
  MapPin,
  Calendar,
  X,
  ArrowRight
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import StatusBadge from '../common/StatusBadge';
import {
  verifyAndCheckInPassAuthoritative,
  parseQRPayload,
  VERIFICATION_CODES,
  VERIFICATION_TITLES,
  playVerificationChime,
  triggerVerificationHaptic
} from '../../services/passVerificationEngine';

export default function QRScanner({
  onAllowEntry,
  history = [],
  onClearHistory,
  currentEvent = null,
  gate = 'Gate A',
  verifierUser = null
}) {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history' | 'manual'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) | 'user' (front)
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanning loop & verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // null | result object
  const [modalOpen, setModalOpen] = useState(false);

  // Manual code & upload state
  const [manualCode, setManualCode] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Offline detection
  const [isOfflineMode, setIsOfflineMode] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const lastScannedCodeRef = useRef(null);
  const scanCooldownRef = useRef(false);

  // Monitor network status
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

  // Safe sound trigger respecting user's mute preference
  const playSound = useCallback((type) => {
    if (soundEnabled) {
      playVerificationChime(type);
    }
    triggerVerificationHaptic(type);
  }, [soundEnabled]);

  /**
   * Stop any running camera streams and clean up media tracks
   */
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('[GateApass Scanner] Error stopping tracks:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  /**
   * Start device camera with specific facing mode (rear default on mobile)
   */
  const startCamera = useCallback(async (facing = facingMode) => {
    setCameraError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser or connection (HTTPS required).');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack?.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();
        setTorchSupported(Boolean(capabilities?.torch));
      } else {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCameraActive(true);
        startFrameDecoding();
      }
    } catch (err) {
      console.warn('[GateApass Scanner] Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can verify passes using manual entry or file upload.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another application or tab.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to start camera'}`);
      }
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  /**
   * Toggle between Rear ('environment') and Front ('user') cameras
   */
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  /**
   * Toggle Flashlight / Torch if supported by the device hardware
   */
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && torchSupported) {
      try {
        const nextTorch = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('[GateApass Scanner] Torch error:', err);
      }
    }
  };

  /**
   * Process a scanned or submitted code through the authoritative verification engine
   */
  const handleProcessCode = useCallback(async (rawPayload) => {
    if (!rawPayload || isVerifying || scanCooldownRef.current) return;

    const trimmed = String(rawPayload).trim();
    if (!trimmed) return;

    // Prevent immediate repeated scans of the exact same code in a rapid loop
    if (lastScannedCodeRef.current === trimmed && scanCooldownRef.current) {
      return;
    }

    setIsVerifying(true);
    scanCooldownRef.current = true;
    lastScannedCodeRef.current = trimmed;

    try {
      const result = await verifyAndCheckInPassAuthoritative({
        passDataOrCode: trimmed,
        currentEventId: currentEvent?.id || null,
        verifierUser,
        gate: gate || 'Gate A',
        isOfflineMode
      });

      setVerificationResult(result);
      setModalOpen(true);

      // Play sound and trigger haptic feedback
      playSound(result.valid ? 'success' : 'error');

      // Notify parent view (e.g. for live turnstile history logs)
      if (onAllowEntry) {
        onAllowEntry({
          passId: result.passId || trimmed,
          participant: result.attendeeName || 'Attendee',
          event: result.eventTitle || currentEvent?.title || 'Campus Event',
          gate: gate || 'Gate A',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          result: result.valid ? 'Valid' : (result.alreadyUsed ? 'Duplicate' : 'Denied'),
          code: result.code,
          reason: result.reason || (result.valid ? 'Access Approved' : 'Denied')
        });
      }
    } catch (err) {
      console.error('[GateApass Scanner] Verification error:', err);
      const fallbackResult = {
        valid: false,
        code: VERIFICATION_CODES.INVALID_QR,
        title: 'VERIFICATION ERROR',
        reason: err.message || 'System failed to verify pass.',
        passId: trimmed,
        timestamp: Date.now(),
        gate
      };
      setVerificationResult(fallbackResult);
      setModalOpen(true);
      playSound('error');
    } finally {
      setIsVerifying(false);
    }
  }, [currentEvent, gate, verifierUser, isOfflineMode, isVerifying, onAllowEntry, playSound]);

  /**
   * Continuous frame decoding loop using jsQR
   */
  const startFrameDecoding = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (
        !video ||
        video.readyState < 2 ||
        !streamRef.current ||
        modalOpen ||
        isVerifying ||
        scanCooldownRef.current
      ) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (qrCode && qrCode.data) {
            handleProcessCode(qrCode.data);
            return; // Pause loop until modal reset
          }
        } catch {
          // ignore transient frame capture drops
        }
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }, [handleProcessCode, isVerifying, modalOpen]);

  // Handle Tab Switch & Modal open/close
  useEffect(() => {
    if (activeTab === 'scan' && !modalOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, modalOpen, facingMode, startCamera, stopCamera]);

  /**
   * Reset scanner for next pass
   */
  const handleScanNext = () => {
    setModalOpen(false);
    setVerificationResult(null);
    // Allow brief cooldown to prevent re-triggering the same pass currently in front of lens
    setTimeout(() => {
      scanCooldownRef.current = false;
      lastScannedCodeRef.current = null;
      if (activeTab === 'scan') {
        startCamera(facingMode);
      }
    }, 400);
  };

  /**
   * Handle Manual Pass Code Form Submit
   */
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim() || isVerifying) return;
    handleProcessCode(manualCode.trim());
    setManualCode('');
  };

  /**
   * Handle QR Pass Image File Upload using jsQR
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingUpload(true);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image file.'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      URL.revokeObjectURL(img.src);

      if (code && code.data) {
        handleProcessCode(code.data);
      } else {
        setUploadError('No QR code detected in this image. Please upload a clearer photo or enter the Pass ID manually.');
        playSound('error');
      }
    } catch (err) {
      setUploadError(err.message || 'Could not process image file.');
      playSound('error');
    } finally {
      setIsProcessingUpload(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className="gateapass-qr-scanner-container"
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.1)',
        overflow: 'hidden',
        textAlign: 'left',
        position: 'relative'
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Gate Pass Scanner
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isOfflineMode ? '#FEF3F2' : '#F0FDF4',
                color: isOfflineMode ? '#B42318' : '#166534',
                border: `1px solid ${isOfflineMode ? '#FECDCA' : '#BBF7D0'}`
              }}
            >
              {isOfflineMode ? 'Offline Mode' : 'Live Sync'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            {currentEvent?.title || 'Campus Event'} · {gate}
          </p>
        </div>

        {/* Action Controls: Sound Mute & History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
            style={{
              padding: '6px 8px',
              backgroundColor: soundEnabled ? '#F5F3FF' : '#F1F5F9',
              color: soundEnabled ? '#7C3AED' : '#94A3B8',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

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
            Log ({history.length})
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation: Camera | Manual & Upload ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('scan');
            setModalOpen(false);
          }}
          style={{
            flex: 1,
            height: '42px',
            border: 'none',
            borderBottom: activeTab === 'scan' ? '2px solid #7C3AED' : 'none',
            backgroundColor: activeTab === 'scan' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'scan' ? '#7C3AED' : '#64748B',
            fontWeight: activeTab === 'scan' ? 700 : 500,
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
          onClick={() => {
            setActiveTab('manual');
            stopCamera();
          }}
          style={{
            flex: 1,
            height: '42px',
            border: 'none',
            borderBottom: activeTab === 'manual' ? '2px solid #7C3AED' : 'none',
            backgroundColor: activeTab === 'manual' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'manual' ? '#7C3AED' : '#64748B',
            fontWeight: activeTab === 'manual' ? 700 : 500,
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

      {/* ── TAB 1: Real Camera Viewport ── */}
      {activeTab === 'scan' && (
        <>
          <div
            style={{
              backgroundColor: '#0A0F1D',
              height: '320px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Live Video Feed */}
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

            {/* Error or Permission Denied State */}
            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  gap: '12px',
                  color: '#FFFFFF'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444'
                  }}
                >
                  <CameraOff size={26} />
                </div>
                <p style={{ fontSize: '13px', margin: 0, color: '#E2E8F0', maxWidth: '300px', lineHeight: '18px' }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => startCamera(facingMode)}
                    style={{ fontSize: '12px', backgroundColor: '#7C3AED' }}
                  >
                    Retry Camera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Keyboard}
                    onClick={() => setActiveTab('manual')}
                    style={{ fontSize: '12px', backgroundColor: 'transparent', color: '#FFFFFF', borderColor: '#475569' }}
                  >
                    Manual Input
                  </Button>
                </div>
              </div>
            )}

            {/* Target Scanning Reticle with Animated Laser Line */}
            {cameraActive && !cameraError && (
              <div
                style={{
                  width: '210px',
                  height: '210px',
                  border: '2.5px solid #7C3AED',
                  borderRadius: '16px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 9999px rgba(10, 15, 29, 0.55)',
                  backgroundColor: 'rgba(124, 58, 237, 0.04)'
                }}
              >
                {/* 4 Framing Corner Brackets */}
                <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #A855F7', borderLeft: '4px solid #A855F7', borderTopLeftRadius: '14px' }} />
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #A855F7', borderRight: '4px solid #A855F7', borderTopRightRadius: '14px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #A855F7', borderLeft: '4px solid #A855F7', borderBottomLeftRadius: '14px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #A855F7', borderRight: '4px solid #A855F7', borderBottomRightRadius: '14px' }} />

                {/* Animated Pulsing Laser Beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: '8px',
                    right: '8px',
                    height: '2px',
                    backgroundColor: '#EC4899',
                    boxShadow: '0 0 10px #EC4899, 0 0 20px #7C3AED',
                    animation: 'scanLaser 2s infinite ease-in-out'
                  }}
                />
              </div>
            )}

            {/* In-view Floating Camera Controls (Flip Camera, Torch, Stop/Start) */}
            {cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch Camera (Front/Rear)"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <SwitchCamera size={16} />
                  <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>

                {torchSupported && (
                  <>
                    <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <button
                      type="button"
                      onClick={toggleTorch}
                      title="Toggle Torch"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: torchOn ? '#FBBF24' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      <Flashlight size={16} />
                      <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  </>
                )}

                <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <button
                  type="button"
                  onClick={stopCamera}
                  title="Stop Camera Stream"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <CameraOff size={16} />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Restart Camera Button when stopped */}
            {!cameraActive && !cameraError && (
              <Button
                variant="primary"
                icon={Camera}
                onClick={() => startCamera(facingMode)}
                style={{ backgroundColor: '#7C3AED' }}
              >
                Start Camera Scanner
              </Button>
            )}
          </div>

          {/* Scanner Guidance Bar */}
          <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scan size={18} style={{ color: '#7C3AED' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                {isVerifying ? 'Verifying Pass Signature...' : 'Position QR Pass Inside Frame'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0', lineHeight: '17px' }}>
              Hold participant pass steady. Scanning is automatic and executes real-time turnstile check-in.
            </p>
          </div>
        </>
      )}

      {/* ── TAB 2: Manual Pass ID & QR Image Upload ── */}
      {activeTab === 'manual' && (
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Manual Pass Verification
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              Verify printed physical badges, alphanumeric codes, or uploaded pass photos.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Pass ID or Raw QR Payload"
              placeholder="e.g. GP-TF26-9481-1 or pass_..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              helperText="Enter Pass ID printed on ticket or physical badge"
            />
            <Button
              variant="primary"
              type="submit"
              fullWidth
              disabled={!manualCode.trim() || isVerifying}
              style={{ backgroundColor: '#7C3AED' }}
            >
              {isVerifying ? 'Verifying in Ledger...' : 'Verify Pass ID'}
            </Button>
          </form>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              Or Upload Pass Screenshot / Image File:
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                border: '1.5px dashed #CBD5E1',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#7C3AED'
              }}
            >
              <Upload size={18} />
              <span>{isProcessingUpload ? 'Decoding Image...' : 'Select Ticket Image (PNG, JPG)'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {uploadError && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#991B1B'
                }}
              >
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Check-in History Log ── */}
      {activeTab === 'history' && (
        <div style={{ padding: '20px', minHeight: '360px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Session Check-in Log
            </h3>
            {history.length > 0 && onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Clear Log
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8', fontSize: '13px' }}>
              No pass check-ins recorded yet in this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      {item.participant || 'Attendee'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {item.passId} · {item.gate || gate} · {item.time}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        item.result === 'Valid'
                          ? '#ECFDF5'
                          : item.result === 'Duplicate'
                          ? '#FFFBEB'
                          : '#FEF2F2',
                      color:
                        item.result === 'Valid'
                          ? '#059669'
                          : item.result === 'Duplicate'
                          ? '#D97706'
                          : '#DC2626'
                    }}
                  >
                    {item.result}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            fullWidth
            style={{ marginTop: '16px' }}
            onClick={() => setActiveTab('scan')}
          >
            Back to Scanner
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PROMINENT VERIFICATION RESULT POPUPS (VALID PASS / ENTRY DENIED)
         ════════════════════════════════════════════════════════════════════ */}
      {modalOpen && verificationResult && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* ── SUCCESS POPUP: VALID PASS ── */}
          {verificationResult.valid ? (
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.35)',
                border: '2px solid #10B981',
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Animated Glowing Checkmark Icon */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    border: '3px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <CheckCircle2 size={38} strokeWidth={2.5} />
                </div>
              </div>

              {/* Headings */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}
                >
                  ENTRY APPROVED
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '8px 0 2px' }}>
                  VALID PASS
                </h3>
                <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, margin: 0 }}>
                  PASS VERIFIED SUCCESSFULLY
                </p>
              </div>

              {/* Rich Details Card */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} /> Attendee
                  </span>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                    {verificationResult.attendeeName}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Ticket size={14} /> Pass ID
                  </span>
                  <span style={{ fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace', fontSize: '13px' }}>
                    {verificationResult.passId}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Event
                  </span>
                  <span style={{ fontWeight: 600, color: '#1E293B', maxWidth: '180px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {verificationResult.eventTitle}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Tier / Category
                  </span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>
                    {verificationResult.category}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> Gate & Time
                  </span>
                  <span style={{ color: '#334155', fontWeight: 600 }}>
                    {verificationResult.gate} · {new Date(verificationResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={handleScanNext}
                  style={{ flex: 1, borderColor: '#CBD5E1', color: '#475569' }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={handleScanNext}
                  style={{ flex: 1.4, backgroundColor: '#059669', borderColor: '#059669', color: '#FFFFFF' }}
                >
                  Scan Next Pass
                </Button>
              </div>
            </div>
          ) : (
            /* ── FAILURE POPUP: ENTRY DENIED ── */
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
                border: '2px solid #EF4444',
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Alert Icon */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF2F2',
                    border: '3px solid #EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DC2626',
                    boxShadow: '0 0 24px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <XCircle size={38} strokeWidth={2.5} />
                </div>
              </div>

              {/* Headings */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#DC2626',
                    backgroundColor: '#FEF2F2',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}
                >
                  {verificationResult.title || 'ENTRY DENIED'}
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626', margin: '8px 0 2px' }}>
                  ENTRY DENIED
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Pass could not be authorized for admission
                </p>
              </div>

              {/* Failure Reason Box */}
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
                    Reason:
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#7F1D1D', marginTop: '2px' }}>
                    {verificationResult.reason}
                  </div>
                </div>

                {verificationResult.passId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #FEE2E2', paddingTop: '6px' }}>
                    <span style={{ color: '#991B1B', fontSize: '12px' }}>Pass Reference:</span>
                    <span style={{ fontWeight: 700, color: '#7F1D1D', fontFamily: 'monospace' }}>
                      {verificationResult.passId}
                    </span>
                  </div>
                )}

                {/* Granular Duplicate Details: previous timestamp, gate, and verifier */}
                {verificationResult.alreadyUsed && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '8px',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#92400E'
                    }}
                  >
                    <strong>Previous Check-in Details:</strong>
                    <div style={{ marginTop: '2px' }}>
                      • Time: {verificationResult.checkedInAt ? new Date(verificationResult.checkedInAt).toLocaleTimeString() : 'Earlier today'}
                    </div>
                    <div>
                      • Gate: {verificationResult.checkedInGate || 'Gate A'}
                    </div>
                    {verificationResult.checkedInBy && (
                      <div>
                        • Verifier: {verificationResult.checkedInBy}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={handleScanNext}
                  style={{ flex: 1, borderColor: '#CBD5E1', color: '#475569' }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleScanNext}
                  style={{ flex: 1.4, backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#FFFFFF' }}
                >
                  Scan Next Pass
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Keyframe Animations */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 15%; opacity: 0.8; }
          50% { top: 85%; opacity: 1; }
          100% { top: 15%; opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
