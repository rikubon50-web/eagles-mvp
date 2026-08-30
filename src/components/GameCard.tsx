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

  const poster = (
    <div className="border-2 border-slate-800 rounded-md p-4 md:p-10 bg-white not-prose">
      {/* 見出し帯 */}
      <div className="border-2 border-slate-800 text-center py-2 md:py-3 font-bold text-slate-800 text-base md:text-2xl">
        {game.title}
      </div>

      {/* ステータス（常に表示：status があれば）。live は赤バッジ＋pulseする点 */}
      {isLive ? (
        <div className="text-center mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white px-3 py-0.5 text-xs font-bold tracking-widest">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
        </div>
      ) : (
        statusLabel && (
          <div className="text-center mt-3">
            <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold tracking-widest ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        )
      )}

      {/* 会場 */}
      <div className="border-b-2 border-slate-300 text-center py-3 md:py-8 text-slate-800 font-bold text-sm md:text-2xl">
        会場：{game.venue}
      </div>

      {/* 日付・時間（時間を少し小さく） */}
      <div className="pt-4 pb-1 md:pt-6 md:pb-3 text-center text-slate-900 flex flex-wrap items-baseline justify-center gap-x-3 md:block">
        <div className="font-extrabold text-xl md:text-4xl tracking-wider md:tracking-widest">{d}</div>
        <div className="md:mt-2 font-extrabold text-xl md:text-4xl tracking-wider md:tracking-widest">{t}</div>
      </div>

      {/* 勝敗バッジ（finished のときだけ） */}
      {resultLabel && (
        <div className="text-center py-1 md:py-2">
          <span
            className={
              "inline-block rounded px-4 py-0.5 md:py-1 font-extrabold text-3xl md:text-5xl " +
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
        <div className="text-center py-1 md:py-2">
          <div className="flex items-center justify-center gap-4 md:gap-10">
            <span className="font-extrabold text-4xl md:text-6xl text-slate-900">{our}</span>
            <span className="font-extrabold text-2xl md:text-5xl text-slate-700">–</span>
            <span className="font-extrabold text-4xl md:text-6xl text-slate-900">{opp}</span>
          </div>
        </div>
      )}

      {/* 現在スコア（live のとき。未入力は 0 ではなく「-」で表示。
          プレースホルダの「-」は区切りの「–」と紛れないよう減灰する） */}
      {isLive && (
        <div className="text-center py-1 md:py-2">
          <div className="flex items-center justify-center gap-4 md:gap-10">
            <span className={`font-extrabold text-4xl md:text-6xl ${our != null ? "text-slate-900" : "text-slate-300"}`}>
              {our ?? "-"}
            </span>
            <span className="font-extrabold text-2xl md:text-5xl text-slate-700">–</span>
            <span className={`font-extrabold text-4xl md:text-6xl ${opp != null ? "text-slate-900" : "text-slate-300"}`}>
              {opp ?? "-"}
            </span>
          </div>
        </div>
      )}

      {/* 対戦カード：中央揃え・大学名は改行禁止・ロゴを少し小さく */}
      <div className="grid grid-cols-3 items-center gap-3 md:gap-10 py-3 md:py-6">
        {/* HOME */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-1 md:mb-2 text-slate-800 font-bold text-sm md:text-2xl whitespace-nowrap">
            {game.homeTeamName}
          </div>
          {game.homeTeamLogo && (
            <div className="relative h-12 w-20 sm:h-20 sm:w-32 md:h-24 md:w-32 lg:h-28 lg:w-40">
              <Image src={game.homeTeamLogo.url} alt={game.homeTeamName} fill className="object-contain" />
            </div>
          )}
        </div>

        {/* VS */}
        <div className="text-center font-extrabold text-xl md:text-5xl text-slate-900">VS</div>

        {/* AWAY */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-1 md:mb-2 text-slate-800 font-bold text-sm md:text-2xl whitespace-nowrap">
            {game.awayTeamName}
          </div>
          {game.awayTeamLogo ? (
            <div className="relative h-12 w-20 sm:h-20 sm:w-32 md:h-24 md:w-32 lg:h-28 lg:w-40">
              <Image src={game.awayTeamLogo.url} alt={game.awayTeamName} fill className="object-contain" />
            </div>
          ) : (
            <div className="h-12 w-20 md:h-28 md:w-40 grid place-items-center text-xs text-slate-400 border">
              NO LOGO
            </div>
          )}
        </div>
      </div>

      {/* CTA: ステータス別に表示（live でも会場・アクセス案内への導線を残す） */}
      {(status === "scheduled" || status === "postponed" || isLive) && (
        <div className="border-t-2 border-slate-300 mt-4 md:mt-6 pt-4 md:pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/games/${game.id}`}
              className="inline-block border-2 border-slate-800 px-5 py-2 md:px-6 md:py-3 text-sm md:text-base text-slate-900 font-bold hover:bg-slate-50"
            >
              ゲーム案内を見る
            </Link>
          </div>
        </div>
      )}

      {status === "finished" && (
        <div className="border-t-2 border-slate-300 mt-4 md:mt-6 pt-4 md:pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* ゲームレポート（finished のときのみ） */}
            <Link
              href={`/games/${game.id}`}
              className="inline-block border-2 border-slate-800 px-5 py-2 md:px-6 md:py-3 text-sm md:text-base text-slate-900 font-bold hover:bg-slate-50"
            >
              ゲームレポートを見る
            </Link>
          </div>
        </div>
      )}
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