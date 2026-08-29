import { fetchLatestPosts } from "@/lib/posts";
import BlogCard, { type BlogCardItem } from "@/components/BlogCard";
import Link from "next/link";

const DISPLAY_COUNT = 3;

export default async function BlogSection() {
  const posts = await fetchLatestPosts(DISPLAY_COUNT);
  const blogs: BlogCardItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnailUrl ? { url: p.thumbnailUrl, width: 1280, height: 720 } : undefined,
    publishedAt: p.publishedAt,
    tags: p.tags,
    likeCount: p.likeCount,
  }));
  return (
    <section>
      <h2 className="section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6">Blog</h2>
      {blogs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <BlogCard key={b.id} item={b} />
          ))}
        </div>
      ) : (
        <p className="text-slate-700">ブログ記事はまだありません。</p>
      )}
      <div className="mt-4">
        <Link href="/blog" className="button-32 mt-4">すべてのブログを見る</Link>
      </div>
    </section>
  );
}
