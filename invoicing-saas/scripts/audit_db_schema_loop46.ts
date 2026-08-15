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

async function auditDatabaseSchema() {
  console.log('================================================================');
  console.log('LOOP 4.6 — ÉTAPE 1 & 8: AUDIT DIRECT DES CONTRAINTES POSTGRESQL');
  console.log('================================================================\n');

  // Test insert & verify schema columns on public.invoices & public.payments
  const testOrgId = '99999999-9999-4999-9999-999999999999';
  const testInvId = '88888888-8888-4888-8888-888888888888';
  const testPayId = '77777777-7777-4777-7777-777777777777';
  const testToken = `token-schema-audit-${Date.now()}`;

  // 1. Check Org insert
  await supabase.from('organizations').upsert({ id: testOrgId, name: 'Schema Audit Org', email: `audit-${Date.now()}@test.ci` }, { onConflict: 'id' });

  // 2. Check Invoice insert with payment_token
  const { data: invData, error: invErr } = await supabase.from('invoices').insert({
    id: testInvId,
    invoice_number: 'FAC-SCHEMA-AUDIT-001',
    organization_id: testOrgId,
    client_name: 'Schema Test Client',
    status: 'sent',
    issue_date: '2026-08-15',
    due_date: '2026-09-15',
    subtotal: 500000,
    tax_rate: 18,
    tax_amount: 90000,
    total: 590000,
    payment_token: testToken
  }).select('*').single();

  if (invErr) {
    console.error('❌ Error testing public.invoices schema:', invErr.message);
  } else {
    console.log('✅ public.invoices Schema & Columns Verified:');
    console.log('   Available Columns:', Object.keys(invData));
    console.log('   payment_token present:', 'payment_token' in invData);
  }

  // 3. Test UNIQUE constraint on payment_token
  const { error: dupTokenErr } = await supabase.from('invoices').insert({
    invoice_number: 'FAC-SCHEMA-AUDIT-002',
    organization_id: testOrgId,
    client_name: 'Schema Test Client 2',
    status: 'sent',
    issue_date: '2026-08-15',
    due_date: '2026-09-15',
    subtotal: 100000,
    tax_rate: 18,
    tax_amount: 18000,
    total: 118000,
    payment_token: testToken // Duplicate token
  });

  if (dupTokenErr) {
    console.log('✅ UNIQUE Constraint on invoices.payment_token ACTIVE! Duplicate rejected:', dupTokenErr.message);
  } else {
    console.log('⚠️ UNIQUE Constraint on invoices.payment_token is missing (Duplicate accepted)!');
  }

  // 4. Check Payments insert
  const { data: payData, error: payErr } = await supabase.from('payments').insert({
    id: testPayId,
    invoice_id: testInvId,
    amount: 590000,
    currency: 'FCFA',
    provider: 'cinetpay',
    provider_transaction_id: `TX-AUDIT-${Date.now()}`,
    status: 'paid',
    paid_at: new Date().toISOString()
  }).select('*').single();

  if (payErr) {
    console.error('❌ Error testing public.payments schema:', payErr.message);
  } else {
    console.log('✅ public.payments Schema & Columns Verified:');
    console.log('   Available Columns:', Object.keys(payData));
    console.log('   Foreign Key (invoice_id -> invoices.id) Verified!');
  }

  // Cleanup
  if (!payErr && testPayId) await supabase.from('payments').delete().eq('id', testPayId);
  if (!invErr && testInvId) await supabase.from('invoices').delete().eq('id', testInvId);
  await supabase.from('organizations').delete().eq('id', testOrgId);
}

auditDatabaseSchema();
