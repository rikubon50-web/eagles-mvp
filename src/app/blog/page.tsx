// src/app/blog/page.tsx
import type { Metadata } from "next";
import { fetchBlogList } from "@/lib/microcms";
import BlogFilterList from "@/components/BlogFilterList";

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

export default async function BlogListPage() {
  const posts = await fetchBlogList().catch(() => []);

  return (
    <div className="space-y-8">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">Blog</h1>
      {posts.length > 0 ? (
        <BlogFilterList posts={posts} />
      ) : (
        <p className="text-slate-500">ブログ記事はまだありません。</p>
      )}
    </div>
  );
}