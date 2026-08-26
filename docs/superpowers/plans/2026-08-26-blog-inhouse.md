# ブログ内製化（フェーズ2）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブログの保存先を microCMS から Supabase に一元化し、部員全員がログインしてリッチテキストで記事を書ける `/admin/blog` を追加する。

**Architecture:** フェーズ1の Supabase 認証基盤（profiles / member・admin / RLS）に `posts` テーブルと Storage バケット `blog-images` を追加。エディタは Tiptap。画像はアップロード時にクライアント側で縮小し、同時に 1280x720 サムネイル版も生成して二枚一組で保存（サーバー側画像処理を持たない）。既存 1,699 記事は id を保持したまま移行し URL 不変。公開側は取得元切替＋ページング化。

**Tech Stack:** Next.js 14.2.5 / @supabase/ssr / Tiptap v2 / zod / vitest / pnpm

**Spec:** docs/superpowers/specs/2026-08-26-blog-inhouse-design.md

## Global Constraints

- pnpm / TypeScript strict / パス別名 `@/` = `src/`
- コミットは `feat:`/`fix:`/`chore:` + 日本語要約。**commit のみ、push はユーザー承認後**
- 既存 URL `/blog/{id}` は移行後も不変（移行記事は microCMS の id をそのまま `posts.id` に）
- 公開側の見た目（BlogCard のカードデザイン、詳細ページのレイアウト・metadata・JSON-LD）は踏襲
- 公開側 fetch は失敗時 throw（フェーズ1と同じ。ISR が前回成功ページを維持）
- 権限は「アプリ層チェック＋RLS」の二重防御。member=自分の記事のみ、admin=全記事
- microCMS の blog 以外（news/games/players/about）のコードには触れない
- 新規投稿の画像は Supabase Storage、既存記事の画像 URL（images.microcms-assets.io）はそのまま
- ツールバー: 太字/文字色/文字サイズ(小標準大)/見出し/箇条書き/中央寄せ/リンク/画像
- Supabase の環境変数はフェーズ1のものを使用（追加なし）

---

### Task 1: DB スキーマ・Storage バケット定義とユーザー実行

**Files:**
- Create: `supabase/blog-schema.sql`

**Interfaces:**
- Produces: `posts` テーブル、Storage バケット `blog-images`、RLS ポリシー一式（Supabase 本番に適用済みの状態）

**注意: SQL の実行は Supabase ダッシュボードでのユーザー作業。エージェントはファイル作成とコミットまで行い、実行はユーザーに依頼して完了を待つこと。**

- [ ] **Step 1: SQL ファイルを作成**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/blog-schema.sql
git commit -m "feat(blog): postsテーブルとblog-imagesバケットのスキーマ定義"
```

- [ ] **Step 3: ユーザーに SQL Editor での実行を依頼し、完了を待つ**

- [ ] **Step 4: 適用を検証**

Run: `curl -s "https://vfqvtcthmenqcbujguqn.supabase.co/rest/v1/posts?select=id&limit=1" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"`（.env.local のキーで）
Expected: `[]`（テーブル存在・RLS で空配列）

### Task 2: 依存追加

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: Tiptap 一式が import 可能

- [ ] **Step 1: インストール**

```bash
cd /Users/rikubon50/Desktop/eagles-mvp
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-text-align
```

