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

-- ---------------------------------------------------------------- site content

-- Every edit made in the page — pathway articles, the metabolic map, figure
-- galleries — as one row per document, keyed by a string the client builds
-- (see lib/site-content.ts). A key/value shape rather than a table per feature:
-- the payloads are already JSON in the browser, and nothing queries inside them.
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- As with students, RLS is on with no policies, so the anon key can reach
-- nothing. Both directions go through /api/content: reads are public there,
-- writes require the administrator cookie.
alter table public.site_content enable row level security;

-- ------------------------------------------------------------------- uploads

-- Images and slide decks are far too large for a jsonb row, so they go to
-- Storage and only their URL is kept in site_content. The bucket is public:
-- the files are course material meant to be read by every visitor, and writes
-- still require the service-role key held by /api/upload.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
