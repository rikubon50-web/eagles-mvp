import type { StandingsRowInput } from "@/lib/standings";

export type EditorRow = StandingsRowInput & { key: string };

function blockRows(rows: EditorRow[], block: "A" | "B"): EditorRow[] {
  return rows
    .filter((r) => r.block === block)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function addRow(rows: EditorRow[], block: "A" | "B", key: string): EditorRow[] {
  const siblings = blockRows(rows, block);
  const next: EditorRow = {
    key,
    block,
    rank: siblings.length + 1,
    university: "",
    points: 0,
    games: 0,
    gf: 0,
    diff: 0,
    sort_order: siblings.length,
  };
  return [...rows, next];
}

export function removeRow(rows: EditorRow[], key: string): EditorRow[] {
  return normalizeSortOrder(rows.filter((r) => r.key !== key));
}

export function moveRow(rows: EditorRow[], key: string, dir: -1 | 1): EditorRow[] {
  const target = rows.find((r) => r.key === key);
  if (!target) return rows;
  const siblings = blockRows(rows, target.block);
  const idx = siblings.findIndex((r) => r.key === key);
  const swapWith = siblings[idx + dir];
  if (!swapWith) return rows;
  return rows.map((r) => {
    if (r.key === target.key) return { ...r, sort_order: swapWith.sort_order };
    if (r.key === swapWith.key) return { ...r, sort_order: target.sort_order };
    return r;
  });
}

export function normalizeSortOrder(rows: EditorRow[]): EditorRow[] {
  const renumbered = new Map<string, number>();
  (["A", "B"] as const).forEach((block) => {
    blockRows(rows, block).forEach((r, i) => renumbered.set(r.key, i));
  });
  return rows.map((r) => ({ ...r, sort_order: renumbered.get(r.key)! }));
}
