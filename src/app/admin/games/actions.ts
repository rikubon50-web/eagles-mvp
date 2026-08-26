"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { gameInputSchema, type GameInput } from "@/lib/games-domain";

function revalidateGame(id: string) {
  revalidatePath("/games");
  revalidatePath(`/games/${id}`);
  revalidatePath("/");
}

export async function saveGame(
  input: GameInput & { id: string | null }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "権限がありません" };
  }

  // フォームの「未選択」は空文字になるため、スキーマ検証前に null へ正規化する
  const normalized = {
    ...input,
    opponentLogoUrl: input.opponentLogoUrl === "" ? null : input.opponentLogoUrl,
  };

  const parsed = gameInputSchema.safeParse(normalized);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const supabase = createSupabaseServer();
  const row = {
    title: parsed.data.title,
    start_at: parsed.data.startAt,
    venue: parsed.data.venue,
    opponent: parsed.data.opponent,
    status: parsed.data.status,
    our_score: parsed.data.ourScore,
    opp_score: parsed.data.oppScore,
    note: parsed.data.note,
    opponent_logo_url: parsed.data.opponentLogoUrl,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("games").update(row).eq("id", input.id);
    if (error) {
      console.error("saveGame update failed:", error);
      return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
    }
    revalidateGame(input.id);
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase.from("games").insert(row).select("id").single();
  if (error || !data) {
    console.error("saveGame insert failed:", error);
    return { ok: false, error: "保存に失敗しました。時間をおいて再度お試しください" };
  }
  revalidateGame(data.id);
  return { ok: true, id: data.id };
}

export async function deleteGame(id: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "権限がありません" };
  }
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error("deleteGame failed:", error);
    return { ok: false, error: "削除に失敗しました" };
  }
  revalidateGame(id);
  return { ok: true };
}
