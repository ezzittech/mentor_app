-- Run ONCE after you sign up with your own email in the app, to make yourself the first admin.
-- Replace the email below, then run in Supabase → SQL Editor.
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR-EMAIL@example.com'
on conflict do nothing;
