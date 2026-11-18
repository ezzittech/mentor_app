-- =====================================================================================
-- End-to-end JOURNEY SIMULATION (not a pass/fail gate — a product-health probe).
-- Walks one mentee through the whole life cycle using the same table writes / RPCs the app uses,
-- acting as each role with real Row Level Security. Output lines:
--   OK   = works as designed
--   GAP  = the database allows / lacks something the product needs to decide on
--   FAIL = something that should work does not (a bug)
-- Run via scripts/journey.sh (needs the demo accounts: supabase/demo_accounts.sql).
-- =====================================================================================
\set ON_ERROR_STOP 0
\i supabase/demo_accounts.sql

create temp table ids as select email, id from auth.users; grant select on ids to authenticated;
create or replace function pg_temp.uid(e text) returns uuid language sql as $$ select id from ids where email = e $$;
create or replace function pg_temp.as_email(e text) returns void language plpgsql as $$ begin reset role; perform set_config('request.jwt.claim.sub', (select id::text from ids where email = e), false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.root() returns void language plpgsql as $$ begin reset role; perform set_config('request.jwt.claim.sub', '', false); end $$;
create or replace function pg_temp.ok(label text, cond boolean) returns void language plpgsql as $$ begin raise notice '%  %', case when coalesce(cond, false) then 'OK  ' else 'FAIL' end, label; end $$;
create or replace function pg_temp.gap(label text, is_gap boolean, why text) returns void language plpgsql as $$ begin raise notice '%  % — %', case when coalesce(is_gap, true) then 'GAP ' else 'OK  ' end, label, why; end $$;
-- true when the statement ran without error AND touched at least one row
create or replace function pg_temp.can(q text) returns boolean language plpgsql as $$ declare n int; begin execute q; get diagnostics n = row_count; return n > 0; exception when others then return false; end $$;
create or replace function pg_temp.notes(e text, like_ text) returns int language sql security definer as $$ select count(*)::int from public.notifications where user_id = pg_temp.uid(e) and (title ilike like_ or link ilike like_) $$;

select '--- 1. Registration' as stage;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000f1', 'journey@murshid.test', '{"full_name":"Journey Mentee","timezone":"Asia/Kuala_Lumpur","locale":"en"}');
insert into ids select 'journey@murshid.test', '00000000-0000-0000-0000-0000000000f1';
select pg_temp.ok('signup creates profile + mentee role, keeps timezone', (select timezone = 'Asia/Kuala_Lumpur' and locale = 'en' from profiles where id = pg_temp.uid('journey@murshid.test')) and exists (select 1 from user_roles where user_id = pg_temp.uid('journey@murshid.test') and role = 'mentee'));

select '--- 2. Assessment' as stage;
select pg_temp.as_email('journey@murshid.test');
insert into assessment_submissions (mentee_id, template_id, answers, status) values (auth.uid(), 1, '{"1":0,"2":"Become senior"}', 'draft');
select pg_temp.ok('draft saved', exists (select 1 from assessment_submissions));
update assessment_submissions set status = 'submitted', submitted_at = now(), answers = '{"1":0,"2":"Become senior in 6 months"}';
select pg_temp.ok('submitted', (select status = 'submitted' from assessment_submissions));
select pg_temp.gap('a 2nd initial assessment can be created (duplicates)', pg_temp.can($$insert into assessment_submissions (mentee_id, template_id, answers) values (auth.uid(), 1, '{}')$$), 'no unique(mentee, kind) — app reads the newest only');

select '--- 3. Discovery & application' as stage;
select pg_temp.ok('directory visible to signed-in mentee', (select count(*) = 1 from mentor_directory));
select pg_temp.ok('mentor2 (draft) hidden', not exists (select 1 from mentor_directory where full_name like 'Lina%'));
insert into mentorship_requests (mentee_id, mentor_id, package_id, goal, background) values (auth.uid(), pg_temp.uid('mentor@murshid.test'), (select id from mentorship_packages where name = 'Standard'), 'I want to become a senior engineer within six months', 'React dev, 4 years');
select pg_temp.ok('application created', exists (select 1 from mentorship_requests));
select pg_temp.ok('mentor was notified', pg_temp.notes('mentor@murshid.test', '/app/mentor/applications') = 1);
select pg_temp.root();
update mentor_profiles set max_mentees = 0 where id = pg_temp.uid('mentor@murshid.test');
select pg_temp.as_email('mentee2@murshid.test');
select pg_temp.gap('apply to a FULL mentor (spots_left = 0) is accepted by the database', pg_temp.can($$insert into mentorship_requests (mentee_id, mentor_id, goal) values (auth.uid(), pg_temp.uid('mentor@murshid.test'), 'Please accept me even if you are full')$$), 'UI hides the button, DB does not enforce capacity (decide_request neither)');
select pg_temp.root();
delete from mentorship_requests where mentee_id = pg_temp.uid('mentee2@murshid.test');
update mentor_profiles set max_mentees = 5 where id = pg_temp.uid('mentor@murshid.test');

select '--- 4. Mentor decision' as stage;
select pg_temp.as_email('mentor@murshid.test');
select pg_temp.ok('mentor sees applicant assessment before accepting', (select count(*) >= 1 from assessment_submissions where mentee_id = pg_temp.uid('journey@murshid.test')));
update mentorship_requests set status = 'under_review' where status = 'submitted';
select pg_temp.ok('under_review', (select status = 'under_review' from mentorship_requests));
select decide_request((select id from mentorship_requests limit 1), true, 'Welcome Journey!') as mentorship_id \gset
select pg_temp.ok('mentorship created (pending_setup)', (select status = 'pending_setup' from mentorships where id = :mentorship_id));
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee notified of acceptance', pg_temp.notes('journey@murshid.test', '%accepted%') = 1);
select pg_temp.ok('welcome message delivered', exists (select 1 from messages where body = 'Welcome Journey!'));
select pg_temp.ok('order created with commission snapshot', (select amount = 180 and commission_amount = 27 and status = 'pending' from orders limit 1));
select pg_temp.gap('mentee has a way to PAY (instructions / checkout / receipt upload)', true, 'order is "pending" but nothing tells the mentee how to pay; admin must confirm manually');
select pg_temp.gap('mentorship can start without payment', (select status in ('pending_setup','active') from mentorships), 'no rule links payment status to activation — product decision needed (pay first? trial?)');

select '--- 5. Assessment review loop' as stage;
select pg_temp.as_email('mentor@murshid.test');
update assessment_submissions set status = 'needs_info', review_note = 'Please add your target role' where mentee_id = pg_temp.uid('journey@murshid.test') and id = (select max(id) from assessment_submissions where mentee_id = pg_temp.uid('journey@murshid.test'));
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee asked for more info', exists (select 1 from assessment_submissions where status = 'needs_info'));
select pg_temp.ok('mentee can resubmit after needs_info', pg_temp.can($$update assessment_submissions set status = 'submitted', answers = '{"1":0,"2":"Become senior; target: Staff Engineer"}' where status = 'needs_info'$$));
select pg_temp.as_email('mentor@murshid.test');
select pg_temp.ok('mentor marks reviewed', pg_temp.can($$update assessment_submissions set status = 'reviewed', review_note = 'Clear. Focus: system design' where status = 'submitted' and mentee_id = pg_temp.uid('journey@murshid.test')$$));

select '--- 6. Plan' as stage;
insert into development_plans (mentorship_id, title, summary) values (:mentorship_id, 'Path to Senior', 'Six month plan');
select id as plan_id from development_plans where mentorship_id = :mentorship_id \gset
insert into plan_goals (plan_id, title, baseline, target, success_criteria) values (:plan_id, 'System design', 'weak', '2 design reviews', '2 approved docs'), (:plan_id, 'Leadership', 'none', 'run 1 talk', 'talk delivered');
insert into plan_milestones (plan_id, goal_id, title, due_date) select :plan_id, id, 'Draft ready', current_date + 14 from plan_goals where plan_id = :plan_id limit 1;
insert into plan_tasks (plan_id, goal_id, title, kind, due_date) select :plan_id, id, 'Design doc', 'project', current_date + 7 from plan_goals where title = 'System design';
insert into plan_tasks (plan_id, goal_id, title, kind, due_date) select :plan_id, id, 'Give a talk', 'project', current_date + 30 from plan_goals where title = 'Leadership';
insert into learning_resources (plan_id, title, url, kind, provider) values (:plan_id, 'Frontend System Design', 'https://example.com/course', 'course', 'Udemy Business');
select pg_temp.ok('draft plan with goals/tasks/resources', (select count(*) = 2 from plan_tasks where plan_id = :plan_id));
update development_plans set title = 'Path to Senior Engineer' where id = :plan_id;
select pg_temp.ok('edit snapshots previous version (v2)', (select version = 2 from development_plans where id = :plan_id) and exists (select 1 from development_plan_versions where plan_id = :plan_id));
select pg_temp.gap('edits to goals/tasks after approval are versioned', true, 'only title/summary/dates are snapshotted; goal & task edits leave no history');
select set_plan_status(:plan_id, 'pending_approval');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee notified: plan ready', pg_temp.notes('journey@murshid.test', '%plan%') >= 1);
select set_plan_status(:plan_id, 'draft');
select pg_temp.as_email('mentor@murshid.test');
select pg_temp.ok('mentor notified of requested changes', pg_temp.notes('mentor@murshid.test', '/app/mentor/mentees/%') >= 1);
select set_plan_status(:plan_id, 'pending_approval');
select pg_temp.as_email('journey@murshid.test');
select set_plan_status(:plan_id, 'active');
select pg_temp.ok('approval activates plan and mentorship', (select status = 'active' from development_plans where id = :plan_id) and (select status = 'active' from mentorships where id = :mentorship_id));

select '--- 7. Tasks: submit → review → approve' as stage;
select id as t1 from plan_tasks where title = 'Design doc' \gset
select set_task_status(:t1, 'in_progress');
insert into task_submissions (task_id, author_id, body, link_url) values (:t1, auth.uid(), 'First draft', 'https://docs.example.com/1');
select pg_temp.ok('submission moves task to submitted + mentor notified', (select status = 'submitted' from plan_tasks where id = :t1) and pg_temp.notes('mentor@murshid.test', '/app/mentor/reviews') >= 1);
select pg_temp.gap('mentee can edit title/url of learning resources (not only tick "done")', pg_temp.can($$update learning_resources set title = 'hacked', url = 'https://evil.example' where plan_id = $$ || :plan_id), 'policy res_mentee_done allows every column');
select pg_temp.as_email('mentor@murshid.test');
insert into task_feedback (task_id, author_id, body, decision) values (:t1, auth.uid(), 'Add failure modes', 'changes_requested');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee sees changes_requested', (select status = 'changes_requested' from plan_tasks where id = :t1));
insert into task_submissions (task_id, author_id, body) values (:t1, auth.uid(), 'Second draft with failure modes');
select pg_temp.as_email('mentor@murshid.test');
insert into task_feedback (task_id, author_id, body, decision) values (:t1, auth.uid(), 'Great', 'approved');
select pg_temp.ok('approved → completed', (select status = 'completed' from plan_tasks where id = :t1));
select pg_temp.gap('mentor can DELETE a task that has submissions/feedback (history is cascaded away)', pg_temp.can($$delete from plan_tasks where id = $$ || :t1), 'plan requires history to be kept; consider soft-cancel only');
select pg_temp.gap('overdue / due-soon reminders are sent', (select count(*) = 0 from notifications where title ilike '%overdue%' or title ilike '%due%'), 'no scheduler (pg_cron / Edge Function) exists yet');

select '--- 8. Sessions' as stage;
select pg_temp.as_email('mentor@murshid.test');
insert into sessions (mentorship_id, title, starts_at, meeting_url) values (:mentorship_id, 'Kick-off', now() + interval '2 days', 'https://meet.google.com/abc'), (:mentorship_id, 'S2', now() + interval '3 days', null), (:mentorship_id, 'S3', now() + interval '4 days', null);
select pg_temp.ok('mentor schedules; participants copied from mentorship', (select count(*) = 3 and bool_and(mentee_id = pg_temp.uid('journey@murshid.test')) from sessions));
select pg_temp.gap('package quota (Standard = 2 calls/month) is enforced', (select count(*) > 2 from sessions where mentorship_id = :mentorship_id), '3 sessions scheduled in the same month');
select pg_temp.gap('two sessions can overlap for the same mentor', pg_temp.can($$insert into sessions (mentorship_id, title, starts_at) select mentorship_id, 'Overlap', starts_at from sessions limit 1$$), 'no overlap check');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee sees sessions + notified', (select count(*) >= 3 from sessions) and pg_temp.notes('journey@murshid.test', '/app/mentee/sessions') >= 3);
select pg_temp.gap('mentee can confirm / reschedule / cancel a session', not pg_temp.can($$update sessions set status = 'confirmed'$$), 'mentee has no update policy: only the mentor can change sessions');
select pg_temp.gap('session reminders (24h / 15 min before)', true, 'no scheduler; no calendar (.ics) invite');

select '--- 9. Messaging' as stage;
insert into messages (mentorship_id, sender_id, body) values (:mentorship_id, auth.uid(), 'Hi, quick question');
select pg_temp.as_email('mentor@murshid.test');
select pg_temp.ok('mentor reads mentee message', exists (select 1 from messages where body = 'Hi, quick question'));
select pg_temp.gap('mentor/mentee notified of new chat messages', (select count(*) = 0 from notifications where title ilike '%message%'), 'chat is realtime only while the page is open; no unread badge / email');

select '--- 10. Supervision' as stage;
select pg_temp.root();
select pg_temp.as_email('admin@murshid.test');
update mentorships set supervisor_id = pg_temp.uid('supervisor@murshid.test') where id = :mentorship_id;
select pg_temp.ok('supervisor notified', pg_temp.notes('supervisor@murshid.test', '/app/supervisor/mentees/%') = 1);
select pg_temp.gap('mentor and mentee are told a supervisor was assigned', pg_temp.notes('mentor@murshid.test', '%supervisor%') = 0 and pg_temp.notes('journey@murshid.test', '%supervisor%') = 0 and pg_temp.notes('journey@murshid.test', '%مشرف%') = 0, 'only the supervisor gets a notification');
select pg_temp.as_email('supervisor@murshid.test');
select pg_temp.ok('supervisor sees plan, not chat', (select count(*) = 1 from development_plans) and (select count(*) = 0 from messages));
insert into supervision_notes (mentorship_id, author_id, body, visibility) values (:mentorship_id, auth.uid(), 'Good pace', 'mentee');
insert into interventions (mentorship_id, author_id, kind, note) values (:mentorship_id, auth.uid(), 'reminder', 'Please submit the talk outline');
select pg_temp.gap('mentee/mentor are notified when a supervisor logs an intervention or reminder', (select count(*) = 0 from notifications where user_id in (pg_temp.uid('journey@murshid.test'), pg_temp.uid('mentor@murshid.test')) and title ilike '%remind%'), 'the "reminder" intervention only writes a row; nobody gets a notification');
select pg_temp.gap('supervisor can request a plan revision that actually changes plan status', true, '"plan_revision" is a log entry only');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee sees only the mentee-visible note', (select count(*) = 1 from supervision_notes));

select '--- 11. Payments' as stage;
select pg_temp.as_email('admin@murshid.test');
select admin_set_order_status((select id from orders where mentorship_id = :mentorship_id), 'paid');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.ok('mentee notified payment confirmed', pg_temp.notes('journey@murshid.test', '%Payment%') = 1);
select pg_temp.gap('a recurring monthly order is generated for month 2+', (select count(*) = 1 from orders where mentorship_id = :mentorship_id), 'only the first order exists; "monthly" packages are not billed again');
select pg_temp.gap('mentor payouts tracked (what the platform owes the mentor)', true, 'no payouts table; the earnings page is a calculation only');

select '--- 12. Closing the mentorship' as stage;
select pg_temp.as_email('journey@murshid.test');
select pg_temp.gap('mentee can end / cancel the mentorship themselves', not pg_temp.can($$update mentorships set status = 'cancelled'$$), 'only mentor/admin can change status');
select pg_temp.as_email('mentor@murshid.test');
select pg_temp.ok('mentor completes the mentorship (DB allows; UI has no button)', pg_temp.can($$update mentorships set status = 'completed' where id = $$ || :mentorship_id));
select pg_temp.gap('plan is closed automatically when the mentorship completes', (select status = 'active' from development_plans where id = :plan_id), 'plan stays "active" after completion');
select pg_temp.as_email('journey@murshid.test');
select pg_temp.gap('mentee can still submit work / chat after the mentorship is completed', pg_temp.can($$insert into messages (mentorship_id, sender_id, body) values ($$ || :mentorship_id || $$, auth.uid(), 'after end')$$), 'RLS checks party membership, not mentorship status (also true for paused / cancelled)');
select pg_temp.ok('mentee can review after completion', pg_temp.can($$insert into reviews (mentorship_id, mentee_id, mentor_id, rating, comment) values ($$ || :mentorship_id || $$, auth.uid(), pg_temp.uid('mentor@murshid.test'), 5, 'Excellent mentor, clear plan')$$));
select pg_temp.ok('second review for same mentorship blocked', not pg_temp.can($$insert into reviews (mentorship_id, mentee_id, mentor_id, rating, comment) values ($$ || :mentorship_id || $$, auth.uid(), pg_temp.uid('mentor@murshid.test'), 1, 'Trying to review twice here')$$));
select pg_temp.gap('final assessment / self-review / closing summary exist', true, 'assessment_templates supports kind=final but there is no UI or workflow');
select pg_temp.gap('mentor can answer or flag a review (abuse report)', true, 'no review_reports table / UI');

select '--- 13. Rejection path & suspension' as stage;
select pg_temp.as_email('mentee2@murshid.test');
insert into mentorship_requests (mentee_id, mentor_id, goal) values (auth.uid(), pg_temp.uid('mentor@murshid.test'), 'Looking for mentoring on career change');
select pg_temp.as_email('mentor@murshid.test');
select decide_request((select max(id) from mentorship_requests), false, 'Not a fit right now');
select pg_temp.as_email('mentee2@murshid.test');
select pg_temp.ok('rejection note visible, mentee can re-apply later', (select status = 'rejected' and decision_note is not null from mentorship_requests) and pg_temp.can($$insert into mentorship_requests (mentee_id, mentor_id, goal) values (auth.uid(), pg_temp.uid('mentor@murshid.test'), 'Re-applying with more details about my goal')$$));
select pg_temp.root();
update profiles set is_active = false where id = pg_temp.uid('mentee2@murshid.test');
select pg_temp.as_email('mentee2@murshid.test');
select pg_temp.gap('a suspended (is_active = false) user is actually locked out', exists (select 1 from profiles where id = auth.uid()), 'RLS ignores is_active; the user can still read and write');

select pg_temp.root();
select '--- done' as stage;
