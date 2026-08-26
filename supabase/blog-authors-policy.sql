-- supabase/blog-authors-policy.sql
-- Supabase ダッシュボード > SQL Editor で実行する
-- 公開記事の著者に限り、匿名からの profiles 読み取りを許可（公開ページの「文責」表示用）
create policy "profiles_public_author_read" on public.profiles
  for select using (
    exists (
      select 1 from public.posts p
      where p.author_id = profiles.user_id and p.status = 'published'
    )
  );
