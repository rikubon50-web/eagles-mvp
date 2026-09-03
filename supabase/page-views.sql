-- 内製アクセス解析（2026-09-02）: 日別×ページ別のPVカウント
-- Supabase SQL Editor で実行してください。

create table public.page_views_daily (
  day date not null,
  path text not null,
  views int not null default 0,
  primary key (day, path)
);

alter table public.page_views_daily enable row level security;

-- 閲覧はログイン部員のみ（/admin/analytics で表示）。書き込みはRPC経由のみ
create policy "pv_read_authenticated" on public.page_views_daily
  for select to authenticated using (true);

-- 1PV加算（公開ページのみ・パスは200文字まで）
create or replace function public.log_page_view(p_path text)
returns void language sql security definer set search_path = public as $$
  insert into page_views_daily (day, path, views)
  select (now() at time zone 'Asia/Tokyo')::date, left(p_path, 200), 1
  where p_path like '/%' and p_path not like '/admin%'
  on conflict (day, path) do update set views = page_views_daily.views + 1;
$$;

revoke all on function public.log_page_view(text) from public;
grant execute on function public.log_page_view(text) to anon, authenticated;
