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

async function deepAudit() {
  console.log('================================================================');
  console.log('LIVE SUPABASE DATABASE DEEP AUDIT FOR MONNEYFACT V1');
  console.log('================================================================\n');

  const tables = [
    'organizations',
    'profiles',
    'subsidiaries',
    'team_members',
    'clients',
    'invoices',
    'invoice_items',
    'payments',
    'notifications',
  ];

  for (const t of tables) {
    console.log(`--- Table: public.${t} ---`);
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`STATUS: ❌ DOES NOT EXIST or ERROR (${error.message})`);
    } else {
      console.log(`STATUS: ✅ EXISTS`);
      if (data && data.length > 0) {
        console.log(`COLUMNS:`, Object.keys(data[0]));
      } else {
        // Try inserting a dummy transaction or fetching schema if empty
        console.log(`(Table is empty, probing schema with empty select)`);
      }
    }
    console.log('');
  }
}

deepAudit();
