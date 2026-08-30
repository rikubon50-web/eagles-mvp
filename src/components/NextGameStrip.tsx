// src/components/NextGameStrip.tsx
// ヒーロー画像の下端に重ねる「NEXT GAME / LIVE NOW」ストリップ。
// page.tsx（サーバー）で取得した試合を受け取り、/games へのリンクとして表示する。
import Link from "next/link";
import type { GameView } from "@/lib/games";

type Props = {
  game: GameView;
  isLive: boolean;
};

// startAt(ISO) を JST の「M/D(曜) HH:mm」に分解して返す
function formatJst(startAt: string) {
  const d = new Date(startAt);
  const opts = { timeZone: "Asia/Tokyo" } as const;
  const date = d.toLocaleString("ja-JP", {
    ...opts,
    month: "numeric",
    day: "numeric",
  });
  const weekday = d.toLocaleString("ja-JP", { ...opts, weekday: "short" });
  const time = d.toLocaleString("ja-JP", {
    ...opts,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, weekday, time };
}

export default function NextGameStrip({ game, isLive }: Props) {
  const { date, weekday, time } = formatJst(game.startAt);

  return (
    <Link
      href="/games"
      className="absolute inset-x-0 bottom-0 z-10 block bg-slate-950/85 text-white backdrop-blur transition-colors hover:bg-slate-950/95"
      aria-label={
        isLive
          ? `試合速報 vs ${game.awayTeamName}`
          : `次の試合 ${date}(${weekday}) ${time} vs ${game.awayTeamName}`
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-xs sm:gap-4 sm:px-6 sm:text-sm">
        {isLive ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold tracking-wider">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
        ) : (
          <span
            className="shrink-0 text-[11px] font-bold tracking-[0.25em] text-emerald-300"
            style={{ fontFamily: "var(--font-heading), inherit" }}
          >
            NEXT GAME
          </span>
        )}
        <span className="shrink-0 tabular-nums">
          {date}
          <span className="hidden sm:inline">({weekday})</span> {time}
        </span>
        <span className="min-w-0 truncate font-bold">
          vs {game.awayTeamName}
        </span>
        <span className="ml-auto hidden shrink-0 text-slate-300 sm:inline">
          詳細 →
        </span>
      </div>
    </Link>
  );
}
