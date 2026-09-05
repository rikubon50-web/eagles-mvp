import { DarkBandSkeleton, ParagraphSkeleton } from "@/components/Skeleton";

// 記事ページの骨格: 紺の見出し帯 → サムネ枠 → 本文
export default function Loading() {
  return (
    <>
      <DarkBandSkeleton />
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-100 py-4 md:py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="w-full aspect-[16/9] rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="pt-8 pb-8 md:pt-20 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <ParagraphSkeleton lines={12} />
        </div>
      </div>
    </>
  );
}
