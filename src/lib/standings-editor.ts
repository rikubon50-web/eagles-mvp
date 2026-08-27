import type { StandingsRowInput } from "@/lib/standings";

export type EditorRow = StandingsRowInput & { key: string };

// removeRow/moveRow/normalizeSortOrder は key/block/sort_order しか参照しないため、
// 行の中身の型（数値 or 文字列）に依存しないジェネリックにしている。
// これにより管理画面側で数値セルを文字列で保持する VM 型でも同じ関数を共有できる。
type RowBase = { key: string; block: "A" | "B"; sort_order: number };

function blockRows<T extends RowBase>(rows: T[], block: "A" | "B"): T[] {
  return rows
    .filter((r) => r.block === block)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function addRow(rows: EditorRow[], block: "A" | "B", key: string): EditorRow[];
export function addRow<T extends RowBase>(
  rows: T[],
  block: "A" | "B",
  key: string,
  makeFields: (rank: number) => Omit<T, keyof RowBase>
): T[];
export function addRow<T extends RowBase>(
  rows: T[],
  block: "A" | "B",
  key: string,
  makeFields?: (rank: number) => Omit<T, keyof RowBase>
): T[] {
  const siblings = blockRows(rows, block);
  const rank = siblings.length + 1;
  // makeFields 省略時は従来通り EditorRow（数値）のデフォルト値を組み立てる。
  const fields = makeFields
    ? makeFields(rank)
    : ({ rank, university: "", points: 0, games: 0, gf: 0, diff: 0 } as unknown as Omit<T, keyof RowBase>);
  const next = { ...fields, key, block, sort_order: siblings.length } as T;
  return [...rows, next];
}

export function removeRow<T extends RowBase>(rows: T[], key: string): T[] {
  return normalizeSortOrder(rows.filter((r) => r.key !== key));
}

export function moveRow<T extends RowBase>(rows: T[], key: string, dir: -1 | 1): T[] {
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

export function normalizeSortOrder<T extends RowBase>(rows: T[]): T[] {
  const renumbered = new Map<string, number>();
  (["A", "B"] as const).forEach((block) => {
    blockRows(rows, block).forEach((r, i) => renumbered.set(r.key, i));
  });
  return rows.map((r) => ({ ...r, sort_order: renumbered.get(r.key)! }));
}

// 行の並び（sort_order）に合わせて順位をブロックごとに1から振り直す。
// ↑↓での並べ替え直後に呼び、「動かした順番＝順位」という直感的な挙動にする。
// 同順位にしたい場合は振り直し後に順位セルを手で編集すればよい。
export function renumberRanks<T extends RowBase & { rank: string }>(rows: T[]): T[] {
  const ranked = new Map<string, string>();
  (["A", "B"] as const).forEach((block) => {
    blockRows(rows, block).forEach((r, i) => ranked.set(r.key, String(i + 1)));
  });
  return rows.map((r) => ({ ...r, rank: ranked.get(r.key)! }));
}
