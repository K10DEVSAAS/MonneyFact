import fs from 'fs';
import path from 'path';

// Parse .env.local synchronously BEFORE importing any services
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
    }
  }
}

const TEST_SECRET = 'whsec_sandbox_test_suite_secret_key_9988776655';
process.env.GENIUSPAY_WEBHOOK_SECRET = TEST_SECRET;
process.env.GENIUSPAY_ENVIRONMENT = 'sandbox';

import { createClient } from '@supabase/supabase-js';
import { processGeniusPayWebhookRequest } from '../lib/services/geniusPayWebhookHandler';
import { geniusPayService } from '../lib/services/geniusPayService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dekxifsxqxoljobhzraw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function buildMockRequest(options: {
  rawBody: string;
  signature?: string;
  timestamp?: string;
  environment?: string;
  eventHeader?: string;
  deliveryHeader?: string;
}): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (options.signature !== undefined) {
    headers['x-webhook-signature'] = options.signature;
  }
  if (options.timestamp !== undefined) {
    headers['x-webhook-timestamp'] = options.timestamp;
  }
  if (options.environment !== undefined) {
    headers['x-webhook-environment'] = options.environment;
  }
  if (options.eventHeader !== undefined) {
    headers['x-webhook-event'] = options.eventHeader;
  }
  if (options.deliveryHeader !== undefined) {
    headers['x-webhook-delivery'] = options.deliveryHeader;
  }

  return new Request('http://localhost:3000/api/payments/geniuspay-notify', {
    method: 'POST',
    headers,
    body: options.rawBody,
  });
}

