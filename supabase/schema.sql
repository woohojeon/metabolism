-- Roster of accounts allowed to sign in to the site.
-- Run this once in the Supabase dashboard: SQL Editor → New query → Run.
--
-- Two things that bite when running it again after adding a table here:
--
--   * The editor runs the whole script as one transaction, so a single failing
--     statement rolls back the rest — including the new table, which then
--     appears simply not to have been created. The storage.buckets insert at
--     the bottom is the one that fails on projects where it is not owned.
--     Running just the new section on its own avoids this.
--   * PostgREST answers from a cached picture of the schema, and a fresh table
--     can be missing from it for a while — the API reports "Could not find the
--     table ... in the schema cache" although the table is there. To settle it
--     at once:  notify pgrst, 'reload schema';

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

-- --------------------------------------------------------------------- board

-- The three boards, in one table: 공지사항 (notice), Q&A (qa) and 건의사항
-- (suggestion). They differ only in who may write and who may read, which is
-- decided in /api/board, so one table with a category column is the whole of
-- it.
--
-- `author_username` is written from the signed session cookie, never from the
-- request body: it is what makes "only the administrator can see who asked
-- this" mean anything.
create table if not exists public.board_posts (
  id              uuid primary key default gen_random_uuid(),
  category        text not null check (category in ('notice', 'qa', 'suggestion')),
  title           text not null,
  body            text not null,
  -- Attached image URLs (Storage links, in the order they were added). The
  -- body itself is a small subset of HTML — bold/italic/underline and
  -- super/subscripts, the same as an article Overview — sanitised on render.
  images          text[] not null default '{}',
  -- Documents hung off a post: the 한글(.hwp/.hwpx) and PDF handouts a 공지사항
  -- refers to. A jsonb list of { name, url, size } rather than a second text[],
  -- because a download needs the name it saves back under and the size a reader
  -- decides from. `url` always points into the uploads bucket; /api/board
  -- refuses any other address.
  files           jsonb not null default '[]'::jsonb,
  author_username text not null,
  author_name     text not null default '',
  -- The administrator's answer, shown under the post to its author, with its
  -- own attached images.
  reply           text,
  reply_images    text[] not null default '{}',
  replied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Adds the attachment columns to a board_posts table created before they
-- existed. Safe to run again; a no-op once the columns are there.
alter table public.board_posts
  add column if not exists images text[] not null default '{}';
alter table public.board_posts
  add column if not exists reply_images text[] not null default '{}';
alter table public.board_posts
  add column if not exists files jsonb not null default '[]'::jsonb;

-- Every list is "this category, newest first".
create index if not exists board_posts_category_created_idx
  on public.board_posts (category, created_at desc);

-- RLS on with no policies, as elsewhere: the anon key can reach nothing, and a
-- Q&A the browser could read directly would not be private at all. Everything
-- goes through /api/board, which decides row by row what the caller may see.
alter table public.board_posts enable row level security;

-- ------------------------------------------------------------------- uploads

-- Images and slide decks are far too large for a jsonb row, so they go to
-- Storage and only their URL is kept in site_content. The bucket is public:
-- the files are course material meant to be read by every visitor, and writes
-- still require the service-role key held by /api/upload.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
