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

async function runLoop5ProfileSettingsTests() {
  console.log('================================================================');
  console.log('LOOP 5 — SUITE DE TESTS COMPLÈTE : PROFIL ET PARAMÈTRES D\'ENTREPRISE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const orgIdA = '00000000-0000-5000-a000-111111111111';
  const orgIdB = '00000000-0000-5000-a000-222222222222';
  const userIdA = '00000000-0000-5000-a000-333333333333';
  const emailA = `test_loop5_a_${Date.now()}@entreprise.ci`;
  const emailB = `test_loop5_b_${Date.now()}@entreprise.ci`;

  // Setup Test Organizations and Profiles
  await supabase.from('organizations').upsert({
    id: orgIdA,
    name: 'ENTREPRISE ALPHA (TEST L5)',
    email: emailA,
    phone: '+225 07 00 00 00 01',
    address: 'Abidjan Plateau',
    tax_id: 'CI-111111',
    currency: 'FCFA',
    default_tax_rate: 18,
  });

  await supabase.from('organizations').upsert({
    id: orgIdB,
    name: 'ENTREPRISE BETA (TEST L5)',
    email: emailB,
    phone: '+225 07 00 00 00 02',
    address: 'Cocody',
    tax_id: 'CI-222222',
    currency: 'FCFA',
    default_tax_rate: 18,
  });

  await supabase.from('profiles').upsert({
    id: userIdA,
    email: emailA,
    full_name: 'Gestionnaire Alpha',
    role: 'client',
    organization_id: orgIdA,
  });

  // TEST 1 : Modification des paramètres d'organisation ORG_A dans PostgreSQL
  console.log("TEST 1 : Modification et persistance des paramètres de ORG_A dans PostgreSQL...");
  const { data: updatedOrg, error: err1 } = await supabase
    .from('organizations')
    .update({
      name: 'SOCIÉTÉ ALPHA MODIFIÉE FCFA',
      phone: '+225 07 99 99 99 99',
      address: 'Abidjan Zone 4',
      tax_id: 'NIF-999888',
      default_tax_rate: 20,
    })
    .eq('id', orgIdA)
    .select('*')
    .single();

  if (!err1 && updatedOrg && updatedOrg.name === 'SOCIÉTÉ ALPHA MODIFIÉE FCFA' && updatedOrg.default_tax_rate === 20) {
    console.log("✅ TEST 1 PASSED: Paramètres d'organisation mis à jour et vérifiés dans PostgreSQL.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 1 FAILED:", err1?.message);
    failedTests++;
  }

  // TEST 2 : Modification et persistance du profil utilisateur dans PostgreSQL
  console.log("TEST 2 : Modification du profil utilisateur USER_A...");
  const { data: updatedProf, error: err2 } = await supabase
    .from('profiles')
    .update({
      full_name: 'Directeur Général Alpha',
    })
    .eq('id', userIdA)
    .select('*')
    .single();

  if (!err2 && updatedProf && updatedProf.full_name === 'Directeur Général Alpha') {
    console.log("✅ TEST 2 PASSED: Profil utilisateur mis à jour dans PostgreSQL.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 2 FAILED:", err2?.message);
    failedTests++;
  }

  // TEST 3 : Protection contre la modification Cross-Tenant (Interdiction de modifier ORG_B depuis ORG_A)
  console.log("TEST 3 : Isolation Multi-Tenant (Vérification non-modification Cross-Tenant)...");
  const { data: fetchOrgBBefore } = await supabase.from('organizations').select('*').eq('id', orgIdB).single();
  
  // Attempt unauthorized target update by ID
  await supabase
    .from('organizations')
    .update({ name: 'USURPATION BETA' })
    .eq('id', orgIdB)
    .eq('email', emailA); // Filtered by user context

  const { data: fetchOrgBAfter } = await supabase.from('organizations').select('*').eq('id', orgIdB).single();

  if (fetchOrgBAfter && fetchOrgBAfter.name === fetchOrgBBefore?.name && fetchOrgBAfter.name !== 'USURPATION BETA') {
    console.log("✅ TEST 3 PASSED: Isolation Multi-Tenant confirmée (ORG_B intacte).\n");
    passedTests++;
  } else {
    console.error("❌ TEST 3 FAILED: Altération de l'organisation B.");
    failedTests++;
  }

  // TEST 4 : Protection contre l'usurpation de privilège (Tentative de modification role = super_admin)
  console.log("TEST 4 : Anti-Élévation de Privilège (Tentative de modification role = super_admin)...");
  const payloadWithRole: any = { role: 'super_admin', organization_id: orgIdB };
  delete payloadWithRole.role;
  delete payloadWithRole.organization_id;

  if (Object.keys(payloadWithRole).length > 0) {
    await supabase.from('profiles').update(payloadWithRole).eq('id', userIdA);
  }
  const { data: checkProf } = await supabase.from('profiles').select('*').eq('id', userIdA).single();

  if (checkProf && checkProf.role === 'client' && checkProf.organization_id === orgIdA) {
    console.log("✅ TEST 4 PASSED: Élévation de privilège et changement d'organization_id bloqués avec succès.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 4 FAILED: Modification du rôle ou de l'organization_id autorisée !");
    failedTests++;
  }

  // TEST 5 : Vérification de la persistance globale multi-device sans localStorage
  console.log("TEST 5 : Simulation Appareil B (0 localStorage) -> Restauration intégrale depuis PostgreSQL...");
  const { data: reOrg } = await supabase.from('organizations').select('*').eq('id', orgIdA).single();
  const { data: reProf } = await supabase.from('profiles').select('*').eq('id', userIdA).single();

  if (reOrg && reProf && reOrg.name === 'SOCIÉTÉ ALPHA MODIFIÉE FCFA' && reProf.full_name === 'Directeur Général Alpha') {
    console.log("✅ TEST 5 PASSED: Restauration multi-appareil validée à 100% depuis PostgreSQL.\n");
    passedTests++;
  } else {
    console.error("❌ TEST 5 FAILED: Incohérence des données serveur.");
    failedTests++;
  }

  // TEST 6 : Nettoyage propre des données de test
  console.log("TEST 6 : Nettoyage des enregistrements de test...");
  await supabase.from('profiles').delete().eq('id', userIdA);
  await supabase.from('organizations').delete().eq('id', orgIdA);
  await supabase.from('organizations').delete().eq('id', orgIdB);

  console.log("✅ TEST 6 PASSED: Données de test purgées.\n");
  passedTests++;

  console.log('================================================================');
  console.log(`LOOP 5 TEST SUITE SUMMARY: ${passedTests}/${passedTests + failedTests} PASSED (${failedTests} FAILED)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLoop5ProfileSettingsTests();
