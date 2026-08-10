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

async function verifyAndHealProfiles() {
  console.log('================================================================');
  console.log('🔎 AUDITING AND BINDING PROFILES TO ORGANIZATIONS IN SUPABASE');
  console.log('================================================================\n');

  // 1. Fetch profiles
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, organization_id');

  if (profErr) {
    console.error('Error fetching profiles:', profErr.message);
    return;
  }

  console.log(`Total profiles found in public.profiles: ${profiles?.length || 0}`);
  console.log('----------------------------------------------------------------');

  for (const prof of profiles || []) {
    const email = (prof.email || '').toLowerCase().trim();
    console.log(`Profile User ID: ${prof.id} | Email: ${email} | Current org_id: ${prof.organization_id || 'NULL'}`);

    if (!prof.organization_id && email) {
      // Find matching org by email
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle();

      if (org) {
        console.log(`  -> Matching organization found: "${org.name}" (ID: ${org.id}). Updating profile...`);
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ organization_id: org.id })
          .eq('id', prof.id);

        if (updateErr) {
          console.error(`  ❌ Error updating profile for ${email}:`, updateErr.message);
        } else {
          console.log(`  ✅ Profile for ${email} successfully bound to organization ${org.id}!`);
        }
      } else {
        console.log(`  -> No matching organization found for email: ${email}. Profile will be bound upon next login/callback.`);
      }
    }
  }

  // 2. Query join result as requested in Section 20
  console.log('\n--- VERIFYING JOIN: public.profiles LEFT JOIN public.organizations ---');
  const { data: joinRes, error: joinErr } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      organization_id,
      organizations:organization_id (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (joinErr) {
    console.error('Error on join query:', joinErr.message);
  } else {
    const formatted = (joinRes || []).map((row: any) => ({
      profile_id: row.id,
      email: row.email,
      organization_id: row.organization_id,
      organization_name: row.organizations?.name || null,
    }));
    console.log(JSON.stringify(formatted, null, 2));
  }

  // 3. Duplicate check as requested in Section 21
  console.log('\n--- CHECKING DUPLICATE ORGANIZATIONS BY EMAIL ---');
  const { data: allOrgs } = await supabase.from('organizations').select('id, email, name');
  const emailCounts: Record<string, number> = {};
  (allOrgs || []).forEach(o => {
    const em = (o.email || '').toLowerCase().trim();
    if (em) emailCounts[em] = (emailCounts[em] || 0) + 1;
  });

  const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1);
  if (duplicates.length === 0) {
    console.log('✅ ZERO duplicate organizations found! Array: []');
  } else {
    console.warn('⚠️ Duplicate organizations detected:', duplicates);
  }
}

verifyAndHealProfiles();
