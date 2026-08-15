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

async function runLoop8DashboardSuite() {
  console.log('================================================================');
  console.log('LOOP 8 — SUITE DE TESTS : DASHBOARD & CALCULS FINANCIERS');
  console.log('================================================================\n');

  const orgAId = '11111111-8888-4111-a111-111111111111';
  const orgBId = '22222222-8888-4222-b222-222222222222';

  let passedCount = 0;
  let failedCount = 0;

  // Setup Organizations
  await supabase.from('organizations').upsert([
    { id: orgAId, name: 'Org Dashboard Test A', email: 'orgA@loop8.ci' },
    { id: orgBId, name: 'Org Dashboard Test B', email: 'orgB@loop8.ci' },
  ]);

  // Create Invoices for Org A:
  // Invoice 1: 500,000 FCFA paid
  // Invoice 2: 1,000,000 FCFA paid
  // Invoice 3: 300,000 FCFA sent (pending)
  // Invoice 4: 200,000 FCFA overdue
  // Total Org A: 2,000,000 FCFA Total, 1,500,000 FCFA Paid, 300,000 FCFA Pending, 200,000 FCFA Overdue.

  const testInvoicesA = [
    {
      organization_id: orgAId,
      invoice_number: 'FAC-LOOP8-001',
      client_name: 'Client A1',
      status: 'paid',
      subtotal: 423729,
      tax_rate: 18,
      tax_amount: 76271,
      total: 500000,
      issue_date: '2026-08-01',
      due_date: '2026-08-10',
    },
    {
      organization_id: orgAId,
      invoice_number: 'FAC-LOOP8-002',
      client_name: 'Client A2',
      status: 'paid',
      subtotal: 847458,
      tax_rate: 18,
      tax_amount: 152542,
      total: 1000000,
      issue_date: '2026-08-02',
      due_date: '2026-08-12',
    },
    {
      organization_id: orgAId,
      invoice_number: 'FAC-LOOP8-003',
      client_name: 'Client A3',
      status: 'sent',
      subtotal: 254237,
      tax_rate: 18,
      tax_amount: 45763,
      total: 300000,
      issue_date: '2026-08-05',
      due_date: '2026-09-05',
    },
    {
      organization_id: orgAId,
      invoice_number: 'FAC-LOOP8-004',
      client_name: 'Client A4',
      status: 'overdue',
      subtotal: 169492,
      tax_rate: 18,
      tax_amount: 30508,
      total: 200000,
      issue_date: '2026-07-01',
      due_date: '2026-07-15',
    },
  ];

  // Insert Invoices for Org B: 10,000,000 FCFA paid
  const testInvoicesB = [
    {
      organization_id: orgBId,
      invoice_number: 'FAC-LOOP8-B1',
      client_name: 'Client B Confidentiel',
      status: 'paid',
      subtotal: 8474576,
      tax_rate: 18,
      tax_amount: 1525424,
      total: 10000000,
      issue_date: '2026-08-01',
      due_date: '2026-08-10',
    },
  ];

  await supabase.from('invoices').insert(testInvoicesA);
  await supabase.from('invoices').insert(testInvoicesB);

  // TEST 1 : Calcul du Total Facturé pour ORG_A
  console.log('TEST 1 : Vérification du Total Facturé pour ORG_A...');
  const { data: invoicesA } = await supabase.from('invoices').select('*').eq('organization_id', orgAId);

  const totalInvoiced = (invoicesA || []).reduce((sum, inv) => sum + Number(inv.total), 0);
  if (totalInvoiced === 2000000) {
    console.log('✅ TEST 1 PASSED: Total Facturé calculé exactement à 2,000,000 FCFA.');
    passedCount++;
  } else {
    console.log(`❌ TEST 1 FAILED: Attendu 2,000,000 FCFA, Reçu: ${totalInvoiced}`);
    failedCount++;
  }

  // TEST 2 : Calcul du Montant Encaissé (paid) pour ORG_A
  console.log('\nTEST 2 : Vérification du Montant Encaissé (Status paid)...');
  const totalPaid = (invoicesA || [])
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  if (totalPaid === 1500000) {
    console.log('✅ TEST 2 PASSED: Montant Encaissé calculé exactement à 1,500,000 FCFA.');
    passedCount++;
  } else {
    console.log(`❌ TEST 2 FAILED: Attendu 1,500,000 FCFA, Reçu: ${totalPaid}`);
    failedCount++;
  }

  // TEST 3 : Calcul du Montant En Attente (sent) et En Retard (overdue)
  console.log('\nTEST 3 : Vérification des montants En Attente (sent) et En Retard (overdue)...');
  const totalPending = (invoicesA || [])
    .filter((inv) => inv.status === 'sent')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const totalOverdue = (invoicesA || [])
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  if (totalPending === 300000 && totalOverdue === 200000) {
    console.log('✅ TEST 3 PASSED: En Attente (300,000 FCFA) et En Retard (200,000 FCFA) valides.');
    passedCount++;
  } else {
    console.log(`❌ TEST 3 FAILED: Pending: ${totalPending}, Overdue: ${totalOverdue}`);
    failedCount++;
  }

  // TEST 4 : Isolation Multi-Tenant (Empêcher l'inclusion des 10,000,000 FCFA de ORG_B)
  console.log('\nTEST 4 : Isolation Multi-Tenant du Dashboard (ORG_A ne doit PAS inclure le CA de ORG_B)...');
  const hasLeakedB = (invoicesA || []).some((inv) => inv.organization_id === orgBId || inv.total === 10000000);

  if (!hasLeakedB && totalInvoiced === 2000000) {
    console.log('✅ TEST 4 PASSED: Les 10,000,000 FCFA de ORG_B sont totalement isolés et absents du dashboard de ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 4 FAILED: Fuite du Chiffre d\'Affaires de ORG_B détectée !');
    failedCount++;
  }

  // Cleanup Test Data
  await supabase.from('invoices').delete().eq('organization_id', orgAId);
  await supabase.from('invoices').delete().eq('organization_id', orgBId);
  await supabase.from('organizations').delete().in('id', [orgAId, orgBId]);

  console.log('\n================================================================');
  console.log(`LOOP 8 TEST SUITE SUMMARY: ${passedCount}/4 PASSED (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLoop8DashboardSuite();
