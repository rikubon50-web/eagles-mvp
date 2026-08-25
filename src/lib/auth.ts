import { createSupabaseServer } from "@/lib/supabase/server";

export type Profile = { userId: string; name: string; role: "admin" | "member" };

export async function getProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .single();
  if (!data) return null;
  return { userId: user.id, name: data.name, role: data.role };
}
