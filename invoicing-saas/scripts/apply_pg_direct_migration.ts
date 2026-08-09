import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Supabase PostgreSQL direct connection details
// Project Ref: dekxifsxqxoljobhzraw
// Host: db.dekxifsxqxoljobhzraw.supabase.co
// Default Port: 5432 or 6543 (transaction pooler)

const connectionStrings = [
  process.env.DATABASE_URL || '',
  'postgres://postgres:postgres@db.dekxifsxqxoljobhzraw.supabase.co:5432/postgres',
  'postgresql://postgres.dekxifsxqxoljobhzraw:postgres@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
];

async function tryConnectAndMigrate() {
  console.log('--- TRYING DIRECT POSTGRES DDL MIGRATION ---');

  const migrationSql = `
    CREATE TABLE IF NOT EXISTS public.subsidiaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'Agence Régionale',
        city TEXT DEFAULT 'Abidjan',
        address TEXT,
        phone TEXT,
        email TEXT,
        manager_name TEXT,
        rccm_number TEXT,
        tax_id TEXT,
        status TEXT DEFAULT 'actif',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.invoices 
    ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES public.subsidiaries(id) ON DELETE SET NULL;

    ALTER TABLE public.invoices 
    ADD COLUMN IF NOT EXISTS subsidiary_name TEXT;

    CREATE TABLE IF NOT EXISTS public.team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'Gestionnaire',
        access_scope TEXT DEFAULT 'global',
        status TEXT DEFAULT 'Actif',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  for (const connStr of connectionStrings) {
    if (!connStr) continue;
    console.log(`Connecting to: ${connStr.replace(/:[^:@]+@/, ':****@')}...`);
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('Connected! Executing DDL migration...');
      await client.query(migrationSql);
      console.log('✅ DDL MIGRATION EXECUTED SUCCESSFULLY!');
      await client.end();
      return;
    } catch (e: any) {
      console.log('Connection attempt failed:', e.message);
    }
  }

  console.log('\n================================================================');
  console.log('📌 MIGRATION DDL SQL STATEMENT FOR SUPABASE DASHBOARD SQL EDITOR:');
  console.log('================================================================');
  console.log(migrationSql);
  console.log('================================================================\n');
}

tryConnectAndMigrate();
