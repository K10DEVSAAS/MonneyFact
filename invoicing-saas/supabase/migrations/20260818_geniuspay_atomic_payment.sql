-- =========================================================================
-- MIGRATION: GENIUSPAY ATOMIC TRANSACTION & SERVICE_ROLE EXCLUSIVE PERMISSIONS
-- =========================================================================

-- 1. Ensure UNIQUE constraint on payments(provider_transaction_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_provider_transaction_id_unique'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_provider_transaction_id_unique UNIQUE (provider_transaction_id);
    END IF;
END $$;

-- 2. Stored Procedure for Atomic Payment Confirmation with Row Locking (FOR UPDATE),
-- Explicit search_path, Amount Invariant, and Strict Idempotency Distinction.
CREATE OR REPLACE FUNCTION public.process_geniuspay_payment_atomic(
    p_invoice_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_provider TEXT,
    p_provider_transaction_id TEXT,
    p_payment_method TEXT,
    p_metadata JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inv RECORD;
    v_existing_tx TEXT;
BEGIN
    -- 1. Explicit row locking (FOR UPDATE) to block race conditions on invoice
    SELECT id, status, total, organization_id, payment_transaction_id INTO v_inv
    FROM public.invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'INVOICE_NOT_FOUND', 
            'message', 'Facture introuvable'
        );
    END IF;

    -- 2. Database-level Amount Validation Invariant
    IF ROUND(v_inv.total, 2) <> ROUND(p_amount, 2) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'AMOUNT_MISMATCH',
            'message', 'Le montant fourni ne correspond pas au montant de la facture'
        );
    END IF;

    -- 3. Idempotency Check with Distinction between Same vs Different Transaction
    IF v_inv.status = 'paid' THEN
        IF v_inv.payment_transaction_id = p_provider_transaction_id THEN
            RETURN jsonb_build_object(
                'success', true, 
                'code', 'ALREADY_PAID_SAME_TX', 
                'already_paid', true, 
                'message', 'Facture déjà acquittée avec la même transaction (Idempotent)'
            );
        ELSE
            -- Check if provider_transaction_id exists in payments table
            SELECT provider_transaction_id INTO v_existing_tx
            FROM public.payments
            WHERE provider_transaction_id = p_provider_transaction_id;

            IF FOUND THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'code', 'ALREADY_PROCESSED_SAME_TX',
                    'already_paid', true,
                    'message', 'Transaction déjà enregistrée (Idempotence UNIQUE)'
                );
            ELSE
                RETURN jsonb_build_object(
                    'success', true,
                    'code', 'INVOICE_ALREADY_PAID_DIFFERENT_TX',
                    'already_paid', true,
                    'message', 'Facture déjà acquittée par une transaction antérieure distincte'
                );
            END IF;
        END IF;
    END IF;

    -- 4. Atomic Insert Payment Record
    INSERT INTO public.payments (
        invoice_id,
        amount,
        currency,
        provider,
        provider_transaction_id,
        status,
        paid_at,
        metadata
    ) VALUES (
        p_invoice_id,
        p_amount,
        COALESCE(p_currency, 'FCFA'),
        COALESCE(p_provider, 'geniuspay'),
        p_provider_transaction_id,
        'paid',
        NOW(),
        p_metadata
    );

    -- 5. Atomic Update Invoice Status
    UPDATE public.invoices
    SET
        status = 'paid',
        paid_at = NOW(),
        payment_method = p_payment_method,
        payment_transaction_id = p_provider_transaction_id
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true, 
        'code', 'OK', 
        'already_paid', false, 
        'invoice_id', p_invoice_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', true, 
            'code', 'ALREADY_PROCESSED_UNIQUE_VIOLATION', 
            'already_paid', true, 
            'message', 'Transaction déjà enregistrée (Contrainte UNIQUE)'
        );
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- 3. Strict Permission Restriction: EXCLUSIVELY service_role (NO public, NO authenticated)
REVOKE EXECUTE ON FUNCTION public.process_geniuspay_payment_atomic FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_geniuspay_payment_atomic FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_geniuspay_payment_atomic TO service_role;
