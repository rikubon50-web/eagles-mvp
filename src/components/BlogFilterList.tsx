"use client";

import { useState, useMemo } from "react";
import BlogCard from "@/components/BlogCard";
import type { Blog } from "@/lib/microcms";

export default function BlogFilterList({ posts }: { posts: Blog[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 全投稿からユニークなタグを収集
  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesQuery = query === "" || p.title.includes(query);
      const matchesTag = activeTag === null || (p.tags ?? []).includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [posts, query, activeTag]);

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
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
              activeTag === null
                ? "bg-[#0f6536] text-white border-[#0f6536]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                activeTag === tag
                  ? "bg-[#0f6536] text-white border-[#0f6536]"
                  : "bg-white text-slate-600 border-slate-300 hover:border-[#0f6536] hover:text-[#0f6536]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 件数表示 */}
      <p className="text-sm text-slate-500 mb-6">
        {filtered.length}件{(query || activeTag) && " / " + posts.length + "件中"}
      </p>

      {/* 一覧 */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <BlogCard key={p.id} item={p} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">該当する記事が見つかりませんでした。</p>
      )}
    </>
  );
}
