export const revalidate = 300;
import type { Metadata } from "next";
import { fetchStandingsFromCsv } from "@/lib/sheets";

export const metadata: Metadata = {
  title: "Standings | EAGLES Lacrosse",
  description: "青山学院大学男子ラクロス部 EAGLES の順位表です。",
  openGraph: {
    title: "Standings | EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 EAGLES の順位表です。",
    type: "website",
  },
};

export default async function StandingsPage() {
  const url = process.env.STANDINGS_CSV!;
  const { rows, updatedAt } = await fetchStandingsFromCsv(url);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">Standings</h1>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left border-collapse" aria-label="リーグ順位表">
          <caption className="sr-only">リーグ順位表</caption>
          <thead className="bg-slate-50">
            <tr>
              {["順位","大学名","勝点","試合数","総得点","得失点差"].map((h, i) => (
                <th key={i} className="px-3 py-2 text-sm font-semibold text-slate-600 border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2 font-bold">{r.rank}</td>
                <td className="px-3 py-2">{r.university}</td>
                <td className="px-3 py-2">{r.points}</td>
                <td className="px-3 py-2">{r.games}</td>
                <td className="px-3 py-2">{r.gf}</td>
                <td className="px-3 py-2">{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {updatedAt && (
        <p className="text-xs text-slate-500">更新日：{updatedAt}</p>
      )}
    </div>
  );
}
