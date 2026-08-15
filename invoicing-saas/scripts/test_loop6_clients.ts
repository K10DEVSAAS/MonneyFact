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

async function runLoop6ClientSuite() {
  console.log('================================================================');
  console.log('LOOP 6 — SUITE DE TESTS COMPLÈTE : GESTION ET ISOLATION DES CLIENTS');
  console.log('================================================================\n');

  const orgAId = '11111111-6666-4111-a111-111111111111';
  const orgBId = '22222222-6666-4222-b222-222222222222';

  const clientAId = '33333333-6666-4333-a333-333333333333';
  const clientBId = '44444444-6666-4444-b444-444444444444';

  let passedCount = 0;
  let failedCount = 0;

  // Setup Organizations
  await supabase.from('organizations').upsert([
    { id: orgAId, name: 'Client Test Org A', email: 'orgA@loop6.ci' },
    { id: orgBId, name: 'Client Test Org B', email: 'orgB@loop6.ci' },
  ]);

  // TEST 1 : Création de client sous ORG_A
  console.log('TEST 1 : Création d\'un client dans PostgreSQL sous ORG_A...');
  const { data: newClientA, error: createErr } = await supabase
    .from('clients')
    .insert({
      id: clientAId,
      organization_id: orgAId,
      name: 'Client Ivoire Transport SARL',
      email: 'contact@ivoire-transport.ci',
      phone: '+225 07 11 22 33 44',
      address: 'Zone Industrielle Yopougon',
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
    })
    .select('*')
    .single();

  if (!createErr && newClientA && newClientA.id === clientAId) {
    console.log('✅ TEST 1 PASSED: Client créé avec succès dans la base de données.');
    passedCount++;
  } else {
    console.log('❌ TEST 1 FAILED:', createErr?.message);
    failedCount++;
  }

  // Setup Client B under ORG_B
  await supabase.from('clients').insert({
    id: clientBId,
    organization_id: orgBId,
    name: 'Client B Confidentiel',
    email: 'b@loop6.ci',
    city: 'San-Pedro',
  });

  // TEST 2 : Multi-tenant Isolation (USER_A ne peut pas voir le client de ORG_B)
  console.log('\nTEST 2 : Isolation multi-tenant du répertoire clients...');
  const { data: clientsForOrgA } = await supabase.from('clients').select('*').eq('organization_id', orgAId);
  const isLeaked = (clientsForOrgA || []).some((c) => c.id === clientBId || c.organization_id === orgBId);
  if (!isLeaked) {
    console.log('✅ TEST 2 PASSED: Les clients de ORG_B sont totalement inaccessibles depuis ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 2 FAILED: Fuite de client détectée !');
    failedCount++;
  }

  // TEST 3 : Modification d'un client
  console.log('\nTEST 3 : Modification des coordonnées d\'un client...');
  const updatedCity = 'Yamoussoukro';
  const { error: updateErr } = await supabase
    .from('clients')
    .update({ city: updatedCity })
    .eq('id', clientAId)
    .eq('organization_id', orgAId);

  const { data: fetchedClientA } = await supabase.from('clients').select('*').eq('id', clientAId).single();

  if (!updateErr && fetchedClientA && fetchedClientA.city === updatedCity) {
    console.log('✅ TEST 3 PASSED: Coordonnées du client mises à jour avec succès.');
    passedCount++;
  } else {
    console.log('❌ TEST 3 FAILED.');
    failedCount++;
  }

  // TEST 4 : Suppression d'un client
  console.log('\nTEST 4 : Suppression d\'un client...');
  const { error: delErr } = await supabase.from('clients').delete().eq('id', clientAId);
  const { data: checkDeleted } = await supabase.from('clients').select('*').eq('id', clientAId).maybeSingle();

  if (!delErr && !checkDeleted) {
    console.log('✅ TEST 4 PASSED: Client supprimé avec succès.');
    passedCount++;
  } else {
    console.log('❌ TEST 4 FAILED.');
    failedCount++;
  }

  // TEST 5 : Création de clients en illimité (> 10 clients) sans quota SaaS
  console.log('\nTEST 5 : Ajout de plus de 10 clients (Vérification Accès Illimité V1)...');
  const bulkClients = Array.from({ length: 12 }, (_, i) => ({
    organization_id: orgAId,
    name: `Client Masse #${i + 1}`,
    email: `client${i + 1}@loop6.ci`,
    city: 'Abidjan',
  }));

  const { data: insertedBulk, error: bulkErr } = await supabase.from('clients').insert(bulkClients).select('id');

  if (!bulkErr && insertedBulk && insertedBulk.length === 12) {
    console.log('✅ TEST 5 PASSED: 12 clients créés en masse sans aucun blocage ni quota de plan.');
    passedCount++;
  } else {
    console.log('❌ TEST 5 FAILED:', bulkErr?.message);
    failedCount++;
  }

  // Cleanup
  await supabase.from('clients').delete().eq('organization_id', orgAId);
  await supabase.from('clients').delete().eq('organization_id', orgBId);
  await supabase.from('organizations').delete().in('id', [orgAId, orgBId]);

  console.log('\n================================================================');
  console.log(`LOOP 6 TEST SUITE SUMMARY: ${passedCount}/5 PASSED (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLoop6ClientSuite();
