-- =====================================================================
--  Briquette du Kivu — Supabase schema
--  Run this in the Supabase dashboard → SQL Editor.
-- =====================================================================

-- Needed for gen_random_uuid() (available by default on Supabase, but safe to ensure).
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
--  posts table
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  title_fr        text,
  title_en        text,
  title_sw        text,
  body_fr         text,
  body_en         text,
  body_sw         text,
  cover_image_url text,
  author          text        not null default 'Guido Murhula Zigabe',
  category        text,
  published       boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- Speeds up the public query (published + newest first).
create index if not exists posts_published_created_idx
  on public.posts (published, created_at desc);

-- ---------------------------------------------------------------------
--  Row Level Security
-- ---------------------------------------------------------------------
alter table public.posts enable row level security;

-- Anyone (anon) can read ONLY published posts.
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts
  for select
  using (published = true);

-- Authenticated users (your admin account) can read everything,
-- including drafts, from the admin dashboard.
drop policy if exists "Authenticated can read all posts" on public.posts;
create policy "Authenticated can read all posts"
  on public.posts
  for select
  to authenticated
  using (true);

-- Authenticated users can create / update / delete posts.
drop policy if exists "Authenticated can insert posts" on public.posts;
create policy "Authenticated can insert posts"
  on public.posts
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update posts" on public.posts;
create policy "Authenticated can update posts"
  on public.posts
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete posts" on public.posts;
create policy "Authenticated can delete posts"
  on public.posts
  for delete
  to authenticated
  using (true);

-- =====================================================================
--  Storage bucket for cover images: 'blog-images'
--  ---------------------------------------------------------------------
--  Easiest path: create the bucket in the dashboard
--    (Storage → New bucket → name "blog-images" → mark as Public).
--  The statements below do the same thing via SQL.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public read access to files in the blog-images bucket.
drop policy if exists "Public can read blog images" on storage.objects;
create policy "Public can read blog images"
  on storage.objects
  for select
  using (bucket_id = 'blog-images');

-- Authenticated users can upload / update / delete images.
drop policy if exists "Authenticated can upload blog images" on storage.objects;
create policy "Authenticated can upload blog images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated can update blog images" on storage.objects;
create policy "Authenticated can update blog images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated can delete blog images" on storage.objects;
create policy "Authenticated can delete blog images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'blog-images');

-- =====================================================================
--  Create your admin login
--  Dashboard → Authentication → Users → "Add user"
--  (set email + password, then sign in with those on admin.html)
-- =====================================================================
