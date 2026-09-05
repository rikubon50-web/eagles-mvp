"use client";

// ルートレイアウト自体が落ちたときの最終防衛線。layout が使えないので html/body を自前で出す。
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a", margin: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.05em" }}>ERROR</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 24 }}>サイトを表示できませんでした</h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 12 }}>少し待ってからもう一度お試しください。</p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{ background: "#0f6536", color: "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}
            >
              もう一度読み込む
            </button>
            <a href="/" style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "10px 22px", fontWeight: 700, color: "#334155", textDecoration: "none" }}>
              ホームへ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
