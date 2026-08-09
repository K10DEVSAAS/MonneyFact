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

async function inspectColumns() {
  console.log('--- TESTING COLUMN SUPPORT ON LIVE SUPABASE INVOICES TABLE ---');

  const testOrgId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  await supabase.from('organizations').upsert({ id: testOrgId, name: 'Org Schema Test', email: 'schema@test.ci' }, { onConflict: 'id' });

  // Test 1: Minimal insert without subsidiary_id
  const { data: d1, error: e1 } = await supabase.from('invoices').insert({
    invoice_number: 'FAC-SCHEMA-TEST-1',
    organization_id: testOrgId,
    client_name: 'Test Client',
    status: 'sent',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 1000,
    tax_rate: 18,
    tax_amount: 180,
    total: 1180,
  }).select('*').single();

  if (e1) {
    console.error('❌ Insert without subsidiary_id failed:', e1);
  } else {
    console.log('✅ Insert without subsidiary_id succeeded! Available columns in DB row:');
    console.log(Object.keys(d1));
    await supabase.from('invoices').delete().eq('id', d1.id);
  }

  // Test 2: Insert with subsidiary_id
  const { data: d2, error: e2 } = await supabase.from('invoices').insert({
    invoice_number: 'FAC-SCHEMA-TEST-2',
    organization_id: testOrgId,
    subsidiary_id: 'b2c3d4e5-f6a7-4890-b123-456789abcdef',
    client_name: 'Test Client',
    status: 'sent',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 1000,
    tax_rate: 18,
    tax_amount: 180,
    total: 1180,
  }).select('*').single();

  if (e2) {
    console.error('❌ Insert WITH subsidiary_id failed:', e2);
  } else {
    console.log('✅ Insert WITH subsidiary_id succeeded!');
    await supabase.from('invoices').delete().eq('id', d2.id);
  }
}

inspectColumns();
