import Link from "next/link";
import { fetchStandings } from "@/lib/standings";
import StandingsBoard from "@/components/StandingsBoard";

// ホームの星取表。モバイル(<md)ではフル表の代わりに自チームの要約カードを表示し、
// md以上では従来どおり StandingsBoard をそのまま表示する（StandingsBoard 自体は不変）。
const OUR_UNIVERSITY = "青山学院大学";

export default async function StandingsSection() {
  const standingsData = await fetchStandings();
  const ours = standingsData.rows.find((r) => r.university.trim() === OUR_UNIVERSITY);
  const rankLabel = ours && ours.rank !== "0" ? ours.rank : "-";
  return (
    <section>
      {/* モバイル: 要約カード */}
      <div className="md:hidden">
        <div className="rounded-2xl border-[3px] border-slate-800 overflow-hidden">
          <div className="bg-slate-900 text-white text-center py-3 px-4">
            <h2 className="tracking-widest text-2xl font-extrabold text-white">STANDINGS</h2>
          </div>
          <div className="bg-white px-4 py-4 text-center">
            {ours ? (
              <>
                <p className="text-sm font-bold text-slate-500">{OUR_UNIVERSITY}</p>
                <p className="mt-1 font-extrabold text-slate-900">
                  <span className="text-lg">{ours.block}ブロック</span>
                  <span className="mx-2 text-3xl">{rankLabel}位</span>
                  <span className="text-lg">勝点{ours.points}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">順位データはまだありません。</p>
            )}
            <div className="mt-4">
              <Link href="/standings" className="button-32">順位表を見る</Link>
            </div>
          </div>
        </div>
        {standingsData.updatedAt && standingsData.updatedAt.trim() && (
          <div className="text-right px-4 py-2 text-xs text-slate-600">
            更新日：{standingsData.updatedAt}
          </div>
        )}
      </div>

      {/* md以上: 従来どおりフル表 */}
      <div className="hidden md:block">
        <StandingsBoard rows={standingsData.rows} updatedAt={standingsData.updatedAt ?? undefined} leagueTitle={standingsData.leagueTitle} />
      </div>
    </section>
  );
}
