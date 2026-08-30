// /admin配下のページ切替中に表示する読み込みUI（サーバー描画待ちの無反応対策）
export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-24 text-slate-500">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"
      />
      <p className="text-sm">読み込み中…</p>
    </div>
  );
}
