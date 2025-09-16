type Row = {
  block?: string;  // "A" | "B"
  rank: string;
  university: string;
  points: string;
  games: string;
  gf: string;
  ga: string;
  diff: string;
};

function BlockTable({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      {/* ブロック見出し帯 */}
      <div className="bg-slate-100 border-b-[3px] border-slate-800 px-4 py-3 text-center font-bold text-slate-800">
        {title}
      </div>

      {/* テーブル本体（全列を中央寄せ） */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-slate-700">
              {["順位","大学名","勝点","試合数","総得点","得失点差"].map((h) => (
                <th
                  key={h}
                  className="border-b-[3px] border-slate-800 px-3 py-2 text-sm font-semibold text-center"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="even:bg-white odd:bg-white">
                <td className="border-t-[3px] border-slate-800 px-3 py-3 font-extrabold text-3xl md:text-4xl text-slate-900 text-center">
                  {r.rank}
                </td>
                <td className="border-t-[3px] border-slate-800 px-3 py-3 text-lg md:text-xl font-bold text-slate-900 text-center">
                  <div className="min-h-[3.5rem] md:min-h-[3.75rem] flex items-center justify-center leading-snug">
                    {r.university}
                  </div>
                </td>
                <td className="border-t-[3px] border-slate-800 px-3 py-3 text-center">{r.points}</td>
                <td className="border-t-[3px] border-slate-800 px-3 py-3 text-center">{r.games}</td>
                <td className="border-t-[3px] border-slate-800 px-3 py-3 text-center">{r.gf}</td>
                <td className="border-t-[3px] border-slate-800 px-3 py-3 text-center">{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StandingsBoard({ rows, updatedAt }: { rows: Row[]; updatedAt?: string }) {
  const A = rows.filter((r) => (r.block ?? "").toUpperCase() === "A");
  const B = rows.filter((r) => (r.block ?? "").toUpperCase() === "B");

  return (
    <section className="not-prose">
      {/* 外枠：左右とも太線／角丸／オーバーフロー隠し */}
      <div className="rounded-2xl border-[3px] border-slate-800 overflow-hidden">
        {/* 上部 濃紺帯に STANDINGS */}
        <div className="bg-slate-900 text-white text-center py-6 px-4">
          <h2 className="tracking-widest text-4xl md:text-6xl font-extrabold text-white">
            STANDINGS
          </h2>
        </div>

        {/* 2カラム（中央仕切りも太線） */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-slate-800">
          <BlockTable title="関東学生ラクロスリーグ戦2025 男子1部 Aブロック" rows={A} />
          <BlockTable title="関東学生ラクロスリーグ戦2025 男子1部 Bブロック" rows={B} />
        </div>

      </div>
        {/* 更新日（スプレッドシートから供給） */}
        {updatedAt && updatedAt.trim() && (
          <div className="text-right px-4 py-3 text-sm text-slate-600">
            更新日：{updatedAt}
          </div>
        )}
    </section>
  );
}