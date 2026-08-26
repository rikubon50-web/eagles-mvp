"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// 検索ボックス・タグボタン。値の変更を /blog?q=&tag= への router.push に変換する薄いクライアント部品。
// ページングと一覧描画自体はサーバーコンポーネント（src/app/blog/page.tsx）側で行う。
export default function BlogFilterList({
  tags,
  q,
  tag,
}: {
  tags: string[];
  q: string;
  tag: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const isFirstRender = useRef(true);

  // 入力に応じて検索語を反映（デバウンスしてページを1に戻す）
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      pushParams({ q: query || undefined, tag: tag ?? undefined });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pushParams(next: { q?: string; tag?: string }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.tag) sp.set("tag", next.tag);
    const qs = sp.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  }

  function handleTagClick(nextTag: string | null) {
    pushParams({ q: query || undefined, tag: nextTag ?? undefined });
  }

  return (
    <>
      {/* 検索バー */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="タイトルで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6536] focus:border-transparent"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
        )}
      </div>

      {/* タグフィルター */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleTagClick(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
              tag === null
                ? "bg-[#0f6536] text-white border-[#0f6536]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
            }`}
          >
            すべて
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => handleTagClick(tag === t ? null : t)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                tag === t
                  ? "bg-[#0f6536] text-white border-[#0f6536]"
                  : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
