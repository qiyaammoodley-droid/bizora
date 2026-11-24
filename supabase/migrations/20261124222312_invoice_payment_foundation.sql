
-- ============================================================
-- BIZORA: INVOICE AND PAYMENT FOUNDATION
-- ============================================================

BEGIN;

-- ============================================================
-- 1. INVOICES
-- ============================================================

CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    customer_id uuid NOT NULL,

    invoice_number text NOT NULL,

    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,

    status text NOT NULL DEFAULT 'draft',

    currency text NOT NULL DEFAULT 'ZAR',

    notes text,

    created_by uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT invoices_status_check
        CHECK (
            status IN (
                'draft',
                'sent',
                'cancelled'
            )
        ),

    CONSTRAINT invoices_number_check
        CHECK (char_length(trim(invoice_number)) > 0),

    CONSTRAINT invoices_due_date_check
        CHECK (due_date >= issue_date),

    CONSTRAINT invoices_currency_check
        CHECK (currency ~ '^[A-Z]{3}$'),

    CONSTRAINT invoices_customer_same_organisation
        FOREIGN KEY (organisation_id, customer_id)
        REFERENCES public.customers(organisation_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT invoices_organisation_number_unique
        UNIQUE (organisation_id, invoice_number),

    CONSTRAINT invoices_organisation_id_id_unique
        UNIQUE (organisation_id, id)
);

CREATE INDEX invoices_organisation_idx
ON public.invoices(organisation_id);

CREATE INDEX invoices_customer_idx
ON public.invoices(customer_id);

CREATE INDEX invoices_due_date_idx
ON public.invoices(organisation_id, due_date);

CREATE INDEX invoices_status_idx
ON public.invoices(organisation_id, status);

CREATE TRIGGER invoices_set_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 2. INVOICE LINE ITEMS
-- ============================================================

CREATE TABLE public.invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL,
    invoice_id uuid NOT NULL,

    description text NOT NULL,

    quantity numeric(12,2) NOT NULL DEFAULT 1,
    unit_price numeric(12,2) NOT NULL,

    line_total numeric(14,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT invoice_items_description_check
        CHECK (char_length(trim(description)) > 0),

    CONSTRAINT invoice_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT invoice_items_price_check
        CHECK (unit_price >= 0),

    CONSTRAINT invoice_items_invoice_same_organisation
        FOREIGN KEY (organisation_id, invoice_id)
        REFERENCES public.invoices(organisation_id, id)
        ON DELETE CASCADE
);

CREATE INDEX invoice_items_invoice_idx
ON public.invoice_items(organisation_id, invoice_id);


-- ============================================================
-- 3. MANUAL PAYMENTS
-- ============================================================

CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL,
    invoice_id uuid NOT NULL,

    amount numeric(14,2) NOT NULL,

    payment_method text NOT NULL,

    reference text,
    notes text,

    payment_date timestamptz NOT NULL DEFAULT now(),

    recorded_by uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT payments_amount_check
        CHECK (amount > 0),

    CONSTRAINT payments_method_check
        CHECK (
            payment_method IN (
                'cash',
                'eft',
                'card',
                'other'
            )
        ),

    CONSTRAINT payments_invoice_same_organisation
        FOREIGN KEY (organisation_id, invoice_id)
        REFERENCES public.invoices(organisation_id, id)
        ON DELETE RESTRICT
);

CREATE INDEX payments_invoice_idx
ON public.payments(organisation_id, invoice_id);

CREATE INDEX payments_date_idx
ON public.payments(organisation_id, payment_date DESC);


-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. INVOICE SECURITY
-- Owners and admins only.
-- ============================================================

CREATE POLICY "Owners and admins can view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);

CREATE POLICY "Owners and admins can create invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
    AND created_by = (SELECT auth.uid())
);

CREATE POLICY "Owners and admins can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
)
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);


-- ============================================================
-- 6. INVOICE ITEM SECURITY
-- ============================================================

CREATE POLICY "Owners and admins can view invoice items"
ON public.invoice_items
FOR SELECT
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);

CREATE POLICY "Owners and admins can create invoice items"
ON public.invoice_items
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);

