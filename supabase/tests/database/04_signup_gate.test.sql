-- Only work emails (or phones) on the staff list, with a job, can create an account.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into public.facilities (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'Test home one');
insert into public.staff_accounts (id, facility_id, email, phone, role) values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'ops@one.test', null, 'ops_manager'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'hk@one.test', null, 'housekeeper'),
  ('10000000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'new@one.test', null, null),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', null, '+15555550100', 'housekeeper');

select is(private.hook_before_user_created('{"user":{"email":"HK@One.test"}}'), '{}'::jsonb,
  'a listed work email may create an account (any capitalization)');
select is(private.hook_before_user_created('{"user":{"phone":"15555550100"}}'), '{}'::jsonb,
  'a listed phone number may create an account');
select is(private.hook_before_user_created('{"user":{"email":"stranger@nowhere.test"}}') -> 'error' ->> 'http_code', '403',
  'an email not on the staff list is refused');
select is(private.hook_before_user_created('{"user":{"email":"stranger@nowhere.test"}}') -> 'error' ->> 'message',
  'This email is not on the staff list. Ask your operations manager to add you.',
  'the refusal tells them who to ask');
select is(private.hook_before_user_created('{"user":{"email":"new@one.test"}}') -> 'error' ->> 'http_code', '403',
  'someone on the list without a job yet is refused');
select is(private.hook_before_user_created('{"user":{}}') -> 'error' ->> 'http_code', '403',
  'a sign-up with no email or phone is refused');
select ok(has_function_privilege('supabase_auth_admin', 'private.hook_before_user_created(jsonb)', 'execute'),
  'Supabase Auth can run the gate');
select ok(not has_function_privilege('authenticated', 'private.hook_before_user_created(jsonb)', 'execute'),
  'signed-in users cannot call the gate');
select ok(not has_function_privilege('anon', 'private.hook_before_user_created(jsonb)', 'execute'),
  'signed-out visitors cannot call the gate');

select * from finish();
rollback;
