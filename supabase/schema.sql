-- Roster of accounts allowed to sign in to the site.
-- Run this once in the Supabase dashboard: SQL Editor → New query → Run.

create table if not exists public.students (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  username   text not null unique,
  password   text not null,
  created_at timestamptz not null default now()
);

-- RLS is enabled with NO policies, which denies every request that uses the
-- public anon key. That is deliberate: this table stores cleartext passwords,
-- so the browser must never read it. Only /api/login and /api/students touch
-- it, using the service-role key, which bypasses RLS and stays server-side.
alter table public.students enable row level security;

-- The administrator account. Only this username can open /admin.
insert into public.students (name, username, password)
values ('Jaewon Seol', 'jbnu', '1234')
on conflict (username) do nothing;
