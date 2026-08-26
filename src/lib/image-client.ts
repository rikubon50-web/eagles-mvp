// src/lib/image-client.ts — ブラウザ専用（canvas）
import { cropRect } from "@/lib/posts-domain";

async function decode(file: File): Promise<ImageBitmap> {
  try { return await createImageBitmap(file); }
  catch { throw new Error("この画像形式は使用できません。スクリーンショット等のJPEG/PNGでお試しください"); }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("画像の変換に失敗しました"))), "image/jpeg", 0.85));
}

export async function prepareImageForUpload(file: File): Promise<{ image: Blob; thumb: Blob }> {
  const bmp = await decode(file);
  // 本体: 長辺1600pxへ縮小
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
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
