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

async function selectInvoicesSubsidiariesJoin() {
  console.log('================================================================');
  console.log('🔎 EXECUTING: LEFT JOIN BETWEEN invoices AND subsidiaries (LIMIT 50)');
  console.log('================================================================\n');

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      organization_id,
      subsidiary_id,
      subsidiary_name,
      subsidiaries:subsidiary_id (
        name,
        organization_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ SQL Execution Error:', error.message);
    return;
  }

  console.log(`[RÉSULTAT POSTGRESQL RÉEL] (${data ? data.length : 0} ligne(s) trouvée(s))\n`);
  if (!data || data.length === 0) {
    console.log('0 ligne retournée (Aucune facture enregistrée dans public.invoices).');
  } else {
    const formatted = data.map((row: any) => ({
      id: row.id,
      invoice_number: row.invoice_number,
      organization_id: row.organization_id,
      subsidiary_id: row.subsidiary_id,
      subsidiary_name: row.subsidiary_name,
      real_subsidiary_name: row.subsidiaries?.name || null,
      subsidiary_organization_id: row.subsidiaries?.organization_id || null,
    }));
    console.log(JSON.stringify(formatted, null, 2));
  }
}

selectInvoicesSubsidiariesJoin();
