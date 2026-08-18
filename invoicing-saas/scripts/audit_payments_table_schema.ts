import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
    }
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dekxifsxqxoljobhzraw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditPaymentsTableSchema() {
  console.log('--- AUDIT SEMA & CONTRAINTES SUR TABLE PAYMENTS ---');

  // Perform sample query
  const { data, error } = await supabase.from('payments').select('*').limit(1);

  if (error) {
    console.log('Payments table query notice:', error.message);
  } else {
    console.log('Payments sample row structure:', data);
  }

  // Check RPC process_geniuspay_payment_atomic presence
  const { data: rpcData, error: rpcErr } = await supabase.rpc('process_geniuspay_payment_atomic', {
    p_invoice_id: '00000000-0000-0000-0000-000000000000',
    p_amount: 100,
    p_currency: 'FCFA',
    p_provider: 'geniuspay',
    p_provider_transaction_id: 'TEST_AUDIT_REF',
    p_payment_method: 'card',
    p_metadata: {},
  });

  console.log('RPC test call result:', rpcData, rpcErr?.message);
}

auditPaymentsTableSchema();
