/**
 * GetApass — Pass Templates & Dynamic Fields Engine
 * Predefined System Templates, 900x1400 Canvas Coordinate System,
 * Curated Typography, Freely Movable Layered Elements, and Dynamic Tokens.
 */

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 1400;

export const SUPPORTED_FONTS = [
  'Inter',
  'Manrope',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Playfair Display'
];

export const TEMPLATE_CATEGORIES = [
  'All',
  'College',
  'Conference',
  'Workshop',
  'Hackathon',
  'Festival',
  'Sports',
  'Cultural',
  'VIP',
  'General',
  'Custom'
];

export const DYNAMIC_FIELD_TOKENS = [
  { token: '{{event.name}}', label: 'Event Name', category: 'EVENT', example: 'TechFest 2026' },
  { token: '{{event.category}}', label: 'Event Category', category: 'EVENT', example: 'Hackathon' },
  { token: '{{event.date}}', label: 'Event Date', category: 'EVENT', example: '15 October 2026' },
  { token: '{{event.time}}', label: 'Event Time', category: 'EVENT', example: '10:00 AM – 8:00 PM' },
  { token: '{{event.venue}}', label: 'Venue Location', category: 'EVENT', example: 'Zeal College, Pune' },
  { token: '{{participant.name}}', label: 'Participant Name', category: 'PARTICIPANT', example: 'Aarav Shah' },
  { token: '{{participant.email}}', label: 'Participant Email', category: 'PARTICIPANT', example: 'aarav@campus.edu' },
  { token: '{{participant.phone}}', label: 'Participant Phone', category: 'PARTICIPANT', example: '+91 98765 43210' },
  { token: '{{pass.id}}', label: 'Pass ID', category: 'PASS', example: 'GP-PASS-1024' },
  { token: '{{pass.type}}', label: 'Pass Type', category: 'PASS', example: 'VIP Pass' },
  { token: '{{pass.authority}}', label: 'Authority', category: 'PASS', example: 'VIP' },
  { token: '{{pass.status}}', label: 'Pass Status', category: 'PASS', example: 'Active' },
  { token: '{{pass.accessAreas}}', label: 'Access Clearance Areas', category: 'ACCESS', example: 'General Area, VIP Area, Backstage' },
  { token: '{{pass.qrCode}}', label: 'QR Code Identifier', category: 'QR', example: '[Gate Verification Token]' }
];

export const GATEAPASS_COLOR_PALETTES = [
  {
    id: 'gateapass-violet',
    name: 'GetApass Violet',
    theme: {
      background: '#FFFFFF',
      headerBg: '#0A0A0D',
      headerText: '#FFFFFF',
      accentColor: '#AC58E9',
      deepAccent: '#7C2CCB',
      textColor: '#0A0A0D',
      mutedText: '#666666',
      borderColor: '#E8E8E8',
      cardBg: '#FFFFFF',
      qrFrameBg: '#FFFFFF',
      qrFrameBorder: '#E8E8E8',
      badgeBg: '#EBDDFA',
      badgeText: '#7C2CCB'
    }
  },
  {
    id: 'classic-black',
    name: 'Classic Black',
    theme: {
      background: '#0A0A0D',
      headerBg: '#000000',
      headerText: '#FFFFFF',
      accentColor: '#AC58E9',
      deepAccent: '#9B45D8',
      textColor: '#FFFFFF',
      mutedText: '#999999',
      borderColor: '#26262B',
      cardBg: '#111116',
      qrFrameBg: '#FFFFFF',
      qrFrameBorder: '#26262B',
      badgeBg: '#1F142B',
      badgeText: '#EBDDFA'
    }
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    theme: {
      background: '#FFFFFF',
      headerBg: '#FFFFFF',
      headerText: '#0A0A0D',
      accentColor: '#0A0A0D',
      deepAccent: '#222222',
      textColor: '#0A0A0D',
      mutedText: '#666666',
      borderColor: '#000000',
      cardBg: '#FFFFFF',
      qrFrameBg: '#FFFFFF',
      qrFrameBorder: '#000000',
      badgeBg: '#F0F0F0',
      badgeText: '#0A0A0D'
    }
  },
  {
    id: 'vip-dark',
    name: 'VIP Obsidian',
    theme: {
      background: '#0D0914',
      headerBg: '#050308',
      headerText: '#EBDDFA',
      accentColor: '#C084FC',
      deepAccent: '#7C2CCB',
      textColor: '#FFFFFF',
      mutedText: '#A8A29E',
      borderColor: '#3B1D54',
      cardBg: '#130C1C',
      qrFrameBg: '#FFFFFF',
      qrFrameBorder: '#7C2CCB',
      badgeBg: '#4A1D6D',
      badgeText: '#F3E8FF'
    }
  },
  {
    id: 'festival-amber',
    name: 'Festival Pulse',
    theme: {
      background: '#FFFFFF',
      headerBg: '#0A0A0D',
      headerText: '#FFFFFF',
      accentColor: '#D97706',
      deepAccent: '#B45309',
      textColor: '#0A0A0D',
      mutedText: '#78716C',
      borderColor: '#E7E5E4',
      cardBg: '#FFFFFF',
      qrFrameBg: '#FFFBEB',
      qrFrameBorder: '#FDE68A',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E'
    }
  },
  {
    id: 'hackathon-terminal',
    name: 'Hackathon Cyber',
    theme: {
      background: '#090D16',
      headerBg: '#030712',
      headerText: '#38BDF8',
      accentColor: '#0284C7',
      deepAccent: '#0369A1',
      textColor: '#F8FAFC',
      mutedText: '#94A3B8',
      borderColor: '#1E293B',
      cardBg: '#0F172A',
      qrFrameBg: '#FFFFFF',
      qrFrameBorder: '#38BDF8',
      badgeBg: '#0C4A6E',
      badgeText: '#E0F2FE'
    }
  }
];

