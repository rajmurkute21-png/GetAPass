import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Type,
  Layout,
  CornerDownRight,
  Maximize2,
  Image as ImageIcon,
  QrCode,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Bold
} from 'lucide-react';
import {
  GATEAPASS_COLOR_PALETTES,
  SUPPORTED_FONTS,
  DYNAMIC_FIELD_TOKENS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../data/passTemplates';
import { EVENT_IMAGE_PRESETS } from '../../data/mockData';
import Input from '../common/Input';
import Button from '../common/Button';

export default function PropertiesPanel({
  template,
  selectedElementId,
  onUpdateTheme,
  onUpdateBackground,
  onUpdateLayout,
  onUpdateElement,
  onApplyPalette,
  onReorderLayer,
  onDeleteElement
}) {
  const [activeTab, setActiveTab] = useState('element'); // 'element' | 'background' | 'theme'

  const theme = template?.theme || {};
  const bg = template?.background || { color: '#FFFFFF', image: '', imageOpacity: 1, fit: 'cover', position: 'center' };
  const elements = template?.elements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // If no element is selected, switch to background tab
  const currentTab = selectedElement ? activeTab : 'background';

  const handleColorChange = (hex) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { color: hex });
    }
  };

  const handleAlign = (direction) => {
    if (!selectedElement) return;
    const w = selectedElement.width || 400;
    if (direction === 'left') {
      onUpdateElement(selectedElement.id, { x: 50 });
    } else if (direction === 'center') {
      const centerX = Math.round((CANVAS_WIDTH - w) / 2);
      onUpdateElement(selectedElement.id, { x: centerX });
    } else if (direction === 'right') {
      const rightX = CANVAS_WIDTH - 50 - w;
      onUpdateElement(selectedElement.id, { x: Math.max(0, rightX) });
    }
  };

  return (
    <div
      className="gateapass-properties-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-white)',
        borderLeft: '1px solid var(--color-gray)',
        overflowY: 'auto',
        textAlign: 'left'
      }}
    >
      {/* Top Tab Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-gray)',
          backgroundColor: 'var(--color-off-white)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('element')}
          disabled={!selectedElement}
          style={{
            flex: 1,
            padding: '12px 8px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            borderBottom: selectedElement && currentTab === 'element' ? '2px solid var(--color-violet)' : '2px solid transparent',
            backgroundColor: selectedElement && currentTab === 'element' ? 'var(--color-white)' : 'transparent',
            color: selectedElement ? (currentTab === 'element' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)') : 'var(--color-muted-text)',
            cursor: selectedElement ? 'pointer' : 'not-allowed'
          }}
        >
          Element
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('background')}
          style={{
            flex: 1,
            padding: '12px 8px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'background' ? '2px solid var(--color-violet)' : '2px solid transparent',
            backgroundColor: currentTab === 'background' ? 'var(--color-white)' : 'transparent',
            color: currentTab === 'background' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
            cursor: 'pointer'
          }}
        >
          Background
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          style={{
            flex: 1,
            padding: '12px 8px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'theme' ? '2px solid var(--color-violet)' : '2px solid transparent',
            backgroundColor: currentTab === 'theme' ? 'var(--color-white)' : 'transparent',
            color: currentTab === 'theme' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
            cursor: 'pointer'
          }}
        >
          Palette
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* ==============================================================
            TAB 1: SELECTED ELEMENT PROPERTIES
            ============================================================== */}
        {selectedElement && currentTab === 'element' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info & Layer Controls */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase' }}>
                  {selectedElement.type}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
                  z-index: {selectedElement.zIndex || 1}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0' }}>
                {selectedElement.title || selectedElement.id}
              </h3>
            </div>

            {/* Position & Size Inputs */}
            <div style={{ padding: '14px', border: '1px solid var(--color-gray)', borderRadius: '4px', backgroundColor: 'var(--color-off-white)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)', display: 'block', marginBottom: '10px' }}>
                Canvas Coordinates (900×1400)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>X Position</label>
                  <input
                    type="number"
                    min={0}
                    max={CANVAS_WIDTH}
                    value={selectedElement.x !== undefined ? selectedElement.x : 50}
                    onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Y Position</label>
                  <input
                    type="number"
                    min={0}
                    max={CANVAS_HEIGHT}
                    value={selectedElement.y !== undefined ? selectedElement.y : 50}
                    onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Width</label>
                  <input
                    type="number"
                    min={40}
                    max={CANVAS_WIDTH}
                    value={selectedElement.width !== undefined ? selectedElement.width : 400}
                    onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Height</label>
                  <input
                    type="number"
                    min={20}
                    max={CANVAS_HEIGHT}
                    value={selectedElement.height !== undefined ? selectedElement.height : 60}
                    onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })}
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Quick Alignment Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleAlign('left')}
                  style={{ flex: 1, height: '28px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  Align Left
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign('center')}
                  style={{ flex: 1, height: '28px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign('right')}
                  style={{ flex: 1, height: '28px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  Align Right
                </button>
              </div>
            </div>

            {/* Layer Ordering (Bring to front, send to back, etc.) */}
            <div style={{ padding: '12px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)', display: 'block', marginBottom: '8px' }}>
                Layer Arrangement
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onReorderLayer && onReorderLayer(selectedElement.id, 'up')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  <ArrowUp size={13} /> Bring Forward
                </button>
                <button
                  type="button"
                  onClick={() => onReorderLayer && onReorderLayer(selectedElement.id, 'down')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  <ArrowDown size={13} /> Send Backward
                </button>
                <button
                  type="button"
                  onClick={() => onReorderLayer && onReorderLayer(selectedElement.id, 'top')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  <ChevronsUp size={13} /> Bring to Front
                </button>
                <button
                  type="button"
                  onClick={() => onReorderLayer && onReorderLayer(selectedElement.id, 'bottom')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-gray)', borderRadius: '4px', background: '#FFF', cursor: 'pointer' }}
                >
                  <ChevronsDown size={13} /> Send to Back
                </button>
              </div>
            </div>

            {/* Typography Controls (for text & dynamicText) */}
            {(selectedElement.type === 'dynamicText' || selectedElement.type === 'text' || selectedElement.type === 'branding') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                  Typography Customization
                </span>

                {/* Font Family Selection */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Font Family
                  </label>
                  <select
                    value={selectedElement.fontFamily || 'Inter'}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-gray)',
                      padding: '0 8px',
                      fontSize: '13px',
                      fontFamily: selectedElement.fontFamily || 'Inter'
                    }}
                  >
                    {SUPPORTED_FONTS.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Size ({selectedElement.fontSize || 28}px)
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={72}
                      value={selectedElement.fontSize || 28}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Weight
                    </label>
                    <select
                      value={selectedElement.fontWeight || 600}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fontWeight: Number(e.target.value) })}
                      style={{ width: '100%', height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px' }}
                    >
                      <option value={400}>Regular (400)</option>
                      <option value={500}>Medium (500)</option>
                      <option value={600}>Semibold (600)</option>
                      <option value={700}>Bold (700)</option>
                      <option value={800}>Extra Bold (800)</option>
                    </select>
                  </div>
                </div>

                {/* Style & Alignment */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Alignment
                    </label>
                    <div style={{ display: 'flex', border: '1px solid var(--color-gray)', borderRadius: '4px', overflow: 'hidden' }}>
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => onUpdateElement(selectedElement.id, { textAlign: align })}
                          style={{
                            flex: 1,
                            height: '32px',
                            border: 'none',
                            backgroundColor: (selectedElement.textAlign || 'left') === align ? 'var(--color-light-violet)' : '#FFF',
                            color: (selectedElement.textAlign || 'left') === align ? 'var(--color-deep-violet)' : '#333',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ width: '80px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Italic
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      style={{
                        width: '100%',
                        height: '32px',
                        border: '1px solid var(--color-gray)',
                        borderRadius: '4px',
                        backgroundColor: selectedElement.fontStyle === 'italic' ? 'var(--color-light-violet)' : '#FFF',
                        color: selectedElement.fontStyle === 'italic' ? 'var(--color-deep-violet)' : '#333',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                </div>

                {/* Text Color Picker & Presets */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Text Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={selectedElement.color || '#000000'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      style={{ width: '38px', height: '38px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={selectedElement.color || '#000000'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      style={{ flex: 1, height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* Swatches */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {['#000000', '#FFFFFF', '#AC58E9', '#7C2CCB', '#666666', '#16A34A', '#D97706', '#0284C7'].map((hex) => (
                      <div
                        key={hex}
                        onClick={() => onUpdateElement(selectedElement.id, { color: hex })}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: hex,
                          borderRadius: '3px',
                          border: '1px solid #CCC',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Dynamic Token Inserter (if dynamicText) */}
                {selectedElement.type === 'dynamicText' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Dynamic Token Field
                    </label>
                    <select
                      value={selectedElement.field || ''}
                      onChange={(e) => onUpdateElement(selectedElement.id, { field: e.target.value })}
                      style={{ width: '100%', height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px' }}
                    >
                      <option value="">Custom Token or Text</option>
                      {DYNAMIC_FIELD_TOKENS.map((dt) => (
                        <option key={dt.token} value={dt.token}>
                          {dt.label} ({dt.token})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={selectedElement.field || ''}
                      onChange={(e) => onUpdateElement(selectedElement.id, { field: e.target.value })}
                      placeholder="e.g. {{event.name}}"
                      style={{ width: '100%', height: '32px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px', marginTop: '6px' }}
                    />
                  </div>
                )}

                {/* Plain text content (if text) */}
                {selectedElement.type === 'text' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Text Content
                    </label>
                    <input
                      type="text"
                      value={selectedElement.content || ''}
                      onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                      style={{ width: '100%', height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Image Element Controls */}
            {selectedElement.type === 'image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                  Image Properties
                </span>

                <Input
                  label="Image URL"
                  value={selectedElement.imageUrl || ''}
                  onChange={(e) => onUpdateElement(selectedElement.id, { imageUrl: e.target.value })}
                  placeholder="https://..."
                />

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Choose Preset Graphic
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {EVENT_IMAGE_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => onUpdateElement(selectedElement.id, { imageUrl: preset.url })}
                        style={{
                          height: '48px',
                          backgroundImage: `url(${preset.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: selectedElement.imageUrl === preset.url ? '2px solid var(--color-violet)' : '1px solid #CCC'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Fit Mode
                    </label>
                    <select
                      value={selectedElement.fit || 'cover'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fit: e.target.value })}
                      style={{ width: '100%', height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px' }}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Opacity ({Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                      onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QR Element Controls */}
            {selectedElement.type === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                  QR Code Styling
                </span>

                <div
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--color-off-white)',
                    border: '1px solid var(--color-gray)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--color-dark-text)',
                    lineHeight: '16px'
                  }}
                >
                  🔒 <strong>Server-Verified Token:</strong> Pass QR payload references the immutable GateApass admission ID. Visual styling can be adjusted while security hashing remains protected.
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    QR Optical Size ({selectedElement.size || 280}px)
                  </label>
                  <input
                    type="range"
                    min={200}
                    max={360}
                    step={10}
                    value={selectedElement.size || 280}
                    onChange={(e) => onUpdateElement(selectedElement.id, { size: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <Input
                  label="Verification Label / Caption"
                  value={selectedElement.caption || ''}
                  onChange={(e) => onUpdateElement(selectedElement.id, { caption: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Frame Background
                    </label>
                    <input
                      type="color"
                      value={selectedElement.frameBg || '#FFFFFF'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { frameBg: e.target.value })}
                      style={{ width: '100%', height: '36px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Frame Border
                    </label>
                    <input
                      type="color"
                      value={selectedElement.frameBorder || '#E8E8E8'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { frameBorder: e.target.value })}
                      style={{ width: '100%', height: '36px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Delete Element Button */}
            {selectedElement.type !== 'qr' && (
              <div style={{ marginTop: '12px' }}>
                <Button
                  variant="outline"
                  icon={Trash2}
                  onClick={() => onDeleteElement && onDeleteElement(selectedElement.id)}
                  style={{ width: '100%', color: '#DC2626', borderColor: '#FCA5A5' }}
                >
                  Delete Selected Element
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB 2: BACKGROUND CUSTOMIZATION
            ============================================================== */}
        {currentTab === 'background' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Pass Background Styling
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Solid color, uploaded artwork, or event banner backgrounds.
              </p>
            </div>

            {/* Solid Background Color */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)', display: 'block', marginBottom: '6px' }}>
                Solid Background Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={bg.color || '#FFFFFF'}
                  onChange={(e) => onUpdateBackground({ ...bg, color: e.target.value })}
                  style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={bg.color || '#FFFFFF'}
                  onChange={(e) => onUpdateBackground({ ...bg, color: e.target.value })}
                  style={{ flex: 1, height: '36px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 8px', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              {/* Swatches */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {['#FFFFFF', '#0A0A0D', '#0D0914', '#090D16', '#F8FAFC', '#1F142B'].map((hex) => (
                  <div
                    key={hex}
                    onClick={() => onUpdateBackground({ ...bg, color: hex })}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: hex,
                      borderRadius: '4px',
                      border: bg.color === hex ? '2px solid var(--color-violet)' : '1px solid #CCC',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Background Image Artwork */}
            <div style={{ padding: '14px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)', display: 'block', marginBottom: '8px' }}>
                Background Image Artwork
              </span>

              <Input
                label="Image URL or Hosted Asset"
                value={bg.image || ''}
                onChange={(e) => onUpdateBackground({ ...bg, image: e.target.value })}
                placeholder="https://..."
              />

              {/* Preset selection */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Select from Event Presets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                  {EVENT_IMAGE_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onUpdateBackground({ ...bg, image: p.url })}
                      style={{
                        height: '36px',
                        backgroundImage: `url(${p.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        border: bg.image === p.url ? '2px solid var(--color-violet)' : '1px solid #CCC'
                      }}
                    />
                  ))}
                </div>
              </div>

              {bg.image && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Fit Mode</label>
                      <select
                        value={bg.fit || 'cover'}
                        onChange={(e) => onUpdateBackground({ ...bg, fit: e.target.value })}
                        style={{ width: '100%', height: '32px', border: '1px solid var(--color-gray)', borderRadius: '4px', fontSize: '12px', padding: '0 6px' }}
                      >
                        <option value="cover">Cover (Fill)</option>
                        <option value="contain">Contain</option>
                        <option value="original">Original Size</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Position</label>
                      <select
                        value={bg.position || 'center'}
                        onChange={(e) => onUpdateBackground({ ...bg, position: e.target.value })}
                        style={{ width: '100%', height: '32px', border: '1px solid var(--color-gray)', borderRadius: '4px', fontSize: '12px', padding: '0 6px' }}
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Artwork Opacity ({Math.round((bg.imageOpacity !== undefined ? bg.imageOpacity : 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={bg.imageOpacity !== undefined ? bg.imageOpacity : 1}
                      onChange={(e) => onUpdateBackground({ ...bg, imageOpacity: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateBackground({ ...bg, image: '' })}
                    style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    ✕ Remove Background Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: PALETTES & THEME PRESETS
            ============================================================== */}
        {currentTab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                GateApass Color Palettes
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Apply harmonious curated palettes across headers, accents, and credentials.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GATEAPASS_COLOR_PALETTES.map((pal) => (
                <div
                  key={pal.id}
                  onClick={() => {
                    onApplyPalette(pal.theme);
                    onUpdateBackground({ ...bg, color: pal.theme.background });
                  }}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-white)',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    {pal.name}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '18px', height: '18px', backgroundColor: pal.theme.headerBg, borderRadius: '2px' }} />
                    <div style={{ width: '18px', height: '18px', backgroundColor: pal.theme.accentColor, borderRadius: '2px' }} />
                    <div style={{ width: '18px', height: '18px', backgroundColor: pal.theme.background, border: '1px solid #CCC', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
