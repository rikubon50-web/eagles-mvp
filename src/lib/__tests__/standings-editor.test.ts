import { describe, it, expect } from "vitest";
import {
  addRow, removeRow, moveRow, normalizeSortOrder, type EditorRow,
} from "@/lib/standings-editor";

const r = (key: string, block: "A" | "B", sort: number): EditorRow => ({
  key, block, rank: sort + 1, university: `大学${key}`,
  points: 0, games: 0, gf: 0, diff: 0, sort_order: sort,
});

describe("addRow", () => {
  it("指定ブロックの末尾に追加し rank は末尾+1", () => {
    const out = addRow([r("a1", "A", 0)], "A", "new");
    expect(out).toHaveLength(2);
    const added = out.find((x) => x.key === "new")!;
    expect(added.block).toBe("A");
    expect(added.rank).toBe(2);
    expect(added.university).toBe("");
  });
});

describe("removeRow", () => {
  it("key の行を除く", () => {
    const out = removeRow([r("a1", "A", 0), r("a2", "A", 1)], "a1");
    expect(out.map((x) => x.key)).toEqual(["a2"]);
  });
});

describe("moveRow", () => {
  it("同一ブロック内で上に移動する", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1), r("b1", "B", 0)];
    const out = moveRow(rows, "a2", -1);
    const a = out.filter((x) => x.block === "A").sort((x, y) => x.sort_order - y.sort_order);
    expect(a.map((x) => x.key)).toEqual(["a2", "a1"]);
    // 他ブロックは不変
    expect(out.find((x) => x.key === "b1")!.sort_order).toBe(0);
  });
  it("先頭をさらに上へは動かさない", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1)];
    expect(moveRow(rows, "a1", -1)).toEqual(rows);
  });
  it("同一ブロック内で下に移動する", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1)];
    const out = moveRow(rows, "a1", 1);
    const a = out.filter((x) => x.block === "A").sort((x, y) => x.sort_order - y.sort_order);
    expect(a.map((x) => x.key)).toEqual(["a2", "a1"]);
    expect(out.find((x) => x.key === "a1")!.sort_order).toBe(1);
    expect(out.find((x) => x.key === "a2")!.sort_order).toBe(0);
  });
  it("末尾をさらに下へは動かさない", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1)];
    expect(moveRow(rows, "a2", 1)).toEqual(rows);
  });
});

describe("normalizeSortOrder", () => {
  it("ブロックごとに 0..n を振り直す", () => {
    const rows = [r("a1", "A", 5), r("a2", "A", 9), r("b1", "B", 3)];
    const out = normalizeSortOrder(rows);
    expect(out.find((x) => x.key === "a1")!.sort_order).toBe(0);
    expect(out.find((x) => x.key === "a2")!.sort_order).toBe(1);
    expect(out.find((x) => x.key === "b1")!.sort_order).toBe(0);
  });
});

describe("renumberRanks", () => {
  const vm = (key: string, block: "A" | "B", sort: number, rank: string) =>
    ({ key, block, sort_order: sort, rank, university: `大学${key}` });
  it("ブロックごとに表示順で順位を1から振り直す", async () => {
    const { renumberRanks } = await import("@/lib/standings-editor");
    const rows = [vm("a2", "A", 1, "9"), vm("a1", "A", 0, "5"), vm("b1", "B", 0, "3")];
    const out = renumberRanks(rows);
    expect(out.find((r) => r.key === "a1")!.rank).toBe("1");
    expect(out.find((r) => r.key === "a2")!.rank).toBe("2");
    expect(out.find((r) => r.key === "b1")!.rank).toBe("1");
  });
  it("元配列を破壊しない", async () => {
    const { renumberRanks } = await import("@/lib/standings-editor");
    const rows = [vm("a1", "A", 0, "5")];
    renumberRanks(rows);
    expect(rows[0].rank).toBe("5");
  });
});
