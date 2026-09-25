-- Operations tables: rooms, housekeeping, dining, maintenance, calendar, alerts, resident lens (by room number).
-- Every row carries facility_id, and references are (facility_id, x) pairs so a row can never point into another building.
-- No column holds a resident name, contact, diet or health detail.

create type public.occupancy as enum ('vacant', 'occupied', 'needs_cleaning');
create type public.clean_kind as enum ('routine', 'deep');
create type public.cleaning_status as enum ('not_started', 'in_progress', 'done');
create type public.meal as enum ('breakfast', 'lunch', 'dinner');
create type public.order_type as enum ('dine_in', 'to_go');
create type public.order_status as enum ('pending', 'preparing', 'ready', 'complete');
create type public.thumbs as enum ('up', 'down');
create type public.maintenance_status as enum ('open', 'in_progress', 'waiting', 'done');
create type public.maintenance_priority as enum ('routine', 'urgent');
create type public.event_kind as enum ('activity', 'maintenance', 'dining', 'housekeeping');
create type public.department as enum ('housekeeping', 'dining', 'maintenance', 'activities');
create type public.feedback_kind as enum ('complaint', 'compliment');
create type public.feedback_topic as enum (
  'food_temperature', 'food_taste', 'repairs_slow', 'room_cleanliness', 'noise', 'activity_variety', 'staff_response'
);

-- Rooms -----------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  number text not null check (number ~ '^[A-Za-z0-9-]{1,10}$'),
  building_id uuid,
  occupancy public.occupancy not null default 'vacant',
  assigned_to uuid,
  clean_days smallint[] not null default '{}' check (clean_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  unique (facility_id, number),
  unique (facility_id, id),
  foreign key (facility_id, building_id) references public.buildings (facility_id, id),
  foreign key (facility_id, assigned_to) references public.staff_accounts (facility_id, id) on delete set null (assigned_to)
);

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  room_number text not null,
  starts_on date not null,
  ends_on date not null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  check (ends_on >= starts_on),
  check (checked_out_at is null or checked_out_at >= checked_in_at),
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade
);

create unique index stays_one_open_per_room on public.stays (facility_id, room_number) where checked_out_at is null;

-- Housekeeping ----------------------------------------------------------------

create table public.clean_checklist_items (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  kind public.clean_kind not null,
  label text not null check (length(trim(label)) between 1 and 120),
  position integer not null default 0,
  unique (facility_id, id)
);

create table public.clean_jobs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  room_number text not null,
  kind public.clean_kind not null,
  due_on date not null default current_date,
  created_at timestamptz not null default now(),
  assigned_to uuid,
  status public.cleaning_status not null default 'not_started',
  started_at timestamptz,
  finished_at timestamptz,
  unique (facility_id, id),
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade,
  foreign key (facility_id, assigned_to) references public.staff_accounts (facility_id, id) on delete set null (assigned_to)
);

create unique index clean_jobs_one_routine_per_day on public.clean_jobs (facility_id, room_number, due_on) where kind = 'routine';
create index clean_jobs_due on public.clean_jobs (facility_id, due_on);
create index clean_jobs_assignee on public.clean_jobs (facility_id, assigned_to);

create table public.clean_job_checks (
  facility_id uuid not null references public.facilities (id) on delete cascade,
  clean_job_id uuid not null,
  item_id uuid not null,
  checked_at timestamptz not null default now(),
  primary key (clean_job_id, item_id),
  foreign key (facility_id, clean_job_id) references public.clean_jobs (facility_id, id) on delete cascade,
  foreign key (facility_id, item_id) references public.clean_checklist_items (facility_id, id) on delete cascade
);

create table public.clean_notes (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  clean_job_id uuid not null,
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  created_by uuid,
  foreign key (facility_id, clean_job_id) references public.clean_jobs (facility_id, id) on delete cascade,
  foreign key (facility_id, created_by) references public.staff_accounts (facility_id, id) on delete set null (created_by)
);

create index clean_notes_job on public.clean_notes (facility_id, clean_job_id);

