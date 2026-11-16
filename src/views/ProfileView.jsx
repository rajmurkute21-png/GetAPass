import React, { useState, useEffect } from 'react';
import {
  User,
  Ticket,
  ShoppingBag,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  Edit3,
  Calendar,
  QrCode,
  Plus,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Copy
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatusBadge from '../components/common/StatusBadge';
import PassCard from '../components/cards/PassCard';
import PaymentCard from '../components/cards/PaymentCard';
import Modal from '../components/common/Modal';
import DigitalPass from '../components/pass/DigitalPass';
import { useAuth } from '../context/AuthContext';

export default function ProfileView({
  user,
  onUpdateUser,
  passes = [],
  bookings = [],
  notifications = [],
  initialSubTab = 'profile',
  onLogout,
  onOpenOrganizerStudio
}) {
  const { user: authUser, isAuthenticated, openAuthModal, reloadUser, resendVerification } = useAuth();
  const [activeTab, setActiveTab] = useState(initialSubTab); // 'profile' | 'my-passes' | 'my-bookings' | 'payments' | 'list-event' | 'notifications' | 'settings' | 'help'
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPassForModal, setSelectedPassForModal] = useState(null);
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  const activeUser = authUser || user;

  // Edit form state
  const [name, setName] = useState(() => activeUser?.displayName || activeUser?.name || '');
  const [email, setEmail] = useState(() => activeUser?.email || '');
  const [phone, setPhone] = useState(() => activeUser?.phone || '');
  const [college, setCollege] = useState(() => activeUser?.college || '');

  const getInitials = (str) => {
    if (!str) return 'AS';
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AS';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };



  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'my-passes', label: 'My Passes', icon: Ticket, count: passes.length },
    { id: 'my-bookings', label: 'My Bookings', icon: ShoppingBag, count: bookings.length },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'list-event', label: 'List Your Event', icon: Calendar, badge: 'Admin' },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const initials = getInitials(name);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name,
        email,
        phone,
        college,
        avatarInitials: initials
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="gateapass-profile-view" style={{ textAlign: 'left', padding: '40px 0 64px' }}>
      <div className="container-desktop">
        {/* Profile Layout: Left Sidebar Menu, Right Content Area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
            gap: '36px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Profile Card & Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* User Mini Card */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                padding: '24px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              {activeUser?.photoURL ? (
                <img
                  src={activeUser.photoURL}
                  alt={activeUser.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--color-gray)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: 'var(--color-near-black)',
                    color: 'var(--color-white)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {activeUser?.avatarInitials || getInitials(activeUser?.displayName || activeUser?.name)}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-dark-text)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {activeUser?.displayName || activeUser?.name || (isAuthenticated ? 'GetApass User' : 'Guest Attendee')}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {activeUser?.email || (isAuthenticated ? '' : 'Not signed in')}
                </p>
                {isAuthenticated ? (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: authUser?.emailVerified ? 'var(--color-deep-violet)' : '#B54708',
                      backgroundColor: authUser?.emailVerified ? 'var(--color-light-violet)' : '#FEF0C7',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {authUser?.emailVerified ? 'Verified Participant' : 'Email Unverified'}
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-muted-text)',
                      backgroundColor: 'var(--color-off-white)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Guest Mode
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items matching spec */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComp = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsEditing(false);
                    }}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: isActive ? 'var(--color-light-violet)' : 'transparent',
                      color: isActive ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComp size={18} strokeWidth={isActive ? 2 : 1.7} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isActive ? 'var(--color-white)' : 'var(--color-off-white)',
                          color: isActive ? 'var(--color-deep-violet)' : 'var(--color-muted-text)'
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              <div style={{ height: '1px', backgroundColor: 'var(--color-gray)', margin: '4px 0' }} />

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-error)',
                    fontWeight: 500,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-deep-violet)',
                    fontWeight: 600,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Active Tab Content */}
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-card)',
              padding: '32px'
            }}
          >
            {/* SUB-VIEW 1: MY PROFILE / EDIT PROFILE */}
            {activeTab === 'profile' && (
              <div>
                {!isAuthenticated && (
                  <div
                    style={{
                      marginBottom: '24px',
                      padding: '20px',
                      backgroundColor: 'var(--color-off-white)',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={20} style={{ color: 'var(--color-deep-violet)' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                        Guest Session Active
                      </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: 0, lineHeight: '20px' }}>
                      Sign in or create a GetApass account to persist your digital passes, manage bookings across devices, and link verified identity credentials.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <Button variant="primary" size="compact" onClick={() => openAuthModal('login')}>
                        Sign In
                      </Button>
                      <Button variant="outline" size="compact" onClick={() => openAuthModal('signup')}>
                        Create Account
                      </Button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                      Personal Profile
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                      Participant credentials matched against gate verification scanners.
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      icon={Edit3}
                      size="compact"
                      onClick={() => {
                        setName(activeUser?.displayName || activeUser?.name || '');
                        setEmail(activeUser?.email || '');
                        setPhone(activeUser?.phone || '');
                        setCollege(activeUser?.college || '');
                        setIsEditing(true);
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      helperText="Must match your college photo identification."
                      required
                    />
                    <Input
                      label="College Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      helperText="Passes are cryptographically linked to this address."
                      required
                    />
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      helperText="Used for gate entry updates."
                      required
                    />
                    <Input
                      label="College / Institution"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      helperText="Your academic campus or organization."
                      required
                    />

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <Button variant="primary" type="submit">
                        Save Changes
                      </Button>
                      <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Full Name
                      </span>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '4px' }}>
                        {activeUser?.displayName || activeUser?.name || (isAuthenticated ? 'GetApass Member' : 'Guest Attendee')}
                      </p>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Email Address
                      </span>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '4px', wordBreak: 'break-all' }}>
                        {activeUser?.email || (isAuthenticated ? 'No email linked' : 'Guest Session')}
                      </p>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Email Verification
                      </span>
                      {isAuthenticated ? (
                        authUser?.emailVerified ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-success)' }}>
                              Verified
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={16} style={{ color: '#D92D20' }} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#D92D20' }}>
                                Pending Verification
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                disabled={checkingVerification}
                                onClick={async () => {
                                  setCheckingVerification(true);
                                  setVerificationFeedback('');
                                  try {
                                    const refreshed = await reloadUser();
                                    if (refreshed?.emailVerified) {
                                      setVerificationFeedback('Email verified successfully!');
                                    } else {
                                      setVerificationFeedback('Not verified yet. Please check your inbox.');
                                    }
                                  } catch {
                                    setVerificationFeedback('Could not verify status.');
                                  } finally {
                                    setCheckingVerification(false);
                                  }
                                }}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--color-black)',
                                  color: 'var(--color-white)',
                                  borderRadius: 'var(--radius-control)',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {checkingVerification ? 'Checking...' : "I've Verified"}
                              </button>
                              <button
                                type="button"
                                disabled={resendingVerification}
                                onClick={async () => {
                                  setResendingVerification(true);
                                  setVerificationFeedback('');
                                  try {
                                    await resendVerification();
                                    setVerificationFeedback('Verification link sent!');
                                  } catch (err) {
                                    setVerificationFeedback(err?.message || 'Failed to send.');
                                  } finally {
                                    setResendingVerification(false);
                                  }
                                }}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: 'transparent',
                                  color: 'var(--color-dark-text)',
                                  border: '1px solid var(--color-gray)',
                                  borderRadius: 'var(--radius-control)',
                                  cursor: 'pointer'
                                }}
                              >
                                {resendingVerification ? 'Sending...' : 'Resend Email'}
                              </button>
                            </div>
                            {verificationFeedback && (
                              <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                                {verificationFeedback}
                              </span>
                            )}
                          </div>
                        )
                      ) : (
                        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '6px' }}>
                          Guest Account (Unverified)
                        </p>
                      )}
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Account UID (Firebase Key)
                        </span>
                        {authUser?.uid && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(authUser.uid);
                              setCopiedUid(true);
                              setTimeout(() => setCopiedUid(false), 2000);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '11px',
                              fontWeight: 600,
                              color: copiedUid ? 'var(--color-success)' : 'var(--color-deep-violet)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Copy size={12} />
                            {copiedUid ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '6px', wordBreak: 'break-all' }}>
                        {authUser?.uid || 'guest-session-local'}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', display: 'block', marginTop: '2px' }}>
                        Stable primary identity reference for future database sync.
                      </span>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Mobile Phone
                      </span>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '4px' }}>
                        {activeUser?.phone || '+91 98765 43210'}
                      </p>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Institution
                      </span>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '4px' }}>
                        {activeUser?.college || 'Zeal College of Engineering, Pune'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Organizer Studio Host Promotion Card */}
                <div
                  style={{
                    marginTop: '32px',
                    padding: '24px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-off-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-deep-violet)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                      List Your Event & Gate Verifier
                    </h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
                    Want to host a hackathon, conference, workshop, or campus fest? Anyone can list an event on GetApass. You automatically become the event admin with full turnstile QR verification. No separate login required.
                  </p>
                  <div style={{ marginTop: '4px' }}>
                    <Button
                      variant="primary"
                      onClick={() => onOpenOrganizerStudio && onOpenOrganizerStudio('dashboard')}
                    >
                      List Your Event & Open Dashboard →
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW: LIST YOUR EVENT (Organizer & Verifier Hub) */}
            {activeTab === 'list-event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      ORGANIZER HUB
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: 'var(--color-light-violet)', color: 'var(--color-deep-violet)', padding: '2px 8px', borderRadius: '4px' }}>
                      Zero Login Barrier
                    </span>
                  </div>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    List Your Event & Turnstile Verifier
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Create and manage campus events with automated digital pass generation and integrated turnstile QR scanning. When you create an event, you automatically become its administrator.
                  </p>
                </div>

                {/* Feature breakdown cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px', backgroundColor: 'var(--color-off-white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Plus size={18} style={{ color: 'var(--color-violet)' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>1. Create Event</h4>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
                      Set up event name, venue, categories, and custom pass tiers (Participant, VIP, Volunteer).
                    </p>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px', backgroundColor: 'var(--color-off-white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Calendar size={18} style={{ color: 'var(--color-violet)' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>2. Event Dashboard</h4>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
                      Real-time analytics for registrations, revenue collections, and live attendance metrics.
                    </p>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px', backgroundColor: 'var(--color-off-white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <QrCode size={18} style={{ color: 'var(--color-violet)' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>3. Turnstile Verifier</h4>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
                      Optical QR pass scanner integrated right into your event tools for instant gate check-ins.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                  <Button
                    variant="primary"
                    size="large"
                    icon={Plus}
                    onClick={() => onOpenOrganizerStudio && onOpenOrganizerStudio('create-event')}
                  >
                    Create New Event Now
                  </Button>

                  <Button
                    variant="violet"
                    size="large"
                    icon={Calendar}
                    onClick={() => onOpenOrganizerStudio && onOpenOrganizerStudio('dashboard')}
                  >
                    Open Event Dashboard & Verifier →
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: MY PASSES (CRITICAL: Only accessible through profile) */}
            {activeTab === 'my-passes' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    My Digital Passes
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Active tickets ready for gate validation. Click "View pass" to inspect the high-resolution QR pass.
                  </p>
                </div>

                {passes.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-off-white)',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <Ticket size={32} style={{ color: 'var(--color-violet)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      No active passes
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', maxWidth: '360px' }}>
                      Passes booked or assigned to you will appear here with instant gate QR verification.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}
                  >
                    {passes.map((p) => (
                      <PassCard
                        key={p.id}
                        pass={p}
                        onViewPass={() => setSelectedPassForModal(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 3: MY BOOKINGS */}
            {activeTab === 'my-bookings' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    My Bookings
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Registration ledger and confirmation history.
                  </p>
                </div>

                {bookings.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-off-white)',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <ShoppingBag size={32} style={{ color: 'var(--color-muted-text)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      No bookings recorded yet
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', maxWidth: '360px' }}>
                      When you register for an event, your booking confirmation and tickets will be logged here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {bookings.map((b) => (
                      <div
                        key={b.bookingId}
                        style={{
                          padding: '16px 20px',
                          border: '1px solid var(--color-gray)',
                          borderRadius: 'var(--radius-control)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>{b.eventTitle}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                            {b.passType} · Booked on {b.date} · {b.bookingId}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px' }}>₹{b.amount}</span>
                          <Button
                            variant="outline"
                            size="compact"
                            onClick={() => {
                              const foundPass = passes.find((p) => p.id === b.passId);
                              if (foundPass) setSelectedPassForModal(foundPass);
                            }}
                          >
                            View Pass
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 4: PAYMENTS */}
            {activeTab === 'payments' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    Payment History
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Invoices and payment receipts for all booked event tickets.
                  </p>
                </div>

                {bookings.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-off-white)',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <CreditCard size={32} style={{ color: 'var(--color-muted-text)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      No payment transactions yet
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', maxWidth: '360px' }}>
                      Completed transactions and downloadable tax receipts will appear here once you purchase passes.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}
                  >
                    {bookings.map((b) => (
                      <PaymentCard
                        key={b.bookingId}
                        booking={b}
                        onDownloadReceipt={() => setSelectedReceiptForModal(b)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 5: NOTIFICATIONS matching Screenshot 25 */}
            {activeTab === 'notifications' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    Notifications
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Real-time operational alerts, gate notices, and payment receipts.
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-off-white)',
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <Bell size={32} style={{ color: 'var(--color-muted-text)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      All caught up!
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', maxWidth: '360px' }}>
                      No new operational alerts, payment receipts, or gate notices at this time.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {notifications.map((n) => {
                      let accentColor = 'var(--color-violet)';
                      if (n.type === 'success') accentColor = 'var(--color-success)';
                      if (n.type === 'warning') accentColor = 'var(--color-warning)';
                      if (n.type === 'error') accentColor = 'var(--color-error)';

                      return (
                        <div
                          key={n.id}
                          style={{
                            padding: '16px 20px',
                            border: '1px solid var(--color-gray)',
                            borderLeft: `4px solid ${accentColor}`,
                            borderRadius: 'var(--radius-control)',
                            backgroundColor: 'var(--color-white)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                                {n.title}
                              </h4>
                              <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
                                · {n.time}
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px', lineHeight: '18px' }}>
                              {n.message}
                            </p>
                          </div>

                          {n.actionText && (
                            <Button
                              variant="outline"
                              size="compact"
                              onClick={() => {
                                if (passes.length > 0) setSelectedPassForModal(passes[0]);
                              }}
                            >
                              {n.actionText}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 6: SETTINGS */}
            {activeTab === 'settings' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    Account Settings
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Preferences, security authentication, and email notifications.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Two-Factor Pass Security</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                      Verify with SMS OTP before issuing VIP or organizer credentials.
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                      ✓ Active
                    </span>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Pass Offline Storage</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                      Keep cryptographic QR passes cached locally on this device.
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                      ✓ Enabled
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 7: HELP */}
            {activeTab === 'help' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    Gate Entry Help & Support
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Common troubleshooting and gate rules for GetApass verified events.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>My phone screen is dimmed or scratched?</h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px', lineHeight: '20px' }}>
                      Our turnstile optical scanners are tuned to read QR codes even with screen protectors. Increase your device brightness to maximum before approaching the entry turnstiles.
                    </p>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Can I show a printout of the pass?</h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px', lineHeight: '20px' }}>
                      Yes, you can click "Print Pass" on any digital pass card to generate a paper pass with the official high-resolution QR code.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital Pass Modal */}
      <Modal
        isOpen={Boolean(selectedPassForModal)}
        onClose={() => setSelectedPassForModal(null)}
        title="Official GetApass Digital Pass"
        maxWidth="440px"
      >
        {selectedPassForModal && (
          <DigitalPass
            pass={selectedPassForModal}
            onClose={() => setSelectedPassForModal(null)}
          />
        )}
      </Modal>

      {/* Download Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedReceiptForModal)}
        onClose={() => setSelectedReceiptForModal(null)}
        title="Payment Receipt"
        confirmText="Download PDF"
        onConfirm={() => {
          alert('Receipt downloaded successfully.');
          setSelectedReceiptForModal(null);
        }}
      >
        {selectedReceiptForModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted-text)' }}>Transaction ID:</span>
              <span style={{ fontWeight: 600 }}>{selectedReceiptForModal.bookingId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted-text)' }}>Event:</span>
              <span style={{ fontWeight: 600 }}>{selectedReceiptForModal.eventTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted-text)' }}>Pass Type:</span>
              <span>{selectedReceiptForModal.passType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted-text)' }}>Amount Paid:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-dark-text)' }}>₹{selectedReceiptForModal.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted-text)' }}>Date & Method:</span>
              <span>{selectedReceiptForModal.date} ({selectedReceiptForModal.paymentMethod})</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