- [ ] **Step 2: 型チェックと既存テスト**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: エラーなし / 15 tests pass

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(blog): Tiptap一式を追加"
```

### Task 3: ドメインロジック（検証・slug・ページング・クロップ計算）

**Files:**
- Create: `src/lib/posts-domain.ts`
- Test: `src/lib/__tests__/posts-domain.test.ts`

**Interfaces:**
- Produces:
  - `postInputSchema`: zod。`{ title: string(trim 1..120), body: string, tags: string[](各 trim 1..30, 最大10個), thumbnailUrl?: string | null }`
  - `type PostInput = z.infer<typeof postInputSchema>`
  - `newPostId(): string` — 12桁の英数字 slug（`crypto.randomUUID()` から生成）
  - `pageWindow(totalCount: number, page: number, perPage: number): { pageCount: number; page: number; from: number; to: number }` — page は 1..pageCount にクランプ。from/to は Supabase `.range()` 用の 0-indexed 閉区間
  - `cropRect(w: number, h: number): { sx: number; sy: number; sw: number; sh: number }` — 元画像 w×h から 1280:720 比の中央クロップ矩形（canvas drawImage 用）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/__tests__/posts-domain.test.ts
import { describe, it, expect } from "vitest";
import { postInputSchema, newPostId, pageWindow, cropRect } from "@/lib/posts-domain";

describe("postInputSchema", () => {
  const ok = { title: "t", body: "<p>a</p>", tags: ["ブログ"], thumbnailUrl: null };
  it("正しい入力を受理する", () => {
    expect(postInputSchema.safeParse(ok).success).toBe(true);
  });
  it("タイトル空白のみを拒否する", () => {
    expect(postInputSchema.safeParse({ ...ok, title: "  " }).success).toBe(false);
  });
  it("タグ11個を拒否する", () => {
    expect(postInputSchema.safeParse({ ...ok, tags: Array(11).fill("a") }).success).toBe(false);
  });
});

describe("newPostId", () => {
  it("12桁の英数字で毎回異なる", () => {
    const a = newPostId(); const b = newPostId();
    expect(a).toMatch(/^[a-z0-9]{12}$/);
    expect(a).not.toBe(b);
  });
});

describe("pageWindow", () => {
  it("2ページ目の範囲を返す", () => {
    expect(pageWindow(50, 2, 24)).toEqual({ pageCount: 3, page: 2, from: 24, to: 47 });
  });
  it("範囲外ページはクランプする", () => {
    expect(pageWindow(50, 99, 24).page).toBe(3);
    expect(pageWindow(0, 1, 24)).toEqual({ pageCount: 1, page: 1, from: 0, to: 23 });
  });
});

describe("cropRect", () => {
  it("縦長画像は上下をトリミングしない（幅基準・縦中央）", () => {
    // 1080x1440 → 16:9 は 1080x607.5 → sy = (1440-607.5)/2
    const r = cropRect(1080, 1440);
    expect(r.sw).toBe(1080);
    expect(Math.round(r.sh)).toBe(608);
    expect(r.sx).toBe(0);
  });
  it("横長すぎる画像は左右をトリミング（高さ基準・横中央）", () => {
    const r = cropRect(4000, 1000); // 16:9 なら幅 1777.8
    expect(r.sh).toBe(1000);
    expect(Math.round(r.sw)).toBe(1778);
    expect(r.sy).toBe(0);
  });
});
```

- [ ] **Step 2: FAIL を確認**

Run: `pnpm test`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: 実装**

```ts
// src/lib/posts-domain.ts
import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください").max(120),
  body: z.string(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  thumbnailUrl: z.string().url().nullable().optional(),
});
export type PostInput = z.infer<typeof postInputSchema>;

export function newPostId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function pageWindow(totalCount: number, page: number, perPage: number) {
  const pageCount = Math.max(1, Math.ceil(totalCount / perPage));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const from = (p - 1) * perPage;
  return { pageCount, page: p, from, to: from + perPage - 1 };
}

// 1280x720(16:9) 中央クロップの元画像側矩形
export function cropRect(w: number, h: number) {
  const target = 1280 / 720;
  if (w / h > target) {
    const sw = h * target;
    return { sx: (w - sw) / 2, sy: 0, sw, sh: h };
  }
  const sh = w / target;
  return { sx: 0, sy: (h - sh) / 2, sw: w, sh };
}
```

- [ ] **Step 4: PASS を確認**

