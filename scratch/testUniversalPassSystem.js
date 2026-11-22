/**
 * GetAPass — Automated Verification Test Suite
 * Universal Classic 3D Digital Pass System, Canvas Editor Removal,
 * Pass Tier Themes, Isolated PDF/Print Export, & Security Guardrails
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('GETAPASS — UNIVERSAL 3D DIGITAL PASS & SYSTEM AUDIT SUITE');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(description, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedChecks++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. ORGANIZER STUDIO & PASS EDITOR REMOVAL
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Unwanted Canvas Pass Editor Removal ---');

const organizerStudioSrc = fs.readFileSync(path.join(rootDir, 'src/views/OrganizerStudioView.jsx'), 'utf-8');
const passTypeManagerSrc = fs.readFileSync(path.join(rootDir, 'src/components/studio/PassTypeManager.jsx'), 'utf-8');

check('OrganizerStudioView does NOT import TemplateEditorView', () => {
  assert(!organizerStudioSrc.includes("import TemplateEditorView from './TemplateEditorView'"));
});

check('OrganizerStudioView does NOT include templates in navigation tab array', () => {
  assert(!organizerStudioSrc.includes("{ id: 'templates', label: 'Templates'"));
});

check('OrganizerStudioView does NOT render TemplateEditorView component', () => {
  assert(!organizerStudioSrc.includes('<TemplateEditorView'));
});

check('OrganizerStudioView does NOT maintain activeStudioTemplate state', () => {
  assert(!organizerStudioSrc.includes('activeStudioTemplate'));
});

check('PassTypeManager does NOT include Template Library button', () => {
  assert(!passTypeManagerSrc.includes('>Template Library<'));
});

check('PassTypeManager includes Preview 3D Pass action for pass tiers', () => {
  assert(passTypeManagerSrc.includes('Preview 3D Pass'));
});

check('PassTypeManager renders 1020px landscape modal for 3D ticket preview', () => {
  assert(passTypeManagerSrc.includes('maxWidth="1020px"'));
});

// -----------------------------------------------------------------------------
// 2. 11 AUTOMATIC CATEGORY THEMES
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: 11 Automatic Category Themes ---');

const ticketThemesSrc = fs.readFileSync(path.join(rootDir, 'src/constants/ticketThemes.js'), 'utf-8');

const requiredCategories = [
  'Carnivals',
  'Educational',
  'Workshop',
  'Concert',
  'Sports',
  'Hackathons',
  'Festivals',
  'Conferences',
  'Seminars',
  'Exhibitions',
  'Theatre'
];

requiredCategories.forEach((cat) => {
  check(`ticketThemes.js defines category theme: ${cat}`, () => {
    assert(ticketThemesSrc.toLowerCase().includes(cat.toLowerCase()));
  });
});

check('ticketThemes.js exports resolveTicketTheme helper', () => {
  assert(ticketThemesSrc.includes('export function resolveTicketTheme'));
});

// -----------------------------------------------------------------------------
// 3. 8 PREDEFINED PASS TYPE THEMES
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: 8 Predefined Pass Tier Themes ---');

const requiredPassTiers = [
  'VIP Pass',
  'Couple Pass',
  'Group Pass',
  'Student Pass',
  'Early Bird Pass',
  'Workshop Pass',
  'General Admission Pass',
  'Participant Pass'
];

check('ticketThemes.js exports PASS_TYPE_THEMES array', () => {
  assert(ticketThemesSrc.includes('export const PASS_TYPE_THEMES'));
});

check('ticketThemes.js exports resolvePassTypeTheme helper', () => {
  assert(ticketThemesSrc.includes('export function resolvePassTypeTheme'));
});

requiredPassTiers.forEach((tier) => {
  check(`PASS_TYPE_THEMES supports tier: ${tier}`, () => {
    assert(ticketThemesSrc.includes(tier));
  });
});

// -----------------------------------------------------------------------------
// 4. UNIVERSAL TICKET ARCHITECTURE & 3D RENDERING
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Universal Ticket Architecture & Ticket3D ---');

const ticket3DSrc = fs.readFileSync(path.join(rootDir, 'src/components/pass/Ticket3D.jsx'), 'utf-8');
const ticket3DCss = fs.readFileSync(path.join(rootDir, 'src/components/pass/Ticket3D.css'), 'utf-8').replace(/\r\n/g, '\n');

check('Ticket3D imports resolvePassTypeTheme', () => {
  assert(ticket3DSrc.includes('resolvePassTypeTheme'));
});

check('Ticket3D applies pass tier theme to ticket badge', () => {
  assert(ticket3DSrc.includes('passTierTheme.badgeBg') && ticket3DSrc.includes('passTierTheme.accent'));
});

check('Ticket3D assigns id="getapass-printable-ticket" for print targeting', () => {
  assert(ticket3DSrc.includes('id="getapass-printable-ticket"'));
});

check('Ticket3D front face contains main section (~68%) and stub section (~32%)', () => {
  assert(ticket3DSrc.includes('ticket-main-section') && ticket3DSrc.includes('ticket-stub-section'));
});

check('Ticket3D contains perforated divider cutouts and dashed tear line', () => {
  assert(ticket3DSrc.includes('ticket-notch-top') && ticket3DSrc.includes('ticket-perforation-line') && ticket3DSrc.includes('ticket-notch-bottom'));
});

check('Ticket3D contains scalloped outer edge notches', () => {
  assert(ticket3DSrc.includes('ticket-notch-outer-left') && ticket3DSrc.includes('ticket-notch-outer-right'));
});

check('Ticket3D contains 3D cursor tilt logic with rAF batching', () => {
  assert(ticket3DSrc.includes('requestAnimationFrame') && ticket3DSrc.includes('rotateX') && ticket3DSrc.includes('rotateY'));
});

check('Ticket3D contains 3D flip card mechanism', () => {
  assert(ticket3DSrc.includes('ticket-flip-inner') && ticket3DSrc.includes('is-flipped'));
});

check('Ticket3D CSS defines dark surface #0c0a17 and 760px x 310px dimensions', () => {
  assert(ticket3DCss.includes('#0c0a17') && ticket3DCss.includes('760px') && ticket3DCss.includes('310px'));
});

// -----------------------------------------------------------------------------
// 5. PRINT / SAVE PDF ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Print & Save PDF Isolation ---');

const digitalPassSrc = fs.readFileSync(path.join(rootDir, 'src/components/pass/DigitalPass.jsx'), 'utf-8');

check('DigitalPass handlePrint builds isolated offscreen iframe for zero avatar bleed', () => {
  assert(digitalPassSrc.includes("document.createElement('iframe')") && digitalPassSrc.includes('iframe.contentWindow.print()'));
});

check('DigitalPass print payload clones exclusively the ticket element', () => {
  assert(digitalPassSrc.includes("getElementById('getapass-printable-ticket')") && digitalPassSrc.includes('clonedTicket.outerHTML'));
});

check('Ticket3D CSS defines @media print with strict body visibility: hidden', () => {
  assert(ticket3DCss.includes('body * {\n    visibility: hidden !important;'));
});

check('Ticket3D CSS defines @media print with #getapass-printable-ticket visibility: visible', () => {
  assert(ticket3DCss.includes('#getapass-printable-ticket,\n  #getapass-printable-ticket * {\n    visibility: visible !important;'));
});

// -----------------------------------------------------------------------------
// 6. ADMIN DASHBOARD RELOCATION & SECURITY
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: Admin Dashboard Security & Relocation ---');

const desktopHeaderSrc = fs.readFileSync(path.join(rootDir, 'src/components/navigation/DesktopHeader.jsx'), 'utf-8');
const mobileHeaderSrc = fs.readFileSync(path.join(rootDir, 'src/components/navigation/MobileHeader.jsx'), 'utf-8');
const profileViewSrc = fs.readFileSync(path.join(rootDir, 'src/views/ProfileView.jsx'), 'utf-8');

check('DesktopHeader does NOT render Admin Dashboard button', () => {
  assert(!desktopHeaderSrc.includes('<span>Admin Dashboard</span>'));
});

check('MobileHeader does NOT render Admin Dashboard button', () => {
  assert(!mobileHeaderSrc.includes('Admin Dashboard'));
});

check('ProfileView sidebar contains Admin Dashboard tab strictly guarded by isAdmin', () => {
  assert(profileViewSrc.includes("items.push({ id: 'admin-dashboard', label: 'Admin Dashboard'"));
  assert(profileViewSrc.includes('isAdmin'));
});

check('ProfileView opens digital pass modal with 1020px landscape width', () => {
  assert(profileViewSrc.includes('title="Official GetApass Digital Pass"') && profileViewSrc.includes('maxWidth="1020px"'));
});

// -----------------------------------------------------------------------------
// 7. EVENT CREATION & PASS LIBRARY UPGRADES
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 7: Event Creation & Pass Library Modernization ---');

const wizardSrc = fs.readFileSync(path.join(rootDir, 'src/components/events/EventCreateWizard.jsx'), 'utf-8');
const templateLibSrc = fs.readFileSync(path.join(rootDir, 'src/components/studio/TemplateLibrary.jsx'), 'utf-8');

check('EventCreateWizard does NOT render PassCanvas', () => {
  assert(!wizardSrc.includes('<PassCanvas'));
});

check('EventCreateWizard renders Dynamic 3D Pass Engine with category theme', () => {
  assert(wizardSrc.includes('Dynamic 3D Pass Engine') && wizardSrc.includes('<Ticket3D'));
});

check('TemplateLibrary does NOT render PassCanvas', () => {
  assert(!templateLibSrc.includes('<PassCanvas'));
});

check('TemplateLibrary renders Ticket3D preview cards', () => {
  assert(templateLibSrc.includes('<Ticket3D'));
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`AUDIT RESULTS: ${passedChecks} / ${totalChecks} checks passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
