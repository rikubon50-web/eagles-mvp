import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PvRow = { day: string; path: string; views: number };

// JSTの日付文字列 YYYY-MM-DD
function jstDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // en-CAはYYYY-MM-DD形式
}

const PATH_LABELS: Record<string, string> = {
  "/": "ホーム",
  "/blog": "ブログ一覧",
  "/games": "試合情報",
  "/standings": "順位表",
  "/roster": "ロスター",
  "/about": "ABOUT",
  "/news": "ニュース",
  "/recruit": "新歓",
  "/support": "サポート",
  "/contact": "お問い合わせ",
};

export default async function AdminAnalyticsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  const supabase = createSupabaseServer();
  const since = jstDate(-29);
  const { data, error } = await supabase
    .from("page_views_daily")
    .select("day, path, views")
    .gte("day", since);

  const rows: PvRow[] = (data as PvRow[] | null) ?? [];
  const today = jstDate(0);
  const d7 = jstDate(-6);

  const total = (from: string) =>
    rows.filter((r) => r.day >= from).reduce((a, r) => a + r.views, 0);
  const totalToday = total(today);
  const total7 = total(d7);
  const total30 = rows.reduce((a, r) => a + r.views, 0);

  // 直近14日の日別合計（0埋め）
  const days: { day: string; label: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = jstDate(-i);
    const views = rows.filter((r) => r.day === day).reduce((a, r) => a + r.views, 0);
    days.push({ day, label: day.slice(5).replace("-", "/"), views });
  }
  const maxDaily = Math.max(1, ...days.map((d) => d.views));

  // 30日のページ別トップ10
  const byPath = new Map<string, number>();
  for (const r of rows) byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.views);
  const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxPath = Math.max(1, ...topPaths.map(([, v]) => v));

  // ブログ記事パスはタイトルに解決
  const blogIds = topPaths
    .map(([p]) => p.match(/^\/blog\/([a-z0-9_-]+)$/i)?.[1])
    .filter((x): x is string => !!x);
  const titleMap = new Map<string, string>();
  if (blogIds.length > 0) {
    const { data: posts } = await supabase.from("posts").select("id, title").in("id", blogIds);
    for (const p of posts ?? []) titleMap.set(p.id, p.title);
  }
  const pathLabel = (p: string): string => {
    if (PATH_LABELS[p]) return PATH_LABELS[p];
    const blogId = p.match(/^\/blog\/([a-z0-9_-]+)$/i)?.[1];
    if (blogId) return `📝 ${titleMap.get(blogId) ?? p}`;
    if (p.startsWith("/roster/")) return `選手詳細 (${p.slice(8)})`;
    if (p.startsWith("/news/")) return `ニュース記事`;
    if (p.startsWith("/games/")) return `試合詳細`;
    return p;
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">アクセス解析</h1>
        <p className="mt-1 text-sm text-slate-500">
          公式サイトの閲覧数（ページビュー）。管理画面へのアクセスは含みません。
        </p>
      </div>

      {error ? (
        <p className="rounded bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">
          データをまだ取得できません（集計テーブルが未作成の可能性があります）。
        </p>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["今日", totalToday],
              ["直近7日", total7],
              ["直近30日", total30],
            ].map(([label, v]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">{label}</div>
                <div className="mt-1 text-2xl md:text-3xl font-extrabold tabular-nums text-slate-900">
                  {Number(v).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* 日別グラフ（直近14日） */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">日別ページビュー（直近14日）</h2>
            <div className="flex items-end gap-[6px] h-36 border-b border-slate-200">
              {days.map((d, i) => {
                const isMax = d.views === maxDaily && d.views > 0;
                const isToday = d.day === today;
                return (
                  <div
                    key={d.day}
                    className="relative flex-1 flex flex-col items-center justify-end h-full"
                    title={`${d.label}: ${d.views.toLocaleString()} PV`}
                  >
                    {(isMax || (isToday && d.views > 0)) && (
                      <span className="mb-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                        {d.views.toLocaleString()}
                      </span>
                    )}
                    <div
                      className="w-full rounded-t bg-[#047857]"
                      style={{ height: `${Math.max(d.views > 0 ? 3 : 0, (d.views / maxDaily) * 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex gap-[6px]">
              {days.map((d, i) => (
                <div key={d.day} className="flex-1 text-center text-[10px] text-slate-500">
                  {i % 2 === 1 ? d.label : ""}
                </div>
              ))}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-500">日別の数値を表で見る</summary>
              <table className="mt-2 w-full text-sm" aria-label="日別ページビュー">
                <tbody>
                  {days.map((d) => (
                    <tr key={d.day} className="border-b border-slate-100">
                      <td className="py-1 text-slate-600">{d.label}</td>
                      <td className="py-1 text-right tabular-nums text-slate-900">{d.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>

          {/* ページ別トップ10（30日） */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">よく見られているページ（直近30日）</h2>
            {topPaths.length === 0 ? (
              <p className="text-sm text-slate-500">まだデータがありません。集計は今日から始まります。</p>
            ) : (
              <ul className="space-y-3">
                {topPaths.map(([p, v]) => (
                  <li key={p}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-slate-700">{pathLabel(p)}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {v.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-[#047857]"
                        style={{ width: `${(v / maxPath) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-slate-400">
            計測はこのページ公開時点から。ブログ個別の閲覧数・スキはブログ管理ページにもあります。
          </p>
        </>
      )}
    </div>
  );
}