Run: `pnpm test`
Expected: 全件 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/posts-domain.ts src/lib/__tests__/posts-domain.test.ts
git commit -m "feat(blog): 投稿ドメインロジック（検証・slug・ページング・クロップ計算）"
```

### Task 4: 移行スクリプト（microCMS → Supabase）と実行

**Files:**
- Create: `tmp-blog-migrate/migrate.mjs`

**Interfaces:**
- Consumes: `.env.local`（MICROCMS_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）
- Produces: `posts` に microCMS blog 全件（id 保持・status='published'・author_id null）

- [ ] **Step 1: スクリプト作成**

```js
// tmp-blog-migrate/migrate.mjs
// microCMS blog 全件を Supabase posts へ移行。id 保持・再実行安全（既存 id はスキップ）。
// 使い方: node tmp-blog-migrate/migrate.mjs  (ドライラン) / WRITE=1 で実行
import fs from "fs";
const ROOT = "/Users/rikubon50/Desktop/eagles-mvp";
const env = fs.readFileSync(`${ROOT}/.env.local`, "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const MC_KEY = process.env.MICROCMS_API_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WRITE = process.env.WRITE === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) microCMS 全件
const all = [];
for (let offset = 0; ; offset += 100) {
  const r = await fetch(
    `https://eagles-mvp.microcms.io/api/v1/blog?limit=100&offset=${offset}&orders=-publishedAt`,
    { headers: { "X-MICROCMS-API-KEY": MC_KEY } });
  const j = await r.json();
  all.push(...j.contents);
  if (offset + 100 >= j.totalCount) break;
  await sleep(200);
}
console.log(`microCMS: ${all.length}件`);

// 2) Supabase 側の既存 id
const sb = async (path, opts = {}) =>
  fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", ...(opts.headers || {}) },
  });
const existing = new Set();
for (let offset = 0; ; offset += 1000) {
  const r = await sb(`posts?select=id&limit=1000&offset=${offset}`);
  const rows = await r.json();
  rows.forEach((x) => existing.add(x.id));
  if (rows.length < 1000) break;
}
const todo = all.filter((c) => !existing.has(c.id));
console.log(`mode: ${WRITE ? "WRITE" : "DRY-RUN"} | 既存 ${existing.size} / 投入対象 ${todo.length}`);
if (!WRITE) process.exit(0);

// 3) 100件ずつ bulk insert
let ok = 0;
for (let i = 0; i < todo.length; i += 100) {
  const batch = todo.slice(i, i + 100).map((c) => ({
    id: c.id,
    title: c.title,
    body: c.body ?? "",
    thumbnail_url: c.thumbnail?.url ?? null,
    tags: c.tags ?? [],
    author_id: null,
    status: "published",
    published_at: c.publishedAt,
    created_at: c.createdAt,
    updated_at: c.updatedAt ?? c.createdAt,
  }));
  const r = await sb("posts", { method: "POST", body: JSON.stringify(batch) });
  if (!r.ok) throw new Error(`insert http ${r.status}: ${(await r.text()).slice(0, 300)}`);
  ok += batch.length;
  console.log(`${ok}/${todo.length}`);
  await sleep(300);
}
// 4) 件数照合
const cnt = await (await sb("posts?select=id", { headers: { Prefer: "count=exact", Range: "0-0" } })).headers;
console.log("完了。posts側件数ヘッダ:", cnt.get("content-range"));
```

- [ ] **Step 2: ドライラン→実行**

Run: `node tmp-blog-migrate/migrate.mjs` → 対象 1699 を確認後 `WRITE=1 node tmp-blog-migrate/migrate.mjs`
Expected: `content-range` の件数が microCMS の totalCount と一致（1699 以上。フェーズ2着手後に増えた分も含む）

- [ ] **Step 3: 抜き取り検証**

Run: `curl -s "$SB_URL/rest/v1/posts?id=eq.m53cidi8f9t&select=title,published_at,thumbnail_url" -H "apikey: $ANON_KEY"`
Expected: アメブロ取り込み記事がタイトル・日時つきで返る

- [ ] **Step 4: Commit**

```bash
git add tmp-blog-migrate/migrate.mjs
git commit -m "feat(blog): microCMS→Supabaseの全記事移行スクリプト（id保持・再実行安全）"
```

### Task 5: 公開側データ層（lib/posts.ts）

**Files:**
- Create: `src/lib/posts.ts`

**Interfaces:**
- Consumes: `createSupabasePublic`（フェーズ1）、`pageWindow`（Task 3）
- Produces:
  - `type Post = { id: string; title: string; body: string; thumbnailUrl: string | null; tags: string[]; publishedAt: string; authorName: string | null }`
  - `fetchPostsPage(opts: { page: number; q?: string; tag?: string }): Promise<{ posts: Post[]; totalCount: number; pageCount: number; page: number }>` — published のみ、published_at 降順、24件/ページ。q はタイトル ilike 部分一致、tag は tags 配列 contains。**失敗時 throw**
  - `fetchPostById(id: string): Promise<Post | null>` — published のみ（null=404 用）。失敗時 throw
  - `fetchLatestPosts(limit: number): Promise<Post[]>` — ホーム用。失敗時 throw
  - `collectTags(): Promise<string[]>` — 直近200件の published からユニークタグ（フィルタ UI 用）

**注意: authorName は posts→profiles の join（`profiles(name)`）。移行記事は null。ユニットテスト対象外（DB 層）。tsc と既存テストで検証。**

- [ ] **Step 1: 実装**

```ts
// src/lib/posts.ts
import { createSupabasePublic } from "@/lib/supabase/public";
import { pageWindow } from "@/lib/posts-domain";

