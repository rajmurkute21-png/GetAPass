import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(full, files);
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      files.push(full);
    }
  }
  return files;
}

const files = walk('./src');
console.log(`Checking ${files.length} files in ./src for undeclared currentUser...`);

const suspiciousFiles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('currentUser')) {
    const lines = content.split('\n');
    let declared = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.match(/\b(const|let|var)\s+currentUser\b/) ||
        line.match(/\bcurrentUser\s*[:=,)]/) ||
        line.match(/[:{,]\s*currentUser\s*[,}=]/) ||
        line.match(/\bfunction\b.*\bcurrentUser\b/) ||
        line.match(/\buser:\s*currentUser\b/)
      ) {
        declared = true;
      }
    }
    if (!declared) {
      suspiciousFiles.push(file);
    }
  }
}

console.log('Suspicious files where currentUser is used without obvious declaration:');
console.log(suspiciousFiles);
