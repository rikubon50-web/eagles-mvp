export const revalidate = 0;
import { fetchStandingsFromCsv } from "@/lib/sheets";

export default async function StandingsPage() {
  const url = process.env.STANDINGS_CSV!;
  const { rows, updatedAt } = await fetchStandingsFromCsv(url);

  console.log(updatedAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Standings</h1>
      <p className="text-xs text-slate-500">debug updatedAt: {updatedAt ?? "(none)"}</p>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {["順位","大学名","勝点","試合数","総得点","失点","得失点差"].map((h, i) => (
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