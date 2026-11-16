import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Check, Link } from 'lucide-react';
import Button from './Button';
import { EVENT_IMAGE_PRESETS } from '../../data/mockData';

/**
 * EventPhotoUploader component
 * Allows admin to upload device photos (Base64), paste URLs, or pick presets.
 * Live-updates event cards across the entire application.
 */
export default function EventPhotoUploader({
  value,
  onChange,
  label = 'Event Card & Banner Photo',
  helperText = 'Upload an image from your device (JPG, PNG, WEBP) to display on attendee event cards.'
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Limit to 5MB for browser state storage
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  return (
    <div className="gateapass-photo-uploader" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
          {label}
        </label>
        {uploadSuccess && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Photo updated for event cards!
          </span>
        )}
      </div>

      {helperText && (
        <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '-4px 0 2px' }}>
          {helperText}
        </p>
      )}

      {/* Main Upload Drop Area & Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed var(--color-violet)' : '1px dashed var(--color-gray)',
          backgroundColor: isDragging ? 'var(--color-light-violet)' : 'var(--color-off-white)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Current Preview Banner */}
        {value ? (
          <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-near-black)' }}>
            <img
              src={value}
              alt="Event Card Banner Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: 'var(--color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={13} />
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                title="Remove photo"
                style={{
                  backgroundColor: 'rgba(217, 45, 32, 0.85)',
                  color: 'var(--color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'var(--color-white)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              Card Banner Preview
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-violet)'
              }}
            >
              <ImageIcon size={24} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                Drag and drop your event photo here
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                Supports JPG, PNG, WEBP up to 5MB
              </p>
            </div>
            <Button
              variant="outline"
              size="compact"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Choose Photo from Device
            </Button>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="compact"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Upload from Device
            </Button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: 'var(--color-deep-violet)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Link size={12} />
              {showUrlInput ? 'Hide URL input' : 'Paste web image URL'}
            </button>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
            Aspect ratio 16:9 recommended
          </span>
        </div>

        {/* Web URL input fold-down */}
        {showUrlInput && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="url"
              placeholder="https://example.com/event-banner.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '13px',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-white)',
                outline: 'none'
              }}
            />
            <Button variant="primary" size="compact" onClick={handleApplyUrl} type="button">
              Apply URL
            </Button>
          </div>
        )}
      </div>

      {/* Preset Suggestions */}
      <div style={{ marginTop: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Or pick from campus presets:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {EVENT_IMAGE_PRESETS.map((preset) => {
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setUploadSuccess(true);
                  setTimeout(() => setUploadSuccess(false), 3000);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? 'var(--color-light-violet)' : 'var(--color-white)',
                  color: isSelected ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                  border: isSelected ? '1px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-control)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--color-violet)' : '#CCC'
                  }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
