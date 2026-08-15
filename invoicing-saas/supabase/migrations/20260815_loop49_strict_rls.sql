-- ============================================================================
-- LOOP 4.9 — STRICT POSTGRESQL ROW LEVEL SECURITY (RLS) & MULTI-TENANT ISOLATION
-- ============================================================================

-- 1. DROP ALL WEAK / PERMISSIVE POLICIES
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

DROP POLICY IF EXISTS "Strict org select" ON public.organizations;
DROP POLICY IF EXISTS "Strict org insert" ON public.organizations;
DROP POLICY IF EXISTS "Strict org update" ON public.organizations;
DROP POLICY IF EXISTS "Strict profile select" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile update" ON public.profiles;
DROP POLICY IF EXISTS "Strict clients select" ON public.clients;
DROP POLICY IF EXISTS "Strict clients insert" ON public.clients;
DROP POLICY IF EXISTS "Strict clients update" ON public.clients;
DROP POLICY IF EXISTS "Strict clients delete" ON public.clients;
DROP POLICY IF EXISTS "Strict invoices select" ON public.invoices;
DROP POLICY IF EXISTS "Strict invoices insert" ON public.invoices;
DROP POLICY IF EXISTS "Strict invoices update" ON public.invoices;
DROP POLICY IF EXISTS "Strict invoices delete" ON public.invoices;
DROP POLICY IF EXISTS "Strict invoice_items select" ON public.invoice_items;
DROP POLICY IF EXISTS "Strict invoice_items insert" ON public.invoice_items;
DROP POLICY IF EXISTS "Strict invoice_items update" ON public.invoice_items;
DROP POLICY IF EXISTS "Strict invoice_items delete" ON public.invoice_items;
DROP POLICY IF EXISTS "Strict notifications select" ON public.notifications;
DROP POLICY IF EXISTS "Strict notifications insert" ON public.notifications;
DROP POLICY IF EXISTS "Strict notifications update" ON public.notifications;
DROP POLICY IF EXISTS "Strict notifications delete" ON public.notifications;
DROP POLICY IF EXISTS "Strict subsidiaries select" ON public.subsidiaries;
DROP POLICY IF EXISTS "Strict subsidiaries insert" ON public.subsidiaries;
DROP POLICY IF EXISTS "Strict subsidiaries update" ON public.subsidiaries;
DROP POLICY IF EXISTS "Strict subsidiaries delete" ON public.subsidiaries;
DROP POLICY IF EXISTS "Strict payments select" ON public.payments;
DROP POLICY IF EXISTS "Strict payments insert" ON public.payments;
DROP POLICY IF EXISTS "Strict payments update" ON public.payments;

-- 2. SECURITY DEFINER FUNCTION FOR AUTHORITATIVE ORGANIZATION RESOLUTION
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 3. ENABLE RLS ACROSS ALL TABLES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsidiaries ENABLE ROW LEVEL SECURITY;

-- 4. STRICT RLS POLICIES FOR PUBLIC.ORGANIZATIONS
CREATE POLICY "Strict org select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_auth_organization_id());

CREATE POLICY "Strict org insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Strict org update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.get_auth_organization_id())
  WITH CHECK (id = public.get_auth_organization_id());

-- 5. STRICT RLS POLICIES FOR PUBLIC.PROFILES
CREATE POLICY "Strict profile select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict profile insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Strict profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- TRIGGER TO PREVENT ROLE ELEVATION & ORGANIZATION_ID HIJACKING
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND OLD.role IS NOT NULL AND OLD.role != 'super_admin' THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id AND OLD.organization_id IS NOT NULL THEN
    NEW.organization_id := OLD.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 6. STRICT RLS POLICIES FOR PUBLIC.CLIENTS
CREATE POLICY "Strict clients select" ON public.clients
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict clients insert" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict clients update" ON public.clients
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict clients delete" ON public.clients
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- 7. STRICT RLS POLICIES FOR PUBLIC.INVOICES
CREATE POLICY "Strict invoices select" ON public.invoices
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict invoices insert" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict invoices update" ON public.invoices
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict invoices delete" ON public.invoices
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- 8. STRICT RLS POLICIES FOR PUBLIC.INVOICE_ITEMS
CREATE POLICY "Strict invoice_items select" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = invoice_items.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

CREATE POLICY "Strict invoice_items insert" ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = invoice_items.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

CREATE POLICY "Strict invoice_items update" ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = invoice_items.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = invoice_items.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

CREATE POLICY "Strict invoice_items delete" ON public.invoice_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = invoice_items.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

-- 9. STRICT RLS POLICIES FOR PUBLIC.NOTIFICATIONS
CREATE POLICY "Strict notifications select" ON public.notifications
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict notifications insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict notifications update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict notifications delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- 10. STRICT RLS POLICIES FOR PUBLIC.SUBSIDIARIES
CREATE POLICY "Strict subsidiaries select" ON public.subsidiaries
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict subsidiaries insert" ON public.subsidiaries
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict subsidiaries update" ON public.subsidiaries
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Strict subsidiaries delete" ON public.subsidiaries
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- 11. STRICT RLS POLICIES FOR PUBLIC.PAYMENTS
CREATE POLICY "Strict payments select" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = payments.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

CREATE POLICY "Strict payments insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = payments.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

CREATE POLICY "Strict payments update" ON public.payments
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = payments.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = payments.invoice_id AND inv.organization_id = public.get_auth_organization_id()
  ));

-- 12. PUBLIC PAYMENT TOKEN RPC FUNCTION (ZERO TENANT LEAKS)
CREATE OR REPLACE FUNCTION public.get_public_invoice_by_token(p_token text)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 4 THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', inv.id,
    'invoice_number', inv.invoice_number,
    'client_name', inv.client_name,
    'client_email', inv.client_email,
    'status', inv.status,
    'issue_date', inv.issue_date,
    'due_date', inv.due_date,
    'subtotal', inv.subtotal,
    'tax_rate', inv.tax_rate,
    'tax_amount', inv.tax_amount,
    'total', inv.total,
    'notes', inv.notes,
    'observations', inv.observations,
    'signature_url', inv.signature_url,
    'payment_token', inv.payment_token,
    'payment_method', inv.payment_method,
    'paid_at', inv.paid_at,
    'created_at', inv.created_at,
    'items', (
      SELECT json_agg(json_build_object(
        'id', item.id,
        'description', item.description,
        'quantity', item.quantity,
        'unit_price', item.unit_price,
        'line_total', item.line_total
      ))
      FROM public.invoice_items item
      WHERE item.invoice_id = inv.id
    ),
    'organizations', (
      SELECT json_build_object(
        'name', org.name,
        'logo_url', org.logo_url
      )
      FROM public.organizations org
      WHERE org.id = inv.organization_id
    )
  )::jsonb INTO v_result
  FROM public.invoices inv
  WHERE inv.payment_token = p_token OR inv.id::text = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;
