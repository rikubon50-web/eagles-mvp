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
  likeCount: number;
  viewCount: number;
};

// 一覧・トップの新着表示など本文を描画しない画面向け（egress 削減のため body を含めない）
export type PostSummary = Omit<Post, "body">;

const PER_PAGE = 24;
const SELECT = "id,title,body,thumbnail_url,tags,published_at,like_count,view_count,profiles(name)";
const SUMMARY_SELECT = "id,title,thumbnail_url,tags,published_at,like_count,view_count,profiles(name)";

// likes-live-schema.sql 適用前の DB には like_count / view_count 列がない。
// 適用前でもビルド・公開ページが壊れないよう、未定義列エラー時は旧SELECTへフォールバックする
// （そのとき likeCount / viewCount は 0 になる）。SQL適用後はこの経路は通らない。
const SELECT_LEGACY = "id,title,body,thumbnail_url,tags,published_at,profiles(name)";
const SUMMARY_SELECT_LEGACY = "id,title,thumbnail_url,tags,published_at,profiles(name)";

// 管理画面（/admin/blog）のフォールバック判定でも使うため export
export function isMissingCountColumns(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === "42703"; // undefined_column
}

function toPost(r: any): Post {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    thumbnailUrl: r.thumbnail_url ?? null,
    tags: r.tags ?? [],
    publishedAt: r.published_at,
    authorName: r.profiles?.name ?? null,
    likeCount: r.like_count ?? 0,
    viewCount: r.view_count ?? 0,
  };
}

function toSummary(r: any): PostSummary {
  return {
    id: r.id,
    title: r.title,
    thumbnailUrl: r.thumbnail_url ?? null,
    tags: r.tags ?? [],
    publishedAt: r.published_at,
    authorName: r.profiles?.name ?? null,
    likeCount: r.like_count ?? 0,
    viewCount: r.view_count ?? 0,
  };
}

// 取得失敗時は throw し、ISR が前回成功ページを維持する（フェーズ1と同方針）
export async function fetchPostsPage(opts: { page: number; q?: string; tag?: string }) {
  try {
    return await fetchPostsPageWith(SUMMARY_SELECT, opts);
  } catch (e) {
    if (isMissingCountColumns(e)) return fetchPostsPageWith(SUMMARY_SELECT_LEGACY, opts);
    throw e;
  }
}

async function fetchPostsPageWith(
  select: string,
  opts: { page: number; q?: string; tag?: string }
) {
  const supabase = createSupabasePublic();
  const buildQuery = () => {
    let query = supabase
      .from("posts")
      .select(select, { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (opts.q) query = query.ilike("title", `%${opts.q}%`);
    if (opts.tag) query = query.contains("tags", [opts.tag]);
    return query;
  };

  // count 取得のための別クエリを持たず、要求ページのレンジで1回のクエリに集約する
  const requestedPage = Math.max(1, Math.floor(opts.page) || 1);
  const initialFrom = (requestedPage - 1) * PER_PAGE;
  const initialTo = initialFrom + PER_PAGE - 1;

  const first = await buildQuery().range(initialFrom, initialTo);
  if (first.error) throw first.error;
  let data = first.data;
  const totalCount = first.count ?? 0;
  const { pageCount, page, from, to } = pageWindow(totalCount, requestedPage, PER_PAGE);

  // 要求ページが総ページ数を超えていて空振りした場合のみ、クランプ後のページで再取得する
  if (requestedPage > pageCount && (data ?? []).length === 0 && totalCount > 0) {
    const retry = await buildQuery().range(from, to);
    if (retry.error) throw retry.error;
    data = retry.data;
  }

  return { posts: (data ?? []).map(toSummary), totalCount, pageCount, page };
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const supabase = createSupabasePublic();
  const run = async (select: string) =>
    supabase.from("posts").select(select).eq("id", id).eq("status", "published").maybeSingle();
  let { data, error } = await run(SELECT);
  if (error && isMissingCountColumns(error)) ({ data, error } = await run(SELECT_LEGACY));
  if (error) throw error;
  return data ? toPost(data) : null;
}

export async function fetchLatestPosts(limit: number): Promise<PostSummary[]> {
  const supabase = createSupabasePublic();
  const run = async (select: string) =>
    supabase.from("posts").select(select).eq("status", "published")
      .order("published_at", { ascending: false }).limit(limit);
  let { data, error } = await run(SUMMARY_SELECT);
  if (error && isMissingCountColumns(error)) ({ data, error } = await run(SUMMARY_SELECT_LEGACY));
  if (error) throw error;
  return (data ?? []).map(toSummary);
}

// 記事ページの前後ナビ用。prev = 1つ古い記事、next = 1つ新しい記事
export async function fetchAdjacentPosts(
  publishedAt: string
): Promise<{ prev: PostSummary | null; next: PostSummary | null }> {
  const supabase = createSupabasePublic();
  const run = async (select: string) =>
    Promise.all([
      supabase.from("posts").select(select).eq("status", "published")
        .lt("published_at", publishedAt).order("published_at", { ascending: false }).limit(1),
      supabase.from("posts").select(select).eq("status", "published")
        .gt("published_at", publishedAt).order("published_at", { ascending: true }).limit(1),
    ]);
  let [older, newer] = await run(SUMMARY_SELECT);
  if (isMissingCountColumns(older.error ?? newer.error)) [older, newer] = await run(SUMMARY_SELECT_LEGACY);
  if (older.error) throw older.error;
  if (newer.error) throw newer.error;
  return {
    prev: older.data?.[0] ? toSummary(older.data[0]) : null,
    next: newer.data?.[0] ? toSummary(newer.data[0]) : null,
  };
}

// ロスター詳細の「◯◯のブログ」用。タイトル判定はサーバー側で行うため本文なしの一覧をまとめて取る
export async function fetchPublishedSummaries(limit = 200): Promise<PostSummary[]> {
  return fetchLatestPosts(limit);
}

// sitemap 用: 公開済み全記事の id / updatedAt を取得（1000件ずつページング）
export async function fetchAllPostIds(): Promise<{ id: string; updatedAt: string }[]> {
  const supabase = createSupabasePublic();
  const CHUNK = 1000;
  const results: { id: string; updatedAt: string }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("posts")
      .select("id,updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    const rows = data ?? [];
    results.push(...rows.map((r: any) => ({ id: r.id, updatedAt: r.updated_at })));
    if (rows.length < CHUNK) break;
    from += CHUNK;
  }
  return results;
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
