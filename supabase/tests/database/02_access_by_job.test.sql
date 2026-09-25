-- The job decides access: each job reads and changes only what its screens need, and Access changes apply at once.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

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

-- Work already in the system
insert into public.fridges (id, facility_id, label) values
  ('30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Fridge A');
insert into public.fridge_temp_logs (facility_id, fridge_id, temp_f) values
  ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', 38);
insert into public.meal_orders (facility_id, room_number, meal, special) values
  ('11111111-1111-4111-8111-111111111111', '201', 'lunch', 'Soup');
insert into public.clean_jobs (id, facility_id, room_number, kind, assigned_to) values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '201', 'routine', '10000000-0000-4000-8000-000000000002'),
  ('40000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '202', 'routine', '10000000-0000-4000-8000-000000000003');
insert into public.maintenance_requests (id, facility_id, title, room_number, created_by) values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Drip', '201', '10000000-0000-4000-8000-000000000002');
insert into public.alerts (facility_id, title, to_roles, to_emails) values
  ('11111111-1111-4111-8111-111111111111', 'For the director', '{hk_director}', '{}'),
  ('11111111-1111-4111-8111-111111111111', 'For one housekeeper', '{}', '{hk@one.test}');
insert into public.room_feedback (facility_id, room_number, department, kind, topic, body) values
  ('11111111-1111-4111-8111-111111111111', '201', 'dining', 'complaint', 'food_temperature', 'Cold');
insert into public.supplies (facility_id, label, count) values
  ('11111111-1111-4111-8111-111111111111', 'Cups', 10);

set local role authenticated;

-- Housekeeper ----------------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select is((select count(*) from public.clean_jobs), 1::bigint, 'a housekeeper sees only their own cleans');
select is((select count(*) from public.meal_orders), 0::bigint, 'a housekeeper cannot read meal orders');
select is((select count(*) from public.fridge_temp_logs), 0::bigint, 'a housekeeper cannot read the fridge log');
select is((select count(*) from public.room_feedback), 0::bigint, 'a housekeeper cannot read resident feedback');
select is((select count(*) from public.supplies), 0::bigint, 'a housekeeper cannot read dining supply counts');
select is((select count(*) from public.alerts), 1::bigint, 'a housekeeper sees alerts sent to their email');
select lives_ok(
  $$insert into public.maintenance_requests (facility_id, title, room_number, created_by)
    values ('11111111-1111-4111-8111-111111111111', 'Loose rail', '202', '10000000-0000-4000-8000-000000000002')$$,
  'a housekeeper can send a repair request');
select throws_ok(
  $$insert into public.maintenance_requests (facility_id, title, room_number, created_by)
    values ('11111111-1111-4111-8111-111111111111', 'Fake', '202', '10000000-0000-4000-8000-000000000005')$$,
  '42501', null, 'a request cannot be sent in someone else''s name');
select results_eq(
  $$with u as (update public.maintenance_requests set status = 'done' returning 1) select count(*)::int from u$$,
  $$values (0)$$, 'a housekeeper cannot close repairs');
select throws_ok(
  $$insert into public.clean_jobs (facility_id, room_number, kind) values ('11111111-1111-4111-8111-111111111111', '202', 'deep')$$,
  '42501', null, 'a housekeeper cannot create cleans');
select throws_ok(
  $$insert into public.staff_accounts (facility_id, email, role) values ('11111111-1111-4111-8111-111111111111', 'friend@one.test', 'ops_manager')$$,
  '42501', null, 'only Access can add staff');

-- Housekeeping director ------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"director@one.test","role":"authenticated"}';
select is((select count(*) from public.clean_jobs), 2::bigint, 'the director sees every clean');
select results_eq(
  $$with u as (update public.clean_jobs set assigned_to = '10000000-0000-4000-8000-000000000003'
               where id = '40000000-0000-4000-8000-000000000001' returning 1) select count(*)::int from u$$,
  $$values (1)$$, 'the director can reassign a clean');
select is((select count(*) from public.alerts), 1::bigint, 'the director sees alerts sent to their job');
select throws_ok(
  $$insert into public.role_access (facility_id, role, module) values ('11111111-1111-4111-8111-111111111111', 'housekeeper', 'dining')$$,
  '42501', null, 'only Access can change which screens a job opens');

-- Kitchen --------------------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"kitchen@one.test","role":"authenticated"}';
select is((select count(*) from public.meal_orders), 1::bigint, 'the kitchen sees the order queue');
select is((select count(*) from public.room_feedback), 0::bigint, 'the kitchen cannot open the Residents lens');
select is((select count(*) from public.alerts), 0::bigint, 'the kitchen does not see other jobs'' alerts');
select throws_ok(
  $$insert into public.meal_orders (facility_id, room_number, meal, special, placed_by)
    values ('11111111-1111-4111-8111-111111111111', '201', 'dinner', 'Pasta', '10000000-0000-4000-8000-000000000006')$$,
  '42501', null, 'the kitchen cannot take orders (not one of its screens)');
select lives_ok(
  $$insert into public.fridge_temp_logs (facility_id, fridge_id, temp_f, recorded_by)
    values ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', 37, '10000000-0000-4000-8000-000000000006')$$,
  'the kitchen can log a fridge temperature');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('menu-files', '11111111-1111-4111-8111-111111111111/lunch.pdf')$$,
  'the kitchen can upload a menu to its building''s folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('menu-files', '22222222-2222-4222-8222-222222222222/lunch.pdf')$$,
  '42501', null, 'files cannot be uploaded into another building''s folder');

-- Nurse station --------------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"station@one.test","role":"authenticated"}';
select lives_ok(
  $$insert into public.meal_orders (facility_id, room_number, meal, special, placed_by)
    values ('11111111-1111-4111-8111-111111111111', '201', 'dinner', 'Pasta', '10000000-0000-4000-8000-000000000005')$$,
  'the nurse station can place an order');
select throws_ok(
  $$insert into public.meal_orders (facility_id, room_number, meal, special, placed_by)
    values ('11111111-1111-4111-8111-111111111111', '201', 'dinner', 'Pasta', '10000000-0000-4000-8000-000000000006')$$,
  '42501', null, 'an order cannot be placed in someone else''s name');
select is((select count(*) from public.room_feedback), 1::bigint, 'the nurse station can read resident feedback');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('menu-files', '11111111-1111-4111-8111-111111111111/menu.pdf')$$,
  '42501', null, 'the nurse station cannot upload menus');

-- Maintenance ----------------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"maint@one.test","role":"authenticated"}';
select results_eq(
  $$with u as (update public.maintenance_requests set status = 'in_progress'
               where id = '50000000-0000-4000-8000-000000000001' returning 1) select count(*)::int from u$$,
  $$values (1)$$, 'the crew can update a repair');

-- Access changes apply immediately --------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select ok((select count(*) from public.maintenance_requests) > 0, 'housekeepers can see the repair queue');

set local request.jwt.claims to '{"email":"ops@one.test","role":"authenticated"}';
select results_eq(
  $$with d as (delete from public.role_access where facility_id = '11111111-1111-4111-8111-111111111111'
               and role = 'housekeeper' and module = 'maintenance' returning 1) select count(*)::int from d$$,
  $$values (1)$$, 'operations can take a screen away from a job');
select lives_ok(
  $$insert into public.staff_accounts (facility_id, email, role) values ('11111111-1111-4111-8111-111111111111', 'cook@one.test', 'kitchen')$$,
  'operations can add staff');

set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select is((select count(*) from public.maintenance_requests), 0::bigint, 'the change applies on the next request, no sign-out needed');

reset role;
select * from finish();
rollback;
