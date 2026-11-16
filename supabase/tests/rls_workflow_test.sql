\set ON_ERROR_STOP 1
-- users (signup trigger creates profiles + roles)
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','admin@x.com','{"full_name":"Admin A"}'),
 ('00000000-0000-0000-0000-00000000000b','mentor@x.com','{"full_name":"Omar Mentor","intent":"mentor","locale":"en"}'),
 ('00000000-0000-0000-0000-00000000000c','mentee@x.com','{"full_name":"Sara Mentee"}'),
 ('00000000-0000-0000-0000-00000000000d','other@x.com','{"full_name":"Other Mentee"}'),
 ('00000000-0000-0000-0000-00000000000e','sup@x.com','{"full_name":"Huda Sup"}');
insert into user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a','admin'),('00000000-0000-0000-0000-00000000000e','supervisor');

create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin begin execute sql; exception when others then raise notice 'OK (blocked) %: %', label, sqlerrm; return; end; raise exception 'FAIL: % was allowed', label; end $$;
create or replace function pg_temp.expect_noop(sql text, label text) returns void language plpgsql as $$
declare n int; begin begin execute sql; get diagnostics n = row_count; exception when others then raise notice 'OK (blocked) %: %', label, sqlerrm; return; end;
if n > 0 then raise exception 'FAIL: % affected % rows', label, n; end if; raise notice 'OK (no rows) %', label; end $$;
create or replace function pg_temp.check(cond boolean, label text) returns void language plpgsql as $$ begin if not cond then raise exception 'FAIL: %', label; end if; raise notice 'OK %', label; end $$;

-- ===== mentor builds profile, cannot self-approve
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
update mentor_profiles set headline='Staff engineer', status='approved', featured=true, rating_avg=5 where id = auth.uid();
select pg_temp.check((select status='draft' and not featured and rating_avg=0 from mentor_profiles where id=auth.uid()), 'mentor cannot self-approve/feature');
select set_mentor_tags(array[1,2]::bigint[], array['React','Brand New Skill']);
insert into mentorship_packages (mentor_id, name, price) values (auth.uid(), 'Standard', 200);
update mentor_profiles set status='pending' where id = auth.uid();
select pg_temp.check((select status='pending' from mentor_profiles where id=auth.uid()), 'mentor can submit for review');
select pg_temp.expect_fail($$select admin_set_role(auth.uid(), 'admin', true)$$, 'mentor self-grant admin');
select pg_temp.expect_fail($$insert into user_roles values (auth.uid(),'admin')$$, 'direct insert user_roles');
reset role;

-- ===== anon cannot see unpublished mentor
set role anon; select set_config('request.jwt.claim.sub','',false);
select pg_temp.check((select count(*)=0 from mentor_directory), 'anon: pending mentor hidden');
reset role;

-- ===== admin approves
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select admin_decide_mentor('00000000-0000-0000-0000-00000000000b','approved', true);
reset role;
set role anon;
select pg_temp.check((select count(*)=1 and (select jsonb_array_length(packages) from mentor_directory)=1 from mentor_directory), 'anon: approved mentor visible with plan');
select pg_temp.check((select skills ? 'Brand New Skill' from mentor_directory), 'skills aggregated');
select pg_temp.check((select count(*)=0 from profiles), 'anon reads no profiles/emails');
reset role;

-- ===== mentee applies
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into assessment_submissions (mentee_id, template_id, answers, status) values (auth.uid(), 1, '{"1":0}', 'submitted');
insert into mentorship_requests (mentee_id, mentor_id, package_id, goal) values (auth.uid(), '00000000-0000-0000-0000-00000000000b', 1, 'I want to become a senior engineer in 6 months');
select pg_temp.expect_fail($$insert into mentorship_requests (mentee_id, mentor_id, package_id, goal) values (auth.uid(), '00000000-0000-0000-0000-00000000000b', 1, 'duplicate application here')$$, 'duplicate open application');
select pg_temp.expect_fail($$update mentorship_requests set status='accepted' where id=1$$, 'mentee self-accept');
select pg_temp.expect_fail($$select decide_request(1, true, 'x')$$, 'mentee calls decide_request');
reset role;

-- ===== other mentee cannot see it
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*)=0 from mentorship_requests), 'other mentee sees no requests');
select pg_temp.check((select count(*)=0 from assessment_submissions), 'other mentee sees no assessments');
select pg_temp.check((select count(*)=1 from profiles), 'other mentee sees only own profile');
reset role;

