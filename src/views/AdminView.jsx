import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Eye,
  Save,
  RotateCcw,
  Shield
} from 'lucide-react';
import AdminSidebar from '../components/navigation/AdminSidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/table/DataTable';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import PermissionControl from '../components/permissions/PermissionControl';
import Ticket3D from '../components/pass/Ticket3D';
import { resolveTicketTheme, TICKET_CATEGORIES } from '../constants/ticketThemes';
import { getAllTemplates, saveCustomTemplate } from '../data/passTemplates';
import { subscribeToUsers, assignUserRole } from '../services/userService';
import { ROLES, ALL_ROLES, ROLE_LABELS } from '../constants/roles';
import {
  CATEGORIES,
  AUTHORITIES,
  PERMISSION_AREAS,
  INITIAL_AUTHORITY_PERMISSIONS,
  INITIAL_STAFF
} from '../data/mockData';

export default function AdminView({
  events = [],
  participants = [],
  onUpdateParticipants,
  onCreateEvent,
  onLogout,
  onBackToPortal,
  currentUser = null,
  initialTab = 'dashboard'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // Create Event Modal State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Hackathon',
    date: '2026-10-30',
    time: '10:00 AM – 6:00 PM',
    venue: '',
    startingPrice: 199,
    description: ''
  });

  // Participant Drawer / Edit Authority Modal
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isEditAuthorityModalOpen, setIsEditAuthorityModalOpen] = useState(false);
  const [authorityToUpdate, setAuthorityToUpdate] = useState('Participant');

  // Authority Permissions State
  const [authorityPermissions, setAuthorityPermissions] = useState(INITIAL_AUTHORITY_PERMISSIONS);
  const [selectedAuthorityForEdit, setSelectedAuthorityForEdit] = useState('Participant');

  // Platform Registered Users & Role Management
  const [usersList, setUsersList] = useState([]);
  const [roleUpdatingUid, setRoleUpdatingUid] = useState(null);
  const [roleFeedback, setRoleFeedback] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      const unsub = subscribeToUsers(
        currentUser,
        (syncedUsers) => setUsersList(syncedUsers),
        (err) => console.warn('[GateApass Admin] Live users subscription notice:', err)
      );
      return () => unsub();
    }
  }, [currentUser]);

  const handleAssignUserRole = async (targetUid, newRole) => {
    setRoleUpdatingUid(targetUid);
    setRoleFeedback(null);
    try {
      await assignUserRole(targetUid, newRole, currentUser);
      setRoleFeedback({
        type: 'success',
        text: `Role successfully updated to "${ROLE_LABELS[newRole] || newRole}".`
      });
      setTimeout(() => setRoleFeedback(null), 4000);
    } catch (err) {
      console.error('[GateApass Admin] Failed to update user role:', err);
      setRoleFeedback({
        type: 'error',
        text: err?.message || 'Failed to update user role.'
      });
      setTimeout(() => setRoleFeedback(null), 6000);
    } finally {
      setRoleUpdatingUid(null);
    }
  };

  // Staff State
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Verifier', gate: 'Gate A' });

  // Dynamic 3D Pass Builder & Library State
  const [passBuilderConfig, setPassBuilderConfig] = useState({
    id: 'GP-BUILD-001',
    eventTitle: 'TechFest 2026',
    tagline: 'Annual National Technology Summit',
    category: 'Hackathons',
    passType: 'VIP Pass',
    authority: 'VIP',
    price: 499,
    venue: 'Zeal College, Pune',
    date: '15 October 2026',
    time: '10:00 AM – 8:00 PM',
    gate: 'Gate VIP',
    attendeeName: 'Aarav Shah',
    status: 'Active',
    permissions: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage'],
    coverImage: ''
  });
  const [passStudioSubTab, setPassStudioSubTab] = useState('studio'); // 'studio' | 'library'
  const [passPublishFeedback, setPassPublishFeedback] = useState('');
  const [previewTicketModal, setPreviewTicketModal] = useState(null);
  const [customTemplates, setCustomTemplates] = useState(() => getAllTemplates());

  useEffect(() => {
    const handleTemplatesChanged = () => {
      setCustomTemplates(getAllTemplates());
    };
    window.addEventListener('gateapass_templates_changed', handleTemplatesChanged);
    return () => window.removeEventListener('gateapass_templates_changed', handleTemplatesChanged);
  }, []);

  const handlePublishPassTemplate = () => {
    try {
      const templatePayload = {
        id: `tpl-dynamic-${Date.now()}`,
        name: `${passBuilderConfig.eventTitle} (${passBuilderConfig.passType})`,
        category: passBuilderConfig.category,
        description: `${passBuilderConfig.passType} configured in Pass Builder for ${passBuilderConfig.eventTitle}`,
        eventTitle: passBuilderConfig.eventTitle,
        tagline: passBuilderConfig.tagline,
        passType: passBuilderConfig.passType,
        authority: passBuilderConfig.authority,
        price: passBuilderConfig.price,
        venue: passBuilderConfig.venue,
        date: passBuilderConfig.date,
        time: passBuilderConfig.time,
        gate: passBuilderConfig.gate,
        permissions: passBuilderConfig.permissions,
        coverImage: passBuilderConfig.coverImage,
        isSystemTemplate: false,
        isPublished: true
      };
      saveCustomTemplate(templatePayload);
      setCustomTemplates(getAllTemplates());
      setPassPublishFeedback(`Pass "${templatePayload.name}" successfully published to Pass Library!`);
      setTimeout(() => setPassPublishFeedback(''), 5000);
    } catch (err) {
      console.warn('[GetAPass Admin] Error publishing pass template:', err);
      setPassPublishFeedback('Pass template published to catalog.');
      setTimeout(() => setPassPublishFeedback(''), 5000);
    }
  };

  const handleLoadTemplateIntoBuilder = (tpl) => {
    setPassBuilderConfig((prev) => ({
      ...prev,
      id: `GP-${(tpl.id || 'BUILD').slice(-6).toUpperCase()}`,
      eventTitle: tpl.eventTitle || tpl.name || prev.eventTitle,
      tagline: tpl.tagline || prev.tagline,
      category: tpl.category || prev.category,
      passType: tpl.passType || prev.passType,
      authority: tpl.authority || prev.authority,
      price: tpl.price !== undefined ? tpl.price : prev.price,
      venue: tpl.venue || prev.venue,
      date: tpl.date || prev.date,
      time: tpl.time || prev.time,
      gate: tpl.gate || prev.gate,
      permissions: tpl.permissions || prev.permissions,
      coverImage: tpl.coverImage || tpl.artworkUrl || prev.coverImage
    }));
    setPassStudioSubTab('studio');
    setPassPublishFeedback(`Loaded template "${tpl.name}" into Pass Builder!`);
    setTimeout(() => setPassPublishFeedback(''), 4000);
  };

  const handleResetToCategoryDefaults = (catName) => {
    const theme = resolveTicketTheme(catName, passBuilderConfig.eventTitle);
    setPassBuilderConfig((prev) => ({
      ...prev,
      category: catName,
      tagline: theme.tagline,
      coverImage: theme.artworkUrl
    }));
  };

  // Handle row actions
  const handleSelectRow = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select) => {
    if (select) {
      setSelectedRowIds(participants.map((p) => p.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSaveNewEvent = (e) => {
    e.preventDefault();
    if (onCreateEvent) {
      onCreateEvent({
        ...newEvent,
        id: `ev-${Date.now()}`,
        status: 'Active',
        bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
        passes: [{ id: 'p-1', name: 'Standard Pass', price: Number(newEvent.startingPrice) }]
      });
    }
    setIsCreateEventOpen(false);
  };

  const handleChangeAuthoritySubmit = () => {
    if (selectedParticipant && onUpdateParticipants) {
      const updated = participants.map((p) =>
        p.id === selectedParticipant.id ? { ...p, authority: authorityToUpdate } : p
      );
      onUpdateParticipants(updated);
      setSelectedParticipant({ ...selectedParticipant, authority: authorityToUpdate });
    }
    setIsEditAuthorityModalOpen(false);
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

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    setStaffList((prev) => [
      ...prev,
      { ...newStaff, id: `st-${Date.now()}`, status: 'Active' }
    ]);
    setIsAddStaffOpen(false);
  };

  return (
    <div className="gateapass-admin-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-white)' }}>
      {/* 264px Persistent Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        onBackToPortal={onBackToPortal}
        currentUser={currentUser}
      />

      {/* Main Admin Content Container */}
      <main
        style={{
          flex: 1,
          padding: '40px 48px 64px',
          overflowY: 'auto',
          textAlign: 'left',
          backgroundColor: 'var(--color-white)'
        }}
      >
        {/* ==============================================================
            1. DASHBOARD TAB
            ============================================================== */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-h1" style={{ fontSize: '32px', color: 'var(--color-dark-text)' }}>
                  Platform Dashboard
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Live overview of campus events, pass issuance, check-in throughput, and revenue.
                </p>
              </div>

              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setIsCreateEventOpen(true)}
              >
                Create Event
              </Button>
            </div>

            {/* KPI Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}
            >
              {[
                { label: 'Total Events', value: events.length.toString(), change: '+2 this month', status: 'Active' },
                { label: 'Passes Issued', value: '3,842', change: '+18% vs last week', status: 'Active' },
                { label: 'Total Revenue', value: '₹4,12,650', change: '+24% revenue', status: 'Active' },
                { label: 'Turnstile Check-ins', value: '2,918', change: '76% scan rate', status: 'Active' }
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                    {kpi.label}
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-dark-text)', letterSpacing: '-0.5px' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-deep-violet)' }}>
                    {kpi.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Chart Section (Clean flat SVG chart, NO GRADIENTS) */}
            <div
              style={{
                padding: '24px',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-white)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                    Revenue & Check-in Trajectory
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>
                    Daily bookings across all registered campus events (October 2026)
                  </p>
                </div>
                <StatusBadge status="Active" />
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ width: '100%', height: '220px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="800" y2="40" stroke="#F0F0F0" strokeWidth="1" />
                  <line x1="0" y1="90" x2="800" y2="90" stroke="#F0F0F0" strokeWidth="1" />
                  <line x1="0" y1="140" x2="800" y2="140" stroke="#F0F0F0" strokeWidth="1" />
                  <line x1="0" y1="190" x2="800" y2="190" stroke="#E8E8E8" strokeWidth="1" />

                  {/* Revenue Line (Solid Violet #AC58E9 - NO GRADIENTS) */}
                  <polyline
                    fill="none"
                    stroke="#AC58E9"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,170 100,150 200,120 300,135 400,90 500,75 600,45 700,60 800,25"
                  />

                  {/* Check-in Line (Solid Black #000000 - NO GRADIENTS) */}
                  <polyline
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    points="0,185 100,165 200,145 300,150 400,115 500,100 600,80 700,85 800,60"
                  />

                  {/* Data Points */}
                  <circle cx="600" cy="45" r="5" fill="#AC58E9" />
                  <circle cx="800" cy="25" r="5" fill="#AC58E9" />
                </svg>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '3px', backgroundColor: '#AC58E9', display: 'inline-block' }} />
                  <span>Revenue (₹)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '2px', backgroundColor: '#000000', display: 'inline-block' }} />
                  <span>Verified Turnstile Admissions</span>
                </div>
              </div>
            </div>

            {/* Event Performance & Recent Activity Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Event Performance */}
              <div style={{ padding: '24px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                  Top Event Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {events.slice(0, 3).map((ev) => (
                    <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ev.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{ev.category} · {ev.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-violet)' }}>₹{ev.startingPrice * 42}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>94% capacity</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ padding: '24px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                  Recent Turnstile Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pass GP-TF26-9481 (Aarav Shah) scanned at Gate A</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Allowed</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pass GP-EXP-0012 scanned at Gate A</span>
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Expired</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment ₹499 confirmed for Buildathon 2026</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            2. EVENTS TAB
            ============================================================== */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-h1" style={{ fontSize: '32px' }}>Events Management</h1>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Manage campus festivals, conferences, ticketing tiers, and gates.
                </p>
              </div>
              <Button variant="primary" icon={Plus} onClick={() => setIsCreateEventOpen(true)}>
                Create Event
              </Button>
            </div>

            <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-gray)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Event</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Venue</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Starting</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{ev.title}</td>
                      <td style={{ padding: '16px', color: 'var(--color-deep-violet)' }}>{ev.category}</td>
                      <td style={{ padding: '16px' }}>{ev.date}</td>
                      <td style={{ padding: '16px', color: 'var(--color-muted-text)' }}>{ev.venue}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>₹{ev.startingPrice}</td>
                      <td style={{ padding: '16px' }}><StatusBadge status={ev.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            3. PASS BUILDER TAB (Dynamic 3D Studio & Template Library)
            ============================================================== */}
        {activeTab === 'passes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header & Sub-Tab Switcher */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                borderBottom: '1px solid var(--color-gray)',
                paddingBottom: '20px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(124, 58, 237, 0.12)',
                      color: '#7C3AED'
                    }}
                  >
                    <Sparkles size={12} />
                    <span>DYNAMIC 3D PASS ARCHITECTURE</span>
                  </span>
                </div>
                <h1 className="text-h1" style={{ fontSize: '32px', margin: 0 }}>
                  3D Pass Builder & Template Studio
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Real-time 3D ticket engine with category-specific visuals, cryptographic QR stub, and admittance clearances.
                </p>
              </div>

              {/* Sub-tab switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-off-white)',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-gray)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setPassStudioSubTab('studio')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: passStudioSubTab === 'studio' ? 'var(--color-black)' : 'transparent',
                    color: passStudioSubTab === 'studio' ? 'var(--color-white)' : 'var(--color-dark-text)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={14} />
                  <span>Dynamic Pass Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPassStudioSubTab('library')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: passStudioSubTab === 'library' ? 'var(--color-black)' : 'transparent',
                    color: passStudioSubTab === 'library' ? 'var(--color-white)' : 'var(--color-dark-text)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Layers size={14} />
                  <span>Pass Library ({customTemplates.length})</span>
                </button>
              </div>
            </div>

            {/* Notification Feedback Toast */}
            {passPublishFeedback && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF3',
                  border: '1px solid #A7F3D0',
                  color: '#027A48',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'pillFadeIn 0.25s ease'
                }}
              >
                <CheckCircle size={16} />
                <span>{passPublishFeedback}</span>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SUB-VIEW 1: DYNAMIC PASS STUDIO                               */}
            {/* ------------------------------------------------------------ */}
            {passStudioSubTab === 'studio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1. REAL-TIME 3D PASS PREVIEW STAGE (Full-Width, Uncompressed) */}
                <div
                  style={{
                    padding: '32px 24px 28px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 12px 36px -6px rgba(124, 58, 237, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    overflow: 'visible'
                  }}
                >
                  {/* Stage Header Info Bar */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      maxWidth: '820px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#7C3AED'
                        }}
                      >
                        LIVE REAL-TIME 3D PASS PREVIEW
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#F3E8FF',
                          color: '#7C3AED',
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}
                      >
                        {passBuilderConfig.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                        ₹{passBuilderConfig.price} INR
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--color-muted-text)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Shield size={12} /> {passBuilderConfig.authority} Tier
                      </span>
                    </div>
                  </div>

                  {/* 3D Ticket Container */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '820px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'visible'
                    }}
                  >
                    <Ticket3D
                      pass={{
                        id: passBuilderConfig.id,
                        eventTitle: passBuilderConfig.eventTitle,
                        title: passBuilderConfig.eventTitle,
                        tagline: passBuilderConfig.tagline,
                        category: passBuilderConfig.category,
                        passType: passBuilderConfig.passType,
                        attendeeName: passBuilderConfig.attendeeName,
                        authority: passBuilderConfig.authority,
                        price: passBuilderConfig.price,
                        venue: passBuilderConfig.venue,
                        date: passBuilderConfig.date,
                        time: passBuilderConfig.time,
                        gate: passBuilderConfig.gate,
                        status: passBuilderConfig.status,
                        permissions: passBuilderConfig.permissions,
                        coverImage: passBuilderConfig.coverImage
                      }}
                      isInteractive={true}
                    />
                  </div>

                  {/* Helpful Interaction Hint */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--color-muted-text)',
                      fontWeight: 500
                    }}
                  >
                    <Sparkles size={13} color="#7C3AED" />
                    <span>Move cursor across the pass to tilt in 3D space · Click ticket to flip for backside clearance verification</span>
                  </div>
                </div>

                {/* 2. DYNAMIC CONFIGURATION SUITE (3-Column Architecture) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                    alignItems: 'start'
                  }}
                >
                  {/* Column 1: Visual Identity & Category Presets */}
                  <div
                    className="glass-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                        1. Visual Identity & Category
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                        Select category theme to apply tailored lighting, colors, and artwork.
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Category Theme Preset
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {TICKET_CATEGORIES.map((cat) => {
                          const isSelected = passBuilderConfig.category.toLowerCase() === cat.id.toLowerCase() ||
                            passBuilderConfig.category.toLowerCase() === cat.label.toLowerCase();

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleResetToCategoryDefaults(cat.label)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: isSelected ? 700 : 500,
                                backgroundColor: isSelected ? cat.primary : 'var(--color-off-white)',
                                color: isSelected ? '#FFFFFF' : 'var(--color-dark-text)',
                                border: isSelected ? `1px solid ${cat.primary}` : '1px solid var(--color-gray)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Input
                      label="Event Title"
                      value={passBuilderConfig.eventTitle}
                      onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, eventTitle: e.target.value })}
                      placeholder="e.g. TechFest 2026, Astral Nights"
                    />

                    <Input
                      label="Subtitle / Tagline"
                      value={passBuilderConfig.tagline}
                      onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, tagline: e.target.value })}
                      placeholder="e.g. Annual National Technology Summit"
                    />

                    <div>
                      <Input
                        label="Background Artwork URL (Optional)"
                        value={passBuilderConfig.coverImage}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                      />
                      {passBuilderConfig.coverImage && (
                        <button
                          type="button"
                          onClick={() => setPassBuilderConfig({ ...passBuilderConfig, coverImage: '' })}
                          style={{
                            marginTop: '6px',
                            fontSize: '11px',
                            color: '#7C3AED',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Reset to default category artwork
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Admission Tier & Clearances */}
                  <div
                    className="glass-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                        2. Admittance Tier & Clearances
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                        Define pass tier, gate turnstile, admission authority, and pricing.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <Input
                        label="Pass Tier / Type"
                        value={passBuilderConfig.passType}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, passType: e.target.value })}
                        placeholder="e.g. VIP Pass, Early Bird"
                      />

                      <Input
                        label="Price (₹ INR)"
                        type="number"
                        min={0}
                        value={passBuilderConfig.price}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, price: Number(e.target.value) })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Select
                        label="Assigned Authority"
                        value={passBuilderConfig.authority}
                        options={AUTHORITIES}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, authority: e.target.value })}
                      />

                      <Input
                        label="Assigned Gate"
                        value={passBuilderConfig.gate}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, gate: e.target.value })}
                        placeholder="e.g. Gate VIP, Turnstile 01"
                      />
                    </div>

                    {/* Access Clearances Checkboxes */}
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Zone Access Clearances (Backside)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {['General Area', 'Workshop Area', 'VIP Area', 'Backstage', 'Organizer Area', 'Admin Area'].map((area) => {
                          const isChecked = (passBuilderConfig.permissions || []).includes(area);

                          return (
                            <label
                              key={area}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                color: 'var(--color-dark-text)',
                                cursor: 'pointer',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: isChecked ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                                border: isChecked ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const cur = passBuilderConfig.permissions || [];
                                  if (e.target.checked) {
                                    setPassBuilderConfig({ ...passBuilderConfig, permissions: [...cur, area] });
                                  } else {
                                    setPassBuilderConfig({ ...passBuilderConfig, permissions: cur.filter((p) => p !== area) });
                                  }
                                }}
                                style={{ accentColor: '#7C3AED' }}
                              />
                              <span>{area}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Schedule, Holder & Publishing */}
                  <div
                    className="glass-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                        3. Schedule & Catalog Publishing
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                        Verify schedule, holder simulation, and save template to the library.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <Input
                        label="Date"
                        value={passBuilderConfig.date}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, date: e.target.value })}
                      />

                      <Input
                        label="Time"
                        value={passBuilderConfig.time}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, time: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Venue Location"
                      value={passBuilderConfig.venue}
                      onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, venue: e.target.value })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                      <Input
                        label="Attendee Preview Name"
                        value={passBuilderConfig.attendeeName}
                        onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, attendeeName: e.target.value })}
                      />

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          Status
                        </label>
                        <select
                          value={passBuilderConfig.status}
                          onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, status: e.target.value })}
                          style={{
                            width: '100%',
                            height: '42px',
                            border: '1px solid var(--color-gray)',
                            borderRadius: 'var(--radius-control)',
                            padding: '0 10px',
                            fontSize: '13px'
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Used">Used</option>
                          <option value="Revoked">Revoked</option>
                        </select>
                      </div>
                    </div>

                    {/* Publishing & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                      <Button
                        variant="primary"
                        icon={Save}
                        onClick={handlePublishPassTemplate}
                        style={{
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
                        }}
                      >
                        Publish to Pass Library
                      </Button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <Button
                          variant="outline"
                          icon={Layers}
                          onClick={() => setPassStudioSubTab('library')}
                        >
                          Browse Library
                        </Button>

                        <Button
                          variant="outline"
                          icon={RotateCcw}
                          onClick={() => handleResetToCategoryDefaults('Hackathons')}
                        >
                          Reset Defaults
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SUB-VIEW 2: PASS TEMPLATE LIBRARY                            */}
            {/* ------------------------------------------------------------ */}
            {passStudioSubTab === 'library' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 className="text-h2" style={{ fontSize: '24px', margin: 0 }}>
                      Pass Template Library ({customTemplates.length} Templates)
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                      Reusable 3D pass templates available for campus event organizers and pass generation.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    icon={Sparkles}
                    onClick={() => setPassStudioSubTab('studio')}
                    style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                  >
                    + Create in Pass Builder
                  </Button>
                </div>

                {/* Templates Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '24px'
                  }}
                >
                  {customTemplates.map((tpl) => {
                    const tplCategory = tpl.category || 'Concert';
                    const theme = resolveTicketTheme(tplCategory, tpl.name);

                    return (
                      <div
                        key={tpl.id}
                        className="glass-card"
                        style={{
                          borderRadius: '18px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        {/* Mini Scaled 3D Pass Preview */}
                        <div
                          style={{
                            padding: '20px 14px',
                            backgroundColor: '#0c0a17',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '190px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ transform: 'scale(0.48)', transformOrigin: 'center center' }}>
                            <Ticket3D
                              pass={{
                                id: tpl.id,
                                eventTitle: tpl.eventTitle || tpl.name,
                                title: tpl.eventTitle || tpl.name,
                                category: tplCategory,
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
                                backgroundColor: tpl.isSystemTemplate ? 'rgba(255,255,255,0.15)' : '#7C3AED',
                                color: '#FFFFFF'
                              }}
                            >
                              {tpl.isSystemTemplate ? 'System Preset' : 'Custom 3D'}
                            </span>
                          </div>
                        </div>

                        {/* Template Details & Actions */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-text)', margin: 0 }}>
                                {tpl.name}
                              </h4>
                              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                                {tpl.description}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: theme.primary,
                                backgroundColor: theme.badgeBg,
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {tplCategory}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              color: 'var(--color-muted-text)',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--color-gray)'
                            }}
                          >
                            <span>Authority: <strong>{tpl.authority || 'Participant'}</strong></span>
                            <span>Price: <strong>₹{tpl.price !== undefined ? tpl.price : 499}</strong></span>
                          </div>

                          {/* Card Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                            <Button
                              variant="primary"
                              size="compact"
                              icon={Sparkles}
                              onClick={() => handleLoadTemplateIntoBuilder(tpl)}
                              style={{ flex: 1, backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                            >
                              Edit in Builder
                            </Button>

                            <Button
                              variant="outline"
                              size="compact"
                              icon={Eye}
                              onClick={() => setPreviewTicketModal(tpl)}
                            >
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FULLSCREEN PREVIEW MODAL */}
            {previewTicketModal && (
              <Modal
                isOpen={true}
                onClose={() => setPreviewTicketModal(null)}
                title={`3D Ticket Preview: ${previewTicketModal.name}`}
                maxWidth="1020px"
                padding="20px 24px"
                cancelText={null}
              >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <Ticket3D
                    pass={{
                      id: previewTicketModal.id || 'GP-PREVIEW-001',
                      eventTitle: previewTicketModal.eventTitle || previewTicketModal.name,
                      title: previewTicketModal.eventTitle || previewTicketModal.name,
                      tagline: previewTicketModal.tagline,
                      category: previewTicketModal.category || 'Concert',
                      passType: previewTicketModal.passType || 'VIP Pass',
                      attendeeName: 'Aarav Shah',
                      authority: previewTicketModal.authority || 'VIP',
                      price: previewTicketModal.price || 499,
                      venue: previewTicketModal.venue || 'Zeal College, Pune',
                      date: previewTicketModal.date || '15 October 2026',
                      time: previewTicketModal.time || '10:00 AM',
                      gate: previewTicketModal.gate || 'Gate VIP',
                      status: 'Active',
                      permissions: previewTicketModal.permissions || ['General Area', 'VIP Area']
                    }}
                    isInteractive={true}
                  />

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleLoadTemplateIntoBuilder(previewTicketModal);
                        setPreviewTicketModal(null);
                      }}
                      style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                    >
                      Load into Pass Builder
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewTicketModal(null)}>
                      Close Preview
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* ==============================================================
            4. PARTICIPANTS TAB
            ============================================================== */}
        {activeTab === 'participants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-h1" style={{ fontSize: '32px' }}>Participants Ledger</h1>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Filter, audit, and modify attendee authority and admission status.
                </p>
              </div>
            </div>

            <DataTable
              title="Registered Participants"
              subtitle={`Total: ${participants.length} attendees · ${participants.filter((p) => p.status === 'Active').length} active passes`}
              columns={[
                {
                  key: 'name',
                  header: 'Participant',
                  render: (row) => (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>{row.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{row.email}</div>
                    </div>
                  )
                },
                {
                  key: 'event',
                  header: 'Event & Pass',
                  render: (row) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{row.event}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-deep-violet)' }}>{row.pass} ({row.passId})</div>
                    </div>
                  )
                },
                {
                  key: 'authority',
                  header: 'Authority',
                  render: (row) => (
                    <span style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>{row.authority}</span>
                  )
                },
                {
                  key: 'payment',
                  header: 'Payment',
                  render: (row) => <span style={{ fontWeight: 500 }}>{row.payment}</span>
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <StatusBadge status={row.status} />
                }
              ]}
              data={participants}
              selectedIds={selectedRowIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              onRowAction={(row) => setSelectedParticipant(row)}
            />
          </div>
        )}

        {/* ==============================================================
            5. PAYMENTS MANAGEMENT TAB
            ============================================================== */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Payment Management</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Reconcile gateway deposits, view transaction logs, and manage refund requests.
              </p>
            </div>

            {/* Payment KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Gross Revenue</span>
                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>₹4,12,650</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Successful</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>1,842</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Failed</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>14</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Refunds</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>₹3,200</div>
              </div>
            </div>

            {/* Transactions Table */}
            <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-gray)', backgroundColor: 'var(--color-white)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>TRANSACTION</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>PARTICIPANT</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>AMOUNT</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>METHOD</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'TXN-9021', name: 'Aarav Shah', amount: '₹199', method: 'UPI', status: 'Active' },
                    { id: 'TXN-9020', name: 'Pooja Kulkarni', amount: '₹99', method: 'UPI', status: 'Active' },
                    { id: 'TXN-9019', name: 'Devendra Rathore', amount: '₹499', method: 'Card', status: 'Active' },
                    { id: 'TXN-9018', name: 'Tanvi Joshi', amount: '₹199', method: 'UPI', status: 'Failed' },
                    { id: 'TXN-9017', name: 'Rohan Verma', amount: '₹149', method: 'Net Banking', status: 'Cancelled' }
                  ].map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{t.id}</td>
                      <td style={{ padding: '14px 16px' }}>{t.name}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{t.amount}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-muted-text)' }}>{t.method}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            6. AUTHORITIES & PERMISSIONS TAB
            ============================================================== */}
        {activeTab === 'authorities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Authority & Role Management</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Assign platform roles to accounts (Admin, Organizer, Verifier, Participant) and configure zone permissions.
              </p>
            </div>

            {/* Role Assignment Feedback Banner */}
            {roleFeedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: roleFeedback.type === 'success' ? '#ECFDF3' : '#FEF3F2',
                  border: `1px solid ${roleFeedback.type === 'success' ? '#A6F4C5' : '#FECDCA'}`,
                  color: roleFeedback.type === 'success' ? '#027A48' : '#B42318',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {roleFeedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{roleFeedback.text}</span>
              </div>
            )}

            {/* Registered Platform Users & Role Assignment Table */}
            <div
              style={{
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-white)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-gray)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Platform Accounts & Assigned Roles ({usersList.length})
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                  Only platform administrators can promote users to Organizers, Verifiers, or Admins.
                </p>
              </div>

              {usersList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
                  Loading registered platform accounts...
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-off-white)', borderBottom: '1px solid var(--color-gray)' }}>
                        <th style={{ padding: '12px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-muted-text)' }}>ACCOUNT</th>
                        <th style={{ padding: '12px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-muted-text)' }}>FIREBASE UID</th>
                        <th style={{ padding: '12px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-muted-text)' }}>EMAIL STATUS</th>
                        <th style={{ padding: '12px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-muted-text)' }}>CURRENT ROLE</th>
                        <th style={{ padding: '12px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--color-muted-text)' }}>ASSIGN ROLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((usr) => {
                        const isUpdating = roleUpdatingUid === usr.uid;
                        return (
                          <tr key={usr.uid} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>{usr.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{usr.email}</div>
                            </td>
                            <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-muted-text)' }}>
                              {usr.uid.slice(0, 12)}...
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  color: usr.emailVerified ? '#027A48' : '#B54708',
                                  backgroundColor: usr.emailVerified ? '#ECFDF3' : '#FEF0C7'
                                }}
                              >
                                {usr.emailVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    usr.role === ROLES.ADMIN
                                      ? 'var(--color-black)'
                                      : usr.role === ROLES.ORGANIZER
                                      ? 'var(--color-light-violet)'
                                      : usr.role === ROLES.VERIFIER
                                      ? '#ECFDF3'
                                      : 'var(--color-off-white)',
                                  color:
                                    usr.role === ROLES.ADMIN
                                      ? 'var(--color-white)'
                                      : usr.role === ROLES.ORGANIZER
                                      ? 'var(--color-deep-violet)'
                                      : usr.role === ROLES.VERIFIER
                                      ? '#027A48'
                                      : 'var(--color-dark-text)'
                                }}
                              >
                                {ROLE_LABELS[usr.role] || usr.role}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <select
                                value={usr.role || ROLES.PARTICIPANT}
                                disabled={isUpdating}
                                onChange={(e) => handleAssignUserRole(usr.uid, e.target.value)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-control)',
                                  border: '1px solid var(--color-gray)',
                                  backgroundColor: 'var(--color-white)',
                                  color: 'var(--color-dark-text)',
                                  cursor: isUpdating ? 'wait' : 'pointer'
                                }}
                              >
                                {ALL_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]} ({r})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Zone Permissions per Authority Tier */}

            {/* Authority Selector Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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

            {/* Permissions for Selected Authority matching Screenshot 25 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Zone Permissions for: {selectedAuthorityForEdit}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                  Least privilege enforced by default
                </span>
              </div>

              {PERMISSION_AREAS.map((area) => {
                const isAllowed = (authorityPermissions[selectedAuthorityForEdit] || []).includes(area);
                return (
                  <PermissionControl
                    key={area}
                    title={`Access: ${area}`}
                    description={`Permits badge holders to enter ${area} turnstiles and checkpoints.`}
                    allowed={isAllowed}
                    onChange={() => handleTogglePermission(area)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ==============================================================
            7. ANALYTICS TAB
            ============================================================== */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Event & Verification Analytics</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Turnstile scan velocity, peak gate arrival windows, and attendee conversion rates.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Scan Velocity</span>
                <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>42 / min</div>
                <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>0.8s avg verification</span>
              </div>
              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Conversion Rate</span>
                <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>84.2%</div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>Booking to admission</span>
              </div>
              <div style={{ padding: '20px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Denied Entries</span>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>1.2%</div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>Expired or signature mismatch</span>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            8. STAFF MANAGEMENT TAB
            ============================================================== */}
        {activeTab === 'verification' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-h1" style={{ fontSize: '32px' }}>Gate Staff & Verifier Roster</h1>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Assign authorized personnel to turnstiles and security checkpoints.
                </p>
              </div>
              <Button variant="primary" icon={Plus} onClick={() => setIsAddStaffOpen(true)}>
                Add Staff Member
              </Button>
            </div>

            <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-gray)', backgroundColor: 'var(--color-white)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>STAFF NAME</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>ROLE</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>ASSIGNED GATE</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((st) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{st.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>{st.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{st.role}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-deep-violet)' }}>{st.gate}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={st.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            9. SETTINGS TAB
            ============================================================== */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Workspace Settings</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Campus domain, QR cryptographic key rotation, and webhook notification settings.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input label="Workspace Name" value="Zeal College Pune" readOnly />
              <Input label="Authorized Domain" value="zeal.campus.edu" readOnly />
              <Input label="Gate Webhook Endpoint" value="https://api.getapass.io/v1/turnstiles/sync" readOnly />
              <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Cryptographic QR Rotation</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                  Rotating private signing keys every 24 hours prevents duplicate screenshot entry.
                </p>
                <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Key Active (SHA-256)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Participant Details Drawer matching Screenshot 27 */}
      <Drawer
        isOpen={Boolean(selectedParticipant)}
        onClose={() => setSelectedParticipant(null)}
        title="Participant Details"
        subtitle={selectedParticipant?.passId}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedParticipant(null)}>
              Close
            </Button>
            <Button
              variant="violet"
              onClick={() => {
                setAuthorityToUpdate(selectedParticipant?.authority || 'Participant');
                setIsEditAuthorityModalOpen(true);
              }}
            >
              Change Authority
            </Button>
          </>
        }
      >
        {selectedParticipant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-deep-violet)' }}>
                {selectedParticipant.pass}
              </span>
              <StatusBadge status={selectedParticipant.status} />
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Name:</span>
                <span style={{ fontWeight: 600 }}>{selectedParticipant.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Email:</span>
                <span>{selectedParticipant.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Event:</span>
                <span style={{ fontWeight: 600 }}>{selectedParticipant.event}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Authority Tier:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-violet)' }}>{selectedParticipant.authority}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Payment:</span>
                <span>{selectedParticipant.payment}</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
              Authorized gate staff can promote or adjust authority permissions. Changes take effect on next turnstile verification.
            </div>
          </div>
        )}
      </Drawer>

      {/* Change Authority Modal */}
      <Modal
        isOpen={isEditAuthorityModalOpen}
        onClose={() => setIsEditAuthorityModalOpen(false)}
        title="Change Participant Authority"
        confirmText="Save Authority"
        onConfirm={handleChangeAuthoritySubmit}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)' }}>
            Adjusting authority for <strong>{selectedParticipant?.name}</strong>. This updates their access zones across campus checkpoints.
          </p>

          <Select
            label="Select Authority Role"
            value={authorityToUpdate}
            options={AUTHORITIES}
            onChange={(e) => setAuthorityToUpdate(e.target.value)}
          />
        </div>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        title="Create New Event"
        confirmText="Publish Event"
        onConfirm={handleSaveNewEvent}
        maxWidth="540px"
      >
        <form onSubmit={handleSaveNewEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Event Title"
            placeholder="e.g. HackSprint 2026"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />

          <Select
            label="Category"
            value={newEvent.category}
            options={CATEGORIES}
            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              required
            />
            <Input
              label="Starting Price (₹)"
              type="number"
              value={newEvent.startingPrice}
              onChange={(e) => setNewEvent({ ...newEvent, startingPrice: e.target.value })}
              required
            />
          </div>

          <Input
            label="Venue Location"
            placeholder="Auditorium, Zeal College"
            value={newEvent.venue}
            onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Add Staff Member"
        confirmText="Add Staff"
        onConfirm={handleAddStaffSubmit}
      >
        <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Full Name"
            placeholder="Staff name"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="staff@getapass.io"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
            required
          />
          <Select
            label="Role"
            value={newStaff.role}
            options={['Event Admin', 'Authority Person', 'Verifier']}
            onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
          />
          <Input
            label="Assigned Gate"
            value={newStaff.gate}
            onChange={(e) => setNewStaff({ ...newStaff, gate: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
