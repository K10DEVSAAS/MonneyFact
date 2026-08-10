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

async function checkSubsidiariesColumns() {
  console.log('================================================================');
  console.log('🔎 CHECKING COLUMNS OF public.subsidiaries ON SUPABASE DATABASE');
  console.log('================================================================\n');

  // Try querying table public.subsidiaries
  const { data, error } = await supabase.from('subsidiaries').select('*').limit(1);

  if (error) {
    console.error('❌ Query error on public.subsidiaries:', error.message);
    if (error.message.includes('Could not find the table')) {
      console.log('\n🚨 TABLE public.subsidiaries N\'EXISTE PAS ENCORE DANS LA BASE DE DONNÉES DISTANTE.');
    }
  } else {
    console.log('✅ Table public.subsidiaries EXISTE DANS LA BASE DE DONNÉES !');
    if (data && data.length > 0) {
      console.log('Colonnes trouvées à partir d\'une ligne existante :');
      console.log(Object.keys(data[0]));
    } else {
      console.log('Table existante mais actuellement vide (0 ligne).');
      // Insert a temporary test row to extract all column names
      const testOrgId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
      const testSubId = 'b2c3d4e5-f6a7-4890-b123-456789abcdef';
      const { data: insertedSub, error: insErr } = await supabase.from('subsidiaries').insert({
        id: testSubId,
        organization_id: testOrgId,
        name: 'Test Agency Column Verification',
        city: 'Abidjan',
      }).select('*').single();

      if (insErr) {
        console.error('Insert error when checking columns:', insErr.message);
      } else {
        console.log('\nLISTE EXACTE DES COLONNES DE public.subsidiaries EN BASE :');
        console.log(Object.keys(insertedSub));
        await supabase.from('subsidiaries').delete().eq('id', testSubId);
      }
    }
  }
}

checkSubsidiariesColumns();
