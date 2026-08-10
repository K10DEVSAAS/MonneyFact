import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

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

async function verifySubsidiariesAndColumns() {
  console.log('================================================================');
  console.log('🔎 VERIFYING public.subsidiaries COLUMNS & INSERTION');
  console.log('================================================================\n');

  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
  let orgId = orgs && orgs.length > 0 ? orgs[0].id : null;

  if (!orgId) {
    const newOrgId = crypto.randomUUID();
    const { data: createdOrg } = await supabase.from('organizations').insert({
      id: newOrgId,
      name: 'ABC GROUP (Test Subsidiaries)',
      email: `test-org-${Date.now()}@monneyfact.ci`
    }).select('id').single();
    if (createdOrg) orgId = createdOrg.id;
  }

  console.log('Using organization_id:', orgId);

  const subId = crypto.randomUUID();
  const { data: insertedSub, error: subInsErr } = await supabase
    .from('subsidiaries')
    .insert({
      id: subId,
      organization_id: orgId,
      name: 'ABC GROUP — Agence Cocody',
      type: 'Agence Régionale',
      city: 'Abidjan',
      address: 'Cocody Riviera 3',
      phone: '+225 07 01 01 01 01',
      email: 'cocody@abcgroup.ci',
      manager_name: 'Directeur Cocody',
      status: 'actif',
    })
    .select('*')
    .single();

  if (subInsErr) {
    console.error('❌ Insert error into public.subsidiaries:', subInsErr.message);
  } else {
    console.log('✅ SUB-COMPANY INSERTED SUCCESSFULLY INTO public.subsidiaries !');
    const columns = Object.keys(insertedSub);
    columns.forEach((colName, index) => {
      const val = insertedSub[colName];
      const dataType: string = val === null ? 'text / uuid (null)' : typeof val;
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${colName.padEnd(20, ' ')} | Type: ${dataType} | Ex-Val: ${val}`);
    });

    await supabase.from('subsidiaries').delete().eq('id', subId);
  }
}

verifySubsidiariesAndColumns();
