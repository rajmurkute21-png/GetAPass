/**
 * Test Suite: GetAPass Animated Official Logo Loader
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('GETAPASS — OFFICIAL LOGO LOADER AUDIT SUITE');
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

const logoLoaderSrc = fs.readFileSync(path.join(rootDir, 'src/components/common/LogoLoader.jsx'), 'utf-8');
const buttonSrc = fs.readFileSync(path.join(rootDir, 'src/components/common/Button.jsx'), 'utf-8');
const protectedRouteSrc = fs.readFileSync(path.join(rootDir, 'src/components/auth/ProtectedRoute.jsx'), 'utf-8');
const adminViewSrc = fs.readFileSync(path.join(rootDir, 'src/views/AdminView.jsx'), 'utf-8');
const designSpecSrc = fs.readFileSync(path.join(rootDir, 'src/views/DesignSystemSpecView.jsx'), 'utf-8');

// 1. Logo and Brand Asset Integrity
console.log('--- SECTION 1: Brand Asset & Proportions Integrity ---');
check('Uses official GetAPass logo brand assets (/brand/)', () => {
  assert(logoLoaderSrc.includes('/brand/logo-dark.png') && logoLoaderSrc.includes('/brand/logo-light.png'));
  assert(logoLoaderSrc.includes('/brand/favicon.png'));
});

check('Preserves original logo aspect ratios and natural colors', () => {
  assert(logoLoaderSrc.includes('612 / 156'));
  assert(logoLoaderSrc.includes('objectFit'));
});

// 2. Sizing Standards for Variants
console.log('\n--- SECTION 2: Dimensions & Variant Sizing ---');
check('Full-page loader resolves to 40-56px range (default 48px)', () => {
  assert(logoLoaderSrc.includes('resolvedHeight = 48'));
});

check('Section loader resolves to 36-44px range (default 38px)', () => {
  assert(logoLoaderSrc.includes('resolvedHeight = 38'));
});

check('Button loader resolves to 18-22px range (default 20px)', () => {
  assert(logoLoaderSrc.includes('resolvedHeight = 20'));
});

// 3. Animation Mechanics
console.log('\n--- SECTION 3: 3D Flip & Perspective Animation ---');
check('Implements 3D vertical axis flip (rotateY)', () => {
  assert(logoLoaderSrc.includes('rotateY: [0, 180, 360]'));
});

check('Implements 3D perspective stage and preserve-3d', () => {
  assert(logoLoaderSrc.includes('perspective'));
  assert(logoLoaderSrc.includes('preserve-3d'));
});

check('Implements smooth scale pulse during flip', () => {
  assert(logoLoaderSrc.includes('scale: [1, 1.05, 1]') || logoLoaderSrc.includes('scale: [1, 1.08, 1]'));
});

check('Configured with ~1.0-1.4s animation cycle', () => {
  assert(logoLoaderSrc.includes('duration: 1.25') || logoLoaderSrc.includes('duration: 1.2'));
});

// 4. Lighting & Indicator
console.log('\n--- SECTION 4: Lighting & Micro Indicator ---');
check('Implements soft Electric Violet and Pink radial backlight glow', () => {
  assert(logoLoaderSrc.includes('rgba(142, 44, 252') && logoLoaderSrc.includes('rgba(236, 72, 153'));
});

check('Renders tiny 3-dot sequenced pulse loading indicator below logo', () => {
  assert(logoLoaderSrc.includes('#8E2CFC') && logoLoaderSrc.includes('#9333EA') && logoLoaderSrc.includes('#EC4899'));
  assert(logoLoaderSrc.includes('showIndicator'));
});

// 5. Accessibility & Motion Preferences
console.log('\n--- SECTION 5: Accessibility & Reduced Motion ---');
check('Supports prefers-reduced-motion via Framer Motion useReducedMotion', () => {
  assert(logoLoaderSrc.includes('useReducedMotion'));
  assert(logoLoaderSrc.includes('shouldReduceMotion'));
});

// 6. Connected to Genuine Loading States
console.log('\n--- SECTION 6: Integration with Real Loading States ---');
check('Button component connects to LogoLoader for loading state', () => {
  assert(buttonSrc.includes('<LogoLoader variant="button" />'));
});

check('ProtectedRoute connects to LogoLoader for auth session verification', () => {
  assert(protectedRouteSrc.includes('<LogoLoader'));
  assert(protectedRouteSrc.includes('variant="full-page"'));
});

check('AdminView connects to LogoLoader for platform account loading', () => {
  assert(adminViewSrc.includes('<LogoLoader variant="section"'));
});

check('DesignSystemSpecView showcases the signature animated official logo loader', () => {
  assert(designSpecSrc.includes('<LogoLoader variant="section"'));
});

console.log('\n================================================================');
console.log(`AUDIT RESULTS: ${passedChecks} / ${totalChecks} checks passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
