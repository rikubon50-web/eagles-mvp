import { fetchNewsList } from "@/lib/microcms";
import NewsCard from "@/components/NewsCard";
import Link from "next/link";

export default async function NewsSection() {
  const news = await fetchNewsList();
  return (
    <section>
      <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">News</h2>
      {news.length > 0 ? (
        <div className="space-y-4">
          {news.slice(0, 5).map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">ニュース記事はまだありません。</p>
      )}
      <div className="mt-4 mb-8">
        <Link href="/news" className="button-32 mt-4">すべてのニュースを見る</Link>
      </div>
    </section>
  );
}
