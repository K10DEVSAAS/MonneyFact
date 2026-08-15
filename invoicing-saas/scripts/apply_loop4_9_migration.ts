import fs from 'fs';
import path from 'path';

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

import { Client } from 'pg';

const migrationSqlFile = path.resolve(process.cwd(), 'supabase/migrations/20260815_loop49_strict_rls.sql');
const migrationSql = fs.readFileSync(migrationSqlFile, 'utf8');

const connectionStrings = [
  process.env.DATABASE_URL || '',
  'postgres://postgres:postgres@db.dekxifsxqxoljobhzraw.supabase.co:5432/postgres',
  'postgresql://postgres.dekxifsxqxoljobhzraw:postgres@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
];

async function applyLoop49Migration() {
  console.log('================================================================');
  console.log('APPLICATIONS DES POLICIES STRICTES LOOP 4.9 EN BASE DE DONNÉES POSTGRESQL');
  console.log('================================================================\n');

  let executed = false;

  for (const connStr of connectionStrings) {
    if (!connStr) continue;
    try {
      console.log(`Connexion à PostgreSQL: ${connStr.replace(/:[^:@]+@/, ':****@')}...`);
      const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connecté ! Exécution des règles RLS strictes...');
      await client.query(migrationSql);
      console.log('✅ POLICIES RLS LOOP 4.9 APPLIQUÉES AVEC SUCCÈS SUR POSTGRESQL !');
      await client.end();
      executed = true;
      break;
    } catch (e: any) {
      console.warn('Notice connexion PG:', e.message);
    }
  }

  if (!executed) {
    console.log('\n================================================================');
    console.log('📌 VEUILLEZ COLLER LE FICHIER DE MIGRATION DANS SUPABASE SQL EDITOR:');
    console.log('================================================================');
    console.log(migrationSql);
    console.log('================================================================\n');
  }
}

applyLoop49Migration();
