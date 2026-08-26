import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import GameForm from "../GameForm";

export const dynamic = "force-dynamic";

export default async function AdminGameNewPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  if (profile.role !== "admin") {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="text-slate-600 text-sm">
          試合情報の編集には管理者権限が必要です。担当者に連絡してください。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">新規試合登録</h1>
      <GameForm initial={null} />
    </div>
  );
}
