// src/app/blog/[id]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { mcmsImg, optimizeBodyImages } from "@/lib/image-url";
import ShareButtons from "@/app/blog/ShareButtons";
import InstagramFollowCard from "@/components/InstagramFollowCard";
import Link from "next/link";
import { fetchPostById } from "@/lib/posts";
import { notFound } from "next/navigation";
import LikeButton from "../LikeButton";
import ViewTracker from "../ViewTracker";

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aoyamaeagles.com";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await fetchPostById(params.id);
  if (!item) return {};
  const desc = item.body.replace(/<[^>]+>/g, "").slice(0, 120);
  return {
    title: item.title,
    description: desc,
    alternates: { canonical: `/blog/${params.id}` },
    openGraph: {
      title: item.title,
      description: desc,
      type: "article",
      url: `${SITE_URL}/blog/${params.id}`,
      publishedTime: item.publishedAt,
      // 画像は同階層の opengraph-image.tsx（写真+タイトルの自動生成カード）に任せる
    },
  };
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const item = await fetchPostById(params.id);
  if (!item) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: item.title,
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    description: item.body.replace(/<[^>]+>/g, "").slice(0, 120),
    image: item.thumbnailUrl ? [item.thumbnailUrl] : undefined,
    mainEntityOfPage: `${SITE_URL}/blog/${item.id}`,
    author: { "@type": "SportsTeam", name: "青山学院大学男子ラクロス部 EAGLES" },
    publisher: {
      "@type": "Organization",
      name: "青山学院大学男子ラクロス部 EAGLES",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/img/logo.png` },
    },
  };

  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ダーク見出し帯 */}
      <div className={`${fullWidth} bg-slate-900 py-8 md:py-12`}>
        <div className={innerCls}>
          {/* パンくず */}
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-4 md:mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ブログ一覧へ
          </Link>

          {/* 日付 */}
          <div className="mb-3 md:mb-4 flex items-center gap-3">
            <time className="text-slate-400 text-sm">
              {new Date(item.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            {item.authorName && (
              <span className="text-slate-400 text-sm">文責: {item.authorName}</span>
            )}
          </div>

          {/* タイトル */}
          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-snug">
            {item.title}
          </h1>
        </div>
      </div>

      {/* サムネイル */}
      {item.thumbnailUrl && (
        <div className={`${fullWidth} bg-slate-100 py-4 md:py-8`}>
          <div className="max-w-3xl mx-auto px-6">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={mcmsImg(item.thumbnailUrl, 1280)}
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
      <div className="pt-8 pb-8 md:pt-20 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <article
            className="prose prose-slate md:prose-lg prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-img:mt-8"
            dangerouslySetInnerHTML={{ __html: optimizeBodyImages(item.body ?? "") }}
          />

          {/* スキ♡（md以上は本文末尾のインライン表示。モバイルは LikeButton 内の
              フローティング表示のみになるため、この枠のモバイル余白は 0 にする） */}
          <div className="md:mt-10 flex justify-center">
            <LikeButton postId={item.id} initialCount={item.likeCount} />
          </div>
          <ViewTracker postId={item.id} />

          {/* 拡散導線: 共有ボタン → Instagramフォロー */}
          <div className="mt-8 md:mt-12 space-y-6">
            <ShareButtons path={`/blog/${item.id}`} title={item.title} />
            <InstagramFollowCard />
          </div>

          <div className="mt-6 pt-4 md:mt-12 md:pt-8 border-t border-slate-200">
            <Link href="/blog" className="button-32">
              ブログ一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
