import React, { useState } from 'react';
import {
  Plus
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
import DigitalPass from '../components/pass/DigitalPass';
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
  currentUser = null
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Staff State
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Verifier', gate: 'Gate A' });

  // Pass Builder State
  const [passBuilderConfig, setPassBuilderConfig] = useState({
    eventTitle: 'TechFest 2026',
    passType: 'VIP Pass',
    authority: 'VIP',
    venue: 'Zeal College, Pune',
    date: '15 October 2026',
    time: '10:00 AM – 8:00 PM',
    gate: 'Gate VIP'
  });

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
            3. PASS BUILDER TAB (Left Config, Right Live Pass Preview - NO PHOTO)
            ============================================================== */}
        {activeTab === 'passes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Digital Pass Builder</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Configure access tiers and cryptographic visual identity. Live pass preview renders in real-time with NO user photo.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(340px, 1fr)',
                gap: '40px',
                alignItems: 'start'
              }}
            >
              {/* Left Configuration Panel */}
              <div
                style={{
                  padding: '28px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-white)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Pass Configuration</h3>

                <Input
                  label="Event Title"
                  value={passBuilderConfig.eventTitle}
                  onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, eventTitle: e.target.value })}
                />

                <Input
                  label="Pass Type / Tier"
                  value={passBuilderConfig.passType}
                  onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, passType: e.target.value })}
                />

                <Select
                  label="Assigned Authority"
                  value={passBuilderConfig.authority}
                  options={AUTHORITIES}
                  onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, authority: e.target.value })}
                />

                <Input
                  label="Venue Location"
                  value={passBuilderConfig.venue}
                  onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, venue: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Date"
                    value={passBuilderConfig.date}
                    onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, date: e.target.value })}
                  />
                  <Input
                    label="Gate"
                    value={passBuilderConfig.gate}
                    onChange={(e) => setPassBuilderConfig({ ...passBuilderConfig, gate: e.target.value })}
                  />
                </div>

                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--color-off-white)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--color-muted-text)',
                    lineHeight: '18px'
                  }}
                >
                  <strong>Security Constraint:</strong> In accordance with privacy and operational guidelines, digital passes render verified badges and QR data without attendee photos.
                </div>

                <Button variant="primary" onClick={() => alert('Pass template published to catalog.')}>
                  Publish Pass Template
                </Button>
              </div>

              {/* Right Live Pass Preview Panel */}
              <div
                style={{
                  padding: '28px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-off-white)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-deep-violet)' }}>
                  LIVE PREVIEW (REAL-TIME)
                </span>

                <DigitalPass
                  pass={{
                    id: 'GP-BUILD-001',
                    eventTitle: passBuilderConfig.eventTitle,
                    passType: passBuilderConfig.passType,
                    attendeeName: 'Aarav Shah',
                    authority: passBuilderConfig.authority,
                    date: passBuilderConfig.date,
                    time: passBuilderConfig.time,
                    venue: passBuilderConfig.venue,
                    gate: passBuilderConfig.gate,
                    status: 'Active',
                    price: 499,
                    paymentMethod: 'UPI'
                  }}
                  showActions={false}
                />
              </div>
            </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h1 className="text-h1" style={{ fontSize: '32px' }}>Authority & Role Management</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Control zone access permissions per authority tier matching Screenshot 25.
              </p>
            </div>

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
