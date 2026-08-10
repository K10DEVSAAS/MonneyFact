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

async function insertInvoiceResilient(payload: Record<string, any>) {
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(currentPayload)
      .select('*')
      .single();

    if (!error) {
      return { data, error: null };
    }

    if (error.code === 'PGRST204' && error.message.includes("Could not find the '")) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`[RESILIENT INSERT] Column '${missingCol}' missing from invoices schema. Retrying without it.`);
        delete currentPayload[missingCol];
        continue;
      }
    }

    return { data: null, error };
  }

  return { data: null, error: new Error('Max retries exceeded') };
}

async function runTest() {
  console.log('--- TESTING RESILIENT INVOICE INSERTION ---');
  const payload = {
    invoice_number: `INV-RESILIENT-${Date.now()}`,
    organization_id: '1c1f157c-9e90-4c2d-bfc9-653da9c0ee9a',
    client_name: 'Client Test Résilient',
    client_email: 'testresilient@client.ci',
    status: 'draft',
    issue_date: '2026-08-10',
    due_date: '2026-09-10',
    subtotal: 15000,
    tax_rate: 18,
    tax_amount: 2700,
    total: 17700,
    notes: 'Note de test',
    observations: 'Observation de test',
    signature_url: 'https://example.com/sig.png',
    payment_token: `token-${Date.now()}`,
  };

  const { data, error } = await insertInvoiceResilient(payload);

  if (error) {
    console.error('❌ Resilient Insert Failed:', error);
  } else {
    console.log('✅ Resilient Insert Success:', data);
    // Clean up
    if (data?.id) {
      await supabase.from('invoices').delete().eq('id', data.id);
      console.log('Cleaned up test invoice');
    }
  }
}

runTest();
