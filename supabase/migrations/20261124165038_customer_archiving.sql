
-- Add customer archiving support.
-- Archived customers remain in the database so their
-- historical bookings and records are preserved.

ALTER TABLE public.customers
ADD COLUMN archived_at timestamptz DEFAULT NULL;

-- Index active customers for efficient organisation-level queries.
CREATE INDEX customers_active_by_organisation_idx
ON public.customers (organisation_id, created_at DESC)
WHERE archived_at IS NULL;

COMMENT ON COLUMN public.customers.archived_at IS
'Timestamp when the customer was archived. NULL means the customer is active.';
