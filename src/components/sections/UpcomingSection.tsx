import { fetchGamesUpcoming } from "@/lib/microcms";
import GameCard from "@/components/GameCard";
import Link from "next/link";

export default async function UpcomingSection() {
  const games = await fetchGamesUpcoming();
  return (
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
      <Link href="/games" className="button-32 mt-4">すべての試合を見る</Link>
    </section>
  );
}
