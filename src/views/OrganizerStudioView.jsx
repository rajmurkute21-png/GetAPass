import React, { useState } from 'react';
import {
  Plus,
  LayoutDashboard,
  QrCode,
  Users,
  Ticket,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import StatusBadge from '../components/common/StatusBadge';
import QRScanner from '../components/scanner/QRScanner';
import PermissionControl from '../components/permissions/PermissionControl';
import Modal from '../components/common/Modal';
import PassTypeManager from '../components/studio/PassTypeManager';
import EventCreateWizard from '../components/events/EventCreateWizard';
import {
  CATEGORIES,
  AUTHORITIES,
  PERMISSION_AREAS,
  INITIAL_AUTHORITY_PERMISSIONS
} from '../data/mockData';
import { getPassTypesByEvent } from '../data/passTypes';

export default function OrganizerStudioView({
  initialTab = 'dashboard',
  events = [],
  currentUser = null,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  participants = [],
  onUpdateParticipants,
  checkinHistory = [],
  onRecordCheckin,
  onClearHistory,
  onBackToProfile
}) {
  // Organizer navigation tab
  const [activeTab, setActiveTab] = useState(initialTab);

  // Enforce organizer UID ownership boundary (never show another organizer's events)
  const organizerEvents = React.useMemo(() => {
    if (!currentUser?.uid) return [];
    return events.filter((e) => e.organizerUid === currentUser.uid);
  }, [events, currentUser?.uid]);

  // Selected event being managed from owned events only
  const [selectedEventId, setSelectedEventId] = useState(() => organizerEvents[0]?.id || '');

  // Keep selected event synced to owned events
  const currentEvent = React.useMemo(() => {
    return organizerEvents.find((e) => e.id === selectedEventId) || organizerEvents[0] || null;
  }, [organizerEvents, selectedEventId]);

  // Edit Event Modal State
  const [editingEventModalOpen, setEditingEventModalOpen] = useState(false);
  const [editEventData, setEditEventData] = useState(null);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState({
    isOpen: false,
    event: null,
    reason: ''
  });

  // Selected participant for authority modal
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [authorityModalOpen, setAuthorityModalOpen] = useState(false);
  const [newAuthority, setNewAuthority] = useState('Participant');

  // Authority permissions matrix
  const [authorityPermissions, setAuthorityPermissions] = useState(INITIAL_AUTHORITY_PERMISSIONS);
  const [selectedAuthorityForEdit, setSelectedAuthorityForEdit] = useState('Participant');

  // Filter participants for current owned event
  const eventParticipants = currentEvent?.title
    ? participants.filter((p) => {
        const pEv = (p.event || p.eventTitle || '').toLowerCase();
        const curTitle = (currentEvent.title || currentEvent.name || '').toLowerCase();
        return pEv === curTitle;
      })
    : [];

  const handleOpenEditEvent = (ev) => {
    setEditEventData({ ...ev });
    setEditingEventModalOpen(true);
  };

  const handleSaveEditEvent = (e) => {
    e.preventDefault();
    if (!editEventData || !editEventData.title.trim()) return;

    if (onUpdateEvent) {
      onUpdateEvent(editEventData);
    }
    setEditingEventModalOpen(false);
  };

  const handleDeleteEvent = (ev) => {
    if (!ev) return;
    setDeleteConfirmationModal({
      isOpen: true,
      event: ev,
      reason: ''
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmationModal.event) return;
    const ev = deleteConfirmationModal.event;
    const title = ev.title || ev.name || 'this event';
    const reason = deleteConfirmationModal.reason || 'Terminated by organizer';
    if (onDeleteEvent) {
      onDeleteEvent(ev.id, title, reason);
    }
    setDeleteConfirmationModal({ isOpen: false, event: null, reason: '' });
  };

  const handleSaveAuthority = () => {
    if (selectedParticipant && onUpdateParticipants) {
      const updated = participants.map((p) =>
        p.id === selectedParticipant.id ? { ...p, authority: newAuthority } : p
      );
      onUpdateParticipants(updated);
    }
    setAuthorityModalOpen(false);
  };

  const handleTogglePermission = (area) => {
    setAuthorityPermissions((prev) => {
      const current = prev[selectedAuthorityForEdit] || [];
      const updated = current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area];
      return { ...prev, [selectedAuthorityForEdit]: updated };
    });
  };

  return (
    <div className="gateapass-organizer-studio" style={{ textAlign: 'left', minHeight: '100vh', backgroundColor: '#F8F7FC' }}>
      {/* Organizer Studio Top Bar */}
      <header
        style={{
          borderBottom: '1px solid #E9E5F0',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(24, 21, 38, 0.04)',
          padding: '16px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onBackToProfile}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#181526',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E9E5F0',
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <ArrowLeft size={14} />
            Back to Attendee Portal
          </button>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#E9E5F0' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#181526' }}>
                Event Organizer Studio
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  color: '#7C3AED',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'capitalize'
                }}
              >
                {currentUser?.role ? `${currentUser.role} Mode` : 'Organizer Studio'} · {organizerEvents.length} Events Managed
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#777487', marginTop: '2px' }}>
              Automatic administrator for all your campus events and turnstiles.
            </p>
          </div>
        </div>

        {/* Managed Event Selector & Quick Create */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {organizerEvents.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>Managing:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--color-white)',
                  cursor: 'pointer',
                  maxWidth: '220px'
                }}
              >
                {organizerEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title || ev.name} ({ev.category})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button
            variant="liquid-glass"
            size="compact"
            icon={Plus}
            onClick={() => setActiveTab('create-event')}
          >
            Create New Event
          </Button>
        </div>
      </header>

      {/* Organizer Studio Navigation Tabs */}
      <div
        style={{
          borderBottom: '1px solid #E9E5F0',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0 32px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'dashboard', label: 'Event Dashboard', icon: LayoutDashboard },
          { id: 'create-event', label: 'Create Event', icon: Plus },
          { id: 'passes', label: 'Pass Types & Tiers', icon: Ticket },
          { id: 'verifier', label: 'Gate QR Verifier', icon: QrCode, badge: 'Scanner' },
          { id: 'participants', label: 'Participants', icon: Users, count: eventParticipants.length },
          { id: 'permissions', label: 'Authorities & Zones', icon: ShieldAlert }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#7C3AED' : '#181526',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={16} strokeWidth={isActive ? 2.2 : 1.7} style={{ color: isActive ? '#7C3AED' : '#777487' }} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-violet)',
                    color: 'var(--color-white)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-gray)'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Studio Body */}
      <div style={{ padding: '36px 32px 72px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* ==============================================================
            1. EVENT DASHBOARD TAB
            ============================================================== */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {organizerEvents.length === 0 ? (
              <div
                style={{
                  padding: '64px 32px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-white)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-light-violet)',
                    color: 'var(--color-deep-violet)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={32} />
                </div>
                <div>
                  <h2 className="text-h2" style={{ color: 'var(--color-dark-text)' }}>
                    Welcome to Organizer Studio
                  </h2>
                  <p style={{ fontSize: '15px', color: 'var(--color-muted-text)', maxWidth: '520px', margin: '8px auto 0', lineHeight: '24px' }}>
                    You haven’t created any campus events yet. Create an event to configure pass tiers, customize templates in Pass Studio, manage attendees, and launch instant QR turnstile gate verification.
                  </p>
                </div>
                <Button
                  variant="violet"
                  size="large"
                  icon={Plus}
                  onClick={() => setActiveTab('create-event')}
                >
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <>
                {/* CURRENT SELECTED EVENT BANNER */}
                {currentEvent && (
                  <div
                    style={{
                      padding: '28px',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-white)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          CURRENTLY MANAGING: {currentEvent.category}
                        </span>
                        <StatusBadge status={currentEvent.status || 'Active'} />
                      </div>
                      <h1 className="text-h1" style={{ fontSize: '32px', color: 'var(--color-dark-text)' }}>
                        {currentEvent.title || currentEvent.name}
                      </h1>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                        {currentEvent.date} · {currentEvent.time} · {currentEvent.venue}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline"
                        icon={Edit2}
                        onClick={() => handleOpenEditEvent(currentEvent)}
                      >
                        Edit Event Details
                      </Button>
                      <Button
                        variant="violet"
                        icon={Ticket}
                        onClick={() => setActiveTab('passes')}
                      >
                        Configure Pass Tiers
                      </Button>
                      <Button
                        variant="primary"
                        icon={QrCode}
                        onClick={() => setActiveTab('verifier')}
                      >
                        Launch Gate Verifier
                      </Button>
                    </div>
                  </div>
                )}

            {/* ==============================================================
                ALL MANAGED CAMPUS EVENTS (CRITICAL BUG FIX SECTION)
                Shows all events side-by-side. None are hidden or overwritten.
                ============================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                    My Organized Events ({organizerEvents.length})
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                    All events created by your organizer account remain permanently saved and active.
                  </p>
                </div>

                <Button
                  variant="primary"
                  icon={Plus}
                  size="compact"
                  onClick={() => setActiveTab('create-event')}
                >
                  Create New Event
                </Button>
              </div>

              <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-off-white)', borderBottom: '1px solid var(--color-gray)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Event</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Schedule & Venue</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Starting</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizerEvents.map((ev) => {
                      const isSelected = ev.id === selectedEventId;
                      const eventPasses = getPassTypesByEvent(ev.id);

                      return (
                        <tr
                          key={ev.id}
                          style={{
                            borderBottom: '1px solid var(--color-gray)',
                            backgroundColor: isSelected ? 'rgba(172, 88, 233, 0.04)' : 'var(--color-white)',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {ev.bannerImage && (
                                <img
                                  src={ev.bannerImage}
                                  alt=""
                                  style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--color-dark-text)' }}>
                                  {ev.title || ev.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                                  ID: {ev.id} · {eventPasses.length} Pass Tiers
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px', color: 'var(--color-deep-violet)', fontWeight: 600 }}>
                            {ev.category}
                          </td>

                          <td style={{ padding: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{ev.date}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{ev.venue}</div>
                          </td>

                          <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-deep-violet)' }}>
                            ₹{ev.startingPrice}
                          </td>

                          <td style={{ padding: '16px' }}>
                            <StatusBadge status={ev.status || 'Active'} />
                          </td>

                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEventId(ev.id);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-control)',
                                  border: isSelected ? '1px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                                  backgroundColor: isSelected ? 'var(--color-light-violet)' : 'var(--color-white)',
                                  color: isSelected ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected ? '✓ Active' : 'Select'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditEvent(ev)}
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-control)',
                                  border: '1px solid var(--color-gray)',
                                  backgroundColor: 'var(--color-white)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>

                              {ev.status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const title = ev.title || ev.name || 'this event';
                                    if (window.confirm(`Terminate "${title}"? This will cancel the event and automatically delete associated passes from attendees' My Passes.`)) {
                                      if (onUpdateEvent) {
                                        onUpdateEvent({ ...ev, status: 'Cancelled' });
                                      }
                                    }
                                  }}
                                  title="Terminate Event & Invalidate Passes"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-control)',
                                    border: '1px solid #FEDF89',
                                    backgroundColor: '#FFFAEB',
                                    color: '#B54708',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <ShieldAlert size={12} /> Terminate
                                </button>
                              )}

                              {onDeleteEvent && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev)}
                                  title="Delete Event from Database"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-control)',
                                    border: '1px solid #FECDCA',
                                    backgroundColor: '#FEF3F2',
                                    color: '#B42318',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-white)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Passes Issued
                </span>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '6px', color: 'var(--color-dark-text)' }}>
                  {eventParticipants.length}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', fontWeight: 500 }}>
                  Registered attendees
                </span>
              </div>

              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-white)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Gross Revenue
                </span>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '6px', color: 'var(--color-dark-text)' }}>
                  ₹{eventParticipants.reduce((sum, p) => sum + (parseInt((p.payment || '').replace(/[^0-9]/g, '') || 0, 10)), 0)}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-deep-violet)', fontWeight: 600 }}>
                  Direct gateway settlements
                </span>
              </div>

              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-white)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Turnstile Check-ins
                </span>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '6px', color: 'var(--color-dark-text)' }}>
                  {checkinHistory.filter((c) => c.result === 'Valid' && (c.event || '').toLowerCase() === (currentEvent?.title || '').toLowerCase()).length}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                  Gate entries recorded
                </span>
              </div>

              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-white)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Gate Security Status
                </span>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '12px', color: 'var(--color-success)' }}>
                  ✓ Cryptographic Sync
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                  Turnstiles ready
                </span>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div
                style={{
                  padding: '24px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--color-white)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <QrCode size={22} style={{ color: 'var(--color-violet)' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>Gate Turnstile Verification</h4>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
                  Turn any smartphone or gate tablet into a pass scanner. Instantly validate SHA-256 signed QR codes without installing any native app.
                </p>
                <Button variant="primary" onClick={() => setActiveTab('verifier')}>
                  Open Verifier Tool →
                </Button>
              </div>

              <div
                style={{
                  padding: '24px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--color-white)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ticket size={22} style={{ color: 'var(--color-deep-violet)' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>Pass Types & Templates</h4>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
                  Configure VIP, Couple, and Group tiers with independent pricing and assign distinct templates from the Template Library.
                </p>
                <Button variant="outline" onClick={() => setActiveTab('passes')}>
                  Manage Pass Types →
                </Button>
              </div>
            </div>
          </>
          )}
        </div>
      )}

        {/* ==============================================================
            2. CREATE EVENT TAB (Comprehensive Wizard)
            ============================================================== */}
        {activeTab === 'create-event' && (
          <EventCreateWizard
            onCancel={() => setActiveTab('dashboard')}
            onEventCreated={(newEvent) => {
              if (onCreateEvent) {
                onCreateEvent(newEvent);
              }
              setSelectedEventId(newEvent.id);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* ==============================================================
            3. GATE QR VERIFIER TAB
            ============================================================== */}
        {activeTab === 'verifier' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '520px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                INTEGRATED VERIFICATION SUITE
              </span>
              <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)', marginTop: '4px' }}>
                Turnstile Gate Scanner
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Active validation tool for <strong>{currentEvent?.title || currentEvent?.name}</strong>.
              </p>
            </div>

            <div style={{ width: '100%', maxWidth: '420px' }}>
              <QRScanner
                history={checkinHistory}
                onAllowEntry={onRecordCheckin}
                onClearHistory={onClearHistory}
                currentEvent={currentEvent}
                gate="Main Gate"
                verifierUser={currentUser}
              />
            </div>
          </div>
        )}

        {/* ==============================================================
            4. PARTICIPANTS TAB
            ============================================================== */}
        {activeTab === 'participants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 className="text-h2" style={{ fontSize: '28px' }}>
                Attendee Ledger: {currentEvent?.title || currentEvent?.name}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Audit registered participants, change authority tiers, and review payment statuses.
              </p>
            </div>

            <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-gray)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Attendee</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Pass Tier</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Pass ID</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Authority</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eventParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
                        No attendees registered yet for this event. Bookings will show up here automatically.
                      </td>
                    </tr>
                  ) : (
                    eventParticipants.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{p.email}</div>
                        </td>
                        <td style={{ padding: '16px' }}>{p.pass}</td>
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-deep-violet)' }}>{p.passId}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{p.authority}</td>
                        <td style={{ padding: '16px' }}><StatusBadge status={p.status} /></td>
                        <td style={{ padding: '16px' }}>
                          <Button
                            variant="outline"
                            size="compact"
                            onClick={() => {
                              setSelectedParticipant(p);
                              setNewAuthority(p.authority);
                              setAuthorityModalOpen(true);
                            }}
                          >
                            Change Authority
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            5. PASS TYPES & TIERS TAB
            ============================================================== */}
        {activeTab === 'passes' && currentEvent && (
          <PassTypeManager
            event={currentEvent}
          />
        )}

        {/* ==============================================================
            6. AUTHORITIES & ZONES TAB
            ============================================================== */}
        {activeTab === 'permissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 className="text-h2" style={{ fontSize: '28px' }}>Campus Zone Permissions</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Configure access policies per authority tier for <strong>{currentEvent?.title || currentEvent?.name}</strong>.
              </p>
            </div>

            {/* Authority selector */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {AUTHORITIES.map((auth) => {
                const isSel = selectedAuthorityForEdit === auth;
                return (
                  <button
                    key={auth}
                    type="button"
                    onClick={() => setSelectedAuthorityForEdit(auth)}
                    style={{
                      height: '36px',
                      padding: '0 16px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: isSel ? 'var(--color-black)' : 'var(--color-white)',
                      color: isSel ? 'var(--color-white)' : 'var(--color-dark-text)',
                      border: '1px solid var(--color-gray)',
                      fontSize: '13px',
                      fontWeight: isSel ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {auth}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px' }}>
              {PERMISSION_AREAS.map((area) => {
                const isAllowed = (authorityPermissions[selectedAuthorityForEdit] || []).includes(area);
                return (
                  <PermissionControl
                    key={area}
                    title={`Access: ${area}`}
                    description={`Permits badge holders to enter ${area} turnstiles.`}
                    allowed={isAllowed}
                    onChange={() => handleTogglePermission(area)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* EDIT EVENT MODAL */}
      {editingEventModalOpen && editEventData && (
        <Modal
          isOpen={true}
          onClose={() => setEditingEventModalOpen(false)}
          title={`Edit Event: ${editEventData.title || editEventData.name}`}
          size="medium"
        >
          <form onSubmit={handleSaveEditEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Event Name"
              value={editEventData.title || editEventData.name}
              onChange={(e) => setEditEventData({ ...editEventData, title: e.target.value, name: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={editEventData.category}
                  onChange={(e) => setEditEventData({ ...editEventData, category: e.target.value })}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 8px', fontSize: '13px' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Starting Price (₹)"
                type="number"
                value={editEventData.startingPrice}
                onChange={(e) => setEditEventData({ ...editEventData, startingPrice: Number(e.target.value) })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Date"
                value={editEventData.date}
                onChange={(e) => setEditEventData({ ...editEventData, date: e.target.value })}
              />
              <Input
                label="Time"
                value={editEventData.time}
                onChange={(e) => setEditEventData({ ...editEventData, time: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Venue"
                value={editEventData.venue}
                onChange={(e) => setEditEventData({ ...editEventData, venue: e.target.value })}
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Event Status
                </label>
                <select
                  value={editEventData.status || 'Active'}
                  onChange={(e) => setEditEventData({ ...editEventData, status: e.target.value })}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 8px', fontSize: '13px' }}
                >
                  <option value="Active">Active (Published to Attendees)</option>
                  <option value="Draft">Draft (Private / Hidden)</option>
                  <option value="Cancelled">Cancelled / Terminated (Removes passes from My Passes)</option>
                </select>
              </div>
            </div>

            <Input
              label="Cover Image URL"
              value={editEventData.bannerImage}
              onChange={(e) => setEditEventData({ ...editEventData, bannerImage: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setEditingEventModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Authority Change Modal */}
      <Modal
        isOpen={authorityModalOpen}
        onClose={() => setAuthorityModalOpen(false)}
        title="Change Participant Authority"
        confirmText="Save Authority"
        onConfirm={handleSaveAuthority}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)' }}>
            Adjusting role for <strong>{selectedParticipant?.name}</strong>.
          </p>
          <Select
            label="Authority Role"
            value={newAuthority}
            options={AUTHORITIES}
            onChange={(e) => setNewAuthority(e.target.value)}
          />
        </div>
      </Modal>

      {/* Organizer Event Deletion / Termination Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmationModal.isOpen}
        onClose={() => setDeleteConfirmationModal({ isOpen: false, event: null, reason: '' })}
        title="Confirm Event Deletion & Termination"
        confirmText="Confirm & Terminate Event"
        onConfirm={handleConfirmDelete}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div style={{ padding: '12px', backgroundColor: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: '8px', color: '#B42318', fontSize: '13px' }}>
            <strong>Warning:</strong> Terminating or deleting <strong>"{deleteConfirmationModal.event?.title || deleteConfirmationModal.event?.name}"</strong> will remove it from discovery and automatically move issued passes to attendees' Pass History.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Reason for Event Termination (Optional)
            </label>
            <textarea
              value={deleteConfirmationModal.reason}
              onChange={(e) => setDeleteConfirmationModal({ ...deleteConfirmationModal, reason: e.target.value })}
              placeholder="e.g. Rescheduled due to weather, venue change, completed festival"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
