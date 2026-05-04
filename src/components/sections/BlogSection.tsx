import { fetchBlogList } from "@/lib/microcms";
import BlogCard from "@/components/BlogCard";
import Link from "next/link";

export default async function BlogSection() {
  const blogs = await fetchBlogList();
  return (
    <section>
      <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">Blog</h2>
      {blogs && blogs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.slice(0, 3).map((b) => (
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