export type Post = {
  id: string;
  title: string;
  body: string;
  thumbnailUrl: string | null;
  tags: string[];
  publishedAt: string;
  authorName: string | null;
};

const PER_PAGE = 24;
const SELECT = "id,title,body,thumbnail_url,tags,published_at,profiles(name)";

function toPost(r: any): Post {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    thumbnailUrl: r.thumbnail_url ?? null,
    tags: r.tags ?? [],
    publishedAt: r.published_at,
    authorName: r.profiles?.name ?? null,
  };
}

// 取得失敗時は throw し、ISR が前回成功ページを維持する（フェーズ1と同方針）
export async function fetchPostsPage(opts: { page: number; q?: string; tag?: string }) {
  const supabase = createSupabasePublic();
  let query = supabase
    .from("posts")
    .select(SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts.tag) query = query.contains("tags", [opts.tag]);

  const head = await supabase
    .from("posts").select("id", { count: "exact", head: true })
    .eq("status", "published")
    .ilike("title", opts.q ? `%${opts.q}%` : "%")
    .contains("tags", opts.tag ? [opts.tag] : []);
  if (head.error) throw head.error;
  const totalCount = head.count ?? 0;
  const { pageCount, page, from, to } = pageWindow(totalCount, opts.page, PER_PAGE);

  const { data, error } = await query.range(from, to);
  if (error) throw error;
  return { posts: (data ?? []).map(toPost), totalCount, pageCount, page };
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("posts").select(SELECT).eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data ? toPost(data) : null;
}

export async function fetchLatestPosts(limit: number): Promise<Post[]> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("posts").select(SELECT).eq("status", "published")
    .order("published_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(toPost);
}

export async function collectTags(): Promise<string[]> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("posts").select("tags").eq("status", "published")
    .order("published_at", { ascending: false }).limit(200);
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => (r.tags ?? []).forEach((t: string) => set.add(t)));
  return [...set];
}
```

- [ ] **Step 2: 検証と Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/lib/posts.ts
git commit -m "feat(blog): 公開側データ層（ページング・検索・タグ絞り込み）"
```

### Task 6: 公開側切替 — 詳細ページとホーム

**Files:**
- Modify: `src/app/blog/[id]/page.tsx`（取得元のみ。metadata/JSON-LD/JSX の構造は踏襲、フィールド名を Post 型へ追従）
- Modify: `src/components/sections/BlogSection.tsx`（`fetchLatestPosts` へ切替）

**Interfaces:**
- Consumes: `fetchPostById` / `fetchLatestPosts`（Task 5）

