"use client";
// note風の2段階公開フロー: 「公開する」→ シートでタグ確認 → 「投稿する」。
// savePost の実行は PostEditor 側（onPublish）に委ねる純表示コンポーネント。

type PublishSheetProps = {
  open: boolean;
  tagsText: string;
  onTagsChange: (value: string) => void;
  publishing: boolean;
  error: string | null;
  onPublish: () => void;
  onClose: () => void;
};

export default function PublishSheet({
  open, tagsText, onTagsChange, publishing, error, onPublish, onClose,
}: PublishSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="公開設定">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => { if (!publishing) onClose(); }}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">公開設定</h2>

        <label className="mt-5 block text-sm font-semibold text-slate-600" htmlFor="publish-tags">
          タグ（カンマ区切り）
        </label>
        <input
          id="publish-tags"
          value={tagsText}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="ブログ, 試合"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-slate-500 focus:outline-none"
        />

        {error && (
          <p role="status" className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-4">
          <button type="button" disabled={publishing} onClick={onClose}
            className="px-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50">
            キャンセル
          </button>
          <button type="button" disabled={publishing} onClick={onPublish}
            className="rounded-full bg-slate-900 px-7 py-2.5 font-bold text-white hover:bg-slate-800 disabled:opacity-50">
            {publishing ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </div>
    </div>
  );
}
