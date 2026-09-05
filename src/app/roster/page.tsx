// src/app/roster/page.tsx
import { fetchPlayers } from "@/lib/microcms";
import PlayerCard from "@/components/PlayerCard";
import { cohortLabel, cohortOf, fiscalYear, isActiveCohort } from "@/lib/cohort";

export const revalidate = 300; // ISR: 5分ごとに再生成

export const metadata = {
  title: "選手・スタッフ紹介（ロスター）",
  description:
    "青山学院大学男子ラクロス部 EAGLESの選手・スタッフ・コーチ一覧。学年（期）別のメンバー紹介ページです。",
  alternates: { canonical: "/roster" },
};

export default async function RosterPage() {
  // 取得失敗時は空一覧（下の空状態メッセージ）にして 500 にしない
  const players = await fetchPlayers().catch(() => []);
  const fy = fiscalYear(new Date());

  // ロールで学生（PL/MG/TR/AS）とコーチ（C）に分割
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

  // 期内は PL → スタッフ(MG/TR/AS) の順、同ロール内は名前順
  const roleRank = (p: { role?: string }) => (p.role === "PL" ? 0 : 1);

  return (
    <div className="scroll-smooth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Cohort Tabs (このページ内で完結するアンカーリンク・ヘッダー直下に固定) */}
        <nav className="sticky top-[85px] z-30 bg-white/95 backdrop-blur border-b border-slate-200 py-2 md:py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ul className="flex overflow-x-auto gap-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
            {cohorts.map((c) => (
              <li key={`tab-${c}`} className="shrink-0 md:shrink">
                <a
                  href={`#cohort-${c}`}
                  className="block text-center rounded-full border border-slate-300 px-4 py-2 text-sm md:px-6 md:py-3 md:text-base whitespace-nowrap font-bold tracking-wider text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {cohortLabel(c)}
                </a>
              </li>
            ))}
            {coaches.length > 0 && (
              <li key="tab-coach" className="shrink-0 md:shrink">
                <a
                  href="#coach"
                  className="block text-center rounded-full border border-slate-300 px-4 py-2 text-sm md:px-6 md:py-3 md:text-base whitespace-nowrap font-bold tracking-wider text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  COACH
                </a>
              </li>
            )}
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
            <section id={`cohort-${cohort}`} key={cohort} className="space-y-6 scroll-mt-[150px] md:scroll-mt-44">
              <div className="flex items-baseline gap-3 border-b-2 border-slate-900 pb-2">
                <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  {cohortLabel(cohort)}
                </span>
                <span className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.3em] text-emerald-700">
                  Members
                </span>
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
          <section id="coach" className="space-y-6 scroll-mt-[150px] md:scroll-mt-44">
            <div className="flex items-baseline gap-3 border-b-2 border-slate-900 pb-2">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">COACH</span>
              <span className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.3em] text-emerald-700">
                Staff
              </span>
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