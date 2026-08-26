-- supabase/games-schema.sql
-- Supabase ダッシュボード > SQL Editor で実行する（フェーズ3: 試合情報内製化）

create table public.games (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  title text not null,
  start_at timestamptz not null,
  venue text not null default '',
  opponent text not null,
  status text not null default 'scheduled' check (status in ('scheduled','finished','postponed')),
  our_score int,
  opp_score int,
  note text not null default '',
  opponent_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_start_idx on public.games (start_at);

alter table public.games enable row level security;

create policy "games_read_all" on public.games for select using (true);
create policy "games_admin_write" on public.games for all
  using (public.is_admin()) with check (public.is_admin());
