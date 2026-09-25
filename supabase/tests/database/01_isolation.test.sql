-- Buildings never see each other's data, signed-out visitors get nothing, and only listed staff with a job get in.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Fixtures: two buildings with their own staff and rooms --------------------------------------------------------
insert into public.facilities (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'Test home one'),
  ('22222222-2222-4222-8222-222222222222', 'Test home two');
insert into public.buildings (id, facility_id, name) values
  ('11111111-0000-4000-8000-0000000000b1', '11111111-1111-4111-8111-111111111111', 'North');
insert into public.staff_accounts (id, facility_id, email, phone, role) values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'ops@one.test', null, 'ops_manager'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'hk@one.test', null, 'housekeeper'),
  ('10000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'hk2@one.test', null, 'housekeeper'),
  ('10000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'director@one.test', null, 'hk_director'),
  ('10000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'station@one.test', null, 'nurse_station'),
  ('10000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'kitchen@one.test', null, 'kitchen'),
  ('10000000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'maint@one.test', null, 'maintenance'),
  ('10000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'activities@one.test', null, 'activities'),
  ('10000000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'new@one.test', null, null),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', null, '+15555550100', 'housekeeper'),
  ('20000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'ops@two.test', null, 'ops_manager'),
  ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'hk@two.test', null, 'housekeeper');
insert into public.role_access (facility_id, role, module)
select f.id, 'ops_manager', m
from (values ('11111111-1111-4111-8111-111111111111'::uuid), ('22222222-2222-4222-8222-222222222222'::uuid)) as f (id),
     unnest(enum_range(null::public.module_id)) as m;
insert into public.role_access (facility_id, role, module)
select f.id, r.role::public.staff_role, unnest(r.modules)::public.module_id
from (values ('11111111-1111-4111-8111-111111111111'::uuid), ('22222222-2222-4222-8222-222222222222'::uuid)) as f (id),
     (values
       ('housekeeper', array['housekeeping', 'maintenance', 'calendar']),
       ('hk_director', array['housekeeping', 'hk_assign', 'maintenance', 'calendar', 'pulse', 'notices_send']),
       ('nurse_station', array['dining', 'dining_order', 'maintenance', 'calendar', 'residents']),
       ('kitchen', array['dining', 'dining_kitchen', 'dining_menus', 'dining_temps', 'dining_checklist', 'maintenance', 'calendar']),
       ('maintenance', array['maintenance', 'maintenance_crew', 'calendar']),
       ('activities', array['calendar', 'attendance', 'maintenance', 'residents'])
     ) as r (role, modules);
insert into public.rooms (facility_id, number, occupancy, assigned_to) values
  ('11111111-1111-4111-8111-111111111111', '201', 'occupied', '10000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-111111111111', '202', 'vacant', '10000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-111111111111', '203', 'needs_cleaning', '10000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-111111111111', '204', 'needs_cleaning', '10000000-0000-4000-8000-000000000003'),
  ('22222222-2222-4222-8222-222222222222', '201', 'occupied', '20000000-0000-4000-8000-000000000002');

-- Schema-wide guarantees -----------------------------------------------------------------------------------------
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0::bigint, 'every table has row level security on');
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  0::bigint, 'every table has at least one access rule');
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('anon', c.oid, 'select,insert,update,delete')),
  0::bigint, 'signed-out visitors have no table privileges');

-- Signed out -----------------------------------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok('select 1 from public.rooms', '42501', null, 'signed-out visitors cannot read rooms');
select throws_ok('select 1 from public.staff_accounts', '42501', null, 'signed-out visitors cannot read the staff list');
select throws_ok($$select public.check_out('201')$$, '42501', null, 'signed-out visitors cannot check rooms out');
reset role;

-- Operations manager at home one ---------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"email":"ops@one.test","role":"authenticated"}';
select is((select count(*) from public.facilities), 1::bigint, 'staff see only their own facility');
select is((select count(*) from public.rooms), 4::bigint, 'staff see their own building''s rooms');
select is((select count(*) from public.rooms where facility_id = '22222222-2222-4222-8222-222222222222'), 0::bigint,
  'another building''s rooms are invisible, even when asked for by id');
select is((select count(*) from public.staff_accounts where email like '%@two.test'), 0::bigint,
  'another building''s staff are invisible');
select throws_ok(
  $$insert into public.rooms (facility_id, number) values ('22222222-2222-4222-8222-222222222222', '299')$$,
  '42501', null, 'cannot add a room to another building');
select results_eq(
  $$with u as (update public.rooms set clean_days = '{1}' where facility_id = '22222222-2222-4222-8222-222222222222' returning 1)
    select count(*)::int from u$$,
  $$values (0)$$, 'cannot change another building''s rooms');
select throws_ok(
  $$insert into public.staff_accounts (facility_id, email, role) values ('22222222-2222-4222-8222-222222222222', 'spy@two.test', 'ops_manager')$$,
  '42501', null, 'cannot add staff to another building');

set local request.jwt.claims to '{"email":"OPS@One.Test","role":"authenticated"}';
select is((select count(*) from public.rooms), 4::bigint, 'sign-in email matching ignores capital letters');

set local request.jwt.claims to '{"phone":"15555550100","role":"authenticated"}';
select is((select private.my_role()), 'housekeeper'::public.staff_role, 'staff without an email sign in by phone');

set local request.jwt.claims to '{"email":"new@one.test","role":"authenticated"}';
select is((select count(*) from public.rooms), 0::bigint, 'someone with no job yet sees nothing');

set local request.jwt.claims to '{"email":"stranger@nowhere.test","role":"authenticated"}';
select is((select count(*) from public.rooms), 0::bigint, 'a signed-in stranger sees no rooms');
select is((select count(*) from public.staff_accounts), 0::bigint, 'a signed-in stranger cannot read the staff list');

set local request.jwt.claims to '{"email":"ops@two.test","role":"authenticated"}';
select is((select array_agg(number) from public.rooms), array['201'], 'the other building sees only its own room 201');
reset role;

-- References can never cross buildings ---------------------------------------------------------------------------
select throws_ok(
  $$insert into public.clean_jobs (facility_id, room_number, kind, assigned_to)
    values ('11111111-1111-4111-8111-111111111111', '201', 'routine', '20000000-0000-4000-8000-000000000002')$$,
  '23503', null, 'a clean cannot be assigned to another building''s housekeeper');

select * from finish();
rollback;
