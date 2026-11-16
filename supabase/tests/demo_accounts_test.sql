\set ON_ERROR_STOP 1
\i supabase/demo_accounts.sql
create temp table ids as select email, id from auth.users; grant select on ids to authenticated;
create or replace function pg_temp.as_email(e text) returns void language plpgsql as $$ begin reset role; perform set_config('request.jwt.claim.sub', (select id::text from ids where email=e), false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.check(cond boolean, label text) returns void language plpgsql as $$ begin if not cond then raise exception 'FAIL: %', label; end if; raise notice 'OK %', label; end $$;
select pg_temp.check((select count(*) = 8 from ids where email like '%@murshid.test'), 'demo: 8 accounts');
select pg_temp.check((select encrypted_password = extensions.crypt('Murshid@2026', encrypted_password) from auth.users where email = 'admin@murshid.test'), 'demo: password works');
set role anon;
select pg_temp.check((select count(*) = 1 from mentor_directory where slug = 'omar-khalid-demo'), 'demo: mentor published');
select pg_temp.as_email('mentee@murshid.test');
insert into mentorship_requests (mentee_id, mentor_id, package_id, goal) select auth.uid(), (select id from ids where email='mentor@murshid.test'), (select min(id) from mentorship_packages where mentor_id = (select id from ids where email='mentor@murshid.test')), 'I want to become a senior engineer soon';
select pg_temp.as_email('mentor@murshid.test');
select decide_request((select max(id) from mentorship_requests), true, 'Welcome');
insert into development_plans (mentorship_id, title) values ((select max(id) from mentorships), 'Plan');
insert into plan_tasks (plan_id, title) values ((select max(id) from development_plans), 'T1');
select pg_temp.as_email('mentee@murshid.test');
insert into task_submissions (task_id, author_id, body) values ((select max(id) from plan_tasks), auth.uid(), 'done');
select pg_temp.as_email('admin@murshid.test');
update mentorships set supervisor_id = (select id from ids where email='supervisor@murshid.test');
select pg_temp.as_email('supervisor@murshid.test');
insert into supervision_notes (mentorship_id, author_id, body) values ((select max(id) from mentorships), auth.uid(), 'note');
reset role; select set_config('request.jwt.claim.sub', '', false);
\i supabase/demo_accounts_remove.sql
select pg_temp.check((select count(*) = 0 from auth.users where email like '%@murshid.test') and not exists (select 1 from mentorships m join ids on ids.id in (m.mentee_id, m.mentor_id) and ids.email like '%@murshid.test') and (select count(*) from mentorships) = 1, 'demo: removal cleans demo data only');