-- Dining ----------------------------------------------------------------------

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  meal public.meal not null,
  name text not null check (length(trim(name)) between 1 and 120),
  active boolean not null default true,
  unique (facility_id, meal, name),
  unique (facility_id, id)
);

create table public.menu_files (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  meal public.meal not null,
  file_name text not null,
  file_kind text not null check (file_kind in ('image', 'pdf')),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid,
  unique (facility_id, meal),
  foreign key (facility_id, uploaded_by) references public.staff_accounts (facility_id, id) on delete set null (uploaded_by)
);

create table public.meal_orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  room_number text not null,
  meal public.meal not null,
  menu_item_id uuid,
  special text not null default '' check (length(special) <= 300),
  order_type public.order_type not null default 'dine_in',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  placed_by uuid,
  check (menu_item_id is not null or length(trim(special)) > 0),
  unique (facility_id, id),
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade,
  foreign key (facility_id, menu_item_id) references public.menu_items (facility_id, id),
  foreign key (facility_id, placed_by) references public.staff_accounts (facility_id, id) on delete set null (placed_by)
);

create index meal_orders_open on public.meal_orders (facility_id, status, created_at);
create index meal_orders_item on public.meal_orders (facility_id, menu_item_id);
create index meal_orders_placed_by on public.meal_orders (facility_id, placed_by);

create table public.fridges (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80),
  unique (facility_id, label),
  unique (facility_id, id)
);

-- Append-only: no edits or deletes, ever (a trigger below enforces it for every role).
create table public.fridge_temp_logs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  fridge_id uuid not null,
  temp_f numeric(5, 1) not null check (temp_f between -40 and 120),
  recorded_at timestamptz not null default now(),
  recorded_by uuid,
  foreign key (facility_id, fridge_id) references public.fridges (facility_id, id),
  foreign key (facility_id, recorded_by) references public.staff_accounts (facility_id, id) on delete set null (recorded_by)
);

create index fridge_temp_logs_fridge on public.fridge_temp_logs (facility_id, fridge_id, recorded_at desc);

create table public.kitchen_checklist_items (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 120),
  position integer not null default 0,
  unique (facility_id, id)
);

create table public.kitchen_checklist_completions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  item_id uuid not null,
  on_date date not null default current_date,
  completed_at timestamptz not null default now(),
  completed_by uuid,
  unique (item_id, on_date),
  foreign key (facility_id, item_id) references public.kitchen_checklist_items (facility_id, id) on delete cascade,
  foreign key (facility_id, completed_by) references public.staff_accounts (facility_id, id) on delete set null (completed_by)
);

create table public.meal_feedback (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  meal public.meal not null,
  menu_item_id uuid not null,
  thumbs public.thumbs not null,
  created_at timestamptz not null default now(),
  foreign key (facility_id, menu_item_id) references public.menu_items (facility_id, id) on delete cascade
);

create index meal_feedback_item on public.meal_feedback (facility_id, menu_item_id, created_at);

create table public.supplies (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80),
  count integer not null default 0 check (count >= 0),
  unique (facility_id, label)
);

-- Maintenance -----------------------------------------------------------------

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  room_number text,
  area text not null default '' check (length(area) <= 200),
  details text not null default '' check (length(details) <= 2000),
  priority public.maintenance_priority not null default 'routine',
  status public.maintenance_status not null default 'open',
  created_at timestamptz not null default now(),
  created_by uuid,
  assigned_to uuid,
  seen_at timestamptz,
  assigned_at timestamptz,
  fixed_at timestamptz,
  clean_job_id uuid,
  check (room_number is not null or length(trim(area)) > 0),
  unique (facility_id, id),
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade,
  foreign key (facility_id, created_by) references public.staff_accounts (facility_id, id) on delete set null (created_by),
  foreign key (facility_id, assigned_to) references public.staff_accounts (facility_id, id) on delete set null (assigned_to),
  foreign key (facility_id, clean_job_id) references public.clean_jobs (facility_id, id) on delete set null (clean_job_id)
);

create index maintenance_requests_status on public.maintenance_requests (facility_id, status, created_at);
create index maintenance_requests_room on public.maintenance_requests (facility_id, room_number);
create index maintenance_requests_assignee on public.maintenance_requests (facility_id, assigned_to);
create index maintenance_requests_creator on public.maintenance_requests (facility_id, created_by);
create index maintenance_requests_clean_job on public.maintenance_requests (facility_id, clean_job_id);

