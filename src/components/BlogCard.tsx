// src/components/BlogCard.tsx
// レスポンシブ2形態: モバイル(<md)は横並びリスト行（左テキスト＋右96pxサムネ）、
// md以上は従来のカード型（サムネ上・タイトル下）を md: プレフィックスで完全維持。
import Link from "next/link";
import Image from "next/image";

export type BlogCardItem = {
  id: string;
  title: string;
  thumbnail?: { url: string; width?: number; height?: number };
  publishedAt: string;
  tags?: string[];
  likeCount?: number;
};

export default function BlogCard({ item }: { item: BlogCardItem }) {
  return (
    <Link
      href={`/blog/${item.id}`}
      className="group card rounded-none md:rounded-xl border-0 md:border shadow-none md:shadow-card md:bg-gradient-to-b from-white to-slate-50 md:hover:shadow-2xl md:hover:-translate-y-1 transition-transform duration-300 h-full flex flex-row-reverse items-center gap-3 md:gap-0 md:flex-col md:items-stretch px-0 py-3 md:p-6"
      aria-label={item.title}
    >
      <div className="relative w-24 h-24 shrink-0 md:w-full md:h-auto md:shrink md:mb-3 overflow-hidden rounded-lg aspect-[16/9] bg-slate-100">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail.url}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover md:object-contain transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No Image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 md:flex md:flex-col md:flex-initial">
        <h3 className="mb-1 md:mb-2 line-clamp-2 font-bold leading-snug text-base md:text-xl">{item.title}</h3>
        <div className="mt-1 mb-0 md:mt-2 md:mb-2 flex items-center justify-between gap-2">
          <time dateTime={item.publishedAt} className="block text-xs text-slate-500">
            {new Date(item.publishedAt).toLocaleDateString("ja-JP")}
          </time>
          {/* スキ数（0 のときは出さない） */}
          {(item.likeCount ?? 0) > 0 && (
            <span className="text-xs text-rose-400" aria-label={`スキ ${item.likeCount}件`}>
              ♡ {item.likeCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