/**
 * Creates standard 900x1400 canvas elements with x, y, width, height, font, and zIndex.
 */
export function createDefaultElements(theme = GATEAPASS_COLOR_PALETTES[0].theme) {
  return [
    {
      id: 'brand-header',
      type: 'branding',
      title: 'Top Brand Bar',
      brandText: 'GetApass',
      subText: 'Digital Pass',
      showLogo: true,
      x: 50,
      y: 50,
      width: 800,
      height: 70,
      zIndex: 1,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 700,
      color: theme.headerText || '#FFFFFF',
      backgroundColor: theme.headerBg || '#0A0A0D',
      visible: true
    },
    {
      id: 'pass-header-row',
      type: 'headerRow',
      title: 'Pass Type & Status Row',
      showPassType: true,
      showStatus: true,
      x: 50,
      y: 150,
      width: 800,
      height: 60,
      zIndex: 2,
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 700,
      visible: true
    },
    {
      id: 'event-name',
      type: 'dynamicText',
      title: 'Event Name',
      field: '{{event.name}}',
      x: 50,
      y: 230,
      width: 800,
      height: 90,
      zIndex: 3,
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 800,
      fontStyle: 'normal',
      textAlign: 'left',
      letterSpacing: -0.5,
      color: theme.textColor || '#0A0A0D',
      visible: true
    },
    {
      id: 'event-meta',
      type: 'dynamicText',
      title: 'Date & Venue Schedule',
      field: '{{event.date}} · {{event.time}} · {{event.venue}}',
      x: 50,
      y: 330,
      width: 800,
      height: 60,
      zIndex: 4,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 500,
      fontStyle: 'normal',
      textAlign: 'left',
      color: theme.mutedText || '#666666',
      visible: true
    },
    {
      id: 'divider-1',
      type: 'divider',
      title: 'Divider Line',
      x: 50,
      y: 410,
      width: 800,
      height: 2,
      zIndex: 5,
      color: theme.borderColor || '#E8E8E8',
      visible: true
    },
    {
      id: 'participant-name',
      type: 'dynamicText',
      title: 'Participant Name',
      field: '{{participant.name}}',
      x: 50,
      y: 440,
      width: 800,
      height: 70,
      zIndex: 6,
      fontFamily: 'Inter',
      fontSize: 38,
      fontWeight: 700,
      fontStyle: 'normal',
      textAlign: 'left',
      color: theme.textColor || '#0A0A0D',
      visible: true
    },
    {
      id: 'attendee-ledger',
      type: 'detailsGrid',
      title: 'Pass ID & Authority Ledger',
      fields: [
        { key: 'passId', label: 'Pass ID', value: '{{pass.id}}', isHighlight: true },
        { key: 'authority', label: 'Authority', value: '{{pass.authority}}' },
        { key: 'status', label: 'Status', value: '{{pass.status}}' },
        { key: 'venue', label: 'Venue', value: '{{event.venue}}' }
      ],
      x: 50,
      y: 530,
      width: 800,
      height: 120,
      zIndex: 7,
      fontFamily: 'Inter',
      fontSize: 22,
      color: theme.textColor || '#0A0A0D',
      visible: true
    },
    {
      id: 'qr-code',
      type: 'qr',
      title: 'Verification QR Code',
      x: 275,
      y: 680,
      width: 350,
      height: 350,
      size: 280,
      caption: 'GATE VERIFIED · SECURE PASS',
      zIndex: 8,
      frameBg: theme.qrFrameBg || '#FFFFFF',
      frameBorder: theme.qrFrameBorder || '#E8E8E8',
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      visible: true
    },
    {
      id: 'access-zones',
      type: 'accessTags',
      title: 'Access Zones & Badges',
      field: '{{pass.accessAreas}}',
      x: 50,
      y: 1070,
      width: 800,
      height: 80,
      zIndex: 9,
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: 600,
      visible: true
    },
    {
      id: 'guidelines-footer',
      type: 'footerNotes',
      title: 'Guidelines & Instructions',
      content: 'Official digital admission pass. Present QR code at turnstile for optical verification. Non-transferable ticket.',
      x: 50,
      y: 1180,
      width: 800,
      height: 160,
      zIndex: 10,
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 400,
      textAlign: 'center',
      color: theme.mutedText || '#888888',
      visible: true
    }
  ];
}

