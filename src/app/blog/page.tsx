// src/app/blog/page.tsx
import type { Metadata } from "next";
import { fetchPostsPage, collectTags } from "@/lib/posts";
import BlogFilterList from "@/components/BlogFilterList";
import BlogCard, { type BlogCardItem } from "@/components/BlogCard";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import { RETIREMENT_TAG } from "@/lib/post-player";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "青山学院大学男子ラクロス部 EAGLES のブログ一覧。部員・スタッフによる日々の活動やチームの様子をお届けします。",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "ブログ｜青山学院大学男子ラクロス部 EAGLES",
    description: "青山学院大学男子ラクロス部 EAGLES のブログ一覧です。",
    type: "website",
  },
};

function toSingle(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: { page?: string | string[]; q?: string | string[]; tag?: string | string[] };
}) {
  const q = toSingle(searchParams.q)?.trim() || undefined;
  const tag = toSingle(searchParams.tag)?.trim() || undefined;
  const pageParam = Number(toSingle(searchParams.page)) || 1;

  const [{ posts, totalCount, pageCount, page }, tags] = await Promise.all([
    fetchPostsPage({ page: pageParam, q, tag }).catch(() => ({
      posts: [],
      totalCount: 0,
      pageCount: 1,
      page: 1,
    })),
    collectTags().catch(() => [] as string[]),
  ]);

  const blogs: BlogCardItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnailUrl ? { url: p.thumbnailUrl, width: 1280, height: 720 } : undefined,
    publishedAt: p.publishedAt,
    tags: p.tags,
    likeCount: p.likeCount,
  }));

  return (
    <div className="space-y-4 md:space-y-8">
      <h1 className="section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6 mt-6 md:mt-12">BLOG</h1>

      {/* 引退ブログ特集バナー（タグが存在し、かつ絞り込み中でないときだけ） */}
      {tags.includes(RETIREMENT_TAG) && tag !== RETIREMENT_TAG && !q && (
        <Link
          href={`/blog?tag=${encodeURIComponent(RETIREMENT_TAG)}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-900 px-5 py-5 text-white md:px-8 md:py-6"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#0f6536] opacity-60 blur-2xl"
          />
          <span className="relative">
            <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300">Special</span>
            <span
              className="block text-2xl md:text-3xl font-bold tracking-wider"
              style={{ fontFamily: "var(--font-heading), ui-sans-serif, system-ui, sans-serif" }}
            >
              {RETIREMENT_TAG}
            </span>
            <span className="mt-1 block text-sm text-slate-300">4年生が綴る、最後のシーズンへの想い</span>
          </span>
          <span className="relative shrink-0 rounded-full border border-emerald-300/60 px-4 py-2 text-sm font-bold text-emerald-200 transition-colors group-hover:bg-emerald-300 group-hover:text-slate-900">
            まとめて読む
          </span>
        </Link>
      )}

      <BlogFilterList tags={tags} q={q ?? ""} tag={tag ?? null} />

      {/* 件数表示 */}
      <p className="text-sm text-slate-500 mb-3 md:mb-6">{totalCount}件</p>

      {/* 一覧 */}
      {blogs.length > 0 ? (
        <div className="grid gap-0 max-md:divide-y max-md:divide-slate-200 md:grid-cols-3 md:gap-6">
          {blogs.map((b) => (
            <BlogCard key={b.id} item={b} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">該当する記事が見つかりませんでした。</p>
      )}

      <Pagination page={page} pageCount={pageCount} basePath="/blog" params={{ q, tag }} />
    </div>
  );
}
