import React, { useState } from 'react';
import {
  Plus,
  Ticket,
  Edit2,
  Trash2,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Check
} from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import {
  getPassTypesByEvent,
  savePassType,
  deletePassType,
  assignTemplateToPassType
} from '../../data/passTypes';
import { getAllTemplates } from '../../data/passTemplates';
import { AUTHORITIES, PERMISSION_AREAS } from '../../data/mockData';

export default function PassTypeManager({
  event,
  onOpenStudioForTemplate,
  onOpenLibrary
}) {
  const [passTypes, setPassTypes] = useState(() => getPassTypesByEvent(event?.id));
  const [templates, setTemplates] = useState(getAllTemplates);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPassType, setEditingPassType] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(199);
  const [capacity, setCapacity] = useState(500);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-classic-violet');
  const [authority, setAuthority] = useState('Participant');
  const [selectedZones, setSelectedZones] = useState(['General Area']);
  const [accentColor, setAccentColor] = useState('#AC58E9');

  const refreshPassTypes = () => {
    setPassTypes(getPassTypesByEvent(event?.id));
    setTemplates(getAllTemplates());
  };

  React.useEffect(() => {
    setPassTypes(getPassTypesByEvent(event?.id));
  }, [event?.id]);

  const handleOpenCreateModal = () => {
    setEditingPassType(null);
    setName('');
    setDescription('Admission pass with verified gate QR entry.');
    setPrice(event?.startingPrice || 199);
    setCapacity(500);
    setSelectedTemplateId('tpl-classic-violet');
    setAuthority('Participant');
    setSelectedZones(['General Area']);
    setAccentColor('#AC58E9');
    setModalOpen(true);
  };

  const handleOpenEditModal = (pt) => {
    setEditingPassType(pt);
    setName(pt.name);
    setDescription(pt.description || '');
    setPrice(pt.price);
    setCapacity(pt.capacity);
    setSelectedTemplateId(pt.templateId);
    setAuthority(pt.defaultAuthority || 'Participant');
    setSelectedZones(pt.accessPermissions || ['General Area']);
    setAccentColor(pt.accentColor || '#AC58E9');
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved = savePassType({
      id: editingPassType?.id,
      eventId: event.id,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      capacity: Number(capacity),
      templateId: selectedTemplateId,
      templateVersion: 1,
      defaultAuthority: authority,
      accessPermissions: selectedZones,
      accentColor,
      status: 'Active'
    });

    setModalOpen(false);
    refreshPassTypes();
  };

  const handleDelete = (pt) => {
    if (window.confirm(`Delete pass type "${pt.name}"?`)) {
      deletePassType(pt.id);
      refreshPassTypes();
    }
  };

  const handleToggleZone = (zone) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  return (
    <div className="gateapass-pass-type-manager" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              EVENT PASS TIERS
            </span>
          </div>
          <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
            Pass Management: {event?.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
            Define ticket tiers, pricing, default authority levels, access permissions, and assign visual pass templates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" icon={Layers} onClick={onOpenLibrary}>
            Template Library
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Create Pass Type
          </Button>
        </div>
      </div>

      {/* Pass Types Ledger Table */}
      <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden', backgroundColor: 'var(--color-white)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-off-white)', borderBottom: '1px solid var(--color-gray)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Pass Tier</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Capacity</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Assigned Template</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Authority Tier</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Access Zones</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {passTypes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
                  No pass tiers configured yet for this event. Click <strong>Create Pass Type</strong> to get started.
                </td>
              </tr>
            ) : (
              passTypes.map((pt) => {
                const assignedTpl = templates.find((t) => t.id === pt.templateId);

                return (
                  <tr key={pt.id} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            backgroundColor: pt.accentColor || '#AC58E9',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-dark-text)' }}>{pt.name}</div>
                          {pt.description && (
                            <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', maxWidth: '240px' }}>
                              {pt.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                      {pt.price === 0 ? 'Free' : `₹${pt.price}`}
                    </td>

                    <td style={{ padding: '16px', color: 'var(--color-muted-text)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>{pt.soldCount || 0}</span> / {pt.capacity}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-deep-violet)' }}>
                          {assignedTpl?.name || pt.templateId}
                        </span>
                        {assignedTpl && (
                          <button
                            type="button"
                            onClick={() => onOpenStudioForTemplate && onOpenStudioForTemplate(assignedTpl)}
                            title="Open in Pass Studio"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: 'var(--color-muted-text)'
                            }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
                        Version {pt.templateVersion || 1}
                      </span>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-light-violet)',
                          color: 'var(--color-deep-violet)'
                        }}
                      >
                        {pt.defaultAuthority || 'Participant'}
                      </span>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                        {(pt.accessPermissions || ['General Area']).map((zone) => (
                          <span
                            key={zone}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--color-off-white)',
                              border: '1px solid var(--color-gray)',
                              color: 'var(--color-dark-text)'
                            }}
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="compact"
                          icon={Edit2}
                          onClick={() => handleOpenEditModal(pt)}
                          title="Edit Pass Type"
                        />
                        <Button
                          variant="outline"
                          size="compact"
                          icon={Trash2}
                          onClick={() => handleDelete(pt)}
                          title="Delete Pass Type"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Pass Type Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingPassType ? `Edit Pass Type: ${editingPassType.name}` : 'Create New Pass Type'}
          cancelText="Cancel"
          confirmText={null}
          maxWidth="560px"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                Pass Tier Name
              </label>
              <input
                type="text"
                placeholder="e.g. VIP Pass, Volunteer Pass, Couple Pass"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-gray)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                Tier Description
              </label>
              <input
                type="text"
                placeholder="What admissions or perks are included?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-gray)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                  Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-gray)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                  Total Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-gray)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                  Assigned Pass Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-gray)',
                    fontSize: '13px'
                  }}
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.isSystemTemplate ? 'System' : 'Custom'} · v{tpl.currentVersion || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '6px' }}>
                  Default Gate Authority
                </label>
                <select
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-gray)',
                    fontSize: '13px'
                  }}
                >
                  {AUTHORITIES.map((auth) => (
                    <option key={auth} value={auth}>{auth}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Allowed Clearance Zones */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark-text)', display: 'block', marginBottom: '8px' }}>
                Allowed Campus Clearance Zones
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {PERMISSION_AREAS.map((zone) => {
                  const isChecked = selectedZones.includes(zone);
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => handleToggleZone(zone)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-control)',
                        border: isChecked ? '1px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                        backgroundColor: isChecked ? 'var(--color-light-violet)' : 'var(--color-white)',
                        color: isChecked ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                        fontSize: '12px',
                        fontWeight: isChecked ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <span>{zone}</span>
                      {isChecked && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingPassType ? 'Save Pass Tier' : 'Create Pass Tier'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
