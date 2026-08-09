import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let supabaseUrl = 'https://dekxifsxqxoljobhzraw.supabase.co';
let supabaseAnonKey = '';

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  }
} catch (e) {
  console.warn('Could not load .env.local:', e);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('================================================================');
  console.log('STEP 4 — APPLYING SCHEMA MIGRATION TO SUPABASE PRODUCTION DB');
  console.log('================================================================\n');

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

  // Attempt executing via RPC or SQL API
  console.log('Executing DDL statements via Supabase client...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSql });
  
  if (error) {
    console.log('RPC exec_sql status:', error.message);
    console.log('\nDirect DDL SQL script generated for Supabase Dashboard SQL Editor if RPC is restricted:');
    console.log(migrationSql);
  } else {
    console.log('✅ Migration applied successfully via RPC! Output:', data);
  }
}

runMigration();
