
BEGIN;

-- Prevent invoice items from being changed once an invoice
-- has been sent or a payment has been recorded.

CREATE OR REPLACE FUNCTION public.prevent_locked_invoice_item_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    target_invoice_id uuid;
    target_organisation_id uuid;
    target_status text;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
           OR NEW.organisation_id IS DISTINCT FROM OLD.organisation_id THEN
            RAISE EXCEPTION
                'Invoice items cannot be moved to another invoice.';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        target_invoice_id := OLD.invoice_id;
        target_organisation_id := OLD.organisation_id;
    ELSE
        target_invoice_id := NEW.invoice_id;
        target_organisation_id := NEW.organisation_id;
    END IF;

    SELECT status
    INTO target_status
    FROM public.invoices
    WHERE id = target_invoice_id
      AND organisation_id = target_organisation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found.';
    END IF;

    IF target_status <> 'draft' THEN
        RAISE EXCEPTION
            'Invoice items can only be changed while the invoice is a draft.';
    END IF;

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

REVOKE ALL ON FUNCTION public.prevent_locked_invoice_item_changes()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS invoice_items_prevent_paid_changes
ON public.invoice_items;

CREATE TRIGGER invoice_items_prevent_locked_changes
BEFORE INSERT OR UPDATE OR DELETE
ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_invoice_item_changes();


-- Prevent sent invoices from being edited or cancelled.
-- Draft invoices can still be edited.

CREATE OR REPLACE FUNCTION public.prevent_locked_invoice_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.organisation_id IS DISTINCT FROM OLD.organisation_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION
            'Invoice identity and ownership cannot be changed.';
    END IF;

    IF OLD.status <> 'draft' THEN
        RAISE EXCEPTION
            'Only draft invoices can be edited.';
    END IF;

    IF NEW.status NOT IN ('draft', 'sent', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid invoice status.';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.prevent_locked_invoice_updates()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS invoices_prevent_locked_updates
ON public.invoices;

CREATE TRIGGER invoices_prevent_locked_updates
BEFORE UPDATE
ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_invoice_updates();

COMMIT;
