import { fetchPlayers } from "@/lib/microcms";
import PlayerCard from "@/components/PlayerCard";
import Link from "next/link";

export default async function RosterSection() {
  const players = await fetchPlayers();
  return (
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
  );
}
