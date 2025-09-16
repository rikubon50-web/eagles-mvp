// src/app/news/page.tsx
import { fetchNewsList } from "@/lib/microcms";
import NewsCard from "@/components/NewsCard";

export const revalidate = 60; // ISR: 60秒ごとに再生成

export default async function NewsListPage() {
  const news = await fetchNewsList();

  return (
    <div className="space-y-8">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">News</h1>

      {news.length > 0 ? (
        <div className="space-y-6">
          {news.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">ニュース記事はまだありません。</p>
      )}
    </div>
  );
}