export const DEFAULT_TEMPLATE_ELEMENTS = createDefaultElements();

/**
 * 10 Predefined System Pass Templates with 900x1400 coordinates and themes
 */
export const PREDEFINED_SYSTEM_TEMPLATES = [
  {
    id: 'tpl-classic-black',
    name: 'Classic Black',
    description: 'Sleek dark mode pass with near-black finish and violet accents.',
    category: 'General',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#0A0A0D',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'classic-black').theme,
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'modern' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'classic-black').theme)
  },
  {
    id: 'tpl-classic-violet',
    name: 'Classic Violet',
    description: 'The signature GetApass pass with bold black header and violet badge accents.',
    category: 'General',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'modern' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme)
  },
  {
    id: 'tpl-minimal-white',
    name: 'Minimal White',
    description: 'Ultra-clean monochrome editorial ticket with high legibility.',
    category: 'General',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'minimal-white').theme,
    layout: { width: 900, height: 1400, borderRadius: 4, borderWidth: 2, style: 'editorial' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'minimal-white').theme)
  },
  {
    id: 'tpl-vip-dark',
    name: 'VIP Dark Obsidian',
    description: 'Premium dark pass tailored for VIP access, speakers, and dignitaries.',
    category: 'VIP',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#0D0914',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'vip-dark').theme,
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'luxury' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'vip-dark').theme)
  },
  {
    id: 'tpl-festival',
    name: 'Festival Pulse',
    description: 'High-energy ticket with warm festival badges and celebration zoning.',
    category: 'Festival',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'festival-amber').theme,
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'festive' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'festival-amber').theme)
  },
  {
    id: 'tpl-conference',
    name: 'Conference Delegate',
    description: 'Formal conference accreditation layout with professional credentials.',
    category: 'Conference',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: {
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      badgeBg: '#F3F4F6',
      badgeText: '#1F2937'
    },
    layout: { width: 900, height: 1400, borderRadius: 6, borderWidth: 1, style: 'corporate' },
    elements: createDefaultElements({
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      badgeBg: '#F3F4F6',
      badgeText: '#1F2937'
    })
  },
  {
    id: 'tpl-workshop',
    name: 'Workshop & Lab',
    description: 'Interactive pass with laboratory badges and equipment access zones.',
    category: 'Workshop',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: {
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      accentColor: '#2563EB',
      deepAccent: '#1D4ED8',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF'
    },
    layout: { width: 900, height: 1400, borderRadius: 6, borderWidth: 1, style: 'compact' },
    elements: createDefaultElements({
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      accentColor: '#2563EB',
      deepAccent: '#1D4ED8',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF'
    })
  },
  {
    id: 'tpl-hackathon',
    name: 'Hackathon Cyber',
    description: 'Developer pass with terminal layout and 36-hour sprint badge styling.',
    category: 'Hackathon',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#090D16',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'hackathon-terminal').theme,
    layout: { width: 900, height: 1400, borderRadius: 4, borderWidth: 1, style: 'cyber' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'hackathon-terminal').theme)
  },
  {
    id: 'tpl-sports',
    name: 'Sports Arena',
    description: 'Stadium and athletic tournament pass with stand and gate highlights.',
    category: 'Sports',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: {
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      accentColor: '#16A34A',
      deepAccent: '#15803D',
      badgeBg: '#DCFCE7',
      badgeText: '#166534'
    },
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'stadium' },
    elements: createDefaultElements({
      ...GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
      accentColor: '#16A34A',
      deepAccent: '#15803D',
      badgeBg: '#DCFCE7',
      badgeText: '#166534'
    })
  },
  {
    id: 'tpl-college-event',
    name: 'College Campus Event',
    description: 'Academic institution pass format with campus roll and department lines.',
    category: 'College',
    isSystemTemplate: true,
    status: 'Published',
    currentVersion: 1,
    background: {
      color: '#FFFFFF',
      image: '',
      imageOpacity: 1,
      fit: 'cover',
      position: 'center'
    },
    theme: GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme,
    layout: { width: 900, height: 1400, borderRadius: 8, borderWidth: 1, style: 'academic' },
    elements: createDefaultElements(GATEAPASS_COLOR_PALETTES.find((p) => p.id === 'gateapass-violet').theme)
  }
];

