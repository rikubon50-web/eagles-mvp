// src/app/blog/[id]/page.tsx
import { fetchBlogById } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const item = await fetchBlogById(params.id);
  if (!item) return notFound();

  return (
    <article className="prose prose-lg max-w-none prose-slate">
      <p className="text-sm text-slate-500 mt-8 mb-4">
        {new Date(item.publishedAt).toLocaleString("ja-JP")}
      </p>
      <h1 className="text-3xl md:text-5xl font-bold mt-2">{item.title}</h1>
      <div className="mt-6" dangerouslySetInnerHTML={{ __html: item.body ?? "" }} />
    </article>
  );
}