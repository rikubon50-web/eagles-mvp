"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ページ切り替え中インジケータ。サイト内リンクを押した瞬間に画面最上部へ細い緑のバーを出し、
// URL（pathname / search）が変わったら 100% まで伸ばして消す。App Router には router イベントが
// 無いため、クリックを document で捕捉して開始し、usePathname の変化で完了を検知する。
// 依存ライブラリなし。
const START_DELAY_MS = 80; // 一瞬で終わる遷移ではバーを出さない
const SAFETY_MS = 12000; // 何かあっても出しっぱなしにしない

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const clearTimers = () => {
    for (const t of [startTimer, safetyTimer, doneTimer]) {
      if (t.current) clearTimeout(t.current);
      t.current = null;
    }
  };

  const start = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    startTimer.current = setTimeout(() => setState("loading"), START_DELAY_MS);
    safetyTimer.current = setTimeout(finish, SAFETY_MS);
  };

  const finish = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (startTimer.current) {
      // 開始前に終わった（速い遷移）→ 何も出さない
      clearTimers();
      setState("idle");
      return;
    }
    clearTimers();
    setState("done");
    doneTimer.current = setTimeout(() => setState("idle"), 350);
  };

  // URL が変わった＝遷移完了
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // 同一ページ内アンカーや同じURLは対象外
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "idle") return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{
        background: "linear-gradient(90deg, #0f6536, #34d399)",
        boxShadow: "0 0 8px rgba(52, 211, 153, 0.8)",
        transformOrigin: "left",
        // loading 中は globals.css の toploader-grow で 0 → 90% までゆっくり伸びる。
        // done でアニメーションを外し、100% まで伸ばしながらフェードアウト
        ...(state === "done"
          ? { transform: "scaleX(1)", opacity: 0, transition: "transform 0.2s ease-out, opacity 0.3s ease-out 0.1s" }
          : { animation: "toploader-grow 6s cubic-bezier(0.1, 0.8, 0.2, 1) forwards" }),
      }}
    />
  );
}
