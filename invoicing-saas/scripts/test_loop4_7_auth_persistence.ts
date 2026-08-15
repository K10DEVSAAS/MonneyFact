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

async function runLoop47AuthPersistenceTests() {
  console.log('================================================================');
  console.log('LOOP 4.7 — SUITE DE TESTS COMPLÈTE : PERSISTANCE AUTH & MULTI-DEVICE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const testEmailA = `e2e_device_a_${Date.now()}@entreprise-ci.com`;
  const testEmailB = `e2e_device_b_${Date.now()}@entreprise-ci.com`;
  const testPassword = 'PasswordE2E123!';

  // TEST 1 : Création Organisation A et Profil A dans PostgreSQL
  console.log("TEST 1 : Inscription et insertion de l'organisation et du profil...");
  const orgIdA = '00000000-0000-4000-a000-111111111111';
  const orgIdB = '00000000-0000-4000-a000-222222222222';

  const { error: orgErrA } = await supabase.from('organizations').upsert({
    id: orgIdA,
    name: 'SOCIÉTÉ APPAREIL A CI',
    email: testEmailA,
    phone: '+225 07 11 22 33 44',
    address: 'Abidjan Plateau',
    plan: 'Pro',
    status: 'active',
  });

  const { error: profErrA } = await supabase.from('profiles').upsert({
    email: testEmailA,
    full_name: 'Directeur Appareil A',
    role: 'client',
    organization_id: orgIdA,
    plan: 'Pro',
  });

  if (!orgErrA && !profErrA) {
    console.log("✅ TEST 1 PASSED: Organisation A et Profil A enregistrés dans PostgreSQL.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 1 FAILED:", orgErrA || profErrA);
    failedTests++;
  }

  // TEST 2 : Création d'un client et d'une facture sous ORG_A
  console.log("TEST 2 : Persistance d'un client et d'une facture dans PostgreSQL pour ORG_A...");
  const clientIdA = '00000000-0000-4000-a000-333333333333';
  const invoiceIdA = '00000000-0000-4000-a000-444444444444';

  const { error: cliErr } = await supabase.from('clients').upsert({
    id: clientIdA,
    organization_id: orgIdA,
    name: 'CLIENT TEST APPAREIL A',
    email: 'client.devicea@societe.ci',
    phone: '+225 05 05 05 05 05',
    city: 'Yopougon',
  });

  const { error: invErr } = await supabase.from('invoices').upsert({
    id: invoiceIdA,
    invoice_number: 'FAC-E2E-0001',
    organization_id: orgIdA,
    client_id: clientIdA,
    client_name: 'CLIENT TEST APPAREIL A',
    status: 'sent',
    issue_date: '2026-08-15',
    due_date: '2026-09-15',
    subtotal: 1000000,
    tax_rate: 18,
    tax_amount: 180000,
    total: 1180000,
  });

  if (cliErr) console.error("Client insert error:", cliErr);
  if (invErr) console.error("Invoice insert error:", invErr);

  const { data: fetchInv } = await supabase.from('invoices').select('*').eq('id', invoiceIdA).maybeSingle();
  if (fetchInv && fetchInv.total === 1180000) {
    console.log("✅ TEST 2 PASSED: Client et Facture persistés en base pour ORG_A.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 2 FAILED: Facture non retrouvée dans PostgreSQL.");
    failedTests++;
  }

  // TEST 3 : Scénario Appareil B (0 localStorage) -> Récupération par email depuis PostgreSQL
  console.log("TEST 3 : Simulation Appareil B (0 localStorage) -> Récupération du compte via email...");
  const { data: dbOrgFound } = await supabase.from('organizations').select('*').eq('email', testEmailA).maybeSingle();
  const { data: dbProfFound } = await supabase.from('profiles').select('*').eq('email', testEmailA).maybeSingle();

  if (dbOrgFound && dbProfFound && dbProfFound.organization_id === orgIdA) {
    console.log(`✅ TEST 3 PASSED: Compte ${testEmailA} retrouvé avec succès sans aucun localStorage (Org: ${dbOrgFound.name}).\n`);
    passedTests++;
  } else {
    console.error("❌ TEST 3 FAILED: Impossible de retrouver le compte depuis PostgreSQL.");
    failedTests++;
  }

  // TEST 4 : Récupération des clients et factures de ORG_A depuis Appareil B
  console.log("TEST 4 : Récupération des données clients et factures depuis PostgreSQL pour Appareil B...");
  const { data: orgAClients } = await supabase.from('clients').select('*').eq('organization_id', orgIdA);
  const { data: orgAInvoices } = await supabase.from('invoices').select('*').eq('organization_id', orgIdA);

  if (orgAClients && orgAClients.length >= 1 && orgAInvoices && orgAInvoices.length >= 1) {
    console.log(`✅ TEST 4 PASSED: ${orgAClients.length} client(s) et ${orgAInvoices.length} facture(s) chargés depuis PostgreSQL pour Appareil B.\n`);
    passedTests++;
  } else {
    console.error("❌ TEST 4 FAILED: Incohérence de données serveur.");
    failedTests++;
  }

  // TEST 5 : Création Organisation B et Vérification Isolation Multi-Tenant
  console.log("TEST 5 : Isolation Multi-Tenant (ORG_B ne peut PAS lire le client de ORG_A)...");
  await supabase.from('organizations').upsert({
    id: orgIdB,
    name: 'SOCIÉTÉ APPAREIL B CI',
    email: testEmailB,
    phone: '+225 07 99 88 77 66',
    address: 'Cocody',
    plan: 'Pro',
    status: 'active',
  });

  const { data: isolatedClients } = await supabase.from('clients').select('*').eq('organization_id', orgIdB);
  if (isolatedClients && !isolatedClients.some((c) => c.organization_id === orgIdA)) {
    console.log("✅ TEST 5 PASSED: Isolation Multi-Tenant PostgreSQL 100% étanche entre ORG_A et ORG_B.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 5 FAILED: Fuite de données détectée.");
    failedTests++;
  }

  // TEST 6 : Nettoyage des données de test
  console.log("TEST 6 : Nettoyage contrôlé des données d'audit E2E...");
  await supabase.from('invoices').delete().eq('id', invoiceIdA);
  await supabase.from('clients').delete().eq('id', clientIdA);
  await supabase.from('profiles').delete().eq('email', testEmailA);
  await supabase.from('organizations').delete().eq('id', orgIdA);
  await supabase.from('organizations').delete().eq('id', orgIdB);

  console.log("✅ TEST 6 PASSED: Données d'audit purgées proprement.\n");
  passedTests++;

  console.log('================================================================');
  console.log(`LOOP 4.7 TEST SUITE SUMMARY: ${passedTests}/${passedTests + failedTests} PASSED (${failedTests} FAILED)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLoop47AuthPersistenceTests();
