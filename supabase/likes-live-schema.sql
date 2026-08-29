-- スキ♡・閲覧数 ＋ 試合速報LIVE 用スキーマ変更
-- Supabase ダッシュボードの SQL Editor で1回だけ実行する。
-- 方針: 記事・試合の書き込み権限は一切広げない。
--       カウント加算は下記の専用RPC（security definer + 加算クランプ）のみ。

-- ① ブログ: スキ・閲覧数
alter table public.posts add column like_count int not null default 0;
alter table public.posts add column view_count int not null default 0;

-- スキの増減（±1にクランプ・0未満にならない・公開記事のみ）。現在値を返す
create or replace function public.increment_post_like(p_id text, delta int)
returns int language sql security definer set search_path = public as $$
  update posts
    set like_count = greatest(0, like_count + (case when delta >= 0 then 1 else -1 end))
    where id = p_id and status = 'published'
    returning like_count;
$$;

-- 閲覧数の加算（公開記事のみ）
create or replace function public.increment_post_view(p_id text)
returns void language sql security definer set search_path = public as $$
  update posts set view_count = view_count + 1
    where id = p_id and status = 'published';
$$;

revoke all on function public.increment_post_like(text, int) from public;
revoke all on function public.increment_post_view(text) from public;
grant execute on function public.increment_post_like(text, int) to anon, authenticated;
grant execute on function public.increment_post_view(text) to anon, authenticated;

-- ② games: live ステータス追加
alter table public.games drop constraint games_status_check;
alter table public.games add constraint games_status_check
  check (status in ('scheduled','live','finished','postponed'));
