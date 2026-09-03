-- 星取表の大会名を管理画面から編集できるようにする（2026-09-02）
-- Supabase SQL Editor で実行してください。
-- 実行前でもサイトは既存の大会名（コード内の定数）で表示され続けます。

alter table public.standings_meta add column if not exists league_title text;

update public.standings_meta
  set league_title = '関東学生ラクロスリーグ戦2026 男子1部'
  where id = 1 and league_title is null;
