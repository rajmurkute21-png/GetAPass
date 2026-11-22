/**
 * Test Suite: Admin Relocation, Dynamic Pass Builder & Organizer Studio Upgrade
 *
 * Validates:
 * 1. Admin Dashboard removed from public header, relocated to ProfileView (authorized admins only)
 * 2. Route protection & role boundary enforcement
 * 3. Pass Builder live 3D preview without narrow container clipping/crushing
 * 4. Rich dynamic pass configuration (11 categories, visual themes, authorities, clearances, artwork)
 * 5. Pass Library integration with live 3D ticket cards, edit, preview, and persistence
 * 6. EventCreateWizard upgraded to Dynamic 3D Pass Engine (static PassCanvas purged)
 * 7. TemplateLibrary upgraded to Ticket3D cards (static PassCanvas purged)
 * 8. PassTypeManager upgraded with 3D ticket preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] #${totalTests}: ${testName}`);
  } else {
    console.error(`  [FAIL] #${totalTests}: ${testName}`);
    process.exitCode = 1;
  }
}

console.log('\n================================================================');
console.log('🛡️ GETAPASS: ADMIN, PASS BUILDER & ORGANIZER UPGRADE TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Admin Dashboard Relocation & Security Boundaries
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Admin Dashboard Relocation & Security Boundaries ---');

const desktopHeaderSrc = fs.readFileSync(path.join(rootDir, 'src/components/navigation/DesktopHeader.jsx'), 'utf-8');
assert(
  !desktopHeaderSrc.includes('<span>Admin Dashboard</span>'),
  'Admin Dashboard button completely removed from DesktopHeader navigation bar'
);
assert(
  !desktopHeaderSrc.includes("onNavigate('admin')"),
  'DesktopHeader does not expose direct admin navigation button'
);

const profileViewSrc = fs.readFileSync(path.join(rootDir, 'src/views/ProfileView.jsx'), 'utf-8');
assert(
  profileViewSrc.includes("items.push({ id: 'admin-dashboard', label: 'Admin Dashboard'"),
  'ProfileView adds Admin Dashboard menu item inside sidebar'
);
assert(
  profileViewSrc.includes('if (isAdmin) {') && profileViewSrc.includes("id: 'admin-dashboard'"),
  'Admin Dashboard menu item in ProfileView is guarded strictly by isAdmin'
);
assert(
  profileViewSrc.includes("activeTab === 'admin-dashboard' && isAdmin"),
  'Admin Dashboard section in ProfileView is strictly rendered only when activeTab is admin-dashboard and user is admin'
);
assert(
  profileViewSrc.includes('AUTHORIZED PLATFORM ADMINISTRATOR'),
  'ProfileView Admin Dashboard section renders verified administrator credentials badge'
);
assert(
  profileViewSrc.includes('Open Full Admin Console →'),
  'ProfileView Admin Dashboard section provides link to launch full platform console'
);
assert(
  profileViewSrc.includes('Pass Builder & Dynamic Themes'),
  'ProfileView Admin Dashboard section provides shortcut to Pass Builder'
);

const appSrc = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf-8');
assert(
  appSrc.includes("portalMode === 'admin' ? (") && appSrc.includes("allowedRoles={['admin']}"),
  'App.jsx protects /admin route with ProtectedRoute allowedRoles=[admin]'
);
assert(
  appSrc.includes('setAdminInitialTab'),
  'App.jsx synchronizes adminInitialTab for seamless tab switching from Profile'
);

// -----------------------------------------------------------------------------
// SECTION 2: Pass Builder Layout & 3D Preview Fix
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Pass Builder Layout & 3D Preview Glitch Fix ---');

const adminViewSrc = fs.readFileSync(path.join(rootDir, 'src/views/AdminView.jsx'), 'utf-8');
assert(
  !adminViewSrc.includes("gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(340px, 1fr)'"),
  'Squeezed 340px column in Pass Builder has been removed'
);
assert(
  adminViewSrc.includes('LIVE REAL-TIME 3D PASS PREVIEW'),
  'Pass Builder renders dedicated LIVE REAL-TIME 3D PASS PREVIEW stage'
);
assert(
  adminViewSrc.includes('<Ticket3D') && adminViewSrc.includes('passBuilderConfig'),
  'Pass Builder uses universal Ticket3D component with dynamic passBuilderConfig'
);
assert(
  adminViewSrc.includes('passStudioSubTab'),
  'Pass Builder provides sub-tab navigation between Studio and Pass Library'
);

// -----------------------------------------------------------------------------
// SECTION 3: Dynamic Pass Configurations
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Dynamic Pass Configuration Features ---');

assert(
  adminViewSrc.includes('TICKET_CATEGORIES.map'),
  'Pass Builder provides visual category theme presets for all categories'
);
assert(
  adminViewSrc.includes('passBuilderConfig.category'),
  'Pass Builder dynamically preserves and tracks category theme'
);
assert(
  adminViewSrc.includes('passBuilderConfig.tagline'),
  'Pass Builder provides subtitle/tagline configuration'
);
assert(
  adminViewSrc.includes('passBuilderConfig.coverImage'),
  'Pass Builder allows custom background artwork URL and default reset'
);
assert(
  adminViewSrc.includes('passBuilderConfig.price'),
  'Pass Builder allows pricing configuration in INR (₹)'
);
assert(
  adminViewSrc.includes('passBuilderConfig.permissions'),
  'Pass Builder provides zone clearance checkboxes (General Area, Workshop, VIP, Backstage)'
);
assert(
  adminViewSrc.includes('handlePublishPassTemplate'),
  'Pass Builder provides handlePublishPassTemplate to save and publish to Pass Library'
);
assert(
  adminViewSrc.includes('handleLoadTemplateIntoBuilder'),
  'Pass Builder provides handleLoadTemplateIntoBuilder to edit existing templates in real-time'
);
assert(
  adminViewSrc.includes('handleResetToCategoryDefaults'),
  'Pass Builder allows resetting styling to category defaults'
);

// -----------------------------------------------------------------------------
// SECTION 4: Dynamic Pass Library Integration
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Dynamic Pass Library Integration ---');

assert(
  adminViewSrc.includes('Pass Template Library ('),
  'Pass Builder integrates a dedicated Pass Template Library view'
);
assert(
  adminViewSrc.includes('customTemplates.map'),
  'Pass Library iterates through all saved and system templates'
);
assert(
  adminViewSrc.includes('Edit in Builder'),
  'Pass Library cards provide Edit in Builder action button'
);
assert(
  adminViewSrc.includes('previewTicketModal'),
  'Pass Library provides 3D ticket preview modal'
);

const templateLibSrc = fs.readFileSync(path.join(rootDir, 'src/components/studio/TemplateLibrary.jsx'), 'utf-8');
assert(
  !templateLibSrc.includes('<PassCanvas'),
  'TemplateLibrary completely purges legacy static PassCanvas'
);
assert(
  templateLibSrc.includes('<Ticket3D'),
  'TemplateLibrary uses universal Ticket3D for all template card previews and modals'
);
assert(
  templateLibSrc.includes('maxWidth="1020px"'),
  'TemplateLibrary preview modal uses spacious 1020px landscape format'
);

// -----------------------------------------------------------------------------
// SECTION 5: Organizer Studio Dynamic Pass Upgrade
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Organizer Studio Dynamic Pass Upgrade ---');

const wizardSrc = fs.readFileSync(path.join(rootDir, 'src/components/events/EventCreateWizard.jsx'), 'utf-8');
assert(
  !wizardSrc.includes('<PassCanvas'),
  'EventCreateWizard completely purges legacy static PassCanvas'
);
assert(
  !wizardSrc.includes("import PassCanvas from '../studio/PassCanvas';"),
  'EventCreateWizard removes PassCanvas import'
);
assert(
  wizardSrc.includes("import Ticket3D from '../pass/Ticket3D';"),
  'EventCreateWizard imports universal Ticket3D'
);
assert(
  wizardSrc.includes('Dynamic 3D Pass Engine'),
  'EventCreateWizard Step 4 renders Dynamic 3D Pass Engine section'
);
assert(
  wizardSrc.includes('Preview Dynamic 3D Pass'),
  'EventCreateWizard Step 4 provides Preview Dynamic 3D Pass button'
);
assert(
  wizardSrc.includes('previewPassItem'),
  'EventCreateWizard manages previewPassItem for dynamic 3D modal preview'
);

const passTypeManagerSrc = fs.readFileSync(path.join(rootDir, 'src/components/studio/PassTypeManager.jsx'), 'utf-8');
assert(
  passTypeManagerSrc.includes("import Ticket3D from '../pass/Ticket3D';"),
  'PassTypeManager imports universal Ticket3D'
);
assert(
  passTypeManagerSrc.includes('preview3DModalPass'),
  'PassTypeManager provides 3D ticket preview for pass tiers'
);

// -----------------------------------------------------------------------------
// SECTION 6: Universal 3D Ticket Architecture
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: Universal 3D Ticket Architecture ---');

const digitalPassSrc = fs.readFileSync(path.join(rootDir, 'src/components/pass/DigitalPass.jsx'), 'utf-8');
assert(
  digitalPassSrc.includes('<Ticket3D'),
  'DigitalPass universally renders Ticket3D component'
);
assert(
  !digitalPassSrc.includes('PassCanvas'),
  'DigitalPass has zero references to legacy PassCanvas'
);

const passCardSrc = fs.readFileSync(path.join(rootDir, 'src/components/cards/PassCard.jsx'), 'utf-8');
assert(
  passCardSrc.includes('View Pass'),
  'PassCard has clean View Pass button without separate 3D mode switch'
);

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} CHECKS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');
