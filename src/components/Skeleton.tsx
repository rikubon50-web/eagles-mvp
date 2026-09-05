// src/components/Skeleton.tsx
// ページ切り替え直後に出す骨格。各ルートの loading.tsx から組み合わせて使う。
// 実ページと同じ見出し・余白にしておくと、データ到着時のガタつきが小さい。

export function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-4/6" />
      </div>
    </div>
  );
}

/** 一覧ページの見出し（実ページと同じ section-title を本物の文字で出す） */
export function PageTitle({ title, className = "" }: { title: string; className?: string }) {
  return (
    <h1 className={`section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6 mt-6 md:mt-12 ${className}`}>{title}</h1>
  );
}

/** ブログ一覧・関連記事のカード枠（モバイル=横並び行、md以上=カード） */
export function BlogCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-0 max-md:divide-y max-md:divide-slate-200 md:grid-cols-3 md:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-row-reverse items-center gap-4 px-2 py-4 md:flex-col md:items-stretch md:rounded-xl md:border md:bg-white md:p-6">
          <div className="h-24 w-24 shrink-0 rounded-lg bg-slate-200 md:mb-3 md:h-auto md:w-full md:aspect-[16/9]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-11/12 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 詳細ページ上部の紺色見出し帯（記事・選手） */
export function DarkBandSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900 ${tall ? "py-10 md:py-14" : "py-8 md:py-12"}`}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-700 mb-5" />
        <div className="h-3 w-32 rounded bg-slate-700 mb-4" />
        <div className="h-8 w-3/4 rounded bg-slate-700 md:h-10 md:w-1/2" />
      </div>
    </div>
  );
}

/** 本文ブロック（段落の束） */
export function ParagraphSkeleton({ lines = 8 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-slate-200" style={{ width: `${[100, 92, 96, 70, 100, 88, 94, 60][i % 8]}%` }} />
      ))}
    </div>
  );
}

/** 選手カード（3:4）のグリッド */
export function PlayerGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mx-auto w-full max-w-[280px] rounded-xl bg-slate-200" style={{ aspectRatio: "3/4" }} />
      ))}
    </div>
  );
}

/** 試合カード（横長）の列 */
export function GameListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white md:h-36" />
      ))}
    </div>
  );
}

/** 表（順位表など） */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white animate-pulse">
      <div className="h-10 bg-slate-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-t border-slate-100 px-4 py-3">
          <div className="h-4 w-6 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="ml-auto h-4 w-10 rounded bg-slate-200" />
          <div className="h-4 w-10 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
