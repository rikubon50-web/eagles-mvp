// src/app/page.tsx
import Link from "next/link";
import { fetchNewsList, fetchGamesUpcoming, fetchBlogList, fetchPlayers } from "@/lib/microcms";
import { fetchAboutFromCsv, fetchStandingsFromCsv } from "@/lib/sheets";
import NewsCard from "@/components/NewsCard";
import GameCard from "@/components/GameCard";
import StandingsBoard from "@/components/StandingsBoard"; 
import Image from "next/image";
import BlogCard from "@/components/BlogCard";
import NewsTicker from "@/components/NewsTicker";
import Attraction from "@/components/Attraction";
import PlayerCard from "@/components/PlayerCard";

export const revalidate = 0; // ISR

export default async function Home() {
  const [news, games, standingsData, blogs, about, players] = await Promise.all([
    fetchNewsList(),
    fetchGamesUpcoming(),
    fetchStandingsFromCsv(process.env.STANDINGS_CSV!), //  ← ここでCSVを読む
    fetchBlogList(),
    fetchAboutFromCsv(),
    fetchPlayers(),
  ]);
  // --- build items for news ticker (use News shape expected by NewsTicker) ---
  const tickerItems = news.slice(0, 8).map((n: any) => ({
    id: String(n.id),
    title: String(n.title ?? ""),
    excerpt: n.excerpt ?? "",
    body: String(n.body ?? ""),
    // category could be string or object/array from CMS – normalize to string
    category: typeof n.category === "string"
      ? n.category
      : Array.isArray(n.category)
      ? String(n.category[0] ?? "")
      : typeof n.category?.name === "string"
      ? n.category.name
      : "",
    publishedAt: String(n.publishedAt ?? ""),
  }));
  // --- normalize helpers (process raw strings from CSV here) ---
  const normalizeText = (s?: string) =>
    (s ?? "")
      // strip outer quotes if any
      .replace(/^"+|"+$/g, "")
      // convert <br> to newline
      .replace(/<br\s*\/?\>/gi, "\n")
      // normalize CRLF to LF
      .replace(/\r/g, "");

  const normalizeUrl = (u?: string) => {
    const v = (u ?? "").trim().replace(/^"+|"+$/g, "");
    if (!v) return undefined;
    // accept only absolute http(s)
    if (/^https?:\/\//i.test(v)) return v;
    return undefined;
  };

  const aboutNorm = about
    ? {
        slogan: normalizeText(about.slogan),
        body: normalizeText(about.body),
        backgroundImgUrl: normalizeUrl((about as any).backgroundImgUrl),
      }
    : null;

  return (
    <div className="space-y-16">
      <div className="space-y-0">
        {/* Hero (背景画像) */}
        <div className="relative w-screen h-[calc(100vh-85px)] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <Image
            src="/img/28FDFC22-09FD-44DE-9E74-E939FA035794.PNG"   // public/img/about-hero.jpg に置いた適当な画像
            alt="About EAGLES"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* ニュースティッカー帯 */}
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900/90 text-white">
          <NewsTicker items={tickerItems} />
        </div>
      </div>

      {/* upcoming */}
      <section>
        <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">Up Coming</h2>
        {games.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {games.slice(0, 2).map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">予定されている試合はありません。</p>
        )}
        <Link
          href="/games"
          className="button-32 mt-4"
        >
          すべての試合を見る
        </Link>
      </section>

      {/* Standings（追加） */}
      <section>
        <StandingsBoard rows={standingsData.rows as any[]} updatedAt={standingsData.updatedAt ?? undefined} />
      </section>

      {/* 最新ニュース */}
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
          <Link
            href="/news"
            className="button-32 mt-4"
          >
            すべてのニュースを見る
          </Link>
        </div>
      </section>

      {/* About (Attraction) */}
      <Attraction
        backgroundImgUrl="/img/IMG_8307.JPG"
        slogan={"ALL\nBOX\nMEMBER"}
        body={`EAGLESに関わるすべての人が同じゴールを目指すための合言葉。
              
              グラウンドで戦うプレーヤー、戦術を支えるスタッフ、声援を送り続けるサポーター、
              そして伝統を築き上げてきたOBの方々――。
          
              誰一人欠けることなく、全員が「チームの一員」としてつながっている。
        
              私たちは、その結束を力に変え、互いを信じ、互いを高め合いながら挑戦を続ける。
             
              勝利の喜びも、敗北の悔しさも、すべてを共有するからこそ、一瞬一瞬が大きな意味を持つ。

              EAGLESは「ALL BOX MEMBER」の理念のもと、
              関わるすべての人と喜びを分かち合い、共に未来を切り拓く。`}
      />


      {/* Blog */}
      <section>
        <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">Blog</h2>
        {blogs && blogs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.slice(0, 3).map((b) => (
              <BlogCard key={b.id} item={b} />
            ))}
          </div>
        ) : (
          <p className="text-slate-700">ブログ記事はまだありません。</p>
        )}
        <div className="mt-4">
          <Link href="/blog" className="button-32 mt-4">すべてのブログを見る</Link>
        </div>
      </section>

      {/* Roster */}
      <section>
        <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">Roster</h2>
        {players && players.length > 0 ? (
          <div className="grid grid-flow-col auto-cols-[minmax(50%,_1fr)] md:auto-cols-[minmax(33.333%,_1fr)] lg:auto-cols-[minmax(25%,_1fr)] gap-4 overflow-x-auto">
            {players.slice(0, 6).map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <p className="text-slate-700">選手データはまだありません。</p>
        )}
        <div className="mt-6">
          <Link href="/roster" className="button-32">選手一覧を見る</Link>
        </div>
      </section>

    </div>
  );
}