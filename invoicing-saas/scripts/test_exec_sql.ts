import fs from 'fs';
import path from 'path';

// Parse .env.local
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
import { Client } from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExecSql() {
  console.log('Database URL available:', !!dbUrl);
  
  // Test exec_sql rpc
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
  console.log('RPC exec_sql test:', { data, error });

  if (dbUrl) {
    try {
      const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await pgClient.connect();
      console.log('Direct PG Connection Successful!');
      await pgClient.end();
    } catch (e: any) {
      console.log('Direct PG Connection Error:', e.message);
    }
  }
}

testExecSql();
