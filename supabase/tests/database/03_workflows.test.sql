-- The database enforces each workflow: the order of steps, the server clock, and the guard rails around them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(56);

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
insert into public.stays (facility_id, room_number, starts_on, ends_on) values
  ('11111111-1111-4111-8111-111111111111', '201', current_date - 10, current_date + 10);
insert into public.clean_checklist_items (id, facility_id, kind, label) values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'routine', 'Make bed'),
  ('60000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'routine', 'Empty trash'),
  ('60000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'deep', 'Wash walls'),
  ('60000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'deep', 'Deep clean floors');
insert into public.clean_jobs (id, facility_id, room_number, kind, assigned_to) values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '201', 'routine', '10000000-0000-4000-8000-000000000002'),
  ('40000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '203', 'deep', '10000000-0000-4000-8000-000000000002');
insert into public.meal_orders (id, facility_id, room_number, meal, special) values
  ('70000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '201', 'lunch', 'Soup');
insert into public.fridges (id, facility_id, label) values
  ('30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Fridge A');
insert into public.maintenance_requests (id, facility_id, title, room_number, created_by) values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Drip', '201', '10000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Squeak', '202', '10000000-0000-4000-8000-000000000002');
insert into public.events (id, facility_id, title, kind, starts_at, building_id) values
  ('80000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Bingo', 'activity', now(),
   '11111111-0000-4000-8000-0000000000b1');

set local role authenticated;

-- Cleaning: not started, then in progress, then done ---------------------------------------------------------------
set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select lives_ok(
  $$update public.clean_jobs set status = 'in_progress', started_at = '2000-01-01'
    where id = '40000000-0000-4000-8000-000000000001'$$,
  'a housekeeper can start their clean');
select is((select started_at from public.clean_jobs where id = '40000000-0000-4000-8000-000000000001'), now(),
  'the start time comes from the server clock, not the phone');
select lives_ok(
  $$update public.clean_jobs set status = 'in_progress' where id = '40000000-0000-4000-8000-000000000001'$$,
  'pressing Start twice is harmless');
select throws_ok(
  $$update public.clean_jobs set status = 'done' where id = '40000000-0000-4000-8000-000000000001'$$,
  '23514', 'Check every checklist item before finishing.', 'a clean cannot finish with unchecked items');
select lives_ok(
  $$insert into public.clean_job_checks (facility_id, clean_job_id, item_id, checked_at) values
    ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '2000-01-01'),
    ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', '2000-01-01')$$,
  'the housekeeper can tick items while cleaning');
select is((select min(checked_at) from public.clean_job_checks where clean_job_id = '40000000-0000-4000-8000-000000000001'), now(),
  'tick times come from the server clock');
select lives_ok(
  $$update public.clean_jobs set status = 'done', finished_at = '2000-01-01' where id = '40000000-0000-4000-8000-000000000001'$$,
  'finishing works once every item is ticked');
select is((select finished_at from public.clean_jobs where id = '40000000-0000-4000-8000-000000000001'), now(),
  'the finish time comes from the server clock');
select throws_ok(
  $$update public.clean_jobs set status = 'in_progress' where id = '40000000-0000-4000-8000-000000000001'$$,
  '23514', 'A finished clean cannot be reopened.', 'a finished clean cannot be reopened');
select throws_ok(
  $$insert into public.clean_job_checks (facility_id, clean_job_id, item_id) values
    ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'items cannot be ticked before the clean starts');
select throws_ok(
  $$update public.clean_jobs set status = 'done' where id = '40000000-0000-4000-8000-000000000003'$$,
  '23514', null, 'a clean cannot skip straight to done');

set local request.jwt.claims to '{"email":"hk2@one.test","role":"authenticated"}';
select results_eq(
  $$with u as (update public.clean_jobs set status = 'in_progress' where id = '40000000-0000-4000-8000-000000000003' returning 1)
    select count(*)::int from u$$,
  $$values (0)$$, 'another housekeeper cannot touch someone else''s clean');

set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
update public.clean_jobs set status = 'in_progress' where id = '40000000-0000-4000-8000-000000000003';
insert into public.clean_job_checks (facility_id, clean_job_id, item_id) values
  ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003'),
  ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000004');
update public.clean_jobs set status = 'done' where id = '40000000-0000-4000-8000-000000000003';
select is((select occupancy from public.rooms where facility_id = '11111111-1111-4111-8111-111111111111' and number = '203'),
  'vacant'::public.occupancy, 'finishing a deep clean opens the room for the next check-in');

set local request.jwt.claims to '{"email":"director@one.test","role":"authenticated"}';
select lives_ok(
  $$insert into public.clean_jobs (id, facility_id, room_number, kind, status, started_at, finished_at)
    values ('40000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '202', 'routine', 'done',
            '2000-01-01', '2000-01-01')$$,
  'the director can add a clean');
select is((select status from public.clean_jobs where id = '40000000-0000-4000-8000-000000000005'),
  'not_started'::public.cleaning_status, 'new cleans always start at the beginning');

-- Check in and check out ------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"ops@one.test","role":"authenticated"}';
select lives_ok($$select public.check_in('202', current_date, current_date + 3)$$,
  'operations can check a resident into a vacant room');
select is((select occupancy from public.rooms where facility_id = '11111111-1111-4111-8111-111111111111' and number = '202'),
  'occupied'::public.occupancy, 'check-in marks the room occupied');
select throws_ok($$select public.check_in('201', current_date, current_date + 3)$$,
  '23514', 'Room 201 is already occupied.', 'cannot check into an occupied room');
select throws_ok($$select public.check_in('204', current_date, current_date + 3)$$,
  '23514', 'Room 204 still needs a deep clean.', 'cannot check into a room that still needs a deep clean');
select throws_ok($$select public.check_in('203', current_date, current_date - 1)$$,
  '23514', 'The stay ends before it starts.', 'a stay cannot end before it starts');
select lives_ok($$select public.check_out('201')$$, 'operations can check a resident out');
select is((select occupancy from public.rooms where facility_id = '11111111-1111-4111-8111-111111111111' and number = '201'),
  'needs_cleaning'::public.occupancy, 'check-out marks the room as needing a clean');
select is((select count(*) from public.stays where facility_id = '11111111-1111-4111-8111-111111111111'
           and room_number = '201' and checked_out_at is null), 0::bigint, 'check-out closes the stay');
select is((select count(*) from public.clean_jobs where facility_id = '11111111-1111-4111-8111-111111111111'
           and room_number = '201' and kind = 'deep' and status = 'not_started'), 1::bigint, 'check-out creates the deep clean');
select is((select count(*) from public.alerts where title = 'Room 201 needs a deep clean' and 'hk_director' = any (to_roles)),
  1::bigint, 'check-out alerts the housekeeping director');
select throws_ok($$select public.check_out('203')$$,
  '23514', 'Room 203 is not occupied.', 'cannot check out a room nobody is in');
select throws_ok(
  $$update public.rooms set occupancy = 'vacant' where facility_id = '11111111-1111-4111-8111-111111111111' and number = '202'$$,
  '23514', null, 'a room cannot jump from occupied straight to vacant');

set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select throws_ok($$select public.check_in('203', current_date, current_date + 3)$$,
  '42501', 'Your job cannot check rooms in or out.', 'a housekeeper cannot check rooms in');

-- Meal orders only move forward ---------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"kitchen@one.test","role":"authenticated"}';
select lives_ok(
  $$update public.meal_orders set status = 'preparing' where id = '70000000-0000-4000-8000-000000000001'$$,
  'the kitchen can start an order');
select is((select started_at from public.meal_orders where id = '70000000-0000-4000-8000-000000000001'), now(),
  'the start time is stamped by the server');
select lives_ok(
  $$update public.meal_orders set status = 'ready', created_at = '2000-01-01' where id = '70000000-0000-4000-8000-000000000001'$$,
  'the kitchen can mark an order ready');
select is((select created_at from public.meal_orders where id = '70000000-0000-4000-8000-000000000001'), now(),
  'order times cannot be rewritten from the app');
select throws_ok(
  $$update public.meal_orders set status = 'pending' where id = '70000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'an order cannot move backwards');

set local request.jwt.claims to '{"email":"station@one.test","role":"authenticated"}';
select lives_ok(
  $$insert into public.meal_orders (id, facility_id, room_number, meal, special, status, placed_by)
    values ('70000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '202', 'dinner', 'Pasta', 'complete',
            '10000000-0000-4000-8000-000000000005')$$,
  'the nurse station can place an order');
select is((select status from public.meal_orders where id = '70000000-0000-4000-8000-000000000002'),
  'pending'::public.order_status, 'new orders always start as pending');
select throws_ok(
  $$insert into public.meal_orders (facility_id, room_number, meal, special, placed_by)
    values ('11111111-1111-4111-8111-111111111111', '202', 'dinner', '  ', '10000000-0000-4000-8000-000000000005')$$,
  '23514', null, 'an order needs a menu item or a special request');

-- The fridge log is append-only -------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"kitchen@one.test","role":"authenticated"}';
select lives_ok(
  $$insert into public.fridge_temp_logs (id, facility_id, fridge_id, temp_f, recorded_at, recorded_by)
    values ('31000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
            39, '2000-01-01', '10000000-0000-4000-8000-000000000006')$$,
  'the kitchen can log a reading');
select is((select recorded_at from public.fridge_temp_logs where id = '31000000-0000-4000-8000-000000000001'), now(),
  'readings are stamped by the server');
select throws_ok(
  $$update public.fridge_temp_logs set temp_f = 36 where id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'the kitchen cannot edit a reading');
reset role;
select throws_ok(
  $$update public.fridge_temp_logs set temp_f = 36 where id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', 'Temperature logs cannot be changed or deleted. Log a new reading instead.', 'not even an admin can edit a reading');
select throws_ok(
  $$delete from public.fridge_temp_logs where id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', 'Temperature logs cannot be changed or deleted. Log a new reading instead.', 'or delete one');
set local role authenticated;

-- Repairs: seen, assigned, fixed ------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"maint@one.test","role":"authenticated"}';
select lives_ok($$select public.mark_maintenance_seen('50000000-0000-4000-8000-000000000001')$$,
  'the crew opening a request marks it seen');
select is((select seen_at from public.maintenance_requests where id = '50000000-0000-4000-8000-000000000001'), now(),
  'seen time comes from the server clock');

set local request.jwt.claims to '{"email":"hk@one.test","role":"authenticated"}';
select lives_ok($$select public.mark_maintenance_seen('50000000-0000-4000-8000-000000000002')$$,
  'a housekeeper opening a request does not error');
select is((select seen_at from public.maintenance_requests where id = '50000000-0000-4000-8000-000000000002'), null::timestamptz,
  'only the crew counts as having seen a request');

set local request.jwt.claims to '{"email":"maint@one.test","role":"authenticated"}';
select lives_ok(
  $$update public.maintenance_requests
    set assigned_to = '10000000-0000-4000-8000-000000000007', assigned_at = '2000-01-01', seen_at = '2000-01-01'
    where id = '50000000-0000-4000-8000-000000000002'$$,
  'the crew can assign a request');
select is((select assigned_at from public.maintenance_requests where id = '50000000-0000-4000-8000-000000000002'), now(),
  'assignment time comes from the server clock');
select is((select seen_at from public.maintenance_requests where id = '50000000-0000-4000-8000-000000000002'), now(),
  'assigning a request also marks it seen');
select lives_ok(
  $$update public.maintenance_requests set status = 'done' where id = '50000000-0000-4000-8000-000000000002'$$,
  'the crew can complete a request');
select is((select fixed_at from public.maintenance_requests where id = '50000000-0000-4000-8000-000000000002'), now(),
  'completion time comes from the server clock');

-- Attendance -------------------------------------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"activities@one.test","role":"authenticated"}';
select lives_ok(
  $$insert into public.event_attendance (facility_id, event_id, room_number)
    values ('11111111-1111-4111-8111-111111111111', '80000000-0000-4000-8000-000000000001', '201')$$,
  'activities can mark attendance');
select is((select attendance_at from public.events where id = '80000000-0000-4000-8000-000000000001'), now(),
  'marking attendance records when it was taken');

-- The access list can never lock everyone out -------------------------------------------------------------------------
set local request.jwt.claims to '{"email":"ops@one.test","role":"authenticated"}';
select throws_ok(
  $$update public.staff_accounts set role = 'housekeeper' where id = '10000000-0000-4000-8000-000000000001'$$,
  '23514', 'At least one operations manager must stay in Operations.', 'the last operations manager cannot be moved out');
select throws_ok(
  $$delete from public.staff_accounts where id = '10000000-0000-4000-8000-000000000001'$$,
  '23514', 'At least one operations manager must stay in Operations.', 'or removed');
select throws_ok(
  $$delete from public.role_access where facility_id = '11111111-1111-4111-8111-111111111111'
    and role = 'ops_manager' and module = 'access'$$,
  '23514', 'Operations managers always keep Access.', 'operations managers always keep the Access screen');
insert into public.staff_accounts (facility_id, email, role)
values ('11111111-1111-4111-8111-111111111111', 'ops2@one.test', 'ops_manager');
select lives_ok(
  $$update public.staff_accounts set role = 'housekeeper' where id = '10000000-0000-4000-8000-000000000001'$$,
  'with a second operations manager, the first one can change jobs');

reset role;
select * from finish();
rollback;