-- ===== mentor sees applicant assessment, accepts
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*)=1 from assessment_submissions), 'mentor sees applicant assessment');
select pg_temp.check((select full_name='Sara Mentee' from profiles where id='00000000-0000-0000-0000-00000000000c'), 'mentor sees applicant name');
select decide_request(1, true, 'Welcome!');
select pg_temp.check((select count(*)=1 from mentorships), 'mentorship created');
select pg_temp.check((select count(*)=1 and min(commission_amount)=30 from orders), 'pending order with 15% commission');
insert into development_plans (mentorship_id, title) values (1, 'Path to senior');
select pg_temp.check((select status='draft' and mentee_id='00000000-0000-0000-0000-00000000000c' from development_plans), 'plan ids copied, draft');
insert into plan_goals (plan_id, title) values (1, 'System design');
insert into plan_tasks (plan_id, goal_id, title) values (1, 1, 'Design doc');
select pg_temp.expect_fail($$update development_plans set status='active' where id=1$$, 'mentor sets plan status directly');
select set_plan_status(1, 'pending_approval');
select pg_temp.expect_fail($$select set_plan_status(1, 'active')$$, 'mentor approves own plan');
update mentorship_requests set status = status where false;
update mentorships set supervisor_id='00000000-0000-0000-0000-00000000000b' where id=1;
select pg_temp.check((select supervisor_id is null from mentorships where id=1), 'mentor cannot assign supervisor');
reset role;

-- ===== mentee approves plan, works on task
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select set_plan_status(1, 'active');
select pg_temp.check((select status='active' from mentorships where id=1), 'plan approval activates mentorship');
select pg_temp.expect_noop($$update plan_tasks set status='completed' where id=1$$, 'mentee completes own task directly');
select pg_temp.expect_fail($$select set_task_status(1, 'completed')$$, 'mentee completes via rpc');
select set_task_status(1, 'in_progress');
insert into task_submissions (task_id, author_id, body) values (1, auth.uid(), 'Here is my doc');
select pg_temp.check((select status='submitted' from plan_tasks where id=1), 'submission sets submitted');
select pg_temp.expect_fail($$insert into task_feedback (task_id, author_id, body, decision) values (1, auth.uid(), 'self approve', 'approved')$$, 'mentee approves own task');
select pg_temp.expect_noop($$update orders set status='paid'$$, 'mentee marks order paid');
insert into messages (mentorship_id, sender_id, body) values (1, auth.uid(), 'hello');
select pg_temp.expect_fail($$insert into reviews (mentorship_id, mentee_id, mentor_id, rating, comment) values (1, '00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-00000000000b', 5, 'fake review text')$$, 'review as someone else');
insert into reviews (mentorship_id, mentee_id, mentor_id, rating, comment) values (1, auth.uid(), '00000000-0000-0000-0000-00000000000b', 5, 'Great mentor, very helpful');
reset role;
select pg_temp.check((select rating_avg=5 and reviews_count=1 from mentor_profiles where id='00000000-0000-0000-0000-00000000000b'), 'rating aggregated');

-- ===== mentor approves task; messages read
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into task_feedback (task_id, author_id, body, decision) values (1, auth.uid(), 'Great', 'approved');
select pg_temp.check((select status='completed' from plan_tasks where id=1), 'approval completes task');
update messages set read_at = now(), body='hacked' where mentorship_id=1;
select pg_temp.check((select count(*)=1 from messages where body='hello' and read_at is not null) and (select count(*)=0 from messages where body='hacked') and (select read_at is null from messages where body='Welcome!'), 'recipient sets read_at only; bodies immutable');
reset role;

-- ===== admin assigns supervisor; supervisor sees plan but not chat
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update mentorships set supervisor_id='00000000-0000-0000-0000-00000000000e' where id=1;
select admin_set_order_status(1, 'paid');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*)=1 from development_plans), 'supervisor sees plan');
select pg_temp.check((select count(*)=0 from messages), 'supervisor cannot read private chat');
insert into supervision_notes (mentorship_id, author_id, body, visibility) values (1, auth.uid(), 'private one', 'private'), (1, auth.uid(), 'staff one', 'staff'), (1, auth.uid(), 'for mentee', 'mentee');
insert into interventions (mentorship_id, author_id, kind, note) values (1, auth.uid(), 'reminder', 'ping');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*)=1 from supervision_notes), 'mentee sees only mentee-visible note');
select pg_temp.check((select count(*)=0 from interventions), 'mentee cannot see interventions');
select pg_temp.check((select count(*)>=3 from notifications), 'mentee received notifications');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*)=2 from supervision_notes), 'mentor sees staff+mentee notes, not private');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*)=0 from development_plans) and (select count(*)=0 from plan_tasks) and (select count(*)=0 from orders) and (select count(*)=0 from messages), 'outsider sees nothing');
select pg_temp.check((select count(*)=1 from public_reviews), 'public reviews visible');
select pg_temp.check((select count(*)=0 from audit_logs), 'outsider reads no audit');
reset role;
select pg_temp.check((select count(*)>=5 from audit_logs), 'audit trail written');
select action from audit_logs order by id;
