
-- ============================================
-- BIZORA: INITIAL DATABASE SCHEMA
-- Migration: initial_schema
-- ============================================

-- 1. ORGANISATIONS
-- Each organisation represents a separate business.

create table public.organisations (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(trim(name)) > 0),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- 2. USER PROFILES
-- Each profile belongs to an authenticated Supabase user.

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- 3. ORGANISATION MEMBERSHIPS
-- Connects users to businesses and assigns their roles.

create table public.memberships (
    id uuid primary key default gen_random_uuid(),
    organisation_id uuid not null
        references public.organisations(id) on delete cascade,
    user_id uuid not null
        references auth.users(id) on delete cascade,

    role text not null default 'admin'
        check (role in ('owner', 'admin')),

    created_at timestamptz not null default now(),

    unique (organisation_id, user_id)
);


-- 4. INDEXES
-- Improve lookups when checking organisation memberships.

create index memberships_user_id_idx
    on public.memberships(user_id);

create index memberships_organisation_id_idx
    on public.memberships(organisation_id);


-- 5. AUTOMATIC PROFILE CREATION
-- Creates a profile whenever a new user registers.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, email)
    values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.email
    );

    return new;
end;
$$;


create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();


-- 6. SECURITY HELPER FUNCTIONS
-- These functions check membership without causing
-- recursive Row Level Security policy checks.

create or replace function public.is_org_member(
    target_org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.memberships m
        where m.organisation_id = target_org_id
          and m.user_id = (select auth.uid())
    );
$$;


create or replace function public.has_org_role(
    target_org_id uuid,
    allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.memberships m
        where m.organisation_id = target_org_id
          and m.user_id = (select auth.uid())
          and m.role = any(allowed_roles)
    );
$$;


-- 7. CREATE ORGANISATION FUNCTION
-- An authenticated user can create an organisation.
-- The creator automatically becomes its owner.

create or replace function public.create_organisation(
    organisation_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    new_organisation_id uuid;
begin
    current_user_id := (select auth.uid());

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if organisation_name is null
       or char_length(trim(organisation_name)) = 0 then
        raise exception 'Organisation name is required';
    end if;

    insert into public.organisations (name, created_by)
    values (trim(organisation_name), current_user_id)
    returning id into new_organisation_id;

    insert into public.memberships (
        organisation_id,
        user_id,
        role
    )
    values (
        new_organisation_id,
        current_user_id,
        'owner'
    );

    return new_organisation_id;
end;
$$;


-- 8. ENABLE ROW LEVEL SECURITY

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;


-- 9. ORGANISATION POLICIES

create policy "Members can view their organisations"
on public.organisations
for select
to authenticated
using (
    (select public.is_org_member(id))
);

create policy "Owners and admins can update organisations"
on public.organisations
for update
to authenticated
using (
    (select public.has_org_role(id, array['owner', 'admin']))
)
with check (
    (select public.has_org_role(id, array['owner', 'admin']))
);

create policy "Owners can delete organisations"
on public.organisations
for delete
to authenticated
using (
    (select public.has_org_role(id, array['owner']))
);


-- 10. PROFILE POLICIES

create policy "Users can view their own profiles"
on public.profiles
for select
to authenticated
using (
    id = (select auth.uid())
);

create policy "Users can update their own profiles"
on public.profiles
for update
to authenticated
using (
    id = (select auth.uid())
)
with check (
    id = (select auth.uid())
);


-- 11. MEMBERSHIP POLICIES

create policy "Members can view organisation memberships"
on public.memberships
for select
to authenticated
using (
    user_id = (select auth.uid())
    or (select public.is_org_member(organisation_id))
);


-- 12. TABLE PERMISSIONS

grant select, update
on public.organisations
to authenticated;

grant select, update
on public.profiles
to authenticated;

grant select
on public.memberships
to authenticated;


-- 13. FUNCTION PERMISSIONS

revoke all on function public.handle_new_user() from public;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid)
to authenticated;

revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.has_org_role(uuid, text[])
to authenticated;

revoke all on function public.create_organisation(text) from public;
grant execute on function public.create_organisation(text)
to authenticated;

-- ============================================
-- END OF INITIAL BIZORA DATABASE SCHEMA
-- ============================================
