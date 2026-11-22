/**
 * GetAPass — 3D Ticket Category Themes & Visual Identity Engine
 *
 * Provides category-specific color palettes, glowing neon accents, curated
 * atmospheric artwork, and iconography matching the GetAPass 3D design system.
 */

export const TICKET_CATEGORIES = [
  {
    id: 'concert',
    label: 'Concert',
    matchKeys: ['concert', 'live music', 'music', 'band', 'astral nights', 'sunburn', 'gig'],
    accent: '#A855F7',
    primary: '#7C3AED',
    deep: '#4C1D95',
    glow: 'rgba(168, 85, 247, 0.55)',
    borderGlow: 'rgba(168, 85, 247, 0.8)',
    tagline: 'Live Music Concert',
    badgeBg: 'rgba(124, 58, 237, 0.28)',
    badgeBorder: 'rgba(168, 85, 247, 0.5)',
    iconName: 'Music',
    artworkUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop&q=80', // concert stage crowd
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(124, 58, 237, 0.45) 0%, rgba(192, 38, 211, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'carnivals',
    label: 'Carnivals',
    matchKeys: ['carnival', 'carnivals', 'parade', 'fair'],
    accent: '#F43F5E',
    primary: '#E11D48',
    deep: '#881337',
    glow: 'rgba(244, 63, 94, 0.55)',
    borderGlow: 'rgba(244, 63, 94, 0.8)',
    tagline: 'Grand Campus Carnival',
    badgeBg: 'rgba(225, 29, 72, 0.28)',
    badgeBorder: 'rgba(244, 63, 94, 0.5)',
    iconName: 'PartyPopper',
    artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80', // party lights
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(225, 29, 72, 0.45) 0%, rgba(244, 63, 94, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'educational',
    label: 'Educational',
    matchKeys: ['educational', 'education', 'college', 'college events', 'campus', 'academic', 'lecture', 'university'],
    accent: '#6366F1',
    primary: '#4F46E5',
    deep: '#312E81',
    glow: 'rgba(99, 102, 241, 0.55)',
    borderGlow: 'rgba(99, 102, 241, 0.8)',
    tagline: 'Academic & Campus Experience',
    badgeBg: 'rgba(79, 70, 229, 0.28)',
    badgeBorder: 'rgba(99, 102, 241, 0.5)',
    iconName: 'GraduationCap',
    artworkUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80', // students campus
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(79, 70, 229, 0.45) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'workshop',
    label: 'Workshop',
    matchKeys: ['workshop', 'workshops', 'training', 'masterclass', 'bootcamp', 'hands-on'],
    accent: '#F59E0B',
    primary: '#D97706',
    deep: '#78350F',
    glow: 'rgba(245, 158, 11, 0.55)',
    borderGlow: 'rgba(245, 158, 11, 0.8)',
    tagline: 'Hands-on Interactive Workshop',
    badgeBg: 'rgba(217, 119, 6, 0.28)',
    badgeBorder: 'rgba(245, 158, 11, 0.5)',
    iconName: 'Cpu',
    artworkUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80', // modern workshop
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(217, 119, 6, 0.45) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'hackathon',
    label: 'Hackathons',
    matchKeys: ['hackathon', 'hackathons', 'coding', 'hack', 'code sprint', 'devfest'],
    accent: '#06B6D4',
    primary: '#0891B2',
    deep: '#164E63',
    glow: 'rgba(6, 182, 212, 0.55)',
    borderGlow: 'rgba(6, 182, 212, 0.8)',
    tagline: '24-Hour Code Sprint & Build',
    badgeBg: 'rgba(8, 145, 178, 0.28)',
    badgeBorder: 'rgba(6, 182, 212, 0.5)',
    iconName: 'Code',
    artworkUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80', // coding hackers
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(8, 145, 178, 0.45) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'sports',
    label: 'Sports',
    matchKeys: ['sports', 'sports events', 'tournament', 'esports', 'football', 'cricket', 'athletics'],
    accent: '#10B981',
    primary: '#059669',
    deep: '#064E3B',
    glow: 'rgba(16, 185, 129, 0.55)',
    borderGlow: 'rgba(16, 185, 129, 0.8)',
    tagline: 'Championship Arena Match',
    badgeBg: 'rgba(5, 150, 105, 0.28)',
    badgeBorder: 'rgba(16, 185, 129, 0.5)',
    iconName: 'Trophy',
    artworkUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80', // stadium stadium lights
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(5, 150, 105, 0.45) 0%, rgba(16, 185, 129, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'theatre',
    label: 'Theatre',
    matchKeys: ['theatre', 'theater', 'drama', 'cultural', 'cultural programs', 'play', 'acting'],
    accent: '#EC4899',
    primary: '#DB2777',
    deep: '#831843',
    glow: 'rgba(236, 72, 153, 0.55)',
    borderGlow: 'rgba(236, 72, 153, 0.8)',
    tagline: 'Live Drama & Stage Play',
    badgeBg: 'rgba(219, 39, 119, 0.28)',
    badgeBorder: 'rgba(236, 72, 153, 0.5)',
    iconName: 'Drama',
    artworkUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80', // stage theatre
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(219, 39, 119, 0.45) 0%, rgba(236, 72, 153, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'festivals',
    label: 'Festivals',
    matchKeys: ['festivals', 'festival', 'fest', 'techfest', 'waves', 'celebration'],
    accent: '#C084FC',
    primary: '#9333EA',
    deep: '#581C87',
    glow: 'rgba(192, 132, 252, 0.55)',
    borderGlow: 'rgba(192, 132, 252, 0.8)',
    tagline: 'Annual Campus Festival',
    badgeBg: 'rgba(147, 51, 234, 0.28)',
    badgeBorder: 'rgba(192, 132, 252, 0.5)',
    iconName: 'Sparkles',
    artworkUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80', // fest lights
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(147, 51, 234, 0.45) 0%, rgba(192, 132, 252, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'conferences',
    label: 'Conferences',
    matchKeys: ['conferences', 'conference', 'summit', 'keynote', 'leadership', 'symposium'],
    accent: '#38BDF8',
    primary: '#0284C7',
    deep: '#0C4A6E',
    glow: 'rgba(56, 189, 248, 0.55)',
    borderGlow: 'rgba(56, 189, 248, 0.8)',
    tagline: 'Keynote Summit & Leadership',
    badgeBg: 'rgba(2, 132, 199, 0.28)',
    badgeBorder: 'rgba(56, 189, 248, 0.5)',
    iconName: 'Mic',
    artworkUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80', // conference auditorium
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(2, 132, 199, 0.45) 0%, rgba(56, 189, 248, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'exhibitions',
    label: 'Exhibitions',
    matchKeys: ['exhibition', 'exhibitions', 'expo', 'gallery', 'art show', 'museum', 'showcase'],
    accent: '#F0ABFC',
    primary: '#D946EF',
    deep: '#701A75',
    glow: 'rgba(240, 171, 252, 0.55)',
    borderGlow: 'rgba(240, 171, 252, 0.8)',
    tagline: 'Creative Gallery & Exhibition Expo',
    badgeBg: 'rgba(217, 70, 239, 0.28)',
    badgeBorder: 'rgba(240, 171, 252, 0.5)',
    iconName: 'Palette',
    artworkUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&auto=format&fit=crop&q=80', // art gallery exhibition
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(217, 70, 239, 0.45) 0%, rgba(240, 171, 252, 0.2) 50%, transparent 75%)'
  },
  {
    id: 'seminars',
    label: 'Seminars',
    matchKeys: ['seminar', 'seminars', 'webinar', 'colloquium', 'panel', 'lecture series', 'presentation'],
    accent: '#60A5FA',
    primary: '#2563EB',
    deep: '#1E3A8A',
    glow: 'rgba(96, 165, 250, 0.55)',
    borderGlow: 'rgba(96, 165, 250, 0.8)',
    tagline: 'Professional Keynote Seminar',
    badgeBg: 'rgba(37, 99, 235, 0.28)',
    badgeBorder: 'rgba(96, 165, 250, 0.5)',
    iconName: 'BookOpen',
    artworkUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80', // keynote stage
    ambientGradient: 'radial-gradient(circle at 20% 40%, rgba(37, 99, 235, 0.45) 0%, rgba(96, 165, 250, 0.2) 50%, transparent 75%)'
  }
];

/**
 * Resolves the matching theme configuration for an event category or title.
 */
export function resolveTicketTheme(categoryName = '', eventTitle = '') {
  const normCategory = String(categoryName || '').trim().toLowerCase();
  const normTitle = String(eventTitle || '').trim().toLowerCase();

  // 1. Direct match on category matchKeys
  for (const theme of TICKET_CATEGORIES) {
    if (theme.matchKeys.some((k) => normCategory.includes(k))) {
      return theme;
    }
  }

  // 2. Title fallback match
  for (const theme of TICKET_CATEGORIES) {
    if (theme.matchKeys.some((k) => normTitle.includes(k))) {
      return theme;
    }
  }

  // Default to Concert / GetAPass Electric Violet theme
  return TICKET_CATEGORIES[0];
}

/**
 * Predefined Pass Tier Visual Styling (8 Predefined Types)
 * Automatically inherits distinct color accents, glowing borders, and tier badges.
 */
export const PASS_TYPE_THEMES = [
  {
    id: 'vip',
    label: 'VIP Pass',
    matchKeys: ['vip', 'gold', 'platinum', 'backstage', 'all-access', 'all access', 'patron'],
    accent: '#F59E0B', // Gold / Amber
    primary: '#D97706',
    deep: '#78350F',
    glow: 'rgba(245, 158, 11, 0.55)',
    borderGlow: 'rgba(245, 158, 11, 0.85)',
    badgeBg: 'rgba(245, 158, 11, 0.25)',
    badgeBorder: 'rgba(245, 158, 11, 0.65)',
    tag: 'VIP ACCESS',
    iconName: 'Crown'
  },
  {
    id: 'couple',
    label: 'Couple Pass',
    matchKeys: ['couple', 'duo', 'pair', 'two', 'romantic'],
    accent: '#F43F5E', // Rose / Violet
    primary: '#E11D48',
    deep: '#881337',
    glow: 'rgba(244, 63, 94, 0.55)',
    borderGlow: 'rgba(244, 63, 94, 0.85)',
    badgeBg: 'rgba(244, 63, 94, 0.25)',
    badgeBorder: 'rgba(244, 63, 94, 0.65)',
    tag: 'COUPLE ENTRY',
    iconName: 'Heart'
  },
  {
    id: 'group',
    label: 'Group Pass',
    matchKeys: ['group', 'squad', 'team', 'crew', 'delegation'],
    accent: '#3B82F6', // Blue / Violet
    primary: '#2563EB',
    deep: '#1E3A8A',
    glow: 'rgba(59, 130, 246, 0.55)',
    borderGlow: 'rgba(59, 130, 246, 0.85)',
    badgeBg: 'rgba(59, 130, 246, 0.25)',
    badgeBorder: 'rgba(59, 130, 246, 0.65)',
    tag: 'GROUP PASS',
    iconName: 'Users'
  },
  {
    id: 'student',
    label: 'Student Pass',
    matchKeys: ['student', 'campus', 'scholar', 'academic', 'college'],
    accent: '#6366F1', // Indigo / Violet
    primary: '#4F46E5',
    deep: '#312E81',
    glow: 'rgba(99, 102, 241, 0.55)',
    borderGlow: 'rgba(99, 102, 241, 0.85)',
    badgeBg: 'rgba(99, 102, 241, 0.25)',
    badgeBorder: 'rgba(99, 102, 241, 0.65)',
    tag: 'STUDENT PASS',
    iconName: 'GraduationCap'
  },
  {
    id: 'early-bird',
    label: 'Early Bird Pass',
    matchKeys: ['early', 'early bird', 'early-bird', 'presale', 'discount'],
    accent: '#10B981', // Emerald
    primary: '#059669',
    deep: '#064E3B',
    glow: 'rgba(16, 185, 129, 0.55)',
    borderGlow: 'rgba(16, 185, 129, 0.85)',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
    badgeBorder: 'rgba(16, 185, 129, 0.65)',
    tag: 'EARLY BIRD',
    iconName: 'Zap'
  },
  {
    id: 'workshop',
    label: 'Workshop Pass',
    matchKeys: ['workshop', 'hands-on', 'lab', 'training', 'masterclass'],
    accent: '#F97316', // Amber / Orange
    primary: '#EA580C',
    deep: '#7C2D12',
    glow: 'rgba(249, 115, 22, 0.55)',
    borderGlow: 'rgba(249, 115, 22, 0.85)',
    badgeBg: 'rgba(249, 115, 22, 0.25)',
    badgeBorder: 'rgba(249, 115, 22, 0.65)',
    tag: 'WORKSHOP ACCESS',
    iconName: 'Cpu'
  },
  {
    id: 'general',
    label: 'General Admission Pass',
    matchKeys: ['general', 'ga', 'general admission', 'standard', 'entry', 'regular'],
    accent: '#A855F7', // Classic Electric Violet
    primary: '#7C3AED',
    deep: '#4C1D95',
    glow: 'rgba(168, 85, 247, 0.55)',
    borderGlow: 'rgba(168, 85, 247, 0.85)',
    badgeBg: 'rgba(124, 58, 237, 0.28)',
    badgeBorder: 'rgba(168, 85, 247, 0.55)',
    tag: 'GENERAL ADMISSION',
    iconName: 'Ticket'
  },
  {
    id: 'participant',
    label: 'Participant Pass',
    matchKeys: ['participant', 'attendee', 'delegate', 'guest', 'holder'],
    accent: '#8B5CF6', // Electric Violet
    primary: '#7C3AED',
    deep: '#4C1D95',
    glow: 'rgba(139, 92, 246, 0.55)',
    borderGlow: 'rgba(139, 92, 246, 0.85)',
    badgeBg: 'rgba(124, 58, 237, 0.25)',
    badgeBorder: 'rgba(139, 92, 246, 0.55)',
    tag: 'PARTICIPANT PASS',
    iconName: 'Sparkles'
  }
];

/**
 * Resolves the predefined pass tier visual styling for any pass type name.
 */
export function resolvePassTypeTheme(passTypeName = '') {
  const norm = String(passTypeName || '').trim().toLowerCase();
  for (const tier of PASS_TYPE_THEMES) {
    if (tier.matchKeys.some((k) => norm.includes(k))) {
      return tier;
    }
  }
  return PASS_TYPE_THEMES[6]; // General Admission default
}

