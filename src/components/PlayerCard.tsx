import React from "react";
import Link from "next/link";
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

  const figureContents = (
    <>
      {_photoUrl ? (
        <img
          src={_photoUrl}
          alt={_japaneseName || _alphabetName || "player"}
          className="transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      ) : (
        // 画像が無い場合のプレースホルダ
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#e6eef2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            zIndex: 1,
            fontWeight: 600,
          }}
        >
          {_japaneseName || _alphabetName || "No Image"}
        </div>
      )}

      {/* Shine effect */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/70 via-white/30 to-transparent opacity-0 transition-opacity duration-300 ease-out will-change-transform group-hover:opacity-80 group-hover:animate-shine"
        style={{ zIndex: 3 }}
      />

      {/* 下部のグラデーション帯 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          background:
            "linear-gradient(0deg, #0f6536 25%, rgba(15,101,54,0.0) 100%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            padding: "1.1rem 1rem 1.2rem 1rem",
            color: "#fff",
            textAlign: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {_alphabetName && (
            <div
              style={{
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.86,
                fontWeight: 500,
                marginBottom: "0.12em",
              }}
            >
              {_alphabetName}
            </div>
          )}
          {_japaneseName && (
            <div
              style={{
                fontSize: "1.22rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                lineHeight: 1.13,
              }}
            >
              {_japaneseName}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      className="group relative overflow-hidden"
      style={{
        borderRadius: "1rem",
        boxShadow: "0 4px 16px rgba(20,30,55,0.18)",
        background: "#fff",
        maxWidth: "280px",
        margin: "0 auto",
        width: "100%",
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