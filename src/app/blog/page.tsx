// src/app/blog/page.tsx
import { fetchBlogList } from "@/lib/microcms";
import BlogCard from "@/components/BlogCard";

export const revalidate = 60;

export default async function BlogListPage() {
  const posts = await fetchBlogList();

  return (
    <div className="space-y-8">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">Blog</h1>
      {posts.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <BlogCard key={p.id} item={p} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">ブログ記事はまだありません。</p>
      )}
    </div>
  );
}