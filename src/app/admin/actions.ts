"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/admin/login?error=" + encodeURIComponent("メールアドレスまたはパスワードが違います"));
  }
  redirect("/admin/standings");
}

export async function signup(formData: FormData) {
  const invite = String(formData.get("invite") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const fail = (msg: string) => redirect("/admin/signup?error=" + encodeURIComponent(msg));

  if (invite !== process.env.ADMIN_INVITE_CODE) fail("招待コードが違います");
  if (!name) fail("名前を入力してください");
  if (password.length < 8) fail("パスワードは8文字以上にしてください");

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error || !data.user) {
    console.error("signup: auth.signUp failed", error);
    fail("登録に失敗しました。入力内容を確認するか、時間をおいて再度お試しください。");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ user_id: data.user!.id, name });
  if (profileError) {
    console.error("signup: profiles.insert failed", profileError);
    fail("登録に失敗しました。入力内容を確認するか、時間をおいて再度お試しください。");
  }

  redirect("/admin/standings");
}

export async function logout() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
