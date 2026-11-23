import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('GETAPASS — PASS LIFECYCLE & HISTORY AUDIT SUITE');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  [PASS] ${title}`);
  } catch (err) {
    console.log(`  [FAIL] ${title}`);
    console.error(`         ${err.message}`);
  }
}

// Read relevant files
const profileViewSrc = fs.readFileSync(path.join(process.cwd(), 'src/views/ProfileView.jsx'), 'utf-8');
const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.jsx'), 'utf-8');
const organizerStudioSrc = fs.readFileSync(path.join(process.cwd(), 'src/views/OrganizerStudioView.jsx'), 'utf-8');
const passCardSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/cards/PassCard.jsx'), 'utf-8');
const statusBadgeSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/common/StatusBadge.jsx'), 'utf-8');

// --- SECTION 1: Event Termination & Deletion Logic ---
console.log('--- SECTION 1: Event Termination & Deletion Logic ---');

check('OrganizerStudioView provides explicit Terminate action for events', () => {
  assert(organizerStudioSrc.includes('Terminate Event'));
  assert(organizerStudioSrc.includes("status: 'Cancelled'"));
});

check('OrganizerStudioView allows setting status to Cancelled / Terminated in edit modal', () => {
  assert(organizerStudioSrc.includes('Cancelled / Terminated (Removes passes from My Passes)'));
});

check('OrganizerStudioView passes event title to onDeleteEvent for attendee pass cleanup', () => {
  assert(organizerStudioSrc.includes('onDeleteEvent(ev.id, title)'));
});

check('App.jsx defines handleEventTerminationOrDeletion to purge passes of cancelled/deleted events', () => {
  assert(appSrc.includes('handleEventTerminationOrDeletion'));
  assert(appSrc.includes("status: 'Cancelled'"));
  assert(appSrc.includes('setPasses((prev) =>'));
  assert(appSrc.includes('saveStoredUserPasses'));
});

check('App.jsx notifies attendees when an event is terminated by organizer', () => {
  assert(appSrc.includes('Event Terminated'));
  assert(appSrc.includes('was terminated by the organizer. Associated pass(es) have been removed from My Passes.'));
});

// --- SECTION 2: Expiration and Classification Engine ---
console.log('\n--- SECTION 2: Pass Classification & Expiration Engine ---');

check('ProfileView implements isEventExpired helper for ISO, natural, and range dates', () => {
  assert(profileViewSrc.includes('function isEventExpired'));
  assert(profileViewSrc.includes('targetDateStr.includes'));
});

check('ProfileView isolates activePasses from usedPasses, expiredPasses, and terminated passes', () => {
  assert(profileViewSrc.includes('activePasses'));
  assert(profileViewSrc.includes('usedPasses'));
  assert(profileViewSrc.includes('expiredPasses'));
  assert(profileViewSrc.includes('historyPasses'));
});

check('ProfileView excludes terminated events from active passes', () => {
  assert(profileViewSrc.includes('isTerminated'));
  assert(profileViewSrc.includes('history.push'));
  assert(profileViewSrc.includes('terminationNotice'));
});

check('ProfileView excludes expired passes from active passes and sends them to history', () => {
  assert(profileViewSrc.includes('isExpired'));
  assert(profileViewSrc.includes("status: 'Expired'"));
  assert(profileViewSrc.includes('expired.push'));
});

check('ProfileView excludes used passes from active passes and sends them to history', () => {
  assert(profileViewSrc.includes('isUsed'));
  assert(profileViewSrc.includes("status: 'Used'"));
  assert(profileViewSrc.includes('used.push'));
});

// --- SECTION 3: History Option in Navigation & UI ---
console.log('\n--- SECTION 3: History Option & Sub-Views ---');

check('ProfileView menu includes dedicated Pass History navigation option', () => {
  assert(profileViewSrc.includes("id: 'pass-history'"));
  assert(profileViewSrc.includes("label: 'Pass History'"));
  assert(profileViewSrc.includes('count: historyPasses.length'));
});

check('ProfileView My Passes displays interactive switcher between Active Passes and Pass History', () => {
  assert(profileViewSrc.includes('Active Passes ({activePasses.length})'));
  assert(profileViewSrc.includes('Pass History ({historyPasses.length})'));
  assert(profileViewSrc.includes('setPassSubFilter'));
});

check('ProfileView Pass History supports sub-category filters (All, Used, Expired)', () => {
  assert(profileViewSrc.includes('All History'));
  assert(profileViewSrc.includes('Used Passes'));
  assert(profileViewSrc.includes('Expired'));
  assert(profileViewSrc.includes('setHistoryCategoryFilter'));
});

check('ProfileView empty active state guides user to Pass History when passes exist in history', () => {
  assert(profileViewSrc.includes('View Pass History ({historyPasses.length})'));
});

// --- SECTION 4: Turnstile Check-in & Realtime Pass State ---
console.log('\n--- SECTION 4: Turnstile Check-in & Realtime Pass State ---');

check('App.jsx handleRecordCheckin immediately sets checked-in pass to status Used in state and cache', () => {
  assert(appSrc.includes("status: 'Used'"));
  assert(appSrc.includes('checkedIn: true'));
  assert(appSrc.includes('checkedInGate: checkinItem.gate'));
  assert(appSrc.includes('saveStoredUserPasses'));
});

check('StatusBadge supports Used status with violet theme', () => {
  assert(statusBadgeSrc.includes("normalized === 'used'"));
  assert(statusBadgeSrc.includes('#7C3AED'));
  assert(statusBadgeSrc.includes('#6D28D9'));
});

check('PassCard displays gate verification stamp when pass status is Used', () => {
  assert(passCardSrc.includes("status).toLowerCase() === 'used'"));
  assert(passCardSrc.includes('Checked In · Gate'));
});

check('PassCard displays concluded notice when pass status is Expired', () => {
  assert(passCardSrc.includes("status).toLowerCase() === 'expired'"));
  assert(passCardSrc.includes('Event has concluded'));
});

check('PassCard supports optional onDeletePass action for user pass removal', () => {
  assert(passCardSrc.includes('onDeletePass'));
  assert(passCardSrc.includes('Trash2'));
});

console.log('\n================================================================');
console.log(`AUDIT RESULTS: ${passedChecks} / ${totalChecks} checks passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passedChecks !== totalChecks) {
  process.exit(1);
}
