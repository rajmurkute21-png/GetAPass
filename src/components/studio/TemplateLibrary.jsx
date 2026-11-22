import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Edit3,
  Eye,
  Trash2,
  Search
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Ticket3D from '../pass/Ticket3D';
import {
  getAllTemplates,
  TEMPLATE_CATEGORIES,
  createCustomTemplate,
  duplicateTemplate,
  deleteCustomTemplate,
  SAMPLE_PASS_DATA
} from '../../data/passTemplates';

export default function TemplateLibrary({
  onOpenEditor,
  onSelectTemplateForEvent
}) {
  const [templates, setTemplates] = useState(getAllTemplates);
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'system' | 'custom'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // New Custom Template Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Hackathon');
  const [baseTemplateId, setBaseTemplateId] = useState('tpl-classic-violet');

  const refreshTemplates = () => {
    setTemplates(getAllTemplates());
  };

  useEffect(() => {
    const handleChanged = () => refreshTemplates();
    window.addEventListener('gateapass_templates_changed', handleChanged);
    return () => window.removeEventListener('gateapass_templates_changed', handleChanged);
  }, []);

  const filteredTemplates = templates.filter((t) => {
    // Tab filter
    if (tabFilter === 'system' && !t.isSystemTemplate) return false;
    if (tabFilter === 'custom' && t.isSystemTemplate) return false;

    // Category filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Custom') {
        if (t.isSystemTemplate) return false;
      } else if (t.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = createCustomTemplate({
      name: newName.trim(),
      description: newDesc.trim() || 'Custom GateApass pass template.',
      category: newCategory,
      baseTemplateId
    });

    setCreateModalOpen(false);
    setNewName('');
    setNewDesc('');
    refreshTemplates();
    if (onOpenEditor) onOpenEditor(created);
  };

  const handleDuplicate = (tpl) => {
    const duplicated = duplicateTemplate(tpl);
    refreshTemplates();
    if (onOpenEditor) onOpenEditor(duplicated);
  };

  const handleDelete = (tpl) => {
    if (tpl.isSystemTemplate) return;
    if (window.confirm(`Are you sure you want to remove template "${tpl.name}"?`)) {
      deleteCustomTemplate(tpl.id);
      refreshTemplates();
    }
  };

  return (
    <div className="gateapass-template-library" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Action */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              GATEAPASS DESIGN ENGINE
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: 'var(--color-light-violet)', color: 'var(--color-deep-violet)', padding: '2px 8px', borderRadius: '4px' }}>
              Central Library
            </span>
          </div>
          <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
            Pass Template Library
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
            Browse official GateApass pass systems or launch the Template Editor to build bespoke layouts with optical QR codes.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Tabs: All / System / My Templates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-gray)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: `All Templates (${templates.length})` },
            { id: 'system', label: `System Templates (${templates.filter((t) => t.isSystemTemplate).length})` },
            { id: 'custom', label: `My Templates (${templates.filter((t) => !t.isSystemTemplate).length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabFilter(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: tabFilter === tab.id ? 700 : 500,
                color: tabFilter === tab.id ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                backgroundColor: tabFilter === tab.id ? 'var(--color-light-violet)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-text)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            style={{
              width: '100%',
              height: '36px',
              padding: '0 12px 0 34px',
              fontSize: '13px',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-control)',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {TEMPLATE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--color-black)' : 'var(--color-off-white)',
                color: isActive ? 'var(--color-white)' : 'var(--color-dark-text)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Template Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}
      >
        {filteredTemplates.map((tpl) => {
          return (
            <div
              key={tpl.id}
              style={{
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-white)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Scaled Mini 3D Pass Preview */}
              <div
                style={{
                  backgroundColor: '#0c0a17',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ transform: 'scale(0.46)', transformOrigin: 'center center' }}>
                  <Ticket3D
                    pass={{
                      id: tpl.id,
                      eventTitle: tpl.eventTitle || tpl.name,
                      title: tpl.eventTitle || tpl.name,
                      category: tpl.category || 'Concert',
                      passType: tpl.passType || 'Standard Pass',
                      attendeeName: 'Aarav Shah',
                      authority: tpl.authority || 'Participant',
                      date: tpl.date || '15 October 2026',
                      time: tpl.time || '10:00 AM',
                      venue: tpl.venue || 'Campus Auditorium',
                      gate: tpl.gate || 'Gate A',
                      status: 'Active',
                      price: tpl.price || 499,
                      permissions: tpl.permissions || ['General Area']
                    }}
                    isInteractive={false}
                  />
                </div>

                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: tpl.isSystemTemplate ? 'rgba(255, 255, 255, 0.15)' : '#7C3AED',
                      color: 'var(--color-white)'
                    }}
                  >
                    {tpl.isSystemTemplate ? 'System Preset' : `v${tpl.currentVersion || 1} Custom 3D`}
                  </span>
                </div>
              </div>

              {/* Template Card Meta */}
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-text)', margin: 0 }}>
                    {tpl.name}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-deep-violet)' }}>
                    {tpl.category}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '18px', margin: '0 0 16px', flex: 1 }}>
                  {tpl.description}
                </p>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-white)',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={13} /> Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(tpl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-white)',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={13} /> Duplicate
                  </button>

                  {/* Edit Template (Custom templates or editable copies) */}
                  <button
                    type="button"
                    onClick={() => onOpenEditor && onOpenEditor(tpl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-black)',
                      color: 'var(--color-white)',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={13} /> Edit Template
                  </button>

                  {!tpl.isSystemTemplate && (
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl)}
                      title="Archive template"
                      style={{
                        padding: '6px',
                        border: '1px solid #FCA5A5',
                        borderRadius: 'var(--radius-control)',
                        backgroundColor: '#FFF',
                        color: '#DC2626',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-muted-text)', margin: 0 }}>
            No templates found matching your search and filter criteria.
          </p>
        </div>
      )}

      {/* DYNAMIC 3D PASS PREVIEW MODAL */}
      {previewTemplate && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewTemplate(null)}
          title={`3D Pass Preview: ${previewTemplate.name}`}
          maxWidth="1020px"
          padding="20px 24px"
          cancelText={null}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Ticket3D
              pass={{
                id: previewTemplate.id || 'GP-PREVIEW-001',
                eventTitle: previewTemplate.eventTitle || previewTemplate.name,
                title: previewTemplate.eventTitle || previewTemplate.name,
                category: previewTemplate.category || 'Concert',
                passType: previewTemplate.passType || 'Standard Pass',
                attendeeName: 'Aarav Shah',
                authority: previewTemplate.authority || 'Participant',
                price: previewTemplate.price || 499,
                venue: previewTemplate.venue || 'Campus Auditorium',
                date: previewTemplate.date || '15 October 2026',
                time: previewTemplate.time || '10:00 AM',
                gate: previewTemplate.gate || 'Gate A',
                status: 'Active',
                permissions: previewTemplate.permissions || ['General Area']
              }}
              isInteractive={true}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button
                variant="primary"
                icon={Edit3}
                onClick={() => {
                  const target = previewTemplate;
                  setPreviewTemplate(null);
                  if (onOpenEditor) onOpenEditor(target);
                }}
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                Open in Pass Studio
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {createModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Pass Template"
          size="medium"
        >
          <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Template Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. VIP Obsidian, Festival Gold"
              required
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Template Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', height: '38px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 10px', fontSize: '14px' }}
              >
                {TEMPLATE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief summary of when to use this pass..."
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Base Template (Starting Layout)
              </label>
              <select
                value={baseTemplateId}
                onChange={(e) => setBaseTemplateId(e.target.value)}
                style={{ width: '100%', height: '38px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 10px', fontSize: '14px' }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create & Open Editor →
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
