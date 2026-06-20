// src/app/roster/page.tsx
import { fetchPlayers } from "@/lib/microcms";
import PlayerCard from "@/components/PlayerCard";
import { cohortLabel, cohortOf, fiscalYear, isActiveCohort } from "@/lib/cohort";

export const revalidate = 300; // ISR: 5分ごとに再生成

export default async function RosterPage() {
  const players = await fetchPlayers();
  const fy = fiscalYear(new Date());

  // ロールで学生（PL/STF）とコーチ（C）に分割
  const coaches = players.filter((p) => p.role === "C");
  const students = players.filter((p) => p.role !== "C");

  // 期ごとにグルーピング（学生のみ・現役期のみ）
  const groups = new Map<number, typeof students>();
  for (const p of students) {
    const cohort = cohortOf(p);
    if (cohort === null || !isActiveCohort(cohort, fy)) continue; // 卒業期・不明・コーチは非表示
    if (!groups.has(cohort)) groups.set(cohort, []);
    groups.get(cohort)!.push(p);
  }

  // 現役の期を上級生先頭（＝期の小さい順）で表示
  const cohorts = Array.from(groups.keys()).sort((a, b) => a - b);

  // 期内は PL → STF の順、同ロール内は名前順
  const roleRank = (p: { role?: string }) => (p.role === "PL" ? 0 : 1);

  return (
    <div className="scroll-smooth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Cohort Tabs (このページ内で完結するアンカーリンク) */}
        <nav className="relative z-10 bg-white py-3">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cohorts.map((c) => (
              <li key={`tab-${c}`}>
                <a
                  href={`#cohort-${c}`}
                  className="block text-center border border-[#0f6536] px-6 py-4 font-extrabold tracking-wider text-[#0f6536] hover:bg-[#0f6536] hover:text-white transition-colors"
                >
                  {cohortLabel(c)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {players.length === 0 && (
          <p className="text-center text-slate-500">選手データが取得できませんでした。</p>
        )}

        {cohorts.map((cohort) => {
          const list = (groups.get(cohort) ?? []).sort(
            (a, b) => roleRank(a) - roleRank(b) || a.name.localeCompare(b.name, "ja")
          );
          return (
            <section id={`cohort-${cohort}`} key={cohort} className="space-y-6">
              <div className="w-full bg-[#0f6536] text-white text-center font-extrabold text-4xl sm:text-6xl py-6">
                {cohortLabel(cohort)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            </section>
          );
        })}

        {coaches.length > 0 && (
          <section id="coach" className="space-y-6">
            <div className="w-full bg-slate-900 text-white text-center font-extrabold text-4xl sm:text-6xl py-6">
              COACH
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coaches
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "ja"))
                .map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}