import { ImageResponse } from "next/og";
import { fetchGameById } from "@/lib/games";
import { mcmsImgJpeg } from "@/lib/image-url";
import { loadOgFont } from "@/lib/og-font";

// 試合ページのOGP画像（対戦カード）。告知をシェアしたときにロゴ・日時・相手が一目で分かる。
export const runtime = "edge";
export const alt = "青山学院大学男子ラクロス部 EAGLES 試合情報";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE = "https://aoyamaeagles.com";

export default async function OgImage({ params }: { params: { id: string } }) {
  const game = await fetchGameById(params.id);
  const d = game ? new Date(game.startAt) : null;
  const when = d
    ? `${d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })} ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" })}`
    : "";
  const finished = game?.status === "finished" && game.ourScore != null && game.oppScore != null;
  const awayLogo = game?.awayTeamLogo?.url ? mcmsImgJpeg(game.awayTeamLogo.url, 400) : null;
  const score = finished ? `${game!.ourScore}–${game!.oppScore}` : "VS";
  const font = await loadOgFont(`${game?.title ?? ""}${game?.awayTeamName ?? ""}${game?.venue ?? ""}${when}${score}`);

  const team = (name: string, logo: string | null) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 380 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={200} height={140} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ width: 200, height: 140 }} />
      )}
      <div style={{ fontSize: 34, textAlign: "center" }}>{name}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1220 0%, #0f6536 140%)",
          fontFamily: "NotoSerifJP",
          color: "#fff",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 40, fontSize: 26, letterSpacing: 6, color: "#6ee7b7" }}>
          {game?.title ?? "EAGLES GAME"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 20 }}>
          {team("青山学院大学", `${SITE}/img/logo.png`)}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: finished ? 96 : 80, letterSpacing: 4 }}>{score}</div>
          </div>
          {team(game?.awayTeamName ?? "", awayLogo)}
        </div>
        <div style={{ position: "absolute", bottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 40 }}>{when}</div>
          {game?.venue && <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)" }}>{game.venue}</div>}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoSerifJP", data: font, weight: 700, style: "normal" }] }
  );
}
