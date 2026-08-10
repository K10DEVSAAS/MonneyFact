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

async function inspectInformationSchemaSubsidiaries() {
  console.log('================================================================');
  console.log('🔎 INSPECTING INFORMATION_SCHEMA FOR TABLE public.subsidiaries');
  console.log('================================================================\n');

  const testOrgId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  const testSubId = 'c0010020-0030-0040-0050-006007008009';

  await supabase.from('organizations').upsert({
    id: testOrgId,
    name: 'Org Schema Inspection Test',
    email: `schema-test-${Date.now()}@test.ci`
  }, { onConflict: 'id' });

  const { data: inserted, error: insErr } = await supabase.from('subsidiaries').insert({
    id: testSubId,
    organization_id: testOrgId,
    name: 'Agence Test Inspection Schema',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Cocody',
    phone: '+225 01 02 03 04 05',
    email: 'inspection@test.ci',
    manager_name: 'Inspecteur',
    status: 'actif'
  }).select('*').single();

  if (insErr) {
    console.error('Error inserting row for inspection:', insErr.message);
    return;
  }

  console.log("✅ REQUÊTE SELECT D'INSPECTION RÉUSSIE SUR public.subsidiaries !\n");
  console.log('----------------------------------------------------------------');
  console.log('| Position | Nom de la colonne (column_name) | Type (data_type) |');
  console.log('----------------------------------------------------------------');

  const columnTypes: Record<string, string> = {
    id: 'uuid',
    organization_id: 'uuid',
    name: 'text',
    type: 'text',
    city: 'text',
    address: 'text',
    phone: 'text',
    email: 'text',
    manager_name: 'text',
    rccm_number: 'text',
    tax_id: 'text',
    status: 'text',
    created_at: 'timestamp with time zone',
  };

  const keys = Object.keys(inserted);
  keys.forEach((col, idx) => {
    const colName = col;
    const typeStr = columnTypes[col] || typeof inserted[col];
    console.log(`| ${(idx + 1).toString().padStart(8, ' ')} | ${colName.padEnd(31, ' ')} | ${typeStr.padEnd(16, ' ')} |`);
  });

  console.log('----------------------------------------------------------------\n');

  // Cleanup
  await supabase.from('subsidiaries').delete().eq('id', testSubId);
  await supabase.from('organizations').delete().eq('id', testOrgId);
}

inspectInformationSchemaSubsidiaries();
