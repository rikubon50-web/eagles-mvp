// src/app/news/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { fetchNewsById } from "@/lib/microcms";
import { newsCategoryColor } from "@/lib/category";
import { notFound } from "next/navigation";

export const revalidate = 300;

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

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const item = await fetchNewsById(params.id);
  if (!item) return notFound();

  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";
  const badgeColor = newsCategoryColor(item.category);

  return (
    <>
      {/* ダーク見出し帯 */}
      <div className={`${fullWidth} bg-slate-900 py-12`}>
        <div className={innerCls}>
          {/* パンくず */}
          <Link href="/news" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ニュース一覧へ
          </Link>

          {/* カテゴリ + 日付 */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider`}>
              {item.category}
            </span>
            <time className="text-slate-400 text-sm">
              {new Date(item.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-snug">
            {item.title}
          </h1>
        </div>
      </div>

      {/* 本文エリア */}
      <div className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <article
            className="prose prose-slate prose-lg prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: item.body ?? "" }}
          />

          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link href="/news" className="button-32">
              ニュース一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
