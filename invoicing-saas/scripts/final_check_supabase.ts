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

async function checkMigrationStatus() {
  console.log('================================================================');
  console.log('🔍 FINAL CHECK — SUPABASE REMOTE DATABASE SCHEMA VERIFICATION');
  console.log('================================================================\n');

  // 1. Test public.subsidiaries table presence
  const { data: subData, error: subErr } = await supabase.from('subsidiaries').select('*').limit(1);

  // 2. Test subsidiary_id column in public.invoices
  const { data: invData, error: invErr } = await supabase
    .from('invoices')
    .select('id, organization_id, subsidiary_id, subsidiary_name, total')
    .limit(1);

  const subsidiariesTableExists = !subErr || !subErr.message.includes('Could not find the table');
  const subsidiaryIdColumnExists = !invErr || !invErr.message.includes("Could not find the 'subsidiary_id' column");

  console.log(`1. Table public.subsidiaries status: ${subsidiariesTableExists ? 'EXISTS ✅' : 'NOT FOUND ❌'}`);
  console.log(`2. Column invoices.subsidiary_id status: ${subsidiaryIdColumnExists ? 'EXISTS ✅' : 'NOT FOUND ❌'}\n`);

  if (!subsidiariesTableExists || !subsidiaryIdColumnExists) {
    console.log('================================================================');
    console.log('🚨 RESULTAT : MIGRATION NON APPLIQUÉE SUR SUPABASE DISTANT');
    console.log('================================================================\n');
    console.log('Le schéma SQL DDL ci-dessous doit être exécuté dans Supabase SQL Editor :');
    console.log(`
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

NOTIFY pgrst, 'reload schema';
    `);
    return;
  }

  // 3. Query invoice c1098e2c-b2c0-4ce8-a6bc-e87be72563df if columns exist
  const { data: testInv, error: testInvErr } = await supabase
    .from('invoices')
    .select('id, organization_id, subsidiary_id, subsidiary_name, total, issue_date')
    .eq('id', 'c1098e2c-b2c0-4ce8-a6bc-e87be72563df')
    .maybeSingle();

  console.log('--- TEST INVOICE (c1098e2c-b2c0-4ce8-a6bc-e87be72563df) ---');
  console.log(testInv || 'Invoice not found or deleted after cleanup.');
}

checkMigrationStatus();
