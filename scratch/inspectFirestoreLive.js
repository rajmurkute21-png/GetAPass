import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

// Read .env.local
const envPath = path.resolve('.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log('Project ID:', firebaseConfig.projectId);

async function inspectCollections() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.log('No Firebase config found in .env.local');
    return;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);

  const collectionsToCheck = [
    'events',
    'bookings',
    'passes',
    'users',
    'transactions',
    'notifications',
    'checkIns',
    'verifierAssignments',
    'eventAuditLogs'
  ];

  console.log('\n--- Inspecting Firestore Collections ---');
  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(query(collection(db, colName), limit(50)));
      console.log(`\nCollection: "${colName}" -> Found ${snap.size} documents (sample up to 50):`);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        console.log(`  - Doc ID: ${docSnap.id}`);
        if (colName === 'events') {
          console.log(`    Title: "${data.title || data.name}", Status: "${data.status}", Organizer: "${data.organizerEmail || data.organizerUid}"`);
        } else if (colName === 'bookings') {
          console.log(`    Event: "${data.eventTitle}", User: "${data.userEmail || data.userId}", Amount: ${data.amount}, Status: "${data.status}"`);
        } else if (colName === 'passes') {
          console.log(`    Pass: "${data.passId}", Holder: "${data.attendeeName}", Event: "${data.eventTitle}", Status: "${data.status}"`);
        } else if (colName === 'users') {
          console.log(`    Email: "${data.email}", Role: "${data.role}", Name: "${data.displayName || data.name}"`);
        } else if (colName === 'transactions') {
          console.log(`    Txn: "${data.transactionId || docSnap.id}", Amount: ${data.amount}, Status: "${data.status}"`);
        }
      });
    } catch (err) {
      console.log(`Collection: "${colName}" -> Error: ${err.message}`);
    }
  }
}

inspectCollections().catch(err => {
  console.error('Inspection error:', err.message);
});
