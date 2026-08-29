import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logout } from "@/app/admin/actions";
import { pageWindow } from "@/lib/posts-domain";
import { isMissingCountColumns } from "@/lib/posts";
import DeletePostButton from "./DeletePostButton";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type PostRow = {
  id: string;
  title: string;
  status: "draft" | "published";
  updated_at: string;
  like_count: number;
  view_count: number;
};

type PopularRow = {
  id: string;
  title: string;
  like_count: number;
  view_count: number;
};

function toSingle(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminBlogListPage({
  searchParams,
}: {
  searchParams: { page?: string | string[] };
}) {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  const supabase = createSupabaseServer();
  const isAdmin = profile.role === "admin";

  let countQuery = supabase.from("posts").select("id", { count: "exact", head: true });
  if (!isAdmin) {
    countQuery = countQuery.eq("author_id", profile.userId);
  }
  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error("AdminBlogListPage: posts count failed", countError);
  }

  const pageParam = Number(toSingle(searchParams.page)) || 1;
  const { page, pageCount, from, to } = pageWindow(count ?? 0, pageParam, PER_PAGE);

  // likes-live-schema.sql 適用前の DB には like_count / view_count 列がない（42703）。
  // 公開側（posts.ts）と同様にフォールバックし、一覧が空表示にならないようにする
  const buildListQuery = (select: string) => {
    let q = supabase
      .from("posts")
      .select(select)
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (!isAdmin) q = q.eq("author_id", profile.userId);
    return q;
  };
  let { data, error } = await buildListQuery("id, title, status, updated_at, like_count, view_count");
  if (error && isMissingCountColumns(error)) {
    ({ data, error } = await buildListQuery("id, title, status, updated_at"));
  }
  if (error) {
    console.error("AdminBlogListPage: posts fetch failed", error);
  }

  const posts = ((data ?? []) as unknown as PostRow[]).map((p) => ({
    ...p,
    like_count: p.like_count ?? 0,
    view_count: p.view_count ?? 0,
  }));

  // 人気記事トップ5（公開記事を閲覧数降順。member/admin とも全記事を対象に閲覧可）。
  // 列未適用時は view_count で並べられないため、ボックス自体を非表示にする（popular=[]）
  const { data: popularData, error: popularError } = await supabase
    .from("posts")
    .select("id, title, like_count, view_count")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(5);
  if (popularError && !isMissingCountColumns(popularError)) {
    console.error("AdminBlogListPage: popular posts fetch failed", popularError);
  }
  const popular = (popularData ?? []) as PopularRow[];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ブログ記事管理</h1>
        <form action={logout}>
          <button className="text-sm text-slate-500 underline">ログアウト</button>
        </form>
      </div>

      {/* 人気記事トップ5（公開記事・閲覧数降順） */}
      {popular.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-800 mb-2">人気記事トップ5（閲覧数順）</h2>
          <ol className="space-y-1">
            {popular.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 shrink-0 text-right font-bold text-amber-700">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-slate-800">{p.title}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  ♡ {p.like_count} ・ 閲覧 {p.view_count}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Link
          href="/admin/blog/new"
          className="rounded bg-emerald-600 text-white px-4 py-2 font-bold hover:bg-emerald-700"
        >
          新規作成
        </Link>
      </div>

      {error ? (
        <p className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          データの取得に失敗しました。再読み込みしてください。
        </p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500 text-sm">記事がありません。</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                      post.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.status === "published" ? "公開中" : "下書き"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(post.updated_at).toLocaleDateString("ja-JP")}
                  </span>
                  <span className="text-xs text-slate-400">
                    ♡ {post.like_count ?? 0} ・ 閲覧 {post.view_count ?? 0}
                  </span>
                </div>
                <p className="truncate font-semibold text-slate-900">{post.title}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/admin/blog/${post.id}`} className="text-sm text-emerald-700 underline">
                  編集
                </Link>
                <DeletePostButton id={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          {page > 1 && (
            <Link href={`/admin/blog?page=${page - 1}`} className="text-sm text-emerald-700 underline">
              前へ
            </Link>
          )}
          {page < pageCount && (
            <Link href={`/admin/blog?page=${page + 1}`} className="text-sm text-emerald-700 underline">
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