- [ ] **Step 1: 詳細ページ切替** — `fetchBlogById` → `fetchPostById`。`item.thumbnail?.url` → `item.thumbnailUrl`（width/height は 1280/720 固定でよい）。authorName があれば著者表示を日付の横に追加（`item.authorName && <span>文責: {item.authorName}</span>` 程度の控えめな表示）
- [ ] **Step 2: BlogSection 切替** — 現在 `fetchBlogList()` で全件取得している箇所を `fetchLatestPosts(表示件数)` に。BlogCard へ渡す props の形を合わせる（BlogCard が microCMS 型に依存している場合は `{ id, title, thumbnail, publishedAt }` 相当の互換オブジェクトを組み立てるか、BlogCard の props 型をローカル定義に差し替え）
- [ ] **Step 3: ローカル確認** — dev サーバーで `/blog/m53cidi8f9t`（移行記事）とホームのブログ欄が表示されること
- [ ] **Step 4: 検証と Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add -A src/app/blog src/components
git commit -m "feat(blog): 詳細ページとホームをSupabase取得に切替"
```

### Task 7: 公開側切替 — 一覧のページング化

**Files:**
- Modify: `src/app/blog/page.tsx`（searchParams 対応のサーバーコンポーネント化）
- Modify or Replace: `src/components/BlogFilterList.tsx`（クライアント全件フィルタ → サーバー駆動。検索ボックスとタグボタンは router.push で `?q=&tag=&page=` を更新する薄いクライアント部品に）
- Create: `src/components/Pagination.tsx`

**Interfaces:**
- Consumes: `fetchPostsPage` / `collectTags`（Task 5）
- Produces: `/blog?page=2&q=検索語&tag=新歓2026` 形式の URL。`Pagination` は `{ page, pageCount, basePath, params }` を受けて前後リンクとページ番号を描画

- [ ] **Step 1: 実装** — page.tsx で `searchParams` を受け `fetchPostsPage` を呼ぶ。`export const revalidate = 300` 維持。カード表示は既存 BlogCard を踏襲し件数表示（`{totalCount}件`）も維持
- [ ] **Step 2: ローカル確認** — `/blog`（1ページ目24件）、`/blog?page=2`、検索、タグ絞り込み、0件時の空表示
- [ ] **Step 3: 検証と Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add -A src/app/blog src/components
git commit -m "feat(blog): 一覧をサーバー駆動のページング・検索・タグ絞り込みに変更"
```

### Task 8: 画像アップロード API とクライアント画像処理

**Files:**
- Create: `src/app/api/admin/upload/route.ts`
- Create: `src/lib/image-client.ts`（クライアント専用ユーティリティ）

**Interfaces:**
- Consumes: `createSupabaseServer`（認可）、`cropRect`（Task 3）
- Produces:
  - `POST /api/admin/upload` — FormData `{ image: File(縮小済み本体), thumb: File(1280x720) , postId: string }`。認証必須。戻り値 `{ url: string, thumbUrl: string }`。保存先 `blog-images/{userId}/{postId}/{timestamp}.jpg` と `...-thumb.jpg`
  - `prepareImageForUpload(file: File): Promise<{ image: Blob; thumb: Blob }>` — canvas で長辺 1600px に縮小(JPEG q0.85)＋ `cropRect` で 1280x720 サムネイル生成。HEIC 等 canvas 非対応形式はブラウザのデコードに任せ、失敗時はエラーを投げる（呼び出し側でメッセージ表示）

- [ ] **Step 1: route.ts 実装**

```ts
// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const image = form.get("image") as File | null;
  const thumb = form.get("thumb") as File | null;
  const postId = String(form.get("postId") ?? "");
  if (!image || !thumb || !/^[a-z0-9_-]{1,64}$/i.test(postId)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "画像が大きすぎます（5MBまで）" }, { status: 413 });
  }
  const ts = Date.now();
  const base = `${user.id}/${postId}/${ts}`;
  const up1 = await supabase.storage.from("blog-images")
    .upload(`${base}.jpg`, image, { contentType: "image/jpeg" });
  if (up1.error) return NextResponse.json({ error: up1.error.message }, { status: 500 });
  const up2 = await supabase.storage.from("blog-images")
    .upload(`${base}-thumb.jpg`, thumb, { contentType: "image/jpeg" });
  if (up2.error) return NextResponse.json({ error: up2.error.message }, { status: 500 });

  const pub = (p: string) => supabase.storage.from("blog-images").getPublicUrl(p).data.publicUrl;
  return NextResponse.json({ url: pub(`${base}.jpg`), thumbUrl: pub(`${base}-thumb.jpg`) });
}
```

