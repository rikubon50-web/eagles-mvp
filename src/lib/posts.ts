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
  const supabase = createSupabasePublic();
  const buildQuery = () => {
    let query = supabase
      .from("posts")
      .select(SUMMARY_SELECT, { count: "exact" })
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
  const { data, error } = await supabase
    .from("posts").select(SELECT).eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data ? toPost(data) : null;
}

export async function fetchLatestPosts(limit: number): Promise<PostSummary[]> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("posts").select(SUMMARY_SELECT).eq("status", "published")
    .order("published_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(toSummary);
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