create table public.maintenance_photos (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  request_id uuid not null,
  storage_path text not null,
  position smallint not null check (position between 0 and 2),
  unique (request_id, position),
  foreign key (facility_id, request_id) references public.maintenance_requests (facility_id, id) on delete cascade
);

create table public.maintenance_updates (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  request_id uuid not null,
  status public.maintenance_status not null,
  note text not null default '' check (length(note) <= 1000),
  created_at timestamptz not null default now(),
  created_by uuid,
  foreign key (facility_id, request_id) references public.maintenance_requests (facility_id, id) on delete cascade,
  foreign key (facility_id, created_by) references public.staff_accounts (facility_id, id) on delete set null (created_by)
);

create index maintenance_updates_request on public.maintenance_updates (facility_id, request_id, created_at);

-- Calendar --------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  kind public.event_kind not null,
  starts_at timestamptz not null,
  all_day boolean not null default false,
  building_id uuid,
  place text not null default '' check (length(place) <= 80),
  room_number text,
  attendance_at timestamptz,
  check (kind <> 'activity' or building_id is not null),
  unique (facility_id, id),
  foreign key (facility_id, building_id) references public.buildings (facility_id, id),
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade
);

create index events_starts on public.events (facility_id, starts_at);
create index events_building on public.events (facility_id, building_id);
create index events_room on public.events (facility_id, room_number);

create table public.event_attendance (
  facility_id uuid not null references public.facilities (id) on delete cascade,
  event_id uuid not null,
  room_number text not null,
  marked_at timestamptz not null default now(),
  primary key (event_id, room_number),
  foreign key (facility_id, event_id) references public.events (facility_id, id) on delete cascade,
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade
);

create index event_attendance_room on public.event_attendance (facility_id, room_number);

create table public.staffing_days (
  facility_id uuid not null references public.facilities (id) on delete cascade,
  on_date date not null,
  department public.department not null,
  needed integer not null check (needed >= 0),
  scheduled integer not null check (scheduled >= 0),
  primary key (facility_id, on_date, department)
);

-- Alerts ----------------------------------------------------------------------

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null default '' check (length(body) <= 1000),
  href text not null default '/' check (href like '/%'),
  to_roles public.staff_role[] not null default '{}',
  to_emails text[] not null default '{}',
  check (cardinality(to_roles) + cardinality(to_emails) > 0),
  unique (facility_id, id)
);

create index alerts_recent on public.alerts (facility_id, created_at desc);

create table public.alert_reads (
  facility_id uuid not null references public.facilities (id) on delete cascade,
  alert_id uuid not null,
  staff_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (alert_id, staff_id),
  foreign key (facility_id, alert_id) references public.alerts (facility_id, id) on delete cascade,
  foreign key (facility_id, staff_id) references public.staff_accounts (facility_id, id) on delete cascade
);

create index alert_reads_staff on public.alert_reads (facility_id, staff_id);

-- Resident lens (by room number) ---------------------------------------------

create table public.room_feedback (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  room_number text not null,
  department public.department not null,
  kind public.feedback_kind not null,
  topic public.feedback_topic not null,
  body text not null check (length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  created_by uuid,
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade,
  foreign key (facility_id, created_by) references public.staff_accounts (facility_id, id) on delete set null (created_by)
);

create index room_feedback_room on public.room_feedback (facility_id, room_number, created_at desc);
create index room_feedback_creator on public.room_feedback (facility_id, created_by);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  room_number text not null,
  on_date date not null,
  reason text not null check (length(trim(reason)) between 1 and 300),
  created_at timestamptz not null default now(),
  created_by uuid,
  done_at timestamptz,
  foreign key (facility_id, room_number) references public.rooms (facility_id, number) on update cascade,
  foreign key (facility_id, created_by) references public.staff_accounts (facility_id, id) on delete set null (created_by)
);

create index visits_room on public.visits (facility_id, room_number, on_date);
create index visits_creator on public.visits (facility_id, created_by);

