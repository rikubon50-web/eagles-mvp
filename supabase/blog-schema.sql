-- supabase/blog-schema.sql
-- Supabase ダッシュボード > SQL Editor で実行する（フェーズ2: ブログ内製化）

create table public.posts (
  id text primary key,
  title text not null,
  body text not null default '',
  thumbnail_url text,
  tags text[] not null default '{}',
  author_id uuid references public.profiles(user_id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_published_idx on public.posts (status, published_at desc);
create index posts_author_idx on public.posts (author_id);

alter table public.posts enable row level security;

-- 補助: admin 判定（profiles を再帰参照せず判定するため security definer）
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin');
$$;

-- 読み取り: 公開記事は誰でも / 下書きは本人と admin のみ
create policy "posts_read" on public.posts for select using (
  status = 'published' or author_id = auth.uid() or public.is_admin()
);
-- 作成: ログイン済みかつ author_id は自分
create policy "posts_insert_own" on public.posts for insert with check (
  auth.uid() is not null and author_id = auth.uid()
);
-- 更新・削除: 本人または admin（移行記事 author_id null は admin のみ）
create policy "posts_update" on public.posts for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin() or author_id is null);
create policy "posts_delete" on public.posts for delete using (
  author_id = auth.uid() or public.is_admin()
);

-- Storage: 公開バケット blog-images
insert into storage.buckets (id, name, public) values ('blog-images','blog-images', true);

create policy "blog_images_read" on storage.objects for select
  using (bucket_id = 'blog-images');
create policy "blog_images_insert" on storage.objects for insert
  with check (bucket_id = 'blog-images' and auth.uid() is not null);
