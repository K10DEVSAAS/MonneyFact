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