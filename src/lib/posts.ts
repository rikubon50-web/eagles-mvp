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
