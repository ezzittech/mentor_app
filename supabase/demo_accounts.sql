-- =====================================================================================
-- TEST ACCOUNTS for every role — for testing / staging only.
-- Password for all accounts:  Murshid@2026
-- ⚠️ Before real launch run supabase/demo_accounts_remove.sql (an admin with a known password is a risk).
-- Safe to re-run: existing accounts are left as they are.
-- Requires: migrations/0001 (+0002 if you ran it) and seed.sql.
-- =====================================================================================
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  pw constant text := 'Murshid@2026';
  u record;
  v_id uuid;
begin
  for u in select * from (values
    ('admin@murshid.test',      'مدير المنصة (تجريبي)',      '{}'::jsonb),
    ('supervisor@murshid.test', 'هدى المشرفة (تجريبي)',      '{}'::jsonb),
    ('manager@murshid.test',    'سامي مدير البرنامج (تجريبي)', '{}'::jsonb),
    ('support@murshid.test',    'دعم فني (تجريبي)',          '{}'::jsonb),
    ('mentor@murshid.test',     'Omar Khalid (Demo)',         '{"intent":"mentor"}'::jsonb),
    ('mentor2@murshid.test',    'Lina Haddad (Demo)',         '{"intent":"mentor"}'::jsonb),
    ('mentee@murshid.test',     'سارة المتدربة (تجريبي)',    '{}'::jsonb),
    ('mentee2@murshid.test',    'فيصل المتدرب (تجريبي)',     '{}'::jsonb)
  ) as t(email, name, meta) loop
    if exists (select 1 from auth.users where email = u.email) then continue; end if;
    v_id := gen_random_uuid();
    -- the on_auth_user_created trigger creates profile + mentee role (+ mentor role & draft profile for intent=mentor)
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', u.email,
            extensions.crypt(pw, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name, 'locale', 'ar') || u.meta, now(), now(),
            '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now());
  end loop;
end $$;

-- extra roles
insert into public.user_roles (user_id, role)
select au.id, r.role::public.app_role
from (values ('admin@murshid.test','admin'), ('supervisor@murshid.test','supervisor'),
             ('manager@murshid.test','program_manager'), ('support@murshid.test','support')) as r(email, role)
join auth.users au on au.email = r.email
on conflict do nothing;

-- one approved, published mentor ready to receive applications (mentor2 stays a draft to test the approval flow)
update public.mentor_profiles mp set
  slug = 'omar-khalid-demo',
  headline = 'Staff Engineer helping developers reach senior level',
  bio = E'أعمل في هندسة البرمجيات منذ أكثر من 10 سنوات، وساعدت عشرات المطورين على الترقي.\n\n10+ years in software engineering. I help developers grow into senior roles with a clear plan and weekly follow-up.',
  job_title = 'Staff Software Engineer', company = 'Demo Corp', years_experience = 12, country = 'Saudi Arabia',
  timezone = 'Asia/Riyadh', languages = '{ar,en}', status = 'approved', is_published = true, featured = true,
  accepting = true, max_mentees = 5, response_hours = 12
from auth.users au where au.email = 'mentor@murshid.test' and mp.id = au.id and mp.status <> 'approved';

insert into public.mentor_categories (mentor_id, category_id)
select au.id, c.id from auth.users au, public.categories c
where au.email = 'mentor@murshid.test' and c.slug in ('engineering', 'career')
on conflict do nothing;

insert into public.mentor_skills (mentor_id, skill_id)
select au.id, s.id from auth.users au, public.skills s
where au.email = 'mentor@murshid.test' and s.name in ('React', 'TypeScript', 'System Design', 'Interview Prep')
on conflict do nothing;

insert into public.mentorship_packages (mentor_id, name, price, billing, calls_per_month, call_minutes, response_hours, features, trial_days, sort)
select au.id, p.name, p.price, p.billing, p.calls, p.mins, 24, p.features, p.trial, p.sort
from auth.users au,
  (values ('Lite', 99, 'monthly', 1, 45, array['محادثة غير محدودة', 'مكالمة شهريًا', 'خطة تطوير'], 7, 1),
          ('Standard', 180, 'monthly', 2, 45, array['محادثة غير محدودة', 'مكالمتان شهريًا', 'خطة ومهام ومراجعات'], 7, 2),
          ('Pro', 300, 'monthly', 4, 45, array['أولوية في الرد', '4 مكالمات شهريًا', 'مراجعة السيرة الذاتية'], 7, 3),
          ('Mock interview', 80, 'one_off', 1, 60, array['مقابلة تجريبية 60 دقيقة', 'تقرير مكتوب'], 0, 4))
       as p(name, price, billing, calls, mins, features, trial, sort)
where au.email = 'mentor@murshid.test'
  and not exists (select 1 from public.mentorship_packages x where x.mentor_id = au.id);

-- result
select au.email, p.full_name, string_agg(r.role::text, ', ' order by r.role) as roles
from auth.users au join public.profiles p on p.id = au.id left join public.user_roles r on r.user_id = au.id
where au.email like '%@murshid.test' group by 1, 2 order by 1;
