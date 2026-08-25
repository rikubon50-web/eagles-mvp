import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logout } from "@/app/admin/actions";
import StandingsEditor from "./StandingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminStandingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  if (profile.role !== "admin") {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="text-slate-600 text-sm">
          星取表の編集には管理者権限が必要です。担当者に連絡してください。
        </p>
        <form action={logout}>
          <button className="text-sm text-emerald-700 underline">ログアウト</button>
        </form>
      </div>
    );
  }

  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("standings_rows")
    .select("block, rank, university, points, games, gf, diff, sort_order")
    .order("sort_order");

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">星取表の編集</h1>
        <form action={logout}>
          <button className="text-sm text-slate-500 underline">ログアウト</button>
        </form>
      </div>
      <StandingsEditor initialRows={data ?? []} />
    </div>
  );
}
