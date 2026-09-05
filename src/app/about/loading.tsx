import { ParagraphSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="relative lg:flex lg:gap-8">
      <div className="hidden lg:block lg:w-64 shrink-0" />
      <div className="space-y-8 lg:ml-8 max-w-6xl w-full px-6">
        <h2 className="section-title text-2xl md:text-4xl font-bold mb-4 md:mb-6 mt-6 md:mt-12">主将挨拶</h2>
        <div className="md:flex md:gap-6 animate-pulse">
          <div className="w-full md:w-[48%] aspect-[4/3] rounded-lg bg-slate-200 mb-4" />
          <div className="flex-1">
            <ParagraphSkeleton lines={8} />
          </div>
        </div>
        <div className="h-8 w-40 rounded bg-slate-200 animate-pulse mt-12" />
        <ParagraphSkeleton lines={6} />
      </div>
    </div>
  );
}
