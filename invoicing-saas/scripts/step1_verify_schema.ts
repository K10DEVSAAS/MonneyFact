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

async function verifySchemaBeforeMigration() {
  console.log('================================================================');
  console.log('STEP 1 — VERIFYING LIVE POSTGRESQL SCHEMA BEFORE MIGRATION');
  console.log('================================================================\n');

  // 1. Inspect subsidiaries table columns & sample row
  const { data: subSample, error: subErr } = await supabase.from('subsidiaries').select('*').limit(1);
  if (subErr) {
    console.error('Error fetching subsidiaries:', subErr);
  } else {
    console.log('1. public.subsidiaries sample row keys:');
    console.log(subSample && subSample.length > 0 ? Object.keys(subSample[0]) : 'Table empty (0 rows)');
  }

  // 2. Inspect invoices table columns & sample row
  const { data: invSample, error: invErr } = await supabase.from('invoices').select('*').limit(1);
  if (invErr) {
    console.error('Error fetching invoices:', invErr);
  } else {
    console.log('2. public.invoices sample row keys:');
    console.log(invSample && invSample.length > 0 ? Object.keys(invSample[0]) : 'Table empty (0 rows)');
  }

  // 3. Test dummy row insertion into subsidiaries to verify ID format (UUID)
  const testSubUuid = 'c3d4e5f6-a7b8-4901-c234-56789abcdef0';
  const testOrgUuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

  await supabase.from('organizations').upsert({ id: testOrgUuid, name: 'FK Test Org', email: 'fktest@org.ci' }, { onConflict: 'id' });
  const { data: subInsert, error: subInsErr } = await supabase.from('subsidiaries').upsert({
    id: testSubUuid,
    organization_id: testOrgUuid,
    name: 'Test Agency FK Verification',
    city: 'Abidjan',
  }, { onConflict: 'id' }).select('*').single();

  if (subInsErr) {
    console.error('Error inserting test subsidiary:', subInsErr);
  } else {
    console.log('\n3. Verified subsidiaries.id type (UUID):', typeof subInsert.id, '| Value:', subInsert.id);
    console.log('Verified subsidiaries.organization_id type (UUID):', typeof subInsert.organization_id, '| Value:', subInsert.organization_id);
    await supabase.from('subsidiaries').delete().eq('id', testSubUuid);
  }
}

verifySchemaBeforeMigration();
