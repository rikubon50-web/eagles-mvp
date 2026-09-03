export const revalidate = 300;
import type { Metadata } from "next";
import { fetchStandings, LEAGUE_TITLE } from "@/lib/standings";

export const metadata: Metadata = {
  title: "順位表・リーグ戦",
  description:
    "青山学院大学男子ラクロス部 EAGLES の所属リーグ順位表。関東学生ラクロスリーグ戦の星取・順位を掲載しています。",
  alternates: { canonical: "/standings" },
  openGraph: {
    title: "順位表・リーグ戦｜青山学院大学男子ラクロス部 EAGLES",
    description: "青山学院大学男子ラクロス部 EAGLES の順位表です。",
    type: "website",
  },
};

// ブロック単位の順位表（青学の行はハイライト）
function BlockTable({ title, rows }: { title: string; rows: Record<string, string>[] }) {
  return (
    <section>
      <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3">{title}</h2>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left border-collapse" aria-label={`${title} 順位表`}>
          <caption className="sr-only">{title} 順位表</caption>
          <thead className="bg-slate-50">
            <tr>
              {["順位", "大学名", "勝点", "試合数", "総得点", "得失点差"].map((h, i) => (
                <th key={i} className="px-2 md:px-3 py-2 text-sm font-semibold text-slate-600 border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isAgu = (r.university ?? "").trim() === "青山学院大学";
              return (
                <tr key={i} className={`border-b ${isAgu ? "bg-emerald-50 font-bold" : ""}`}>
                  <td className="px-2 md:px-3 py-2 font-bold">{r.rank}</td>
                  <td className="px-2 md:px-3 py-2 whitespace-nowrap">{r.university}</td>
                  <td className="px-2 md:px-3 py-2">{r.points}</td>
                  <td className="px-2 md:px-3 py-2">{r.games}</td>
                  <td className="px-2 md:px-3 py-2">{r.gf}</td>
                  <td className="px-2 md:px-3 py-2">{r.diff}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StandingsPage() {
  const { rows, updatedAt, leagueTitle } = await fetchStandings();
  const blockA = rows.filter((r) => (r.block ?? "").toUpperCase() === "A");
  const blockB = rows.filter((r) => (r.block ?? "").toUpperCase() === "B");

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">STANDINGS</h1>

      <BlockTable title={`${leagueTitle} Aブロック`} rows={blockA} />
      <BlockTable title={`${leagueTitle} Bブロック`} rows={blockB} />

      {updatedAt && (
        <p className="text-xs text-slate-500">更新日：{updatedAt}</p>
      )}
    </div>
  );
}
