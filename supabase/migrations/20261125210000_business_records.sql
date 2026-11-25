CREATE TABLE IF NOT EXISTS public.business_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text NOT NULL DEFAULT 'General',
    description text,
    record_date date NOT NULL DEFAULT CURRENT_DATE,
    reference_url text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT business_records_title_check
        CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS business_records_org_date_idx
ON public.business_records (organisation_id, record_date DESC);

ALTER TABLE public.business_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view business records"
ON public.business_records;

CREATE POLICY "Members can view business records"
ON public.business_records
FOR SELECT TO authenticated
USING (
    public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    )
);

DROP POLICY IF EXISTS "Members can create business records"
ON public.business_records;

CREATE POLICY "Members can create business records"
ON public.business_records
FOR INSERT TO authenticated
WITH CHECK (
    created_by = auth.uid()
    AND public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin', 'employee']::text[]
    )
);

DROP POLICY IF EXISTS "Admins can update business records"
ON public.business_records;

CREATE POLICY "Admins can update business records"
ON public.business_records
FOR UPDATE TO authenticated
USING (
    public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    )
)
WITH CHECK (
    public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    )
);

DROP POLICY IF EXISTS "Admins can delete business records"
ON public.business_records;

CREATE POLICY "Admins can delete business records"
ON public.business_records
FOR DELETE TO authenticated
USING (
    public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.business_records TO authenticated;

DROP TRIGGER IF EXISTS set_business_records_updated_at
ON public.business_records;

CREATE TRIGGER set_business_records_updated_at
BEFORE UPDATE ON public.business_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
