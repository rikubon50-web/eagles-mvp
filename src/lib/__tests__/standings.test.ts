import { describe, it, expect } from "vitest";
import {
  standingsRowsSchema,
  toBoardRows,
  formatJstDate,
  type StandingsRowInput,
} from "@/lib/standings";

const row = (over: Partial<StandingsRowInput> = {}): StandingsRowInput => ({
  block: "A",
  rank: 1,
  university: "青山学院大",
  points: 3,
  games: 2,
  gf: 10,
  diff: 4,
  sort_order: 0,
  ...over,
});

describe("standingsRowsSchema", () => {
  it("正しい行を受理する", () => {
    expect(standingsRowsSchema.safeParse([row()]).success).toBe(true);
  });
  it("大学名が空だと拒否する", () => {
    expect(standingsRowsSchema.safeParse([row({ university: " " })]).success).toBe(false);
  });
  it("数値が整数でないと拒否する", () => {
    expect(standingsRowsSchema.safeParse([row({ points: 1.5 })]).success).toBe(false);
  });
  it("block が A/B 以外だと拒否する", () => {
    expect(standingsRowsSchema.safeParse([{ ...row(), block: "C" }]).success).toBe(false);
  });
});

describe("toBoardRows", () => {
  it("sort_order 昇順に並べ、値を文字列化する", () => {
    const out = toBoardRows([
      row({ university: "二番目", sort_order: 1 }),
      row({ university: "一番目", sort_order: 0, diff: -2 }),
    ]);
    expect(out[0].university).toBe("一番目");
    expect(out[0].diff).toBe("-2");
    expect(out[1].university).toBe("二番目");
    expect(out[0].block).toBe("A");
  });
});

describe("formatJstDate", () => {
  it("UTC の ISO 文字列を JST の日付にする", () => {
    // UTC 2026-08-24 20:00 = JST 2026-08-25 05:00
    expect(formatJstDate("2026-08-24T20:00:00Z")).toBe("2026/8/25");
  });
});