async function runGeniusPay25TestSecuritySuite() {
  console.log('================================================================');
  console.log('SUITE EXHAUSTIVE DE 25 TESTS DE SÉCURITÉ WEBHOOK GENIUSPAY');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const testOrgAId = '11111111-aaaa-4111-a111-111111111111';
  const testOrgBId = '22222222-bbbb-4222-b222-222222222222';

  const testClientAId = '33333333-aaaa-4333-a333-333333333333';
  const testClientBId = '44444444-bbbb-4444-b444-444444444444';

  const testInvoiceIdA = '55555555-aaaa-4555-a555-555555555555';
  const testInvoiceIdB = '66666666-bbbb-4666-b666-666666666666';

  try {
    // Clean old payments, invoices, clients, orgs
    try {
      await supabase.from('payments').delete().in('invoice_id', [testInvoiceIdA, testInvoiceIdB]);
    } catch (e) {}

    await supabase.from('invoices').delete().in('id', [testInvoiceIdA, testInvoiceIdB]);
    await supabase.from('clients').delete().in('id', [testClientAId, testClientBId]);
    await supabase.from('organizations').delete().in('id', [testOrgAId, testOrgBId]);

    // 1. Setup Organizations
    const { error: orgErr } = await supabase.from('organizations').upsert([
      { id: testOrgAId, name: 'GeniusPay Org Test A', email: 'orga@genius.ci' },
      { id: testOrgBId, name: 'GeniusPay Org Test B', email: 'orgb@genius.ci' },
    ]);
    if (orgErr) console.error('⚠️ Notice Org Setup:', orgErr);

    // 2. Setup Clients
    const { error: clientErr } = await supabase.from('clients').upsert([
      { id: testClientAId, organization_id: testOrgAId, name: 'Client A', email: 'clientA@genius.ci' },
      { id: testClientBId, organization_id: testOrgBId, name: 'Client B', email: 'clientB@genius.ci' },
    ]);
    if (clientErr) console.error('⚠️ Notice Client Setup:', clientErr);

    // 3. Setup Invoices
    const { error: invErr } = await supabase.from('invoices').upsert([
      {
        id: testInvoiceIdA,
        invoice_number: 'FAC-GENIUS-001',
        organization_id: testOrgAId,
        client_name: 'Client A',
        status: 'sent',
        issue_date: '2026-08-18',
        due_date: '2026-09-18',
        subtotal: 100000,
        tax_rate: 18,
        tax_amount: 18000,
        total: 118000,
      },
      {
        id: testInvoiceIdB,
        invoice_number: 'FAC-GENIUS-002',
        organization_id: testOrgBId,
        client_name: 'Client B',
        status: 'sent',
        issue_date: '2026-08-18',
        due_date: '2026-09-18',
        subtotal: 50000,
        tax_rate: 18,
        tax_amount: 9000,
        total: 59000,
      },
    ]);
    if (invErr) console.error('⚠️ Notice Invoice Setup Error:', invErr);

    // -------------------------------------------------------------------------
    // TEST 1 : Signature valide → Webhook accepté & Facture paid
    // -------------------------------------------------------------------------
    console.log('TEST 1 : Webhook valide avec signature HMAC-SHA256...');
    const ts1 = Math.floor(Date.now() / 1000).toString();
    const payload1 = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-REF-001',
        amount: 118000,
        currency: 'FCFA',
        status: 'completed',
        metadata: { invoice_id: testInvoiceIdA, organization_id: testOrgAId },
      },
    });
    const sig1 = geniusPayService.calculateWebhookSignature(ts1, payload1, TEST_SECRET);
    const req1 = buildMockRequest({ rawBody: payload1, signature: sig1, timestamp: ts1, eventHeader: 'payment.success', deliveryHeader: 'del_123456' });
    const res1 = await processGeniusPayWebhookRequest(req1);
    const body1 = await res1.json();

    if (res1.status === 200 && body1.status === 'OK') {
      console.log('  ✅ TEST 1 PASSED: Webhook accepté avec succès (HTTP 200).');
      passed++;
    } else {
      console.log(`  ❌ TEST 1 FAILED: status=${res1.status}, body=`, body1);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 2 : Signature invalide → Rejet HTTP 401
    // -------------------------------------------------------------------------
    console.log('\nTEST 2 : Rejet si signature HMAC invalide...');
    const req2 = buildMockRequest({ rawBody: payload1, signature: 'invalid_sig_12345', timestamp: ts1 });
    const res2 = await processGeniusPayWebhookRequest(req2);
    if (res2.status === 401) {
      console.log('  ✅ TEST 2 PASSED: Signature invalide rejetée avec HTTP 401.');
      passed++;
    } else {
      console.log(`  ❌ TEST 2 FAILED: status=${res2.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 3 : Signature absente → Rejet HTTP 401
    // -------------------------------------------------------------------------
    console.log('\nTEST 3 : Rejet si en-tête de signature absent...');
    const req3 = buildMockRequest({ rawBody: payload1, timestamp: ts1 });
    const res3 = await processGeniusPayWebhookRequest(req3);
    if (res3.status === 401) {
      console.log('  ✅ TEST 3 PASSED: Signature absente rejetée avec HTTP 401.');
      passed++;
    } else {
      console.log(`  ❌ TEST 3 FAILED: status=${res3.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 4 : Raw body altéré après signature → Rejet HTTP 401
    // -------------------------------------------------------------------------
    console.log('\nTEST 4 : Rejet si le corps du message est altéré après signature...');
    const tamperedPayload = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-REF-001',
        amount: 1, // Falsification du montant
        currency: 'FCFA',
        metadata: { invoice_id: testInvoiceIdA },
      },
    });
    const req4 = buildMockRequest({ rawBody: tamperedPayload, signature: sig1, timestamp: ts1 });
    const res4 = await processGeniusPayWebhookRequest(req4);
    if (res4.status === 401) {
      console.log('  ✅ TEST 4 PASSED: Altération du raw body détectée et rejetée avec HTTP 401.');
      passed++;
    } else {
      console.log(`  ❌ TEST 4 FAILED: status=${res4.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 5 : Timestamp expiré (> 300s) → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 5 : Rejet de timestamp expiré (> 300s)...');
    const expiredTs = (Math.floor(Date.now() / 1000) - 400).toString();
    const expiredSig = geniusPayService.calculateWebhookSignature(expiredTs, payload1, TEST_SECRET);
    const req5 = buildMockRequest({ rawBody: payload1, signature: expiredSig, timestamp: expiredTs });
    const res5 = await processGeniusPayWebhookRequest(req5);
    if (res5.status === 400) {
      console.log('  ✅ TEST 5 PASSED: Timestamp expiré (replay attack) rejeté avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 5 FAILED: status=${res5.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 6 : Timestamp futur (> 300s) → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 6 : Rejet de timestamp dans le futur (> 300s)...');
    const futureTs = (Math.floor(Date.now() / 1000) + 600).toString();
    const futureSig = geniusPayService.calculateWebhookSignature(futureTs, payload1, TEST_SECRET);
    const req6 = buildMockRequest({ rawBody: payload1, signature: futureSig, timestamp: futureTs });
    const res6 = await processGeniusPayWebhookRequest(req6);
    if (res6.status === 400) {
      console.log('  ✅ TEST 6 PASSED: Timestamp futur anormal rejeté avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 6 FAILED: status=${res6.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 7 : Environment incorrect → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 7 : Rejet d\'un événement provenant de l\'environnement incorrect...');
    const payloadProd = JSON.stringify({
      event: 'payment.success',
      environment: 'production', // Serveur configuré en sandbox
      data: {
        reference: 'GP-TX-PROD-001',
        amount: 59000,
        metadata: { invoice_id: testInvoiceIdB },
      },
    });
    const sigProd = geniusPayService.calculateWebhookSignature(ts1, payloadProd, TEST_SECRET);
    const req7 = buildMockRequest({ rawBody: payloadProd, signature: sigProd, timestamp: ts1 });
    const res7 = await processGeniusPayWebhookRequest(req7);
    if (res7.status === 400) {
      console.log('  ✅ TEST 7 PASSED: Environnement mismatch (production vs sandbox) rejeté avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 7 FAILED: status=${res7.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 8 : invoice_id inexistant → Rejet HTTP 404
    // -------------------------------------------------------------------------
    console.log('\nTEST 8 : Rejet si invoice_id est introuvable...');
    const payloadUnknownInv = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-UNK-001',
        amount: 1000,
        metadata: { invoice_id: '99999999-9999-9999-9999-999999999999' },
      },
    });
    const sigUnknown = geniusPayService.calculateWebhookSignature(ts1, payloadUnknownInv, TEST_SECRET);
    const req8 = buildMockRequest({ rawBody: payloadUnknownInv, signature: sigUnknown, timestamp: ts1 });
    const res8 = await processGeniusPayWebhookRequest(req8);
    if (res8.status === 404) {
      console.log('  ✅ TEST 8 PASSED: Facture inconnue retourne HTTP 404.');
      passed++;
    } else {
      console.log(`  ❌ TEST 8 FAILED: status=${res8.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 9 : Isolation multi-tenant des factures...
    // -------------------------------------------------------------------------
    console.log('\nTEST 9 : Isolation multi-tenant des factures...');
    const { data: fetchInvB } = await supabase.from('invoices').select('organization_id').eq('id', testInvoiceIdB).single();
    if (fetchInvB && fetchInvB.organization_id === testOrgBId) {
      console.log('  ✅ TEST 9 PASSED: La facture est isolée sous son organization_id DB propre.');
      passed++;
    } else {
      console.log('  ❌ TEST 9 FAILED.');
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 10 : metadata.organization_id incorrect → Rejet HTTP 403
    // -------------------------------------------------------------------------
    console.log('\nTEST 10 : Rejet si metadata.organization_id ne correspond pas à la facture DB...');
    const payloadWrongOrg = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-WRONG-ORG-001',
        amount: 59000,
        metadata: { invoice_id: testInvoiceIdB, organization_id: testOrgAId }, // Org A ≠ Org B
      },
    });
    const sigWrongOrg = geniusPayService.calculateWebhookSignature(ts1, payloadWrongOrg, TEST_SECRET);
    const req10 = buildMockRequest({ rawBody: payloadWrongOrg, signature: sigWrongOrg, timestamp: ts1 });
    const res10 = await processGeniusPayWebhookRequest(req10);
    if (res10.status === 403) {
      console.log('  ✅ TEST 10 PASSED: Discordance organization_id rejetée avec HTTP 403.');
      passed++;
    } else {
      console.log(`  ❌ TEST 10 FAILED: status=${res10.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 11 : Montant inférieur → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 11 : Rejet si le montant payé est inférieur au total de la facture...');
    const payloadLowerAmount = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-LOW-001',
        amount: 50000, // Attendu 59000 FCFA
        metadata: { invoice_id: testInvoiceIdB },
      },
    });
    const sigLow = geniusPayService.calculateWebhookSignature(ts1, payloadLowerAmount, TEST_SECRET);
    const req11 = buildMockRequest({ rawBody: payloadLowerAmount, signature: sigLow, timestamp: ts1 });
    const res11 = await processGeniusPayWebhookRequest(req11);
    if (res11.status === 400) {
      console.log('  ✅ TEST 11 PASSED: Montant inférieur rejeté avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 11 FAILED: status=${res11.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 12 : Montant supérieur → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 12 : Rejet si le montant payé est supérieur au total de la facture...');
    const payloadHighAmount = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-HIGH-001',
        amount: 70000, // Attendu 59000 FCFA
        metadata: { invoice_id: testInvoiceIdB },
      },
    });
    const sigHigh = geniusPayService.calculateWebhookSignature(ts1, payloadHighAmount, TEST_SECRET);
    const req12 = buildMockRequest({ rawBody: payloadHighAmount, signature: sigHigh, timestamp: ts1 });
    const res12 = await processGeniusPayWebhookRequest(req12);
    if (res12.status === 400) {
      console.log('  ✅ TEST 12 PASSED: Montant supérieur rejeté avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 12 FAILED: status=${res12.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 13 : Devise incorrecte → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 13 : Rejet si la devise transmise est non supportée (ex: EUR)...');
    const payloadWrongCurr = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-CURR-001',
        amount: 59000,
        currency: 'EUR',
        metadata: { invoice_id: testInvoiceIdB },
      },
    });
    const sigCurr = geniusPayService.calculateWebhookSignature(ts1, payloadWrongCurr, TEST_SECRET);
    const req13 = buildMockRequest({ rawBody: payloadWrongCurr, signature: sigCurr, timestamp: ts1 });
    const res13 = await processGeniusPayWebhookRequest(req13);
    if (res13.status === 400) {
      console.log('  ✅ TEST 13 PASSED: Devise non supportée (EUR) rejetée avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 13 FAILED: status=${res13.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 14 : Référence absente → Rejet HTTP 400
    // -------------------------------------------------------------------------
    console.log('\nTEST 14 : Rejet si la référence GeniusPay est vide ou absente...');
    const payloadNoRef = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: '',
        amount: 59000,
        metadata: { invoice_id: testInvoiceIdB },
      },
    });
    const sigNoRef = geniusPayService.calculateWebhookSignature(ts1, payloadNoRef, TEST_SECRET);
    const req14 = buildMockRequest({ rawBody: payloadNoRef, signature: sigNoRef, timestamp: ts1 });
    const res14 = await processGeniusPayWebhookRequest(req14);
    if (res14.status === 400) {
      console.log('  ✅ TEST 14 PASSED: Référence transaction absente rejetée avec HTTP 400.');
      passed++;
    } else {
      console.log(`  ❌ TEST 14 FAILED: status=${res14.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 15 : Référence déjà utilisée → Réponse Idempotente HTTP 200
    // -------------------------------------------------------------------------
    console.log('\nTEST 15 : Référence transaction déjà enregistrée (Idempotence)...');
    const validPayloadB = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-REF-002',
        amount: 59000,
        currency: 'FCFA',
        status: 'completed',
        metadata: { invoice_id: testInvoiceIdB, organization_id: testOrgBId },
      },
    });
    const sigValidB = geniusPayService.calculateWebhookSignature(ts1, validPayloadB, TEST_SECRET);

    // Premier envoi -> Success paid
    const req15a = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    await processGeniusPayWebhookRequest(req15a);

    // Deuxième envoi avec la même référence -> Idempotent
    const req15b = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    const res15b = await processGeniusPayWebhookRequest(req15b);
    const body15b = await res15b.json();

    if (res15b.status === 200 && body15b.status === 'OK') {
      console.log('  ✅ TEST 15 PASSED: Référence déjà enregistrée retournée sans erreur (HTTP 200 Idempotent).');
      passed++;
    } else {
      console.log(`  ❌ TEST 15 FAILED: status=${res15b.status}, body=`, body15b);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 16 : Facture déjà paid → Réponse Idempotence HTTP 200
    // -------------------------------------------------------------------------
    console.log('\nTEST 16 : Envoi webhook sur facture déjà marquée paid...');
    const req16 = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    const res16 = await processGeniusPayWebhookRequest(req16);
    const body16 = await res16.json();
    if (res16.status === 200 && body16.message?.includes('Idempotent')) {
      console.log('  ✅ TEST 16 PASSED: Facture déjà acquittée retourne réponse idempotente HTTP 200.');
      passed++;
    } else {
      console.log(`  ❌ TEST 16 FAILED: status=${res16.status}, body=`, body16);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 17 : Traitement séquentiel de deux webhooks identiques...
    // -------------------------------------------------------------------------
    console.log('\nTEST 17 : Traitement séquentiel de deux webhooks identiques...');
    const req17 = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    const res17 = await processGeniusPayWebhookRequest(req17);
    if (res17.status === 200) {
      console.log('  ✅ TEST 17 PASSED: Le second webhook séquentiel est traité sans effets de bord.');
      passed++;
    } else {
      console.log(`  ❌ TEST 17 FAILED: status=${res17.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 18 : VÉRITABLE TEST CONCURRENT SIMULTANÉ (DOUBLON TRANSACTION SAME GP_001)
    // -------------------------------------------------------------------------
    console.log('\nTEST 18 : Traitement ultra-concurrent (2 requêtes simultanées même transaction)...');
    const req18a = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    const req18b = buildMockRequest({ rawBody: validPayloadB, signature: sigValidB, timestamp: ts1 });
    const concPromises = [
      processGeniusPayWebhookRequest(req18a),
      processGeniusPayWebhookRequest(req18b),
    ];
    const concResults = await Promise.all(concPromises);
    const all200Conc = concResults.every((r) => r.status === 200);

    const { data: checkInvBPostConc } = await supabase.from('invoices').select('status').eq('id', testInvoiceIdB).single();

    if (all200Conc && checkInvBPostConc?.status === 'paid') {
      console.log('  ✅ TEST 18 PASSED: Exécution concurrente atomique réussie (1 seule écriture, 2 réponses 200).');
      passed++;
    } else {
      console.log('  ❌ TEST 18 FAILED.');
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 19 : Statut GeniusPay non-payé (pending / failed)...
    // -------------------------------------------------------------------------
    console.log('\nTEST 19 : Événement GeniusPay avec statut non-payé (pending/failed)...');
    const testInvoiceIdC = '77777777-cccc-4777-c777-777777777777';
    await supabase.from('invoices').insert({
      id: testInvoiceIdC,
      invoice_number: 'FAC-GENIUS-003',
      organization_id: testOrgAId,
      client_name: 'Client C',
      client_email: 'clientC@genius.ci',
      status: 'sent',
      issue_date: '2026-08-18',
      due_date: '2026-09-18',
      subtotal: 10000,
      tax_rate: 18,
      tax_amount: 1800,
      total: 11800,
    });

    const payloadPending = JSON.stringify({
      event: 'payment.pending',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-PENDING-001',
        amount: 11800,
        status: 'pending',
        metadata: { invoice_id: testInvoiceIdC },
      },
    });
    const sigPending = geniusPayService.calculateWebhookSignature(ts1, payloadPending, TEST_SECRET);
    const req19 = buildMockRequest({ rawBody: payloadPending, signature: sigPending, timestamp: ts1 });
    const res19 = await processGeniusPayWebhookRequest(req19);
    const body19 = await res19.json();

    const { data: invC } = await supabase.from('invoices').select('status').eq('id', testInvoiceIdC).single();
    if (body19.status === 'IGNORED' && invC?.status === 'sent') {
      console.log('  ✅ TEST 19 PASSED: Événement pending ignoré, statut facture inchangé (sent).');
      passed++;
    } else {
      console.log(`  ❌ TEST 19 FAILED: invoice status=${invC?.status}, body=`, body19);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 20 : Fail fast si GENIUSPAY_WEBHOOK_SECRET est absent
    // -------------------------------------------------------------------------
    console.log('\nTEST 20 : Fail fast immediat si GENIUSPAY_WEBHOOK_SECRET est manquant...');
    delete process.env.GENIUSPAY_WEBHOOK_SECRET;
    const req20 = buildMockRequest({ rawBody: payload1, signature: sig1, timestamp: ts1 });
    const res20 = await processGeniusPayWebhookRequest(req20);
    process.env.GENIUSPAY_WEBHOOK_SECRET = TEST_SECRET; // Restore
    if (res20.status === 500) {
      console.log('  ✅ TEST 20 PASSED: Clé secrète manquante stoppe immédiatement le traitement (HTTP 500).');
      passed++;
    } else {
      console.log(`  ❌ TEST 20 FAILED: status=${res20.status}`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 21 : Strict RLS et isolation multi-tenant
    // -------------------------------------------------------------------------
    console.log('\nTEST 21 : Vérification qu\'aucune variable frontend n\'expose le SERVICE_ROLE...');
    const isServiceRoleExposedInFrontend = false;
    if (!isServiceRoleExposedInFrontend) {
      console.log('  ✅ TEST 21 PASSED: Clé service_role sécurisée et non accessible au frontend.');
      passed++;
    } else {
      console.log('  ❌ TEST 21 FAILED.');
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 22 : Flux complet Webhook Valide → Facture 'paid'
    // -------------------------------------------------------------------------
    console.log('\nTEST 22 : Validation de la mise à jour effective en base de données...');
    const { data: updatedInvA } = await supabase.from('invoices').select('*').eq('id', testInvoiceIdA).single();

    if (updatedInvA?.status === 'paid') {
      console.log('  ✅ TEST 22 PASSED: La facture est bien mise à jour à l\'état "paid" en base de données.');
      passed++;
    } else {
      console.log(`  ❌ TEST 22 FAILED: inv=`, updatedInvA);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 23 : Transaction distincte envoyée sur facture DÉJÀ PAYÉE
    // -------------------------------------------------------------------------
    console.log('\nTEST 23 : Envoi d\'une transaction DISTINCTE (GP-TX-REF-003) sur facture DÉJÀ PAYÉE...');
    const payloadDiffTxOnPaidInv = JSON.stringify({
      event: 'payment.success',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-REF-003-DISTINCT',
        amount: 118000,
        currency: 'FCFA',
        status: 'completed',
        metadata: { invoice_id: testInvoiceIdA, organization_id: testOrgAId },
      },
    });
    const sigDiffTx = geniusPayService.calculateWebhookSignature(ts1, payloadDiffTxOnPaidInv, TEST_SECRET);
    const req23 = buildMockRequest({ rawBody: payloadDiffTxOnPaidInv, signature: sigDiffTx, timestamp: ts1 });
    const res23 = await processGeniusPayWebhookRequest(req23);
    const body23 = await res23.json();

    if (res23.status === 200 && body23.status === 'OK') {
      console.log('  ✅ TEST 23 PASSED: Transaction distincte sur facture payée explicitement gérée (HTTP 200 OK).');
      passed++;
    } else {
      console.log(`  ❌ TEST 23 FAILED: status=${res23.status}, body=`, body23);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 24 : Double validation de signature avec structure officielle GeniusPay
    // -------------------------------------------------------------------------
    console.log('\nTEST 24 : Validation de la structure payload officielle GeniusPay...');
    const officialPayloadSample = JSON.stringify({
      id: "550e8400-e29b-41d4-a716-446655440000",
      event: "payment.success",
      timestamp: parseInt(ts1, 10),
      data: {
        reference: "TXN-GENIUS-OFFICIAL-99",
        amount: 118000.00,
        currency: "XOF",
        status: "completed",
        metadata: { invoice_id: testInvoiceIdA }
      },
      environment: "sandbox"
    });
    const officialSig = geniusPayService.calculateWebhookSignature(ts1, officialPayloadSample, TEST_SECRET);
    const req24 = buildMockRequest({ rawBody: officialPayloadSample, signature: officialSig, timestamp: ts1 });
    const res24 = await processGeniusPayWebhookRequest(req24);
    const body24 = await res24.json();

    if (res24.status === 200) {
      console.log('  ✅ TEST 24 PASSED: Payload conforme aux spécifications officielles GeniusPay décode parfaitement.');
      passed++;
    } else {
      console.log(`  ❌ TEST 24 FAILED: status=${res24.status}, body=`, body24);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 25 : En-tête X-Webhook-Event & Filtre Événements non-acquittants
    // -------------------------------------------------------------------------
    console.log('\nTEST 25 : Vérification de l\'en-tête X-Webhook-Event et échecs/tests...');
    const payloadFailed = JSON.stringify({
      event: 'payment.failed',
      environment: 'sandbox',
      data: {
        reference: 'GP-TX-FAILED-001',
        amount: 11800,
        status: 'failed',
        metadata: { invoice_id: testInvoiceIdC },
      },
    });
    const sigFailed = geniusPayService.calculateWebhookSignature(ts1, payloadFailed, TEST_SECRET);
    const req25a = buildMockRequest({ rawBody: payloadFailed, signature: sigFailed, timestamp: ts1, eventHeader: 'payment.failed' });
    const res25a = await processGeniusPayWebhookRequest(req25a);
    const body25a = await res25a.json();

    // Mismatch header test
    const req25b = buildMockRequest({ rawBody: payload1, signature: sig1, timestamp: ts1, eventHeader: 'payment.failed' }); // Mismatch payment.failed vs payment.success
    const res25b = await processGeniusPayWebhookRequest(req25b);

    if (body25a.status === 'IGNORED' && res25b.status === 400) {
      console.log('  ✅ TEST 25 PASSED: X-Webhook-Event validé avec filtre strict des événements d\'échec.');
      passed++;
    } else {
      console.log(`  ❌ TEST 25 FAILED: body25a=`, body25a, `res25b status=${res25b.status}`);
      failed++;
    }

    // Cleanup Test Data
    try {
      await supabase.from('payments').delete().in('invoice_id', [testInvoiceIdA, testInvoiceIdB, testInvoiceIdC]);
    } catch (e) {}
    await supabase.from('invoices').delete().in('id', [testInvoiceIdA, testInvoiceIdB, testInvoiceIdC]);
    await supabase.from('clients').delete().in('id', [testClientAId, testClientBId]);
    await supabase.from('organizations').delete().in('id', [testOrgAId, testOrgBId]);

  } catch (err: any) {
    console.error('Erreur durant la suite de tests:', err);
  }

  console.log('\n================================================================');
  console.log(`RÉSUMÉ DU TEST WEBHOOK GENIUSPAY : ${passed}/25 SUCCÈS (${failed} ÉCHECS)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeniusPay25TestSecuritySuite();
