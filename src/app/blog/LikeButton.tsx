"use client";
// 記事詳細のスキ♡ボタン（noteを模した演出: バウンス・パーティクル・お礼吹き出し）。
// カウント更新は security definer な RPC increment_post_like のみ（±1クランプ済み）。
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { pickThanksMessage, particleVectors } from "@/lib/like-messages";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PARTICLE_COUNT = 7;
const PARTICLE_DISTANCE = 34;
// noteの温かいバーストに寄せたローズ/ピンク/アンバー系。7個すべて相異なる色（隣接同色を避ける）
const PARTICLE_COLORS = ["#f43f5e", "#fb7185", "#f59e0b", "#fda4af", "#e11d48", "#fbbf24", "#f472b6"];

function restHeaders(): Record<string, string> {
  return {
    apikey: ANON_KEY ?? "",
    Authorization: `Bearer ${ANON_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function LikeButton({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(Math.max(0, initialCount));
  const [bouncing, setBouncing] = useState(false);
  const [burstKey, setBurstKey] = useState(0); // 0 = 未発火。like のたびに増やして one-shot 再生
  const [bubble, setBubble] = useState<string | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  // マウント時の like_count 取得。トグル後に遅れて届くと RPC の返した最新値を
  // 古い値で上書きしてしまうため、初回トグル時に abort する
  const mountFetchRef = useRef<AbortController | null>(null);

  const storageKey = `liked:${postId}`;

  // マウント時: 自分のスキ状態を復元し、最新の like_count を匿名RESTで取得
  // （ISRキャッシュより新しい値に置き換える。失敗時は初期値のまま）
  useEffect(() => {
    try {
      setLiked(localStorage.getItem(storageKey) === "1");
    } catch {
      /* storage が使えない環境では未スキ扱い */
    }
    if (!SUPABASE_URL || !ANON_KEY) return;
    const ctrl = new AbortController();
    mountFetchRef.current = ctrl;
    fetch(
      `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(postId)}&select=like_count`,
      { headers: restHeaders(), signal: ctrl.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((rows) => {
        const v = Array.isArray(rows) ? rows[0]?.like_count : null;
        if (typeof v === "number") setCount(Math.max(0, v));
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // アンマウント時に演出用タイマーを掃除
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const setLikedStorage = (next: boolean) => {
    try {
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      /* 記憶できないだけなので無視 */
    }
  };

  const playLikeEffects = () => {
    setBouncing(true);
    setBurstKey((k) => k + 1);
    setBubble(pickThanksMessage());
    timersRef.current.push(
      window.setTimeout(() => setBouncing(false), 450),
      window.setTimeout(() => setBubble(null), 1500)
    );
  };

  const toggle = async () => {
    if (busyRef.current) return;
    // 未完了のマウント時取得が残っていたら破棄（古い値で RPC の結果を上書きさせない）
    mountFetchRef.current?.abort();
    const next = !liked;
    const prevCount = count;

    // 楽観更新 + note風演出（取り消し時は演出なし）
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setLikedStorage(next);
    if (next) playLikeEffects();
    else setBubble(null);

    if (!SUPABASE_URL || !ANON_KEY) return;
    busyRef.current = true;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_post_like`, {
        method: "POST",
        headers: restHeaders(),
        body: JSON.stringify({ p_id: postId, delta: next ? 1 : -1 }),
      });
      if (!res.ok) throw new Error(`increment_post_like failed: ${res.status}`);
      const value = await res.json().catch(() => null);
      // RPC が0行更新（記事の非公開化・削除直後など）だと null が返る。
      // その場合サーバは加算していないので、楽観更新を残さず失敗扱いでロールバックする
      if (typeof value !== "number") throw new Error("increment_post_like returned no value");
      setCount(Math.max(0, value));
    } catch {
      // 失敗時はロールバック表示
      setLiked(!next);
      setCount(prevCount);
      setLikedStorage(!next);
      if (next) setBubble(null);
    } finally {
      busyRef.current = false;
    }
  };

  const particles = particleVectors(PARTICLE_COUNT, PARTICLE_DISTANCE);

  // ハート（バウンス＋パーティクル）と数字。インライン／フローティングの両ボタンで共用。
  // 状態は本コンポーネント1インスタンス内で共有するため、二重RPC・二重カウントは起きない
  // （表示される・押せるボタンはブレークポイントごとに常に1つだけ）。
  const buttonBody = (
    <>
      {/* ハート＋パーティクルの基準点 */}
      <span className="relative inline-flex">
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 transition-colors duration-200 ${bouncing ? "like-heart-bounce" : ""}`}
          fill={liked ? "#f43f5e" : "none"}
          stroke={liked ? "#f43f5e" : "currentColor"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>

        {/* パーティクルバースト（one-shot。CSS側で prefers-reduced-motion なら非表示） */}
        {burstKey > 0 && (
          <span key={burstKey} aria-hidden="true">
            {particles.map((v, i) => (
              <span
                key={i}
                className="like-particle"
                style={
                  {
                    "--lp-x": `${v.x.toFixed(1)}px`,
                    "--lp-y": `${v.y.toFixed(1)}px`,
                    background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
                    animationDelay: `${(i % 3) * 40}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        )}
      </span>

      <span className="min-w-[1.5rem] text-left text-lg font-bold tabular-nums">{count}</span>
    </>
  );

  return (
    <>
      {/* md以上: 記事末尾のインライン表示（現行どおり。モバイルでは非表示） */}
      <div className="relative hidden md:inline-flex flex-col items-center not-prose">
        {/* お礼の吹き出し（スキした瞬間だけ約1.5秒） */}
        {bubble && (
          <span
            role="status"
            className="like-bubble absolute bottom-full left-1/2 mb-2 whitespace-nowrap rounded-full border border-rose-200 bg-white px-3 py-1 text-sm font-semibold text-rose-500 shadow-md"
          >
            {bubble}
          </span>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-pressed={liked}
          aria-label={liked ? "スキを取り消す" : "スキ"}
          className={`group inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 transition-colors duration-200 ${
            liked
              ? "border-rose-300 bg-rose-50 text-rose-500"
              : "border-slate-300 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-400"
          }`}
        >
          {buttonBody}
        </button>
      </div>

      {/* モバイル: 画面左下のフローティング表示（md以上では非表示）。
          safe-area-inset-bottom を考慮して bottom-6 相当を確保する */}
      <div
        className="md:hidden fixed left-4 z-40 not-prose"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="relative inline-flex flex-col items-start">
          {/* 吹き出しはボタンの真上・左揃え（画面外にはみ出さない） */}
          {bubble && (
            <span
              role="status"
              className="like-bubble-left absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-full border border-rose-200 bg-white px-3 py-1 text-sm font-semibold text-rose-500 shadow-md"
            >
              {bubble}
            </span>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-pressed={liked}
            aria-label={liked ? "スキを取り消す" : "スキ"}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 shadow-lg transition-colors duration-200 ${
              liked
                ? "border-rose-300 bg-rose-50 text-rose-500"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            {buttonBody}
          </button>
        </div>
      </div>
    </>
  );
}