- [ ] **Step 2: image-client.ts 実装**

```ts
// src/lib/image-client.ts — ブラウザ専用（canvas）
import { cropRect } from "@/lib/posts-domain";

async function decode(file: File): Promise<ImageBitmap> {
  try { return await createImageBitmap(file); }
  catch { throw new Error("この画像形式は使用できません。スクリーンショット等のJPEG/PNGでお試しください"); }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("画像の変換に失敗しました"))), "image/jpeg", 0.85));
}

export async function prepareImageForUpload(file: File): Promise<{ image: Blob; thumb: Blob }> {
  const bmp = await decode(file);
  // 本体: 長辺1600pxへ縮小
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c1 = document.createElement("canvas");
  c1.width = Math.round(bmp.width * scale);
  c1.height = Math.round(bmp.height * scale);
  c1.getContext("2d")!.drawImage(bmp, 0, 0, c1.width, c1.height);
  // サムネ: 1280x720 中央クロップ
  const { sx, sy, sw, sh } = cropRect(bmp.width, bmp.height);
  const c2 = document.createElement("canvas");
  c2.width = 1280; c2.height = 720;
  c2.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, 1280, 720);
  return { image: await toBlob(c1), thumb: await toBlob(c2) };
}
```

- [ ] **Step 3: 検証** — `pnpm exec tsc --noEmit && pnpm test`、curl で未認証 POST → 401
- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/upload src/lib/image-client.ts
git commit -m "feat(blog): 画像アップロードAPI（縮小本体＋1280x720サムネの二枚組）"
```

### Task 9: 記事の保存・公開・削除 Server Actions

**Files:**
- Create: `src/app/admin/blog/actions.ts`

**Interfaces:**
- Consumes: `getProfile`（フェーズ1）、`createSupabaseServer`、`postInputSchema` / `newPostId`（Task 3）
- Produces:
  - `savePost(input: { id: string; title: string; body: string; tags: string[]; thumbnailUrl: string | null; publish: boolean }): Promise<{ ok: true; id: string } | { ok: false; error: string }>`
    - **id は常にエディタ側で確定済み**（新規はエディタ初期化時に `newPostId()` で採番。画像アップロードが保存前でも postId を持てるようにするため）。DB に存在しなければ insert（author_id=自分）、存在すれば本人 or admin のみ update（RLS も強制）
    - publish=true で status='published'、published_at は未設定時のみ now()（再公開で日付を巻き戻さない）
    - publish 時に `revalidatePath("/blog")`, `revalidatePath("/blog/" + id)`, `revalidatePath("/")`
  - `deletePost(id: string): Promise<{ ok: boolean; error?: string }>` — 本人 or admin。成功時同様に revalidate

- [ ] **Step 1: 実装**

```ts
// src/app/admin/blog/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { postInputSchema, newPostId } from "@/lib/posts-domain";

type SaveInput = {
  id: string; // 新規もエディタ側で newPostId() 採番済み
  title: string;
  body: string;
  tags: string[];
  thumbnailUrl: string | null;
  publish: boolean;
};

