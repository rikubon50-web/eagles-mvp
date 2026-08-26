import { describe, it, expect } from "vitest";
import { postInputSchema, newPostId, pageWindow, cropRect } from "@/lib/posts-domain";

describe("postInputSchema", () => {
  const ok = { title: "t", body: "<p>a</p>", tags: ["ブログ"], thumbnailUrl: null };
  it("正しい入力を受理する", () => {
    expect(postInputSchema.safeParse(ok).success).toBe(true);
  });
  it("タイトル空白のみを拒否する", () => {
    expect(postInputSchema.safeParse({ ...ok, title: "  " }).success).toBe(false);
  });
  it("タグ11個を拒否する", () => {
    expect(postInputSchema.safeParse({ ...ok, tags: Array(11).fill("a") }).success).toBe(false);
  });
});

describe("newPostId", () => {
  it("12桁の英数字で毎回異なる", () => {
    const a = newPostId(); const b = newPostId();
    expect(a).toMatch(/^[a-z0-9]{12}$/);
    expect(a).not.toBe(b);
  });
});

describe("pageWindow", () => {
  it("2ページ目の範囲を返す", () => {
    expect(pageWindow(50, 2, 24)).toEqual({ pageCount: 3, page: 2, from: 24, to: 47 });
  });
  it("範囲外ページはクランプする", () => {
    expect(pageWindow(50, 99, 24).page).toBe(3);
    expect(pageWindow(0, 1, 24)).toEqual({ pageCount: 1, page: 1, from: 0, to: 23 });
  });
});

describe("cropRect", () => {
  it("縦長画像は上下をトリミングしない（幅基準・縦中央）", () => {
    // 1080x1440 → 16:9 は 1080x607.5 → sy = (1440-607.5)/2
    const r = cropRect(1080, 1440);
    expect(r.sw).toBe(1080);
    expect(Math.round(r.sh)).toBe(608);
    expect(r.sx).toBe(0);
  });
  it("横長すぎる画像は左右をトリミング（高さ基準・横中央）", () => {
    const r = cropRect(4000, 1000); // 16:9 なら幅 1777.8
    expect(r.sh).toBe(1000);
    expect(Math.round(r.sw)).toBe(1778);
    expect(r.sy).toBe(0);
  });
});
