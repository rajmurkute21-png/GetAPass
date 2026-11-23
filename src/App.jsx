import React, { useState, useEffect } from 'react';
import DesktopHeader from './components/navigation/DesktopHeader';
import MobileHeader from './components/navigation/MobileHeader';
import MobileBottomNav from './components/navigation/MobileBottomNav';
import LandingView from './views/LandingView';
import EventsView from './views/EventsView';
import EventDetailsView from './views/EventDetailsView';
import BookingView from './views/BookingView';
import PaymentView from './views/PaymentView';
import ProfileView from './views/ProfileView';
import OrganizerStudioView from './views/OrganizerStudioView';
import AdminView from './views/AdminView';
import VerifierView from './views/VerifierView';
import DesignSystemSpecView from './views/DesignSystemSpecView';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { getPassTypesByEvent } from './data/passTypes';
import { getTemplateById } from './data/passTemplates';
import {
  canAccessAdminDashboard,
  canAccessOrganizerDashboard,
  canAccessVerifierPortal
} from './services/permissionService';
import {
  createBooking,
  subscribeToParticipantBookings,
  subscribeToOrganizerBookings,
  subscribeToAllBookingsAdmin,
  clearSessionBookingCache,
  getStoredUserPasses,
  saveStoredUserPasses
} from './services/bookingService';
import {
  INITIAL_PASSES,
  INITIAL_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PARTICIPANTS,
  INITIAL_CHECKINS,
  INITIAL_USER
} from './data/mockData';
import {
  getAllEvents,
  saveEvent,
  updateEvent,
  deleteEvent,
  subscribeToEvents,
  subscribeToOrganizerEvents,
  subscribeToAllEventsAdmin,
  migrateLocalEventsToFirestore
} from './data/eventsData';

