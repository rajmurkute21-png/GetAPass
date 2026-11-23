import React, { useState } from 'react';
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
  Copy,
  BarChart3,
  Users,
  ArrowRight,
  Lock,
  Activity,
  History,
  Clock,
  Filter
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatusBadge from '../components/common/StatusBadge';
import PassCard from '../components/cards/PassCard';
import PaymentCard from '../components/cards/PaymentCard';
import Modal from '../components/common/Modal';
import DigitalPass from '../components/pass/DigitalPass';
import { useAuth } from '../context/AuthContext';
import {
  canAccessAdminDashboard,
  canAccessOrganizerDashboard,
  isParticipantOnly
} from '../services/permissionService';

/**
 * Determine if an event date or pass date has expired
 */
function isEventExpired(dateStr, timeStr) {
  if (!dateStr) return false;
  let targetDateStr = String(dateStr).trim();
  if (targetDateStr.includes('–')) {
    const parts = targetDateStr.split('–').map((s) => s.trim());
    targetDateStr = parts[parts.length - 1];
  } else if (targetDateStr.includes(' - ')) {
    const parts = targetDateStr.split(' - ').map((s) => s.trim());
    targetDateStr = parts[parts.length - 1];
  }

  let d = new Date(targetDateStr);
  if (isNaN(d.getTime())) {
    const cleaned = targetDateStr.replace(/^[A-Za-z]+,\s*/, '');
    d = new Date(cleaned);
  }
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  if (d.toDateString() === now.toDateString() && timeStr) {
    let endTimeStr = String(timeStr).trim();
    if (endTimeStr.includes('–')) {
      const parts = endTimeStr.split('–').map((s) => s.trim());
      endTimeStr = parts[parts.length - 1];
    } else if (endTimeStr.includes(' - ')) {
      const parts = endTimeStr.split(' - ').map((s) => s.trim());
      endTimeStr = parts[parts.length - 1];
    }
    const match = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
      return d.getTime() < now.getTime();
    }
  }

  d.setHours(23, 59, 59, 999);
  return d.getTime() < now.getTime();
}

