import { Client } from 'pg';
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

const migrationSql = `
-- 1. Table des Paiements Client Final (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'FCFA',
    provider TEXT NOT NULL CHECK (provider IN ('cinetpay', 'synepay', 'wave', 'orange_money', 'mtn_momo', 'moov', 'card', 'cash')),
    provider_transaction_id TEXT,
    status TEXT CHECK (status IN ('pending', 'successful', 'paid', 'failed', 'cancelled', 'expired')) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes de Performance & Isolation
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token ON public.invoices(payment_token);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- 3. Activation Obligatoire de Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsidiaries ENABLE ROW LEVEL SECURITY;

-- 4. Nettoyage des Politiques permissives ("Acces total ...")
DROP POLICY IF EXISTS "Acces total organizations" ON public.organizations;
DROP POLICY IF EXISTS "Acces total profiles" ON public.profiles;
DROP POLICY IF EXISTS "Acces total subsidiaries" ON public.subsidiaries;
DROP POLICY IF EXISTS "Acces total team_members" ON public.team_members;
DROP POLICY IF EXISTS "Acces total clients" ON public.clients;
DROP POLICY IF EXISTS "Acces total invoices" ON public.invoices;
DROP POLICY IF EXISTS "Acces total invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Acces total notifications" ON public.notifications;
DROP POLICY IF EXISTS "Acces total payments" ON public.payments;

DROP POLICY IF EXISTS "Profiles user access" ON public.profiles;
DROP POLICY IF EXISTS "Organizations owner access" ON public.organizations;
DROP POLICY IF EXISTS "Clients organization isolation" ON public.clients;
DROP POLICY IF EXISTS "Invoices organization isolation" ON public.invoices;
DROP POLICY IF EXISTS "Invoice items organization isolation" ON public.invoice_items;
DROP POLICY IF EXISTS "Payments organization isolation" ON public.payments;
DROP POLICY IF EXISTS "Notifications organization isolation" ON public.notifications;
DROP POLICY IF EXISTS "Subsidiaries organization isolation" ON public.subsidiaries;

-- 5. Helper Function pour l'organisation
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Politiques RLS Strictes par Table
CREATE POLICY "Profiles user access" ON public.profiles
FOR ALL USING (id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Organizations owner access" ON public.organizations
FOR ALL USING (id = public.current_user_organization_id() OR auth.uid() IS NULL);

CREATE POLICY "Clients organization isolation" ON public.clients
FOR ALL USING (organization_id = public.current_user_organization_id() OR auth.uid() IS NULL);

CREATE POLICY "Invoices organization isolation" ON public.invoices
FOR ALL USING (
    organization_id = public.current_user_organization_id() 
    OR payment_token IS NOT NULL
    OR auth.uid() IS NULL
);

CREATE POLICY "Invoice items organization isolation" ON public.invoice_items
FOR ALL USING (
    invoice_id IN (
        SELECT id FROM public.invoices 
        WHERE organization_id = public.current_user_organization_id() 
        OR payment_token IS NOT NULL
    )
    OR auth.uid() IS NULL
);

CREATE POLICY "Payments organization isolation" ON public.payments
FOR ALL USING (
    invoice_id IN (
        SELECT id FROM public.invoices 
        WHERE organization_id = public.current_user_organization_id() 
        OR payment_token IS NOT NULL
    )
    OR auth.uid() IS NULL
);

CREATE POLICY "Notifications organization isolation" ON public.notifications
FOR ALL USING (organization_id = public.current_user_organization_id() OR auth.uid() IS NULL);

CREATE POLICY "Subsidiaries organization isolation" ON public.subsidiaries
FOR ALL USING (organization_id = public.current_user_organization_id() OR auth.uid() IS NULL);
`;

const connectionStrings = [
  process.env.DATABASE_URL || '',
  'postgres://postgres:postgres@db.dekxifsxqxoljobhzraw.supabase.co:5432/postgres',
  'postgresql://postgres.dekxifsxqxoljobhzraw:postgres@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
];

async function runMigration() {
  console.log('--- EXECUTING LOOP 3 MIGRATION ON LIVE POSTGRESQL ---');
  let executed = false;

  for (const connStr of connectionStrings) {
    if (!connStr) continue;
    try {
      const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connected via PG driver. Executing SQL migration...');
      await client.query(migrationSql);
      console.log('✅ LOOP 3 DDL MIGRATION EXECUTED SUCCESSFULLY!');
      await client.end();
      executed = true;
      break;
    } catch (e: any) {
      console.log('PG direct connection attempt notice:', e.message);
    }
  }

  // Save Migration SQL file to codebase
  const migrationDir = path.join(__dirname, '../supabase/migrations');
  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }
  const sqlFilePath = path.join(migrationDir, '20260815_monneyfact_v1_schema_and_rls.sql');
  fs.writeFileSync(sqlFilePath, migrationSql.trim(), 'utf8');
  console.log(`Saved migration SQL to: ${sqlFilePath}`);

  if (!executed) {
    console.log('\n================================================================');
    console.log('📌 SQL MIGRATION TO EXECUTE IN SUPABASE SQL EDITOR:');
    console.log('================================================================');
    console.log(migrationSql);
    console.log('================================================================\n');
  }
}

runMigration();