CREATE POLICY "Owners and admins can update invoice items"
ON public.invoice_items
FOR UPDATE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
)
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);

CREATE POLICY "Owners and admins can delete invoice items"
ON public.invoice_items
FOR DELETE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);


-- ============================================================
-- 7. PAYMENT SECURITY
-- Payments can be recorded but not edited or deleted.
-- This preserves payment history.
-- ============================================================

CREATE POLICY "Owners and admins can view payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);

CREATE POLICY "Owners and admins can record payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
    AND recorded_by = (SELECT auth.uid())
);


-- ============================================================
-- 8. TABLE PERMISSIONS
-- ============================================================

GRANT SELECT, INSERT, UPDATE
ON public.invoices
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.invoice_items
TO authenticated;

GRANT SELECT, INSERT
ON public.payments
TO authenticated;


-- ============================================================
-- 9. DATABASE DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.invoices IS
'Invoices belonging to individual Bizora organisations.';

COMMENT ON TABLE public.invoice_items IS
'Line items belonging to individual organisation invoices.';

COMMENT ON TABLE public.payments IS
'Immutable manual payment records linked to organisation invoices.';

COMMENT ON COLUMN public.invoice_items.line_total IS
'Automatically calculated from quantity multiplied by unit price.';

COMMENT ON COLUMN public.payments.amount IS
'Amount recorded for an individual payment, supporting partial payments.';


-- ============================================================
-- 10. FINANCIAL INTEGRITY PROTECTIONS
-- ============================================================

-- Prevent invoice items from being changed after a payment
-- has been recorded.

CREATE OR REPLACE FUNCTION public.prevent_paid_invoice_item_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    target_invoice_id uuid;
    target_organisation_id uuid;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
           OR NEW.organisation_id IS DISTINCT FROM OLD.organisation_id THEN
            RAISE EXCEPTION 'Invoice items cannot be moved to another invoice.';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        target_invoice_id := OLD.invoice_id;
        target_organisation_id := OLD.organisation_id;
    ELSE
        target_invoice_id := NEW.invoice_id;
        target_organisation_id := NEW.organisation_id;
    END IF;

    PERFORM 1
    FROM public.invoices
    WHERE id = target_invoice_id
      AND organisation_id = target_organisation_id
    FOR UPDATE;

    IF EXISTS (
        SELECT 1
        FROM public.payments
        WHERE invoice_id = target_invoice_id
          AND organisation_id = target_organisation_id
    ) THEN
        RAISE EXCEPTION
            'Invoice items cannot be changed after a payment has been recorded.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.prevent_paid_invoice_item_changes()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER invoice_items_prevent_paid_changes
BEFORE INSERT OR UPDATE OR DELETE
ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_paid_invoice_item_changes();


-- Prevent payments from exceeding the outstanding balance.
-- Locking the invoice row prevents concurrent payments from
-- spending the same outstanding balance.

CREATE OR REPLACE FUNCTION public.validate_invoice_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    invoice_status text;
    invoice_total numeric(14,2);
    total_paid numeric(14,2);
    outstanding_balance numeric(14,2);
BEGIN
    SELECT status
    INTO invoice_status
    FROM public.invoices
    WHERE id = NEW.invoice_id
      AND organisation_id = NEW.organisation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found.';
    END IF;

    IF invoice_status <> 'sent' THEN
        RAISE EXCEPTION
            'Payments can only be recorded against sent invoices.';
    END IF;

    SELECT COALESCE(SUM(line_total), 0)
    INTO invoice_total
    FROM public.invoice_items
    WHERE invoice_id = NEW.invoice_id
      AND organisation_id = NEW.organisation_id;

    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM public.payments
    WHERE invoice_id = NEW.invoice_id
      AND organisation_id = NEW.organisation_id;

    outstanding_balance := invoice_total - total_paid;

    IF invoice_total <= 0 THEN
        RAISE EXCEPTION
            'An invoice must contain billable items before payment.';
    END IF;

    IF NEW.amount > outstanding_balance THEN
        RAISE EXCEPTION
            'Payment exceeds the outstanding invoice balance of %.',
            outstanding_balance;
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_invoice_payment()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER payments_validate_amount
BEFORE INSERT
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_invoice_payment();

COMMIT;
