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

async function inspectPgPolicies() {
  console.log('================================================================');
  console.log('ÉTAPE 1 — AUDIT DES POLITIQUES RLS RÉELLES SUR SUPABASE DISTANTE');
  console.log('================================================================\n');

  // Attempt RPC to query pg_policies or inspect via schema
  const { data, error } = await supabase.rpc('get_policies_info');

  if (error) {
    console.log('RPC get_policies_info notice:', error.message);
    console.log('Fallback: Testing table access policies directly with anon client...\n');

    const tables = ['organizations', 'profiles', 'subsidiaries', 'clients', 'invoices', 'invoice_items', 'payments', 'notifications'];

    for (const table of tables) {
      const { data: resData, error: resErr } = await supabase.from(table).select('*').limit(1);
      console.log(`Table '${table}':`, resErr ? `Error: ${resErr.message}` : `Accessible (Rows returned: ${resData?.length})`);
    }
  } else {
    console.log('PG POLICIES REAL DATA:');
    console.table(data);
  }
}

inspectPgPolicies();
