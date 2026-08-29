import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";

export type Profile = { userId: string; name: string; role: "admin" | "member" };

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .single();
  if (data) return { userId: user.id, name: data.name, role: data.role };

  // profiles にレコードがない（signup 時の insert 失敗などで孤立した auth アカウント）。
  // 自己修復として profiles 行を作成し、再取得する。
  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "部員";
  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, name });
  if (insertError) {
    console.error("getProfile: self-heal insert failed", insertError);
    return null;
  }

  const { data: healed } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .single();
  if (!healed) return null;
  return { userId: user.id, name: healed.name, role: healed.role };
});
