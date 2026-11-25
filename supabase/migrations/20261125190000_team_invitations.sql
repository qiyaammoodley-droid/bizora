
BEGIN;

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    email text NOT NULL,

    role text NOT NULL DEFAULT 'employee'
        CHECK (role IN ('admin', 'employee')),

    status text NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'accepted',
                'revoked',
                'expired',
                'failed'
            )
        ),

    invited_by uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    invited_user_id uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    created_at timestamptz NOT NULL DEFAULT now(),

    expires_at timestamptz NOT NULL
        DEFAULT (now() + interval '7 days'),

    accepted_at timestamptz,
    revoked_at timestamptz,

    CONSTRAINT team_invitations_email_check
        CHECK (
            email = lower(trim(email))
            AND char_length(email) BETWEEN 5 AND 254
        ),

    CONSTRAINT team_invitations_expiry_check
        CHECK (expires_at > created_at)
);

-- Prevent duplicate pending invitations to the same email
-- within one business workspace.

CREATE UNIQUE INDEX IF NOT EXISTS
    team_invitations_pending_email_idx
ON public.team_invitations (
    organisation_id,
    email
)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS
    team_invitations_organisation_idx
ON public.team_invitations (organisation_id);

CREATE INDEX IF NOT EXISTS
    team_invitations_invited_user_idx
ON public.team_invitations (invited_user_id);

-- Enable Row Level Security.

ALTER TABLE public.team_invitations
ENABLE ROW LEVEL SECURITY;

-- Owners and admins can view invitations belonging
-- to their own organisation.

DROP POLICY IF EXISTS
    "Owners and admins can view team invitations"
ON public.team_invitations;

CREATE POLICY
    "Owners and admins can view team invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
    public.has_org_role(
        organisation_id,
        ARRAY['owner', 'admin']::text[]
    )
);

-- Browser users cannot create, edit or delete invitations.
-- Those operations will happen through the Edge Function.

REVOKE ALL ON public.team_invitations
FROM anon, authenticated;

GRANT SELECT ON public.team_invitations
TO authenticated;

GRANT ALL ON public.team_invitations
TO service_role;

COMMENT ON TABLE public.team_invitations IS
'Tracks secure invitations to join Bizora business workspaces.';

COMMIT;
