import Link from "next/link";

export const metadata = {
  title: "サポート・ご支援",
  description:
    "青山学院大学男子ラクロス部 EAGLESへのご支援について。個人サポーター（NEST）・法人スポンサーの皆さまからのサポートを募集しています。",
  alternates: { canonical: "/support" },
};

export default function SupportTop() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">SUPPORT</h1>
        <p className="mt-3 text-slate-600">
          目的に応じてサポート窓口をご案内します。
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card hover:shadow-lg transition">
          <h2 className="section-title text-2xl font-bold mb-2">For Companies</h2>
          <p className="text-slate-700">スポンサー／タイアップ／取材のご相談。</p>
          <div className="mt-4">
            <Link href="/support/corporate" className="button-32 mt-4">企業の方へ</Link>
          </div>
        </div>

        <div className="card hover:shadow-lg transition">
          <h2 className="section-title text-2xl font-bold mb-2">For Community</h2>
          <p className="text-slate-700">OB・保護者・一般サポーター向けのご案内。</p>
          <div className="mt-4">
            <Link href="/support/community" className="button-32 mt-4">コミュニティの皆さまへ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}