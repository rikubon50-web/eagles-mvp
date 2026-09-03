"use client";
// note風の2段階公開フロー: 「公開する」→ シートでタグ確認 → 「投稿する」。
// savePost の実行は PostEditor 側（onPublish）に委ねる純表示コンポーネント。
import { useEffect, useRef } from "react";

type PublishSheetProps = {
  open: boolean;
  tagsText: string;
  onTagsChange: (value: string) => void;
  /** 本文中の画像＋専用アップロード分のサムネ候補 */
  thumbCandidates: string[];
  /** "auto"=本文1枚目 / URL=明示選択 */
  thumbChoice: "auto" | string;
  onThumbChoice: (v: "auto" | string) => void;
  /** 「自動」タイルに見せるプレビュー画像 */
  autoPreview: string | null;
  thumbUploading: boolean;
  onThumbUpload: (file: File) => void;
  publishing: boolean;
  error: string | null;
  onPublish: () => void;
  onClose: () => void;
};

export default function PublishSheet({
  open, tagsText, onTagsChange,
  thumbCandidates, thumbChoice, onThumbChoice, autoPreview, thumbUploading, onThumbUpload,
  publishing, error, onPublish, onClose,
}: PublishSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  // Escape で閉じる（投稿中は閉じない）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !publishing) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, publishing, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="公開設定">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => { if (!publishing) onClose(); }}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg animate-[sheet-up_200ms_ease-out] rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">公開設定</h2>

        <label className="mt-5 block text-sm font-semibold text-slate-600" htmlFor="publish-tags">
          タグ（カンマ区切り）
        </label>
        <input
          id="publish-tags"
          value={tagsText}
          disabled={publishing}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="ブログ, 試合"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        />

        <span className="mt-5 block text-sm font-semibold text-slate-600">サムネイル</span>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
          {/* 自動（本文1枚目） */}
          <button
            type="button"
            disabled={publishing}
            onClick={() => onThumbChoice("auto")}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 ${
              thumbChoice === "auto" ? "border-emerald-600" : "border-slate-200"
            }`}
            aria-pressed={thumbChoice === "auto"}
          >
            {autoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={autoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[10px] text-slate-400">画像なし</span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-0.5 text-center text-[10px] font-bold text-white">
              自動（1枚目）
            </span>
          </button>
          {thumbCandidates.map((src) => (
            <button
              key={src}
              type="button"
              disabled={publishing}
              onClick={() => onThumbChoice(src)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 ${
                thumbChoice === src ? "border-emerald-600" : "border-slate-200"
              }`}
              aria-pressed={thumbChoice === src}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
          {/* 専用画像のアップロード */}
          <button
            type="button"
            disabled={publishing || thumbUploading}
            onClick={() => fileRef.current?.click()}
            className="grid h-16 w-24 shrink-0 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50"
          >
            {thumbUploading ? "追加中…" : "＋ 画像を追加"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onThumbUpload(f);
            }}
          />
        </div>

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
