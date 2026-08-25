import { z } from "zod";

export const standingsRowSchema = z.object({
  block: z.enum(["A", "B"]),
  rank: z.number().int(),
  university: z.string().trim().min(1, "大学名を入力してください"),
  points: z.number().int(),
  games: z.number().int(),
  gf: z.number().int(),
  diff: z.number().int(),
  sort_order: z.number().int(),
});

export const standingsRowsSchema = z.array(standingsRowSchema);

export type StandingsRowInput = z.infer<typeof standingsRowSchema>;

// StandingsBoard は文字列値の Record を期待する（既存CSV互換）
export function toBoardRows(rows: StandingsRowInput[]): Record<string, string>[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      block: r.block,
      rank: String(r.rank),
      university: r.university,
      points: String(r.points),
      games: String(r.games),
      gf: String(r.gf),
      diff: String(r.diff),
    }));
}

export function formatJstDate(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}
