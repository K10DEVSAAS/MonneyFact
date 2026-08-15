import fs from 'fs';
import path from 'path';

console.log('ENV KEYS AVAILABLE:');
console.log(Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')));

const filesToCheck = [
  'c:\\Users\\Lenovo\\Desktop\\MonneyFact\\.env',
  'c:\\Users\\Lenovo\\Desktop\\MonneyFact\\.env.local',
  'c:\\Users\\Lenovo\\Desktop\\MonneyFact\\invoicing-saas\\.env',
  'c:\\Users\\Lenovo\\Desktop\\MonneyFact\\invoicing-saas\\.env.local',
  'c:\\Users\\Lenovo\\.gemini\\config\\credentials.json',
];

for (const f of filesToCheck) {
  if (fs.existsSync(f)) {
    console.log(`FOUND FILE: ${f}`);
    const content = fs.readFileSync(f, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k] = trimmed.split('=');
        console.log(`   Key: ${k}`);
      }
    }
  }
}
