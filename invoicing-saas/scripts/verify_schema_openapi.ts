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

async function fetchOpenApiSchema() {
  console.log('================================================================');
  console.log('🔎 LISTING ALL SCHEMAS EXPOSED IN SUPABASE POSTGREST API');
  console.log('================================================================\n');

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    const schema = await res.json();
    const definitions = schema?.definitions || {};

    console.log('Tables exposed in PostgREST schema cache:');
    console.log(Object.keys(definitions));

    for (const [tableName, def] of Object.entries(definitions)) {
      console.log(`\n--- TABLE: ${tableName} ---`);
      const props = (def as any).properties || {};
      for (const [colName, colMeta] of Object.entries(props)) {
        console.log(`  - ${colName} (${(colMeta as any).format || (colMeta as any).type || 'text'})`);
      }
    }

  } catch (err: any) {
    console.error('Error fetching OpenAPI schema:', err.message);
  }
}

fetchOpenApiSchema();
