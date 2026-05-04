import { fetchNewsList } from "@/lib/microcms";
import NewsTicker from "@/components/NewsTicker";
import type { News } from "@/lib/microcms";

export default async function NewsTickerSection() {
  const news = await fetchNewsList();
  const tickerItems = news.slice(0, 20).map((n: News) => ({
    id: n.id,
    title: n.title,
    excerpt: n.excerpt ?? "",
    body: n.body,
    category: n.category,
    publishedAt: n.publishedAt,
  }));
  return <NewsTicker items={tickerItems} />;
}
