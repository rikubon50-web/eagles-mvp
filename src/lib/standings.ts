import { z } from "zod";
import { createSupabasePublic } from "@/lib/supabase/public";

// 大会名（年度更新はここだけ変更する）
export const LEAGUE_TITLE = "関東学生ラクロスリーグ戦2026 男子1部";

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
    .sort((a, b) =>
      a.block === b.block
        ? a.sort_order - b.sort_order
        : a.block < b.block
          ? -1
          : 1
    )
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

export type StandingsData = {
  rows: Record<string, string>[];
  updatedAt?: string;
  leagueTitle: string;
};

// 取得失敗時はthrowし、ISRが前回成功時のページを維持する。
// （meta（更新日）のみの取得失敗はthrowしない。表示上は更新日なしとして扱う）
export async function fetchStandings(): Promise<StandingsData> {
  const supabase = createSupabasePublic();
  const [rowsRes, metaRes] = await Promise.all([
    supabase.from("standings_rows").select("*"),
    supabase.from("standings_meta").select("*").eq("id", 1).single(),
  ]);
  if (rowsRes.error) throw rowsRes.error;
  if (metaRes.error) console.error("fetchStandings meta failed:", metaRes.error);
  const rows = toBoardRows(rowsRes.data ?? []);
  // league_title列が未追加/未入力の間は定数にフォールバック
  const leagueTitle =
    (metaRes.data as { league_title?: string } | null)?.league_title?.trim() || LEAGUE_TITLE;
  const updatedAt = metaRes.data?.updated_at
    ? formatJstDate(metaRes.data.updated_at)
    : undefined;
  return { rows, updatedAt, leagueTitle };
}
