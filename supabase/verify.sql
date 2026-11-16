-- Health check: run in Supabase → SQL Editor. Every row should say ✅.
with checks(item, ok) as (
  values
  ('tables (31)', (select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name in (
     'profiles','user_roles','system_settings','audit_logs','notifications','categories','skills','mentor_profiles','mentor_categories','mentor_skills',
     'mentorship_packages','mentorship_requests','mentorships','assessment_templates','assessment_questions','assessment_submissions','development_plans',
     'development_plan_versions','plan_goals','plan_milestones','plan_tasks','task_submissions','task_feedback','learning_resources','sessions','messages',
     'supervision_notes','interventions','reviews','orders','support_tickets')) = 31),
  ('views (3)', (select count(*) from information_schema.views where table_schema='public' and table_name in ('mentor_directory','mentor_admin_view','public_reviews')) = 3),
  ('RLS on all tables', not exists (select 1 from pg_tables where schemaname='public' and not rowsecurity)),
  ('task_status values', (select array_agg(enumlabel::text order by enumsortorder) from pg_enum where enumtypid='public.task_status'::regtype)
       @> array['not_started','in_progress','submitted','changes_requested','completed','cancelled']),
  ('plan_status values', (select array_agg(enumlabel::text) from pg_enum where enumtypid='public.plan_status'::regtype)
       @> array['draft','pending_approval','active','on_hold','completed','cancelled']),
  ('app_role values', (select array_agg(enumlabel::text) from pg_enum where enumtypid='public.app_role'::regtype)
       @> array['mentee','mentor','supervisor','program_manager','admin','support']),
  ('key columns', (select count(*) from information_schema.columns where table_schema='public' and (table_name, column_name) in (
     ('profiles','timezone'),('profiles','locale'),('mentor_profiles','slug'),('mentor_profiles','max_mentees'),('plan_tasks','kind'),
     ('sessions','meeting_url'),('orders','commission_amount'),('messages','read_at'),('supervision_notes','visibility'))) = 9),
  ('RPC functions (8)', (select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in (
     'decide_request','set_plan_status','set_task_status','admin_set_role','admin_decide_mentor','admin_set_order_status','set_mentor_tags','apply_as_mentor')) = 8),
  ('signup trigger', exists (select 1 from pg_trigger where tgname='on_auth_user_created')),
  ('seed: categories', (select count(*) from public.categories) >= 8),
  ('seed: assessment questions', (select count(*) from public.assessment_questions) >= 9),
  ('seed: settings', (select count(*) from public.system_settings) >= 6),
  ('realtime: messages', exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='messages'))
)
select case when ok then '✅' else '❌' end as status, item from checks;
