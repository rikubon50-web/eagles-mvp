// src/components/GameCard.tsx
import Image from "next/image";
import type { Game } from "@/lib/microcms";
import Link from "next/link";

// 試合カード（ポスター風）
export default function GameCard({ game }: { game: Game }) {
  const date = new Date(game.startAt);
  const d = date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "/");
  const t = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  // --- 結果/ステータス用（正規化） ---
  const normalizeStatus = (v: any): "scheduled" | "finished" | "postponed" | undefined => {
    let val = v;
    if (Array.isArray(val)) val = val[0]; // microCMS で配列になるケースに対応
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      return s === "scheduled" || s === "finished" || s === "postponed" ? (s as any) : undefined;
    }
    return undefined;
  };

  const status = normalizeStatus((game as any).status);
  const isFinished = status === "finished";

  // our/opp が文字列で来ても数値化する（空文字や無効値は undefined）
  const toNum = (v: any): number | undefined => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
    };

  const our = toNum((game as any).ourScore ?? (game as any).homeScore);
  const opp = toNum((game as any).oppScore ?? (game as any).awayScore);
  const hasScores = typeof our === "number" && typeof opp === "number";

  // microCMS に手入力で result を入れている場合はそれも尊重（win/lose/draw）
  const manualResultRaw = (game as any).result as any;
  const manualResultStr = Array.isArray(manualResultRaw) ? manualResultRaw[0] : manualResultRaw;
  const manualResult = typeof manualResultStr === "string" ? manualResultStr.trim().toLowerCase() : undefined;
  const autoResult = isFinished && hasScores ? (our! > opp! ? "win" : our! < opp! ? "lose" : "draw") : undefined;
  const resultLabel = (manualResult as "win" | "lose" | "draw" | undefined) ?? autoResult;

  // ステータス表示用のラベル & 色
  const statusLabel = status ? status.toUpperCase() : undefined;

  const statusClass =
    status === "postponed"
      ? "text-amber-700 border-amber-700"
      : status === "scheduled"
      ? "text-blue-700 border-blue-700"
      : "text-slate-700 border-slate-700";

  return (
    <div className="border-2 border-slate-800 rounded-md p-6 md:p-10 bg-white not-prose">
      {/* 見出し帯 */}
      <div className="border-2 border-slate-800 text-center py-3 font-bold text-slate-800 text-lg md:text-2xl">
        {game.title}
      </div>

      {/* ステータス（常に表示：status があれば） */}
      {statusLabel && (
        <div className="text-center mt-3">
          <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold tracking-widest ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      )}

      {/* 会場 */}
      <div className="border-b-2 border-slate-300 text-center py-6 md:py-8 text-slate-800 font-bold text-lg md:text-2xl">
        会場：{game.venue}
      </div>

      {/* 日付・時間（時間を少し小さく） */}
      <div className="pt-8 pb-2 md:pt-6 md:pb-3 text-center text-slate-900">
        <div className="font-extrabold text-4xl md:text-4xl tracking-widest">{d}</div>
        <div className="mt-2 font-extrabold text-4xl md:text-4xl tracking-widest">{t}</div>
      </div>

      {/* 勝敗バッジ（finished のときだけ） */}
      {resultLabel && (
        <div className="text-center py-2">
          <span
            className={
              "inline-block rounded px-4 py-1 font-extrabold text-5xl " +
              (resultLabel === "win"
                ? "text-yellow-600"
                : resultLabel === "lose"
                ? "text-blue-700"
                : "text-black")
            }
          >
            {resultLabel.toUpperCase()}
          </span>
        </div>
      )}

      {/* スコア（finished のときだけ） */}
      {isFinished && our != null && opp != null && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-6 md:gap-10">
            <span className="font-extrabold text-5xl md:text-6xl text-slate-900">{our}</span>
            <span className="font-extrabold text-3xl md:text-5xl text-slate-700">–</span>
            <span className="font-extrabold text-5xl md:text-6xl text-slate-900">{opp}</span>
          </div>
        </div>
      )}

      {/* 対戦カード：中央揃え・大学名は改行禁止・ロゴを少し小さく */}
      <div className="grid grid-cols-3 items-center gap-6 md:gap-10 py-6">
        {/* HOME */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 text-slate-800 font-bold text-lg md:text-2xl whitespace-nowrap">
            {game.homeTeamName}
          </div>
          {game.homeTeamLogo && (
            <div className="relative h-16 w-24 sm:h-20 sm:w-32 md:h-24 md:w-32 lg:h-28 lg:w-40">
              <Image src={game.homeTeamLogo.url} alt={game.homeTeamName} fill className="object-contain" />
            </div>
          )}
        </div>

        {/* VS */}
        <div className="text-center font-extrabold text-3xl md:text-5xl text-slate-900">VS</div>

        {/* AWAY */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 text-slate-800 font-bold text-lg md:text-2xl whitespace-nowrap">
            {game.awayTeamName}
          </div>
          {game.awayTeamLogo ? (
            <div className="relative h-16 w-24 sm:h-20 sm:w-32 md:h-24 md:w-32 lg:h-28 lg:w-40">
              <Image src={game.awayTeamLogo.url} alt={game.awayTeamName} fill className="object-contain" />
            </div>
          ) : (
            <div className="h-20 w-32 md:h-28 md:w-40 grid place-items-center text-xs text-slate-400 border">
              NO LOGO
            </div>
          )}
        </div>
      </div>

      {/* CTA: ステータス別に表示 */}
      {(status === "scheduled" || status === "postponed") && (
        <div className="border-t-2 border-slate-300 mt-6 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/games/${game.id}`}
              className="inline-block border-2 border-slate-800 px-6 py-3 text-slate-900 font-bold hover:bg-slate-50"
            >
              ゲーム案内を見る
            </Link>
          </div>
        </div>
      )}

      {status === "finished" && (
        <div className="border-t-2 border-slate-300 mt-6 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* ゲームレポート（finished のときのみ） */}
            <Link
              href={`/games/${game.id}`}
              className="inline-block border-2 border-slate-800 px-6 py-3 text-slate-900 font-bold hover:bg-slate-50"
            >
              ゲームレポートを見る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}