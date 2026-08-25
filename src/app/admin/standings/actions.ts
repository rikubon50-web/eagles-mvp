"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { standingsRowsSchema, type StandingsRowInput } from "@/lib/standings";

export async function saveStandings(
  rows: StandingsRowInput[]
): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "編集権限がありません" };
  }

  const parsed = standingsRowsSchema.safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります: " + parsed.error.issues[0]?.message };
  }

  const supabase = createSupabaseServer();
  // 全置換（担当者は実質1人のため last-write-wins）
  const del = await supabase.from("standings_rows").delete().neq("block", "");
  if (del.error) return { ok: false, error: "保存に失敗しました: " + del.error.message };
  const ins = await supabase.from("standings_rows").insert(parsed.data);
  if (ins.error) return { ok: false, error: "保存に失敗しました: " + ins.error.message };
  const meta = await supabase
    .from("standings_meta")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (meta.error) return { ok: false, error: "更新日の記録に失敗しました: " + meta.error.message };

  revalidatePath("/");
  revalidatePath("/standings");
  return { ok: true };
}
