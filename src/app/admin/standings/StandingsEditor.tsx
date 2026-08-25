"use client";
import { useId, useState, useTransition } from "react";
import type { StandingsRowInput } from "@/lib/standings";
import {
  addRow, removeRow, moveRow, normalizeSortOrder, type EditorRow,
} from "@/lib/standings-editor";
import { saveStandings } from "./actions";

const NUM_COLS = [
  ["rank", "順位"],
  ["points", "勝点"],
  ["games", "試合数"],
  ["gf", "総得点"],
  ["diff", "得失点差"],
] as const;

export default function StandingsEditor({
  initialRows,
}: {
  initialRows: StandingsRowInput[];
}) {
  const idPrefix = useId();
  const [seq, setSeq] = useState(0);
  const [rows, setRows] = useState<EditorRow[]>(() =>
    initialRows.map((r, i) => ({ ...r, key: `init-${i}` }))
  );
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const newKey = () => {
    setSeq((s) => s + 1);
    return `${idPrefix}-${seq}`;
  };

  const update = (key: string, field: keyof StandingsRowInput, value: string) => {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? { ...r, [field]: field === "university" || field === "block" ? value : Number(value) }
          : r
      )
    );
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const payload = normalizeSortOrder(rows).map(({ key, ...rest }) => rest);
      const result = await saveStandings(payload);
      setMessage(
        result.ok
          ? { kind: "ok", text: "保存しました。公開ページに反映済みです。" }
          : { kind: "error", text: result.error ?? "保存に失敗しました" }
      );
    });
  };

  const blockTable = (block: "A" | "B") => {
    const blockRows = rows
      .filter((r) => r.block === block)
      .sort((a, b) => a.sort_order - b.sort_order);
    return (
      <div key={block} className="rounded-xl border border-slate-300 bg-white overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-2 font-bold">{block}ブロック</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2 text-left">大学名</th>
                {NUM_COLS.map(([, label]) => (
                  <th key={label} className="px-2 py-2 w-20">{label}</th>
                ))}
                <th className="px-2 py-2 w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {blockRows.map((r) => (
                <tr key={r.key} className="border-t border-slate-200">
                  <td className="px-2 py-1">
                    <input
                      value={r.university}
                      onChange={(e) => update(r.key, "university", e.target.value)}
                      placeholder="大学名"
                      className="w-full min-w-32 rounded border border-slate-300 px-2 py-1.5"
                    />
                  </td>
                  {NUM_COLS.map(([field]) => (
                    <td key={field} className="px-1 py-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={Number.isNaN(r[field]) ? "" : r[field]}
                        onChange={(e) => update(r.key, field, e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-center"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 whitespace-nowrap text-center">
                    <button type="button" aria-label="上へ"
                      onClick={() => setRows((rs) => moveRow(rs, r.key, -1))}
                      className="px-1.5 py-1 text-slate-500 hover:text-slate-900">↑</button>
                    <button type="button" aria-label="下へ"
                      onClick={() => setRows((rs) => moveRow(rs, r.key, 1))}
                      className="px-1.5 py-1 text-slate-500 hover:text-slate-900">↓</button>
                    <button type="button" aria-label="削除"
                      onClick={() => setRows((rs) => removeRow(rs, r.key))}
                      className="px-1.5 py-1 text-red-500 hover:text-red-700">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-200">
          <button type="button"
            onClick={() => setRows((rs) => addRow(rs, block, newKey()))}
            className="text-sm text-emerald-700 font-semibold">
            ＋ 行を追加
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {blockTable("A")}
      {blockTable("B")}
      {message && (
        <p
          role="status"
          className={
            message.kind === "ok"
              ? "rounded bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-sm"
              : "rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm"
          }
        >
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full md:w-auto rounded bg-slate-900 text-white px-8 py-3 font-bold disabled:opacity-50"
      >
        {isPending ? "保存中..." : "保存して公開に反映"}
      </button>
    </div>
  );
}
