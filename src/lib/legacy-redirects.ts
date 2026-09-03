// 旧サイト agulaxmen.com → 新サイトへの301転送ルール（Edge middlewareから使用）
// 個別対応表（記事・選手）は src/data/legacy-redirects.json（旧サイト巡回で生成）
import map from "@/data/legacy-redirects.json";

export const LEGACY_HOSTS = new Set(["agulaxmen.com", "www.agulaxmen.com"]);

const DETAIL = /^\/(blog|player|news)\/detail\/id\/(\d+)\/?$/;

/**
 * 旧サイトのパスを新サイトのパスへ変換する。旧URLパターンに該当しなければ null。
 * ホストが旧ドメインのときは必ず何かしらの転送先（最終的に "/"）を返す。
 */
export function legacyTarget(pathname: string, isLegacyHost: boolean): string | null {
  const m = pathname.match(DETAIL);
  if (m) {
    const [, kind, id] = m;
    if (kind === "blog") return map.blog[id as keyof typeof map.blog] ? `/blog/${map.blog[id as keyof typeof map.blog]}` : "/blog";
    if (kind === "player") return map.players[id as keyof typeof map.players] ? `/roster/${map.players[id as keyof typeof map.players]}` : "/roster";
    return "/news";
  }
  if (/^\/blog(\/|$)/.test(pathname)) return isLegacyHost ? "/blog" : null;
  if (/^\/player(\/|$)/.test(pathname)) return "/roster";
  if (/^\/(game|schedule)(\/|$)/.test(pathname)) return "/games";
  if (/^\/news(\/|$)/.test(pathname)) return isLegacyHost ? "/news" : null;
  if (/^\/(team|index\/faq|place)(\/|$)/.test(pathname)) return "/about";
  if (/^\/(album|index)(\/|$)/.test(pathname)) return "/";
  if (pathname === "/contact") return isLegacyHost ? "/contact" : null;
  return isLegacyHost ? "/" : null;
}
