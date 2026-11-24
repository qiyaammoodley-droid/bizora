
-- Secure team directory for booking staff assignment.
-- Only authenticated members of the requested organisation
-- can retrieve its team members.

CREATE OR REPLACE FUNCTION public.get_org_team_members(
    target_org_id uuid
)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        m.user_id,
        COALESCE(
            NULLIF(TRIM(p.full_name), ''),
            'Team member'
        ) AS full_name,
        m.role
    FROM public.memberships AS m
    LEFT JOIN public.profiles AS p
        ON p.id = m.user_id
    WHERE
        m.organisation_id = target_org_id
        AND public.is_org_member(target_org_id)
    ORDER BY
        p.full_name NULLS LAST,
        m.created_at;
$$;

-- Remove default access.
REVOKE ALL ON FUNCTION public.get_org_team_members(uuid)
FROM PUBLIC, anon, authenticated;

-- Only authenticated users can call the function.
GRANT EXECUTE ON FUNCTION public.get_org_team_members(uuid)
TO authenticated;

COMMENT ON FUNCTION public.get_org_team_members(uuid)
IS 'Returns minimal team directory information for authenticated members of an organisation.';
