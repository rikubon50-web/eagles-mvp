"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

// 記事の共有ボタン。スマホはOSの共有シート（LINE・Instagram等へ直接）、
// PCはLINE / X / リンクコピー。URLは絶対URLで組み立てる。
export default function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://aoyamaeagles.com${path}`;
  const text = `${title}｜青山学院大学男子ラクロス部 EAGLES`;

  const nativeShare = async () => {
    try {
      await navigator.share({ title: text, url });
    } catch {
      // キャンセル時は何もしない
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("このURLをコピーしてください", url);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition-colors";

  return (
    <div className="not-prose">
      <p className="text-xs font-bold tracking-[0.2em] text-slate-500">SHARE</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className={btn}>
            <Share2 className="h-4 w-4" aria-hidden />
            シェアする
          </button>
        )}
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          LINE
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          X
        </a>
        <button type="button" onClick={copy} className={btn}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
      </div>
    </div>
  );
}
