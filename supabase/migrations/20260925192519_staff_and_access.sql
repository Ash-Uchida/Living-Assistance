-- Homestead operations hub: facilities, the staff sign-in list, and which screens each job can open.
-- Room numbers only. Nothing in this schema holds resident names, contacts, diets or health information.

create schema if not exists private;
revoke all on schema private from public;

-- Jobs and screens ------------------------------------------------------------

create type public.staff_role as enum (
  'ops_manager', 'housekeeper', 'hk_director', 'nurse_station',
  'kitchen', 'dining_manager', 'maintenance', 'activities'
);

create type public.module_id as enum (
  'rooms', 'housekeeping', 'hk_assign',
  'dining', 'dining_order', 'dining_kitchen', 'dining_menus', 'dining_temps',
  'dining_checklist', 'dining_survey', 'dining_manager',
  'maintenance', 'maintenance_crew', 'calendar', 'attendance',
  'pulse', 'residents', 'notices_send', 'access'
);

-- Tables ----------------------------------------------------------------------

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  routine_clean_minutes integer not null default 25 check (routine_clean_minutes > 0),
  deep_clean_minutes integer not null default 90 check (deep_clean_minutes > 0),
  created_at timestamptz not null default now()
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  unique (facility_id, name),
  unique (facility_id, id)
);

-- Work email (or phone for staff without one) + job. A null role is the Unassigned box: cannot sign in.
create table public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  email text unique check (email = lower(email) and email like '%_@_%'),
  phone text unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  role public.staff_role,
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null),
  unique (facility_id, id)
);

create table public.role_access (
  facility_id uuid not null references public.facilities (id) on delete cascade,
  role public.staff_role not null,
  module public.module_id not null,
  primary key (facility_id, role, module)
);

create table public.access_audit (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null check (action in ('add_account', 'move', 'remove_account', 'grant', 'revoke')),
  target text not null default '',
  detail text not null default '',
  foreign key (facility_id, actor_id) references public.staff_accounts (facility_id, id) on delete set null (actor_id)
);

create index access_audit_facility_at on public.access_audit (facility_id, at desc);
create index access_audit_actor on public.access_audit (facility_id, actor_id);

alter table public.facilities enable row level security;
alter table public.buildings enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.role_access enable row level security;
alter table public.access_audit enable row level security;

-- Who is signed in ------------------------------------------------------------
-- Matched from the verified email (or phone) in the sign-in token. Security definer so policies can
-- look up the staff list without the caller needing to read it.

create function private.my_staff_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.staff_accounts s
  where s.role is not null
    and (
      (coalesce(auth.jwt() ->> 'email', '') <> '' and s.email = lower(auth.jwt() ->> 'email'))
      or (coalesce(auth.jwt() ->> 'phone', '') <> '' and ltrim(s.phone, '+') = ltrim(auth.jwt() ->> 'phone', '+'))
    )
  limit 1
$$;

create function private.my_facility_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.facility_id from public.staff_accounts s where s.id = private.my_staff_id()
$$;

create function private.my_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select s.role from public.staff_accounts s where s.id = private.my_staff_id()
$$;

create function private.my_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.email from public.staff_accounts s where s.id = private.my_staff_id()
$$;

-- Can the signed-in person's job open this screen in their own building?
create function private.can(m public.module_id)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_accounts s
    join public.role_access a on a.facility_id = s.facility_id and a.role = s.role
    where s.id = private.my_staff_id() and a.module = m
  )
$$;

revoke all on function private.my_staff_id() from public, anon;
revoke all on function private.my_facility_id() from public, anon;
revoke all on function private.my_role() from public, anon;
revoke all on function private.my_email() from public, anon;
revoke all on function private.can(public.module_id) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.my_staff_id() to authenticated;
grant execute on function private.my_facility_id() to authenticated;
grant execute on function private.my_role() to authenticated;
grant execute on function private.my_email() to authenticated;
grant execute on function private.can(public.module_id) to authenticated;

-- Sign-up gate ----------------------------------------------------------------
-- Supabase Auth "before user created" hook: only emails / phones on the staff list with a job may get an account.
-- Enable it in the dashboard: Authentication → Hooks → Before User Created → Postgres → private.hook_before_user_created

create function private.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(nullif(event -> 'user' ->> 'email', ''));
  v_phone text := ltrim(nullif(event -> 'user' ->> 'phone', ''), '+');
begin
  if exists (
    select 1
    from public.staff_accounts s
    where s.role is not null
      and ((v_email is not null and s.email = v_email) or (v_phone is not null and ltrim(s.phone, '+') = v_phone))
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This email is not on the staff list. Ask your operations manager to add you.'
    )
  );
end;
$$;

revoke all on function private.hook_before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