export default function ProfileView({
  user,
  onUpdateUser,
  passes = [],
  events = [],
  onDeletePass,
  bookings = [],
  notifications = [],
  initialSubTab = 'profile',
  onLogout,
  onOpenOrganizerStudio,
  onOpenAdminDashboard
}) {
  const { user: authUser, isAuthenticated, openAuthModal, reloadUser, resendVerification } = useAuth();
  const [activeTab, setActiveTab] = useState(initialSubTab); // 'profile' | 'my-passes' | 'pass-history' | 'my-bookings' | 'payments' | ...
  const [passSubFilter, setPassSubFilter] = useState('active'); // 'active' | 'history' (inside my-passes tab)
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all'); // 'all' | 'used' | 'expired'
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPassForModal, setSelectedPassForModal] = useState(null);
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

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



  const isAdmin = canAccessAdminDashboard(activeUser);
  const isOrganizer = canAccessOrganizerDashboard(activeUser) && !isAdmin;
  const isParticipant = isParticipantOnly(activeUser);

  // Isolate passes and bookings strictly to the current active user UID
  const userPasses = React.useMemo(() => {
    if (!activeUser?.uid) return passes;
    return passes.filter((p) => !p.participantUid || p.participantUid === activeUser.uid);
  }, [passes, activeUser]);

  // Classify passes into Active vs History (Used, Expired) vs Terminated
  const { activePasses, usedPasses, expiredPasses, historyPasses } = React.useMemo(() => {
    const active = [];
    const used = [];
    const expired = [];
    const history = [];

    userPasses.forEach((p) => {
      const pStatus = String(p.status || '').toLowerCase();
      const isUsed = pStatus === 'used' || p.checkedIn === true || pStatus === 'redeemed';

      // Cross-reference matched event from database/context
      const matchedEvent = (events || []).find(
        (e) => (p.eventId && e.id === p.eventId) ||
               (p.eventTitle && e.title?.toLowerCase() === p.eventTitle?.toLowerCase()) ||
               (p.event && e.title?.toLowerCase() === p.event?.toLowerCase())
      );

      // 1. Check if event was terminated / cancelled by the organizer or deleted
      const isTerminated = pStatus === 'cancelled' ||
        pStatus === 'terminated' ||
        (matchedEvent && (
          String(matchedEvent.status || '').toLowerCase() === 'cancelled' ||
          String(matchedEvent.status || '').toLowerCase() === 'terminated'
        )) ||
        (Boolean(events && events.length > 0 && p.eventId && !matchedEvent));

      // 2. Check if event is expired (past date/time)
      const dateToCheck = p.date || matchedEvent?.date || matchedEvent?.startDate;
      const timeToCheck = p.time || matchedEvent?.time;
      const isExpired = pStatus === 'expired' || isEventExpired(dateToCheck, timeToCheck);

      // RULE 1: If organizer terminated the event -> Exclude/delete from active passes!
      if (isTerminated) {
        history.push({
          ...p,
          status: 'Cancelled',
          terminationNotice: 'Event terminated by organizer'
        });
        return;
      }

      // RULE 2: If pass is Used -> Exclude from active passes, store in History option!
      if (isUsed) {
        const usedItem = {
          ...p,
          status: 'Used',
          checkedIn: true
        };
        used.push(usedItem);
        history.push(usedItem);
        return;
      }

      // RULE 3: If event is Expired -> Exclude from active passes, store in History option!
      if (isExpired) {
        const expiredItem = {
          ...p,
          status: 'Expired'
        };
        expired.push(expiredItem);
        history.push(expiredItem);
        return;
      }

      // RULE 4: Valid upcoming pass ready for turnstile verification -> Active Pass
      active.push(p);
    });

    return { activePasses: active, usedPasses: used, expiredPasses: expired, historyPasses: history };
  }, [userPasses, events]);

  const userBookings = React.useMemo(() => {
    if (!activeUser?.uid) return bookings;
    return bookings.filter((b) => !b.participantUid || b.participantUid === activeUser.uid);
  }, [bookings, activeUser]);

  const menuItems = React.useMemo(() => {
    const items = [
      { id: 'profile', label: 'My Profile', icon: User },
      { id: 'my-passes', label: 'My Passes', icon: Ticket, count: activePasses.length },
      { id: 'pass-history', label: 'Pass History', icon: History, count: historyPasses.length },
      { id: 'my-bookings', label: 'My Bookings', icon: ShoppingBag, count: userBookings.length },
      { id: 'payments', label: 'Payments', icon: CreditCard }
    ];

    if (isAdmin) {
      items.push({ id: 'organizer-studio', label: 'Organizer Studio', icon: Calendar, badge: 'Studio' });
      items.push({ id: 'admin-dashboard', label: 'Admin Dashboard', icon: ShieldCheck, badge: 'Admin' });
    } else if (isOrganizer) {
      items.push({ id: 'organizer-studio', label: 'Organizer Studio', icon: Calendar, badge: 'Organizer' });
    }

    items.push(
      { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'help', label: 'Help', icon: HelpCircle }
    );

    return items;
  }, [isAdmin, isOrganizer, activePasses.length, historyPasses.length, userBookings.length, notifications.length]);

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
                      if (item.id === 'admin-dashboard') {
                        setActiveTab('admin-dashboard');
                        setIsEditing(false);
                        return;
                      }
                      if (item.id === 'organizer-studio') {
                        if (onOpenOrganizerStudio) onOpenOrganizerStudio('dashboard');
                        return;
                      }
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

            {/* SUB-VIEW: PLATFORM ADMIN DASHBOARD (Strictly Authorized Platform Admins Only) */}
            {activeTab === 'admin-dashboard' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(124, 58, 237, 0.12)',
                          color: '#7C3AED',
                          border: '1px solid rgba(124, 58, 237, 0.28)'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>AUTHORIZED PLATFORM ADMINISTRATOR</span>
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#059669',
                          backgroundColor: '#ECFDF3',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #A7F3D0'
                        }}
                      >
                        ● Systems Operational
                      </span>
                    </div>

                    <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)', margin: 0 }}>
                      Platform Administration
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                      Central oversight for 3D digital passes, campus events, user authority management, and turnstiles.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    icon={Activity}
                    onClick={() => onOpenAdminDashboard && onOpenAdminDashboard('dashboard')}
                    style={{
                      backgroundColor: 'var(--color-black)',
                      color: 'var(--color-white)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    Open Full Admin Console →
                  </Button>
                </div>

                {/* KPI Metrics Summary Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {[
                    { label: 'Campus Events', val: '4 Active', sub: 'Across 3 institutions', color: '#7C3AED' },
                    { label: '3D Passes Issued', val: '3,842', sub: '+18% this month', color: '#0284C7' },
                    { label: 'Platform Revenue', val: '₹4,12,650', sub: 'Gross ticketing volume', color: '#059669' },
                    { label: 'Turnstile Scan Rate', val: '76.4%', sub: '2,918 validated entries', color: '#D97706' }
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className="glass-card"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                        {metric.label}
                      </span>
                      <span style={{ fontSize: '24px', fontWeight: 800, color: metric.color, letterSpacing: '-0.5px' }}>
                        {metric.val}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-light-muted)', fontWeight: 500 }}>
                        {metric.sub}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Access Platform Operations Hub */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-dark-text)' }}>
                    Admin Operations & Configuration Hub
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '18px'
                    }}
                  >
                    {/* Operation 1: Pass Builder */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7C3AED'
                          }}
                        >
                          <Ticket size={20} strokeWidth={2.2} />
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          Pass Builder & Dynamic Themes
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '19px', margin: 0 }}>
                          Configure dynamic 3D ticket themes, select category artwork, define authority admission tiers, and publish to the Pass Library.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        icon={ArrowRight}
                        onClick={() => onOpenAdminDashboard && onOpenAdminDashboard('passes')}
                        style={{
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF'
                        }}
                      >
                        Open Pass Builder
                      </Button>
                    </div>

                    {/* Operation 2: Roles & Authorities */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(8, 145, 178, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0891B2'
                          }}
                        >
                          <Users size={20} strokeWidth={2.2} />
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          User Roles & Authorities
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '19px', margin: 0 }}>
                          Audit registered platform attendees and promote accounts to Event Organizers, Gate Verifiers, or Platform Administrators.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        icon={ArrowRight}
                        onClick={() => onOpenAdminDashboard && onOpenAdminDashboard('authorities')}
                      >
                        Manage User Roles
                      </Button>
                    </div>

                    {/* Operation 3: Turnstile Scanner */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#059669'
                          }}
                        >
                          <QrCode size={20} strokeWidth={2.2} />
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          Gate Verifier Portal
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '19px', margin: 0 }}>
                          Access turnstile gate scanners to validate 3D digital passes, audit entry timestamps, and enforce security policies.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        icon={ArrowRight}
                        onClick={() => onOpenVerifierPortal && onOpenVerifierPortal()}
                      >
                        Open Gate Verifier
                      </Button>
                    </div>

                    {/* Operation 4: Full Platform Console */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(10, 10, 13, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-dark-text)'
                          }}
                        >
                          <BarChart3 size={20} strokeWidth={2.2} />
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          Full Platform Console
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '19px', margin: 0 }}>
                          Enter the full administrative workspace with live participants ledger, payment gateways, and system configuration.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        icon={ArrowRight}
                        onClick={() => onOpenAdminDashboard && onOpenAdminDashboard('dashboard')}
                      >
                        Enter Admin Console
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Security Notice Card */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(124, 58, 237, 0.06)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <Lock size={18} color="#7C3AED" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', lineHeight: '20px', color: '#4C1D95' }}>
                    <strong>Administrative Security Boundary:</strong> You are logged in with verified administrator credentials. Any pass template modifications, event status updates, or role assignments are securely recorded and synchronized with Cloud Firestore in real time.
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW: LIST YOUR EVENT (Organizer & Verifier Hub) */}
            {activeTab === 'list-event' && (
              isParticipant ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '48px 24px',
                    backgroundColor: 'var(--color-off-white)',
                    border: '1px solid var(--color-gray)',
                    borderRadius: 'var(--radius-card)',
                    textAlign: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-light-violet)',
                      color: 'var(--color-deep-violet)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                      Organizer Authorization Required
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', maxWidth: '440px', marginTop: '6px', lineHeight: '20px' }}>
                      You are signed in as a participant ({activeUser?.email || 'Guest'}). Creating campus events, configuring pass templates, and accessing turnstile scanners requires an authorized Organizer account.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('profile')}>
                    Back to My Profile
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        ORGANIZER HUB
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: 'var(--color-light-violet)', color: 'var(--color-deep-violet)', padding: '2px 8px', borderRadius: '4px' }}>
                        Verified Organizer
                      </span>
                    </div>
                    <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                      List Your Event & Turnstile Verifier
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                      Create and manage campus events with automated digital pass generation and integrated turnstile QR scanning.
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
              )
            )}

            {/* SUB-VIEW 2: MY PASSES (CRITICAL: Only accessible through profile) */}
            {activeTab === 'my-passes' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    My Digital Passes
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Active tickets ready for gate validation. Expired or terminated passes are moved to Pass History.
                  </p>
                </div>

                {/* Sub-tab Switcher: Active Passes vs Pass History */}
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '4px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E9E5F0',
                    borderRadius: '9999px',
                    gap: '4px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(24, 21, 38, 0.04)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPassSubFilter('active')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: passSubFilter === 'active' ? '#7C3AED' : 'transparent',
                      color: passSubFilter === 'active' ? '#FFFFFF' : '#181526',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Ticket size={14} />
                    <span>Active Passes ({activePasses.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassSubFilter('history')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: passSubFilter === 'history' ? '#7C3AED' : 'transparent',
                      color: passSubFilter === 'history' ? '#FFFFFF' : '#181526',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <History size={14} />
                    <span>Pass History ({historyPasses.length})</span>
                  </button>
                </div>

                {passSubFilter === 'active' ? (
                  activePasses.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9E5F0',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <Ticket size={36} style={{ color: '#7C3AED' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#181526' }}>
                        No active passes
                      </h3>
                      <p style={{ fontSize: '13px', color: '#777487', maxWidth: '380px', lineHeight: 1.5 }}>
                        Passes for upcoming events appear here ready for gate validation. Terminated, expired, or used passes are automatically removed from this section.
                      </p>
                      {historyPasses.length > 0 && (
                        <Button
                          variant="outline"
                          icon={History}
                          onClick={() => setPassSubFilter('history')}
                          style={{ marginTop: '8px' }}
                        >
                          View Pass History ({historyPasses.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                      }}
                    >
                      {activePasses.map((p) => (
                        <PassCard
                          key={p.id || p.passId}
                          pass={p}
                          onViewPass={() => setSelectedPassForModal(p)}
                          onDeletePass={onDeletePass}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  /* Pass History nested view inside My Passes */
                  <div>
                    {/* Category Filter Pills inside History */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: `All History (${historyPasses.length})` },
                        { id: 'used', label: `Used Passes (${usedPasses.length})` },
                        { id: 'expired', label: `Expired (${expiredPasses.length})` }
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setHistoryCategoryFilter(chip.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: historyCategoryFilter === chip.id ? '1px solid #7C3AED' : '1px solid #E9E5F0',
                            backgroundColor: historyCategoryFilter === chip.id ? 'rgba(124, 58, 237, 0.08)' : '#FFFFFF',
                            color: historyCategoryFilter === chip.id ? '#7C3AED' : '#181526',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const list = historyCategoryFilter === 'used'
                        ? usedPasses
                        : historyCategoryFilter === 'expired'
                        ? expiredPasses
                        : historyPasses;

                      if (list.length === 0) {
                        return (
                          <div
                            style={{
                              padding: '48px 24px',
                              textAlign: 'center',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E9E5F0',
                              borderRadius: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <History size={36} style={{ color: '#777487' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#181526' }}>
                              No pass history in this view
                            </h3>
                            <p style={{ fontSize: '13px', color: '#777487', maxWidth: '360px', lineHeight: 1.5 }}>
                              When you check in at event turnstiles or events conclude, your passes will be archived here.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                          }}
                        >
                          {list.map((p) => (
                            <PassCard
                              key={p.id || p.passId}
                              pass={p}
                              onViewPass={() => setSelectedPassForModal(p)}
                              onDeletePass={onDeletePass}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2B: PASS HISTORY (Direct Navigation from Menu) */}
            {activeTab === 'pass-history' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h2 className="text-h2" style={{ fontSize: '28px', color: 'var(--color-dark-text)' }}>
                    Pass History
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                    Archived passes: redeemed tickets with gate check-in timestamps, concluded events, and historical records.
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All History (${historyPasses.length})` },
                    { id: 'used', label: `Used Passes (${usedPasses.length})` },
                    { id: 'expired', label: `Expired (${expiredPasses.length})` }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setHistoryCategoryFilter(chip.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: historyCategoryFilter === chip.id ? '1px solid #7C3AED' : '1px solid #E9E5F0',
                        backgroundColor: historyCategoryFilter === chip.id ? 'rgba(124, 58, 237, 0.08)' : '#FFFFFF',
                        color: historyCategoryFilter === chip.id ? '#7C3AED' : '#181526',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const list = historyCategoryFilter === 'used'
                    ? usedPasses
                    : historyCategoryFilter === 'expired'
                    ? expiredPasses
                    : historyPasses;

                  if (list.length === 0) {
                    return (
                      <div
                        style={{
                          padding: '48px 24px',
                          textAlign: 'center',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E9E5F0',
                          borderRadius: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <History size={36} style={{ color: '#777487' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#181526' }}>
                          No pass history recorded
                        </h3>
                        <p style={{ fontSize: '13px', color: '#777487', maxWidth: '360px', lineHeight: 1.5 }}>
                          Used passes and concluded event records will automatically appear here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                      }}
                    >
                      {list.map((p) => (
                        <PassCard
                          key={p.id || p.passId}
                          pass={p}
                          onViewPass={() => setSelectedPassForModal(p)}
                          onDeletePass={onDeletePass}
                        />
                      ))}
                    </div>
                  );
                })()}
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

                {userBookings.length === 0 ? (
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
                    {userBookings.map((b) => {
                      const totalTix = b.totalTickets || b.passes?.length || b.quantity || 1;
                      const relatedPasses = userPasses.filter(
                        (p) => p.bookingId === b.bookingId || p.id === b.passId || (b.passIds && b.passIds.includes(p.id))
                      );

                      return (
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
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                                  color: 'var(--color-primary-purple, #7c3aed)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px'
                                }}
                              >
                                {totalTix} {totalTix === 1 ? 'Ticket' : 'Tickets'}
                              </span>
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
                                const foundPass = relatedPasses[0] || userPasses.find((p) => p.id === b.passId) || userPasses[0];
                                if (foundPass) setSelectedPassForModal(foundPass);
                              }}
                            >
                              {totalTix > 1 ? `View Passes (${totalTix})` : 'View Pass'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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

                {userBookings.length === 0 ? (
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
                    {userBookings.map((b) => (
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
        variant="liquid-glass"
        maxWidth="1020px"
        padding="20px 24px"
        cancelText={null}
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
