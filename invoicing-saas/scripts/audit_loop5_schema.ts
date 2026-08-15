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

async function runLoop5Audit() {
  console.log('================================================================');
  console.log('LOOP 5 — AUDIT ARCHITECTURE & SCHÉMA POSTGRESQL (PROFIL & PARAMÈTRES)');
  console.log('================================================================\n');

  // Query organizations table columns and sample
  const { data: orgData, error: orgErr } = await supabase.from('organizations').select('*').limit(1);
  console.log('--- TABLE public.organizations ---');
  if (orgErr) {
    console.error('❌ Error fetching organizations:', orgErr.message);
  } else {
    console.log('Colonnes trouvées:', orgData && orgData.length > 0 ? Object.keys(orgData[0]) : 'Existante (vide)');
  }

  // Query profiles table columns and sample
  const { data: profData, error: profErr } = await supabase.from('profiles').select('*').limit(1);
  console.log('\n--- TABLE public.profiles ---');
  if (profErr) {
    console.error('❌ Error fetching profiles:', profErr.message);
  } else {
    console.log('Colonnes trouvées:', profData && profData.length > 0 ? Object.keys(profData[0]) : 'Existante (vide)');
  }
}

runLoop5Audit();
