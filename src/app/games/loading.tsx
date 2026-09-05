import { PageTitle, GameListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 md:space-y-12">
      <PageTitle title="GAME SCHEDULE" />
      <section className="space-y-4">
        <div className="h-7 w-32 rounded bg-slate-200 animate-pulse" />
        <GameListSkeleton count={3} />
      </section>
      <section className="space-y-4">
        <div className="h-7 w-32 rounded bg-slate-200 animate-pulse" />
        <GameListSkeleton count={3} />
      </section>
    </div>
  );
}
