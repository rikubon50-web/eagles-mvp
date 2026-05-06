// src/app/news/page.tsx
import type { Metadata } from "next";
import { fetchNewsList } from "@/lib/microcms";
import NewsFilterList from "@/components/NewsFilterList";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "News | EAGLES Lacrosse",
  description: "青山学院大学男子ラクロス部 EAGLES のお知らせ・ニュース一覧です。",
  openGraph: {
    title: "News | EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 EAGLES のお知らせ・ニュース一覧です。",
    type: "website",
  },
};

export default async function NewsListPage() {
  const news = await fetchNewsList().catch(() => []);

  return (
    <div className="space-y-8">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">News</h1>

      {news.length > 0 ? (
        <NewsFilterList news={news} />
      ) : (
        <p className="text-slate-500">ニュース記事はまだありません。</p>
      )}
    </div>
  );
}