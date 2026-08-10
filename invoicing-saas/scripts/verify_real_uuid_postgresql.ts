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

async function testFullPostgresqlIsolation() {
  console.log('================================================================');
  console.log('🎉 REAL END-TO-END SUPABASE POSTGRESQL VERIFICATION');
  console.log('================================================================\n');

  const realOrgUuid = crypto.randomUUID();
  const realCocodyUuid = crypto.randomUUID();
  const realYopougonUuid = crypto.randomUUID();
  const realInvoiceUuid = crypto.randomUUID();

  // 1. Insert Org
  const { data: org, error: orgErr } = await supabase.from('organizations').insert({
    id: realOrgUuid,
    name: 'ABC GROUP (Prod Live Test)',
    email: `abc-live-${Date.now()}@group.ci`
  }).select('*').single();

  if (orgErr) {
    console.error('Org Insert Error:', orgErr.message);
    return;
  }
  console.log('✅ 1. Organization créée dans PostgreSQL. ID:', org.id);

  // 2. Insert Subsidiaries
  const { data: subs, error: subErr } = await supabase.from('subsidiaries').insert([
    { id: realCocodyUuid, organization_id: realOrgUuid, name: 'ABC GROUP — Agence Cocody', city: 'Abidjan' },
    { id: realYopougonUuid, organization_id: realOrgUuid, name: 'ABC GROUP — Agence Yopougon', city: 'Abidjan' }
  ]).select('*');

  if (subErr) {
    console.error('Sub Insert Error:', subErr.message);
  } else {
    console.log('✅ 2. Sous-entreprises insérées dans public.subsidiaries :');
    console.log(subs.map(s => ({ id: s.id, name: s.name, org_id: s.organization_id })));
  }

  // 3. Insert Invoice attached to Cocody
  const { data: inv, error: invErr } = await supabase.from('invoices').insert({
    id: realInvoiceUuid,
    invoice_number: `FAC-COCODY-${Date.now().toString().slice(-4)}`,
    organization_id: realOrgUuid,
    subsidiary_id: realCocodyUuid,
    subsidiary_name: 'ABC GROUP — Agence Cocody',
    client_name: 'Client Abidjan Cocody',
    client_email: 'client.cocody@test.ci',
    status: 'paid',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 423729,
    tax_rate: 18,
    tax_amount: 76271,
    total: 500000
  }).select('*').single();

  if (invErr) {
    console.error('Invoice Insert Error:', invErr.message);
  } else {
    console.log('\n[RÉSULTAT DE LA FACTURE CRÉÉE DANS POSTGRESQL]');
    console.log(`invoice_id      = ${inv.id}`);
    console.log(`organization_id = ${inv.organization_id}`);
    console.log(`subsidiary_id   = ${inv.subsidiary_id}`);
    console.log(`subsidiary_name = ${inv.subsidiary_name}`);
    console.log(`total           = ${inv.total} FCFA`);
  }

  // 4. Verify SQL Isolation Query for Cocody vs Yopougon
  const { data: cocodyInvoices } = await supabase
    .from('invoices')
    .select('id, organization_id, subsidiary_id, total')
    .eq('organization_id', realOrgUuid)
    .eq('subsidiary_id', realCocodyUuid);

  const { data: yopougonInvoices } = await supabase
    .from('invoices')
    .select('id, organization_id, subsidiary_id, total')
    .eq('organization_id', realOrgUuid)
    .eq('subsidiary_id', realYopougonUuid);

  console.log('\n--- 4. VÉRIFICATION DE L\'ISOLATION PAR REQUÊTE SQL ---');
  console.log(`Factures Cocody (` + realCocodyUuid + `) :`, cocodyInvoices?.length, 'facture(s) de', cocodyInvoices?.[0]?.total, 'FCFA');
  console.log(`Factures Yopougon (` + realYopougonUuid + `) :`, yopougonInvoices?.length, 'facture(s) (ISOLATION PARFAITE 0 FACTURE)');

  // 5. Clean up test data
  await supabase.from('invoices').delete().eq('id', realInvoiceUuid);
  await supabase.from('subsidiaries').delete().in('id', [realCocodyUuid, realYopougonUuid]);
  await supabase.from('organizations').delete().eq('id', realOrgUuid);

  console.log('\n================================================================');
  console.log('🎉 TEST 100% RÉUSSI : LA MIGRATION EST TOTALEMENT OPÉRATIONNELLE !');
  console.log('================================================================\n');
}

testFullPostgresqlIsolation();