-- Remaining foreign-key indexes
create index rooms_building on public.rooms (facility_id, building_id);
create index rooms_assignee on public.rooms (facility_id, assigned_to);
create index stays_room on public.stays (facility_id, room_number, checked_in_at desc);
create index clean_jobs_room on public.clean_jobs (facility_id, room_number);
create index clean_job_checks_item on public.clean_job_checks (facility_id, item_id);
create index clean_notes_creator on public.clean_notes (facility_id, created_by);
create index menu_files_uploader on public.menu_files (facility_id, uploaded_by);
create index meal_orders_room on public.meal_orders (facility_id, room_number);
create index fridge_temp_logs_recorder on public.fridge_temp_logs (facility_id, recorded_by);
create index kitchen_checklist_completions_item on public.kitchen_checklist_completions (facility_id, item_id);
create index kitchen_checklist_completions_by on public.kitchen_checklist_completions (facility_id, completed_by);
create index maintenance_photos_request on public.maintenance_photos (facility_id, request_id);
create index maintenance_updates_creator on public.maintenance_updates (facility_id, created_by);

-- Row level security on every table (policies come in the next migration; until then nothing is readable).
alter table public.rooms enable row level security;
alter table public.stays enable row level security;
alter table public.clean_checklist_items enable row level security;
alter table public.clean_jobs enable row level security;
alter table public.clean_job_checks enable row level security;
alter table public.clean_notes enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_files enable row level security;
alter table public.meal_orders enable row level security;
alter table public.fridges enable row level security;
alter table public.fridge_temp_logs enable row level security;
alter table public.kitchen_checklist_items enable row level security;
alter table public.kitchen_checklist_completions enable row level security;
alter table public.meal_feedback enable row level security;
alter table public.supplies enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_photos enable row level security;
alter table public.maintenance_updates enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
alter table public.staffing_days enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_reads enable row level security;
alter table public.room_feedback enable row level security;
alter table public.visits enable row level security;

-- The server is the only clock ------------------------------------------------
-- Staff signed in through the app cannot set timestamps; the database stamps them. The seed (run as an admin)
-- can still load history.

create function private.is_app_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('authenticated', 'anon')
$$;

revoke all on function private.is_app_user() from public, anon;
grant execute on function private.is_app_user() to authenticated;

-- Usage: create trigger ... execute function private.stamp_now('created_at')
create function private.stamp_now()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new := jsonb_populate_record(new, jsonb_build_object(tg_argv[0], now()));
  end if;
  return new;
end;
$$;

create trigger stays_stamp before insert on public.stays for each row execute function private.stamp_now('checked_in_at');
create trigger clean_jobs_stamp before insert on public.clean_jobs for each row execute function private.stamp_now('created_at');
create trigger clean_job_checks_stamp before insert on public.clean_job_checks for each row execute function private.stamp_now('checked_at');
create trigger clean_notes_stamp before insert on public.clean_notes for each row execute function private.stamp_now('created_at');
create trigger menu_files_stamp before insert on public.menu_files for each row execute function private.stamp_now('uploaded_at');
create trigger meal_orders_stamp before insert on public.meal_orders for each row execute function private.stamp_now('created_at');
create trigger fridge_temp_logs_stamp before insert on public.fridge_temp_logs for each row execute function private.stamp_now('recorded_at');
create trigger kitchen_checklist_completions_stamp before insert on public.kitchen_checklist_completions for each row execute function private.stamp_now('completed_at');
create trigger meal_feedback_stamp before insert on public.meal_feedback for each row execute function private.stamp_now('created_at');
create trigger maintenance_requests_stamp before insert on public.maintenance_requests for each row execute function private.stamp_now('created_at');
create trigger maintenance_updates_stamp before insert on public.maintenance_updates for each row execute function private.stamp_now('created_at');
create trigger event_attendance_stamp before insert on public.event_attendance for each row execute function private.stamp_now('marked_at');
create trigger alerts_stamp before insert on public.alerts for each row execute function private.stamp_now('created_at');
create trigger alert_reads_stamp before insert on public.alert_reads for each row execute function private.stamp_now('read_at');
create trigger room_feedback_stamp before insert on public.room_feedback for each row execute function private.stamp_now('created_at');
create trigger visits_stamp before insert on public.visits for each row execute function private.stamp_now('created_at');

