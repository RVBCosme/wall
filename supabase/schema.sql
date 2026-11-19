-- Wall: database setup for Supabase (run once in the SQL editor).

-- 1. Posts table: id, author name, message text, optional photo, timestamp.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(btrim(author_name)) between 1 and 40),
  message text not null check (char_length(btrim(message)) between 1 and 280),
  image_url text check (
    image_url is null
    or image_url like 'https://tndraxfhsyhakcfqgwnw.supabase.co/storage/v1/object/public/wall-photos/%'
  ),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- The server sets the id and time, so a visitor cannot backdate or pin a post.
create or replace function public.posts_set_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists posts_set_defaults on public.posts;
create trigger posts_set_defaults
  before insert on public.posts
  for each row execute function public.posts_set_defaults();

-- 2. Row Level Security: anyone can read and add posts; nobody can edit or delete them.
alter table public.posts enable row level security;

grant select, insert on public.posts to anon, authenticated;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can add a post" on public.posts;
create policy "Anyone can add a post"
  on public.posts for insert
  to anon, authenticated
  with check (true);

-- 3. Realtime: send new posts to open pages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end;
$$;

-- 4. Photo uploads: public bucket, images only, up to 5 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-photos', 'wall-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload wall photos" on storage.objects;
create policy "Anyone can upload wall photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'wall-photos');
