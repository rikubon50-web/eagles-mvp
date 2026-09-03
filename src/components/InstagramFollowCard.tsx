import { Instagram } from "lucide-react";

// 記事末尾などに置くInstagramフォロー導線（一番読まれている場所で部の日常へ誘導）
export default function InstagramFollowCard() {
  return (
    <div className="not-prose rounded-2xl bg-slate-900 px-5 py-6 text-white md:px-8 md:py-7">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10">
          <Instagram className="h-6 w-6 text-emerald-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.25em] text-emerald-300">INSTAGRAM</p>
          <p className="mt-0.5 text-base font-bold leading-snug md:text-lg">
            部の日常・試合速報はInstagramで
          </p>
          <p className="mt-0.5 text-xs text-slate-300">@eagles_agulax</p>
        </div>
      </div>
      <a
        href="https://www.instagram.com/eagles_agulax"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0f6536] px-6 py-3 text-sm font-bold text-white hover:bg-[#0d5a30] md:w-auto"
      >
        フォローする
      </a>
    </div>
  );
}
