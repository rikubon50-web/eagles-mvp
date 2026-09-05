import { TableSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">STANDINGS</h1>
      <div className="h-5 w-64 rounded bg-slate-200 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2">
        <TableSkeleton rows={6} />
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
