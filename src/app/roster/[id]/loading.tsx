import { DarkBandSkeleton } from "@/components/Skeleton";

// 選手詳細の骨格: 紺の見出し帯 → 写真 + プロフィール表
export default function Loading() {
  return (
    <>
      <DarkBandSkeleton tall />
      <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start animate-pulse">
          <div className="w-full md:w-[280px] md:flex-shrink-0 rounded-xl bg-slate-200" style={{ aspectRatio: "3/4" }} />
          <div className="flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex border-b border-slate-200 last:border-b-0">
                <div className="w-[38%] bg-slate-200 py-5" />
                <div className="flex-1 bg-white px-4 py-5">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
