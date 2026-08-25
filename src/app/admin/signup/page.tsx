import Link from "next/link";
import { signup } from "@/app/admin/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-sm mx-auto pt-16 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">部員アカウント登録</h1>
      {searchParams.error && (
        <p className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {searchParams.error}
        </p>
      )}
      <form action={signup} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">招待コード（部内共有）</span>
          <input name="invite" type="text" required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">名前</span>
          <input name="name" type="text" required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">メールアドレス</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">パスワード（8文字以上）</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit"
          className="w-full rounded bg-slate-900 text-white py-2 font-semibold">
          登録する
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        すでにアカウントがある場合は{" "}
        <Link href="/admin/login" className="text-emerald-700 underline">ログイン</Link>
      </p>
    </div>
  );
}
