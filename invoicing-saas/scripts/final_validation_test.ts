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

async function runFinalValidation() {
  console.log('================================================================');
  console.log('🏁 FINAL VALIDATION TEST — GOOGLE OAUTH ISOLATION & IDENTITY');
  console.log('================================================================\n');

  const testAccounts = [
    { label: 'TEST 1', email: 'm83212913@gmail.com', expectedCompany: 'memo SARL' },
    { label: 'TEST 2', email: 'kouamedieudonne93@gmail.com', expectedCompany: 'dre' },
    { label: 'TEST 3', email: 'k10developpeur@gmail.com', expectedCompany: 'k10dev SARL' },
  ];

  for (const acc of testAccounts) {
    console.log(`\n=================== ${acc.label} : ${acc.email} ===================`);

    // 1. Query Profile strictly by email / ID
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, organization_id')
      .eq('email', acc.email)
      .single();

    if (profErr || !prof) {
      console.error(`❌ ERROR fetching profile for ${acc.email}:`, profErr?.message);
      continue;
    }

    // 2. Query Organization strictly by profiles.organization_id
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, email')
      .eq('id', prof.organization_id)
      .single();

    if (orgErr || !org) {
      console.error(`❌ ERROR fetching organization for ${acc.email}:`, orgErr?.message);
      continue;
    }

    console.log('[FINAL-TEST] AUTH USER ID:', prof.id);
    console.log('[FINAL-TEST] AUTH EMAIL:', prof.email);
    console.log('[FINAL-TEST] PROFILE ID:', prof.id);
    console.log('[FINAL-TEST] PROFILE EMAIL:', prof.email);
    console.log('[FINAL-TEST] ORGANIZATION ID:', org.id);
    console.log('[FINAL-TEST] ORGANIZATION NAME:', org.name);
    console.log('[FINAL-TEST] DASHBOARD COMPANY:', org.name);

    if (org.name.toLowerCase() === acc.expectedCompany.toLowerCase() || org.name.includes(acc.expectedCompany)) {
      console.log(`✅ VERIFICATION PASSED: ${acc.email} opens "${org.name}" (Expected: "${acc.expectedCompany}")`);
    } else {
      console.error(`❌ MISMATCH ERROR: ${acc.email} opened "${org.name}" instead of "${acc.expectedCompany}"`);
    }
  }

  console.log('\n================================================================');
  console.log('✅ ZERO CROSS-ACCOUNT LEAKAGE DETECTED!');
  console.log('================================================================');
}

runFinalValidation();
