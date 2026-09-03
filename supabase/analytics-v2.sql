-- アナリティクス強化（2026-09-03）: 訪問者数・流入元・デバイス
-- Supabase SQL Editor で実行してください。

-- 日別ユニーク訪問者（匿名ID。個人情報は持たない）
create table public.visitors_daily (
  day date not null,
  visitor text not null,
  primary key (day, visitor)
);

-- 日別の属性カウント（kind='referrer'|'device'）
create table public.site_stats_daily (
  day date not null,
  kind text not null,
  key text not null,
  count int not null default 0,
  primary key (day, kind, key)
);

alter table public.visitors_daily enable row level security;
alter table public.site_stats_daily enable row level security;

create policy "vd_read_authenticated" on public.visitors_daily
  for select to authenticated using (true);
create policy "ssd_read_authenticated" on public.site_stats_daily
  for select to authenticated using (true);

-- 1アクセスの記録: PV加算＋（セッション開始時のみ）流入元・デバイス・訪問者
create or replace function public.log_visit(
  p_path text,
  p_source text default null,
  p_device text default null,
  p_visitor text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if p_path like '/%' and p_path not like '/admin%' then
    insert into page_views_daily (day, path, views) values (d, left(p_path, 200), 1)
      on conflict (day, path) do update set views = page_views_daily.views + 1;
  end if;
  if p_source is not null and length(p_source) between 1 and 100 then
    insert into site_stats_daily (day, kind, key, count) values (d, 'referrer', p_source, 1)
      on conflict (day, kind, key) do update set count = site_stats_daily.count + 1;
  end if;
  if p_device in ('mobile', 'desktop') then
    insert into site_stats_daily (day, kind, key, count) values (d, 'device', p_device, 1)
      on conflict (day, kind, key) do update set count = site_stats_daily.count + 1;
  end if;
  if p_visitor ~ '^[0-9a-f-]{16,64}$' then
    insert into visitors_daily (day, visitor) values (d, p_visitor)
      on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.log_visit(text, text, text, text) from public;
grant execute on function public.log_visit(text, text, text, text) to anon, authenticated;
