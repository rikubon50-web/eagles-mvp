import React from "react";
import Link from "next/link";
import { mcmsImg } from "@/lib/image-url";
import type { Player } from "@/lib/microcms"; // Player 型が無い環境でも型だけなので実行時には影響ありません

export type PlayerCardProps = {
  /** 推奨: microCMS から取得した Player オブジェクト */
  player?: Player;
  /** 互換: 古い呼び出しが渡している可能性のある別名 */
  item?: Player;
  /** 直接値を渡す場合のバックアップ用（旧 props 互換） */
  photoUrl?: string;
  alphabetName?: string;
  japaneseName?: string;
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  item,
  photoUrl,
  alphabetName,
  japaneseName,
}) => {
  // 優先: player（または item）から値を拾う → 個別 props をフォールバック
  const p = player ?? item;

  const _photoUrl = p?.photo?.url ?? photoUrl ?? "";
  const _alphabetName = p?.alphabet ?? alphabetName ?? "";
  const _japaneseName = p?.name ?? japaneseName ?? "";

  const href = p?.id ? `/roster/${p.id}` : undefined;
  const aria = _japaneseName || _alphabetName || "player";

  // C → 役職(無ければ"COACH") / それ以外(PL·MG·TR·AS) → ロールをそのまま表示
  const role = p?.role;
  const roleLabel = role ? (role === "C" ? p?.position || "COACH" : role) : null;

  const figureContents = (
    <>
      {_photoUrl ? (
        <img
          src={mcmsImg(_photoUrl, 560)}
          alt={_japaneseName || _alphabetName || "player"}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 z-[1] block h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
        />
      ) : (
        // 画像が無い場合のプレースホルダ
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-100 font-semibold text-slate-500">
          {_japaneseName || _alphabetName || "No Image"}
        </div>
      )}

      {/* 上部スクリム（ロール表記を写真の明暗に関わらず読めるように） */}
      {roleLabel && (
        <div className="absolute inset-x-0 top-0 z-[2] h-16 bg-gradient-to-b from-black/45 to-transparent" />
      )}

      {/* ロール表記: ピルではなくタイポグラフィで */}
      {roleLabel && (
        <div className="absolute left-3 top-3 z-[4] border-l-2 border-emerald-400 pl-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white drop-shadow">
          {roleLabel}
        </div>
      )}

      {/* Shine effect */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/70 via-white/30 to-transparent opacity-0 transition-opacity duration-300 ease-out will-change-transform group-hover:opacity-80 group-hover:animate-shine"
        style={{ zIndex: 3 }}
      />

      {/* 下部の名前ブロック（ダークスクリム＋左揃えのエディトリアル調） */}
      {/* 下端は完全不透明にする（透過だと明るい写真が透けて紺背景との境に薄い帯が出る） */}
      <div className="absolute inset-x-0 bottom-0 z-[2] flex h-[46%] flex-col justify-end bg-gradient-to-t from-slate-950 from-15% via-slate-950/50 to-transparent">
        <div className="w-full px-4 pb-4 pt-2 text-left">
          {_alphabetName && (
            <div className="mb-0.5 text-[10px] font-bold uppercase leading-snug tracking-[0.22em] text-emerald-300/90">
              {_alphabetName}
            </div>
          )}
          {_japaneseName && (
            <div className="text-lg font-bold leading-tight tracking-wide text-white">
              {_japaneseName}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      className="group relative mx-auto w-full max-w-[280px] overflow-hidden rounded-xl bg-transparent"
      style={{
        boxShadow: "0 2px 12px rgba(15,23,42,0.12)",
        aspectRatio: "3/4",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {href ? (
        <Link
          href={href}
          aria-label={aria}
          className="absolute inset-0 block focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
        >
          <figure className="absolute inset-0">{figureContents}</figure>
        </Link>
      ) : (
        <div className="absolute inset-0">
          <figure className="absolute inset-0">{figureContents}</figure>
        </div>
      )}

      {/* アスペクト比維持 */}
      <div style={{ paddingTop: "133.33%", visibility: "hidden" }} />
    </div>
  );
};

export default PlayerCard;
