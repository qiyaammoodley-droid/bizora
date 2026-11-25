CREATE OR REPLACE FUNCTION public.update_team_member_role(
    target_org_id uuid,
    target_user_id uuid,
    new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF new_role NOT IN ('admin', 'employee') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE organisation_id = target_org_id
          AND user_id = auth.uid()
          AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Only the business owner can change roles';
    END IF;

    UPDATE public.memberships
    SET role = new_role
    WHERE organisation_id = target_org_id
      AND user_id = target_user_id
      AND role IN ('admin', 'employee');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team member not found or cannot be modified';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_team_member_role(uuid, uuid, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.update_team_member_role(uuid, uuid, text)
TO authenticated;
