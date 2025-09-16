// src/app/roster/page.tsx
import { fetchPlayers } from "@/lib/microcms";
import PlayerCard from "@/components/PlayerCard";

// 年次 → ラベル
const toOrdinal = (y: number) => {
  const map: Record<number, string> = { 1: "1ST", 2: "2ND", 3: "3RD", 4: "4TH" };
  return map[y] ?? `${y}TH`;
};

export const revalidate = 60; // ISR

export default async function RosterPage() {
  const players = await fetchPlayers();

  // 学年ごとにグルーピング（CMSが文字列で保存されていても数値化して扱う）
  const groups = new Map<number, typeof players>();
  for (const p of players) {
    // 受け取り年次の取り出し: classYear / class_year / year(配列 or 文字列)
    const raw = (p as any).classYear ?? (p as any)["class_year"] ?? (p as any).year ?? 0;
    const first = Array.isArray(raw) ? raw[0] : raw;
    const k = Number(typeof first === "string" ? first.replace(/[^0-9]/g, "") : first) || 0;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }

  // 1〜4年のみを対象に降順表示
  const years = Array.from(groups.keys())
    .filter((y) => Number.isFinite(y) && y >= 1 && y <= 4)
    .sort((a, b) => b - a);

  return (
    <div className="scroll-smooth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Year Tabs (このページ内で完結するアンカーリンク) */}
        <nav className="relative z-10 bg-white py-3">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[4,3,2,1].filter((y) => years.some((yy) => yy === y)).map((y) => (
              <li key={`tab-${y}`}>
                <a
                  href={`#year-${y}`}
                  className="block text-center border border-[#0f6536] px-6 py-4 font-extrabold tracking-wider text-[#0f6536] hover:bg-[#0f6536] hover:text-white transition-colors"
                >
                  {toOrdinal(y)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {players.length === 0 && (
          <p className="text-center text-slate-500">選手データが取得できませんでした。</p>
        )}

        {years.map((year) => {
          const list = (groups.get(year) ?? []).sort((a, b) =>
            a.name.localeCompare(b.name, "ja")
          );
          return (
            <section id={`year-${year}`} key={year} className="space-y-6">
              <div className="w-full bg-[#0f6536] text-white text-center font-extrabold text-4xl sm:text-6xl py-6">
                {toOrdinal(year)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}