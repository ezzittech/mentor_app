-- =====================================================================================
-- 0002 — repair for projects that already contained objects from an earlier attempt.
-- Safe to run on any database (every statement is idempotent).
--   1) adds enum values that older versions of the types were missing
--   2) creates profile + mentee role for auth users that signed up before the trigger existed
-- Run in Supabase → SQL Editor, then run supabase/verify.sql again.
-- =====================================================================================

alter type public.app_role add value if not exists 'mentee';
alter type public.app_role add value if not exists 'mentor';
alter type public.app_role add value if not exists 'supervisor';
alter type public.app_role add value if not exists 'program_manager';
alter type public.app_role add value if not exists 'admin';
alter type public.app_role add value if not exists 'support';
alter type public.assessment_status add value if not exists 'draft';
alter type public.assessment_status add value if not exists 'submitted';
alter type public.assessment_status add value if not exists 'needs_info';
alter type public.assessment_status add value if not exists 'reviewed';
alter type public.goal_status add value if not exists 'not_started';
alter type public.goal_status add value if not exists 'in_progress';
alter type public.goal_status add value if not exists 'achieved';
alter type public.goal_status add value if not exists 'partially_achieved';
alter type public.goal_status add value if not exists 'not_achieved';
alter type public.goal_status add value if not exists 'dropped';
alter type public.mentor_status add value if not exists 'draft';
alter type public.mentor_status add value if not exists 'pending';
alter type public.mentor_status add value if not exists 'approved';
alter type public.mentor_status add value if not exists 'rejected';
alter type public.mentor_status add value if not exists 'suspended';
alter type public.mentorship_status add value if not exists 'pending_setup';
alter type public.mentorship_status add value if not exists 'active';
alter type public.mentorship_status add value if not exists 'paused';
alter type public.mentorship_status add value if not exists 'completed';
alter type public.mentorship_status add value if not exists 'cancelled';
alter type public.note_visibility add value if not exists 'private';
alter type public.note_visibility add value if not exists 'staff';
alter type public.note_visibility add value if not exists 'mentee';
alter type public.payment_status add value if not exists 'pending';
alter type public.payment_status add value if not exists 'paid';
alter type public.payment_status add value if not exists 'failed';
alter type public.payment_status add value if not exists 'refunded';
alter type public.payment_status add value if not exists 'cancelled';
alter type public.plan_status add value if not exists 'draft';
alter type public.plan_status add value if not exists 'pending_approval';
alter type public.plan_status add value if not exists 'active';
alter type public.plan_status add value if not exists 'on_hold';
alter type public.plan_status add value if not exists 'completed';
alter type public.plan_status add value if not exists 'cancelled';
alter type public.request_status add value if not exists 'submitted';
alter type public.request_status add value if not exists 'under_review';
alter type public.request_status add value if not exists 'accepted';
alter type public.request_status add value if not exists 'rejected';
alter type public.request_status add value if not exists 'cancelled';
alter type public.session_status add value if not exists 'scheduled';
alter type public.session_status add value if not exists 'confirmed';
alter type public.session_status add value if not exists 'completed';
alter type public.session_status add value if not exists 'cancelled';
alter type public.session_status add value if not exists 'no_show';
alter type public.session_status add value if not exists 'failed';
alter type public.task_kind add value if not exists 'exercise';
alter type public.task_kind add value if not exists 'project';
alter type public.task_kind add value if not exists 'review';
alter type public.task_kind add value if not exists 'session';
alter type public.task_kind add value if not exists 'resource';
alter type public.task_status add value if not exists 'not_started';
alter type public.task_status add value if not exists 'in_progress';
alter type public.task_status add value if not exists 'submitted';
alter type public.task_status add value if not exists 'changes_requested';
alter type public.task_status add value if not exists 'completed';
alter type public.task_status add value if not exists 'cancelled';

insert into public.profiles (id, full_name, email)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1)), coalesce(u.email, '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_roles (user_id, role)
select p.id, 'mentee' from public.profiles p
where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'mentee');
