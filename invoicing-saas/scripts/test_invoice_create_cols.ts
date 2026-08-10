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

async function testInsertInvoice() {
  console.log('--- TESTING INVOICE INSERTION WITH ALL FIELDS ---');
  const payload = {
    invoice_number: `TEST-INV-${Date.now()}`,
    organization_id: '1c1f157c-9e90-4c2d-bfc9-653da9c0ee9a',
    client_name: 'Test Client',
    client_email: 'test@client.ci',
    status: 'draft',
    issue_date: '2026-08-10',
    due_date: '2026-09-10',
    subtotal: 10000,
    tax_rate: 18,
    tax_amount: 1800,
    total: 11800,
    notes: 'Test note',
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert(payload)
    .select('*');

  if (error) {
    console.error('❌ Insert Error:', error);
  } else {
    console.log('✅ Insert Success:', data);
    // Cleanup test invoice
    if (data && data[0]?.id) {
      await supabase.from('invoices').delete().eq('id', data[0].id);
    }
  }
}

testInsertInvoice();
