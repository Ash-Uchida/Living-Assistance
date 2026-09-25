-- Fixes from the Supabase security and performance advisors.

-- Supabase's automatic-RLS event trigger function must not be callable through the Data API.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Covering indexes for the (facility_id, parent) foreign keys whose primary key starts with another column.
create index alert_reads_alert on public.alert_reads (facility_id, alert_id);
create index clean_job_checks_job on public.clean_job_checks (facility_id, clean_job_id);
create index event_attendance_event on public.event_attendance (facility_id, event_id);

-- "Seen" can be stamped once, by the server clock, by anyone allowed to update the request (the crew).
-- This lets mark_maintenance_seen run with the caller's own rights instead of elevated ones.
create or replace function private.maintenance_stamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_app_user() then
    new.created_at := old.created_at;
    new.seen_at := case when old.seen_at is null and new.seen_at is not null then now() else old.seen_at end;
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

create or replace function public.mark_maintenance_seen(p_request_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.maintenance_requests
  set seen_at = now()
  where id = p_request_id and seen_at is null
$$;
