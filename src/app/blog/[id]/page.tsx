// src/app/blog/[id]/page.tsx
import type { Metadata } from "next";
import { fetchBlogById } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await fetchBlogById(params.id);
  if (!item) return {};
  return {
    title: item.title,
    description: item.excerpt ?? item.body.replace(/<[^>]+>/g, "").slice(0, 120),
    openGraph: {
      title: item.title,
      description: item.excerpt ?? item.body.replace(/<[^>]+>/g, "").slice(0, 120),
      type: "article",
      publishedTime: item.publishedAt,
      images: item.thumbnail ? [{ url: item.thumbnail.url, width: item.thumbnail.width, height: item.thumbnail.height }] : undefined,
    },
  };
}

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