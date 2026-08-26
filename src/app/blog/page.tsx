// src/app/blog/page.tsx
import type { Metadata } from "next";
import { fetchPostsPage, collectTags } from "@/lib/posts";
import BlogFilterList from "@/components/BlogFilterList";
import BlogCard, { type BlogCardItem } from "@/components/BlogCard";
import Pagination from "@/components/Pagination";

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
    body: p.body,
    thumbnail: p.thumbnailUrl ? { url: p.thumbnailUrl, width: 1280, height: 720 } : undefined,
    publishedAt: p.publishedAt,
    tags: p.tags,
  }));

  return (
    <div className="space-y-8">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">Blog</h1>

      <BlogFilterList tags={tags} q={q ?? ""} tag={tag ?? null} />

      {/* 件数表示 */}
      <p className="text-sm text-slate-500 mb-6">{totalCount}件</p>

      {/* 一覧 */}
      {blogs.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
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
