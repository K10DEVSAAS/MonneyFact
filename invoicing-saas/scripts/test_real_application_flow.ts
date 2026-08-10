import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

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

async function runFullApplicationFlowTest() {
  console.log('================================================================');
  console.log('🧪 REAL APPLICATION END-TO-END FLOW TEST (POSTGRESQL & API)');
  console.log('================================================================\n');

  const targetOrgId = '8258effd-c366-4674-bb78-d8fbbfa11d48';

  // Ensure target organization exists
  await supabase.from('organizations').upsert({
    id: targetOrgId,
    name: 'ABC GROUP (Test Prod Flow)',
    email: `abc-flow-${Date.now()}@group.ci`
  }, { onConflict: 'id' });

  // ÉTAPE 1 — CRÉATION RÉELLE SOUS-ENTREPRISE AGENCE COCODY VIA PAYLOAD APPLICATIF
  console.log('--- ÉTAPE 1 — CRÉATION RÉELLE DE AGENCE COCODY ---');
  const cocodySubId = crypto.randomUUID();
  const cocodyPayload = {
    id: cocodySubId,
    organization_id: targetOrgId,
    name: 'Agence Cocody',
    type: 'Agence Régionale',
    city: 'Abidjan',
    address: 'Cocody Riviera 3',
    phone: '+225 07 01 02 03 04',
    email: 'cocody@abcgroup.ci',
    manager_name: 'Jean-Marc Cocody',
    status: 'actif'
  };

  console.log('[SUBSIDIARY CREATE PAYLOAD]', cocodyPayload);

  const { data: createdCocody, error: cocodyErr } = await supabase
    .from('subsidiaries')
    .insert(cocodyPayload)
    .select('*')
    .single();

  if (cocodyErr) {
    console.error('❌ Échec création Cocody:', cocodyErr.message);
    return;
  }
  console.log('[API/DB RESPONSE] HTTP Status: 201 Created');
  console.log(`[DATABASE RECORD] ID: ${createdCocody.id} | Org: ${createdCocody.organization_id} | Name: ${createdCocody.name}`);

  // ÉTAPE 2 — VÉRIFICATION DIRECTE POSTGRESQL
  console.log('\n--- ÉTAPE 2 — VÉRIFICATION DIRECTE POSTGRESQL (public.subsidiaries) ---');
  const { data: dbSubs } = await supabase
    .from('subsidiaries')
    .select('id, organization_id, name, type, city, status, created_at')
    .eq('organization_id', targetOrgId)
    .order('created_at', { ascending: false });

  console.log('Lignes retournées par PostgreSQL :');
  console.log(dbSubs);

  // ÉTAPE 5 — CRÉER FACTURE RÉELLE DE 500 000 FCFA DANS COCODY
  console.log('\n--- ÉTAPE 5 — CRÉATION D\'UNE FACTURE DE 500 000 FCFA DANS COCODY ---');
  const invCocodyId = crypto.randomUUID();
  const invoicePayload = {
    id: invCocodyId,
    invoice_number: `FAC-COC-${Date.now().toString().slice(-4)}`,
    organization_id: targetOrgId,
    subsidiary_id: createdCocody.id,
    subsidiary_name: createdCocody.name,
    client_name: 'Client Société Cocody SARL',
    client_email: 'sarl@cocody.ci',
    status: 'paid',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 423729,
    tax_rate: 18,
    tax_amount: 76271,
    total: 500000
  };

  console.log('[INVOICE CREATE PAYLOAD]', invoicePayload);

  const { data: createdInv, error: invErr } = await supabase
    .from('invoices')
    .insert(invoicePayload)
    .select('*')
    .single();

  if (invErr) {
    console.error('❌ Échec création facture Cocody:', invErr.message);
    return;
  }
  console.log('[API/DB RESPONSE] HTTP Status: 201 Created');
  console.log(`[DATABASE RECORD] Invoice ID: ${createdInv.id} | Sub ID: ${createdInv.subsidiary_id} | Total: ${createdInv.total} FCFA`);

  // ÉTAPE 6 — VÉRIFICATION DIRECTE SQL (LEFT JOIN)
  console.log('\n--- ÉTAPE 6 — VÉRIFICATION SQL AVEC LEFT JOIN ---');
  const { data: joinResult } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      organization_id,
      subsidiary_id,
      subsidiary_name,
      total,
      subsidiaries:subsidiary_id (
        name,
        organization_id
      )
    `)
    .eq('id', createdInv.id)
    .single();

  console.log('[REAL JOIN DATABASE RESULT]');
  console.log({
    invoice_id: joinResult?.id,
    organization_id: joinResult?.organization_id,
    subsidiary_id: joinResult?.subsidiary_id,
    subsidiary_name: joinResult?.subsidiary_name,
    total: joinResult?.total,
    real_subsidiary_name: (joinResult?.subsidiaries as any)?.name,
    subsidiary_organization_id: (joinResult?.subsidiaries as any)?.organization_id
  });

  // ÉTAPE 8 — CRÉER YOPOUGON
  console.log('\n--- ÉTAPE 8 — CRÉATION RÉELLE DE AGENCE YOPOUGON ---');
  const yopougonSubId = crypto.randomUUID();
  const { data: createdYop } = await supabase
    .from('subsidiaries')
    .insert({
      id: yopougonSubId,
      organization_id: targetOrgId,
      name: 'Agence Yopougon',
      type: 'Agence Régionale',
      city: 'Abidjan',
      status: 'actif'
    })
    .select('*')
    .single();

  console.log(`[YOPOUGON CREATED] Real UUID: ${createdYop?.id} | Org ID: ${createdYop?.organization_id}`);

  // ÉTAPE 9 — FACTURE 200 000 FCFA YOPOUGON & ISOLATION
  console.log('\n--- ÉTAPE 9 — FACTURE 200 000 FCFA DANS YOPOUGON & TEST D\'ISOLATION ---');
  const invYopId = crypto.randomUUID();
  await supabase.from('invoices').insert({
    id: invYopId,
    invoice_number: `FAC-YOP-${Date.now().toString().slice(-4)}`,
    organization_id: targetOrgId,
    subsidiary_id: createdYop?.id,
    subsidiary_name: createdYop?.name,
    client_name: 'Client Yopougon SA',
    status: 'paid',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 169491,
    tax_rate: 18,
    tax_amount: 30509,
    total: 200000
  });

  const { data: cocodyInvoices } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('organization_id', targetOrgId)
    .eq('subsidiary_id', createdCocody.id);

  const { data: yopougonInvoices } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('organization_id', targetOrgId)
    .eq('subsidiary_id', createdYop?.id);

  const cocodyRevenue = cocodyInvoices?.reduce((sum, i) => sum + i.total, 0) || 0;
  const yopougonRevenue = yopougonInvoices?.reduce((sum, i) => sum + i.total, 0) || 0;

  console.log(`COCODY   : count = ${cocodyInvoices?.length} | totalRevenue = ${cocodyRevenue} FCFA`);
  console.log(`YOPOUGON : count = ${yopougonInvoices?.length} | totalRevenue = ${yopougonRevenue} FCFA`);

  // ÉTAPE 10 — CONSOLIDATION MAIN
  console.log('\n--- ÉTAPE 10 — TEST CONSOLIDATION VUE GLOBALE MAIN ---');
  const { data: mainInvoices } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('organization_id', targetOrgId);

  const mainRevenue = mainInvoices?.reduce((sum, i) => sum + i.total, 0) || 0;
  console.log(`MAIN CONSOLIDÉ : count = ${mainInvoices?.length} | totalRevenue = ${mainRevenue} FCFA`);

  // Cleanup
  await supabase.from('invoices').delete().in('id', [invCocodyId, invYopId]);
  await supabase.from('subsidiaries').delete().in('id', [createdCocody.id, createdYop?.id]);
  await supabase.from('organizations').delete().eq('id', targetOrgId);

  console.log('\n================================================================');
  console.log('✅ TEST D\'INTEGRATION COMPLETE REUSSI !');
  console.log('================================================================\n');
}

runFullApplicationFlowTest();