-- New cleans and orders from the app always start at the beginning.
create function private.new_clean_job()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new.status := 'not_started';
    new.started_at := null;
    new.finished_at := null;
  end if;
  return new;
end;
$$;

create trigger clean_jobs_new before insert on public.clean_jobs for each row execute function private.new_clean_job();

-- Not started → in progress → done. Done never flips back. Repeating a step changes nothing (safe retries).
create function private.clean_job_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    new.started_at := old.started_at;
    new.finished_at := old.finished_at;
  elsif old.status = 'done' then
    raise exception 'A finished clean cannot be reopened.' using errcode = 'check_violation';
  elsif old.status = 'not_started' and new.status = 'in_progress' then
    new.started_at := now();
    new.finished_at := null;
  elsif old.status = 'in_progress' and new.status = 'done' then
    if exists (
      select 1
      from public.clean_checklist_items i
      where i.facility_id = new.facility_id
        and i.kind = new.kind
        and not exists (select 1 from public.clean_job_checks c where c.clean_job_id = new.id and c.item_id = i.id)
    ) then
      raise exception 'Check every checklist item before finishing.' using errcode = 'check_violation';
    end if;
    new.started_at := old.started_at;
    new.finished_at := now();
  else
    raise exception 'A clean goes not started, then in progress, then done.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger clean_jobs_status before update on public.clean_jobs for each row execute function private.clean_job_status();

-- A finished deep clean opens the room for the next check-in.
create function private.deep_clean_done()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'deep' and new.status = 'done' and old.status <> 'done' then
    update public.rooms
    set occupancy = 'vacant'
    where facility_id = new.facility_id and number = new.room_number and occupancy = 'needs_cleaning';
  end if;
  return null;
end;
$$;

create trigger clean_jobs_deep_done after update on public.clean_jobs for each row execute function private.deep_clean_done();

-- Vacant → occupied → needs cleaning → vacant.
create function private.room_occupancy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.occupancy is distinct from old.occupancy
     and not (
       (old.occupancy = 'vacant' and new.occupancy = 'occupied')
       or (old.occupancy = 'occupied' and new.occupancy = 'needs_cleaning')
       or (old.occupancy = 'needs_cleaning' and new.occupancy = 'vacant')
     ) then
    raise exception 'Room % cannot go from % to %.', old.number, old.occupancy, new.occupancy
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger rooms_occupancy before update on public.rooms for each row execute function private.room_occupancy();

-- Orders only move forward. Each step is stamped by the server.
create function private.meal_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new.created_at := old.created_at;
    new.started_at := old.started_at;
    new.ready_at := old.ready_at;
    new.completed_at := old.completed_at;
  end if;
  if new.status = old.status then
    return new;
  end if;
  if array_position(enum_range(null::public.order_status), new.status)
     < array_position(enum_range(null::public.order_status), old.status) then
    raise exception 'An order cannot move back from % to %.', old.status, new.status using errcode = 'check_violation';
  end if;
  if new.status = 'preparing' then
    new.started_at := coalesce(new.started_at, now());
  elsif new.status = 'ready' then
    new.ready_at := now();
  elsif new.status = 'complete' then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create trigger meal_orders_status before update on public.meal_orders for each row execute function private.meal_order_status();

create function private.new_meal_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new.status := 'pending';
    new.started_at := null;
    new.ready_at := null;
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger meal_orders_new before insert on public.meal_orders for each row execute function private.new_meal_order();

-- Repairs: assigning stamps seen / assigned; complete stamps fixed.
create function private.maintenance_stamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new.created_at := old.created_at;
    new.seen_at := old.seen_at;
    new.assigned_at := old.assigned_at;
    new.fixed_at := old.fixed_at;
  end if;
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    new.assigned_at := now();
    new.seen_at := coalesce(new.seen_at, now());
  end if;
  if new.status = 'done' and old.status <> 'done' then
    new.fixed_at := now();
  elsif new.status <> 'done' then
    new.fixed_at := null;
  end if;
  return new;
