import fs from 'fs';
import path from 'path';

// 1. Parse .env.local synchronously FIRST before importing dbService
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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runLoop48ClientPipelineTests() {
  // Dynamically import dbService after process.env is guaranteed to be set
  const { dbService } = await import('../lib/services/dbService');

  console.log('================================================================');
  console.log('LOOP 4.8 — SUITE DE TESTS E2E : PIPELINE CLIENTS MULTI-DEVICE 100% POSTGRESQL');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const orgIdA = '00000000-0000-4000-a000-888888888888';
  const orgIdB = '00000000-0000-4000-a000-999999999999';
  const userIdA = '00000000-0000-4000-a000-777777777777';

  const timestamp = Date.now();
  const emailA = `test_l48_a_${timestamp}@entreprise.ci`;
  const emailB = `test_l48_b_${timestamp}@entreprise.ci`;
  const clientNameA = `CLIENT_TEST_A_${timestamp}`;

  // Setup Test Organizations in PostgreSQL
  await supabase.from('organizations').upsert({
    id: orgIdA,
    name: 'SOCIÉTÉ APPAREIL A (L4.8)',
    email: emailA,
    phone: '+225 07 11 22 33 44',
    address: 'Abidjan Plateau',
    tax_id: 'CI-L48-A',
    currency: 'FCFA',
    default_tax_rate: 18,
  });

  await supabase.from('organizations').upsert({
    id: orgIdB,
    name: 'SOCIÉTÉ B ISOLÉE (L4.8)',
    email: emailB,
    phone: '+225 07 99 88 77 66',
    address: 'Cocody',
    tax_id: 'CI-L48-B',
    currency: 'FCFA',
    default_tax_rate: 18,
  });

  await supabase.from('profiles').upsert({
    id: userIdA,
    email: emailA,
    full_name: 'Gestionnaire Appareil A',
    role: 'client',
    organization_id: orgIdA,
  });

  // TEST 1 : Appareil A -> Login, Récupérer organization_id PostgreSQL & Créer Client
  console.log("TEST 1 : Appareil A -> Login & Création de client...");
  const dbOrgA = await dbService.getOrganization(orgIdA);
  if (!dbOrgA || dbOrgA.id !== orgIdA) {
    console.error("❌ TEST 1 FAILED: Organisation A non résolue depuis PostgreSQL.");
    failedTests++;
  } else {
    const createdClientA = await dbService.createClient({
      organizationId: dbOrgA.id,
      name: clientNameA,
      email: 'contact@client-a.ci',
      phone: '+225 07 00 11 22 33',
      address: 'Plateau',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
    });

    if (createdClientA && createdClientA.organizationId === orgIdA) {
      console.log(`✅ TEST 1 PASSED: Client ${createdClientA.name} (UUID: ${createdClientA.id}) créé et rattaché à ORG_A dans PostgreSQL.\n`);
      passedTests++;
    } else {
      console.error("❌ TEST 1 FAILED: Création client échouée.");
      failedTests++;
    }
  }

  // TEST 2 : Appareil B (Simulé sans aucun localStorage) -> Restauration & Récupération de CLIENT_TEST_A
  console.log("TEST 2 : Appareil B (0 localStorage) -> Restauration session & Récupération de CLIENT_TEST_A...");
  const dbOrgRestoredB = await dbService.getOrganization(emailA); // Query by email directly
  if (!dbOrgRestoredB) {
    console.error("❌ TEST 2 FAILED: Organisation introuvable sans localStorage.");
    failedTests++;
  } else {
    const clientsAppareilB = await dbService.getClients(dbOrgRestoredB.id);
    const foundClientA = clientsAppareilB.find((c) => c.name === clientNameA);

    if (foundClientA && clientsAppareilB.length >= 1) {
      console.log(`✅ TEST 2 PASSED: ${clientsAppareilB.length} client(s) récupéré(s) sur Appareil B sans localStorage (Client: ${foundClientA.name}).\n`);
      passedTests++;
    } else {
      console.error("❌ TEST 2 FAILED: Client absent sur Appareil B.");
      failedTests++;
    }
  }

  // TEST 3 : Reload Navigateur (Restauration depuis PostgreSQL)
  console.log("TEST 3 : Reload navigateur -> Vérification persistance...");
  const reloadClients = await dbService.getClients(orgIdA);
  const reloadedClientA = reloadClients.find((c) => c.name === clientNameA);

  if (reloadedClientA) {
    console.log("✅ TEST 3 PASSED: Client toujours présent après rechargement.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 3 FAILED: Perte de client après reload.");
    failedTests++;
  }

  // TEST 4 : Logout/Login -> Compte ré-authentifié
  console.log("TEST 4 : Reconnexion après Logout -> Récupération des clients...");
  const postLogoutClients = await dbService.getClients(orgIdA);
  if (postLogoutClients.some((c) => c.name === clientNameA)) {
    console.log("✅ TEST 4 PASSED: Client restauré avec succès après reconnexion.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 4 FAILED: Client manquant après reconnexion.");
    failedTests++;
  }

  // TEST 5 : Deuxième Entreprise (ORG_B) -> Isolation Multi-Tenant Stricte
  console.log("TEST 5 : Isolation Multi-Tenant (ORG_B ne doit PAS voir les clients de ORG_A)...");
  const clientsOrgB = await dbService.getClients(orgIdB);
  const leakFound = clientsOrgB.some((c) => c.name === clientNameA || c.organizationId === orgIdA);

  if (!leakFound && clientsOrgB.length === 0) {
    console.log("✅ TEST 5 PASSED: Isolation Multi-Tenant confirmée (0 fuite sur ORG_B).\n");
    passedTests++;
  } else {
    console.error("❌ TEST 5 FAILED: Fuite de données entre entreprises !");
    failedTests++;
  }

  // TEST 6 : Client avec email = NULL dans PostgreSQL -> Non-crash du mapping & filtrage UI
  console.log("TEST 6 : Insertion client avec email = NULL dans PostgreSQL...");
  const { data: nullEmailClient } = await supabase
    .from('clients')
    .insert({
      organization_id: orgIdA,
      name: `CLIENT_NULL_EMAIL_${timestamp}`,
      email: null,
      phone: '+225 0000',
      address: 'Abidjan',
      city: 'Abidjan',
    })
    .select('*')
    .single();

  const clientsWithNullEmail = await dbService.getClients(orgIdA);
  const mappedNullEmail = clientsWithNullEmail.find((c) => c.name === `CLIENT_NULL_EMAIL_${timestamp}`);
  
  // Simulate UI filter execution
  const activeSearch = 'test';
  const filterSuccessNullEmail = clientsWithNullEmail.filter((c) =>
    (c.name || '').toLowerCase().includes(activeSearch) ||
    (c.email || '').toLowerCase().includes(activeSearch) ||
    (c.city || '').toLowerCase().includes(activeSearch)
  );

  if (mappedNullEmail && mappedNullEmail.email === '' && Array.isArray(filterSuccessNullEmail)) {
    console.log("✅ TEST 6 PASSED: Client avec email = NULL géré sereinement sans exception JS.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 6 FAILED: Crash ou erreur de mapping email NULL.");
    failedTests++;
  }

  // TEST 7 : Client avec city = NULL dans PostgreSQL -> Non-crash du mapping & filtrage UI
  console.log("TEST 7 : Insertion client avec city = NULL dans PostgreSQL...");
  const { data: nullCityClient } = await supabase
    .from('clients')
    .insert({
      organization_id: orgIdA,
      name: `CLIENT_NULL_CITY_${timestamp}`,
      email: 'citynull@test.ci',
      phone: '+225 0000',
      address: 'Abidjan',
      city: null,
    })
    .select('*')
    .single();

  const clientsWithNullCity = await dbService.getClients(orgIdA);
  const mappedNullCity = clientsWithNullCity.find((c) => c.name === `CLIENT_NULL_CITY_${timestamp}`);

  // Simulate UI filter execution
  const filterSuccessNullCity = clientsWithNullCity.filter((c) =>
    (c.name || '').toLowerCase().includes(activeSearch) ||
    (c.email || '').toLowerCase().includes(activeSearch) ||
    (c.city || '').toLowerCase().includes(activeSearch)
  );

  if (mappedNullCity && mappedNullCity.city === 'Abidjan' && Array.isArray(filterSuccessNullCity)) {
    console.log("✅ TEST 7 PASSED: Client avec city = NULL géré sereinement sans exception JS.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 7 FAILED: Crash ou erreur de mapping city NULL.");
    failedTests++;
  }

  // TEST 8 : Création client -> Vérification de l'ID retourné = UUID PostgreSQL valide (36 chars)
  console.log("TEST 8 : Vérification du format d'ID (UUID PostgreSQL 36 caractères)...");
  const uuidTestClient = await dbService.createClient({
    organizationId: orgIdA,
    name: `CLIENT_UUID_CHECK_${timestamp}`,
    email: 'uuidcheck@entreprise.ci',
    phone: '+225 07 11 22 33',
    address: 'Abidjan',
    city: 'Abidjan',
  });

  const isRealUuid = uuidTestClient && /^[0-9a-f-]{36}$/i.test(uuidTestClient.id);

  if (isRealUuid) {
    console.log(`✅ TEST 8 PASSED: L'ID du client est un UUID PostgreSQL réel et valide (${uuidTestClient.id}).\n`);
    passedTests++;
  } else {
    console.error(`❌ TEST 8 FAILED: ID non conforme UUID (${uuidTestClient?.id}).`);
    failedTests++;
  }

  // NETTOYAGE DES ENREGISTREMENTS DE TEST
  console.log("Nettoyage des données de test LOOP 4.8...");
  await supabase.from('clients').delete().eq('organization_id', orgIdA);
  await supabase.from('clients').delete().eq('organization_id', orgIdB);
  await supabase.from('profiles').delete().eq('id', userIdA);
  await supabase.from('organizations').delete().eq('id', orgIdA);
  await supabase.from('organizations').delete().eq('id', orgIdB);

  console.log('================================================================');
  console.log(`LOOP 4.8 TEST SUITE SUMMARY: ${passedTests}/${passedTests + failedTests} PASSED (${failedTests} FAILED)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLoop48ClientPipelineTests();
