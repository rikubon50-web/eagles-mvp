// microCMS画像のデータ転送量対策（Hobbyプランは月20GBで停止する）。
// images.microcms-assets.io は imgix互換の ?w= リサイズ配信に対応しているため、
// 表示サイズに合わせた幅を必ず付けて原寸配信を避ける。

/** microCMSアセットURLにのみ幅・画質・WebP変換パラメータを付与する（他ホストはそのまま） */
export function mcmsImg(url: string, w: number): string {
  if (!url || !url.includes("images.microcms-assets.io")) return url;
  const base = url.split("?")[0];
  return `${base}?w=${w}&q=75&fm=webp`;
}

/** OGP画像生成用: WebPを扱えないため JPEG で取得する */
export function mcmsImgJpeg(url: string, w: number): string {
  if (!url || !url.includes("images.microcms-assets.io")) return url;
  const base = url.split("?")[0];
  return `${base}?w=${w}&q=80&fm=jpg`;
}

/** 記事本文HTML内の microCMS 画像srcに幅パラメータを付与する（表示時に適用） */
export function optimizeBodyImages(html: string, w = 1200): string {
  const resized = html.replace(
    /src="(https:\/\/images\.microcms-assets\.io\/[^"?]+)(\?[^"]*)?"/g,
    (_m, base) => `src="${base}?w=${w}&q=75&fm=webp"`
  );
  // 本文中の全画像を遅延読み込みにする（Supabase Storage の画像は変換配信が無いので、
  // 少なくとも画面外の画像を初回ロードから外す）
  return resized.replace(/<img\b(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async"');
}
