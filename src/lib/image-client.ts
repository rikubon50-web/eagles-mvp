// src/lib/image-client.ts — ブラウザ専用（canvas）
import { cropRect } from "@/lib/posts-domain";

async function decode(file: File): Promise<ImageBitmap> {
  try { return await createImageBitmap(file); }
  catch { throw new Error("この画像形式は使用できません。スクリーンショット等のJPEG/PNGでお試しください"); }
}

function toBlob(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png" = "image/jpeg"): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("画像の変換に失敗しました"))), type, 0.8));
}

// 本文画像の長辺上限。スマホ幅(〜430px×3倍)には1400pxで十分で、1600px/0.85品質だと
// 1枚1MB前後になり記事ページが5MBを超えていた
const BODY_MAX_EDGE = 1400;

// 相手ロゴ用: 長辺400pxへ縮小して1枚だけ返す（透過ロゴの背景が黒くならないようPNG）
export async function prepareLogoForUpload(file: File): Promise<Blob> {
  const bmp = await decode(file);
  const scale = Math.min(1, 400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return toBlob(c, "image/png");
}

export async function prepareImageForUpload(file: File): Promise<{ image: Blob; thumb: Blob }> {
  const bmp = await decode(file);
  // 本体: 長辺 BODY_MAX_EDGE px へ縮小
  const scale = Math.min(1, BODY_MAX_EDGE / Math.max(bmp.width, bmp.height));
  const c1 = document.createElement("canvas");
  c1.width = Math.round(bmp.width * scale);
  c1.height = Math.round(bmp.height * scale);
  c1.getContext("2d")!.drawImage(bmp, 0, 0, c1.width, c1.height);
  // サムネ: 1280x720 中央クロップ
  const { sx, sy, sw, sh } = cropRect(bmp.width, bmp.height);
  const c2 = document.createElement("canvas");
  c2.width = 1280; c2.height = 720;
  c2.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, 1280, 720);
  return { image: await toBlob(c1), thumb: await toBlob(c2) };
}
