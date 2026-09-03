"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 内製アクセス解析: PVは毎ページ、流入元・デバイス・訪問者はセッション/日の起点でだけ送る。
// 匿名の乱数IDのみで個人情報は扱わない。失敗は握りつぶす。/adminは送信しない。

// document.referrer を集計しやすい流入元キーへ正規化
function sourceKey(ref: string, ownHost: string): string {
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname;
    if (host === ownHost) return ""; // サイト内遷移は流入ではない
    if (host.includes("instagram.com")) return "instagram";
    if (host === "t.co" || host.includes("twitter.com") || host === "x.com") return "x";
    if (host.includes("google.")) return "google";
    if (host.includes("yahoo.")) return "yahoo";
    if (host.includes("bing.com")) return "bing";
    if (host.includes("ameblo.jp") || host.includes("ameba.jp")) return "ameblo";
    if (host.includes("line.me")) return "line";
    return host;
  } catch {
    return "direct";
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    // セッション起点（このタブで最初のページ）かどうか
    let entry = false;
    let visitor: string | null = null;
    try {
      if (!sessionStorage.getItem("pv_session")) {
        sessionStorage.setItem("pv_session", "1");
        entry = true;
      }
      visitor = localStorage.getItem("pv_id");
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem("pv_id", visitor);
      }
    } catch {
      // ストレージ不可の環境はPVのみ記録
    }

    const body: Record<string, string | null> = { p_path: pathname };
    if (entry) {
      const src = sourceKey(document.referrer, location.hostname);
      if (src) body.p_source = src;
      body.p_device = window.innerWidth < 768 ? "mobile" : "desktop";
    }
    if (visitor) body.p_visitor = visitor;

    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
    fetch(`${url}/rest/v1/rpc/log_visit`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
    })
      .then((res) => {
        // SQL未適用の間は旧RPCへフォールバック（PVだけは途切れさせない）
        if (!res.ok) {
          return fetch(`${url}/rest/v1/rpc/log_page_view`, {
            method: "POST",
            headers,
            body: JSON.stringify({ p_path: pathname }),
            keepalive: true,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