export default function App() {
  // Navigation & Mode states
  // 'participant' (public experience) | 'organizer-studio' (event admin & turnstile verifier) | 'admin' (global admin)
  const [portalMode, setPortalMode] = useState('participant');
  const [organizerInitialTab, setOrganizerInitialTab] = useState('dashboard');
  const [adminInitialTab, setAdminInitialTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'events' | 'event-details' | 'booking' | 'payment' | 'profile' | 'how-it-works'
  const [profileSubTab, setProfileSubTab] = useState('profile');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Entities
  const [selectedEvent, setSelectedEvent] = useState(() => getAllEvents()[0] || null);
  const [bookingData, setBookingData] = useState(null);

  // App Data Stores
  const [user, setUser] = useState(INITIAL_USER);
  const [events, setEvents] = useState(getAllEvents);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsSyncError, setEventsSyncError] = useState(null);

  // Personal participant data
  const [passes, setPasses] = useState(INITIAL_PASSES);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Role-isolated data stores
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [organizerBookings, setOrganizerBookings] = useState([]);
  const [adminEvents, setAdminEvents] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);

  // Mock fallbacks for turnstile and staff
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [checkinHistory, setCheckinHistory] = useState(INITIAL_CHECKINS);

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Authentication Context integration
  const { user: authUser, logout, openAuthModal, setAuthModalView } = useAuth();
  const currentUser = authUser || user;

  // Route security guard: enforce verified server-role boundaries and email verification
  useEffect(() => {
    const isUnverifiedEmail = Boolean(currentUser && !currentUser.isEmailVerified && !currentUser.isGoogle);

    if (portalMode === 'admin' && (!canAccessAdminDashboard(currentUser) || isUnverifiedEmail)) {
      console.warn('[GateApass Security] Unauthorized attempt to access Admin Dashboard blocked.');
      setPortalMode('participant');
      setActiveView('events');
      if (isUnverifiedEmail && setAuthModalView && openAuthModal) {
        setAuthModalView('verify');
        openAuthModal('verify');
      }
    } else if (portalMode === 'organizer-studio' && (!canAccessOrganizerDashboard(currentUser) || isUnverifiedEmail)) {
      console.warn('[GateApass Security] Unauthorized attempt to access Organizer Studio blocked.');
      setPortalMode('participant');
      setActiveView('events');
      if (isUnverifiedEmail && setAuthModalView && openAuthModal) {
        setAuthModalView('verify');
        openAuthModal('verify');
      }
    } else if (portalMode === 'verifier' && (!canAccessVerifierPortal(currentUser) || isUnverifiedEmail)) {
      console.warn('[GateApass Security] Unauthorized attempt to access Verifier Portal blocked.');
      setPortalMode('participant');
      setActiveView('events');
      if (isUnverifiedEmail && setAuthModalView && openAuthModal) {
        setAuthModalView('verify');
        openAuthModal('verify');
      }
    }
  }, [
    portalMode,
    currentUser?.role,
    currentUser?.isAdmin,
    currentUser?.isOrganizer,
    currentUser?.isVerifier,
    currentUser?.isEmailVerified,
    currentUser?.isGoogle,
    setAuthModalView,
    openAuthModal
  ]);

  // Direct URL routing and browser history synchronization
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase().replace('#', '');
      const search = new URLSearchParams(window.location.search);
      const portalParam = search.get('portal') || search.get('mode');
      const viewParam = search.get('view');

      if (path === '/admin' || hash === 'admin' || portalParam === 'admin') {
        setPortalMode('admin');
      } else if (path === '/organizer' || hash === 'organizer' || portalParam === 'organizer' || hash === 'organizer-studio') {
        setPortalMode('organizer-studio');
      } else if (path === '/verifier' || hash === 'verifier' || portalParam === 'verifier') {
        setPortalMode('verifier');
      } else if (
        path === '/ticket' ||
        path === '/3d-ticket' ||
        path === '/design-system' ||
        hash === 'ticket' ||
        hash === '3d-ticket' ||
        hash === 'design-system' ||
        viewParam === 'ticket' ||
        viewParam === 'design-system'
      ) {
        setPortalMode('participant');
        setActiveView('design-system');
      } else if (path === '/profile' || hash === 'profile' || viewParam === 'profile') {
        setPortalMode('participant');
        setActiveView('profile');
      } else if (path === '/events' || hash === 'events' || viewParam === 'events') {
        setPortalMode('participant');
        setActiveView('events');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  // Update browser URL on portal/view state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let target = '/';
    if (portalMode === 'admin') target = '/admin';
    else if (portalMode === 'organizer-studio') target = '/organizer';
    else if (portalMode === 'verifier') target = '/verifier';
    else if (activeView === 'profile') target = '/profile';
    else if (activeView === 'events') target = '/events';
    else if (activeView === 'design-system' || activeView === 'ticket') target = '/ticket';

    if (window.location.pathname !== target && window.location.hash !== `#${target.replace('/', '')}`) {
      window.history.replaceState({ portalMode, activeView }, '', target);
    }
  }, [portalMode, activeView]);

  // Account switch handling: wipe in-memory caches
  useEffect(() => {
    clearSessionBookingCache();
  }, [currentUser?.uid]);

  // 1. Shared Public Event Discovery (for ALL users across accounts and devices)
  useEffect(() => {
    setEventsLoading(true);

    const unsubscribe = subscribeToEvents(
      (syncedEvents) => {
        setEvents(syncedEvents);
        setEventsLoading(false);
        setEventsSyncError(null);

        setSelectedEvent((prevSelected) => {
          if (!prevSelected) return syncedEvents[0] || null;
          const stillExists = syncedEvents.find((e) => e.id === prevSelected.id);
          return stillExists || syncedEvents[0] || null;
        });
      },
      (error) => {
        console.warn('[GateApass] Event subscription notice:', error);
        setEventsSyncError(error);
        setEventsLoading(false);
      },
      currentUser
    );

    // Non-destructive safe migration for any unsynced local events
    if (currentUser) {
      migrateLocalEventsToFirestore(currentUser).catch((err) => {
        console.warn('[GateApass] Event migration check:', err);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, currentUser?.email, currentUser?.role]);

  // 2. Participant Personal Bookings and Passes Subscription
  useEffect(() => {
    if (!currentUser?.uid) {
      setPasses([]);
      setBookings([]);
      return;
    }

    const unsubscribe = subscribeToParticipantBookings(
      currentUser.uid,
      (userBookings, userPasses) => {
        setBookings(userBookings);
        setPasses(userPasses);
      },
      (err) => console.warn('[GateApass Bookings] Participant subscription notice:', err)
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 3. Organizer-Specific Real-Time Subscriptions (Only owned events and their bookings)
  useEffect(() => {
    if (!currentUser?.uid || !canAccessOrganizerDashboard(currentUser)) {
      setOrganizerEvents([]);
      setOrganizerBookings([]);
      return;
    }

    const unsubEvents = subscribeToOrganizerEvents(
      currentUser.uid,
      (orgEvents) => setOrganizerEvents(orgEvents),
      (err) => console.warn('[GateApass Events] Organizer events subscription notice:', err)
    );

    const unsubBookings = subscribeToOrganizerBookings(
      currentUser.uid,
      (orgBookings) => setOrganizerBookings(orgBookings),
      (err) => console.warn('[GateApass Bookings] Organizer bookings subscription notice:', err)
    );

    return () => {
      unsubEvents();
      unsubBookings();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.isOrganizer, currentUser?.isAdmin]);

  // 4. Admin-Specific Platform-Wide Subscriptions (Platform-wide audit privileges)
  useEffect(() => {
    if (!canAccessAdminDashboard(currentUser)) {
      setAdminEvents([]);
      setAdminBookings([]);
      return;
    }

    const unsubAllEvents = subscribeToAllEventsAdmin(
      (allEvs) => setAdminEvents(allEvs),
      (err) => console.warn('[GateApass Events] Admin all-events subscription notice:', err)
    );

    const unsubAllBookings = subscribeToAllBookingsAdmin(
      (allBks) => setAdminBookings(allBks),
      (err) => console.warn('[GateApass Bookings] Admin all-bookings subscription notice:', err)
    );

    return () => {
      unsubAllEvents();
      unsubAllBookings();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.isAdmin]);

  // Listen to local persistent event changes across windows/components
  useEffect(() => {
    const handleEventsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setEvents(e.detail);
      }
    };
    window.addEventListener('gateapass_events_changed', handleEventsChanged);
    return () => window.removeEventListener('gateapass_events_changed', handleEventsChanged);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView, portalMode]);

  // Public Attendee Navigation
  const handleNavigate = (view, subTab) => {
    setActiveView(view);
    if (subTab) {
      setProfileSubTab(subTab);
    }
  };

  const handleBookEvent = (ev) => {
    // Requirement 4: Require verified email for email/password accounts before granting access
    if (currentUser && !currentUser.isEmailVerified && !currentUser.isGoogle) {
      if (setAuthModalView && openAuthModal) {
        setAuthModalView('verify');
        openAuthModal('verify');
      }
      return;
    }
    setSelectedEvent(ev);
    setActiveView('booking');
  };

  const handleViewEventDetails = (ev) => {
    setSelectedEvent(ev);
    setActiveView('event-details');
  };

  const handleProceedToPayment = (data) => {
    setBookingData(data);
    setActiveView('payment');
  };

  const handlePaymentSuccess = async ({
    amount,
    method,
    eventTitle,
    attendeeName,
    passType,
    passes: bookedPasses,
    autoNavigate = true
  }) => {
    const rawTitle = eventTitle || selectedEvent?.title || 'GP';
    const prefix = rawTitle.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'GP';

    const eventPassTypes = selectedEvent?.id ? getPassTypesByEvent(selectedEvent.id) : [];

    // Expand multiple passes if present, otherwise single pass
    const passItems = [];
    const itemsSummary = [];

    if (bookedPasses && bookedPasses.length > 0) {
      bookedPasses.forEach((bp) => {
        const qty = Number(bp.qty || bp.quantity || 1);
        const itemPrice = Number(bp.price !== undefined ? bp.price : (bp.unitPrice !== undefined ? bp.unitPrice : 0));
        itemsSummary.push({
          name: bp.name || bp.passType || 'Standard Pass',
          passType: bp.passType || bp.name || 'Standard Pass',
          unitPrice: itemPrice,
          price: itemPrice,
          quantity: qty,
          qty,
          subtotal: itemPrice * qty
        });
        for (let i = 0; i < qty; i++) {
          passItems.push({
            name: bp.name || bp.passType || 'Standard Pass',
            price: itemPrice,
            templateId: bp.templateId
          });
        }
      });
    } else {
      const singlePrice = Number(amount || 0);
      passItems.push({ name: passType || 'General Pass', price: singlePrice });
      itemsSummary.push({
        name: passType || 'General Pass',
        passType: passType || 'General Pass',
        unitPrice: singlePrice,
        price: singlePrice,
        quantity: 1,
        qty: 1,
        subtotal: singlePrice
      });
    }

    const orderTotal = passItems.reduce((acc, p) => acc + Number(p.price || 0), 0) || Number(amount || 0);
    const primaryBookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build individual passes list
    const individualPasses = passItems.map((pItem, idx) => {
      const ticketNum = idx + 1;
      const newPassId = `GP-${prefix}26-${Math.floor(1000 + Math.random() * 9000)}-${ticketNum}`;
      const matchedPassType = eventPassTypes.find(
        (pt) => pt.name.toLowerCase() === (pItem.name || '').toLowerCase()
      ) || eventPassTypes[0];

      const assignedTemplate = matchedPassType
        ? getTemplateById(matchedPassType.templateId)
        : getTemplateById('tpl-classic-violet');

      return {
        id: newPassId,
        passId: newPassId,
        bookingId: primaryBookingId,
        ticketIndex: ticketNum,
        totalTickets: passItems.length,
        eventId: selectedEvent?.id || '',
        eventTitle: eventTitle || selectedEvent?.title || 'Campus Event',
        organizerUid: selectedEvent?.organizerUid || '',
        organizerEmail: selectedEvent?.organizerEmail || '',
        passType: pItem.name || passType || 'General Pass',
        price: Number(pItem.price || 0),
        unitPrice: Number(pItem.price || 0),
        status: 'Active',
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        date: selectedEvent?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: selectedEvent?.time || '09:00 AM – 06:00 PM',
        venue: selectedEvent?.venue || 'Campus Auditorium',
        category: selectedEvent?.category || 'Concert',
        coverImage: selectedEvent?.coverImage || selectedEvent?.image || '',
        eventCover: selectedEvent?.coverImage || selectedEvent?.image || '',
        paymentMethod: method,
        attendeeName: attendeeName || currentUser?.name || 'Attendee',
        authority: matchedPassType?.defaultAuthority || 'Participant',
        permissions: matchedPassType?.accessPermissions || ['General Area'],
        templateId: matchedPassType?.templateId || 'tpl-classic-violet',
        templateVersion: matchedPassType?.templateVersion || 1,
        templateSnapshot: assignedTemplate,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    });

    const bookingPayload = {
      bookingId: primaryBookingId,
      eventId: selectedEvent?.id || '',
      eventTitle: eventTitle || selectedEvent?.title || 'Campus Event',
      organizerUid: selectedEvent?.organizerUid || '',
      organizerEmail: selectedEvent?.organizerEmail || '',
      amount: orderTotal,
      totalTickets: passItems.length,
      quantity: passItems.length,
      items: itemsSummary,
      passes: individualPasses,
      passType: passItems.length === 1 ? passItems[0].name : `${passItems.length} Passes`,
      paymentMethod: method,
      attendeeName: attendeeName || currentUser?.name || 'Attendee',
      status: 'Active',
      date: selectedEvent?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: selectedEvent?.time || '09:00 AM – 06:00 PM',
      venue: selectedEvent?.venue || 'Campus Auditorium',
      category: selectedEvent?.category || 'Concert',
      coverImage: selectedEvent?.coverImage || selectedEvent?.image || '',
      eventCover: selectedEvent?.coverImage || selectedEvent?.image || ''
    };

    let createdPassesList = individualPasses;
    let primaryBooking = {
      ...bookingPayload,
      id: primaryBookingId,
      passId: individualPasses[0]?.passId || '',
      passIds: individualPasses.map((p) => p.passId),
      pass: individualPasses[0]
    };

    if (currentUser?.uid) {
      try {
        const created = await createBooking(bookingPayload, currentUser, selectedEvent);
        if (created?.passes && created.passes.length > 0) {
          createdPassesList = created.passes;
        }
        if (created?.booking) {
          primaryBooking = created.booking;
        }
      } catch (err) {
        console.error('[GateApass Bookings] Failed to save booking to Firestore:', err);
      }
    }

    setPasses((prev) => [...createdPassesList, ...prev.filter((p) => !createdPassesList.some((cp) => cp.id === p.id))]);
    setBookings((prev) => [primaryBooking, ...prev.filter((b) => b.bookingId !== primaryBooking.bookingId)]);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Payment confirmed',
      message: `₹${orderTotal} received for ${eventTitle || selectedEvent?.title}. ${createdPassesList.length} digital ${createdPassesList.length === 1 ? 'pass is' : 'passes are'} ready.`,
      type: 'success',
      time: 'Just now',
      actionText: 'View pass'
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (autoNavigate) {
      setTimeout(() => {
        setActiveView('profile');
        setProfileSubTab('my-passes');
      }, 1200);
    }

    return { bookingId: primaryBookingId, passes: createdPassesList, booking: primaryBooking };
  };

  const handleRecordCheckin = (checkinItem) => {
    setCheckinHistory((prev) => [{ id: `chk-${Date.now()}`, ...checkinItem }, ...prev]);
    // Immediately mark the checked in pass as Used in passes state
    if (checkinItem?.passId) {
      const code = String(checkinItem.passId).trim();
      setPasses((prev) =>
        prev.map((p) =>
          (p.id === code || p.passId === code)
            ? {
                ...p,
                status: 'Used',
                checkedIn: true,
                checkedInAt: Date.now(),
                checkedInGate: checkinItem.gate || 'Gate A'
              }
            : p
        )
      );
      if (currentUser?.uid) {
        const stored = getStoredUserPasses(currentUser.uid);
        const updated = stored.map((p) =>
          (p.id === code || p.passId === code)
            ? {
                ...p,
                status: 'Used',
                checkedIn: true,
                checkedInAt: Date.now(),
                checkedInGate: checkinItem.gate || 'Gate A'
              }
            : p
        );
        saveStoredUserPasses(currentUser.uid, updated);
      }
    }
  };

  const handleDeletePass = (passId) => {
    if (!passId) return;
    setPasses((prev) => prev.filter((p) => (p.passId || p.id) !== passId));
    if (currentUser?.uid) {
      const stored = getStoredUserPasses(currentUser.uid);
      const cleaned = stored.filter((p) => (p.passId || p.id) !== passId);
      saveStoredUserPasses(currentUser.uid, cleaned);
    }
  };

  const handleEventTerminationOrDeletion = (eventId, eventTitle, isDelete = true) => {
    if (isDelete) {
      deleteEvent(eventId, currentUser);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setOrganizerEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } else {
      updateEvent(eventId, { status: 'Cancelled' }, currentUser);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'Cancelled' } : e)));
      setOrganizerEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'Cancelled' } : e)));
    }

    // Purge passes linked to this event from attendee passes
    const normTitle = (eventTitle || '').toLowerCase();
    setPasses((prev) =>
      prev.filter((p) => {
        const matchesId = p.eventId && p.eventId === eventId;
        const matchesTitle = normTitle && (p.eventTitle || p.event || '').toLowerCase() === normTitle;
        return !matchesId && !matchesTitle;
      })
    );

    if (currentUser?.uid) {
      const stored = getStoredUserPasses(currentUser.uid);
      const cleaned = stored.filter((p) => {
        const matchesId = p.eventId && p.eventId === eventId;
        const matchesTitle = normTitle && (p.eventTitle || p.event || '').toLowerCase() === normTitle;
        return !matchesId && !matchesTitle;
      });
      saveStoredUserPasses(currentUser.uid, cleaned);
    }

    if (eventTitle) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'Event Terminated',
          message: `The event "${eventTitle}" was terminated by the organizer. Associated pass(es) have been removed from My Passes.`,
          type: 'warning',
          time: 'Just now'
        },
        ...prev
      ]);
    }
  };

  const handleMobileNavSelect = (id) => {
    if (id === 'landing') {
      setActiveView('landing');
    } else if (id === 'events') {
      setActiveView('events');
    } else if (id === 'my-passes') {
      setActiveView('profile');
      setProfileSubTab('my-passes');
    } else if (id === 'profile') {
      setActiveView('profile');
      setProfileSubTab('profile');
    } else if (id === 'scan') {
      setActiveView('profile');
      setProfileSubTab('my-passes');
    }
  };

  const handleLogout = async () => {
    clearSessionBookingCache();
    setPasses([]);
    setBookings([]);
    setOrganizerEvents([]);
    setOrganizerBookings([]);
    setAdminEvents([]);
    setAdminBookings([]);
    setPortalMode('participant');
    setActiveView('landing');
    await logout();
  };

  // Derive organizer participants strictly from the organizer's own bookings
  const organizerParticipantsList = React.useMemo(() => {
    if (organizerBookings.length > 0) {
      return organizerBookings.map((b) => ({
        id: b.id || b.bookingId,
        name: b.participantName || b.attendeeName || 'Attendee',
        email: b.participantEmail || '',
        event: b.eventTitle,
        pass: b.passType,
        passId: b.passId,
        authority: b.authority || 'Participant',
        payment: `Paid ₹${b.amount}`,
        status: b.status || 'Active',
        date: b.date,
        organizerUid: b.organizerUid
      }));
    }
    return [];
  }, [organizerBookings]);

  // Derive platform participants for global administrator
  const adminParticipantsList = React.useMemo(() => {
    if (adminBookings.length > 0) {
      return adminBookings.map((b) => ({
        id: b.id || b.bookingId,
        name: b.participantName || b.attendeeName || 'Attendee',
        email: b.participantEmail || '',
        event: b.eventTitle,
        pass: b.passType,
        passId: b.passId,
        authority: b.authority || 'Participant',
        payment: `Paid ₹${b.amount}`,
        status: b.status || 'Active',
        date: b.date,
        organizerUid: b.organizerUid
      }));
    }
    return participants;
  }, [adminBookings, participants]);

  return (
    <div className="gateapass-app">
      {/* SEPARATED PUBLIC ATTENDEE HEADER (Only rendered outside organizer studio and admin) */}
      {portalMode === 'participant' && (
        <>
          {isMobile ? (
            <MobileHeader
              onNavigate={handleNavigate}
              onSearchClick={() => setActiveView('events')}
              unreadCount={notifications.length}
            />
          ) : (
            <DesktopHeader
              activeView={activeView}
              onNavigate={handleNavigate}
              unreadCount={notifications.length}
              user={currentUser}
              onOpenAdmin={() => setPortalMode('admin')}
              onOpenOrganizerStudio={() => {
                setOrganizerInitialTab('dashboard');
                setPortalMode('organizer-studio');
              }}
              onOpenVerifier={() => setPortalMode('verifier')}
            />
          )}
        </>
      )}

      {/* Main View Area */}
      <div className="gateapass-content-wrapper" style={{ paddingBottom: isMobile && portalMode === 'participant' ? 'calc(80px + env(safe-area-inset-bottom, 14px))' : 0 }}>
        {/* GLOBAL ADMINISTRATOR DASHBOARD */}
        {portalMode === 'admin' ? (
          <ProtectedRoute
            allowedRoles={['admin']}
            onNavigateHome={() => {
              setPortalMode('participant');
              setActiveView('events');
            }}
          >
            <AdminView
              initialTab={adminInitialTab}
              events={adminEvents.length > 0 ? adminEvents : events}
              participants={adminParticipantsList}
              onUpdateParticipants={setParticipants}
              onCreateEvent={(newEvent) => {
                const saved = saveEvent(newEvent, currentUser);
                setSelectedEvent(saved);
              }}
              onLogout={handleLogout}
              onBackToPortal={() => {
                setPortalMode('participant');
                setActiveView('events');
              }}
              currentUser={currentUser}
            />
          </ProtectedRoute>
        ) : portalMode === 'organizer-studio' ? (
          /* ORGANIZER STUDIO (Event Management, Pass Studio & Turnstile Verifier) */
          <ProtectedRoute
            allowedRoles={['admin', 'organizer']}
            onNavigateHome={() => {
              setPortalMode('participant');
              setActiveView('events');
            }}
          >
            <OrganizerStudioView
              key={organizerInitialTab}
              initialTab={organizerInitialTab}
              events={organizerEvents.length > 0 ? organizerEvents : events.filter((e) => e.organizerUid === currentUser?.uid)}
              currentUser={currentUser}
              onCreateEvent={(newEvent) => {
                const saved = saveEvent(newEvent, currentUser);
                setSelectedEvent(saved);
              }}
              onUpdateEvent={(updatedEvent) => {
                const updated = updateEvent(updatedEvent.id, updatedEvent, currentUser);
                if (selectedEvent?.id === updatedEvent.id) {
                  setSelectedEvent(updated);
                }
                if (updatedEvent.status === 'Cancelled' || updatedEvent.status === 'Terminated') {
                  handleEventTerminationOrDeletion(updatedEvent.id, updatedEvent.title, false);
                }
              }}
              onDeleteEvent={(eventId, eventTitle) => {
                const ev = events.find((e) => e.id === eventId);
                const title = eventTitle || ev?.title || '';
                handleEventTerminationOrDeletion(eventId, title, true);
              }}
              participants={organizerParticipantsList}
              onUpdateParticipants={setParticipants}
              checkinHistory={checkinHistory}
              onRecordCheckin={handleRecordCheckin}
              onClearHistory={() => setCheckinHistory([])}
              onBackToProfile={() => {
                setPortalMode('participant');
                setActiveView('profile');
              }}
            />
          </ProtectedRoute>
        ) : portalMode === 'verifier' ? (
          /* TURNSTILE PASS VERIFIER PORTAL */
          <ProtectedRoute
            allowedRoles={['admin', 'organizer', 'verifier']}
            onNavigateHome={() => {
              setPortalMode('participant');
              setActiveView('events');
            }}
          >
            <VerifierView
              events={events}
              currentUser={currentUser}
              checkinHistory={checkinHistory}
              onRecordCheckin={handleRecordCheckin}
              onClearHistory={() => setCheckinHistory([])}
              onBackToPortal={() => {
                setPortalMode('participant');
                setActiveView('events');
              }}
            />
          </ProtectedRoute>
        ) : (
          /* SEPARATED PUBLIC PARTICIPANT EXPERIENCE */
          <>
            {activeView === 'landing' && (
              <LandingView
                events={events}
                onExploreEvents={() => setActiveView('events')}
                onHowItWorks={() => {
                  const el = document.getElementById('how-it-works-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setActiveView('events');
                }}
                onBookEvent={handleBookEvent}
                onViewEventDetails={handleViewEventDetails}
                onCreateEvent={() => {
                  if (canAccessOrganizerDashboard(currentUser)) {
                    setOrganizerInitialTab('create-event');
                    setPortalMode('organizer-studio');
                  } else {
                    setActiveView('profile');
                    setProfileSubTab('list-event');
                  }
                }}
              />
            )}

            {activeView === 'how-it-works' && (
              <LandingView
                events={events}
                onExploreEvents={() => setActiveView('events')}
                onHowItWorks={() => {
                  const el = document.getElementById('how-it-works-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setActiveView('events');
                }}
                onBookEvent={handleBookEvent}
                onViewEventDetails={handleViewEventDetails}
                onCreateEvent={() => {
                  if (canAccessOrganizerDashboard(currentUser)) {
                    setOrganizerInitialTab('create-event');
                    setPortalMode('organizer-studio');
                  } else {
                    setActiveView('profile');
                    setProfileSubTab('list-event');
                  }
                }}
              />
            )}

            {activeView === 'events' && (
              <EventsView
                events={events}
                loading={eventsLoading}
                syncError={eventsSyncError}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onBookEvent={handleBookEvent}
                onViewEventDetails={handleViewEventDetails}
                onCreateEvent={() => {
                  if (canAccessOrganizerDashboard(currentUser)) {
                    setOrganizerInitialTab('create-event');
                    setPortalMode('organizer-studio');
                  } else {
                    setActiveView('profile');
                    setProfileSubTab('list-event');
                  }
                }}
              />
            )}

            {activeView === 'event-details' && (
              <EventDetailsView
                event={selectedEvent}
                onBack={() => setActiveView('events')}
                onBookNow={() => setActiveView('booking')}
              />
            )}

            {activeView === 'booking' && (
              <BookingView
                key={currentUser?.name || 'booking'}
                event={selectedEvent}
                attendee={currentUser}
                onBack={() => setActiveView('event-details')}
                onProceedToPayment={handleProceedToPayment}
                onPaymentSuccess={handlePaymentSuccess}
                onViewMyPasses={() => {
                  setActiveView('profile');
                  setProfileSubTab('my-passes');
                }}
                onExploreMore={() => setActiveView('events')}
              />
            )}

            {activeView === 'payment' && (
              <PaymentView
                bookingData={bookingData}
                onBack={() => setActiveView('booking')}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}

            {activeView === 'profile' && (
              <ProtectedRoute
                allowedRoles={['admin', 'organizer', 'verifier', 'participant']}
                onNavigateHome={() => setActiveView('events')}
              >
                <ProfileView
                  user={currentUser}
                  onUpdateUser={setUser}
                  passes={passes}
                  events={events}
                  onDeletePass={handleDeletePass}
                  bookings={bookings}
                  notifications={notifications}
                  initialSubTab={profileSubTab}
                  onOpenOrganizerStudio={(tab = 'dashboard') => {
                    setOrganizerInitialTab(tab);
                    setPortalMode('organizer-studio');
                  }}
                  onOpenAdminDashboard={(tab = 'dashboard') => {
                    setAdminInitialTab(tab);
                    setPortalMode('admin');
                  }}
                  onOpenVerifierPortal={() => {
                    setPortalMode('verifier');
                  }}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            )}

            {activeView === 'ticket' && (
              <div style={{ padding: '32px 0 64px' }}>
                <DesignSystemSpecView initialTab="08-qr" />
              </div>
            )}

            {activeView === 'design-system' && (
              <div style={{ padding: '32px 0 64px' }}>
                <DesignSystemSpecView initialTab="01-foundations" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation (Shown on main discovery and account screens) */}
      {isMobile && portalMode === 'participant' && ['landing', 'events', 'profile'].includes(activeView) && (
        <MobileBottomNav
          activeItem={
            activeView === 'profile' && profileSubTab === 'my-passes'
              ? 'my-passes'
              : activeView === 'profile'
              ? 'profile'
              : activeView === 'events'
              ? 'events'
              : 'landing'
          }
          onSelect={handleMobileNavSelect}
        />
      )}

      {/* GateApass Authentication Modal */}
      <AuthModal />
    </div>
  );
}
