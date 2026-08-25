import Link from "next/link";
import { login } from "@/app/admin/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-sm mx-auto pt-16 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">部員ログイン</h1>
      {searchParams.error && (
        <p className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {searchParams.error}
        </p>
      )}
      <form action={login} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">メールアドレス</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">パスワード</span>
          <input name="password" type="password" required autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit"
          className="w-full rounded bg-slate-900 text-white py-2 font-semibold">
          ログイン
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        アカウントがない部員は{" "}
        <Link href="/admin/signup" className="text-emerald-700 underline">新規登録</Link>
      </p>
    </div>
  );
}
