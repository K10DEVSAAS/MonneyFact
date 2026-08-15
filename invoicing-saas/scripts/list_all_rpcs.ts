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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listRpcs() {
  const commonRpcs = [
    'exec_sql',
    'execute_sql',
    'run_sql',
    'get_auth_organization_id',
    'get_public_invoice_by_token',
    'current_user_organization_id',
  ];

  for (const rpc of commonRpcs) {
    const { data, error } = await supabase.rpc(rpc as any, {});
    console.log(`RPC [${rpc}]:`, { error: error ? error.message : 'SUCCESS!', data });
  }
}

listRpcs();
