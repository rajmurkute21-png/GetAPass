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
import AuthModal from './components/auth/AuthModal';
import { useAuth } from './context/AuthContext';
import { getPassTypesByEvent } from './data/passTypes';
import { getTemplateById } from './data/passTemplates';
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
  migrateLocalEventsToFirestore
} from './data/eventsData';

export default function App() {
  // Navigation & Mode states
  // 'participant' (public experience) | 'organizer-studio' (event admin & turnstile verifier)
  const [portalMode, setPortalMode] = useState('participant');
  const [organizerInitialTab, setOrganizerInitialTab] = useState('dashboard');
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
  const [passes, setPasses] = useState(INITIAL_PASSES);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [checkinHistory, setCheckinHistory] = useState(INITIAL_CHECKINS);

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Authentication Context integration
  const { user: authUser, logout } = useAuth();
  const currentUser = authUser || user;

  // Real-time Firestore sync & cross-device event synchronization
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
      }
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
  }, [currentUser?.uid, currentUser?.email]);

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

  const handlePaymentSuccess = ({ amount, method, eventTitle, attendeeName, passType }) => {
    const rawTitle = eventTitle || selectedEvent?.title || 'GP';
    const prefix = rawTitle.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'GP';
    const newPassId = `GP-${prefix}26-${Math.floor(1000 + Math.random() * 9000)}`;

    const eventPassTypes = selectedEvent?.id ? getPassTypesByEvent(selectedEvent.id) : [];
    const matchedPassType = eventPassTypes.find(
      (pt) => pt.name.toLowerCase() === (passType || '').toLowerCase()
    ) || eventPassTypes[0];

    const assignedTemplate = matchedPassType
      ? getTemplateById(matchedPassType.templateId)
      : getTemplateById('tpl-classic-violet');

    const newPass = {
      id: newPassId,
      eventTitle: eventTitle || selectedEvent?.title || 'Campus Event Pass',
      eventId: selectedEvent?.id || `evt-${Date.now()}`,
      passType: passType || 'General Pass',
      attendeeName: attendeeName || currentUser?.name || 'Attendee',
      email: currentUser?.email || '',
      phone: currentUser?.phone || user?.phone || '',
      authority: matchedPassType?.defaultAuthority || 'Participant',
      date: selectedEvent?.date || new Date().toLocaleDateString('en-GB'),
      time: selectedEvent?.time || 'Doors Open 09:00 AM',
      venue: selectedEvent?.venue || 'Campus Venue',
      gate: 'Gate A',
      status: 'Active',
      price: amount,
      paymentMethod: method,
      issuedAt: 'Just now',
      permissions: matchedPassType?.accessPermissions || ['General Area'],
      templateId: matchedPassType?.templateId || 'tpl-classic-violet',
      templateVersion: matchedPassType?.templateVersion || 1,
      templateSnapshot: assignedTemplate
    };

    const newBooking = {
      bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      eventTitle: eventTitle,
      passType: passType,
      amount: amount,
      status: 'Active',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMethod: method,
      passId: newPassId
    };

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Payment confirmed',
      message: `₹${amount} received for ${eventTitle}. Your digital GateApass is ready.`,
      type: 'success',
      time: 'Just now',
      actionText: 'View pass'
    };

    setPasses((prev) => [newPass, ...prev]);
    setBookings((prev) => [newBooking, ...prev]);
    setNotifications((prev) => [newNotif, ...prev]);
    setParticipants((prev) => [
      {
        id: `pt-${Date.now()}`,
        name: attendeeName,
        email: currentUser.email,
        event: eventTitle,
        pass: passType,
        passId: newPassId,
        authority: matchedPassType?.defaultAuthority || 'Participant',
        payment: `Paid ₹${amount}`,
        status: 'Active',
        date: newBooking.date
      },
      ...prev
    ]);

    // Transition to Profile > My Passes
    setTimeout(() => {
      setActiveView('profile');
      setProfileSubTab('my-passes');
    }, 1800);
  };

  const handleRecordCheckin = (checkinItem) => {
    setCheckinHistory((prev) => [{ id: `chk-${Date.now()}`, ...checkinItem }, ...prev]);
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
    }
  };

  return (
    <div className="gateapass-app">
      {/* SEPARATED PUBLIC ATTENDEE HEADER (Only rendered outside organizer studio) */}
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
            />
          )}
        </>
      )}

      {/* Main View Area */}
      <div className="gateapass-content-wrapper" style={{ paddingBottom: isMobile && portalMode === 'participant' ? '72px' : 0 }}>
        {/* ORGANIZER STUDIO (List Your Event, Event Dashboard & Turnstile Verifier) */}
        {portalMode === 'organizer-studio' ? (
          <OrganizerStudioView
            key={organizerInitialTab}
            initialTab={organizerInitialTab}
            events={events}
            onCreateEvent={(newEvent) => {
              const saved = saveEvent(newEvent, currentUser);
              setSelectedEvent(saved);
            }}
            onUpdateEvent={(updatedEvent) => {
              const updated = updateEvent(updatedEvent.id, updatedEvent, currentUser);
              if (selectedEvent?.id === updatedEvent.id) {
                setSelectedEvent(updated);
              }
            }}
            onDeleteEvent={(eventId) => {
              deleteEvent(eventId, currentUser);
              if (selectedEvent?.id === eventId) {
                setSelectedEvent(null);
              }
            }}
            participants={participants}
            onUpdateParticipants={setParticipants}
            checkinHistory={checkinHistory}
            onRecordCheckin={handleRecordCheckin}
            onClearHistory={() => setCheckinHistory([])}
            onBackToProfile={() => {
              setPortalMode('participant');
              setActiveView('profile');
            }}
          />
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
                  setOrganizerInitialTab('create-event');
                  setPortalMode('organizer-studio');
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
                  setOrganizerInitialTab('create-event');
                  setPortalMode('organizer-studio');
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
                  setOrganizerInitialTab('create-event');
                  setPortalMode('organizer-studio');
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
              <ProfileView
                user={currentUser}
                onUpdateUser={setUser}
                passes={passes}
                bookings={bookings}
                notifications={notifications}
                initialSubTab={profileSubTab}
                onOpenOrganizerStudio={(tab = 'dashboard') => {
                  setOrganizerInitialTab(tab);
                  setPortalMode('organizer-studio');
                }}
                onLogout={async () => {
                  await logout();
                  setActiveView('landing');
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation (Shown during public attendee flow) */}
      {isMobile && portalMode === 'participant' && (
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