export async function savePost(input: SaveInput):
  Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "ログインしてください" };

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }
  if (!/^[a-z0-9_-]{1,64}$/i.test(input.id)) {
    return { ok: false, error: "不正な記事IDです" };
  }
  const supabase = createSupabaseServer();
  const id = input.id;

  // 存在すれば update / なければ insert（id はエディタ採番済み）
  const { data: cur } = await supabase.from("posts")
    .select("author_id,status,published_at").eq("id", id).maybeSingle();

  if (cur) {
    // 既存: 所有者チェック（RLS でも守られるがメッセージのため事前確認）
    if (cur.author_id !== profile.userId && profile.role !== "admin") {
      return { ok: false, error: "この記事を編集する権限がありません" };
    }
    const { error } = await supabase.from("posts").update({
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      thumbnail_url: parsed.data.thumbnailUrl ?? null,
      ...(input.publish
        ? { status: "published", published_at: cur.published_at ?? new Date().toISOString() }
        : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      console.error("savePost update failed:", error);
      return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
    }
  } else {
    const { error } = await supabase.from("posts").insert({
      id,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      thumbnail_url: parsed.data.thumbnailUrl ?? null,
      author_id: profile.userId,
      status: input.publish ? "published" : "draft",
      published_at: input.publish ? new Date().toISOString() : null,
    });
    if (error) {
      console.error("savePost insert failed:", error);
      return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
    }
  }

  if (input.publish) {
    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidatePath("/");
  }
  return { ok: true, id };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "ログインしてください" };
  const supabase = createSupabaseServer();
  const { data: cur } = await supabase.from("posts")
    .select("author_id").eq("id", id).maybeSingle();
  if (!cur) return { ok: false, error: "記事が見つかりません" };
  if (cur.author_id !== profile.userId && profile.role !== "admin") {
    return { ok: false, error: "この記事を削除する権限がありません" };
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost failed:", error);
    return { ok: false, error: "削除に失敗しました" };
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  revalidatePath("/");
  return { ok: true };
}
```

- [ ] **Step 2: 検証と Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/app/admin/blog/actions.ts
git commit -m "feat(blog): 記事の保存・公開・削除Server Actions（権限二重チェック）"
```

### Task 10: Tiptap エディタコンポーネント

**Files:**
- Create: `src/app/admin/blog/PostEditor.tsx`（"use client"）

**Interfaces:**
- Consumes: `prepareImageForUpload`（Task 8）、`savePost`（Task 9）、Tiptap（Task 2）
- Produces: `<PostEditor initial={{ id, title, body, tags, thumbnailUrl } | null} />`
  - **新規（initial=null）の場合、コンポーネント初期化時に `newPostId()` で id を採番して保持**（画像アップロードの postId と savePost の id に同じ値を使う）
  - ツールバー: 太字 / 文字色(パレット8色) / 文字サイズ(小=0.85em・標準・大=1.4em を TextStyle の fontSize で) / 見出し(h2) / 箇条書き / 中央寄せ / リンク / 画像挿入
  - 画像挿入: file input → `prepareImageForUpload` → `/api/admin/upload` → 本文へ `<img src>` 挿入。アップロードした画像の `url→thumbUrl` 対応を state に保持
  - 保存時: 本文 HTML 先頭の `<img>` の src が対応表にあればその thumbUrl を thumbnailUrl に。なければ既存 thumbnailUrl を維持（移行記事の microCMS サムネを壊さない）
  - 「下書き保存」「公開する」ボタン → `savePost`。成功時 `/admin/blog` へ戻る。失敗時は入力保持のままエラー表示
  - タグ入力: カンマ区切りテキスト（既定 "ブログ"）

**実装メモ（実装者向け）:**
- fontSize は TextStyle 拡張の `addAttributes` で実現（`@tiptap/extension-text-style` を拡張し `fontSize` 属性 + `style="font-size:..."` レンダー）。既製 `@tiptap/extension-font-size` は v2 系に無いため自作 10 行程度
- `immediatelyRender: false` を useEditor に渡し SSR ハイドレーション警告を回避
- エディタ本文には `prose` 相当の既存記事表示と同じ見た目の className を当てる（公開ページと執筆画面の見た目を揃える）
- 全コードは 250 行程度に収まる見込み。300 行を大きく超えそうなら DONE_WITH_CONCERNS で報告

- [ ] **Step 1: 実装**（上記インターフェース・メモに従う）
- [ ] **Step 2: 検証** — `pnpm exec tsc --noEmit && pnpm test`
- [ ] **Step 3: Commit**

```bash
git add src/app/admin/blog/PostEditor.tsx
git commit -m "feat(blog): Tiptapリッチテキストエディタ（画像・色・サイズ・サムネ自動）"
```

### Task 11: 管理画面ページ（一覧・新規・編集）

**Files:**
- Create: `src/app/admin/blog/page.tsx`（記事一覧）
- Create: `src/app/admin/blog/new/page.tsx`
- Create: `src/app/admin/blog/[id]/page.tsx`（編集）

**Interfaces:**
- Consumes: `getProfile`、`createSupabaseServer`、`PostEditor`（Task 10）、`deletePost`（Task 9）、`logout`（フェーズ1）
- Produces:
  - `/admin/blog`: 自分の記事一覧（admin は全件）。status バッジ（下書き/公開中）、日付降順、新規作成ボタン、各行に編集リンクと削除ボタン（confirm ダイアログ）。20件ずつの「もっと見る」でよい（?page= 方式）
  - `/admin/blog/new`: `<PostEditor initial={null} />`
  - `/admin/blog/[id]`: 対象記事を取得し所有者 or admin のみ `<PostEditor initial={...} />`。権限なし・存在しない場合は 404（`notFound()`）
  - いずれも未ログインは middleware でリダイレクト済み（追加のガードとして getProfile null チェック）

- [ ] **Step 1: 実装**（スタイルは /admin/standings と同じトーン: bg-slate-50、カード、緑アクセント）
- [ ] **Step 2: 検証** — dev サーバーで未認証 `/admin/blog` → login へ 307
- [ ] **Step 3: Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/app/admin/blog
git commit -m "feat(blog): 部員向け記事管理画面（一覧・新規・編集）"
```

### Task 12: microCMS blog 依存の除去とビルド確認

**Files:**
- Modify: `src/lib/microcms.ts`（`Blog` 型・`fetchBlogList`・`fetchBlogById` を削除。news/games/players/about は不変）
- Modify: `src/app/sitemap.ts`（blog 部分を `fetchPostsPage` ベース（全公開記事の id/日時）に差し替え。posts 用に `fetchAllPostIds(): Promise<{id: string; updatedAt: string}[]>` を lib/posts.ts へ追加してよい）

- [ ] **Step 1: 参照確認** — `grep -rn "fetchBlogList\|fetchBlogById\|Blog\b" src/` で blog 依存の残りを列挙し、すべて posts 版へ
- [ ] **Step 2: 削除・差し替え実施**
- [ ] **Step 3: 全体検証**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: すべて成功

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(blog): microCMS blog依存を除去（news/games/players/aboutは維持）"
```

### Task 13: E2E 検証（コントローラ実施）と本番リリース

**Files:** なし（検証と運用）

**注意: ブラウザ E2E・push・本番確認はコントローラ（またはユーザー確認のもと）で実施。**

- [ ] **Step 1: ローカル E2E**
  1. member アカウントで `/admin/blog` → 新規作成 → 文字装飾＋画像挿入 → 下書き保存 → 一覧に「下書き」表示・公開側に出ないこと
  2. 公開する → `/blog` 一覧の先頭と詳細ページに即反映、サムネイル自動設定
  3. 別 member の記事 `/admin/blog/[id]` 直叩き → 404
  4. admin で移行記事（author null）を編集・保存できること
  5. 削除 → 公開側から消えること
  6. スマホ幅(375px)でエディタ操作
- [ ] **Step 2: 移行整合の最終確認** — posts 件数 = microCMS blog 件数、`/blog/{既存id}` 数件が 200
- [ ] **Step 3: ユーザー承認のうえ push**（Vercel 自動デプロイ）
- [ ] **Step 4: 本番確認** — 公開一覧・詳細・管理画面ログイン・1件テスト投稿→削除
- [ ] **Step 5: 運用切替の案内** — 部員への告知文（アメブロ廃止・今後はサイトで直接執筆）をユーザーに提示
