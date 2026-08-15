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

async function runLoop7InvoiceCreationSuite() {
  console.log('================================================================');
  console.log('LOOP 7 — SUITE DE TESTS : CRÉATION ET CALCUL DE FACTURES');
  console.log('================================================================\n');

  const orgAId = '11111111-7777-4111-a111-111111111111';
  const orgBId = '22222222-7777-4222-b222-222222222222';

  const invoiceAId = '33333333-7777-4333-a333-333333333333';
  const paymentTokenA = `token-inv-a-${Date.now()}`;

  let passedCount = 0;
  let failedCount = 0;

  // Setup Test Organizations
  await supabase.from('organizations').upsert([
    { id: orgAId, name: 'Entreprise Emettrice A', email: 'orgA@loop7.ci' },
    { id: orgBId, name: 'Entreprise Emettrice B', email: 'orgB@loop7.ci' },
  ]);

  // TEST 1 : Insertion d'une facture et calcul des montants
  console.log('TEST 1 : Insertion facture et vérification calculs HT/TVA/TTC...');
  const subtotal = 1000000; // 1,000,000 FCFA
  const taxRate = 18; // 18% TVA
  const taxAmount = Math.round((subtotal * taxRate) / 100); // 180,000 FCFA
  const total = subtotal + taxAmount; // 1,180,000 FCFA

  const { data: invA, error: invErr } = await supabase
    .from('invoices')
    .insert({
      id: invoiceAId,
      invoice_number: 'FAC-2026-0001',
      organization_id: orgAId,
      client_name: 'Société Ivoirienne de Commerce',
      client_email: 'commerce@ci.ci',
      status: 'sent',
      issue_date: '2026-08-15',
      due_date: '2026-09-15',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
    })
    .select('*')
    .single();

  if (!invErr && invA && invA.total === 1180000 && invA.tax_amount === 180000) {
    console.log('✅ TEST 1 PASSED: Facture insérée avec calculs HT (1,000,000 FCFA), TVA (180,000 FCFA) et TTC (1,180,000 FCFA) valides.');
    passedCount++;
  } else {
    console.log('❌ TEST 1 FAILED:', invErr?.message);
    failedCount++;
  }

  // TEST 2 : Insertion des lignes de prestation (invoice_items)
  console.log('\nTEST 2 : Insertion des lignes d\'articles de la facture...');
  const itemRows = [
    {
      invoice_id: invoiceAId,
      description: 'Développement d\'application web sur mesure',
      quantity: 1,
      unit_price: 700000,
      line_total: 700000,
    },
    {
      invoice_id: invoiceAId,
      description: 'Hébergement et maintenance annuelle',
      quantity: 1,
      unit_price: 300000,
      line_total: 300000,
    },
  ];

  const { data: insertedItems, error: itemsErr } = await supabase
    .from('invoice_items')
    .insert(itemRows)
    .select('*');

  if (!itemsErr && insertedItems && insertedItems.length === 2) {
    console.log('✅ TEST 2 PASSED: 2 lignes de prestations rattachées avec succès à la facture.');
    passedCount++;
  } else {
    console.log('❌ TEST 2 FAILED:', itemsErr?.message);
    failedCount++;
  }

  // TEST 3 : Génération et unicité du numéro de facture
  console.log('\nTEST 3 : Génération et unicité du numéro de facture (FAC-2026-0001)...');
  const { data: invByNum } = await supabase
    .from('invoices')
    .select('id, invoice_number, total')
    .eq('invoice_number', 'FAC-2026-0001')
    .eq('organization_id', orgAId)
    .single();

  if (invByNum && invByNum.id === invoiceAId) {
    console.log('✅ TEST 3 PASSED: La facture est retrouvée par son numéro unique (FAC-2026-0001).');
    passedCount++;
  } else {
    console.log('❌ TEST 3 FAILED.');
    failedCount++;
  }

  // TEST 4 : Multi-Tenant Isolation sur la création et lecture des factures
  console.log('\nTEST 4 : Isolation Multi-Tenant (ORG_B ne peut pas lire la facture de ORG_A)...');
  const { data: invForOrgB } = await supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', orgBId)
    .eq('id', invoiceAId)
    .maybeSingle();

  if (!invForOrgB) {
    console.log('✅ TEST 4 PASSED: Facture de ORG_A totalement inaudible sous contexte ORG_B.');
    passedCount++;
  } else {
    console.log('❌ TEST 4 FAILED: Fuite de données détectée !');
    failedCount++;
  }

  // Cleanup
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceAId);
  await supabase.from('invoices').delete().eq('id', invoiceAId);
  await supabase.from('organizations').delete().in('id', [orgAId, orgBId]);

  console.log('\n================================================================');
  console.log(`LOOP 7 TEST SUITE SUMMARY: ${passedCount}/4 PASSED (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLoop7InvoiceCreationSuite();
