// src/components/GameCard.tsx
import Image from "next/image";
import type { GameView } from "@/lib/games";
import Link from "next/link";

// 試合カード（ポスター風）。compact=true でモバイルのみ簡易表示（ホーム用）、md以上は常にポスター型
export default function GameCard({ game, compact = false }: { game: GameView; compact?: boolean }) {
  const date = new Date(game.startAt);
  const d = date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo", // サーバーがUTCでも日本時間で表示
    })
    .replace(/\//g, "/");
  const t = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
  
  // --- 結果/ステータス用（正規化） ---
  const normalizeStatus = (v: any): "scheduled" | "live" | "finished" | "postponed" | undefined => {
    let val = v;
    if (Array.isArray(val)) val = val[0]; // microCMS で配列になるケースに対応
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      return s === "scheduled" || s === "live" || s === "finished" || s === "postponed"
        ? (s as any)
        : undefined;
    }
    return undefined;
  };

  const status = normalizeStatus((game as any).status);
  const isFinished = status === "finished";
  const isLive = status === "live";

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

  // ステータス表示用のラベル & 色（live は別枠で「●LIVE」表示のまま）
  const statusLabel =
    status === "scheduled"
      ? "試合予定"
      : status === "postponed"
      ? "延期"
      : status === "finished"
      ? "試合終了"
      : undefined;

  const statusClass =
    status === "postponed"
      ? "text-amber-700 border-amber-700"
      : status === "scheduled"
      ? "text-blue-700 border-blue-700"
      : "text-slate-700 border-slate-700";

  // モバイル用コンパクトカード（ホームのUp Coming / Recent Result向け）
  const compactCard = (
    <div className="border border-slate-300 rounded-lg p-4 bg-white not-prose space-y-3">
      <div className="flex items-center justify-between gap-2">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white px-3 py-0.5 text-xs font-bold tracking-widest">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
        ) : (
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${statusClass}`}>
            {statusLabel}
          </span>
        )}
        <span className="text-sm font-bold text-slate-800">
          {d} {t}
        </span>
      </div>

      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          {game.homeTeamLogo && (
            <div className="relative h-10 w-16">
              <Image src={game.homeTeamLogo.url} alt={game.homeTeamName} fill className="object-contain" />
            </div>
          )}
          <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{game.homeTeamName}</div>
        </div>
        <div className="text-center">
          {resultLabel && (
            <div
              className={
                "text-xs font-extrabold " +
                (resultLabel === "win" ? "text-yellow-600" : resultLabel === "lose" ? "text-blue-700" : "text-slate-700")
              }
            >
              {resultLabel.toUpperCase()}
            </div>
          )}
          {(isFinished || isLive) && (our != null || opp != null || isLive) ? (
            <div className="font-extrabold text-2xl text-slate-900">
              {our ?? "-"}<span className="mx-1 text-slate-500">–</span>{opp ?? "-"}
            </div>
          ) : (
            <div className="font-extrabold text-xl text-slate-900">VS</div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          {game.awayTeamLogo ? (
            <div className="relative h-10 w-16">
              <Image src={game.awayTeamLogo.url} alt={game.awayTeamName} fill className="object-contain" />
            </div>
          ) : (
            <div className="h-10 w-16 grid place-items-center text-[10px] text-slate-400 border">NO LOGO</div>
          )}
          <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{game.awayTeamName}</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 truncate text-center">
        {game.title}／{game.venue}
      </p>

      <div className="text-center">
        <Link
          href={`/games/${game.id}`}
          className="inline-block border border-slate-800 rounded px-4 py-1.5 text-xs font-bold text-slate-900"
        >
          {status === "finished" ? "ゲームレポートを見る" : "ゲーム案内を見る"}
        </Link>
      </div>
    </div>
  );

  // モダンカード（/games・PC用）。compactCard の文法（バッジ+日時 / ロゴ対戦+スコア / 情報行 / ボタン）の拡大版
  const poster = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 not-prose space-y-4 md:space-y-5">
      {/* ヘッダー行：ステータスバッジ + 日時 */}
      <div className="flex items-center justify-between gap-2">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white px-3 py-0.5 text-xs font-bold tracking-widest">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
        ) : statusLabel ? (
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wider ${statusClass}`}>
            {statusLabel}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="text-sm md:text-lg font-bold text-slate-800">
          {d} {t}
        </span>
      </div>

      {/* 対戦ブロック：ロゴ＋チーム名 / 中央にスコア or VS */}
      <div className="grid grid-cols-3 items-center gap-2 md:gap-6">
        {/* HOME */}
        <div className="flex flex-col items-center gap-1 md:gap-2">
          {game.homeTeamLogo && (
            <div className="relative h-12 w-20 md:h-20 md:w-28">
              <Image src={game.homeTeamLogo.url} alt={game.homeTeamName} fill className="object-contain" />
            </div>
          )}
          <div className="text-xs md:text-base font-bold text-slate-700 whitespace-nowrap">{game.homeTeamName}</div>
        </div>

        {/* 中央：finished/live はスコア、scheduled/postponed は VS */}
        <div className="text-center">
          {resultLabel && (
            <div
              className={
                "text-xs md:text-sm font-extrabold " +
                (resultLabel === "win" ? "text-yellow-600" : resultLabel === "lose" ? "text-blue-700" : "text-slate-700")
              }
            >
              {resultLabel.toUpperCase()}
            </div>
          )}
          {(isFinished || isLive) && (our != null || opp != null || isLive) ? (
            <div className="font-extrabold text-3xl md:text-5xl">
              {/* live の未入力スコアは 0 ではなく薄い「-」で表示 */}
              <span className={our != null ? "text-slate-900" : "text-slate-300"}>{our ?? "-"}</span>
              <span className="mx-1.5 md:mx-3 text-slate-500">–</span>
              <span className={opp != null ? "text-slate-900" : "text-slate-300"}>{opp ?? "-"}</span>
            </div>
          ) : (
            <div className="font-extrabold text-2xl md:text-4xl text-slate-900">VS</div>
          )}
        </div>

        {/* AWAY */}
        <div className="flex flex-col items-center gap-1 md:gap-2">
          {game.awayTeamLogo ? (
            <div className="relative h-12 w-20 md:h-20 md:w-28">
              <Image src={game.awayTeamLogo.url} alt={game.awayTeamName} fill className="object-contain" />
            </div>
          ) : (
            <div className="h-12 w-20 md:h-20 md:w-28 grid place-items-center text-[10px] md:text-xs text-slate-400 border">
              NO LOGO
            </div>
          )}
          <div className="text-xs md:text-base font-bold text-slate-700 whitespace-nowrap">{game.awayTeamName}</div>
        </div>
      </div>

      {/* 情報行：大会名・会場（/games では情報が命なので全文表示・折返し可） */}
      <p className="text-sm text-slate-500 text-center">
        {game.title}／{game.venue}
      </p>

      {/* フッター行：ステータス別CTA */}
      <div className="text-center">
        <Link
          href={`/games/${game.id}`}
          className="inline-block rounded-md border border-slate-300 px-5 py-2 text-sm font-bold text-slate-900 hover:border-emerald-600 hover:text-emerald-700"
        >
          {status === "finished" ? "ゲームレポートを見る" : "ゲーム案内を見る"}
        </Link>
      </div>
    </div>
  );

  if (!compact) return poster;
  // compact: モバイルは簡易カード、md以上は従来のポスター型
  return (
    <>
      {/* min-w-0: 親グリッド内でtruncate行がカード幅を押し広げないように */}
      <div className="md:hidden min-w-0">{compactCard}</div>
      <div className="hidden md:block">{poster}</div>
    </>
  );
}