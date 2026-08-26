// 公開権を持つ全部員アカウントからの任意HTML持ち込みを防ぐ許可リスト浄化。
// サーバー専用（savePost からのみ import する）。公開ページの依存チェーンに
// 入れないこと — 旧実装(sanitize-html)は ESM 依存が Vercel 上で解決できず
// /blog 系を 500 にしたため、CommonJS の xss へ置換し本ファイルに隔離した。
import { FilterXSS, safeAttrValue, getDefaultWhiteList } from "xss";

const STYLE_RULES: Record<string, RegExp[]> = {
  "text-align": [/^(center|left|right)$/],
  color: [/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, /^#[0-9a-fA-F]{3,8}$/],
  "font-size": [/^\d+(\.\d+)?(em|px)$/],
};

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const i = decl.indexOf(":");
      if (i < 0) return null;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).trim();
      const rules = STYLE_RULES[prop];
      if (rules && rules.some((re) => re.test(value))) return `${prop}: ${value}`;
      return null;
    })
    .filter(Boolean)
    .join("; ");
}

const filter = new FilterXSS({
  whiteList: {
    p: ["style"],
    h2: ["style"],
    span: ["style"],
    ul: [],
    ol: [],
    li: [],
    strong: [],
    em: [],
    u: [],
    s: [],
    b: [],
    i: [],
    br: [],
    a: ["href"],
    img: ["src", "alt"],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  onTagAttr(tag, name, value) {
    if (name === "style") {
      const clean = sanitizeStyle(value);
      return clean ? `style="${clean}"` : "";
    }
    if ((name === "href" || name === "src") && !/^https?:\/\//i.test(value.trim())) {
      return ""; // http/https 以外のスキーム（javascript: 等）を除去
    }
    return undefined; // 既定処理（whiteList + safeAttrValue）に委ねる
  },
});

export function sanitizePostBody(html: string): string {
  return filter.process(html);
}
