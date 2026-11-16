-- =====================================================================================
-- 0003 — let trusted maintenance SQL (Supabase SQL Editor / service role, where auth.uid() is null)
-- update rows that the app-facing guards normally protect. App users are unaffected:
-- they always have auth.uid(), so every rule from 0001 still applies to them.
-- =====================================================================================


create or replace function public.guard_mentorship() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null or current_setting('app.rpc', true) = 'on' or public.is_admin() then
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
  if auth.uid() is null or current_setting('app.rpc', true) = 'on' or public.is_admin() then return new; end if;
  if auth.uid() = old.mentee_id and new.status = 'cancelled' and old.status in ('submitted','under_review') then
    old.status := 'cancelled'; return old;
  end if;
  if auth.uid() = old.mentor_id and new.status = 'under_review' and old.status = 'submitted' then
    old.status := 'under_review'; return old;
  end if;
  raise exception 'Not allowed';
end $$;

create or replace function public.guard_assessment() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
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
    if new.status is distinct from old.status and coalesce(current_setting('app.rpc', true), '') <> 'on' and not public.is_admin() and auth.uid() is not null then
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

create or replace function public.guard_message() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then new.sender_id := auth.uid(); new.read_at := null; perform public.touch_ms(new.mentorship_id); return new; end if;
  -- body/sender are immutable; only the recipient's read receipt can change
  if auth.uid() <> old.sender_id then old.read_at := coalesce(old.read_at, new.read_at); end if;
  return old;
end $$;
