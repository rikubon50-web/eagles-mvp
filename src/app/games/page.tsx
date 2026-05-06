// src/app/games/page.tsx
import type { Metadata } from "next";
import { fetchGamesUpcoming, fetchGamesArchive } from "@/lib/microcms";
import GameCard from "@/components/GameCard";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Games | EAGLES Lacrosse",
  description: "青山学院大学男子ラクロス部 EAGLES の試合日程・結果一覧です。",
  openGraph: {
    title: "Games | EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 EAGLES の試合日程・結果一覧です。",
    type: "website",
  },
};

export default async function GamesListPage() {
  const [upcoming, archive] = await Promise.all([
    fetchGamesUpcoming().catch(() => []),
    fetchGamesArchive().catch(() => []),
  ]);

  return (
    <div className="space-y-12">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">Game Schedule</h1>

      {/* これからの試合 */}
      <section>
        <h2 className="section-title text-2xl md:text-3xl font-bold mb-6">Upcoming</h2>
        {upcoming.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">予定されている試合はありません。</p>
        )}
      </section>

      {/* 終了した試合 */}
      <section>
        <h2 className="section-title text-2xl md:text-3xl font-bold mb-6">Results</h2>
        {archive.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {archive.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">まだ試合結果はありません。</p>
        )}
      </section>
    </div>
  );
}