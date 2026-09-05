import { BlogCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">NEWS</h1>
      <div className="flex gap-2 animate-pulse">
        <div className="h-9 w-16 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-full bg-slate-200" />
      </div>
      <BlogCardSkeleton count={6} />
    </div>
  );
}
