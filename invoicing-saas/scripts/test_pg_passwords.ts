import { Client } from 'pg';

const candidatePasswords = [
  'postgres',
  'MonneyFact2026',
  'MoneyFact2026',
  'dekxifsxqxoljobhzraw',
  'K10DEVSAAS',
  'k10developpeur',
  'admin',
  'password',
  'root',
];

const host = 'db.dekxifsxqxoljobhzraw.supabase.co';
const ref = 'dekxifsxqxoljobhzraw';

async function testPasswords() {
  console.log('Testing PG connections...');

  for (const pass of candidatePasswords) {
    const connStrs = [
      `postgres://postgres:${pass}@${host}:5432/postgres`,
      `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    ];

    for (const connStr of connStrs) {
      try {
        const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
        await client.connect();
        console.log(`🎉 SUCCESS! Connected with password: ${pass}`);
        await client.end();
        process.exit(0);
      } catch (e: any) {
        // failed
      }
    }
  }

  console.log('Finished testing candidates.');
}

testPasswords();
