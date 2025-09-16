// src/app/news/[id]/page.tsx
import { fetchNewsById } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR: 60秒ごとに再生成

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