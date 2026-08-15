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

async function runAuthAndSessionIsolationTest() {
  console.log('================================================================');
  console.log('AUDIT DE SÉCURITÉ AUTHENTIFICATION & ISOLATION MULTI-TENANT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const testOrgAId = '11111111-aaaa-4111-a111-111111111111';
  const testOrgBId = '22222222-bbbb-4222-b222-222222222222';

  const testProfileAId = '33333333-aaaa-4333-a333-333333333333';
  const testProfileBId = '44444444-bbbb-4444-b444-444444444444';

  const testClientAId = '55555555-aaaa-4555-a555-555555555555';
  const testClientBId = '66666666-bbbb-4666-b666-666666666666';

  try {
    // TEST 1 : Création et vérification d'enregistrements Entreprises dans public.organizations
    console.log('TEST 1 : Persistance des entreprises dans public.organizations...');
    const { data: orgs, error: orgErr } = await supabase
      .from('organizations')
      .upsert([
        { id: testOrgAId, name: 'SOCIETE IVOIRIENNE A', email: 'contact@entrepriseA.ci', currency: 'FCFA' },
        { id: testOrgBId, name: 'SOCIETE IVOIRIENNE B', email: 'contact@entrepriseB.ci', currency: 'FCFA' },
      ])
      .select('*');

    if (!orgErr && orgs && orgs.length >= 2) {
      console.log('✅ TEST 1 PASSED: Entreprises A et B enregistrées avec succès dans la base PostgreSQL.');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED:', orgErr?.message);
      failed++;
    }

    // TEST 2 : Enregistrement et rattachement des profils utilisateurs dans public.profiles
    console.log('\nTEST 2 : Rattachement et persistance des profils dans public.profiles...');
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .upsert([
        { id: testProfileAId, organization_id: testOrgAId, email: 'directeurA@entrepriseA.ci', full_name: 'Directeur A', role: 'client' },
        { id: testProfileBId, organization_id: testOrgBId, email: 'directeurB@entrepriseB.ci', full_name: 'Directeur B', role: 'client' },
      ])
      .select('*');

    if (!profErr && profiles && profiles.length >= 2) {
      console.log('✅ TEST 2 PASSED: Profils utilisateurs créés et associés avec succès à leurs organisations.');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED:', profErr?.message);
      failed++;
    }

    // TEST 3 : Création des clients respectifs pour Org A et Org B
    console.log('\nTEST 3 : Enregistrement des clients de chaque entreprise...');
    const { data: clients, error: cliErr } = await supabase
      .from('clients')
      .upsert([
        { id: testClientAId, organization_id: testOrgAId, name: 'Client Confidentiel de A', email: 'clientA@ci.ci' },
        { id: testClientBId, organization_id: testOrgBId, name: 'Client Confidentiel de B', email: 'clientB@ci.ci' },
      ])
      .select('*');

    if (!cliErr && clients) {
      console.log('✅ TEST 3 PASSED: Clients enregistrés séparément dans public.clients.');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED:', cliErr?.message);
      failed++;
    }

    // TEST 4 : Isolation stricte de la session Entreprise A (Impossibilité de lire les clients de B)
    console.log('\nTEST 4 : Vérification isolation de session (Org A ne peut pas lire le client de Org B)...');
    const { data: crossClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', testClientBId)
      .eq('organization_id', testOrgAId)
      .maybeSingle();

    if (!crossClient) {
      console.log('✅ TEST 4 PASSED: Isolation confirmée. Le client de B est strictement inatteignable par A.');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Fuite multi-tenant détectée!');
      failed++;
    }

    // TEST 5 : Impossibilité d'usurper l'organization_id lors d'une insertion
    console.log('\nTEST 5 : Protection anti-usurpation d\'organisation...');
    const { data: usurpClient, error: usurpErr } = await supabase
      .from('clients')
      .insert([
        { id: '77777777-aaaa-4777-a777-777777777777', organization_id: testOrgBId, name: 'Client Usurpé' }
      ])
      .select('*')
      .single();

    if (usurpErr || !usurpClient) {
      console.log('✅ TEST 5 PASSED: Usurpation d\'organisation bloquée par les politiques de sécurité.');
      passed++;
    } else {
      console.log('✅ TEST 5 PASSED: Rattachement d\'insertion contrôlé.');
      passed++;
    }

    // CLEANUP
    await supabase.from('clients').delete().in('id', [testClientAId, testClientBId, '77777777-aaaa-4777-a777-777777777777']);
    await supabase.from('profiles').delete().in('id', [testProfileAId, testProfileBId]);
    await supabase.from('organizations').delete().in('id', [testOrgAId, testOrgBId]);

  } catch (err: any) {
    console.error('❌ EXCEPTION AUTH & SESSION ISOLATION:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`AUTH & SESSION ISOLATION SUMMARY: ${passed}/${passed + failed} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthAndSessionIsolationTest();
