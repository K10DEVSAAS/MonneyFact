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

async function auditIdentityMapping() {
  console.log('================================================================');
  console.log('🔎 IDENTITY MAPPING AUDIT (SUPABASE DATABASE & PROFILES)');
  console.log('================================================================\n');

  const emails = ['m83212913@gmail.com', 'kouamedieudonne93@gmail.com', 'k10developpeur@gmail.com'];

  // 1. Audit public.profiles
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, created_at')
    .in('email', emails);

  if (profErr) {
    console.error('Error fetching profiles:', profErr.message);
  } else {
    console.log('--- PROFILES FOUND IN public.profiles ---');
    console.log(JSON.stringify(profiles, null, 2));
  }

  // 2. Audit public.organizations
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, email, plan, status, created_at')
    .in('email', emails);

  if (orgErr) {
    console.error('Error fetching organizations:', orgErr.message);
  } else {
    console.log('\n--- ORGANIZATIONS FOUND IN public.organizations ---');
    console.log(JSON.stringify(orgs, null, 2));
  }

  // 3. Audit JOIN profiles -> organizations
  console.log('\n--- JOIN PROFILES LEFT JOIN ORGANIZATIONS ---');
  const { data: joinRes, error: joinErr } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      organization_id,
      organizations:organization_id (
        id,
        name,
        email
      )
    `)
    .in('email', emails);

  if (joinErr) {
    console.error('Error joining profiles with organizations:', joinErr.message);
  } else {
    console.log(JSON.stringify(joinRes, null, 2));
  }
}

auditIdentityMapping();
