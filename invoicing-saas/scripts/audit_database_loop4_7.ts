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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDatabaseAudit() {
  console.log('================================================================');
  console.log('LOOP 4.7 — AUDIT RÉEL DU SCHÉMA POSTGRESQL ET RELATIONS');
  console.log('================================================================\n');

  const tables = ['organizations', 'profiles', 'clients', 'invoices', 'invoice_items', 'subsidiaries', 'notifications', 'payments'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table 'public.${table}': ERREUR -> ${error.message}`);
    } else {
      const columns = data && data.length > 0 ? Object.keys(data[0]) : 'Existante (vide)';
      console.log(`✅ Table 'public.${table}': ACCESSIBLE | Colonnes:`, columns);
    }
  }

  // Audit profiles vs organizations
  console.log('\n--- AUDIT PROFILES ↔ ORGANIZATIONS ---');
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('*');

  console.log(`Total profils: ${profiles?.length || 0}`);
  console.log(`Total organisations: ${orgs?.length || 0}`);

  if (profiles) {
    const orphanProfiles = profiles.filter((p) => !p.organization_id);
    console.log(`Profils sans organization_id: ${orphanProfiles.length}`);
  }

  console.log('\n================================================================\n');
}

runDatabaseAudit();
