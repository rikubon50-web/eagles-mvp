import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PvRow = { day: string; path: string; views: number };
type VisitorRow = { day: string; visitor: string };
type StatRow = { day: string; kind: string; key: string; count: number };

// JSTの日付文字列 YYYY-MM-DD
function jstDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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

const SOURCE_LABELS: Record<string, string> = {
  direct: "直接アクセス（URL直打ち・LINE・アプリ内など）",
  instagram: "Instagram",
  x: "X (Twitter)",
  google: "Google検索",
  yahoo: "Yahoo!検索",
  bing: "Bing検索",
  ameblo: "アメブロ",
  line: "LINE",
};

export default async function AdminAnalyticsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  const supabase = createSupabaseServer();
  const since = jstDate(-29);
  const [pvRes, visRes, statRes] = await Promise.all([
    supabase.from("page_views_daily").select("day, path, views").gte("day", since),
    supabase.from("visitors_daily").select("day, visitor").gte("day", since),
    supabase.from("site_stats_daily").select("day, kind, key, count").gte("day", since),
  ]);

  const rows: PvRow[] = (pvRes.data as PvRow[] | null) ?? [];
  const visitors: VisitorRow[] = (visRes.data as VisitorRow[] | null) ?? [];
  const stats: StatRow[] = (statRes.data as StatRow[] | null) ?? [];
  const v2Ready = !visRes.error && !statRes.error;

  const today = jstDate(0);
  const d7 = jstDate(-6);

  const pvTotal = (from: string) =>
    rows.filter((r) => r.day >= from).reduce((a, r) => a + r.views, 0);
  const uniqueTotal = (from: string) =>
    new Set(visitors.filter((v) => v.day >= from).map((v) => v.visitor)).size;

  const tiles = [
    { label: "今日", pv: pvTotal(today), uu: uniqueTotal(today) },
    { label: "直近7日", pv: pvTotal(d7), uu: uniqueTotal(d7) },
    { label: "直近30日", pv: pvTotal(since), uu: uniqueTotal(since) },
  ];

  // 直近14日の日別（訪問者数とPV、0埋め）
  const days: { day: string; label: string; pv: number; uu: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = jstDate(-i);
    days.push({
      day,
      label: day.slice(5).replace("-", "/"),
      pv: rows.filter((r) => r.day === day).reduce((a, r) => a + r.views, 0),
      uu: visitors.filter((v) => v.day === day).length,
    });
  }
  const maxDaily = Math.max(1, ...days.map((d) => d.uu));

  // 流入元（30日・セッション単位）
  const bySource = new Map<string, number>();
  for (const s of stats) if (s.kind === "referrer") bySource.set(s.key, (bySource.get(s.key) ?? 0) + s.count);
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSource = Math.max(1, ...sources.map(([, v]) => v));

  // デバイス（30日）
  const device = { mobile: 0, desktop: 0 };
  for (const s of stats) {
    if (s.kind === "device" && (s.key === "mobile" || s.key === "desktop")) device[s.key] += s.count;
  }
  const deviceTotal = device.mobile + device.desktop;

  // ページ別トップ10（30日）
  const byPath = new Map<string, number>();
  for (const r of rows) byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.views);
  const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxPath = Math.max(1, ...topPaths.map(([, v]) => v));

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
    if (p.startsWith("/news/")) return "ニュース記事";
    if (p.startsWith("/games/")) return "試合詳細";
    return p;
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">アクセス解析</h1>
        <p className="mt-1 text-sm text-slate-500">
          公式サイトの訪問者数・閲覧数。管理画面へのアクセスは含みません。
        </p>
      </div>

      {pvRes.error ? (
        <p className="rounded bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">
          データをまだ取得できません（集計テーブルが未作成の可能性があります）。
        </p>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">{t.label}</div>
                <div className="mt-1 text-2xl md:text-3xl font-extrabold tabular-nums text-slate-900">
                  {t.uu.toLocaleString()}
                  <span className="ml-1 text-sm font-bold text-slate-500">人</span>
                </div>
                <div className="text-xs tabular-nums text-slate-500">{t.pv.toLocaleString()} PV</div>
              </div>
            ))}
          </div>

          {/* 日別グラフ（訪問者数・直近14日） */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">日別訪問者数（直近14日）</h2>
            <div className="flex items-end gap-[6px] h-36 border-b border-slate-200">
              {days.map((d) => {
                const isMax = d.uu === maxDaily && d.uu > 0;
                const isToday = d.day === today;
                return (
                  <div
                    key={d.day}
                    className="relative flex-1 flex flex-col items-center justify-end h-full"
                    title={`${d.label}: ${d.uu.toLocaleString()}人 / ${d.pv.toLocaleString()} PV`}
                  >
                    {(isMax || (isToday && d.uu > 0)) && (
                      <span className="mb-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                        {d.uu.toLocaleString()}
                      </span>
                    )}
                    <div
                      className="w-full rounded-t bg-[#047857]"
                      style={{ height: `${Math.max(d.uu > 0 ? 3 : 0, (d.uu / maxDaily) * 100)}%` }}
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
              <table className="mt-2 w-full text-sm" aria-label="日別の訪問者数とページビュー">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="py-1 font-semibold">日付</th>
                    <th className="py-1 text-right font-semibold">訪問者</th>
                    <th className="py-1 text-right font-semibold">PV</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.day} className="border-b border-slate-100">
                      <td className="py-1 text-slate-600">{d.label}</td>
                      <td className="py-1 text-right tabular-nums text-slate-900">{d.uu.toLocaleString()}</td>
                      <td className="py-1 text-right tabular-nums text-slate-500">{d.pv.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>

          {/* 流入元 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">どこから来たか（直近30日・訪問単位）</h2>
            {!v2Ready || sources.length === 0 ? (
              <p className="text-sm text-slate-500">まだデータがありません。計測開始後に貯まっていきます。</p>
            ) : (
              <ul className="space-y-3">
                {sources.map(([k, v]) => (
                  <li key={k}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-slate-700">{SOURCE_LABELS[k] ?? k}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {v.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-slate-100">
                      <div className="h-2 rounded bg-[#047857]" style={{ width: `${(v / maxSource) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* デバイス */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3">デバイス（直近30日）</h2>
            {deviceTotal === 0 ? (
              <p className="text-sm text-slate-500">まだデータがありません。</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded bg-slate-100">
                  <div className="bg-[#047857]" style={{ width: `${(device.mobile / deviceTotal) * 100}%` }} />
                  <div className="bg-slate-400" style={{ width: `${(device.desktop / deviceTotal) * 100}%` }} />
                </div>
                <div className="mt-2 flex gap-5 text-sm text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#047857]" aria-hidden />
                    スマホ {Math.round((device.mobile / deviceTotal) * 100)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-400" aria-hidden />
                    PC {Math.round((device.desktop / deviceTotal) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ページ別トップ10 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">よく見られているページ（直近30日・PV）</h2>
            {topPaths.length === 0 ? (
              <p className="text-sm text-slate-500">まだデータがありません。</p>
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
                      <div className="h-2 rounded bg-[#047857]" style={{ width: `${(v / maxPath) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-slate-400">
            訪問者数は端末ごとの匿名IDで数えたユニーク数（同じ人が別の端末で見ると2人と数えます）。
            流入元・デバイスの計測は機能追加時点から。ブログ個別の閲覧数・スキはブログ管理ページにもあります。
          </p>
        </>
      )}
    </div>
  );
}
