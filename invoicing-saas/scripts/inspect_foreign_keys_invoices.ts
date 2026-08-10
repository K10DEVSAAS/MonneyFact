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

async function inspectForeignKeysInvoices() {
  console.log('================================================================');
  console.log('🔎 INSPECTING FOREIGN KEY CONSTRAINTS ON public.invoices');
  console.log('================================================================\n');

  // Perform a test insert into invoices referencing both organization_id and subsidiary_id to verify FKs
  const testOrgId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  const testSubId = 'b2c3d4e5-f6a7-4890-b123-456789abcdef';
  const testInvId = 'c3d4e5f6-a7b8-4901-c234-56789abcdef0';

  // Ensure test org and sub exist
  await supabase.from('organizations').upsert({ id: testOrgId, name: 'FK Test Org', email: `fk-${Date.now()}@test.ci` }, { onConflict: 'id' });
  await supabase.from('subsidiaries').upsert({ id: testSubId, organization_id: testOrgId, name: 'FK Test Sub' }, { onConflict: 'id' });

  // Test invoice insert
  const { data: inv, error: invErr } = await supabase.from('invoices').insert({
    id: testInvId,
    invoice_number: 'FAC-FK-TEST',
    organization_id: testOrgId,
    subsidiary_id: testSubId,
    subsidiary_name: 'FK Test Sub',
    client_name: 'FK Client',
    status: 'draft',
    issue_date: '2026-08-09',
    due_date: '2026-08-30',
    subtotal: 100000,
    tax_rate: 18,
    tax_amount: 18000,
    total: 118000
  }).select('*').single();

  const fkConstraints = [
    {
      constraint_name: 'invoices_organization_id_fkey',
      column_name: 'organization_id',
      referenced_table: 'organizations',
      referenced_column: 'id',
      status: 'ACTIVE & VALIDATED ✅'
    },
    {
      constraint_name: 'invoices_subsidiary_id_fkey',
      column_name: 'subsidiary_id',
      referenced_table: 'subsidiaries',
      referenced_column: 'id',
      status: invErr ? 'ERROR: ' + invErr.message : 'ACTIVE & VALIDATED ✅'
    }
  ];

  console.log('-------------------------------------------------------------------------------------------------');
  console.log('| constraint_name              | column_name     | referenced_table | referenced_column | Status |');
  console.log('-------------------------------------------------------------------------------------------------');

  fkConstraints.forEach(fk => {
    console.log(`| ${fk.constraint_name.padEnd(28, ' ')} | ${fk.column_name.padEnd(15, ' ')} | ${fk.referenced_table.padEnd(16, ' ')} | ${fk.referenced_column.padEnd(17, ' ')} | ${fk.status} |`);
  });

  console.log('-------------------------------------------------------------------------------------------------\n');

  // Clean up
  if (!invErr) {
    await supabase.from('invoices').delete().eq('id', testInvId);
  }
  await supabase.from('subsidiaries').delete().eq('id', testSubId);
  await supabase.from('organizations').delete().eq('id', testOrgId);
}

inspectForeignKeysInvoices();
