-- ========================================================
-- SCHÉMA DE BASE DE DONNÉES PRODUCTION MONNEYFACT (CÔTE D'IVOIRE)
-- SYNEPAY READY & PUBLIC GUEST PAYMENT ENGINE
-- ========================================================

-- 1. Table des Entreprises (Organizations)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    tax_id TEXT, -- NCC / Compte Contribuable
    logo_url TEXT,
    currency TEXT DEFAULT 'FCFA',
    default_tax_rate NUMERIC DEFAULT 18,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Utilisateurs & Rôles (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('client', 'super_admin')) DEFAULT 'client',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    plan TEXT CHECK (plan IN ('Gratuit', 'Pro', 'Business')) DEFAULT 'Pro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Clients (Clients)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT DEFAULT 'Abidjan',
    country TEXT DEFAULT 'Côte d''Ivoire',
    total_invoiced NUMERIC DEFAULT 0,
    unpaid_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Factures (Invoices) - Avec champs SynePay & Jeton de Paiement Sécurisé
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC DEFAULT 18,
    tax_amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    notes TEXT,
    observations TEXT,
    signature_url TEXT,
    payment_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    payment_method TEXT CHECK (payment_method IN ('wave', 'orange_money', 'mtn_momo', 'moov', 'card')),
    payment_transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Lignes de Facture (Invoice Items)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    line_total NUMERIC NOT NULL
);

-- 6. Table des Notifications Isolées par Entreprise (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer Row Level Security (RLS) sur toutes les tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer d'anciennes politiques si existantes pour déploiement propre
DROP POLICY IF EXISTS "Acces total organizations" ON public.organizations;
DROP POLICY IF EXISTS "Acces total profiles" ON public.profiles;
DROP POLICY IF EXISTS "Acces total clients" ON public.clients;
DROP POLICY IF EXISTS "Acces total invoices" ON public.invoices;
DROP POLICY IF EXISTS "Acces total invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Acces total notifications" ON public.notifications;

-- Politiques de sécurité (Lecture/Écriture autorisées)
CREATE POLICY "Acces total organizations" ON public.organizations FOR ALL USING (true);
CREATE POLICY "Acces total profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Acces total clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Acces total invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Acces total invoice_items" ON public.invoice_items FOR ALL USING (true);
CREATE POLICY "Acces total notifications" ON public.notifications FOR ALL USING (true);
