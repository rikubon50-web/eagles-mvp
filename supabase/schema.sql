-- supabase/schema.sql
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行する

create table public.standings_rows (
  id uuid primary key default gen_random_uuid(),
  block text not null check (block in ('A','B')),
  rank int not null,
  university text not null,
  points int not null default 0,
  games int not null default 0,
  gf int not null default 0,
  diff int not null default 0,
  sort_order int not null
);

create table public.standings_meta (
  id int primary key check (id = 1),
  updated_at timestamptz not null default now()
);
insert into public.standings_meta (id) values (1);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('member','admin'))
);

alter table public.standings_rows enable row level security;
alter table public.standings_meta enable row level security;
alter table public.profiles enable row level security;

-- 星取表: 誰でも読める / admin だけ書ける
create policy "standings_read_all" on public.standings_rows
  for select using (true);
create policy "standings_admin_write" on public.standings_rows
  for all using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  );

create policy "meta_read_all" on public.standings_meta
  for select using (true);
create policy "meta_admin_update" on public.standings_meta
  for update using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  );

-- プロフィール: 本人のみ読み書き。insert 時 role は member 固定
-- （admin 昇格は Supabase ダッシュボードから手動。全件読取はフェーズ2で検討）
create policy "profiles_own_select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_own_insert" on public.profiles
  for insert with check (auth.uid() = user_id and role = 'member');
create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and role = (select role from public.profiles where user_id = auth.uid()));
