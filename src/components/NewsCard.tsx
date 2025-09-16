// src/components/NewsCard.tsx
import Link from "next/link";
import type { News } from "@/lib/microcms";

type Props = {
  item: News;
  className?: string;
};

export default function NewsCard({ item, className = "" }: Props) {
  return (
    <li className={`list-none ${className}`}>
      <Link
        href={`/news/${item.id}`}
        className="flex flex-col md:flex-row items-start md:items-center border-b border-slate-300 py-4 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* 日付 */}
          <time className="w-28 shrink-0 font-bold text-slate-900 text-sm md:text-base">
            {new Date(item.publishedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </time>

          {/* カテゴリ */}
          {item.category && (
            <span className="inline-block border border-slate-900 text-slate-900 text-xs px-2 py-0.5">
              {item.category}
            </span>
          )}

          {/* NEWラベル */}
          {new Date(item.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <span className="text-xs font-bold text-white bg-[#0f6536] px-2 py-0.5">
              NEW
            </span>
          )}
        </div>

        {/* タイトル */}
        <span className="md:ml-4 mt-2 md:mt-0 text-base md:text-lg text-slate-900 hover:underline flex-1 block h-full py-2">
          {item.title}
        </span>
      </Link>
    </li>
  );
}