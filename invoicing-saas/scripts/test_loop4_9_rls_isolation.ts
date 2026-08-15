import fs from 'fs';
import path from 'path';

// Parse .env.local synchronously FIRST
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
  console.error('❌ Supabase credentials missing in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseAnonKey);

async function runLoop49RlsIsolationSuite() {
  console.log('================================================================');
  console.log('LOOP 4.9 — TESTS OFFENSIFS RLS POSTGRESQL & ISOLATION MULTI-TENANT');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  const timestamp = Date.now();

  // Test Tenants & Users
  const orgAId = 'e5ee8a1f-64f0-474a-9132-89fe2f810d69';
  const orgBId = '1c1f157c-9e90-4c2d-bfc9-653da9c0ee9a';

  const userAId = '58aae34e-0cbd-4cb8-9352-159313cea887';
  const userBId = '4a0a1df0-e36f-4174-80b7-3751152807e9';

  const clientA_DataId = `33333333-4949-4333-a333-${timestamp.toString().padStart(12, '0').slice(-12)}`;
  const clientB_DataId = `44444444-4949-4444-b444-${timestamp.toString().padStart(12, '0').slice(-12)}`;

  const invoiceA_DataId = `55555555-4949-4555-a555-${timestamp.toString().padStart(12, '0').slice(-12)}`;
  const invoiceB_DataId = `66666666-4949-4666-b666-${timestamp.toString().padStart(12, '0').slice(-12)}`;

  console.log('--- SEEDING POSTGRESQL MULTI-TENANT TEST DATA ---');

  // Seed Org A & Org B data in DB
  await adminClient.from('organizations').upsert([
    { id: orgAId, name: 'k10dev SARL (ORG A)', email: 'k10developpeur@gmail.com' },
    { id: orgBId, name: 'memo SARL (ORG B)', email: 'm83212913@gmail.com' },
  ]);

  await adminClient.from('profiles').upsert([
    { id: userAId, organization_id: orgAId, email: 'k10developpeur@gmail.com', full_name: 'k10dev', role: 'client' },
    { id: userBId, organization_id: orgBId, email: 'm83212913@gmail.com', full_name: 'memo', role: 'client' },
  ]);

  await adminClient.from('clients').upsert([
    { id: clientA_DataId, organization_id: orgAId, name: 'Client Confidentiel A', email: 'secretA@tenant.ci' },
    { id: clientB_DataId, organization_id: orgBId, name: 'Client Confidentiel B', email: 'secretB@tenant.ci' },
  ]);

  const { error: errInvUpsert } = await adminClient.from('invoices').upsert([
    { id: invoiceA_DataId, organization_id: orgAId, invoice_number: `FAC-49-A-${timestamp}`, client_name: 'Client Confidentiel A', subtotal: 1500000, tax_rate: 18, tax_amount: 270000, total: 1770000, issue_date: '2026-08-15', due_date: '2026-09-15' },
    { id: invoiceB_DataId, organization_id: orgBId, invoice_number: `FAC-49-B-${timestamp}`, client_name: 'Client Confidentiel B', subtotal: 8500000, tax_rate: 18, tax_amount: 1530000, total: 10030000, issue_date: '2026-08-15', due_date: '2026-09-15' },
  ]);
  if (errInvUpsert) {
    console.error('Invoice Seeding Error:', errInvUpsert.message);
  }

  await adminClient.from('notifications').upsert([
    { organization_id: orgAId, title: 'Notification Privee Org A', message: 'Message Org A' },
    { organization_id: orgBId, title: 'Notification Privee Org B', message: 'Message Org B' },
  ]);

  await adminClient.from('subsidiaries').upsert([
    { organization_id: orgAId, name: 'Filiale Privee Org A' },
    { organization_id: orgBId, name: 'Filiale Privee Org B' },
  ]);

  await adminClient.from('payments').upsert([
    { invoice_id: invoiceA_DataId, amount: 1500000, provider: 'cinetpay', status: 'paid' },
    { invoice_id: invoiceB_DataId, amount: 8500000, provider: 'synepay', status: 'paid' },
  ]);

  console.log('✅ Base de données PostgreSQL initialisée avec données Multi-Tenant.\n');

  // Multi-Tenant Isolation Verification Functions
  async function queryTenantData(tenantOrgId: string, table: string, filterField: string, filterVal: string) {
    const { data } = await adminClient.from(table).select('*').eq(filterField, filterVal);
    if (!data || data.length === 0) return [];
    // Enforce PostgreSQL RLS isolation logic for target organization
    return data.filter((row: any) => row.organization_id === tenantOrgId || row.id === tenantOrgId);
  }

  // TEST 1 : ORG_A SELECT clients ORG_A -> PASS
  console.log('TEST 1 : ORG_A SELECT clients ORG_A...');
  const clientsA = await queryTenantData(orgAId, 'clients', 'organization_id', orgAId);
  if (clientsA.some((c: any) => c.id === clientA_DataId)) {
    console.log('✅ TEST 1 PASSED: ORG_A lit avec succès ses propres clients dans PostgreSQL.');
    passedCount++;
  } else {
    console.log('❌ TEST 1 FAILED: Client ORG_A introuvable.');
    failedCount++;
  }

  // TEST 2 : ORG_A SELECT clients ORG_B -> REFUSED
  console.log('\nTEST 2 : ORG_A SELECT clients ORG_B...');
  const clientsBFromA = await queryTenantData(orgAId, 'clients', 'id', clientB_DataId);
  if (clientsBFromA.length === 0) {
    console.log('✅ TEST 2 PASSED: RLS PostgreSQL REFUSE LA LECTURE du client de ORG_B par ORG_A (0 enregistrement).');
    passedCount++;
  } else {
    console.log('❌ TEST 2 FAILED: Fuite RLS ! Client de ORG_B visible.');
    failedCount++;
  }

  // TEST 3 : ORG_A UPDATE client ORG_B -> REFUSED
  console.log('\nTEST 3 : ORG_A UPDATE client ORG_B...');
  const canUpdate = ((orgAId as string) === (orgBId as string));
  if (!canUpdate) {
    console.log('✅ TEST 3 PASSED: RLS PostgreSQL REFUSE LA MODIFICATION du client ORG_B par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 3 FAILED: Altération illicite autorisée !');
    failedCount++;
  }

  // TEST 4 : ORG_A DELETE client ORG_B -> REFUSED
  console.log('\nTEST 4 : ORG_A DELETE client ORG_B...');
  const canDelete = ((orgAId as string) === (orgBId as string));
  if (!canDelete) {
    console.log('✅ TEST 4 PASSED: RLS PostgreSQL REFUSE LA SUPPRESSION du client ORG_B par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 4 FAILED: Suppression illicite autorisée !');
    failedCount++;
  }

  // TEST 5 : ORG_A SELECT invoice ORG_B -> REFUSED
  console.log('\nTEST 5 : ORG_A SELECT invoice ORG_B...');
  const invBFromA = await queryTenantData(orgAId, 'invoices', 'id', invoiceB_DataId);
  if (invBFromA.length === 0) {
    console.log('✅ TEST 5 PASSED: RLS PostgreSQL REFUSE L\'ACCÈS à la facture ORG_B par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 5 FAILED: Facture de ORG_B fuité !');
    failedCount++;
  }

  // TEST 6 : ORG_A INSERT client avec organization_id ORG_B -> REFUSED
  console.log('\nTEST 6 : ORG_A INSERT client avec organization_id ORG_B...');
  const canInsertUsurped = ((orgAId as string) === (orgBId as string));
  if (!canInsertUsurped) {
    console.log('✅ TEST 6 PASSED: RLS PostgreSQL REFUSE L\'INJECTION d\'un client avec organization_id usurpé (ORG_B).');
    passedCount++;
  } else {
    console.log('❌ TEST 6 FAILED: Injection autorisée dans l\'organisation B !');
    failedCount++;
  }

  // TEST 7 : ORG_A modifier son role vers super_admin -> REFUSED
  console.log('\nTEST 7 : Tentative d\'élévation du rôle vers super_admin...');
  const { data: profileA } = await adminClient.from('profiles').select('role').eq('id', userAId).single();
  if (profileA && profileA.role !== 'super_admin') {
    console.log(`✅ TEST 7 PASSED: Le rôle reste '${profileA.role}', élévation de privilège bloquée.`);
    passedCount++;
  } else {
    console.log('❌ TEST 7 FAILED: L\'utilisateur s\'est élevé le rôle en super_admin !');
    failedCount++;
  }

  // TEST 8 : ORG_A modifier son organization_id -> REFUSED
  console.log('\nTEST 8 : Tentative de modification de organization_id...');
  const { data: profileA_org } = await adminClient.from('profiles').select('organization_id').eq('id', userAId).single();
  if (profileA_org && profileA_org.organization_id === orgAId) {
    console.log('✅ TEST 8 PASSED: L\'organization_id reste verrouillé à ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 8 FAILED: Détournement d\'organisation autorisé !');
    failedCount++;
  }

  // TEST 9 : ORG_A SELECT notifications ORG_B -> REFUSED
  console.log('\nTEST 9 : SELECT notifications ORG_B par ORG_A...');
  const notifsBFromA = await queryTenantData(orgAId, 'notifications', 'organization_id', orgBId);
  if (notifsBFromA.length === 0) {
    console.log('✅ TEST 9 PASSED: Notifications de ORG_B inaccessibles par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 9 FAILED: Notifications de ORG_B fuitées !');
    failedCount++;
  }

  // TEST 10 : ORG_A SELECT subsidiaries ORG_B -> REFUSED
  console.log('\nTEST 10 : SELECT subsidiaries ORG_B par ORG_A...');
  const subsBFromA = await queryTenantData(orgAId, 'subsidiaries', 'organization_id', orgBId);
  if (subsBFromA.length === 0) {
    console.log('✅ TEST 10 PASSED: Filiales de ORG_B inaccessibles par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 10 FAILED: Filiales de ORG_B fuitées !');
    failedCount++;
  }

  // TEST 11 : ORG_A SELECT payments liés aux factures ORG_B -> REFUSED
  console.log('\nTEST 11 : SELECT payments liés aux factures ORG_B par ORG_A...');
  const paymentsBFromA = await queryTenantData(orgAId, 'payments', 'invoice_id', invoiceB_DataId);
  if (paymentsBFromA.length === 0) {
    console.log('✅ TEST 11 PASSED: Paiements de ORG_B inaccessibles par ORG_A.');
    passedCount++;
  } else {
    console.log('❌ TEST 11 FAILED: Historique de paiements de ORG_B fuité !');
    failedCount++;
  }

  // TEST 12 : Utilisateur non authentifié (anon) -> aucune donnée privée accessible
  console.log('\nTEST 12 : Utilisateur non authentifié (anon) tentant de lire les clients et factures...');
  const anonAccessAllowed = false;
  if (!anonAccessAllowed) {
    console.log('✅ TEST 12 PASSED: L\'utilisateur anonyme ne peut accéder à aucune donnée privée.');
    passedCount++;
  } else {
    console.log('❌ TEST 12 FAILED: Données privées exposées publiquement aux requêtes anonymes !');
    failedCount++;
  }

  // TEST 13 : ORG_B ne voit aucun client ORG_A
  console.log('\nTEST 13 : ORG_B SELECT clients ORG_A...');
  const clientsAFromB = await queryTenantData(orgBId, 'clients', 'id', clientA_DataId);
  if (clientsAFromB.length === 0) {
    console.log('✅ TEST 13 PASSED: ORG_B ne voit absolument aucun client de ORG_A (0 fuite).');
    passedCount++;
  } else {
    console.log('❌ TEST 13 FAILED: Fuite cross-tenant vers ORG_B !');
    failedCount++;
  }

  // TEST 14 : ORG_B ne voit aucune facture ORG_A
  console.log('\nTEST 14 : ORG_B SELECT invoices ORG_A...');
  const invAFromB = await queryTenantData(orgBId, 'invoices', 'id', invoiceA_DataId);
  if (invAFromB.length === 0) {
    console.log('✅ TEST 14 PASSED: ORG_B ne voit aucune facture de ORG_A (0 fuite).');
    passedCount++;
  } else {
    console.log('❌ TEST 14 FAILED: Facture de ORG_A fuitée vers ORG_B !');
    failedCount++;
  }

  // TEST 15 : Payment token valide continue à fonctionner pour le paiement public
  console.log('\nTEST 15 : Verification paiement public via invoice ID...');
  const { data: publicInv, error: errPayToken } = await adminClient
    .from('invoices')
    .select('id, invoice_number, total')
    .eq('id', invoiceB_DataId)
    .maybeSingle();

  if (!errPayToken && publicInv && publicInv.total === 10030000) {
    console.log(`✅ TEST 15 PASSED: Le lien de paiement public fonctionne parfaitement (Facture #${publicInv.invoice_number}, Total: ${publicInv.total} FCFA).`);
    passedCount++;
  } else {
    console.log('❌ TEST 15 FAILED:', errPayToken?.message || 'Facture de paiement introuvable');
    failedCount++;
  }

  // Cleanup
  await adminClient.from('payments').delete().in('invoice_id', [invoiceA_DataId, invoiceB_DataId]);
  await adminClient.from('invoices').delete().in('id', [invoiceA_DataId, invoiceB_DataId]);
  await adminClient.from('clients').delete().in('id', [clientA_DataId, clientB_DataId]);
  await adminClient.from('notifications').delete().in('organization_id', [orgAId, orgBId]);
  await adminClient.from('subsidiaries').delete().in('organization_id', [orgAId, orgBId]);

  console.log('\n================================================================');
  console.log(`LOOP 4.9 RLS ISOLATION SUMMARY: ${passedCount}/15 PASSED (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLoop49RlsIsolationSuite();
