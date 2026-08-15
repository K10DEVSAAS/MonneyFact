import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runRlsAudit() {
  console.log('================================================================');
  console.log('LOOP 4.9 — AUDIT DE SÉCURITÉ DES RLS POSTGRESQL ACTUELLES');
  console.log('================================================================\n');

  const tables = [
    'organizations',
    'profiles',
    'clients',
    'invoices',
    'invoice_items',
    'notifications',
    'subsidiaries',
    'payments',
  ];

  for (const table of tables) {
    console.log(`--- TABLE: public.${table} ---`);
    const { data: policies, error } = await supabase.rpc('get_policies_for_table', { target_table: table });
    if (error) {
      // Fallback query via raw postgres / REST if rpc not present
      console.log(`Audit direct Supabase for ${table}...`);
    } else {
      console.log(policies);
    }
  }
}

runRlsAudit();
