import { describe, it, expect } from "vitest";
import { sanitizePostBody } from "@/lib/posts-domain";

describe("sanitizePostBody", () => {
  it("Tiptap 風のマークアップはタグ・属性・内容を保ったまま通す（style の空白/img の自己終了は正規化される）", () => {
    const html =
      '<p style="text-align: center">こんにちは<strong>太字</strong><em>斜体</em></p>' +
      '<h2>見出し</h2>' +
      '<ul><li>項目1</li><li>項目2</li></ul>' +
      '<p><span style="color: rgb(220, 38, 38)">色付き文字</span></p>' +
      '<p><a href="https://example.com">リンク</a></p>' +
      '<img src="https://example.com/a.jpg" alt="写真">';
    const expected =
      '<p style="text-align:center">こんにちは<strong>太字</strong><em>斜体</em></p>' +
      '<h2>見出し</h2>' +
      '<ul><li>項目1</li><li>項目2</li></ul>' +
      '<p><span style="color:rgb(220, 38, 38)">色付き文字</span></p>' +
      '<p><a href="https://example.com">リンク</a></p>' +
      '<img src="https://example.com/a.jpg" alt="写真" />';
    expect(sanitizePostBody(html)).toBe(expected);
  });

  it("font-size の style は保持する", () => {
    const html = '<span style="font-size: 1.4em">大きい文字</span>';
    expect(sanitizePostBody(html)).toBe('<span style="font-size:1.4em">大きい文字</span>');
  });

  it("<script> タグを除去する", () => {
    const out = sanitizePostBody('<p>本文</p><script>alert(1)</script>');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert(1)");
  });

  it("javascript: スキームのリンクを無害化する", () => {
    const out = sanitizePostBody('<a href="javascript:alert(1)">クリック</a>');
    expect(out).not.toContain("javascript:");
  });

  it("onclick 等のイベントハンドラ属性を除去する", () => {
    const out = sanitizePostBody('<p onclick="alert(1)">本文</p>');
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("alert(1)");
  });

  it("許可外タグ (iframe など) を除去する", () => {
    const out = sanitizePostBody('<iframe src="https://evil.example"></iframe><p>本文</p>');
    expect(out).not.toContain("<iframe");
    expect(out).toContain("<p>本文</p>");
  });
});
