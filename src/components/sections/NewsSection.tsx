import { fetchNewsList } from "@/lib/microcms";
import NewsCard from "@/components/NewsCard";
import Link from "next/link";

export default async function NewsSection({ dark = false }: { dark?: boolean }) {
  const news = await fetchNewsList();
  return (
    <section>
      <h2 className={`section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6 ${dark ? "text-white" : ""}`}>NEWS</h2>
      {news.length > 0 ? (
        <div className="space-y-4">
          {news.slice(0, 5).map((n) => (
            <NewsCard key={n.id} item={n} dark={dark} />
          ))}
        </div>
      ) : (
        <p className={dark ? "text-slate-400" : "text-slate-500"}>ニュース記事はまだありません。</p>
      )}
      <div className="mt-4 mb-4 md:mb-8">
        <Link href="/news" className={`button-32 mt-4 ${dark ? "button-32-dark" : ""}`}>すべてのニュースを見る</Link>
      </div>
    </section>
  );
}
