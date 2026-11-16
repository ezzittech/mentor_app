-- Removes ALL test accounts (*@murshid.test) and everything they created. Run before the real launch.
do $$
declare ids uuid[] := array(select id from auth.users where email like '%@murshid.test');
begin
  perform set_config('app.rpc', 'on', true);  -- maintenance mode for the guards (works even without migration 0003)
  update public.user_roles set granted_by = null where granted_by = any (ids);
  update public.assessment_submissions set reviewed_by = null where reviewed_by = any (ids);
  update public.plan_tasks set created_by = null where created_by = any (ids);
  update public.development_plan_versions set changed_by = null where changed_by = any (ids);
  update public.mentorships set supervisor_id = null where supervisor_id = any (ids);
  delete from public.supervision_notes where author_id = any (ids);
  delete from public.interventions where author_id = any (ids);
  delete from public.task_feedback where author_id = any (ids);
  delete from public.task_submissions where author_id = any (ids);
  delete from public.messages where sender_id = any (ids);
  delete from public.reviews where mentee_id = any (ids) or mentor_id = any (ids);
  delete from public.orders where mentee_id = any (ids) or mentor_id = any (ids);
  delete from public.sessions where mentee_id = any (ids) or mentor_id = any (ids);
  delete from public.development_plans where mentee_id = any (ids) or mentor_id = any (ids);
  delete from public.mentorships where mentee_id = any (ids) or mentor_id = any (ids);
  delete from auth.users where id = any (ids);   -- cascades to profiles, roles, mentor profiles, requests, notifications
end $$;
select count(*) as remaining_test_accounts from auth.users where email like '%@murshid.test';
