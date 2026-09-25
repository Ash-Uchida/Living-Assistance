-- Who can read and change what. Every rule starts with "your own building" and then checks the job's screens
-- (role_access, which the operations manager edits on the Access page). Signed-out visitors (anon) get nothing.
-- private.* calls are wrapped in (select ...) so Postgres runs them once per query, not once per row.

-- Access list safety ------------------------------------------------------------

-- A building always keeps at least one operations manager.
create function private.keep_an_ops_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'ops_manager'
     and (tg_op = 'DELETE' or new.role is distinct from 'ops_manager')
     and exists (select 1 from public.facilities f where f.id = old.facility_id)
     and not exists (
       select 1 from public.staff_accounts s
       where s.facility_id = old.facility_id and s.role = 'ops_manager' and s.id <> old.id
     ) then
    raise exception 'At least one operations manager must stay in Operations.' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger staff_accounts_keep_ops before update or delete on public.staff_accounts
  for each row execute function private.keep_an_ops_manager();

-- Operations managers can never lose the Access screen (or nobody could fix the list).
create function private.keep_ops_access()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'ops_manager' and old.module = 'access'
     and exists (select 1 from public.facilities f where f.id = old.facility_id) then
    raise exception 'Operations managers always keep Access.' using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

create trigger role_access_keep_ops before delete on public.role_access
  for each row execute function private.keep_ops_access();

-- Table privileges (the Data API only sees what is granted here) ----------------

grant select, update on public.facilities to authenticated;
grant select, insert, update, delete on public.buildings to authenticated;
grant select, insert, update, delete on public.staff_accounts to authenticated;
grant select, insert, delete on public.role_access to authenticated;
grant select, insert on public.access_audit to authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update on public.stays to authenticated;
grant select, insert, update, delete on public.clean_checklist_items to authenticated;
grant select, insert, update, delete on public.clean_jobs to authenticated;
grant select, insert, delete on public.clean_job_checks to authenticated;
grant select, insert on public.clean_notes to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select, insert, update, delete on public.menu_files to authenticated;
grant select, insert, update on public.meal_orders to authenticated;
grant select, insert, update, delete on public.fridges to authenticated;
grant select, insert on public.fridge_temp_logs to authenticated;
grant select, insert, update, delete on public.kitchen_checklist_items to authenticated;
grant select, insert, delete on public.kitchen_checklist_completions to authenticated;
grant select, insert on public.meal_feedback to authenticated;
grant select, insert, update, delete on public.supplies to authenticated;
grant select, insert, update on public.maintenance_requests to authenticated;
grant select, insert on public.maintenance_photos to authenticated;
grant select, insert on public.maintenance_updates to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, delete on public.event_attendance to authenticated;
grant select, insert, update on public.staffing_days to authenticated;
grant select, insert on public.alerts to authenticated;
grant select, insert, delete on public.alert_reads to authenticated;
grant select, insert on public.room_feedback to authenticated;
grant select, insert, update on public.visits to authenticated;

-- Building and access list ------------------------------------------------------

create policy "own building" on public.facilities for select to authenticated
  using (id = (select private.my_facility_id()));
create policy "access: edit settings" on public.facilities for update to authenticated
  using (id = (select private.my_facility_id()) and (select private.can('access')))
  with check (id = (select private.my_facility_id()));

create policy "staff: read" on public.buildings for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "access: add" on public.buildings for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "access: edit" on public.buildings for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')))
  with check (facility_id = (select private.my_facility_id()));
create policy "access: remove" on public.buildings for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));

-- Coworkers' work emails are shown across the app (assignees, "from" lines). Only Access can change them.
create policy "staff: read" on public.staff_accounts for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "access: add" on public.staff_accounts for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "access: move" on public.staff_accounts for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')))
  with check (facility_id = (select private.my_facility_id()));
create policy "access: remove" on public.staff_accounts for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));

create policy "staff: read" on public.role_access for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "access: grant" on public.role_access for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "access: revoke" on public.role_access for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));

