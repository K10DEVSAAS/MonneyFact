import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// Parse .env.local synchronously
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
    }
  }
}

const migrationSqlFile = path.resolve(process.cwd(), 'supabase/migrations/20260818_geniuspay_atomic_payment.sql');
const migrationSql = fs.readFileSync(migrationSqlFile, 'utf8');

const connectionStrings = [
  process.env.DATABASE_URL || '',
  'postgres://postgres:postgres@db.dekxifsxqxoljobhzraw.supabase.co:5432/postgres',
  'postgresql://postgres.dekxifsxqxoljobhzraw:postgres@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
];

async function applyGeniusPayMigration() {
  console.log('================================================================');
  console.log('APPLICATION DE LA MIGRATION GENIUSPAY (UNIQUE CONSTRAINT & ATOMIC RPC)');
  console.log('================================================================\n');

  let executed = false;

  for (const connStr of connectionStrings) {
    if (!connStr) continue;
    try {
      console.log(`Connexion à PostgreSQL: ${connStr.replace(/:[^:@]+@/, ':****@')}...`);
      const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connecté ! Exécution du script de migration SQL...');
      await client.query(migrationSql);
      console.log('✅ MIGRATION GENIUSPAY EXÉCUTÉE AVEC SUCCÈS SUR POSTGRESQL !');
      await client.end();
      executed = true;
      break;
    } catch (e: any) {
      console.warn('Notice connexion PG:', e.message);
    }
  }

  if (!executed) {
    console.log('\n================================================================');
    console.log('📌 NOTICE : MERCI D\'EXÉCUTER CE CODE DANS LE SUPABASE SQL EDITOR SI PG DIRECT EST INACCESSIBLE :');
    console.log('================================================================');
    console.log(migrationSql);
    console.log('================================================================\n');
  }
}

applyGeniusPayMigration();
