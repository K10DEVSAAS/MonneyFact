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

async function testRpcParamNames() {
  const paramNames = ['query', 'sql', 'p_sql', 'sql_query', 'cmd', 'statement', 'command'];
  const fnNames = ['exec_sql', 'execute_sql', 'run_sql', 'exec', 'execute'];

  for (const fn of fnNames) {
    for (const p of paramNames) {
      const { data, error } = await supabase.rpc(fn as any, { [p]: 'SELECT 1;' });
      if (error && !error.message.includes('Could not find the function')) {
        console.log(`🎯 FOUND RPC FUNCTION [${fn}] WITH PARAM [${p}]! Result:`, { data, error: error.message });
      }
    }
  }
}

testRpcParamNames();
