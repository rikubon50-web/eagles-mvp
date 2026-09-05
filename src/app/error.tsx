"use client";

import Link from "next/link";
import { useEffect } from "react";

// ルート配下の描画エラー（microCMS / Supabase の取得失敗など）を白画面にせず、
// 主要ページへの導線付きで表示する。再試行ボタンで同じルートを再描画できる。
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="section-title text-4xl font-bold">ERROR</p>
      <h1 className="mt-6 text-xl font-bold text-slate-900">ページを表示できませんでした</h1>
      <p className="mt-3 text-sm text-slate-600">
        一時的にデータを取得できない状態です。少し待ってからもう一度お試しください。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="button-32">
          もう一度読み込む
        </button>
        <Link href="/" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-700">
          ホームへ
        </Link>
      </div>
    </div>
  );
}
