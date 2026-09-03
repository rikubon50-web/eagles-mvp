import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  const isAdmin = profile.role === "admin";

  const menu = [
    {
      href: "/admin/blog",
      title: "ブログ",
      desc: "記事の作成・編集（部員全員）",
      show: true,
    },
    {
      href: "/admin/analytics",
      title: "アクセス解析",
      desc: "サイトの閲覧数・人気ページ（部員全員）",
      show: true,
    },
    {
      href: "/admin/standings",
      title: "星取表",
      desc: "リーグ戦の順位・勝点の編集",
      show: isAdmin,
    },
    {
      href: "/admin/games",
      title: "試合情報",
      desc: "試合の追加・スコア・相手ロゴの編集",
      show: isAdmin,
    },
  ].filter((m) => m.show);

  return (
    <div className="max-w-md mx-auto pt-10 px-4 pb-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">管理メニュー</h1>
      <p className="text-sm text-slate-600 mb-8">{profile.name} さんとしてログイン中</p>

      <div className="space-y-3">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="block rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-emerald-500 transition-colors"
          >
            <span className="block font-bold text-slate-900">{m.title}</span>
            <span className="block text-sm text-slate-600">{m.desc}</span>
          </Link>
        ))}
      </div>

      {!isAdmin && (
        <p className="mt-4 text-xs text-slate-500">
          星取表・試合情報の編集は管理者のみ利用できます。必要な場合は担当者に連絡してください。
        </p>
      )}

      <div className="mt-10 flex items-center justify-between text-sm">
        <Link href="/" className="text-emerald-700 underline">
          公開サイトを見る
        </Link>
        <form action={logout}>
          <button className="text-slate-500 underline">ログアウト</button>
        </form>
      </div>
    </div>
  );
}
