import { fetchGamesLive, fetchGamesUpcoming } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Link from "next/link";

export default async function UpcomingSection() {
  // どちらかが失敗したら throw し、ISR が前回成功ページを維持する（既存方針のまま）
  const [live, upcoming] = await Promise.all([
    fetchGamesLive(),
    fetchGamesUpcoming(),
  ]);
  // live があれば最上部に出し、見出しも「試合速報」へ切り替える
  const games = [...live, ...upcoming];
  const heading = live.length > 0 ? "試合速報" : "Up Coming";
  return (
    <section>
      <h2 className="section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6">{heading}</h2>
      {games.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {games.slice(0, 2).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">予定されている試合はありません。</p>
      )}
      <Link href="/games" className="button-32 mt-4">すべての試合を見る</Link>
    </section>
  );
}
