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

async function inspectAllTables() {
  console.log('--- INSPECTING ALL PUBLIC TABLES ON LIVE SUPABASE ---');
  const tables = ['organizations', 'profiles', 'subsidiaries', 'team_members', 'clients', 'invoices', 'invoice_items', 'notifications'];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ Table 'public.${t}': NOT FOUND / ERROR ->`, error.message);
    } else {
      console.log(`✅ Table 'public.${t}': EXISTS (Rows: ${data.length})`);
    }
  }
}

inspectAllTables();
