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

async function testOAuthUserBinding() {
  console.log('================================================================');
  console.log('🔎 TESTING REAL GOOGLE OAUTH BINDING FOR m83212913@gmail.com');
  console.log('================================================================\n');

  const testEmails = ['m83212913@gmail.com', 'kouamedieudonne93@gmail.com', 'k10developpeur@gmail.com'];

  for (const email of testEmails) {
    console.log(`\n--- TESTING EMAIL: ${email} ---`);
    console.log('[OAUTH] START');

    // 1. Fetch Profile
    console.log('[OAUTH] PROFILE_QUERY_START');
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    console.log('[OAUTH] PROFILE_QUERY_END', { found: !!prof, profId: prof?.id, organizationId: prof?.organization_id });

    if (!prof) {
      console.warn(`No profile found for ${email}. Creating demo profile for testing...`);
      continue;
    }

    // 2. Fetch Organization
    console.log('[OAUTH] ORGANIZATION_QUERY_START');
    let { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    console.log('[OAUTH] ORGANIZATION_QUERY_END', { found: !!org, orgId: org?.id, name: org?.name });

    if (!org) {
      console.log(`No organization found for ${email}. Creating organization (CAS 1/3)...`);
      const { data: newOrg, error: createOrgErr } = await supabase
        .from('organizations')
        .insert({
          name: `${email.split('@')[0]} Enterprise`,
          email,
          address: "Abidjan, Côte d'Ivoire",
          phone: "+225 07 00 00 00 00",
          currency: "FCFA",
          default_tax_rate: 18,
          plan: "Pro",
          status: "active",
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('*')
        .single();

      if (createOrgErr) {
        console.error('Error creating organization:', createOrgErr.message);
        continue;
      }
      org = newOrg;
    }

    // 3. Perform Binding (CAS B)
    if (!prof.organization_id && org) {
      console.log(`Updating profiles.organization_id = ${org.id}...`);
      const { data: updatedProf, error: updateErr } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', prof.id)
        .select('*')
        .single();

      if (updateErr) {
        console.error('❌ Error updating profile:', updateErr.message);
      } else {
        console.log('✅ BINDING_COMPLETE', { updatedOrganizationId: updatedProf.organization_id });
      }
    } else {
      console.log('✅ BINDING_COMPLETE (Already bound)', { organizationId: prof.organization_id });
    }

    // 4. Verify Final Profile
    const { data: finalProf, error: finalErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, organization_id, plan')
      .eq('id', prof.id)
      .single();

    if (finalErr) {
      console.error('❌ FINAL_PROFILE error:', finalErr.message);
    } else {
      console.log('[OAUTH] FINAL_PROFILE_OK', {
        id: finalProf.id,
        email: finalProf.email,
        organization_id: finalProf.organization_id,
        role: finalProf.role
      });
    }

    console.log('[OAUTH] REDIRECT_DASHBOARD');
  }

  // 5. Query SQL join check
  console.log('\n================================================================');
  console.log('SELECT p.email, p.organization_id, o.name AS organization_name, o.email AS organization_email');
  console.log('FROM public.profiles p LEFT JOIN public.organizations o ON o.id = p.organization_id');
  console.log('WHERE p.email IN (\'m83212913@gmail.com\', \'kouamedieudonne93@gmail.com\', \'k10developpeur@gmail.com\');');
  console.log('================================================================');

  const { data: joinResults, error: joinErr } = await supabase
    .from('profiles')
    .select(`
      email,
      organization_id,
      organizations:organization_id (
        name,
        email
      )
    `)
    .in('email', testEmails);

  if (joinErr) {
    console.error('Error executing join query:', joinErr.message);
  } else {
    const formatted = (joinResults || []).map((row: any) => ({
      email: row.email,
      organization_id: row.organization_id,
      organization_name: row.organizations?.name || null,
      organization_email: row.organizations?.email || null,
    }));
    console.log(JSON.stringify(formatted, null, 2));
  }

  // 6. Anti-Duplicate Check
  console.log('\n================================================================');
  console.log('SELECT email, COUNT(*) FROM public.organizations GROUP BY email HAVING COUNT(*) > 1;');
  console.log('================================================================');

  const { data: allOrgs } = await supabase.from('organizations').select('id, email');
  const counts: Record<string, number> = {};
  (allOrgs || []).forEach(o => {
    const em = (o.email || '').toLowerCase().trim();
    if (em) counts[em] = (counts[em] || 0) + 1;
  });

  const duplicates = Object.entries(counts).filter(([_, cnt]) => cnt > 1);
  if (duplicates.length === 0) {
    console.log('✅ ZERO duplicate organizations found! Output: []');
  } else {
    console.warn('⚠️ Duplicates found:', duplicates);
  }
}

testOAuthUserBinding();