export const SAMPLE_PASS_DATA = {
  event: {
    id: 'evt-campus-2026',
    name: 'Campus Event',
    title: 'Campus Event',
    category: 'Hackathons',
    date: '15 October 2026',
    time: '10:00 AM – 8:00 PM',
    venue: 'Campus Auditorium'
  },
  participant: {
    name: 'Pass Holder',
    email: 'attendee@campus.edu',
    phone: '+91 90000 00000'
  },
  pass: {
    id: 'GP-PASS-0001',
    type: 'Standard Pass',
    authority: 'Participant',
    gate: 'Gate A',
    status: 'Active',
    price: 499,
    paymentMethod: 'UPI',
    accessAreas: ['General Area']
  }
};

/**
 * Safe Dynamic Field Resolver
 */
export function resolveDynamicValue(token, context = SAMPLE_PASS_DATA) {
  if (!token) return '';

  const clean = token.replace(/[{}]/g, '').trim();
  const parts = clean.split('.');

  if (parts.length === 2) {
    const [domain, key] = parts;
    if (context[domain] && context[domain][key] !== undefined) {
      const val = context[domain][key];
      if (Array.isArray(val)) {
        return val.join(', ');
      }
      return String(val);
    }
  }

  if (clean === 'event.name' || clean === 'event.title') return context.event?.name || context.event?.title || 'Event Name';
  if (clean === 'participant.name') return context.participant?.name || 'Attendee Name';
  if (clean === 'pass.id') return context.pass?.id || 'GP-PASS-0000';
  if (clean === 'pass.type') return context.pass?.type || 'Participant Pass';
  if (clean === 'pass.authority') return context.pass?.authority || 'Participant';
  if (clean === 'pass.status') return context.pass?.status || 'Active';
  if (clean === 'event.date') return context.event?.date || 'Event Date';
  if (clean === 'event.time') return context.event?.time || 'Event Time';
  if (clean === 'event.venue') return context.event?.venue || 'Campus Venue';
  if (clean === 'pass.gate') return context.pass?.gate || 'Gate A';
  if (clean === 'pass.accessAreas') {
    const areas = context.pass?.accessAreas;
    return Array.isArray(areas) ? areas.join(', ') : areas || 'General Area';
  }

  return token;
}

export function resolveDynamicString(templateString, context = SAMPLE_PASS_DATA) {
  if (!templateString || typeof templateString !== 'string') return '';
  return templateString.replace(/\{\{([^{}]+)\}\}/g, (match) => {
    return resolveDynamicValue(match, context);
  });
}

const TEMPLATE_STORAGE_KEY = 'gateapass_custom_pass_templates_v2';
const memoryTemplateStore = {};

