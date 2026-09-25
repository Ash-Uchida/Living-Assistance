-- Removing a whole facility cascades to its fridge log. That is the only way a reading can disappear.
create or replace function private.append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and not exists (select 1 from public.facilities f where f.id = old.facility_id) then
    return old;
  end if;
  raise exception 'Temperature logs cannot be changed or deleted. Log a new reading instead.'
    using errcode = 'insufficient_privilege';
end;
$$;
