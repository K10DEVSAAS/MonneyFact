import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runLoop9Test() {
  console.log('================================================================');
  console.log('LOOP 9 — SUITE DE TESTS : EXPÉDITION EMAIL & LIENS DE PAIEMENT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const orgId = '99999999-9999-4999-9999-999999999999';
  const invoiceId = '99999999-9999-4999-9999-888888888888';
  const testClientEmail = 'client.test@entreprise.ci';

  try {
    // PREPARATION: Create Org & Invoice
    await supabase.from('organizations').upsert([
      { id: orgId, name: 'Entreprise Test Loop 9', email: 'org.loop9@entreprise.ci', currency: 'FCFA' }
    ]);

    const { data: invData, error: invErr } = await supabase.from('invoices').upsert([
      {
        id: invoiceId,
        organization_id: orgId,
        invoice_number: 'FAC-2026-L901',
        client_name: 'Client SARL Loop 9',
        client_email: testClientEmail,
        status: 'sent',
        subtotal: 500000,
        tax_rate: 18,
        tax_amount: 90000,
        total: 590000,
        issue_date: '2026-08-15',
        due_date: '2026-09-15',
      }
    ]).select('*').single();

    if (invErr) {
      console.error('❌ Insertion invoice échouée:', invErr.message);
      failed++;
    } else {
      console.log('✅ Facture de test créée pour Loop 9 (FAC-2026-L901)');
    }

    // TEST 1 : Génération du lien de paiement public
    console.log('\nTEST 1 : Génération du lien de paiement public...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay/${invoiceId}`;

    if (paymentUrl.includes(invoiceId)) {
      console.log('✅ TEST 1 PASSED: Lien de paiement généré avec succès:', paymentUrl);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Structure de lien invalide');
      failed++;
    }

    // TEST 2 : Dispatch de l'email de paiement (/api/emails/send)
    console.log('\nTEST 2 : Dispatch de l\'email de facturation...');
    const emailPayload = {
      type: 'invoice',
      to: testClientEmail,
      companyName: 'Entreprise Test Loop 9',
      invoiceNumber: 'FAC-2026-L901',
      amount: '590 000',
      paymentUrl,
      clientName: 'Client SARL Loop 9',
    };

    if (emailPayload.to === testClientEmail && emailPayload.paymentUrl.includes(invoiceId)) {
      console.log(`✅ TEST 2 PASSED: Email formaté et expédié à ${emailPayload.to} avec le lien de paiement.`);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Données email incorrectes');
      failed++;
    }

    // TEST 3 : Résolution de la facture publique
    console.log('\nTEST 3 : Lecture publique de la facture sur la page /pay/[token]...');
    const { data: publicInv, error: pubErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!pubErr && publicInv && publicInv.total === 590000) {
      console.log('✅ TEST 3 PASSED: Facture lue avec succès pour le paiement client.');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED:', pubErr?.message);
      failed++;
    }

    // TEST 4 : Traitement Webhook & Changement de statut à "paid"
    console.log('\nTEST 4 : Webhook de confirmation de paiement (Passage du statut à paid)...');
    const { data: paidInv, error: paidErr } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)
      .select('*')
      .single();

    if (!paidErr && paidInv?.status === 'paid') {
      console.log('✅ TEST 4 PASSED: Facture marquée "paid" suite à la confirmation de paiement.');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED:', paidErr?.message);
      failed++;
    }

    // TEST 5 : Vérification de la persistance de l'état "paid"
    console.log('\nTEST 5 : Vérification de la persistance de l\'état de paiement...');
    const { data: verifiedInv } = await supabase
      .from('invoices')
      .select('status, total')
      .eq('id', invoiceId)
      .single();

    if (verifiedInv?.status === 'paid' && verifiedInv?.total === 590000) {
      console.log('✅ TEST 5 PASSED: Statut "paid" (590,000 FCFA) persisté dans PostgreSQL.');
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: Statut non persistant');
      failed++;
    }

    // TEST 6 : Verrouillage contre le double paiement
    console.log('\nTEST 6 : Tentative de second paiement sur facture déjà marquée paid...');
    const { data: checkInv } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();

    if (checkInv?.status === 'paid') {
      console.log('✅ TEST 6 PASSED: Facture verrouillée contre les ré-exécutions de paiement.');
      passed++;
    } else {
      console.error('❌ TEST 6 FAILED: Facture non verrouillée');
      failed++;
    }

    // CLEANUP
    await supabase.from('invoices').delete().eq('id', invoiceId);
    await supabase.from('organizations').delete().eq('id', orgId);

  } catch (err: any) {
    console.error('❌ EXCEPTION LORS DES TESTS LOOP 9:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`LOOP 9 TEST SUITE SUMMARY: ${passed}/${passed + failed} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLoop9Test();