create policy "access: read" on public.access_audit for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "access: log" on public.access_audit for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id()) and (select private.can('access'))
    and actor_id = (select private.my_staff_id())
  );

-- Rooms -------------------------------------------------------------------------

create policy "staff: read" on public.rooms for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "access: add" on public.rooms for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "rooms or assignments: edit" on public.rooms for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('rooms')) or (select private.can('hk_assign')))
  )
  with check (facility_id = (select private.my_facility_id()));
create policy "access: remove" on public.rooms for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));

create policy "rooms, calendar, residents: read" on public.stays for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('rooms')) or (select private.can('calendar')) or (select private.can('residents')))
  );
create policy "rooms: check in" on public.stays for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('rooms')));
create policy "rooms: check out" on public.stays for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('rooms')))
  with check (facility_id = (select private.my_facility_id()));

-- Housekeeping ------------------------------------------------------------------

create policy "staff: read" on public.clean_checklist_items for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "director: add" on public.clean_checklist_items for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and ((select private.can('hk_assign')) or (select private.can('access')))
  );
create policy "director: edit" on public.clean_checklist_items for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('hk_assign')) or (select private.can('access')))
  )
  with check (facility_id = (select private.my_facility_id()));
create policy "director: remove" on public.clean_checklist_items for delete to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('hk_assign')) or (select private.can('access')))
  );

-- Housekeepers see only their own cleans; the director (assignments), Rooms and the Residents lens see all.
create policy "own cleans, or all for director" on public.clean_jobs for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and (
      (select private.can('hk_assign')) or (select private.can('rooms')) or (select private.can('residents'))
      or ((select private.can('housekeeping')) and assigned_to = (select private.my_staff_id()))
    )
  );
create policy "director or check-out: create" on public.clean_jobs for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and ((select private.can('hk_assign')) or (select private.can('rooms')))
  );
create policy "director, or the assigned housekeeper: update" on public.clean_jobs for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and (
      (select private.can('hk_assign'))
      or ((select private.can('housekeeping')) and assigned_to = (select private.my_staff_id()))
    )
  )
  with check (
    facility_id = (select private.my_facility_id())
    and (
      (select private.can('hk_assign'))
      or ((select private.can('housekeeping')) and assigned_to = (select private.my_staff_id()))
    )
  );
create policy "director: remove" on public.clean_jobs for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('hk_assign')));

create policy "anyone who can see the clean: read" on public.clean_job_checks for select to authenticated
  using (exists (select 1 from public.clean_jobs j where j.id = clean_job_id));
create policy "cleaner: tick" on public.clean_job_checks for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('housekeeping'))
    and exists (
      select 1 from public.clean_jobs j
      where j.id = clean_job_id and j.status = 'in_progress'
        and ((select private.can('hk_assign')) or j.assigned_to = (select private.my_staff_id()))
    )
  );
create policy "cleaner: untick" on public.clean_job_checks for delete to authenticated
  using (
    (select private.can('housekeeping'))
    and exists (
      select 1 from public.clean_jobs j
      where j.id = clean_job_id and j.status = 'in_progress'
        and ((select private.can('hk_assign')) or j.assigned_to = (select private.my_staff_id()))
    )
  );

create policy "anyone who can see the clean: read" on public.clean_notes for select to authenticated
  using (exists (select 1 from public.clean_jobs j where j.id = clean_job_id));
create policy "housekeeping: add note" on public.clean_notes for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('housekeeping'))
    and created_by = (select private.my_staff_id())
    and exists (select 1 from public.clean_jobs j where j.id = clean_job_id)
  );

-- Dining ------------------------------------------------------------------------

create policy "staff: read" on public.menu_items for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "menus: add" on public.menu_items for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')));
create policy "menus: edit" on public.menu_items for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')))
  with check (facility_id = (select private.my_facility_id()));
create policy "menus: remove" on public.menu_items for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')));

