export const CATEGORIES = [
  'College Events',
  'Conferences',
  'Workshops',
  'Seminars',
  'Hackathons',
  'Festivals',
  'Sports Events',
  'Cultural Programs',
  'Exhibitions'
];

export const AUTHORITIES = [
  'Participant',
  'Volunteer',
  'Coordinator',
  'Organizer',
  'VIP',
  'Mentor',
  'Judge',
  'Speaker'
];

export const PERMISSION_AREAS = [
  'General Area',
  'Workshop Area',
  'VIP Area',
  'Backstage',
  'Organizer Area',
  'Admin Area'
];

export const EVENT_IMAGE_PRESETS = [
  {
    id: 'techfest',
    label: 'TechFest',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'hackathon',
    label: 'Hackathon',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'workshop',
    label: 'AI & Workshop',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'cultural',
    label: 'Cultural / Fest',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'esports',
    label: 'Esports & Gaming',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_USER = {
  name: '',
  email: '',
  phone: '',
  college: '',
  avatarInitials: 'GP'
};

export const INITIAL_EVENTS = [];

export const INITIAL_PASSES = [];

export const INITIAL_BOOKINGS = [];

export const INITIAL_NOTIFICATIONS = [];

export const INITIAL_PARTICIPANTS = [];

export const INITIAL_STAFF = [];

export const INITIAL_CHECKINS = [];

export const INITIAL_AUTHORITY_PERMISSIONS = {
  Participant: ['General Area'],
  Volunteer: ['General Area', 'Workshop Area'],
  Coordinator: ['General Area', 'Workshop Area', 'Organizer Area'],
  Organizer: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage', 'Organizer Area', 'Admin Area'],
  VIP: ['General Area', 'Workshop Area', 'VIP Area'],
  Mentor: ['General Area', 'Workshop Area', 'VIP Area'],
  Judge: ['General Area', 'Workshop Area', 'VIP Area', 'Organizer Area'],
  Speaker: ['General Area', 'Workshop Area', 'VIP Area', 'Backstage']
};
