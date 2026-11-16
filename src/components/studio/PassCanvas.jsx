import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import StatusBadge from '../common/StatusBadge';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  resolveDynamicString,
  resolveDynamicValue,
  SAMPLE_PASS_DATA
} from '../../data/passTemplates';

/**
 * GateApass — PassCanvas
 * Renders the 900x1400 pass canvas with pixel-exact coordinate positioning,
 * scalable responsive display, freely draggable elements in interactive mode,
 * and high-fidelity typography & background styling.
 */
export default function PassCanvas({
  template,
  data = SAMPLE_PASS_DATA,
  selectedElementId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  isInteractive = true,
  viewMode = 'desktop', // 'desktop' | 'mobile'
  targetWidth = null // Optional explicit render width in px
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.45);
  const [qrUrl, setQrUrl] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState(null);
  const [resizeStart, setResizeStart] = useState({ startX: 0, startY: 0, startW: 0, startH: 0 });

  const theme = template?.theme || {};
  const bg = template?.background || { color: theme.background || '#FFFFFF', image: '', imageOpacity: 1, fit: 'cover', position: 'center' };
  const elements = template?.elements || [];

  // Determine scaling based on container width or viewMode
  useEffect(() => {
    const updateScale = () => {
      if (targetWidth) {
        setScale(targetWidth / CANVAS_WIDTH);
        return;
      }
      if (viewMode === 'mobile') {
        setScale(360 / CANVAS_WIDTH);
        return;
      }
      if (containerRef.current) {
        const parentW = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        const availableW = Math.min(parentW - 48, 540);
        setScale(Math.max(0.32, Math.min(0.65, availableW / CANVAS_WIDTH)));
      } else {
        setScale(0.48);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewMode, targetWidth]);

  // Generate QR code for verification
  useEffect(() => {
    const qrElement = elements.find((e) => e.type === 'qr');
    const fgColor = qrElement?.fgColor || '#000000';
    const bgColor = qrElement?.bgColor || '#FFFFFF';

    const payload = JSON.stringify({
      passId: resolveDynamicValue('pass.id', data),
      event: resolveDynamicValue('event.name', data),
      attendee: resolveDynamicValue('participant.name', data),
      authority: resolveDynamicValue('pass.authority', data),
      status: resolveDynamicValue('pass.status', data),
      tpl: template?.id,
      v: template?.currentVersion || 1
    });

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 1,
      color: {
        dark: fgColor,
        light: bgColor
      }
    }).then(setQrUrl).catch(() => {});
  }, [template, data, elements]);

  // Element Drag & Reposition Handlers
  const handleMouseDown = (e, el) => {
    if (!isInteractive) return;
    e.stopPropagation();
    onSelectElement(el.id);

    const canvasRect = containerRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - canvasRect.left) / scale;
    const mouseCanvasY = (e.clientY - canvasRect.top) / scale;

    setDraggingId(el.id);
    setDragOffset({
      x: mouseCanvasX - (el.x || 0),
      y: mouseCanvasY - (el.y || 0)
    });
  };

  const handleResizeHandleMouseDown = (e, el) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setResizingId(el.id);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startW: el.width || 200,
      startH: el.height || 60
    });
  };

  useEffect(() => {
    if (!draggingId && !resizingId) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const canvasRect = containerRef.current.getBoundingClientRect();

      if (draggingId) {
        const mouseCanvasX = (e.clientX - canvasRect.left) / scale;
        const mouseCanvasY = (e.clientY - canvasRect.top) / scale;

        let newX = Math.round(mouseCanvasX - dragOffset.x);
        let newY = Math.round(mouseCanvasY - dragOffset.y);

        // Constrain to canvas
        const currentEl = elements.find((el) => el.id === draggingId);
        const w = currentEl?.width || 200;
        const h = currentEl?.height || 60;
        newX = Math.max(0, Math.min(CANVAS_WIDTH - w, newX));
        newY = Math.max(0, Math.min(CANVAS_HEIGHT - h, newY));

        onUpdateElement(draggingId, { x: newX, y: newY });
      } else if (resizingId) {
        const deltaX = (e.clientX - resizeStart.startX) / scale;
        const deltaY = (e.clientY - resizeStart.startY) / scale;

        const newW = Math.max(60, Math.min(CANVAS_WIDTH, Math.round(resizeStart.startW + deltaX)));
        const newH = Math.max(20, Math.min(CANVAS_HEIGHT, Math.round(resizeStart.startH + deltaY)));

        onUpdateElement(resizingId, { width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setResizingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, resizingId, dragOffset, resizeStart, scale, elements, onUpdateElement]);

  const displayedWidth = CANVAS_WIDTH * scale;
  const displayedHeight = CANVAS_HEIGHT * scale;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none'
      }}
      onClick={() => isInteractive && onSelectElement(null)}
    >
      {/* Canvas Frame */}
      <div
        ref={containerRef}
        className="gateapass-fixed-canvas"
        style={{
          width: `${displayedWidth}px`,
          height: `${displayedHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: bg.color || '#FFFFFF',
          borderRadius: `${(template?.layout?.borderRadius || 8) * scale}px`,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.borderColor || '#E8E8E8'}`,
          transition: draggingId || resizingId ? 'none' : 'box-shadow 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Background Image Layer */}
        {bg.image && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${bg.image})`,
              backgroundSize: bg.fit === 'contain' ? 'contain' : bg.fit === 'original' ? 'auto' : 'cover',
              backgroundPosition: bg.position || 'center',
              backgroundRepeat: 'no-repeat',
              opacity: bg.imageOpacity !== undefined ? bg.imageOpacity : 1,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* 900x1400 Virtual Coordinate Space (Scaled) */}
        <div
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {elements
            .filter((el) => el.visible !== false)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((el) => {
              const isSelected = isInteractive && selectedElementId === el.id;
              const x = el.x !== undefined ? el.x : 50;
              const y = el.y !== undefined ? el.y : 50;
              const w = el.width !== undefined ? el.width : 400;
              const h = el.height !== undefined ? el.height : 60;
              const fontFam = el.fontFamily || 'Inter';

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el)}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${w}px`,
                    minHeight: `${h}px`,
                    zIndex: el.zIndex || 1,
                    cursor: isInteractive ? 'move' : 'default',
                    outline: isSelected ? '2px solid #AC58E9' : '1px dashed transparent',
                    outlineOffset: '2px',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Element Content Render */}
                  {renderElementContent(el, theme, data, qrUrl, fontFam)}

                  {/* Selected Element Controls (Resize Handle & Coordinates Tag) */}
                  {isSelected && isInteractive && (
                    <>
                      {/* Drag Coordinate Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-24px',
                          left: 0,
                          backgroundColor: '#AC58E9',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '2px',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.4px',
                          zIndex: 999
                        }}
                      >
                        {el.title || el.type} ({x}, {y}) · {w}×{h}
                      </div>

                      {/* Bottom-Right Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeHandleMouseDown(e, el)}
                        style={{
                          position: 'absolute',
                          right: '-5px',
                          bottom: '-5px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#AC58E9',
                          border: '2px solid #FFFFFF',
                          borderRadius: '2px',
                          cursor: 'nwse-resize',
                          zIndex: 1000
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Canvas Dimensions Indicator in Editor */}
      {isInteractive && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#888888', fontWeight: 600 }}>
          Portrait Pass Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT} px (Scaled {Math.round(scale * 100)}%)
        </div>
      )}
    </div>
  );
}

