import Link from "next/link";

export const metadata = { title: "ページが見つかりません" };

// 旧サイトのURLなど、存在しないページに来た人を主要ページへ案内する
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="section-title text-5xl font-bold">404</p>
      <h1 className="mt-6 text-xl font-bold text-slate-900">ページが見つかりません</h1>
      <p className="mt-3 text-sm text-slate-600">
        サイトをリニューアルしたため、URLが変わった可能性があります。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {[
          ["/", "ホーム"],
          ["/games", "試合情報"],
          ["/blog", "ブログ"],
          ["/roster", "ロスター"],
          ["/recruit", "新歓"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
