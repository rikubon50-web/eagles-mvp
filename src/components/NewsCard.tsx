// src/components/NewsCard.tsx
import Link from "next/link";
import type { News } from "@/lib/microcms";
import { newsCategoryColor } from "@/lib/category";

type Props = {
  item: News;
  className?: string;
  dark?: boolean;
};

export default function NewsCard({ item, className = "", dark = false }: Props) {
  return (
    <li className={`list-none ${className}`}>
      <Link
        href={`/news/${item.id}`}
        className={`flex flex-col md:flex-row items-start md:items-center border-b py-4 transition-colors ${
          dark
            ? "border-white/15 hover:bg-slate-800"
            : "border-slate-300 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* 日付 */}
          <time className={`w-28 shrink-0 font-bold text-sm md:text-base ${dark ? "text-slate-300" : "text-slate-900"}`}>
            {new Date(item.publishedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </time>

          {/* カテゴリ */}
          {item.category && (
            <span className={`${newsCategoryColor(item.category)} text-white text-xs font-bold px-3 py-0.5 rounded-full tracking-wider`}>
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
        <span className={`md:ml-4 mt-2 md:mt-0 text-base md:text-lg hover:underline flex-1 block h-full py-2 ${dark ? "text-white" : "text-slate-900"}`}>
          {item.title}
        </span>
      </Link>
    </li>
  );
}
