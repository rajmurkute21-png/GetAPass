import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Smartphone,
  Monitor,
  ArrowLeft,
  Copy,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/common/Button';
import PassCanvas from '../components/studio/PassCanvas';
import ElementLibrary from '../components/studio/ElementLibrary';
import PropertiesPanel from '../components/studio/PropertiesPanel';
import Modal from '../components/common/Modal';
import {
  saveCustomTemplate,
  publishTemplate,
  duplicateTemplate,
  validateTemplateForPublish,
  SAMPLE_PASS_DATA
} from '../data/passTemplates';

export default function TemplateEditorView({
  template: initialTemplate,
  onClose,
  onSaveSuccess
}) {
  const [template, setTemplate] = useState(() => JSON.parse(JSON.stringify(initialTemplate)));
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'

  // Feedback notifications / modals
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [validationIssues, setValidationIssues] = useState({ errors: [], warnings: [] });
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState(`${initialTemplate?.name || 'Template'} (Copy)`);

  const handleUpdateTheme = (themeUpdates) => {
    setTemplate((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }));
  };

  const handleUpdateBackground = (bgUpdates) => {
    setTemplate((prev) => ({
      ...prev,
      background: { ...prev.background, ...bgUpdates }
    }));
  };

  const handleApplyPalette = (newTheme) => {
    setTemplate((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...newTheme }
    }));
  };

  const handleUpdateLayout = (layoutUpdates) => {
    setTemplate((prev) => ({
      ...prev,
      layout: { ...prev.layout, ...layoutUpdates }
    }));
  };

  const handleUpdateElement = (elementId, updates) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
    }));
  };

  const handleAddElement = (newElement) => {
    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElementId(newElement.id);
  };

  const handleDeleteElement = (elementId) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== elementId)
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const handleToggleVisibility = (elementId) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el))
    }));
  };

  // Reorder layer: 'up' | 'down' | 'top' | 'bottom'
  const handleReorderLayer = (elementId, direction) => {
    setTemplate((prev) => {
      const els = [...prev.elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
      const idx = els.findIndex((e) => e.id === elementId);
      if (idx === -1) return prev;

      if (direction === 'up' && idx < els.length - 1) {
        // Swap zIndex with next
        const currentZ = els[idx].zIndex || (idx + 1);
        const nextZ = els[idx + 1].zIndex || (idx + 2);
        els[idx].zIndex = nextZ;
        els[idx + 1].zIndex = currentZ;
      } else if (direction === 'down' && idx > 0) {
        // Swap with previous
        const currentZ = els[idx].zIndex || (idx + 1);
        const prevZ = els[idx - 1].zIndex || idx;
        els[idx].zIndex = prevZ;
        els[idx - 1].zIndex = currentZ;
      } else if (direction === 'top') {
        const maxZ = Math.max(...els.map((e) => e.zIndex || 1));
        els[idx].zIndex = maxZ + 1;
      } else if (direction === 'bottom') {
        const minZ = Math.min(...els.map((e) => e.zIndex || 1));
        els[idx].zIndex = Math.max(1, minZ - 1);
      }

      return { ...prev, elements: els };
    });
  };

  // Save as Draft
  const handleSaveDraft = () => {
    try {
      let toSave = template;
      if (template.isSystemTemplate) {
        toSave = duplicateTemplate(template, `${template.name} (Custom)`);
      } else {
        toSave = {
          ...template,
          status: 'Draft',
          updatedAt: Date.now()
        };
        saveCustomTemplate(toSave);
      }
      setTemplate(toSave);
      setFeedback({ type: 'success', message: 'Template saved as Draft.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
      if (onSaveSuccess) onSaveSuccess(toSave);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save template.' });
    }
  };

  // Publish Template (Increments version if already published)
  const handlePublish = () => {
    const { isValid, errors, warnings } = validateTemplateForPublish(template);
    setValidationIssues({ errors, warnings });

    if (!isValid) {
      return;
    }

    try {
      const published = publishTemplate(template);
      setTemplate(published);

      setFeedback({
        type: 'success',
        message: `Template successfully published as Version ${published.currentVersion}! Ready for pass assignment.`
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      if (onSaveSuccess) onSaveSuccess(published);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish template.' });
    }
  };

  // Duplicate
  const handleConfirmSaveAs = () => {
    if (!duplicateName.trim()) return;
    const duplicated = duplicateTemplate(template, duplicateName.trim());
    setTemplate(duplicated);
    setSaveAsModalOpen(false);
    setFeedback({ type: 'success', message: `Saved duplicate: "${duplicateName}".` });
    setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    if (onSaveSuccess) onSaveSuccess(duplicated);
  };

  return (
    <div
      className="gateapass-template-editor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-off-white)',
        overflow: 'hidden',
        textAlign: 'left'
      }}
    >
      {/* ==============================================================
          EDITOR TOP BAR
          ============================================================== */}
      <header
        style={{
          height: '60px',
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid var(--color-gray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
          zIndex: 10
        }}
      >
        {/* Left: Back button & Template Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-dark-text)',
              fontWeight: 600,
              fontSize: '13px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-control)'
            }}
          >
            <ArrowLeft size={16} /> Back to Templates
          </button>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-gray)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {template.name}
            </span>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: template.status === 'Published' ? 'var(--color-light-violet)' : '#FEF3C7',
                color: template.status === 'Published' ? 'var(--color-deep-violet)' : '#92400E'
              }}
            >
              {template.status || 'Draft'} · v{template.currentVersion || 1}
            </span>

            {template.isSystemTemplate && (
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontStyle: 'italic' }}>
                (System Template · Edits save as custom copy)
              </span>
            )}
          </div>
        </div>

        {/* Center: Desktop / Mobile preview scale toggle */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', padding: '2px', border: '1px solid var(--color-gray)' }}>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '3px',
              backgroundColor: viewMode === 'desktop' ? 'var(--color-white)' : 'transparent',
              color: viewMode === 'desktop' ? 'var(--color-dark-text)' : 'var(--color-muted-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Monitor size={14} /> Studio Canvas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '3px',
              backgroundColor: viewMode === 'mobile' ? 'var(--color-white)' : 'transparent',
              color: viewMode === 'mobile' ? 'var(--color-dark-text)' : 'var(--color-muted-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={14} /> Phone View
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setSaveAsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'transparent',
              border: '1px solid var(--color-gray)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer'
            }}
          >
            <Copy size={14} /> Duplicate
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'var(--color-off-white)',
              border: '1px solid var(--color-gray)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer'
            }}
          >
            <Save size={14} /> Save Draft
          </button>

          <Button
            variant="primary"
            icon={CheckCircle}
            onClick={handlePublish}
          >
            Publish Template
          </Button>
        </div>
      </header>

      {/* Feedback Alert Bar */}
      {feedback.message && (
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: feedback.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: feedback.type === 'success' ? '#166534' : '#991B1B',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Validation Warning / Error Banner */}
      {validationIssues.errors.length > 0 && (
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#FEF2F2',
            borderBottom: '1px solid #FCA5A5',
            color: '#B91C1C',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
            <AlertCircle size={16} /> Required Fields Missing Before Publish:
          </div>
          <ul style={{ margin: 0, paddingLeft: '24px' }}>
            {validationIssues.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validationIssues.warnings.length > 0 && (
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            color: '#B45309',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          <span>{validationIssues.warnings[0]}</span>
        </div>
      )}

      {/* ==============================================================
          MAIN 3-COLUMN STUDIO LAYOUT
          ============================================================== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT COLUMN: Layers & Elements */}
        <div style={{ width: '280px', flexShrink: 0, height: '100%' }}>
          <ElementLibrary
            elements={template.elements || []}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onToggleVisibility={handleToggleVisibility}
            onAddElement={handleAddElement}
            onDeleteElement={handleDeleteElement}
            onReorderLayer={handleReorderLayer}
          />
        </div>

        {/* CENTER COLUMN: Pass Canvas Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: 'var(--color-off-white)',
            padding: '24px'
          }}
        >
          <PassCanvas
            template={template}
            data={SAMPLE_PASS_DATA}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            isInteractive={true}
            viewMode={viewMode}
          />
        </div>

        {/* RIGHT COLUMN: Properties Panel */}
        <div style={{ width: '360px', flexShrink: 0, height: '100%' }}>
          <PropertiesPanel
            template={template}
            selectedElementId={selectedElementId}
            onUpdateTheme={handleUpdateTheme}
            onUpdateBackground={handleUpdateBackground}
            onUpdateLayout={handleUpdateLayout}
            onUpdateElement={handleUpdateElement}
            onApplyPalette={handleApplyPalette}
            onReorderLayer={handleReorderLayer}
            onDeleteElement={handleDeleteElement}
          />
        </div>
      </div>

      {/* SAVE AS (DUPLICATE) MODAL */}
      {saveAsModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSaveAsModalOpen(false)}
          title="Duplicate Template"
          size="small"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: 0 }}>
              Create an editable custom duplicate of this template in your Template Library.
            </p>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                New Template Name
              </label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                style={{ width: '100%', height: '38px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 10px', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setSaveAsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmSaveAs}>Save Duplicate</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