/**
 * Renders individual element type on the 900x1400 canvas
 */
function renderElementContent(el, theme, data, qrUrl, fontFam) {
  switch (el.type) {
    case 'branding':
      return (
        <div
          style={{
            backgroundColor: el.backgroundColor || theme.headerBg || '#0A0A0D',
            color: el.color || theme.headerText || '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: fontFam,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {el.showLogo !== false && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: theme.accentColor || '#AC58E9',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 5v14" />
                  <path d="M17 5v14" />
                </svg>
              </div>
            )}
            <span style={{ fontSize: `${el.fontSize || 28}px`, fontWeight: el.fontWeight || 700, letterSpacing: '-0.3px' }}>
              {el.brandText || 'GateApass'}
            </span>
          </div>

          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            {el.subText || 'Digital Pass'}
          </span>
        </div>
      );

    case 'headerRow':
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: fontFam,
            width: '100%',
            height: '100%'
          }}
        >
          {el.showPassType !== false && (
            <span
              style={{
                fontSize: `${el.fontSize || 22}px`,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                backgroundColor: theme.badgeBg || '#EBDDFA',
                color: theme.badgeText || '#7C2CCB',
                padding: '6px 16px',
                borderRadius: '4px'
              }}
            >
              {resolveDynamicValue('pass.type', data)}
            </span>
          )}

          {el.showStatus !== false && (
            <div style={{ transform: 'scale(1.3)', transformOrigin: 'right center' }}>
              <StatusBadge status={resolveDynamicValue('pass.status', data)} />
            </div>
          )}
        </div>
      );

    case 'dynamicText':
    case 'text':
      return (
        <div
          style={{
            fontFamily: fontFam,
            fontSize: `${el.fontSize || 28}px`,
            fontWeight: el.fontWeight || 600,
            fontStyle: el.fontStyle || 'normal',
            color: el.color || theme.textColor || '#0A0A0D',
            textAlign: el.textAlign || 'left',
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
            lineHeight: el.lineHeight ? `${el.lineHeight}px` : '1.25',
            opacity: el.opacity !== undefined ? el.opacity : 1,
            wordBreak: 'break-word',
            width: '100%'
          }}
        >
          {el.type === 'dynamicText'
            ? resolveDynamicString(el.field || '', data)
            : el.content || 'Sample Text'}
        </div>
      );

    case 'qr':
      return (
        <div
          style={{
            backgroundColor: el.frameBg || theme.qrFrameBg || '#FFFFFF',
            border: `2px solid ${el.frameBorder || theme.qrFrameBorder || '#E8E8E8'}`,
            borderRadius: '6px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Verification QR"
              style={{
                width: `${el.size || 280}px`,
                height: `${el.size || 280}px`,
                display: 'block'
              }}
            />
          ) : (
            <div
              style={{
                width: `${el.size || 280}px`,
                height: `${el.size || 280}px`,
                backgroundColor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#888'
              }}
            >
              Generating QR...
            </div>
          )}
          {el.caption && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#666666',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontFamily: fontFam
              }}
            >
              {el.caption}
            </span>
          )}
        </div>
      );

    case 'image':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '4px',
            opacity: el.opacity !== undefined ? el.opacity : 1
          }}
        >
          {el.imageUrl ? (
            <img
              src={el.imageUrl}
              alt="Pass Graphic"
              style={{
                width: '100%',
                height: '100%',
                objectFit: el.fit || 'cover',
                display: 'block'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#EEEEEE',
                border: '1px dashed #AAAAAA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#777777'
              }}
            >
              Image Element (No URL)
            </div>
          )}
        </div>
      );

    case 'detailsGrid':
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 24px',
            fontFamily: fontFam,
            width: '100%',
            padding: '16px',
            backgroundColor: theme.cardBg || 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.borderColor || '#E8E8E8'}`,
            borderRadius: '6px',
            boxSizing: 'border-box'
          }}
        >
          {(el.fields || []).map((f, idx) => (
            <div key={idx}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.mutedText || '#777777',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {f.label}
              </span>
              <div
                style={{
                  fontSize: `${el.fontSize || 22}px`,
                  fontWeight: f.isHighlight ? 800 : 700,
                  color: f.isHighlight ? theme.deepAccent || theme.accentColor || '#7C2CCB' : theme.textColor || '#0A0A0D',
                  marginTop: '4px'
                }}
              >
                {resolveDynamicString(f.value || '', data)}
              </div>
            </div>
          ))}
        </div>
      );

    case 'accessTags':
      return (
        <div style={{ width: '100%', fontFamily: fontFam }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: theme.mutedText || '#777777',
              letterSpacing: '0.8px',
              display: 'block',
              marginBottom: '8px'
            }}
          >
            Access Clearance
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {resolveDynamicValue('pass.accessAreas', data)
              .split(',')
              .map((area, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '4px',
                    backgroundColor: theme.badgeBg || '#EBDDFA',
                    color: theme.badgeText || '#7C2CCB',
                    border: `1px solid ${theme.borderColor || '#E8E8E8'}`
                  }}
                >
                  ✓ {area.trim()}
                </span>
              ))}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div
          style={{
            width: '100%',
            height: `${el.height || 2}px`,
            backgroundColor: el.color || theme.borderColor || '#E8E8E8'
          }}
        />
      );

    case 'footerNotes':
      return (
        <div
          style={{
            fontFamily: fontFam,
            fontSize: `${el.fontSize || 16}px`,
            fontWeight: el.fontWeight || 400,
            color: el.color || theme.mutedText || '#888888',
            textAlign: el.textAlign || 'center',
            lineHeight: '1.5',
            width: '100%'
          }}
        >
          {el.content}
        </div>
      );

    default:
      return (
        <div style={{ padding: '8px', border: '1px dashed #CCC', fontSize: '14px' }}>
          {el.title || el.type}
        </div>
      );
  }
}
