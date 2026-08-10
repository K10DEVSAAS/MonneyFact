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

async function checkInvoicesColumns() {
  console.log('--- FETCHING INVOICES SCHEMA / COLUMNS ---');
  // Perform a 0-row query on invoices to see returning keys
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching invoices:', error.message);
  } else {
    console.log('Sample invoice row keys (or empty array if 0 rows):', data);
  }
}

checkInvoicesColumns();