end;
$$;

create trigger maintenance_requests_stamps before update on public.maintenance_requests for each row execute function private.maintenance_stamps();

-- The crew opening a request marks it seen (the "seen → assigned" wait on Weekly pulse).
create function public.mark_maintenance_seen(p_request_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.maintenance_requests
  set seen_at = now()
  where id = p_request_id
    and seen_at is null
    and facility_id = private.my_facility_id()
    and private.can('maintenance_crew')
$$;

-- Fridge log: no silent edits, for anyone.
create function private.append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Temperature logs cannot be changed or deleted. Log a new reading instead.'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger fridge_temp_logs_append_only before update or delete on public.fridge_temp_logs
  for each row execute function private.append_only();

-- Attendance changes stamp the event (the "attendance taken late" risk on the calendar).
create function private.attendance_taken()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.events set attendance_at = now() where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;

create trigger event_attendance_taken after insert or delete on public.event_attendance
  for each row execute function private.attendance_taken();

-- Check in / check out --------------------------------------------------------
-- One call does every step, all or nothing. Runs as the caller, so their access rules still apply.

create function public.check_in(p_room text, p_starts_on date, p_ends_on date)
returns public.stays
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_facility uuid := private.my_facility_id();
  v_room public.rooms;
  v_stay public.stays;
begin
  if not private.can('rooms') then
    raise exception 'Your job cannot check rooms in or out.' using errcode = 'insufficient_privilege';
  end if;
  if p_ends_on < p_starts_on then
    raise exception 'The stay ends before it starts.' using errcode = 'check_violation';
  end if;
  select * into v_room from public.rooms where facility_id = v_facility and number = p_room for update;
  if not found then
    raise exception 'Room % does not exist.', p_room using errcode = 'no_data_found';
  end if;
  if v_room.occupancy = 'occupied' then
    raise exception 'Room % is already occupied.', p_room using errcode = 'check_violation';
  elsif v_room.occupancy = 'needs_cleaning' then
    raise exception 'Room % still needs a deep clean.', p_room using errcode = 'check_violation';
  end if;

  update public.rooms set occupancy = 'occupied' where id = v_room.id;
  insert into public.stays (facility_id, room_number, starts_on, ends_on)
  values (v_facility, p_room, p_starts_on, p_ends_on)
  returning * into v_stay;
  return v_stay;
end;
$$;

create function public.check_out(p_room text)
returns public.clean_jobs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_facility uuid := private.my_facility_id();
  v_room public.rooms;
  v_job public.clean_jobs;
begin
  if not private.can('rooms') then
    raise exception 'Your job cannot check rooms in or out.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_room from public.rooms where facility_id = v_facility and number = p_room for update;
  if not found then
    raise exception 'Room % does not exist.', p_room using errcode = 'no_data_found';
  end if;
  if v_room.occupancy <> 'occupied' then
    raise exception 'Room % is not occupied.', p_room using errcode = 'check_violation';
  end if;

  update public.stays set checked_out_at = now()
  where facility_id = v_facility and room_number = p_room and checked_out_at is null;
  update public.rooms set occupancy = 'needs_cleaning' where id = v_room.id;
  insert into public.clean_jobs (facility_id, room_number, kind, due_on)
  values (v_facility, p_room, 'deep', current_date)
  returning * into v_job;
  insert into public.alerts (facility_id, title, body, href, to_roles)
  values (
    v_facility,
    'Room ' || p_room || ' needs a deep clean',
    'Checked out. Pick a housekeeper for the deep clean.',
    '/housekeeping/assign',
    array['hk_director', 'ops_manager']::public.staff_role[]
  );
  return v_job;
end;
$$;

revoke all on function public.check_in(text, date, date) from public, anon;
revoke all on function public.check_out(text) from public, anon;
revoke all on function public.mark_maintenance_seen(uuid) from public, anon;
grant execute on function public.check_in(text, date, date) to authenticated;
grant execute on function public.check_out(text) to authenticated;
grant execute on function public.mark_maintenance_seen(uuid) to authenticated;
