
-- ============================================================
-- BIZORA: CUSTOMER AND BOOKING FOUNDATION
-- Migration: 20261124161854_customer_booking_foundation.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. HARDEN EXISTING FUNCTION PERMISSIONS
-- ============================================================

REVOKE ALL ON FUNCTION public.create_organisation(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_organisation(text)
TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_org_role(uuid, text[])
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[])
TO authenticated;

REVOKE ALL ON FUNCTION public.is_org_member(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid)
TO authenticated;


-- ============================================================
-- 2. ADD EMPLOYEE ROLE
-- ============================================================

ALTER TABLE public.memberships
DROP CONSTRAINT memberships_role_check;

ALTER TABLE public.memberships
ADD CONSTRAINT memberships_role_check
CHECK (role IN ('owner', 'admin', 'employee'));


-- ============================================================
-- 3. UPDATED_AT HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_updated_at()
FROM PUBLIC, anon, authenticated;


-- ============================================================
-- 4. CUSTOMERS TABLE
-- ============================================================

CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    full_name text NOT NULL,
    email text,
    phone text,
    notes text,

    created_by uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT customers_name_check
        CHECK (char_length(trim(full_name)) > 0),

    CONSTRAINT customers_email_check
        CHECK (
            email IS NULL
            OR char_length(trim(email)) > 0
        ),

    CONSTRAINT customers_phone_check
        CHECK (
            phone IS NULL
            OR char_length(trim(phone)) > 0
        ),

    CONSTRAINT customers_organisation_id_id_key
        UNIQUE (organisation_id, id)
);

CREATE INDEX customers_organisation_id_idx
ON public.customers(organisation_id);

CREATE INDEX customers_organisation_name_idx
ON public.customers(organisation_id, full_name);

CREATE INDEX customers_created_at_idx
ON public.customers(created_at DESC);

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 5. BOOKINGS TABLE
-- ============================================================

CREATE TABLE public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    customer_id uuid NOT NULL,

    assigned_user_id uuid,

    title text NOT NULL,

    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,

    status text NOT NULL DEFAULT 'scheduled',

    notes text,

    created_by uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT bookings_title_check
        CHECK (char_length(trim(title)) > 0),

    CONSTRAINT bookings_time_check
        CHECK (end_at > start_at),

    CONSTRAINT bookings_status_check
        CHECK (
            status IN (
                'scheduled',
                'confirmed',
                'completed',
                'cancelled',
                'no_show'
            )
        ),

    CONSTRAINT bookings_customer_same_organisation
        FOREIGN KEY (organisation_id, customer_id)
        REFERENCES public.customers(organisation_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT bookings_assigned_member_same_organisation
        FOREIGN KEY (organisation_id, assigned_user_id)
        REFERENCES public.memberships(organisation_id, user_id)
        ON DELETE RESTRICT
);

CREATE INDEX bookings_organisation_id_idx
ON public.bookings(organisation_id);

CREATE INDEX bookings_customer_id_idx
ON public.bookings(customer_id);

CREATE INDEX bookings_assigned_user_id_idx
ON public.bookings(assigned_user_id);

CREATE INDEX bookings_organisation_start_idx
ON public.bookings(organisation_id, start_at);

CREATE INDEX bookings_organisation_status_idx
ON public.bookings(organisation_id, status);

CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 7. CUSTOMERS SECURITY POLICIES
-- ============================================================

CREATE POLICY "Organisation members can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    (SELECT public.is_org_member(organisation_id))
);

CREATE POLICY "Organisation members can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
    AND created_by = (SELECT auth.uid())
);

CREATE POLICY "Organisation members can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
)
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
);

CREATE POLICY "Owners and admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);


-- ============================================================
-- 8. BOOKINGS SECURITY POLICIES
-- ============================================================

CREATE POLICY "Organisation members can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    (SELECT public.is_org_member(organisation_id))
);

CREATE POLICY "Organisation members can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
    AND created_by = (SELECT auth.uid())
);

CREATE POLICY "Organisation members can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
)
WITH CHECK (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    ))
);

CREATE POLICY "Owners and admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (
    (SELECT public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    ))
);


-- ============================================================
-- 9. TABLE PERMISSIONS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.customers
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.bookings
TO authenticated;


-- ============================================================
-- 10. COMMENTS FOR DATABASE DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.customers IS
'Customers belonging to individual Bizora organisations.';

COMMENT ON TABLE public.bookings IS
'Service bookings belonging to individual Bizora organisations.';

COMMENT ON COLUMN public.bookings.assigned_user_id IS
'Optional authenticated user assigned through an organisation membership.';

COMMENT ON COLUMN public.bookings.status IS
'Booking status: scheduled, confirmed, completed, cancelled or no_show.';

COMMIT;