create policy "staff: read" on public.menu_files for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "menus: upload" on public.menu_files for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')));
create policy "menus: replace" on public.menu_files for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')))
  with check (facility_id = (select private.my_facility_id()));
create policy "menus: remove" on public.menu_files for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_menus')));

create policy "order, kitchen, dining manager, residents: read" on public.meal_orders for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and (
      (select private.can('dining_order')) or (select private.can('dining_kitchen'))
      or (select private.can('dining_manager')) or (select private.can('residents'))
    )
  );
create policy "take order: place" on public.meal_orders for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('dining_order'))
    and placed_by = (select private.my_staff_id())
  );
create policy "kitchen or take order: move along" on public.meal_orders for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_kitchen')) or (select private.can('dining_order')))
  )
  with check (facility_id = (select private.my_facility_id()));

create policy "staff: read" on public.fridges for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "access: add" on public.fridges for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('access')));
create policy "access: edit" on public.fridges for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')))
  with check (facility_id = (select private.my_facility_id()));
create policy "access: remove" on public.fridges for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('access')));

create policy "temps or dining manager: read" on public.fridge_temp_logs for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_temps')) or (select private.can('dining_manager')))
  );
create policy "temps: log" on public.fridge_temp_logs for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('dining_temps'))
    and recorded_by = (select private.my_staff_id())
  );

create policy "staff: read" on public.kitchen_checklist_items for select to authenticated
  using (facility_id = (select private.my_facility_id()));
create policy "dining manager: add" on public.kitchen_checklist_items for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_manager')) or (select private.can('access')))
  );
create policy "dining manager: edit" on public.kitchen_checklist_items for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_manager')) or (select private.can('access')))
  )
  with check (facility_id = (select private.my_facility_id()));
create policy "dining manager: remove" on public.kitchen_checklist_items for delete to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_manager')) or (select private.can('access')))
  );

create policy "checklist or dining manager: read" on public.kitchen_checklist_completions for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_checklist')) or (select private.can('dining_manager')))
  );
create policy "checklist: tick" on public.kitchen_checklist_completions for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('dining_checklist'))
    and completed_by = (select private.my_staff_id())
  );
create policy "checklist: untick" on public.kitchen_checklist_completions for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_checklist')));

create policy "survey or dining manager: read" on public.meal_feedback for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('dining_survey')) or (select private.can('dining_manager')))
  );
create policy "survey: submit" on public.meal_feedback for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('dining_survey')));

create policy "dining manager: read" on public.supplies for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_manager')));
create policy "dining manager: add" on public.supplies for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('dining_manager')));
create policy "dining manager: count" on public.supplies for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_manager')))
  with check (facility_id = (select private.my_facility_id()));
create policy "dining manager: remove" on public.supplies for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('dining_manager')));

-- Maintenance -------------------------------------------------------------------

create policy "maintenance: read" on public.maintenance_requests for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('maintenance')));
create policy "maintenance: send" on public.maintenance_requests for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('maintenance'))
    and created_by = (select private.my_staff_id())
  );
create policy "crew: assign and update" on public.maintenance_requests for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('maintenance_crew')))
  with check (facility_id = (select private.my_facility_id()));

create policy "anyone who can see the request: read" on public.maintenance_photos for select to authenticated
  using (exists (select 1 from public.maintenance_requests r where r.id = request_id));
create policy "sender: attach" on public.maintenance_photos for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and exists (
      select 1 from public.maintenance_requests r
      where r.id = request_id and r.created_by = (select private.my_staff_id())
    )
  );

create policy "anyone who can see the request: read" on public.maintenance_updates for select to authenticated
  using (exists (select 1 from public.maintenance_requests r where r.id = request_id));
create policy "crew: post update" on public.maintenance_updates for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('maintenance_crew'))
    and created_by = (select private.my_staff_id())
  );

-- Calendar ----------------------------------------------------------------------

create policy "calendar: read" on public.events for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('calendar')));
create policy "activities or managers: add" on public.events for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and ((select private.can('attendance')) or (select private.can('pulse')))
  );
