-- MO Content Space — Supabase schema (PRD §4, §8, SEC-01)
-- Run in the Supabase SQL editor. Every table is owner-scoped with Row Level Security.
-- `synced_at` is set by the server on every write and drives the pull cursor (avoids client clock drift).

create extension if not exists "pgcrypto";

create or replace function public.touch_synced_at() returns trigger language plpgsql as $$
begin
  new.synced_at := now();
  return new;
end $$;

-- Common columns: id, user_id, created_at, updated_at, deleted_at (tombstone), version, synced_at

create table if not exists public.categories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  normalized text not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);
create unique index if not exists categories_unique_name on public.categories (user_id, normalized) where deleted_at is null;

create table if not exists public.ideas (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text, body text,
  status text not null default 'new' check (status in ('new','in_progress','completed')),
  category_id uuid references public.categories(id) on delete set null,
  cover_attachment_id uuid,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  kind text not null check (kind in ('image','audio','url')),
  external_url text check (external_url is null or external_url ~* '^https?://'),
  mime text, size bigint, file_name text, duration_ms integer,
  storage_key text, upload_state text not null default 'pending', note text,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);

create table if not exists public.transcripts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  text text not null default '', status text not null default 'done', language text,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);

create table if not exists public.platform_plans (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  platform text not null check (platform in ('tiktok','instagram','linkedin','x','youtube','facebook','other')),
  other_label text, notes text, caption text, target_at timestamptz,
  publish_state text not null default 'draft' check (publish_state in ('draft','in_progress','ready','published')),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);
create unique index if not exists platform_plans_unique on public.platform_plans (idea_id, platform) where deleted_at is null and platform <> 'other';

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  platform_plan_id uuid references public.platform_plans(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text,
  is_completed boolean not null default false, completed_at timestamptz,
  due_date date, due_time time, timezone text,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  mode text not null check (mode in ('at_due','before','custom')),
  offset_minutes integer, remind_at timestamptz not null, snoozed_until timestamptz,
  state text not null default 'scheduled' check (state in ('scheduled','fired','done','cancelled')),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null default 0, synced_at timestamptz not null default now()
);

-- Triggers, indexes and RLS for every user table
do $$
declare t text;
begin
  foreach t in array array['categories','ideas','attachments','transcripts','platform_plans','tasks','reminders'] loop
    execute format('drop trigger if exists %I_synced on public.%I', t, t);
    execute format('create trigger %I_synced before insert or update on public.%I for each row execute function public.touch_synced_at()', t, t);
    execute format('create index if not exists %I_user_synced on public.%I (user_id, synced_at)', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_owner" on public.%I', t, t);
    execute format('create policy "%s_owner" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Child rows must point at parents owned by the same user (prevents cross-account references).
create or replace function public.check_same_owner() returns trigger language plpgsql security definer set search_path = public as $$
declare parent_owner uuid;
begin
  if tg_table_name = 'attachments' or tg_table_name = 'platform_plans' then
    select user_id into parent_owner from public.ideas where id = new.idea_id;
  elsif tg_table_name = 'tasks' then
    if new.idea_id is null then return new; end if;
    select user_id into parent_owner from public.ideas where id = new.idea_id;
  elsif tg_table_name = 'transcripts' then
    select user_id into parent_owner from public.attachments where id = new.attachment_id;
  elsif tg_table_name = 'reminders' then
    select user_id into parent_owner from public.tasks where id = new.task_id;
  elsif tg_table_name = 'ideas' then
    if new.category_id is null then return new; end if;
    select user_id into parent_owner from public.categories where id = new.category_id;
  end if;
  if parent_owner is distinct from new.user_id then
    raise exception 'cross-owner reference rejected';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['ideas','attachments','transcripts','platform_plans','tasks','reminders'] loop
    execute format('drop trigger if exists %I_same_owner on public.%I', t, t);
    execute format('create trigger %I_same_owner before insert or update on public.%I for each row execute function public.check_same_owner()', t, t);
  end loop;
end $$;

-- Private media bucket; objects live under <user_id>/<attachment_id>
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "media_owner_rw" on storage.objects;
create policy "media_owner_rw" on storage.objects for all to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
