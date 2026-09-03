import { ImageResponse } from "next/og";
import { fetchPostById } from "@/lib/posts";
import { mcmsImgJpeg } from "@/lib/image-url";
import { loadOgFont } from "@/lib/og-font";

// 記事のOGP画像（LINE/X/Instagram等で共有されたときのカード）。
// サムネがあれば写真の上にタイトル、なければ紺地のブランドカードを生成する。
// Node.jsランタイム: 本番のEdgeでは依存ライブラリが動かず500になったため
export const runtime = "nodejs";
export const alt = "青山学院大学男子ラクロス部 EAGLES ブログ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE = "https://aoyamaeagles.com";

export default async function OgImage({ params }: { params: { id: string } }) {
  const post = await fetchPostById(params.id);
  const title = post?.title ?? "青山学院大学男子ラクロス部 EAGLES";
  const font = await loadOgFont(title);
  const photo = post?.thumbnailUrl ? mcmsImgJpeg(post.thumbnailUrl, 1200) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0b1220",
          fontFamily: "NotoSerifJP",
          color: "#fff",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        )}
        {/* 下側を暗くしてタイトルを読ませる */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            background: photo
              ? "linear-gradient(to top, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.55) 45%, rgba(2,6,23,0.35) 100%)"
              : "linear-gradient(135deg, #0b1220 0%, #0f6536 140%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE}/img/logo.png`} alt="" width={120} height={74} style={{ objectFit: "contain" }} />
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#6ee7b7" }}>EAGLES BLOG</div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: title.length > 28 ? 48 : 60,
              lineHeight: 1.3,
              fontWeight: 700,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              display: "block",
              overflow: "hidden",
              maxHeight: 200,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", letterSpacing: 2 }}>
            青山学院大学男子ラクロス部 EAGLES
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoSerifJP", data: font, weight: 700, style: "normal" }] }
  );
}
