import { PlayerGridSkeleton } from "@/components/Skeleton";

// ロスター一覧の骨格: 期タブの帯 → 選手カードのグリッド
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="sticky top-[85px] z-30 bg-white/95 border-b border-slate-200 py-2 md:py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-2 md:grid md:grid-cols-4 md:gap-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-slate-200 md:h-12 md:w-auto" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-8 w-28 rounded bg-slate-200 animate-pulse" />
        <PlayerGridSkeleton count={8} />
      </div>
    </div>
  );
}