create policy "activities or managers: edit" on public.events for update to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('attendance')) or (select private.can('pulse')))
  )
  with check (facility_id = (select private.my_facility_id()));
create policy "activities or managers: remove" on public.events for delete to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('attendance')) or (select private.can('pulse')))
  );

create policy "calendar: read" on public.event_attendance for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('calendar')));
create policy "attendance: mark" on public.event_attendance for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('attendance')));
create policy "attendance: unmark" on public.event_attendance for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('attendance')));

create policy "calendar: read" on public.staffing_days for select to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('calendar')));
create policy "managers: set" on public.staffing_days for insert to authenticated
  with check (facility_id = (select private.my_facility_id()) and (select private.can('pulse')));
create policy "managers: change" on public.staffing_days for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('pulse')))
  with check (facility_id = (select private.my_facility_id()));

-- Alerts ------------------------------------------------------------------------

create policy "my job or my email: read" on public.alerts for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.my_role()) = any (to_roles) or (select private.my_email()) = any (to_emails))
  );
-- Actions across the app raise alerts (ready orders, notes, requests), so any signed-in staff can send one
-- within their building. The "Send a notice" composer is limited to notices_send in the app.
create policy "staff: send" on public.alerts for insert to authenticated
  with check (facility_id = (select private.my_facility_id()));

create policy "mine: read" on public.alert_reads for select to authenticated
  using (facility_id = (select private.my_facility_id()) and staff_id = (select private.my_staff_id()));
create policy "mine: mark read" on public.alert_reads for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and staff_id = (select private.my_staff_id())
    and exists (select 1 from public.alerts a where a.id = alert_id)
  );
create policy "mine: mark unread" on public.alert_reads for delete to authenticated
  using (facility_id = (select private.my_facility_id()) and staff_id = (select private.my_staff_id()));

-- Resident lens -----------------------------------------------------------------

create policy "residents or pulse: read" on public.room_feedback for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('residents')) or (select private.can('pulse')))
  );
create policy "residents: log" on public.room_feedback for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('residents'))
    and created_by = (select private.my_staff_id())
  );

create policy "residents or pulse: read" on public.visits for select to authenticated
  using (
    facility_id = (select private.my_facility_id())
    and ((select private.can('residents')) or (select private.can('pulse')))
  );
create policy "residents: plan" on public.visits for insert to authenticated
  with check (
    facility_id = (select private.my_facility_id())
    and (select private.can('residents'))
    and created_by = (select private.my_staff_id())
  );
create policy "residents: mark done" on public.visits for update to authenticated
  using (facility_id = (select private.my_facility_id()) and (select private.can('residents')))
  with check (facility_id = (select private.my_facility_id()));

-- Files: repair photos and menus -------------------------------------------------
-- Private buckets. Paths start with the facility id: "<facility_id>/<file>".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('maintenance-photos', 'maintenance-photos', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('menu-files', 'menu-files', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do nothing;

create policy "maintenance photos: read" on storage.objects for select to authenticated
  using (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
    and (select private.can('maintenance'))
  );
create policy "maintenance photos: upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
    and (select private.can('maintenance'))
  );

create policy "menu files: read" on storage.objects for select to authenticated
  using (
    bucket_id = 'menu-files'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
  );
create policy "menu files: upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu-files'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
    and (select private.can('dining_menus'))
  );
create policy "menu files: replace" on storage.objects for update to authenticated
  using (
    bucket_id = 'menu-files'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
    and (select private.can('dining_menus'))
  );
create policy "menu files: remove" on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu-files'
    and (storage.foldername(name))[1] = (select private.my_facility_id())::text
    and (select private.can('dining_menus'))
  );

-- Live updates (kitchen queue, director board, alert bell). Realtime applies the rules above per subscriber.
alter publication supabase_realtime add table
  public.meal_orders, public.clean_jobs, public.alerts, public.maintenance_requests;
