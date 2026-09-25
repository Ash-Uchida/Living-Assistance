-- Demo data for development: the same fake building the prototypes show. Room numbers only, no resident details.
-- Safe to re-run: it removes the demo facility (and everything in it) first. Never run this against production.
-- Times are relative to now(), so today's board always looks like "today".

begin;

delete from public.facilities where id = 'f0000000-0000-4000-8000-000000000001';

insert into public.facilities (id, name, routine_clean_minutes, deep_clean_minutes)
values ('f0000000-0000-4000-8000-000000000001', 'Homestead Assisted Living', 25, 90);

insert into public.buildings (id, facility_id, name) values
  ('b0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Building A'),
  ('b0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Building B'),
  ('b0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'Building C');

-- Staff (work emails). The last two have no job yet, so they cannot sign in.
insert into public.staff_accounts (id, facility_id, email, role) values
  ('a0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'baker@homestead.demo', 'ops_manager'),
  ('a0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'housekeeping@homestead.demo', 'housekeeper'),
  ('a0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'housekeeping2@homestead.demo', 'housekeeper'),
  ('a0000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'director@homestead.demo', 'hk_director'),
  ('a0000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'station@homestead.demo', 'nurse_station'),
  ('a0000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'kitchen@homestead.demo', 'kitchen'),
  ('a0000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000001', 'dining@homestead.demo', 'dining_manager'),
  ('a0000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000001', 'maintenance@homestead.demo', 'maintenance'),
  ('a0000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000001', 'maintenance2@homestead.demo', 'maintenance'),
  ('a0000000-0000-4000-8000-000000000010', 'f0000000-0000-4000-8000-000000000001', 'activities@homestead.demo', 'activities'),
  ('a0000000-0000-4000-8000-000000000011', 'f0000000-0000-4000-8000-000000000001', 'new.hire@homestead.demo', null),
  ('a0000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000001', 'float@homestead.demo', null);

-- Which screens each job opens (the prototype's defaultAccess). Operations opens everything.
insert into public.role_access (facility_id, role, module)
select 'f0000000-0000-4000-8000-000000000001', 'ops_manager', m
from unnest(enum_range(null::public.module_id)) as m;

insert into public.role_access (facility_id, role, module)
select 'f0000000-0000-4000-8000-000000000001', r.role::public.staff_role, unnest(r.modules)::public.module_id
from (values
  ('housekeeper', array['housekeeping', 'maintenance', 'calendar']),
  ('hk_director', array['housekeeping', 'hk_assign', 'maintenance', 'calendar', 'pulse', 'notices_send']),
  ('nurse_station', array['dining', 'dining_order', 'maintenance', 'calendar', 'residents']),
  ('kitchen', array['dining', 'dining_kitchen', 'dining_menus', 'dining_temps', 'dining_checklist', 'maintenance', 'calendar']),
  ('dining_manager', array['dining', 'dining_kitchen', 'dining_menus', 'dining_survey', 'dining_manager', 'maintenance',
                           'calendar', 'pulse', 'residents', 'notices_send']),
  ('maintenance', array['maintenance', 'maintenance_crew', 'calendar']),
  ('activities', array['calendar', 'attendance', 'maintenance', 'residents'])
) as r (role, modules);

-- Rooms. Cleaning days are relative to today's weekday, like the prototype.
insert into public.rooms (facility_id, number, building_id, occupancy, assigned_to, clean_days)
select 'f0000000-0000-4000-8000-000000000001', r.number, ('b0000000-0000-4000-8000-00000000000' || r.building)::uuid,
       r.occupancy::public.occupancy, ('a0000000-0000-4000-8000-00000000000' || r.hk)::uuid,
       array[((extract(dow from current_date)::int + r.d1) % 7), ((extract(dow from current_date)::int + r.d2) % 7)]::smallint[]
from (values
  ('101', 1, 'occupied', 2, 0, 3),
  ('102', 1, 'needs_cleaning', 2, 1, 4),
  ('103', 1, 'vacant', 2, 2, 5),
  ('104', 1, 'needs_cleaning', 2, 1, 4),
  ('105', 2, 'vacant', 2, 2, 5),
  ('106', 2, 'occupied', 2, 0, 3),
  ('107', 2, 'occupied', 3, 0, 4),
  ('108', 2, 'needs_cleaning', 3, 1, 4),
  ('109', 3, 'needs_cleaning', 3, 2, 5),
  ('110', 3, 'occupied', 3, 1, 5),
  ('111', 3, 'vacant', 3, 2, 6),
  ('112', 3, 'vacant', 3, 3, 6)
) as r (number, building, occupancy, hk, d1, d2);

insert into public.stays (facility_id, room_number, starts_on, ends_on, checked_in_at, checked_out_at) values
  ('f0000000-0000-4000-8000-000000000001', '101', (now() - interval '400 minutes')::date, current_date + 6, now() - interval '400 minutes', null),
  ('f0000000-0000-4000-8000-000000000001', '101', (now() - interval '20000 minutes')::date, (now() - interval '8000 minutes')::date,
   now() - interval '20000 minutes', now() - interval '8000 minutes'),
  ('f0000000-0000-4000-8000-000000000001', '102', (now() - interval '200 minutes')::date, (now() - interval '20 minutes')::date,
   now() - interval '200 minutes', now() - interval '20 minutes'),
  ('f0000000-0000-4000-8000-000000000001', '106', current_date - 40, current_date, now() - interval '40 days', null),
  ('f0000000-0000-4000-8000-000000000001', '107', current_date - 60, current_date + 30, now() - interval '60 days', null),
  ('f0000000-0000-4000-8000-000000000001', '110', current_date - 30, current_date + 20, now() - interval '30 days', null);

-- Housekeeping -------------------------------------------------------------------

insert into public.clean_checklist_items (id, facility_id, kind, label, position) values
  ('c1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'routine', 'Make bed / change linens', 1),
  ('c1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'routine', 'Empty trash', 2),
  ('c1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'routine', 'Clean bathroom', 3),
  ('c1000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'routine', 'Wipe and dust surfaces', 4),
  ('c1000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'routine', 'Vacuum or mop floor', 5),
  ('c2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Strip bed and flip mattress', 1),
  ('c2000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Empty and wipe closets and drawers', 2),
  ('c2000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Scrub bathroom top to bottom', 3),
  ('c2000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Wash walls and baseboards', 4),
  ('c2000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Clean windows and blinds', 5),
  ('c2000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Deep clean floors', 6),
  ('c2000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000001', 'deep', 'Check for damage (send a request if any)', 7);

-- Today's board.
insert into public.clean_jobs (id, facility_id, room_number, kind, due_on, created_at, assigned_to, status, started_at, finished_at) values
  ('e0000000-0000-4000-8000-000000000101', 'f0000000-0000-4000-8000-000000000001', '101', 'routine', current_date, now(),
   'a0000000-0000-4000-8000-000000000002', 'not_started', null, null),
  ('e0000000-0000-4000-8000-000000000106', 'f0000000-0000-4000-8000-000000000001', '106', 'routine', current_date, now(),
   'a0000000-0000-4000-8000-000000000002', 'done', now() - interval '120 minutes', now() - interval '99 minutes'),
  ('e0000000-0000-4000-8000-000000000107', 'f0000000-0000-4000-8000-000000000001', '107', 'routine', current_date, now(),
   'a0000000-0000-4000-8000-000000000003', 'in_progress', now() - interval '38 minutes', null),
  ('e0000000-0000-4000-8000-000000000102', 'f0000000-0000-4000-8000-000000000001', '102', 'deep', current_date, now() - interval '20 minutes',
   'a0000000-0000-4000-8000-000000000002', 'in_progress', now() - interval '8 minutes', null),
  ('e0000000-0000-4000-8000-000000000104', 'f0000000-0000-4000-8000-000000000001', '104', 'deep', current_date, now() - interval '26 hours',
   null, 'not_started', null, null),
  ('e0000000-0000-4000-8000-000000000108', 'f0000000-0000-4000-8000-000000000001', '108', 'deep', current_date, now() - interval '5 hours',
   'a0000000-0000-4000-8000-000000000003', 'not_started', null, null),
  ('e0000000-0000-4000-8000-000000000109', 'f0000000-0000-4000-8000-000000000001', '109', 'deep', current_date, now() - interval '40 hours',
   'a0000000-0000-4000-8000-000000000003', 'in_progress', now() - interval '14 minutes', null);

insert into public.clean_job_checks (facility_id, clean_job_id, item_id) values
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000107', 'c1000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000107', 'c1000000-0000-4000-8000-000000000002'),
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000102', 'c2000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000102', 'c2000000-0000-4000-8000-000000000002'),
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000109', 'c2000000-0000-4000-8000-000000000001');

-- History: three routine cleans a day for the last 30 days (room 110 ran long yesterday).
insert into public.clean_jobs (facility_id, room_number, kind, due_on, created_at, assigned_to, status, started_at, finished_at)
select 'f0000000-0000-4000-8000-000000000001', h.room, 'routine', current_date - h.d,
       date_trunc('day', now()) - make_interval(days => h.d) + interval '6 hours',
       case when h.room in ('107', '110') then 'a0000000-0000-4000-8000-000000000003'::uuid
            else 'a0000000-0000-4000-8000-000000000002'::uuid end,
       'done', h.start,
       h.start + make_interval(mins => case when h.room = '110' and h.d = 1 then 41 else 18 + (h.d * 7 + h.i * 3) % 9 end)
from (
  select d, i, ('{101,106,107,110}'::text[])[1 + (d + i) % 4] as room,
         date_trunc('day', now()) - make_interval(days => d) + make_interval(hours => 9 + i, mins => 10) as start
  from generate_series(1, 30) as d, generate_series(0, 2) as i
) as h;

-- Move-out deep cleans. This week they waited far longer before anyone started.
insert into public.clean_jobs (facility_id, room_number, kind, due_on, created_at, assigned_to, status, started_at, finished_at)
select 'f0000000-0000-4000-8000-000000000001', ('{103,105,111}'::text[])[1 + d % 3], 'deep', (h.moved_out)::date,
       h.moved_out, 'a0000000-0000-4000-8000-000000000002', 'done', h.start,
       h.start + make_interval(mins => 80 + (d * 3) % 20)
from (
  select d,
         date_trunc('day', now()) - make_interval(days => d) + interval '10 hours' as moved_out,
         date_trunc('day', now()) - make_interval(days => d) + interval '10 hours'
           + make_interval(hours => case when d <= 7 then 66 + d % 8 else 20 + d % 10 end) as start
  from generate_series(1, 30) as d
  where d % 6 = 2 or d = 5
) as h;

insert into public.clean_job_checks (facility_id, clean_job_id, item_id, checked_at)
select j.facility_id, j.id, i.id, j.finished_at
from public.clean_jobs j
join public.clean_checklist_items i on i.facility_id = j.facility_id and i.kind = j.kind
where j.facility_id = 'f0000000-0000-4000-8000-000000000001' and j.status = 'done';

insert into public.clean_notes (facility_id, clean_job_id, body, created_at, created_by)
select facility_id, id, 'Extra towels left on the chair.', started_at + interval '20 minutes', 'a0000000-0000-4000-8000-000000000003'
from public.clean_jobs
where facility_id = 'f0000000-0000-4000-8000-000000000001' and room_number = '110' and kind = 'routine' and due_on = current_date - 1;

-- Dining -------------------------------------------------------------------------

insert into public.menu_items (id, facility_id, meal, name) values
  ('d1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'breakfast', 'Scrambled eggs'),
  ('d1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'breakfast', 'Oatmeal'),
  ('d1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'breakfast', 'Toast'),
  ('d2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'lunch', 'Turkey sandwich'),
  ('d2000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'lunch', 'Tomato soup'),
  ('d2000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'lunch', 'Garden salad'),
  ('d3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'dinner', 'Baked chicken'),
  ('d3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'dinner', 'Mashed potatoes'),
  ('d3000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'dinner', 'Green beans');

-- Open orders on the kitchen queue.
insert into public.meal_orders (facility_id, room_number, meal, menu_item_id, special, order_type, status,
                                created_at, started_at, ready_at, completed_at, placed_by) values
  ('f0000000-0000-4000-8000-000000000001', '107', 'lunch', 'd2000000-0000-4000-8000-000000000001', '', 'to_go', 'pending',
   now() - interval '6 minutes', null, null, null, 'a0000000-0000-4000-8000-000000000005'),
  ('f0000000-0000-4000-8000-000000000001', '110', 'lunch', 'd2000000-0000-4000-8000-000000000002', 'Extra crackers', 'to_go', 'preparing',
   now() - interval '18 minutes', now() - interval '10 minutes', null, null, 'a0000000-0000-4000-8000-000000000005'),
  ('f0000000-0000-4000-8000-000000000001', '107', 'lunch', 'd2000000-0000-4000-8000-000000000003', '', 'to_go', 'ready',
   now() - interval '40 minutes', now() - interval '34 minutes', now() - interval '18 minutes', null, 'a0000000-0000-4000-8000-000000000005'),
  ('f0000000-0000-4000-8000-000000000001', '106', 'lunch', null, 'Grilled cheese, crust cut off', 'dine_in', 'pending',
   now() - interval '3 minutes', null, null, null, 'a0000000-0000-4000-8000-000000000005');

-- History: lunch for every occupied room. Room 107 moved to slow to-go trays this week.
insert into public.meal_orders (facility_id, room_number, meal, menu_item_id, order_type, status,
                                created_at, started_at, ready_at, completed_at, placed_by)
select 'f0000000-0000-4000-8000-000000000001', o.room, 'lunch',
       (array['d2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000002',
              'd2000000-0000-4000-8000-000000000003']::uuid[])[1 + (o.d + o.room::int) % 3],
       o.kind::public.order_type, 'complete',
       o.created, o.created + o.wait, o.created + o.wait + o.cook,
       o.created + o.wait + o.cook + make_interval(mins =>
         case when o.kind = 'dine_in' then 2
              when o.d <= 7 and o.room = '107' then 14 + o.d % 7
              when o.d <= 7 then 5 + o.d % 5
              else 3 + o.d % 4 end),
       'a0000000-0000-4000-8000-000000000005'
from (
  select d, room,
         case when room = '107' then (case when d <= 7 then 'to_go' else 'dine_in' end)
              when d % 3 = 0 then 'to_go' else 'dine_in' end as kind,
         date_trunc('day', now()) - make_interval(days => d) + make_interval(hours => 11, mins => 30 + (d * 5 + room::int) % 20) as created,
         make_interval(mins => 3 + d % 4) as wait,
         make_interval(mins => 10 + d % 7) as cook
  from generate_series(1, 30) as d, unnest('{101,106,107,110}'::text[]) as room
) as o;

insert into public.fridges (id, facility_id, label) values
  ('d4000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Kitchen fridge A'),
  ('d4000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Kitchen fridge B');

insert into public.fridge_temp_logs (facility_id, fridge_id, temp_f, recorded_at, recorded_by) values
  ('f0000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 38, now() - interval '95 minutes',
   'a0000000-0000-4000-8000-000000000006');

insert into public.kitchen_checklist_items (id, facility_id, label, position) values
  ('d5000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Counters wiped', 1),
  ('d5000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Sinks emptied and rinsed', 2),
  ('d5000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'Trash taken out', 3),
  ('d5000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'Dishwasher started', 4),
  ('d5000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'Next-shift notes left (no names)', 5);

insert into public.kitchen_checklist_completions (facility_id, item_id, on_date, completed_at, completed_by) values
  ('f0000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-000000000001', current_date, now() - interval '20 minutes',
   'a0000000-0000-4000-8000-000000000006'),
  ('f0000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-000000000002', current_date, now() - interval '15 minutes',
   'a0000000-0000-4000-8000-000000000006');

insert into public.meal_feedback (facility_id, meal, menu_item_id, thumbs, created_at) values
  ('f0000000-0000-4000-8000-000000000001', 'lunch', 'd2000000-0000-4000-8000-000000000002', 'down', now() - interval '50 minutes'),
  ('f0000000-0000-4000-8000-000000000001', 'lunch', 'd2000000-0000-4000-8000-000000000001', 'up', now() - interval '45 minutes'),
  ('f0000000-0000-4000-8000-000000000001', 'breakfast', 'd1000000-0000-4000-8000-000000000001', 'up', now() - interval '240 minutes'),
  ('f0000000-0000-4000-8000-000000000001', 'lunch', 'd2000000-0000-4000-8000-000000000002', 'down', now() - interval '30 minutes');

insert into public.supplies (facility_id, label, count) values
  ('f0000000-0000-4000-8000-000000000001', 'Gloves (boxes)', 12),
  ('f0000000-0000-4000-8000-000000000001', 'Cups', 80),
  ('f0000000-0000-4000-8000-000000000001', 'Tissues', 6);

-- Maintenance --------------------------------------------------------------------

insert into public.maintenance_requests (id, facility_id, title, room_number, area, details, priority, status,
                                         created_at, created_by, assigned_to, seen_at, assigned_at, fixed_at) values
  ('e1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Leaking sink', '101', '',
   'Water pools under the cabinet.', 'urgent', 'open', now() - interval '49 hours', 'a0000000-0000-4000-8000-000000000002',
   null, now() - interval '40 hours', null, null),
  ('e1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Hallway light out', null,
   '2nd floor hallway, Building B', 'Second fixture from the elevator.', 'routine', 'in_progress', now() - interval '6 hours',
   'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000008', now() - interval '5 hours',
   now() - interval '4 hours', null),
  ('e1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'Heater rattles', '110', '', '', 'routine', 'open',
   now() - interval '3 hours', 'a0000000-0000-4000-8000-000000000003', null, null, null, null);

insert into public.maintenance_updates (facility_id, request_id, status, note, created_at, created_by) values
  ('f0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'in_progress', 'Bulb ordered, ladder on the way.',
   now() - interval '4 hours', 'a0000000-0000-4000-8000-000000000008');

-- History: a repair every other day. This week they sat for a long time before anyone was assigned.
with h as (
  select d,
         (array['Running toilet', 'Blind cord broken', 'Closet door off track', 'Outlet not working', 'Heater rattles',
                'Loose grab bar', 'Window sticks', 'Light flickers'])[1 + d % 8] as title,
         ('{101,103,106,107,110}'::text[])[1 + d % 5] as room,
         (array['a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005',
                'a0000000-0000-4000-8000-000000000003']::uuid[])[1 + d % 3] as sender,
         (array['a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000009']::uuid[])[1 + d % 2] as crew,
         date_trunc('day', now()) - make_interval(days => d) + interval '9 hours' as created,
         make_interval(hours => case when d <= 7 then 9 else 2 + d % 2 end) as to_seen,
         make_interval(hours => case when d <= 7 then 34 else 3 + d % 3 end) as to_assigned,
         make_interval(hours => 4 + d % 3) as to_fixed
  from generate_series(1, 30) as d
  where d % 2 = 1
), r as (
  insert into public.maintenance_requests (facility_id, title, room_number, priority, status, created_at, created_by, assigned_to,
                                           seen_at, assigned_at, fixed_at)
  select 'f0000000-0000-4000-8000-000000000001', title, room, 'routine', 'done', created, sender, crew,
         created + to_seen, created + to_seen + to_assigned, created + to_seen + to_assigned + to_fixed
  from h
  returning id, fixed_at
)
insert into public.maintenance_updates (facility_id, request_id, status, note, created_at, created_by)
select 'f0000000-0000-4000-8000-000000000001', id, 'done', 'Fixed.', fixed_at, 'a0000000-0000-4000-8000-000000000008'
from r;

-- Calendar -----------------------------------------------------------------------

insert into public.events (id, facility_id, title, kind, starts_at, all_day, building_id, place, room_number) values
  ('e2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Bingo', 'activity',
   date_trunc('day', now()) + interval '14 hours', false, 'b0000000-0000-4000-8000-000000000001', '', null),
  ('e2000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Chair yoga', 'activity',
   date_trunc('day', now()) + interval '10 hours', false, 'b0000000-0000-4000-8000-000000000002', '', null),
  ('e2000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'Birthday lunch', 'dining',
   date_trunc('day', now()) + interval '1 day 11 hours', false, 'b0000000-0000-4000-8000-000000000001', 'Dining room', null),
  ('e2000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'Handrail repair', 'maintenance',
   date_trunc('day', now()) + interval '1 day 14 hours', false, 'b0000000-0000-4000-8000-000000000001', '', '103'),
  ('e2000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'Family visiting day', 'activity',
   date_trunc('day', now()) + interval '2 days', true, 'b0000000-0000-4000-8000-000000000001', '', null),
  ('e2000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'Hallway filter check', 'maintenance',
   date_trunc('day', now()) + interval '2 days 9 hours', false, 'b0000000-0000-4000-8000-000000000002', '', null),
  ('e2000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000001', 'Live music', 'activity',
   date_trunc('day', now()) + interval '3 days 10 hours', false, 'b0000000-0000-4000-8000-000000000002', '', null),
  ('e2000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000001', 'Sunday brunch', 'dining',
   date_trunc('day', now()) + interval '3 days 11 hours', false, 'b0000000-0000-4000-8000-000000000001', 'Dining room', null),
  ('e2000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000001', 'Coffee social', 'activity',
   date_trunc('day', now()) + interval '4 days 9 hours 40 minutes', false, 'b0000000-0000-4000-8000-000000000001', '', null),
  ('e2000000-0000-4000-8000-000000000010', 'f0000000-0000-4000-8000-000000000001', 'Fire alarm test', 'maintenance',
   date_trunc('day', now()) + interval '4 days 14 hours', false, 'b0000000-0000-4000-8000-000000000001', '', null),
  ('e2000000-0000-4000-8000-000000000011', 'f0000000-0000-4000-8000-000000000001', 'HVAC filters', 'maintenance',
   date_trunc('day', now()) + interval '5 days 13 hours', false, 'b0000000-0000-4000-8000-000000000003', '', null),
  ('e2000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000001', 'Garden club', 'activity',
   date_trunc('day', now()) + interval '5 days 11 hours 30 minutes', false, 'b0000000-0000-4000-8000-000000000001', '', null),
  ('e2000000-0000-4000-8000-000000000013', 'f0000000-0000-4000-8000-000000000001', 'Post next week''s menu', 'dining',
   date_trunc('day', now()) + interval '6 days 15 hours', false, null, '', null);

-- History: one activity a day.
insert into public.events (facility_id, title, kind, starts_at, building_id)
select 'f0000000-0000-4000-8000-000000000001',
       (array['Chair yoga', 'Bingo', 'Coffee social', 'Movie night', 'Garden club', 'Trivia'])[1 + d % 6], 'activity',
       date_trunc('day', now()) - make_interval(days => d) + make_interval(hours => case when d % 2 = 1 then 10 else 14 end),
       ('b0000000-0000-4000-8000-00000000000' || (1 + d % 3))::uuid
from generate_series(1, 30) as d;

insert into public.event_attendance (facility_id, event_id, room_number)
values
  ('f0000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', '101'),
  ('f0000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', '106');

insert into public.event_attendance (facility_id, event_id, room_number, marked_at)
select e.facility_id, e.id, room, e.starts_at + interval '1 hour'
from public.events e
cross join lateral (select (current_date - e.starts_at::date) as d) as x
cross join unnest('{101,106,107,110}'::text[]) as room
where e.facility_id = 'f0000000-0000-4000-8000-000000000001'
  and e.id::text not like 'e2000000-%'
  and case room
        when '110' then x.d > 7 and x.d % 2 = 1
        when '107' then x.d > 7 and x.d % 3 <> 0
        else x.d % 2 = 0
      end;

-- Attendance is written up late this week. (Set after the attendance rows, which stamp the event themselves.)
update public.events e
set attendance_at = e.starts_at + make_interval(hours => case when current_date - e.starts_at::date <= 7 then 5 else 1 end,
                                                mins => (current_date - e.starts_at::date) * 7 % 60)
where e.facility_id = 'f0000000-0000-4000-8000-000000000001' and e.id::text not like 'e2000000-%';

update public.events set attendance_at = date_trunc('day', now()) + interval '15 hours'
where id = 'e2000000-0000-4000-8000-000000000001';

insert into public.staffing_days (facility_id, on_date, department, needed, scheduled)
select 'f0000000-0000-4000-8000-000000000001', current_date + d, n.department::public.department, n.needed,
       case when d = 1 and n.department = 'dining' then 5
            when d = 2 and n.department = 'housekeeping' then 2
            else n.needed end
from generate_series(-1, 7) as d,
     (values ('housekeeping', 4), ('dining', 6), ('maintenance', 2), ('activities', 1)) as n (department, needed);

-- Alerts -------------------------------------------------------------------------

insert into public.alerts (facility_id, created_at, title, body, href, to_roles) values
  ('f0000000-0000-4000-8000-000000000001', now() - interval '26 hours', 'Room 104 needs a deep clean',
   'Checked out. Pick a housekeeper for the deep clean.', '/housekeeping/assign', array['hk_director']::public.staff_role[]),
  ('f0000000-0000-4000-8000-000000000001', now() - interval '49 hours', 'Urgent request: Leaking sink',
   'Room 101 · from housekeeping@homestead.demo', '/maintenance', array['maintenance']::public.staff_role[]);

-- Resident lens (what residents said, by room) --------------------------------------

insert into public.room_feedback (facility_id, room_number, department, kind, topic, body, created_at, created_by)
select 'f0000000-0000-4000-8000-000000000001', f.room, f.department::public.department, f.kind::public.feedback_kind,
       f.topic::public.feedback_topic, f.body,
       case when f.days_ago = 0 then now() - interval '2 hours'
            else date_trunc('day', now()) - make_interval(days => f.days_ago) + interval '12 hours 55 minutes' end,
       'a0000000-0000-4000-8000-000000000005'
from (values
  (0, '107', 'dining', 'complaint', 'food_temperature', 'Lunch was cold again by the time the tray got to me.'),
  (1, '101', 'maintenance', 'complaint', 'repairs_slow', 'Still waiting on someone to look at my sink.'),
  (2, '107', 'dining', 'complaint', 'food_temperature', 'Soup was cold.'),
  (3, '107', 'dining', 'complaint', 'food_temperature', 'Tray came late and cold.'),
  (1, '110', 'dining', 'complaint', 'food_temperature', 'Coffee was lukewarm.'),
  (4, '106', 'dining', 'complaint', 'food_temperature', 'Eggs were cold.'),
  (2, '106', 'maintenance', 'complaint', 'repairs_slow', 'Blind still broken.'),
  (5, '110', 'maintenance', 'complaint', 'repairs_slow', 'Heater still rattles.'),
  (3, '101', 'housekeeping', 'complaint', 'room_cleanliness', 'Bathroom was missed.'),
  (4, '110', 'housekeeping', 'complaint', 'room_cleanliness', 'Floor not mopped.'),
  (2, '110', 'activities', 'complaint', 'noise', 'Loud hallway after 10.'),
  (5, '106', 'activities', 'complaint', 'noise', 'Door slamming at night.'),
  (6, '110', 'activities', 'complaint', 'activity_variety', 'Same games every week.'),
  (1, '101', 'dining', 'compliment', 'food_taste', 'Loved the chicken.'),
  (1, '106', 'activities', 'compliment', 'activity_variety', 'Music was great.'),
  (2, '101', 'housekeeping', 'compliment', 'room_cleanliness', 'Room looks great.'),
  (3, '106', 'dining', 'compliment', 'food_taste', 'Great soup.'),
  (3, '110', 'housekeeping', 'compliment', 'staff_response', 'Housekeeper was so kind.'),
  (4, '101', 'activities', 'compliment', 'activity_variety', 'Enjoyed trivia.'),
  (5, '107', 'housekeeping', 'compliment', 'room_cleanliness', 'Fresh linens, thank you.'),
  (5, '106', 'maintenance', 'compliment', 'staff_response', 'Fixed my light fast.'),
  (6, '101', 'dining', 'compliment', 'food_taste', 'Pie was wonderful.'),
  (9, '107', 'dining', 'complaint', 'food_temperature', 'A bit cold.'),
  (10, '101', 'dining', 'complaint', 'food_temperature', 'Toast cold.'),
  (9, '110', 'maintenance', 'complaint', 'repairs_slow', 'Faucet still drips.'),
  (11, '106', 'maintenance', 'complaint', 'repairs_slow', 'Waiting on outlet.'),
  (8, '106', 'housekeeping', 'complaint', 'room_cleanliness', 'Dust on shelves.'),
  (12, '110', 'housekeeping', 'complaint', 'room_cleanliness', 'Trash not emptied.'),
  (10, '110', 'activities', 'complaint', 'activity_variety', 'Want more outings.'),
  (13, '101', 'activities', 'complaint', 'activity_variety', 'More music please.'),
  (8, '107', 'activities', 'compliment', 'activity_variety', 'Loved chair yoga.')
) as f (days_ago, room, department, kind, topic, body);

commit;
