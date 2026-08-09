import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local
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

if (!supabaseAnonKey) {
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDirectDatabaseVerification() {
  console.log('================================================================');
  console.log('🔎 EXECUTING DIRECT DATABASE (SUPABASE / POSTGRESQL) VERIFICATION');
  console.log('================================================================\n');

  const testOrgId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  const testSubId = 'b2c3d4e5-f6a7-4890-b123-456789abcdef';
  const testSubName = 'ABC GROUP — Agence Cocody (Direct DB)';

  // 1. Ensure test organization exists
  await supabase.from('organizations').upsert({
    id: testOrgId,
    name: 'ABC GROUP (Test Direct)',
    email: 'direct@abcgroup.ci',
  }, { onConflict: 'id' });

  // 2. Ensure test subsidiary exists
  await supabase.from('subsidiaries').upsert({
    id: testSubId,
    organization_id: testOrgId,
    name: testSubName,
    city: 'Abidjan',
  }, { onConflict: 'id' });

  // 3. Direct DB INSERT of invoice
  const testInvoiceNumber = `FAC-DIRECT-${Date.now().toString().slice(-4)}`;
  const { data: inserted, error: insertErr } = await supabase
    .from('invoices')
    .insert({
      invoice_number: testInvoiceNumber,
      organization_id: testOrgId,
      subsidiary_id: testSubId,
      subsidiary_name: testSubName,
      client_name: 'Client Direct DB Test',
      client_email: 'client@directdb.ci',
      status: 'paid',
      issue_date: '2026-08-09',
      due_date: '2026-08-30',
      subtotal: 500000,
      tax_rate: 18,
      tax_amount: 90000,
      total: 590000,
    })
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Direct DB INSERT Failed:', insertErr);
    process.exit(1);
  }

  console.log('✅ Direct DB INSERT Successful. Invoice ID:', inserted.id);

  // 4. DIRECT QUERY FROM DATABASE (Bypassing React, Store, and API)
  const { data: queried, error: queryErr } = await supabase
    .from('invoices')
    .select(`
      id,
      organization_id,
      subsidiary_id,
      subsidiary_name,
      subsidiaries (
        id,
        name
      )
    `)
    .eq('id', inserted.id)
    .single();

  if (queryErr) {
    console.error('❌ Direct DB QUERY Failed:', queryErr);
    process.exit(1);
  }

  console.log('\n[DATABASE RESULT]');
  console.log(`invoice_id = ${queried.id}`);
  console.log(`organization_id = ${queried.organization_id}`);
  console.log(`subsidiary_id = ${queried.subsidiary_id}`);
  console.log(`subsidiary_name = ${queried.subsidiary_name}`);
  console.log(`related_subsidiary_name_from_db_join = ${(queried.subsidiaries as any)?.name || 'N/A'}`);
  console.log('================================================================\n');

  // Clean up test invoice
  await supabase.from('invoices').delete().eq('id', inserted.id);
}

runDirectDatabaseVerification().catch((err) => {
  console.error('Fatal error during DB verification:', err);
  process.exit(1);
});
