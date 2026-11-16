import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  Info,
  FileText,
  Check
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import PassCanvas from '../studio/PassCanvas';
import { getAllTemplates, SAMPLE_PASS_DATA } from '../../data/passTemplates';
import { savePassType } from '../../data/passTypes';
import { createEventInFirestore } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import {
  CATEGORIES,
  AUTHORITIES,
  PERMISSION_AREAS,
  EVENT_IMAGE_PRESETS
} from '../../data/mockData';

const AVAILABLE_PASS_OPTIONS = [
  { id: 'participant', name: 'Participant Pass', defaultPrice: 199, defaultCapacity: 500, defaultAuthority: 'Participant', defaultAccess: ['General Area', 'Workshop Area'], defaultTemplate: 'tpl-classic-violet' },
  { id: 'vip', name: 'VIP Pass', defaultPrice: 999, defaultCapacity: 100, defaultAuthority: 'VIP', defaultAccess: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage'], defaultTemplate: 'tpl-vip-dark' },
  { id: 'couple', name: 'Couple Pass', defaultPrice: 399, defaultCapacity: 100, defaultAuthority: 'Participant', defaultAccess: ['General Area'], defaultTemplate: 'tpl-festival', entries: 2 },
  { id: 'group', name: 'Group Pass', defaultPrice: 699, defaultCapacity: 50, defaultAuthority: 'Participant', defaultAccess: ['General Area', 'Workshop Area'], defaultTemplate: 'tpl-hackathon', minSize: 3, maxSize: 10 },
  { id: 'volunteer', name: 'Volunteer Pass', defaultPrice: 99, defaultCapacity: 100, defaultAuthority: 'Volunteer', defaultAccess: ['General Area', 'Workshop Area', 'Organizer Area'], defaultTemplate: 'tpl-classic-black' },
  { id: 'speaker', name: 'Speaker Pass', defaultPrice: 0, defaultCapacity: 20, defaultAuthority: 'Speaker', defaultAccess: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage'], defaultTemplate: 'tpl-conference' },
  { id: 'judge', name: 'Judge Pass', defaultPrice: 0, defaultCapacity: 15, defaultAuthority: 'Judge', defaultAccess: ['General Area', 'Workshop Area', 'VIP Area', 'Admin Area'], defaultTemplate: 'tpl-vip-dark' },
  { id: 'mentor', name: 'Mentor Pass', defaultPrice: 0, defaultCapacity: 30, defaultAuthority: 'Mentor', defaultAccess: ['General Area', 'Workshop Area', 'VIP Area'], defaultTemplate: 'tpl-workshop' },
  { id: 'organizer', name: 'Organizer Pass', defaultPrice: 0, defaultCapacity: 25, defaultAuthority: 'Organizer', defaultAccess: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage', 'Organizer Area', 'Admin Area'], defaultTemplate: 'tpl-classic-black' },
  { id: 'media', name: 'Media Pass', defaultPrice: 0, defaultCapacity: 15, defaultAuthority: 'Participant', defaultAccess: ['General Area', 'VIP Area'], defaultTemplate: 'tpl-conference' },
  { id: 'sponsor', name: 'Sponsor Pass', defaultPrice: 0, defaultCapacity: 20, defaultAuthority: 'VIP', defaultAccess: ['General Area', 'VIP Area'], defaultTemplate: 'tpl-vip-dark' },
  { id: 'faculty', name: 'Faculty Pass', defaultPrice: 0, defaultCapacity: 50, defaultAuthority: 'Participant', defaultAccess: ['General Area', 'VIP Area'], defaultTemplate: 'tpl-college-event' },
  { id: 'guest', name: 'Guest Pass', defaultPrice: 0, defaultCapacity: 40, defaultAuthority: 'Participant', defaultAccess: ['General Area'], defaultTemplate: 'tpl-minimal-white' },
  { id: 'staff', name: 'Staff Pass', defaultPrice: 0, defaultCapacity: 50, defaultAuthority: 'Volunteer', defaultAccess: ['General Area', 'Organizer Area'], defaultTemplate: 'tpl-classic-black' },
  { id: 'backstage', name: 'Backstage Pass', defaultPrice: 0, defaultCapacity: 20, defaultAuthority: 'VIP', defaultAccess: ['General Area', 'Backstage', 'Organizer Area'], defaultTemplate: 'tpl-vip-dark' }
];

const WIZARD_STEPS = [
  { id: 1, label: 'Basic Information', icon: Info },
  { id: 2, label: 'Schedule & Venue', icon: Calendar },
  { id: 3, label: 'Branding', icon: Sparkles },
  { id: 4, label: 'Pass Configuration', icon: Ticket },
  { id: 5, label: 'Policies & FAQs', icon: FileText },
  { id: 6, label: 'Review & Publish', icon: CheckCircle }
];

export default function EventCreateWizard({
  onCancel,
  onEventCreated
}) {
  const { user: currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [templates] = useState(getAllTemplates());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hackathons');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [organizerName, setOrganizerName] = useState('Zeal College Pune');
  const [organizerEmail, setOrganizerEmail] = useState('events@zeal.edu');
  const [organizerPhone, setOrganizerPhone] = useState('+91 98765 43210');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('Active');

  // Step 2: Schedule & Venue
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-16');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [regStartDate, setRegStartDate] = useState('');
  const [regEndDate, setRegEndDate] = useState('');
  const [venueName, setVenueName] = useState('Main Campus Auditorium, Zeal College');
  const [address, setAddress] = useState('Survey No. 39, Narhe');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('411041');
  const [landmark, setLandmark] = useState('Near Narhe Flyover');
  const [mapsUrl, setMapsUrl] = useState('');

  // Step 3: Event Branding
  const [coverImage, setCoverImage] = useState(EVENT_IMAGE_PRESETS[0].url);
  const [logoImage, setLogoImage] = useState('');
  const [themeColor, setThemeColor] = useState('#AC58E9');
  const [secondaryColor, setSecondaryColor] = useState('#7C2CCB');

  // Step 4: Passes Configuration
  // Selected pass types array
  const [configuredPasses, setConfiguredPasses] = useState([
    {
      typeKey: 'participant',
      name: 'Participant Pass',
      price: 199,
      capacity: 500,
      authority: 'Participant',
      accessAreas: ['General Area', 'Workshop Area'],
      templateId: 'tpl-classic-violet',
      status: 'Active',
      description: 'Standard event admission with access to keynotes and workshops.'
    }
  ]);

  // Custom Pass Type Creation Modal State
  const [customPassModalOpen, setCustomPassModalOpen] = useState(false);
  const [customPassName, setCustomPassName] = useState('');
  const [customPassDesc, setCustomPassDesc] = useState('');
  const [customPassPrice, setCustomPassPrice] = useState(0);
  const [customPassCapacity, setCustomPassCapacity] = useState(100);
  const [customPassAuthority, setCustomPassAuthority] = useState('Participant');
  const [customPassTemplate, setCustomPassTemplate] = useState('tpl-classic-violet');
  const [customPassAccess] = useState(['General Area']);

  // Step 5: Policies & FAQs
  const [rules, setRules] = useState('Bring valid institutional identification. Non-transferable ticket.');
  const [terms, setTerms] = useState('Tickets are non-refundable within 48 hours of event start.');
  const [highlights, setHighlights] = useState('Keynote talks\nHackathon tracks with prizes\nOfficial certificate of completion');
  const [whatYouGet, setWhatYouGet] = useState('Digital GateApass\nMeals & snacks\nAccess to mentor sessions');

  // Preview Modal
  const [previewTemplateId, setPreviewTemplateId] = useState(null);

  // Helper: toggle a predefined pass
  const handleTogglePassOption = (option) => {
    const existingIndex = configuredPasses.findIndex((p) => p.typeKey === option.id);
    if (existingIndex >= 0) {
      if (configuredPasses.length === 1) {
        alert('Event must offer at least one pass type.');
        return;
      }
      setConfiguredPasses(configuredPasses.filter((_, idx) => idx !== existingIndex));
    } else {
      const newPass = {
        typeKey: option.id,
        name: option.name,
        price: option.defaultPrice,
        capacity: option.defaultCapacity,
        authority: option.defaultAuthority,
        accessAreas: [...option.defaultAccess],
        templateId: option.defaultTemplate || 'tpl-classic-violet',
        status: 'Active',
        description: `Admission pass for ${option.name}`,
        entries: option.entries || 1,
        minSize: option.minSize || null,
        maxSize: option.maxSize || null
      };
      setConfiguredPasses([...configuredPasses, newPass]);
    }
  };

  const handleUpdateConfiguredPass = (index, updates) => {
    setConfiguredPasses(configuredPasses.map((p, idx) => (idx === index ? { ...p, ...updates } : p)));
  };

  const handleToggleAccessArea = (passIndex, area) => {
    const targetPass = configuredPasses[passIndex];
    const current = targetPass.accessAreas || [];
    const updated = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    handleUpdateConfiguredPass(passIndex, { accessAreas: updated });
  };

  const handleAddCustomPassSubmit = (e) => {
    e.preventDefault();
    if (!customPassName.trim()) return;

    const newCustomPass = {
      typeKey: `custom-${Date.now()}`,
      name: customPassName.trim(),
      price: Number(customPassPrice),
      capacity: Number(customPassCapacity),
      authority: customPassAuthority,
      accessAreas: customPassAccess,
      templateId: customPassTemplate,
      status: 'Active',
      description: customPassDesc.trim() || 'Custom event pass tier.'
    };

    setConfiguredPasses([...configuredPasses, newCustomPass]);
    setCustomPassModalOpen(false);
    setCustomPassName('');
    setCustomPassDesc('');
  };

  // Final Publish Event Action
  const handlePublishEvent = async () => {
    if (!name.trim()) {
      alert('Event Name is required.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setPublishError('');

    try {
      const uniqueEventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const startingPrice = configuredPasses.length > 0
        ? Math.min(...configuredPasses.map((p) => Number(p.price) || 0))
        : 0;

      const passTypesData = configuredPasses.map((cp, idx) => ({
        id: `pt-${uniqueEventId}-${cp.typeKey || idx}`,
        eventId: uniqueEventId,
        name: cp.name,
        description: cp.description,
        price: Number(cp.price),
        capacity: Number(cp.capacity),
        soldCount: 0,
        templateId: cp.templateId || 'tpl-classic-violet',
        templateVersion: 1,
        defaultAuthority: cp.authority,
        accessPermissions: cp.accessAreas,
        accentColor: themeColor,
        status: cp.status || 'Active',
        entries: cp.entries || 1,
        minGroupSize: cp.minSize || null,
        maxGroupSize: cp.maxSize || null
      }));

      // 1. Construct Event Object
      const newEvent = {
        id: uniqueEventId,
        title: name.trim(),
        name: name.trim(),
        category,
        shortDescription,
        description: fullDescription || shortDescription || 'Campus event hosted with GateApass admission.',
        organizerName: organizerName || currentUser?.displayName || 'Event Organizer',
        organizerEmail: organizerEmail || currentUser?.email || '',
        organizerPhone,
        organizerUid: currentUser?.uid || '',
        website,
        status: status || 'Active',
        date: startDate === endDate || !endDate ? startDate : `${startDate} – ${endDate}`,
        startDate,
        endDate,
        time: `${startTime} – ${endTime}`,
        startTime,
        endTime,
        venue: `${venueName}, ${city}`,
        venueDetails: {
          name: venueName,
          address,
          city,
          state,
          pincode,
          landmark,
          mapsUrl
        },
        bannerImage: coverImage,
        logoImage,
        themeColor,
        secondaryColor,
        startingPrice,
        rules,
        terms,
        highlights: highlights.split('\n').filter(Boolean),
        whatYouGet: whatYouGet.split('\n').filter(Boolean),
        passes: configuredPasses.map((p, idx) => ({
          id: `p-${uniqueEventId}-${idx + 1}`,
          name: p.name,
          price: Number(p.price),
          description: p.description
        })),
        passTypes: passTypesData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // 2. Persist to Firestore and local cache
      await createEventInFirestore(newEvent, currentUser);

      // 3. Persist each Pass Type mapped to this event and assigned templates
      passTypesData.forEach((pt) => {
        try {
          savePassType(pt);
        } catch {
          // ignore cache warnings
        }
      });

      if (onEventCreated) {
        onEventCreated(newEvent);
      }
    } catch (err) {
      console.error('[GateApass] Failed to publish event:', err);
      setPublishError(err?.message || 'Failed to publish event to database. Please check your connection and Firestore rules.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gateapass-event-wizard" style={{ maxWidth: '1060px', margin: '0 auto', textAlign: 'left', padding: '24px 16px 80px' }}>
      {/* Wizard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            ORGANIZER STUDIO
          </span>
          <h1 className="text-h1" style={{ fontSize: '30px', color: 'var(--color-dark-text)', margin: '4px 0 0' }}>
            Create New Campus Event
          </h1>
        </div>

        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-control)',
            backgroundColor: 'var(--color-white)',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          backgroundColor: 'var(--color-white)',
          padding: '16px',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-card)',
          marginBottom: '28px',
          overflowX: 'auto'
        }}
      >
        {WIZARD_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: isActive ? 'var(--color-light-violet)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? 'var(--color-violet)' : isCompleted ? '#000000' : 'var(--color-off-white)',
                  color: isActive || isCompleted ? '#FFFFFF' : 'var(--color-muted-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {isCompleted ? <Check size={14} /> : step.id}
              </div>
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-card)',
          padding: '32px'
        }}
      >
        {/* ==============================================================
            STEP 1: BASIC INFORMATION
            ============================================================== */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>1. Basic Event Information</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Primary identification and organizer credentials for the event catalog.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
              <Input
                label="Event Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. TechFest 2026, HackNIT, AI Horizon"
                required
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Event Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 12px', fontSize: '14px' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Short Catchy Tagline / Pitch"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. 36-hour sprint with ₹2,50,000 cash prizes and national certificates."
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Full Event Description
              </label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={4}
                placeholder="Describe tracks, eligibility, workshops, and who should attend..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <Input
                label="Organizer Institution / Host"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
              />
              <Input
                label="Contact Email"
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
              />
              <Input
                label="Contact Phone"
                value={organizerPhone}
                onChange={(e) => setOrganizerPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <Input
                label="Official Website URL (Optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Event Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 12px', fontSize: '14px' }}
                >
                  <option value="Active">Active (Registration Open)</option>
                  <option value="Upcoming">Upcoming (Coming Soon)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 2: SCHEDULE & VENUE
            ============================================================== */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>2. Event Schedule & Campus Venue</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Dates and precise location for gate verification and attendee directions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Input
                label="Start Time *"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 09:00 AM"
              />
              <Input
                label="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 06:00 PM"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Input
                label="Registration Start Date (Optional)"
                type="date"
                value={regStartDate}
                onChange={(e) => setRegStartDate(e.target.value)}
              />
              <Input
                label="Registration Deadline (Optional)"
                type="date"
                value={regEndDate}
                onChange={(e) => setRegEndDate(e.target.value)}
              />
            </div>

            <Input
              label="Venue Building / Auditorium *"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Main Auditorium, Innovation Hall, Seminar Block B"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
              <Input
                label="Address / Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="City *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr', gap: '16px' }}>
              <Input
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <Input
                label="Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near West Gate"
              />
              <Input
                label="Google Maps Link (Optional)"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 3: EVENT BRANDING
            ============================================================== */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>3. Event Branding & Media</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Banner artwork, brand marks, and signature event palette.
              </p>
            </div>

            {/* Banner Presets */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Event Cover Banner Image
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {EVENT_IMAGE_PRESETS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setCoverImage(p.url)}
                    style={{
                      height: '90px',
                      backgroundImage: `url(${p.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 'var(--radius-control)',
                      cursor: 'pointer',
                      border: coverImage === p.url ? '3px solid var(--color-violet)' : '1px solid var(--color-gray)',
                      position: 'relative'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#FFF',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '2px 6px',
                        borderRadius: '2px'
                      }}
                    >
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px' }}>
                <Input
                  label="Or Custom Cover Image URL"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Input
              label="Event Logo URL (Optional)"
              value={logoImage}
              onChange={(e) => setLogoImage(e.target.value)}
              placeholder="https://.../logo.png"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Primary Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{ flex: 1, height: '40px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 10px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Secondary / Deep Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--color-gray)', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ flex: 1, height: '40px', border: '1px solid var(--color-gray)', borderRadius: '4px', padding: '0 10px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 4: PASS CONFIGURATION (CRITICAL)
            ============================================================== */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    4. Pass Configuration & Template Assignment
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                    Select which passes you want to offer. Each pass type independently configures pricing, authority, clearance, and its own template from the Template Library.
                  </p>
                </div>

                <Button
                  variant="outline"
                  icon={Plus}
                  size="compact"
                  onClick={() => setCustomPassModalOpen(true)}
                >
                  + Add Custom Pass Type
                </Button>
              </div>
            </div>

            {/* Which passes do you want to offer? Checkbox selector */}
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark-text)', display: 'block', marginBottom: '10px' }}>
                Which pass tiers do you want to offer for this event?
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {AVAILABLE_PASS_OPTIONS.map((opt) => {
                  const isChecked = configuredPasses.some((p) => p.typeKey === opt.id);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleTogglePassOption(opt)}
                      style={{
                        padding: '10px 12px',
                        border: isChecked ? '1px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                        backgroundColor: isChecked ? 'var(--color-light-violet)' : 'var(--color-white)',
                        borderRadius: 'var(--radius-control)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-violet)' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: isChecked ? 700 : 500, color: 'var(--color-dark-text)' }}>
                        {opt.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Pass Tier Configuration Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                Configured Pass Types ({configuredPasses.length})
              </span>

              {configuredPasses.map((passItem, passIdx) => {
                const assignedTemplate = templates.find((t) => t.id === passItem.templateId) || templates[0];

                return (
                  <div
                    key={passItem.typeKey || passIdx}
                    style={{
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-white)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor: 'var(--color-black)',
                            color: 'var(--color-white)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          PASS #{passIdx + 1}
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          {passItem.name}
                        </h4>
                      </div>

                      {configuredPasses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setConfiguredPasses(configuredPasses.filter((_, i) => i !== passIdx))}
                          style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Remove Pass
                        </button>
                      )}
                    </div>

                    {/* Inputs: Name, Price, Capacity */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                      <Input
                        label="Pass Display Name"
                        value={passItem.name}
                        onChange={(e) => handleUpdateConfiguredPass(passIdx, { name: e.target.value })}
                      />

                      <Input
                        label="Price (₹ INR)"
                        type="number"
                        min={0}
                        value={passItem.price}
                        onChange={(e) => handleUpdateConfiguredPass(passIdx, { price: Number(e.target.value) })}
                      />

                      <Input
                        label="Capacity (Tickets Available)"
                        type="number"
                        min={1}
                        value={passItem.capacity}
                        onChange={(e) => handleUpdateConfiguredPass(passIdx, { capacity: Number(e.target.value) })}
                      />

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          Default Authority
                        </label>
                        <select
                          value={passItem.authority}
                          onChange={(e) => handleUpdateConfiguredPass(passIdx, { authority: e.target.value })}
                          style={{ width: '100%', height: '42px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 10px', fontSize: '13px' }}
                        >
                          {AUTHORITIES.map((auth) => (
                            <option key={auth} value={auth}>{auth}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Special Pass Rules (Couple Pass / Group Pass) */}
                    {passItem.typeKey === 'couple' && (
                      <div style={{ padding: '12px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', border: '1px solid var(--color-gray)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)' }}>
                          COUPLE PASS RULE: Admits exactly 2 persons under single pass token.
                        </span>
                      </div>
                    )}

                    {passItem.typeKey === 'group' && (
                      <div style={{ padding: '14px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', border: '1px solid var(--color-gray)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Input
                          label="Minimum Group Size"
                          type="number"
                          min={2}
                          value={passItem.minSize || 3}
                          onChange={(e) => handleUpdateConfiguredPass(passIdx, { minSize: Number(e.target.value) })}
                        />
                        <Input
                          label="Maximum Group Size"
                          type="number"
                          min={3}
                          value={passItem.maxSize || 10}
                          onChange={(e) => handleUpdateConfiguredPass(passIdx, { maxSize: Number(e.target.value) })}
                        />
                      </div>
                    )}

                    {/* Template Selection Dropdown with Category Filter & Preview Button */}
                    <div style={{ padding: '16px', border: '1px solid var(--color-gray)', borderRadius: '4px', backgroundColor: 'var(--color-off-white)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark-text)', margin: 0 }}>
                          Pass Design Template (from Template Library)
                        </label>

                        {assignedTemplate && (
                          <button
                            type="button"
                            onClick={() => setPreviewTemplateId(assignedTemplate.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--color-deep-violet)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} /> Preview Template
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                        <select
                          value={passItem.templateId}
                          onChange={(e) => handleUpdateConfiguredPass(passIdx, { templateId: e.target.value })}
                          style={{
                            height: '40px',
                            border: '1px solid var(--color-gray)',
                            borderRadius: 'var(--radius-control)',
                            padding: '0 12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: 'var(--color-white)'
                          }}
                        >
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name} ({tpl.category}) {tpl.isSystemTemplate ? '· System' : `· Custom v${tpl.currentVersion || 1}`}
                            </option>
                          ))}
                        </select>

                        <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', whiteSpace: 'nowrap' }}>
                          Category: <strong>{assignedTemplate?.category}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Access Permissions Checkboxes */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted-text)', display: 'block', marginBottom: '8px' }}>
                        Clearance Areas Granted
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {PERMISSION_AREAS.map((area) => {
                          const isCleared = (passItem.accessAreas || []).includes(area);
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => handleToggleAccessArea(passIdx, area)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: isCleared ? 700 : 500,
                                borderRadius: '4px',
                                border: isCleared ? '1px solid var(--color-violet)' : '1px solid var(--color-gray)',
                                backgroundColor: isCleared ? 'var(--color-light-violet)' : 'var(--color-white)',
                                color: isCleared ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                                cursor: 'pointer'
                              }}
                            >
                              {isCleared ? '✓ ' : '+ '}{area}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 5: POLICIES & FAQS
            ============================================================== */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>5. Guidelines, Policies & Participant Perks</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Terms of entry, what is included with tickets, and turnstile admission rules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Event Highlights (One per line)
                </label>
                <textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  What Participants Get (One per line)
                </label>
                <textarea
                  value={whatYouGet}
                  onChange={(e) => setWhatYouGet(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Gate Admission Rules & Photo ID Requirement
              </label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Terms & Conditions / Refund Policy
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 6: REVIEW & PUBLISH
            ============================================================== */}
        {currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>6. Review & Publish Event</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '4px 0 0' }}>
                Verify all event parameters and pass tier template bindings before publishing.
              </p>
            </div>

            {/* Event Summary Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
              <div
                style={{
                  height: '160px',
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--color-gray)'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase' }}>
                    {category}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px' }}>
                    {status}
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{name || 'Untitled Event'}</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: 0 }}>
                  {startDate} · {startTime} – {endTime} · {venueName}, {city}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-dark-text)', marginTop: '4px' }}>
                  {shortDescription || fullDescription}
                </p>
              </div>
            </div>

            {/* Configured Passes Table */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
                Pass Tiers & Assigned Templates ({configuredPasses.length})
              </h4>
              <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-off-white)', borderBottom: '1px solid var(--color-gray)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Pass Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Price</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Capacity</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Authority</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Template</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuredPasses.map((p, idx) => {
                      const tpl = templates.find((t) => t.id === p.templateId);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-gray)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-deep-violet)' }}>
                            ₹{p.price}
                          </td>
                          <td style={{ padding: '12px 16px' }}>{p.capacity}</td>
                          <td style={{ padding: '12px 16px' }}>{p.authority}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontWeight: 600 }}>{tpl?.name || p.templateId}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', marginLeft: '6px' }}>({tpl?.category})</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {publishError && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF3F2',
              border: '1px solid #FECDCA',
              borderRadius: 'var(--radius-control)',
              color: '#B42318',
              fontSize: '13px',
              marginTop: '20px'
            }}
          >
            <strong>Publish Error:</strong> {publishError}
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-gray)' }}>
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: currentStep === 1 || isSubmitting ? 'var(--color-off-white)' : 'var(--color-white)',
              color: currentStep === 1 || isSubmitting ? 'var(--color-muted-text)' : 'var(--color-dark-text)',
              cursor: currentStep === 1 || isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep < 6 ? (
              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              >
                Continue to Step {currentStep + 1} →
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={CheckCircle}
                size="large"
                disabled={isSubmitting}
                onClick={handlePublishEvent}
              >
                {isSubmitting ? 'Publishing to Firestore...' : 'Publish Event & Assign Passes'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TEMPLATE PREVIEW MODAL */}
      {previewTemplateId && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewTemplateId(null)}
          title={`Template Preview: ${templates.find((t) => t.id === previewTemplateId)?.name}`}
          size="medium"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <PassCanvas
                template={templates.find((t) => t.id === previewTemplateId)}
                data={SAMPLE_PASS_DATA}
                isInteractive={false}
                targetWidth={360}
              />
            </div>
            <Button variant="outline" onClick={() => setPreviewTemplateId(null)}>
              Close Preview
            </Button>
          </div>
        </Modal>
      )}

      {/* ADD CUSTOM PASS TYPE MODAL */}
      {customPassModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setCustomPassModalOpen(false)}
          title="Add Custom Pass Tier"
          size="medium"
        >
          <form onSubmit={handleAddCustomPassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Custom Pass Name *"
              value={customPassName}
              onChange={(e) => setCustomPassName(e.target.value)}
              placeholder="e.g. Media Access Pass, Student Delegate"
              required
            />

            <Input
              label="Description"
              value={customPassDesc}
              onChange={(e) => setCustomPassDesc(e.target.value)}
              placeholder="Pass benefits and admission notes..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Price (₹ INR)"
                type="number"
                min={0}
                value={customPassPrice}
                onChange={(e) => setCustomPassPrice(e.target.value)}
              />
              <Input
                label="Capacity"
                type="number"
                min={1}
                value={customPassCapacity}
                onChange={(e) => setCustomPassCapacity(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Default Authority
                </label>
                <select
                  value={customPassAuthority}
                  onChange={(e) => setCustomPassAuthority(e.target.value)}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 8px', fontSize: '13px' }}
                >
                  {AUTHORITIES.map((auth) => (
                    <option key={auth} value={auth}>{auth}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Assign Template
                </label>
                <select
                  value={customPassTemplate}
                  onChange={(e) => setCustomPassTemplate(e.target.value)}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-control)', padding: '0 8px', fontSize: '13px' }}
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setCustomPassModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Pass Tier
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
