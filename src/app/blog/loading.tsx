import { PageTitle, BlogCardSkeleton } from "@/components/Skeleton";

// /blog へ遷移した瞬間に出す骨格（一覧は検索パラメータ付きで毎回サーバー描画のため特に効く）
export default function Loading() {
  return (
    <div className="space-y-4 md:space-y-8">
      <PageTitle title="BLOG" />
      <div className="h-11 rounded-lg border border-slate-200 bg-white animate-pulse" />
      <div className="flex gap-2 animate-pulse">
        <div className="h-9 w-16 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-full bg-slate-200" />
        <div className="h-9 w-24 rounded-full bg-slate-200" />
      </div>
      <BlogCardSkeleton count={9} />
    </div>
  );
}
