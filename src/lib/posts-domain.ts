import { z } from "zod";
import sanitizeHtml from "sanitize-html";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください").max(120),
  body: z.string(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  thumbnailUrl: z.string().url().nullable().optional(),
});
export type PostInput = z.infer<typeof postInputSchema>;

// 公開権を持つ全部員アカウントからの任意HTML持ち込みを防ぐ許可リスト浄化。
export function sanitizePostBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "ul", "ol", "li", "strong", "em", "u", "s", "b", "i", "a", "img", "br", "span",
    ],
    allowedAttributes: {
      a: ["href"],
      img: ["src", "alt"],
      span: ["style"],
      p: ["style"],
      h2: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(center|left|right)$/],
        color: [/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, /^#[0-9a-fA-F]{3,8}$/],
        "font-size": [/^\d+(\.\d+)?(em|px)$/],
      },
    },
    allowedSchemes: ["http", "https"],
  });
}

export function newPostId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function pageWindow(totalCount: number, page: number, perPage: number) {
  const pageCount = Math.max(1, Math.ceil(totalCount / perPage));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const from = (p - 1) * perPage;
  return { pageCount, page: p, from, to: from + perPage - 1 };
}

// 1280x720(16:9) 中央クロップの元画像側矩形
export function cropRect(w: number, h: number) {
  const target = 1280 / 720;
  if (w / h > target) {
    const sw = h * target;
    return { sx: (w - sw) / 2, sy: 0, sw, sh: h };
  }
  const sh = w / target;
  return { sx: 0, sy: (h - sh) / 2, sw: w, sh };
}
