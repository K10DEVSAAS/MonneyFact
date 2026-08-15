import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostic() {
  console.log('================================================================');
  console.log('LOOP 4.8 — DIAGNOSTIC COMPLETS DU PIPELINE CLIENTS MULTI-DEVICE');
  console.log('================================================================\n');

  // 1. Check SAM organization in public.organizations / public.profiles
  console.log('1. Recherche des organisations et profils pour SAM...');
  const { data: orgs } = await supabase.from('organizations').select('*').ilike('name', '%SAM%');
  console.log('Organisations SAM trouvées:', orgs);

  if (orgs && orgs.length > 0) {
    const samOrg = orgs[0];
    console.log(`\nOrganisation SAM ID: ${samOrg.id}`);

    // 2. Fetch clients for SAM organization
    const { data: dbClients, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', samOrg.id)
      .order('created_at', { ascending: false });

    console.log('\n2. Résultat SELECT public.clients pour SAM:', {
      count: dbClients?.length || 0,
      error: clientErr,
      clients: dbClients,
    });

    // 3. Fetch notifications for SAM organization
    const { data: dbNotifs, error: notifErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', samOrg.id)
      .order('created_at', { ascending: false });

    console.log('\n3. Résultat SELECT public.notifications pour SAM:', {
      count: dbNotifs?.length || 0,
      error: notifErr,
      notifications: dbNotifs,
    });
  } else {
    // List latest 5 clients across database
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name, email, phone, organization_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('\n2. 5 derniers clients dans public.clients:', allClients);

    const { data: allNotifs } = await supabase
      .from('notifications')
      .select('id, title, message, organization_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('\n3. 5 dernières notifications dans public.notifications:', allNotifs);
  }
}

runDiagnostic();
