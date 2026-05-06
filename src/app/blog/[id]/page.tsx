// src/app/blog/[id]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      images: item.thumbnail
        ? [{ url: item.thumbnail.url, width: item.thumbnail.width, height: item.thumbnail.height }]
        : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const item = await fetchBlogById(params.id);
  if (!item) return notFound();

  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";

  return (
    <>
      {/* ダーク見出し帯 */}
      <div className={`${fullWidth} bg-slate-900 py-12`}>
        <div className={innerCls}>
          {/* パンくず */}
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ブログ一覧へ
          </Link>

          {/* 日付 */}
          <div className="mb-4">
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

      {/* サムネイル */}
      {item.thumbnail && (
        <div className={`${fullWidth} bg-slate-100 py-8`}>
          <div className="max-w-3xl mx-auto px-6">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={item.thumbnail.url}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* 本文エリア */}
      <div className="pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-3xl mx-auto">
          {item.excerpt && (
            <p className="text-slate-600 text-lg leading-relaxed mb-8 pb-8 border-b border-slate-200">
              {item.excerpt}
            </p>
          )}

          <article
            className="prose prose-slate prose-lg prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-img:mt-8"
            dangerouslySetInnerHTML={{ __html: item.body ?? "" }}
          />

          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link href="/blog" className="button-32">
              ブログ一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