function getStoredCustomTemplates() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } else if (memoryTemplateStore[TEMPLATE_STORAGE_KEY]) {
      return JSON.parse(memoryTemplateStore[TEMPLATE_STORAGE_KEY]);
    }
  } catch {
    // fallback
  }
  return [];
}

function setStoredCustomTemplates(templates) {
  const json = JSON.stringify(templates);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, json);
      window.dispatchEvent(new CustomEvent('gateapass_templates_changed', { detail: templates }));
    } else {
      memoryTemplateStore[TEMPLATE_STORAGE_KEY] = json;
    }
  } catch {
    // ignore
  }
}

export function getAllTemplates() {
  const custom = getStoredCustomTemplates();
  return [...PREDEFINED_SYSTEM_TEMPLATES, ...custom];
}

export function getTemplateById(templateId) {
  const all = getAllTemplates();
  return all.find((t) => t.id === templateId) || PREDEFINED_SYSTEM_TEMPLATES[0];
}

/**
 * Save custom template to persistent library
 */
export function saveCustomTemplate(template) {
  if (!template || !template.id) return null;
  if (template.isSystemTemplate) {
    throw new Error('System templates cannot be overwritten. Please duplicate to edit.');
  }

  const existingAll = getStoredCustomTemplates();
  const index = existingAll.findIndex((t) => t.id === template.id);

  let updated;
  if (index >= 0) {
    updated = existingAll.map((t) => (t.id === template.id ? { ...template, updatedAt: Date.now() } : t));
  } else {
    updated = [{ ...template, createdAt: Date.now(), updatedAt: Date.now() }, ...existingAll];
  }

  setStoredCustomTemplates(updated);
  return template;
}

/**
 * Duplicate a template
 */
