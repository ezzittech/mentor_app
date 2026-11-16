-- Minimal stand-in for the parts of Supabase the schema relies on (used only by scripts/test-db.sh).
do $$ begin create role anon nologin; exception when others then null; end $$;
do $$ begin create role authenticated nologin; exception when others then null; end $$;
create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists auth.users (
  instance_id uuid, id uuid primary key default gen_random_uuid(), aud text, role text, email text,
  encrypted_password text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb default '{}',
  created_at timestamptz, updated_at timestamptz, confirmation_token text, email_change text, email_change_token_new text, recovery_token text
);
create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users (id) on delete cascade, provider_id text not null,
  identity_data jsonb not null, provider text not null, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
  unique (provider_id, provider)
);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
do $$ begin create publication supabase_realtime; exception when others then null; end $$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
