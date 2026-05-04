// src/app/news/[id]/page.tsx
import type { Metadata } from "next";
import { fetchNewsById } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 300; // ISR: 5分ごとに再生成

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await fetchNewsById(params.id);
  if (!item) return {};
  return {
    title: item.title,
    description: item.excerpt ?? item.body.replace(/<[^>]+>/g, "").slice(0, 120),
    openGraph: {
      title: item.title,
      description: item.excerpt ?? item.body.replace(/<[^>]+>/g, "").slice(0, 120),
      type: "article",
      publishedTime: item.publishedAt,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await fetchNewsById(params.id);

  if (!item) return notFound();

  return (
    <article className="prose prose-lg max-w-none prose-slate">
      {/* 日付 */}
      <p className="text-sm text-slate-500 mt-8 mb-4">
        {new Date(item.publishedAt).toLocaleString("ja-JP")}
      </p>

      {/* タイトル */}
      <h1 className="text-3xl md:text-5xl font-bold mt-2">{item.title}</h1>

      {/* 本文（microCMSのリッチテキストをHTMLで描画） */}
      <div
        className="mt-6"
        dangerouslySetInnerHTML={{ __html: item.body ?? "" }}
      />
    </article>
  );
}