// src/components/BlogCard.tsx
// レスポンシブ2形態: モバイル(<md)は横並びリスト行（左テキスト＋右96pxサムネ）、
// md以上はカード型（サムネ上・タイトル下）。
// カード本体はリンク、スキ♡と共有はリンクの外側のアクション行に置く（リンク内に
// ボタンを入れない）。一覧では通信を増やさないよう LikeButton は compact 版を使う。
import Link from "next/link";
import Image from "next/image";
import { mcmsImg } from "@/lib/image-url";
import LikeButton from "@/app/blog/LikeButton";
import { ShareIconButton } from "@/app/blog/ShareButtons";

export type BlogCardItem = {
  id: string;
  title: string;
  thumbnail?: { url: string; width?: number; height?: number };
  publishedAt: string;
  tags?: string[];
  likeCount?: number;
};

// PostSummary（Supabase）→ カード用の形。各ページで同じ変換を繰り返さないための共通ヘルパー
export function toBlogCardItem(p: {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  tags: string[];
  likeCount: number;
}): BlogCardItem {
  return {
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnailUrl ? { url: p.thumbnailUrl, width: 1280, height: 720 } : undefined,
    publishedAt: p.publishedAt,
    tags: p.tags,
    likeCount: p.likeCount,
  };
}

export default function BlogCard({ item }: { item: BlogCardItem }) {
  const href = `/blog/${item.id}`;
  return (
    <article className="group card rounded-none md:rounded-xl border-0 md:border shadow-none md:shadow-card md:bg-gradient-to-b from-white to-slate-50 md:hover:shadow-2xl md:hover:-translate-y-1 transition-transform duration-300 h-full flex flex-row-reverse items-center gap-4 md:gap-0 md:flex-col md:items-stretch px-2 py-4 md:p-6">
      {/* サムネ（リンク） */}
      <Link
        href={href}
        aria-label={item.title}
        className="relative block w-24 h-24 shrink-0 md:w-full md:h-auto md:shrink md:mb-3 overflow-hidden rounded-lg aspect-[16/9] bg-slate-100"
      >
        {item.thumbnail ? (
          <Image
            src={mcmsImg(item.thumbnail.url, 480)}
            alt={item.title}
            fill
            sizes="(max-width: 767px) 96px, 33vw"
            className="object-cover md:object-contain transition-transform md:group-hover:scale-[1.02]"
          />
        ) : (
          // 画像なし記事はチームロゴ入りプレースホルダ（テキストのみの引退ブログ等）
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <Image
              src="/img/logo-sm.webp"
              alt=""
              width={120}
              height={74}
              className="w-1/2 max-w-[120px] opacity-90 object-contain"
            />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 md:flex md:flex-col md:flex-initial">
        <h3 className="mb-1 md:mb-2 line-clamp-2 font-bold leading-snug text-base md:text-xl">
          <Link href={href} className="hover:underline">
            {item.title}
          </Link>
        </h3>
        {/* 日付＋アクション（スキ♡・共有）。ボタンはリンクの外 */}
        <div className="mt-1 mb-0 md:mt-2 md:mb-2 flex items-center justify-between gap-2">
          <time dateTime={item.publishedAt} className="block text-xs text-slate-500">
            {new Date(item.publishedAt).toLocaleDateString("ja-JP")}
          </time>
          <div className="flex items-center gap-0.5 -mr-2">
            <LikeButton postId={item.id} initialCount={item.likeCount ?? 0} variant="compact" />
            <ShareIconButton path={href} title={item.title} />
          </div>
        </div>
      </div>
    </article>
  );
}
