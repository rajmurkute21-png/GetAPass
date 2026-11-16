import React, { useState } from 'react';
import {
  Type,
  QrCode,
  Layers,
  Shield,
  Eye,
  EyeOff,
  Tag,
  Info,
  Calendar,
  UserCheck,
  Sparkles,
  Plus,
  Image as ImageIcon,
  Minus,
  ChevronUp,
  ChevronDown,
  Trash2
} from 'lucide-react';
import Button from '../common/Button';

export default function ElementLibrary({
  elements = [],
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onAddElement,
  onDeleteElement,
  onReorderLayer
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'branding':
        return Sparkles;
      case 'headerRow':
        return Tag;
      case 'dynamicText':
      case 'text':
        return Type;
      case 'qr':
        return QrCode;
      case 'image':
      case 'logo':
        return ImageIcon;
      case 'detailsGrid':
        return UserCheck;
      case 'accessTags':
        return Shield;
      case 'footerNotes':
        return Info;
      default:
        return Layers;
    }
  };

  const handleCreateNewElement = (type) => {
    setAddMenuOpen(false);
    if (!onAddElement) return;

    const id = `el-${type}-${Date.now()}`;
    const highestZ = Math.max(1, ...elements.map((e) => e.zIndex || 1));

    let newEl;
    if (type === 'text') {
      newEl = {
        id,
        type: 'text',
        title: 'Custom Text',
        content: 'New Text Element',
        x: 100,
        y: 500,
        width: 400,
        height: 60,
        zIndex: highestZ + 1,
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 600,
        fontStyle: 'normal',
        color: '#0A0A0D',
        textAlign: 'left',
        visible: true
      };
    } else if (type === 'dynamicText') {
      newEl = {
        id,
        type: 'dynamicText',
        title: 'Dynamic Field',
        field: '{{participant.name}}',
        x: 100,
        y: 450,
        width: 600,
        height: 70,
        zIndex: highestZ + 1,
        fontFamily: 'Inter',
        fontSize: 36,
        fontWeight: 700,
        fontStyle: 'normal',
        color: '#0A0A0D',
        textAlign: 'left',
        visible: true
      };
    } else if (type === 'image') {
      newEl = {
        id,
        type: 'image',
        title: 'Pass Image',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        x: 150,
        y: 200,
        width: 300,
        height: 180,
        zIndex: highestZ + 1,
        fit: 'cover',
        opacity: 1,
        visible: true
      };
    } else if (type === 'divider') {
      newEl = {
        id,
        type: 'divider',
        title: 'Divider Line',
        x: 50,
        y: 400,
        width: 800,
        height: 2,
        zIndex: highestZ + 1,
        color: '#E8E8E8',
        visible: true
      };
    }

    if (newEl) {
      onAddElement(newEl);
      onSelectElement(newEl.id);
    }
  };

  return (
    <div
      className="gateapass-element-library"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-white)',
        borderRight: '1px solid var(--color-gray)',
        overflowY: 'auto',
        textAlign: 'left'
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-gray)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-dark-text)', margin: 0 }}>
              Layers & Elements
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '2px 0 0' }}>
              Freely drag, reorder, or add layers on 900×1400 canvas.
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setAddMenuOpen(!addMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--color-black)',
                color: 'var(--color-white)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Add
            </button>

            {addMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-gray)',
                  borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 200,
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleCreateNewElement('dynamicText')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Type size={14} /> Dynamic Field
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewElement('text')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Type size={14} /> Custom Text
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewElement('image')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ImageIcon size={14} /> Image Graphic
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewElement('divider')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Minus size={14} /> Divider Line
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Elements List sorted by zIndex descending (top layer first) */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[...elements]
          .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
          .map((el) => {
            const IconComp = getIcon(el.type);
            const isSelected = selectedElementId === el.id;
            const isVisible = el.visible !== false;

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: isSelected ? 'var(--color-light-violet)' : 'var(--color-white)',
                  border: isSelected ? '1px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <IconComp
                    size={16}
                    style={{
                      color: isSelected ? 'var(--color-deep-violet)' : 'var(--color-muted-text)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : 500,
                        color: 'var(--color-dark-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {el.title || el.type}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
                      z:{el.zIndex || 1} · ({el.x || 0}, {el.y || 0})
                    </div>
                  </div>
                </div>

                {/* Layer Reorder & Visibility Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  {onReorderLayer && (
                    <>
                      <button
                        type="button"
                        title="Bring Forward"
                        onClick={() => onReorderLayer(el.id, 'up')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#666' }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        title="Send Backward"
                        onClick={() => onReorderLayer(el.id, 'down')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#666' }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    title={isVisible ? 'Hide Layer' : 'Show Layer'}
                    onClick={() => onToggleVisibility(el.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: isVisible ? 'var(--color-dark-text)' : 'var(--color-muted-text)'
                    }}
                  >
                    {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>

                  {onDeleteElement && el.type !== 'qr' && (
                    <button
                      type="button"
                      title="Delete Element"
                      onClick={() => onDeleteElement(el.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
