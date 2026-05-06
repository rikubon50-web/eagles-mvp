"use client";

import { useState } from "react";
import NewsCard from "@/components/NewsCard";
import type { News } from "@/lib/microcms";

const CATEGORIES = ["すべて", "お知らせ", "新歓", "試合情報"] as const;
type Filter = (typeof CATEGORIES)[number];

export default function NewsFilterList({ news }: { news: News[] }) {
  const [active, setActive] = useState<Filter>("すべて");

  const filtered =
    active === "すべて"
      ? news
      : news.filter((n) => JSON.stringify(n.category ?? "").includes(active));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
              active === cat
                ? "bg-[#0f6536] text-white border-[#0f6536]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-6">
          {filtered.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">該当する記事はありません。</p>
      )}
    </>
  );
}
