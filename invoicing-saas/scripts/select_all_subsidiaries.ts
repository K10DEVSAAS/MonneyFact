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

async function selectAllSubsidiaries() {
  console.log('================================================================');
  console.log('🔎 EXECUTING: SELECT id, organization_id, name, status, created_at FROM public.subsidiaries ORDER BY created_at;');
  console.log('================================================================\n');

  const { data, error } = await supabase
    .from('subsidiaries')
    .select('id, organization_id, name, status, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ SQL Execution Error:', error.message);
    return;
  }

  console.log(`[RÉSULTAT POSTGRESQL RÉEL] (${data ? data.length : 0} ligne(s) trouvée(s))\n`);
  if (!data || data.length === 0) {
    console.log('0 ligne retournée (La table public.subsidiaries existe mais n\'a pas encore de sous-entreprise enregistrée).');
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

selectAllSubsidiaries();
