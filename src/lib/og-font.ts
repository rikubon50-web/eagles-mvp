// OGP画像生成用のフォント取得。Google Fonts の text= サブセットで必要な文字だけ（数十KB）を取る。
// リポジトリ同梱の27MBフォントを毎回読むのを避けるため。

const BASE_CHARS = "青山学院大学男子ラクロス部EAGLES BLOG VS0123456789–:/() 年月日月火水木金土";

export async function loadOgFont(text: string): Promise<ArrayBuffer> {
  const chars = Array.from(new Set(BASE_CHARS + text)).join("");
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700&text=${encodeURIComponent(chars)}`,
    // 古めのUAを名乗ると woff2 ではなく TTF が返る（satori は woff2 非対応）
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" } }
  ).then((r) => r.text());
  const m = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/);
  if (!m) throw new Error("OG font: font url not found in css");
  return fetch(m[1]).then((r) => r.arrayBuffer());
}