export function duplicateTemplate(sourceTemplate, customName = '') {
  if (!sourceTemplate) return null;

  const newId = `tpl-custom-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const duplicate = {
    ...JSON.parse(JSON.stringify(sourceTemplate)),
    id: newId,
    name: customName || `${sourceTemplate.name} (Copy)`,
    isSystemTemplate: false,
    status: 'Draft',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        status: 'Draft',
        createdAt: Date.now(),
        theme: JSON.parse(JSON.stringify(sourceTemplate.theme || {})),
        background: JSON.parse(JSON.stringify(sourceTemplate.background || { color: '#0A0A0D' })),
        layout: JSON.parse(JSON.stringify(sourceTemplate.layout || {})),
        elements: JSON.parse(JSON.stringify(sourceTemplate.elements || []))
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveCustomTemplate(duplicate);
  return duplicate;
}

/**
 * Create a new custom template
 */
export function createCustomTemplate({ name, description, category, baseTemplateId }) {
  const base = getTemplateById(baseTemplateId) || PREDEFINED_SYSTEM_TEMPLATES[0];
  const newId = `tpl-custom-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newTemplate = {
    id: newId,
    name: name || 'Untitled Custom Pass',
    description: description || 'Custom event pass template created in Template Editor.',
    category: category || 'Custom',
    isSystemTemplate: false,
    status: 'Draft',
    currentVersion: 1,
    background: JSON.parse(JSON.stringify(base.background || { color: '#FFFFFF', image: '', imageOpacity: 1, fit: 'cover', position: 'center' })),
    theme: JSON.parse(JSON.stringify(base.theme || {})),
    layout: JSON.parse(JSON.stringify(base.layout || { width: 900, height: 1400, borderRadius: 8, borderWidth: 1 })),
    elements: JSON.parse(JSON.stringify(base.elements || createDefaultElements())),
    versions: [
      {
        version: 1,
        status: 'Draft',
        createdAt: Date.now(),
        theme: JSON.parse(JSON.stringify(base.theme || {})),
        background: JSON.parse(JSON.stringify(base.background || {})),
        layout: JSON.parse(JSON.stringify(base.layout || {})),
        elements: JSON.parse(JSON.stringify(base.elements || []))
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveCustomTemplate(newTemplate);
  return newTemplate;
}

export function deleteCustomTemplate(templateId) {
  const tpl = getTemplateById(templateId);
  if (!tpl || tpl.isSystemTemplate) return false;

  const existingAll = getStoredCustomTemplates();
  const filtered = existingAll.filter((t) => t.id !== templateId);
  setStoredCustomTemplates(filtered);
  return true;
}

/**
 * Publish a template with version incrementing if already published
 */
export function publishTemplate(template) {
  if (!template) return null;

  let toPublish = template;
  if (template.isSystemTemplate) {
    toPublish = duplicateTemplate(template, `${template.name} (Custom)`);
  }

  const prevVersion = toPublish.currentVersion || 1;
  const isAlreadyPublished = toPublish.status === 'Published';
  const nextVersion = isAlreadyPublished ? prevVersion + 1 : prevVersion;

  const versionSnapshot = {
    version: nextVersion,
    status: 'Published',
    publishedAt: Date.now(),
    theme: JSON.parse(JSON.stringify(toPublish.theme || {})),
    background: JSON.parse(JSON.stringify(toPublish.background || {})),
    layout: JSON.parse(JSON.stringify(toPublish.layout || {})),
    elements: JSON.parse(JSON.stringify(toPublish.elements || []))
  };

  const existingVersions = Array.isArray(toPublish.versions) ? toPublish.versions : [];
  const updatedVersions = [...existingVersions.filter((v) => v.version !== nextVersion), versionSnapshot];

  const published = {
    ...toPublish,
    status: 'Published',
    currentVersion: nextVersion,
    isSystemTemplate: false,
    versions: updatedVersions,
    updatedAt: Date.now()
  };

  saveCustomTemplate(published);
  return published;
}

/**
 * Validate required fields before publish:
 * Must have: Event Name, Participant Name, Pass Type, Pass ID, Date, Venue, QR Code.
 */
export function validateTemplateForPublish(template) {
  const errors = [];
  const warnings = [];

  if (!template.name || !template.name.trim()) {
    errors.push('Template name is required.');
  }

  const elements = template.elements || [];

  const hasEventName = elements.some((e) => (e.field?.includes('event.name') || e.id === 'event-name') && e.visible);
  if (!hasEventName) {
    errors.push('Required field missing: Event Name ({{event.name}}).');
  }

  const hasParticipantName = elements.some((e) => (e.field?.includes('participant.name') || e.id === 'participant-name') && e.visible);
  if (!hasParticipantName) {
    errors.push('Required field missing: Participant Name ({{participant.name}}).');
  }

  const hasPassType = elements.some((e) => (e.field?.includes('pass.type') || e.showPassType || e.id === 'pass-header-row') && e.visible);
  if (!hasPassType) {
    errors.push('Required field missing: Pass Type ({{pass.type}}).');
  }

  const hasPassId = elements.some((e) => (e.field?.includes('pass.id') || e.type === 'detailsGrid') && e.visible);
  if (!hasPassId) {
    errors.push('Required field missing: Pass ID ({{pass.id}}).');
  }

  const hasDate = elements.some((e) => (e.field?.includes('event.date') || e.id === 'event-meta') && e.visible);
  if (!hasDate) {
    errors.push('Required field missing: Event Date ({{event.date}}).');
  }

  const hasVenue = elements.some((e) => (e.field?.includes('event.venue') || e.id === 'event-meta' || e.type === 'detailsGrid') && e.visible);
  if (!hasVenue) {
    errors.push('Required field missing: Venue ({{event.venue}}).');
  }

  const hasQr = elements.some((e) => e.type === 'qr' && e.visible);
  if (!hasQr) {
    errors.push('Required field missing: Optical QR Code verification element.');
  }

  // Check if any image overlaps with QR code
  const qrElement = elements.find((e) => e.type === 'qr' && e.visible);
  if (qrElement) {
    const overlappingImages = elements.filter((el) => {
      if (el.type !== 'image' || !el.visible) return false;
      const elZ = el.zIndex || 0;
      const qrZ = qrElement.zIndex || 0;
      if (elZ <= qrZ) return false;
      // bounding box overlap
      const xOverlap = Math.max(0, Math.min(el.x + el.width, qrElement.x + qrElement.width) - Math.max(el.x, qrElement.x));
      const yOverlap = Math.max(0, Math.min(el.y + el.height, qrElement.y + qrElement.height) - Math.max(el.y, qrElement.y));
      return xOverlap > 0 && yOverlap > 0;
    });

    if (overlappingImages.length > 0) {
      warnings.push('Warning: An image layer is positioned above the verification QR code. This may block turnstile scanning.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
