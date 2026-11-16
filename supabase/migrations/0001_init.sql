-- =====================================================================================
-- Murshid — mentorship & development platform : initial schema
-- Supabase → SQL Editor → New query → paste this whole file → Run   (or `supabase db push`)
--
-- Security model
--   * The browser uses only the public anon/publishable key.
--   * Row Level Security is ON for every table; policies below are the real access control.
--   * Sensitive state changes (accepting requests, plan/task status, payments, roles,
--     mentor approval) go through SECURITY DEFINER functions that check the caller.
--   * Roles live in public.user_roles and can never be self-granted (except "mentor",
--     whose public profile still needs admin approval before it is published).
-- =====================================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------- enums
do $$ begin create type public.app_role as enum ('mentee','mentor','supervisor','program_manager','admin','support'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mentor_status as enum ('draft','pending','approved','rejected','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.request_status as enum ('submitted','under_review','accepted','rejected','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mentorship_status as enum ('pending_setup','active','paused','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.assessment_status as enum ('draft','submitted','needs_info','reviewed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.plan_status as enum ('draft','pending_approval','active','on_hold','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.goal_status as enum ('not_started','in_progress','achieved','partially_achieved','not_achieved','dropped'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('not_started','in_progress','submitted','changes_requested','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_kind as enum ('exercise','project','review','session','resource'); exception when duplicate_object then null; end $$;
do $$ begin create type public.session_status as enum ('scheduled','confirmed','completed','cancelled','no_show','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending','paid','failed','refunded','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.note_visibility as enum ('private','staff','mentee'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- identity
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       citext not null default '',
  avatar_url  text,
  headline    text,
  country     text,
  timezone    text not null default 'UTC',          -- IANA zone, e.g. Asia/Kuala_Lumpur
  locale      text not null default 'ar' check (locale in ('ar','en')),
  bio         text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------------- helpers (security definer → no RLS recursion)
create or replace function public.has_role(r public.app_role) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r) $$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') $$;

create or replace function public.is_backoffice() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','support')) $$;

-- ---------------------------------------------------------------- settings, audit, notifications
create table if not exists public.system_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  data       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_data jsonb default null) returns void
  language sql security definer set search_path = public as
$$ insert into public.audit_logs (actor_id, action, entity, entity_id, data) values (auth.uid(), p_action, p_entity, p_entity_id, p_data) $$;

-- Picks the recipient's language.
create or replace function public.notify(p_user uuid, p_en text, p_ar text, p_body text default null, p_link text default null) returns void
  language plpgsql security definer set search_path = public as
$$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, title, body, link)
  select p_user, case when coalesce(p.locale,'ar') = 'en' then p_en else p_ar end, p_body, p_link
  from public.profiles p where p.id = p_user;
end $$;

create or replace function public.setting_num(p_key text, p_default numeric) returns numeric
  language sql stable security definer set search_path = public as
$$ select coalesce((select (value #>> '{}')::numeric from public.system_settings where key = p_key), p_default) $$;

-- ---------------------------------------------------------------- taxonomy
create table if not exists public.categories (
  id      bigint generated always as identity primary key,
  slug    text not null unique,
  name_en text not null,
  name_ar text not null,
  icon    text,
  color   text default 'indigo',
  sort    int not null default 0
);
create table if not exists public.skills (
  id          bigint generated always as identity primary key,
  name        citext not null unique,
  category_id bigint references public.categories (id) on delete set null
);

-- ---------------------------------------------------------------- mentors
create table if not exists public.mentor_profiles (
  id               uuid primary key references public.profiles (id) on delete cascade,
  slug             text not null unique check (slug ~ '^[a-z0-9\-]+$'),
  full_name        text not null default '',          -- public display name
  avatar_url       text,
  headline         text not null default '',
  bio              text not null default '',
  job_title        text,
  company          text,
  years_experience int not null default 0 check (years_experience between 0 and 70),
  country          text,
  timezone         text not null default 'UTC',
  languages        text[] not null default '{ar,en}',
  status           public.mentor_status not null default 'draft',
  is_published     boolean not null default false,
  featured         boolean not null default false,
  accepting        boolean not null default true,
  max_mentees      int not null default 5 check (max_mentees between 0 and 100),
  rating_avg       numeric(3,2) not null default 0,
  reviews_count    int not null default 0,
  mentees_count    int not null default 0,
  response_hours   int not null default 24,
  linkedin_url     text,
  video_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists mentor_profiles_public_idx on public.mentor_profiles (status, is_published);

create table if not exists public.mentor_categories (
  mentor_id   uuid not null references public.mentor_profiles (id) on delete cascade,
  category_id bigint not null references public.categories (id) on delete cascade,
  primary key (mentor_id, category_id)
);
create table if not exists public.mentor_skills (
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  skill_id  bigint not null references public.skills (id) on delete cascade,
  primary key (mentor_id, skill_id)
);

create table if not exists public.mentorship_packages (
  id              bigint generated always as identity primary key,
  mentor_id       uuid not null references public.mentor_profiles (id) on delete cascade,
  name            text not null,
  description     text,
  price           numeric(12,2) not null check (price >= 0),
  currency        text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  billing         text not null default 'monthly' check (billing in ('monthly','one_off')),
  calls_per_month int not null default 1 check (calls_per_month >= 0),
  call_minutes    int not null default 45 check (call_minutes between 15 and 240),
  chat_support    boolean not null default true,
  response_hours  int not null default 24,
  features        text[] not null default '{}',
  trial_days      int not null default 0 check (trial_days between 0 and 30),
  is_active       boolean not null default true,
  sort            int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists packages_mentor_idx on public.mentorship_packages (mentor_id);

-- ---------------------------------------------------------------- requests & mentorships
create table if not exists public.mentorship_requests (
  id            bigint generated always as identity primary key,
  mentee_id     uuid not null references public.profiles (id) on delete cascade,
  mentor_id     uuid not null references public.mentor_profiles (id) on delete cascade,
  package_id    bigint references public.mentorship_packages (id),
  goal          text not null check (char_length(goal) between 10 and 4000),
  background    text,
  expectations  text,
  status        public.request_status not null default 'submitted',
  decision_note text,
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  check (mentee_id <> mentor_id)
);
-- one open application per mentee/mentor pair
create unique index if not exists one_open_request on public.mentorship_requests (mentee_id, mentor_id) where status in ('submitted','under_review');
create index if not exists requests_mentor_idx on public.mentorship_requests (mentor_id, status);

create table if not exists public.mentorships (
  id               bigint generated always as identity primary key,
  request_id       bigint unique references public.mentorship_requests (id),
  mentee_id        uuid not null references public.profiles (id) on delete cascade,
  mentor_id        uuid not null references public.profiles (id) on delete cascade,
  supervisor_id    uuid references public.profiles (id) on delete set null,
  package_id       bigint references public.mentorship_packages (id),
  status           public.mentorship_status not null default 'pending_setup',
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  last_activity_at timestamptz default now()
);
create index if not exists mentorships_mentee_idx on public.mentorships (mentee_id);
create index if not exists mentorships_mentor_idx on public.mentorships (mentor_id);
create index if not exists mentorships_supervisor_idx on public.mentorships (supervisor_id);

create or replace function public.is_ms_party(p_ms bigint) returns boolean
  language sql stable security definer set search_path = public as
$$ select public.is_backoffice() or exists (select 1 from public.mentorships m where m.id = p_ms and auth.uid() in (m.mentee_id, m.mentor_id, m.supervisor_id)) $$;
create or replace function public.is_ms_staff(p_ms bigint) returns boolean
  language sql stable security definer set search_path = public as
$$ select public.is_admin() or exists (select 1 from public.mentorships m where m.id = p_ms and auth.uid() in (m.mentor_id, m.supervisor_id)) $$;
create or replace function public.is_ms_mentor(p_ms bigint) returns boolean
  language sql stable security definer set search_path = public as
$$ select public.is_admin() or exists (select 1 from public.mentorships m where m.id = p_ms and m.mentor_id = auth.uid()) $$;
create or replace function public.is_ms_supervisor(p_ms bigint) returns boolean
  language sql stable security definer set search_path = public as
$$ select public.is_admin() or exists (select 1 from public.mentorships m where m.id = p_ms and m.supervisor_id = auth.uid()) $$;
-- private chat: mentee + mentor only (supervisors only if the admin enables it)
create or replace function public.is_ms_chat(p_ms bigint) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.mentorships m where m.id = p_ms and (auth.uid() in (m.mentee_id, m.mentor_id)
     or (m.supervisor_id = auth.uid() and coalesce((select (value #>> '{}')::boolean from public.system_settings where key = 'supervisor_can_read_messages'), false)))) $$;
-- can the caller see basic profile info (name/headline) of another user?
create or replace function public.can_view_profile(p_user uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select p_user = auth.uid() or public.is_backoffice()
     or exists (select 1 from public.mentorships m where (m.mentee_id = p_user or m.mentor_id = p_user or m.supervisor_id = p_user) and auth.uid() in (m.mentee_id, m.mentor_id, m.supervisor_id))
     or exists (select 1 from public.mentorship_requests r where (r.mentee_id = p_user and r.mentor_id = auth.uid()) or (r.mentor_id = p_user and r.mentee_id = auth.uid())) $$;
create or replace function public.mentor_active_count(p_mentor uuid) returns int
  language sql stable security definer set search_path = public as
$$ select count(*)::int from public.mentorships where mentor_id = p_mentor and status in ('pending_setup','active') $$;

-- ---------------------------------------------------------------- assessment
create table if not exists public.assessment_templates (
  id        bigint generated always as identity primary key,
  title     text not null,
  kind      text not null default 'initial' check (kind in ('initial','final')),
  is_active boolean not null default true
);
create table if not exists public.assessment_questions (
  id          bigint generated always as identity primary key,
  template_id bigint not null references public.assessment_templates (id) on delete cascade,
  section     text not null default 'general',
  kind        text not null check (kind in ('short','long','single','multi','scale','date')),
  prompt_en   text not null,
  prompt_ar   text not null,
  options     jsonb,                    -- [{ "en": "...", "ar": "..." }]
  required    boolean not null default false,
  sort        int not null default 0
);
create table if not exists public.assessment_submissions (
  id           bigint generated always as identity primary key,
  mentee_id    uuid not null references public.profiles (id) on delete cascade,
  template_id  bigint not null references public.assessment_templates (id),
  kind         text not null default 'initial' check (kind in ('initial','final')),
  status       public.assessment_status not null default 'draft',
  answers      jsonb not null default '{}',
  submitted_at timestamptz,
  review_note  text,
  reviewed_by  uuid references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists assessment_mentee_idx on public.assessment_submissions (mentee_id);

-- ---------------------------------------------------------------- development plans
create table if not exists public.development_plans (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null references public.mentorships (id) on delete cascade,
  mentee_id     uuid not null references public.profiles (id),
  mentor_id     uuid not null references public.profiles (id),
  title         text not null,
  summary       text,
  status        public.plan_status not null default 'draft',
  start_date    date,
  target_date   date,
  approved_at   timestamptz,
  version       int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists plans_ms_idx on public.development_plans (mentorship_id);

create table if not exists public.development_plan_versions (
  id         bigint generated always as identity primary key,
  plan_id    bigint not null references public.development_plans (id) on delete cascade,
  version    int not null,
  snapshot   jsonb not null,
  changed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.plan_goals (
  id               bigint generated always as identity primary key,
  plan_id          bigint not null references public.development_plans (id) on delete cascade,
  title            text not null,
  description      text,
  rationale        text,
  baseline         text,
  target           text,
  success_criteria text,
  priority         text not null default 'medium' check (priority in ('low','medium','high')),
  status           public.goal_status not null default 'not_started',
  due_date         date,
  sort             int not null default 0,
  created_at       timestamptz not null default now()
);
create table if not exists public.plan_milestones (
  id       bigint generated always as identity primary key,
  plan_id  bigint not null references public.development_plans (id) on delete cascade,
  goal_id  bigint references public.plan_goals (id) on delete set null,
  title    text not null,
  due_date date,
  done     boolean not null default false
);
create table if not exists public.plan_tasks (
  id           bigint generated always as identity primary key,
  plan_id      bigint not null references public.development_plans (id) on delete cascade,
  goal_id      bigint references public.plan_goals (id) on delete set null,
  title        text not null,
  description  text,
  kind         public.task_kind not null default 'exercise',
  status       public.task_status not null default 'not_started',
  due_date     date,
  resource_url text,
  created_by   uuid references public.profiles (id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists tasks_plan_idx on public.plan_tasks (plan_id, status);
create table if not exists public.task_submissions (
  id         bigint generated always as identity primary key,
  task_id    bigint not null references public.plan_tasks (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null check (char_length(body) between 1 and 10000),
  link_url   text,
  file_path  text,
  created_at timestamptz not null default now()
);
create table if not exists public.task_feedback (
  id         bigint generated always as identity primary key,
  task_id    bigint not null references public.plan_tasks (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null check (char_length(body) between 1 and 10000),
  decision   text not null default 'comment' check (decision in ('approved','changes_requested','comment')),
  created_at timestamptz not null default now()
);
create table if not exists public.learning_resources (
  id         bigint generated always as identity primary key,
  plan_id    bigint not null references public.development_plans (id) on delete cascade,
  goal_id    bigint references public.plan_goals (id) on delete set null,
  title      text not null,
  url        text not null,
  kind       text not null default 'article' check (kind in ('article','video','course','book','tool')),
  provider   text,                                -- e.g. 'Udemy Business' (manual link for now)
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.plan_ms(p_plan bigint) returns bigint
  language sql stable security definer set search_path = public as
$$ select mentorship_id from public.development_plans where id = p_plan $$;
create or replace function public.task_plan(p_task bigint) returns bigint
  language sql stable security definer set search_path = public as
$$ select plan_id from public.plan_tasks where id = p_task $$;

-- ---------------------------------------------------------------- sessions, messages, supervision
create table if not exists public.sessions (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null references public.mentorships (id) on delete cascade,
  mentee_id     uuid not null references public.profiles (id),
  mentor_id     uuid not null references public.profiles (id),
  goal_id       bigint references public.plan_goals (id) on delete set null,
  title         text not null,
  starts_at     timestamptz not null,           -- stored in UTC
  duration_min  int not null default 45 check (duration_min between 15 and 480),
  timezone      text not null default 'UTC',    -- organiser's IANA zone, for display
  status        public.session_status not null default 'scheduled',
  meeting_url   text,
  agenda        text,
  shared_notes  text,
  created_at    timestamptz not null default now()
);
create index if not exists sessions_ms_idx on public.sessions (mentorship_id, starts_at);

create table if not exists public.messages (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null references public.mentorships (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id),
  body          text not null check (char_length(body) between 1 and 5000),
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index if not exists messages_ms_idx on public.messages (mentorship_id, created_at);

create table if not exists public.supervision_notes (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null references public.mentorships (id) on delete cascade,
  author_id     uuid not null references public.profiles (id),
  body          text not null,
  visibility    public.note_visibility not null default 'staff',
  created_at    timestamptz not null default now()
);
create table if not exists public.interventions (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null references public.mentorships (id) on delete cascade,
  author_id     uuid not null references public.profiles (id),
  kind          text not null check (kind in ('reminder','reschedule','plan_revision','escalation','check_in')),
  note          text not null,
  status        text not null default 'open' check (status in ('open','resolved')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- reviews & payments
create table if not exists public.reviews (
  id            bigint generated always as identity primary key,
  mentorship_id bigint not null unique references public.mentorships (id) on delete cascade,
  mentee_id     uuid not null references public.profiles (id),
  mentor_id     uuid not null references public.profiles (id),
  rating        int not null check (rating between 1 and 5),
  comment       text not null check (char_length(comment) between 10 and 3000),
  is_public     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.orders (
  id                bigint generated always as identity (start with 1001) primary key,
  mentee_id         uuid not null references public.profiles (id),
  mentor_id         uuid not null references public.profiles (id),
  package_id        bigint references public.mentorship_packages (id),
  mentorship_id     bigint references public.mentorships (id),
  amount            numeric(12,2) not null check (amount >= 0),
  currency          text not null default 'USD',
  commission_rate   numeric(5,4) not null,
  commission_amount numeric(12,2) not null,
  status            public.payment_status not null default 'pending',
  provider          text default 'manual',
  provider_ref      text unique,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

create table if not exists public.support_tickets (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  subject    text not null,
  body       text not null,
  status     text not null default 'open' check (status in ('open','pending','closed')),
  created_at timestamptz not null default now()
);

-- =====================================================================================
-- Triggers
-- =====================================================================================

-- New sign-up → profile + mentee role (+ mentor role & draft profile when they chose "I want to mentor").
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare v_name text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, full_name, email, timezone, locale)
  values (new.id, v_name, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC'),
          case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'mentee') on conflict do nothing;
  if new.raw_user_meta_data ->> 'intent' = 'mentor' then
    insert into public.user_roles (user_id, role) values (new.id, 'mentor') on conflict do nothing;
    insert into public.mentor_profiles (id, slug, full_name)
    values (new.id, trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6), v_name)
    on conflict (id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;

-- profiles: users edit their own profile but never is_active / email
create or replace function public.guard_profile() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile();

-- mentor_profiles: mentors can't approve/feature themselves or edit counters
create or replace function public.guard_mentor_profile() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is not null and not public.is_admin() and coalesce(current_setting('app.rpc', true), '') <> 'on' then
    if tg_op = 'INSERT' then
      new.status := 'draft'; new.is_published := false; new.featured := false;
      new.rating_avg := 0; new.reviews_count := 0; new.mentees_count := 0;
    else
      new.featured := old.featured; new.rating_avg := old.rating_avg;
      new.reviews_count := old.reviews_count; new.mentees_count := old.mentees_count;
      new.is_published := old.is_published;
      -- only draft/rejected → pending (submit for review) is allowed
      if new.status is distinct from old.status and not (old.status in ('draft','rejected') and new.status = 'pending') then
        new.status := old.status;
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists mentor_profiles_guard on public.mentor_profiles;
create trigger mentor_profiles_guard before insert or update on public.mentor_profiles for each row execute function public.guard_mentor_profile();

create or replace function public.mentor_submitted() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if new.status = 'pending' and old.status is distinct from 'pending' then
    perform public.audit('mentor.submitted', 'mentor_profiles', new.id::text);
    perform public.notify(u.user_id, 'New mentor application', 'طلب مرشد جديد', new.full_name, '/app/admin/mentors')
      from public.user_roles u where u.role = 'admin';
  end if;
  return new;
end $$;
drop trigger if exists mentor_profiles_submitted on public.mentor_profiles;
create trigger mentor_profiles_submitted after update on public.mentor_profiles for each row execute function public.mentor_submitted();

-- requests: mentee may only cancel; mentor may only move submitted → under_review. Decisions use decide_request().
create or replace function public.guard_request() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if tg_op = 'INSERT' then
    new.status := 'submitted'; new.decision_note := null; new.decided_at := null;
    if not exists (select 1 from public.mentor_profiles m where m.id = new.mentor_id and m.status = 'approved' and m.is_published and m.accepting) then
      raise exception 'This mentor is not accepting applications';
    end if;
    if new.package_id is not null and not exists (select 1 from public.mentorship_packages p where p.id = new.package_id and p.mentor_id = new.mentor_id and p.is_active) then
      raise exception 'Invalid plan';
    end if;
    perform public.notify(new.mentor_id, 'New mentorship application', 'طلب إرشاد جديد', left(new.goal, 140), '/app/mentor/applications');
    return new;
  end if;
  if current_setting('app.rpc', true) = 'on' or public.is_admin() then return new; end if;
  if auth.uid() = old.mentee_id and new.status = 'cancelled' and old.status in ('submitted','under_review') then
    old.status := 'cancelled'; return old;
  end if;
  if auth.uid() = old.mentor_id and new.status = 'under_review' and old.status = 'submitted' then
    old.status := 'under_review'; return old;
  end if;
  raise exception 'Not allowed';
end $$;
drop trigger if exists requests_guard on public.mentorship_requests;
create trigger requests_guard before insert or update on public.mentorship_requests for each row execute function public.guard_request();

-- mentorships: mentor can change status only; supervisor assignment is admin-only
create or replace function public.guard_mentorship() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if current_setting('app.rpc', true) = 'on' or public.is_admin() then
    if new.supervisor_id is distinct from old.supervisor_id and new.supervisor_id is not null then
      perform public.audit('mentorship.supervisor_assigned', 'mentorships', new.id::text, jsonb_build_object('supervisor_id', new.supervisor_id));
      perform public.notify(new.supervisor_id, 'New mentee assigned to you', 'تم إسناد متدرب جديد إليك', null, '/app/supervisor/mentees/' || new.id);
    end if;
    return new;
  end if;
  if auth.uid() = old.mentor_id then
    new.mentee_id := old.mentee_id; new.mentor_id := old.mentor_id; new.supervisor_id := old.supervisor_id;
    new.package_id := old.package_id; new.request_id := old.request_id;
    if new.status in ('completed','cancelled') and old.status not in ('completed','cancelled') then new.ended_at := now(); end if;
    return new;
  end if;
  raise exception 'Not allowed';
end $$;
drop trigger if exists mentorships_guard on public.mentorships;
create trigger mentorships_guard before update on public.mentorships for each row execute function public.guard_mentorship();

create or replace function public.mentorship_counts() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  perform set_config('app.rpc', 'on', true);
  update public.mentor_profiles set mentees_count = (select count(distinct mentee_id) from public.mentorships where mentor_id = coalesce(new.mentor_id, old.mentor_id))
  where id = coalesce(new.mentor_id, old.mentor_id);
  perform set_config('app.rpc', 'off', true);
  return null;
end $$;
drop trigger if exists mentorships_counts on public.mentorships;
create trigger mentorships_counts after insert or delete on public.mentorships for each row execute function public.mentorship_counts();

create or replace function public.touch_ms(p_ms bigint) returns void
  language plpgsql security definer set search_path = public as
$$
declare prev text := coalesce(current_setting('app.rpc', true), '');
begin
  perform set_config('app.rpc', 'on', true);
  update public.mentorships set last_activity_at = now() where id = p_ms;
  perform set_config('app.rpc', prev, true);
end $$;

-- assessments: mentee edits answers; staff only set status/review note
create or replace function public.guard_assessment() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('draft','submitted') then new.status := 'draft'; end if;
    new.review_note := null; new.reviewed_by := null; return new;
  end if;
  if auth.uid() = old.mentee_id then
    if old.status = 'reviewed' then raise exception 'Assessment already reviewed'; end if;
    if new.status not in ('draft','submitted') then new.status := old.status; end if;
    new.review_note := old.review_note; new.reviewed_by := old.reviewed_by;
  else
    new.answers := old.answers; new.mentee_id := old.mentee_id; new.submitted_at := old.submitted_at;
    if new.status not in ('reviewed','needs_info') then raise exception 'Invalid status'; end if;
    new.reviewed_by := auth.uid();
    perform public.notify(old.mentee_id, 'Your assessment was reviewed', 'تمت مراجعة تقييمك', new.review_note, '/app/mentee/assessment');
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists assessment_guard on public.assessment_submissions;
create trigger assessment_guard before insert or update on public.assessment_submissions for each row execute function public.guard_assessment();

-- plans: ids are copied from the mentorship; status changes only via set_plan_status(); every edit bumps the version
create or replace function public.guard_plan() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare m public.mentorships;
begin
  select * into m from public.mentorships where id = new.mentorship_id;
  new.mentee_id := m.mentee_id; new.mentor_id := m.mentor_id;
  if tg_op = 'INSERT' then
    new.status := 'draft'; new.version := 1; new.approved_at := null;
  else
    if new.status is distinct from old.status and coalesce(current_setting('app.rpc', true), '') <> 'on' and not public.is_admin() then
      raise exception 'Use set_plan_status()';
    end if;
    if (new.title, new.summary, new.start_date, new.target_date) is distinct from (old.title, old.summary, old.start_date, old.target_date) then
      insert into public.development_plan_versions (plan_id, version, snapshot, changed_by) values (old.id, old.version, to_jsonb(old), auth.uid());
      new.version := old.version + 1;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists plans_guard on public.development_plans;
create trigger plans_guard before insert or update on public.development_plans for each row execute function public.guard_plan();

-- tasks: mentee changes go through set_task_status()
create or replace function public.task_changed() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare p public.development_plans;
begin
  select * into p from public.development_plans where id = new.plan_id;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    perform public.notify(p.mentee_id, 'New task: ' || new.title, 'مهمة جديدة: ' || new.title, null, '/app/mentee/tasks');
  end if;
  perform public.touch_ms(p.mentorship_id);
  return new;
end $$;
drop trigger if exists tasks_changed on public.plan_tasks;
create trigger tasks_changed before insert or update on public.plan_tasks for each row execute function public.task_changed();

create or replace function public.on_submission() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare p public.development_plans; t public.plan_tasks;
begin
  select * into t from public.plan_tasks where id = new.task_id;
  select * into p from public.development_plans where id = t.plan_id;
  perform set_config('app.rpc', 'on', true);
  update public.plan_tasks set status = 'submitted' where id = t.id;
  perform set_config('app.rpc', 'off', true);
  perform public.notify(p.mentor_id, 'Task submitted for review', 'تسليم جديد للمراجعة', t.title, '/app/mentor/reviews');
  return new;
end $$;
drop trigger if exists submissions_after on public.task_submissions;
create trigger submissions_after after insert on public.task_submissions for each row execute function public.on_submission();

create or replace function public.on_feedback() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare p public.development_plans; t public.plan_tasks;
begin
  select * into t from public.plan_tasks where id = new.task_id;
  select * into p from public.development_plans where id = t.plan_id;
  if new.decision <> 'comment' then
    update public.plan_tasks set status = case new.decision when 'approved' then 'completed'::public.task_status else 'changes_requested'::public.task_status end where id = t.id;
  end if;
  perform public.notify(p.mentee_id,
    case new.decision when 'approved' then 'Task approved 🎉' when 'changes_requested' then 'Changes requested on your task' else 'New comment on your task' end,
    case new.decision when 'approved' then 'تم اعتماد مهمتك 🎉' when 'changes_requested' then 'طُلب تعديل على مهمتك' else 'تعليق جديد على مهمتك' end,
    t.title, '/app/mentee/tasks');
  return new;
end $$;
drop trigger if exists feedback_after on public.task_feedback;
create trigger feedback_after after insert on public.task_feedback for each row execute function public.on_feedback();

-- sessions: participants are copied from the mentorship
create or replace function public.session_fill() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare m public.mentorships;
begin
  select * into m from public.mentorships where id = new.mentorship_id;
  new.mentee_id := m.mentee_id; new.mentor_id := m.mentor_id;
  if tg_op = 'INSERT' then
    perform public.notify(m.mentee_id, 'New session: ' || new.title, 'جلسة جديدة: ' || new.title, to_char(new.starts_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI "UTC"'), '/app/mentee/sessions');
  elsif new.starts_at is distinct from old.starts_at or new.status is distinct from old.status then
    perform public.notify(m.mentee_id, 'Session updated: ' || new.title, 'تحديث على الجلسة: ' || new.title, new.status::text, '/app/mentee/sessions');
  end if;
  perform public.touch_ms(m.id);
  return new;
end $$;
drop trigger if exists sessions_fill on public.sessions;
create trigger sessions_fill before insert or update on public.sessions for each row execute function public.session_fill();

-- messages: only the recipient may set read_at; nothing else can be edited
create or replace function public.guard_message() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if tg_op = 'INSERT' then new.sender_id := auth.uid(); new.read_at := null; perform public.touch_ms(new.mentorship_id); return new; end if;
  -- body/sender are immutable; only the recipient's read receipt can change
  if auth.uid() <> old.sender_id then old.read_at := coalesce(old.read_at, new.read_at); end if;
  return old;
end $$;
drop trigger if exists messages_guard on public.messages;
create trigger messages_guard before insert or update on public.messages for each row execute function public.guard_message();

-- reviews keep mentor rating up to date
create or replace function public.review_stats() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare v uuid := coalesce(new.mentor_id, old.mentor_id);
begin
  perform set_config('app.rpc', 'on', true);
  update public.mentor_profiles mp set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where mentor_id = v and is_public), 0),
    reviews_count = (select count(*) from public.reviews where mentor_id = v and is_public)
  where mp.id = v;
  perform set_config('app.rpc', 'off', true);
  return null;
end $$;
drop trigger if exists reviews_stats on public.reviews;
create trigger reviews_stats after insert or update or delete on public.reviews for each row execute function public.review_stats();

create or replace function public.settings_audit() returns trigger
  language plpgsql security definer set search_path = public as
$$ begin perform public.audit('settings.updated', 'system_settings', new.key, jsonb_build_object('value', new.value)); new.updated_at := now(); return new; end $$;
drop trigger if exists settings_audit on public.system_settings;
create trigger settings_audit before insert or update on public.system_settings for each row execute function public.settings_audit();

-- =====================================================================================
-- RPC functions (called from the app with supabase.rpc)
-- =====================================================================================

create or replace function public.decide_request(p_request_id bigint, p_accept boolean, p_note text default null) returns bigint
  language plpgsql security definer set search_path = public as
$$
declare r public.mentorship_requests; pkg public.mentorship_packages; v_ms bigint; v_rate numeric;
begin
  select * into r from public.mentorship_requests where id = p_request_id for update;
  if r.id is null then raise exception 'Request not found'; end if;
  if r.mentor_id <> auth.uid() and not public.is_admin() then raise exception 'Not allowed'; end if;
  if r.status not in ('submitted','under_review') then raise exception 'Request already decided'; end if;
  perform set_config('app.rpc', 'on', true);
  update public.mentorship_requests set status = case when p_accept then 'accepted'::public.request_status else 'rejected'::public.request_status end,
    decision_note = p_note, decided_at = now() where id = r.id;
  if p_accept then
    insert into public.mentorships (request_id, mentee_id, mentor_id, package_id) values (r.id, r.mentee_id, r.mentor_id, r.package_id) returning id into v_ms;
    select * into pkg from public.mentorship_packages where id = r.package_id;
    if pkg.id is not null and pkg.price > 0 then
      v_rate := public.setting_num('commission_rate', 0.15);
      insert into public.orders (mentee_id, mentor_id, package_id, mentorship_id, amount, currency, commission_rate, commission_amount)
      values (r.mentee_id, r.mentor_id, pkg.id, v_ms, pkg.price, pkg.currency, v_rate, round(pkg.price * v_rate, 2));
    end if;
    if p_note is not null and p_note <> '' then insert into public.messages (mentorship_id, sender_id, body) values (v_ms, auth.uid(), p_note); end if;
    perform public.notify(r.mentee_id, 'Your application was accepted 🎉', 'تم قبول طلبك 🎉', p_note, '/app/mentee/mentors');
  else
    perform public.notify(r.mentee_id, 'Update on your application', 'تحديث على طلبك', p_note, '/app/mentee/mentors');
  end if;
  perform set_config('app.rpc', 'off', true);
  perform public.audit(case when p_accept then 'request.accepted' else 'request.rejected' end, 'mentorship_requests', r.id::text);
  return v_ms;
end $$;

create or replace function public.set_plan_status(p_plan_id bigint, p_status public.plan_status) returns void
  language plpgsql security definer set search_path = public as
$$
declare p public.development_plans; is_mentor boolean; is_mentee boolean;
begin
  select * into p from public.development_plans where id = p_plan_id for update;
  if p.id is null then raise exception 'Plan not found'; end if;
  is_mentor := p.mentor_id = auth.uid() or public.is_admin();
  is_mentee := p.mentee_id = auth.uid();
  if not (
       (is_mentor and ((p.status = 'draft' and p_status = 'pending_approval') or (p.status = 'active' and p_status in ('on_hold','completed','cancelled'))
                       or (p.status = 'on_hold' and p_status in ('active','cancelled')) or (p.status = 'pending_approval' and p_status = 'draft')))
    or (is_mentee and p.status = 'pending_approval' and p_status in ('active','draft'))
    or public.is_admin()) then
    raise exception 'Transition % → % not allowed', p.status, p_status;
  end if;
  perform set_config('app.rpc', 'on', true);
  update public.development_plans set status = p_status, approved_at = case when p_status = 'active' then coalesce(approved_at, now()) else approved_at end where id = p.id;
  if p_status = 'active' then update public.mentorships set status = 'active' where id = p.mentorship_id and status = 'pending_setup'; end if;
  perform set_config('app.rpc', 'off', true);
  if p_status = 'pending_approval' then perform public.notify(p.mentee_id, 'Your development plan is ready', 'خطة تطويرك جاهزة للمراجعة', p.title, '/app/mentee/plan'); end if;
  if p_status = 'active' then perform public.notify(p.mentor_id, 'Plan approved by mentee', 'اعتمد المتدرب الخطة', p.title, '/app/mentor/mentees/' || p.mentorship_id); end if;
  if p_status = 'draft' and is_mentee then perform public.notify(p.mentor_id, 'Mentee asked for plan changes', 'طلب المتدرب تعديل الخطة', p.title, '/app/mentor/mentees/' || p.mentorship_id); end if;
  perform public.audit('plan.' || p_status, 'development_plans', p.id::text);
end $$;

create or replace function public.set_task_status(p_task_id bigint, p_status public.task_status) returns void
  language plpgsql security definer set search_path = public as
$$
declare t public.plan_tasks; p public.development_plans;
begin
  select * into t from public.plan_tasks where id = p_task_id for update;
  select * into p from public.development_plans where id = t.plan_id;
  if p.id is null then raise exception 'Task not found'; end if;
  if p.mentor_id = auth.uid() or public.is_admin() then
    null; -- mentor may set any status
  elsif p.mentee_id = auth.uid() then
    if not (p_status = 'in_progress' and t.status in ('not_started','changes_requested')) then raise exception 'Not allowed'; end if;
  else
    raise exception 'Not allowed';
  end if;
  perform set_config('app.rpc', 'on', true);
  update public.plan_tasks set status = p_status where id = t.id;
  perform set_config('app.rpc', 'off', true);
end $$;

create or replace function public.admin_set_role(p_user_id uuid, p_role public.app_role, p_grant boolean) returns void
  language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user_id = auth.uid() and p_role = 'admin' and not p_grant then raise exception 'You cannot remove your own admin role'; end if;
  if p_grant then
    insert into public.user_roles (user_id, role, granted_by) values (p_user_id, p_role, auth.uid()) on conflict do nothing;
  else
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  end if;
  perform public.audit(case when p_grant then 'role.granted' else 'role.revoked' end, 'user_roles', p_user_id::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_decide_mentor(p_mentor_id uuid, p_status public.mentor_status, p_featured boolean default null) returns void
  language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.mentor_profiles set status = p_status, is_published = (p_status = 'approved'), featured = coalesce(p_featured, featured) where id = p_mentor_id;
  if p_status = 'approved' then insert into public.user_roles (user_id, role, granted_by) values (p_mentor_id, 'mentor', auth.uid()) on conflict do nothing; end if;
  perform public.notify(p_mentor_id,
    case p_status when 'approved' then 'Your mentor profile is live 🎉' when 'rejected' then 'Update on your mentor application' else 'Your mentor profile status changed' end,
    case p_status when 'approved' then 'تم نشر ملفك كمرشد 🎉' when 'rejected' then 'تحديث على طلبك كمرشد' else 'تغيرت حالة ملفك كمرشد' end, null, '/app/mentor/profile');
  perform public.audit('mentor.' || p_status, 'mentor_profiles', p_mentor_id::text, jsonb_build_object('featured', p_featured));
end $$;

create or replace function public.admin_set_order_status(p_order_id bigint, p_status public.payment_status) returns void
  language plpgsql security definer set search_path = public as
$$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.orders set status = p_status, paid_at = case when p_status = 'paid' then now() else paid_at end where id = p_order_id returning * into o;
  if p_status = 'paid' then perform public.notify(o.mentee_id, 'Payment confirmed', 'تم تأكيد الدفع', '#' || o.id, '/app/mentee/payments'); end if;
  perform public.audit('order.' || p_status, 'orders', p_order_id::text, jsonb_build_object('amount', o.amount));
end $$;

create or replace function public.set_mentor_tags(p_category_ids bigint[], p_skills text[]) returns void
  language plpgsql security definer set search_path = public as
$$
declare s text;
begin
  if not exists (select 1 from public.mentor_profiles where id = auth.uid()) then raise exception 'Create your mentor profile first'; end if;
  delete from public.mentor_categories where mentor_id = auth.uid();
  insert into public.mentor_categories (mentor_id, category_id) select auth.uid(), c.id from public.categories c where c.id = any (p_category_ids);
  delete from public.mentor_skills where mentor_id = auth.uid();
  foreach s in array coalesce(p_skills, '{}') loop
    s := left(trim(s), 60);
    continue when s = '';
    insert into public.skills (name) values (s) on conflict (name) do nothing;
    insert into public.mentor_skills (mentor_id, skill_id) select auth.uid(), id from public.skills where name = s::citext on conflict do nothing;
  end loop;
end $$;

-- "Become a mentor": adds the mentor role + a draft (unpublished) profile. Publication still needs admin approval.
create or replace function public.apply_as_mentor() returns void
  language plpgsql security definer set search_path = public as
$$
declare v_name text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.user_roles (user_id, role) values (auth.uid(), 'mentor') on conflict do nothing;
  insert into public.mentor_profiles (id, slug, full_name)
  values (auth.uid(), coalesce(nullif(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), ''), 'mentor') || '-' || substr(auth.uid()::text, 1, 6), v_name)
  on conflict (id) do nothing;
  perform public.audit('mentor.applied', 'mentor_profiles', auth.uid()::text);
end $$;

-- =====================================================================================
-- Views (security_invoker → the caller's RLS applies)
-- =====================================================================================
create or replace view public.mentor_admin_view with (security_invoker = true) as
select m.*,
  coalesce((select jsonb_agg(to_jsonb(c) order by c.sort) from public.mentor_categories mc join public.categories c on c.id = mc.category_id where mc.mentor_id = m.id), '[]') as categories,
  coalesce((select jsonb_agg(s.name order by s.name) from public.mentor_skills ms join public.skills s on s.id = ms.skill_id where ms.mentor_id = m.id), '[]') as skills,
  coalesce((select jsonb_agg(to_jsonb(p) order by p.sort, p.price) from public.mentorship_packages p where p.mentor_id = m.id and p.is_active), '[]') as packages,
  greatest(m.max_mentees - public.mentor_active_count(m.id), 0) as spots_left
from public.mentor_profiles m;

create or replace view public.mentor_directory with (security_invoker = true) as
select * from public.mentor_admin_view where status = 'approved' and is_published;

-- Public testimonials: first name only. Owner-rights view on purpose (exposes safe columns only).
create or replace view public.public_reviews as
select r.id, r.mentor_id, r.rating, r.comment, r.created_at,
  jsonb_build_object('full_name', split_part(p.full_name, ' ', 1) || ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.', 'headline', p.headline) as mentee
from public.reviews r join public.profiles p on p.id = r.mentee_id
join public.mentor_profiles mp on mp.id = r.mentor_id and mp.status = 'approved' and mp.is_published
where r.is_public;

-- =====================================================================================
-- Row Level Security
-- =====================================================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.mentor_categories enable row level security;
alter table public.mentor_skills enable row level security;
alter table public.mentorship_packages enable row level security;
alter table public.mentorship_requests enable row level security;
alter table public.mentorships enable row level security;
alter table public.assessment_templates enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.development_plans enable row level security;
alter table public.development_plan_versions enable row level security;
alter table public.plan_goals enable row level security;
alter table public.plan_milestones enable row level security;
alter table public.plan_tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.task_feedback enable row level security;
alter table public.learning_resources enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.supervision_notes enable row level security;
alter table public.interventions enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.support_tickets enable row level security;

-- helper to (re)create a policy idempotently
create or replace function pg_temp.pol(p_name text, p_table text, p_cmd text, p_using text, p_check text default null) returns void language plpgsql as
$$
begin
  execute format('drop policy if exists %I on public.%I', p_name, p_table);
  execute format('create policy %I on public.%I for %s to %s %s %s', p_name, p_table, p_cmd,
    case when p_using = 'true' and p_cmd = 'select' and p_table in ('categories','skills','mentor_categories','mentor_skills','mentor_profiles','mentorship_packages') then 'anon, authenticated' else 'authenticated' end,
    case when p_cmd = 'insert' then '' else format('using (%s)', p_using) end,
    case when p_check is not null then format('with check (%s)', p_check) when p_cmd = 'insert' then format('with check (%s)', p_using) else '' end);
end $$;

-- identity
select pg_temp.pol('profiles_select', 'profiles', 'select', 'public.can_view_profile(id)');
select pg_temp.pol('profiles_update', 'profiles', 'update', 'id = auth.uid() or public.is_admin()');
select pg_temp.pol('roles_select', 'user_roles', 'select', 'user_id = auth.uid() or public.is_backoffice()');
-- settings / audit / notifications
select pg_temp.pol('settings_select', 'system_settings', 'select', 'true');
select pg_temp.pol('settings_insert', 'system_settings', 'insert', 'public.is_admin()');
select pg_temp.pol('settings_update', 'system_settings', 'update', 'public.is_admin()');
select pg_temp.pol('audit_select', 'audit_logs', 'select', 'public.is_admin()');
select pg_temp.pol('notif_select', 'notifications', 'select', 'user_id = auth.uid()');
select pg_temp.pol('notif_update', 'notifications', 'update', 'user_id = auth.uid()');
select pg_temp.pol('notif_delete', 'notifications', 'delete', 'user_id = auth.uid()');
-- taxonomy (public read)
select pg_temp.pol('cat_select', 'categories', 'select', 'true');
select pg_temp.pol('cat_insert', 'categories', 'insert', 'public.is_admin()');
select pg_temp.pol('cat_update', 'categories', 'update', 'public.is_admin()');
select pg_temp.pol('cat_delete', 'categories', 'delete', 'public.is_admin()');
select pg_temp.pol('skill_select', 'skills', 'select', 'true');
select pg_temp.pol('skill_insert', 'skills', 'insert', 'public.is_admin()');
select pg_temp.pol('skill_delete', 'skills', 'delete', 'public.is_admin()');
-- mentors
drop policy if exists mentor_public on public.mentor_profiles;
create policy mentor_public on public.mentor_profiles for select to anon, authenticated using ((status = 'approved' and is_published) or id = auth.uid() or public.is_backoffice());
select pg_temp.pol('mentor_insert', 'mentor_profiles', 'insert', 'id = auth.uid() and public.has_role(''mentor'')');
select pg_temp.pol('mentor_update', 'mentor_profiles', 'update', 'id = auth.uid() or public.is_admin()');
select pg_temp.pol('mcat_select', 'mentor_categories', 'select', 'true');
select pg_temp.pol('mskill_select', 'mentor_skills', 'select', 'true');
drop policy if exists pkg_select on public.mentorship_packages;
create policy pkg_select on public.mentorship_packages for select to anon, authenticated using (mentor_id = auth.uid() or public.is_backoffice() or exists (select 1 from public.mentor_profiles m where m.id = mentor_id and m.status = 'approved' and m.is_published) or exists (select 1 from public.mentorships ms where ms.package_id = mentorship_packages.id and ms.mentee_id = auth.uid()));
select pg_temp.pol('pkg_insert', 'mentorship_packages', 'insert', 'mentor_id = auth.uid() and public.has_role(''mentor'')');
select pg_temp.pol('pkg_update', 'mentorship_packages', 'update', 'mentor_id = auth.uid() or public.is_admin()');
-- requests
select pg_temp.pol('req_select', 'mentorship_requests', 'select', 'mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_backoffice()');
select pg_temp.pol('req_insert', 'mentorship_requests', 'insert', 'mentee_id = auth.uid() and public.has_role(''mentee'')');
select pg_temp.pol('req_update', 'mentorship_requests', 'update', 'mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_admin()');
-- mentorships
select pg_temp.pol('ms_select', 'mentorships', 'select', 'public.is_ms_party(id)');
select pg_temp.pol('ms_update', 'mentorships', 'update', 'mentor_id = auth.uid() or public.is_admin()');
-- assessment
select pg_temp.pol('tpl_select', 'assessment_templates', 'select', 'true');
select pg_temp.pol('tpl_admin', 'assessment_templates', 'all', 'public.is_admin()');
select pg_temp.pol('q_select', 'assessment_questions', 'select', 'true');
select pg_temp.pol('q_admin', 'assessment_questions', 'all', 'public.is_admin()');
select pg_temp.pol('as_select', 'assessment_submissions', 'select',
  'mentee_id = auth.uid() or public.is_admin() or exists (select 1 from public.mentorships m where m.mentee_id = assessment_submissions.mentee_id and auth.uid() in (m.mentor_id, m.supervisor_id)) or exists (select 1 from public.mentorship_requests r where r.mentee_id = assessment_submissions.mentee_id and r.mentor_id = auth.uid() and r.status in (''submitted'',''under_review''))');
select pg_temp.pol('as_insert', 'assessment_submissions', 'insert', 'mentee_id = auth.uid()');
select pg_temp.pol('as_update', 'assessment_submissions', 'update',
  'mentee_id = auth.uid() or public.is_admin() or exists (select 1 from public.mentorships m where m.mentee_id = assessment_submissions.mentee_id and auth.uid() in (m.mentor_id, m.supervisor_id))');
-- plans
select pg_temp.pol('plan_select', 'development_plans', 'select', 'public.is_ms_party(mentorship_id)');
select pg_temp.pol('plan_insert', 'development_plans', 'insert', 'public.is_ms_mentor(mentorship_id)');
select pg_temp.pol('plan_update', 'development_plans', 'update', 'public.is_ms_mentor(mentorship_id)');
select pg_temp.pol('planv_select', 'development_plan_versions', 'select', 'public.is_ms_party(public.plan_ms(plan_id))');
select pg_temp.pol('goal_select', 'plan_goals', 'select', 'public.is_ms_party(public.plan_ms(plan_id))');
select pg_temp.pol('goal_write', 'plan_goals', 'all', 'public.is_ms_mentor(public.plan_ms(plan_id))');
select pg_temp.pol('ms_select2', 'plan_milestones', 'select', 'public.is_ms_party(public.plan_ms(plan_id))');
select pg_temp.pol('ms_write', 'plan_milestones', 'all', 'public.is_ms_mentor(public.plan_ms(plan_id))');
select pg_temp.pol('task_select', 'plan_tasks', 'select', 'public.is_ms_party(public.plan_ms(plan_id))');
select pg_temp.pol('task_write', 'plan_tasks', 'all', 'public.is_ms_mentor(public.plan_ms(plan_id))');
select pg_temp.pol('res_select', 'learning_resources', 'select', 'public.is_ms_party(public.plan_ms(plan_id))');
select pg_temp.pol('res_write', 'learning_resources', 'all', 'public.is_ms_mentor(public.plan_ms(plan_id))');
-- mentee may tick a resource as done
select pg_temp.pol('res_mentee_done', 'learning_resources', 'update', 'exists (select 1 from public.development_plans p where p.id = plan_id and p.mentee_id = auth.uid())');
select pg_temp.pol('sub_select', 'task_submissions', 'select', 'public.is_ms_party(public.plan_ms(public.task_plan(task_id)))');
select pg_temp.pol('sub_insert', 'task_submissions', 'insert',
  'author_id = auth.uid() and exists (select 1 from public.plan_tasks t join public.development_plans p on p.id = t.plan_id where t.id = task_id and p.mentee_id = auth.uid() and t.status in (''not_started'',''in_progress'',''changes_requested''))');
select pg_temp.pol('fb_select', 'task_feedback', 'select', 'public.is_ms_party(public.plan_ms(public.task_plan(task_id)))');
select pg_temp.pol('fb_insert', 'task_feedback', 'insert', 'author_id = auth.uid() and public.is_ms_mentor(public.plan_ms(public.task_plan(task_id)))');
-- sessions
select pg_temp.pol('ses_select', 'sessions', 'select', 'public.is_ms_party(mentorship_id)');
select pg_temp.pol('ses_insert', 'sessions', 'insert', 'public.is_ms_mentor(mentorship_id)');
select pg_temp.pol('ses_update', 'sessions', 'update', 'public.is_ms_mentor(mentorship_id)');
-- messages (private)
select pg_temp.pol('msg_select', 'messages', 'select', 'public.is_ms_chat(mentorship_id)');
select pg_temp.pol('msg_insert', 'messages', 'insert', 'sender_id = auth.uid() and public.is_ms_chat(mentorship_id)');
select pg_temp.pol('msg_update', 'messages', 'update', 'public.is_ms_chat(mentorship_id)');
-- supervision
select pg_temp.pol('note_select', 'supervision_notes', 'select',
  'author_id = auth.uid() or (visibility = ''staff'' and public.is_ms_staff(mentorship_id)) or (visibility = ''mentee'' and public.is_ms_party(mentorship_id))');
select pg_temp.pol('note_insert', 'supervision_notes', 'insert', 'author_id = auth.uid() and public.is_ms_staff(mentorship_id)');
select pg_temp.pol('int_select', 'interventions', 'select', 'public.is_ms_staff(mentorship_id)');
select pg_temp.pol('int_insert', 'interventions', 'insert', 'author_id = auth.uid() and public.is_ms_supervisor(mentorship_id)');
select pg_temp.pol('int_update', 'interventions', 'update', 'public.is_ms_supervisor(mentorship_id)');
-- reviews
select pg_temp.pol('rev_select', 'reviews', 'select', 'mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_backoffice()');
select pg_temp.pol('rev_insert', 'reviews', 'insert',
  'mentee_id = auth.uid() and exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentee_id = auth.uid() and m.mentor_id = reviews.mentor_id and m.status in (''active'',''completed''))');
select pg_temp.pol('rev_admin', 'reviews', 'update', 'public.is_admin()');
-- orders (read only from the client; writes through RPC / webhook)
select pg_temp.pol('ord_select', 'orders', 'select', 'mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_admin()');
-- support
select pg_temp.pol('ticket_select', 'support_tickets', 'select', 'user_id = auth.uid() or public.is_backoffice()');
select pg_temp.pol('ticket_insert', 'support_tickets', 'insert', 'user_id = auth.uid()');
select pg_temp.pol('ticket_update', 'support_tickets', 'update', 'public.is_backoffice()');

-- Function execution: RPCs are callable by signed-in users only (each checks the caller itself)
revoke execute on function public.decide_request(bigint, boolean, text), public.set_plan_status(bigint, public.plan_status), public.set_task_status(bigint, public.task_status),
  public.admin_set_role(uuid, public.app_role, boolean), public.admin_decide_mentor(uuid, public.mentor_status, boolean), public.admin_set_order_status(bigint, public.payment_status),
  public.set_mentor_tags(bigint[], text[]), public.apply_as_mentor(), public.audit(text, text, text, jsonb), public.notify(uuid, text, text, text, text), public.touch_ms(bigint) from public, anon;
grant execute on function public.decide_request(bigint, boolean, text), public.set_plan_status(bigint, public.plan_status), public.set_task_status(bigint, public.task_status),
  public.admin_set_role(uuid, public.app_role, boolean), public.admin_decide_mentor(uuid, public.mentor_status, boolean), public.admin_set_order_status(bigint, public.payment_status),
  public.set_mentor_tags(bigint[], text[]), public.apply_as_mentor() to authenticated;
revoke execute on function public.audit(text, text, text, jsonb), public.notify(uuid, text, text, text, text), public.touch_ms(bigint) from authenticated;

grant select on public.mentor_directory, public.public_reviews to anon, authenticated;
grant select on public.mentor_admin_view to authenticated;

-- Realtime for chat + notifications
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

-- Storage: public avatars bucket (users write only inside their own folder)
do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp'])
  on conflict (id) do nothing;
  drop policy if exists "avatar owner write" on storage.objects;
  create policy "avatar owner write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  drop policy if exists "avatar owner update" on storage.objects;
  create policy "avatar owner update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when undefined_table or invalid_schema_name then null; end $$;
