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

async function runMigration() {
  console.log('--- ATTEMPTING SQL MIGRATION FOR INVOICES TABLE ---');

  // Try calling rpc exec_sql if available, or test insert
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS observations TEXT;
      ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_token TEXT;
      NOTIFY pgrst, 'reload schema';
    `
  });

  if (error) {
    console.log('RPC exec_sql not directly accessible via anon key (expected):', error.message);
  } else {
    console.log('RPC exec_sql succeeded:', data);
  }
}

runMigration();
