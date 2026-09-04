// ブログ記事とロスター（選手）の自動紐付け。
// 記事タイトルは「【導く】 4年 中井 莉湖」のように名前に空白が混ざるため、
// 空白（半角・全角）を除いた上で「タイトルに選手名が含まれるか」で判定する。
// 手動の紐付けフィールドを持たず、タイトルだけで記事↔選手の回遊導線を作る。

export const RETIREMENT_TAG = "引退ブログ2026";

type Named = { name: string };

/** 空白（半角・全角・改行）を全て除去する */
export function normalizeName(s: string): string {
  return s.replace(/[\s　]+/g, "");
}

/**
 * 記事タイトルから該当する選手を1人返す。複数一致する場合は名前が長い方を優先
 * （「北村祐理」と「北村」のような包含関係で誤爆しないため）。2文字未満の名前は無視。
 */
export function findPlayerForTitle<T extends Named>(title: string, players: T[]): T | null {
  const t = normalizeName(title);
  if (!t) return null;
  let best: T | null = null;
  for (const p of players) {
    const n = normalizeName(p.name ?? "");
    if (n.length < 2 || !t.includes(n)) continue;
    if (!best || n.length > normalizeName(best.name).length) best = p;
  }
  return best;
}

/** その選手が登場する記事（タイトルに名前を含む）だけを返す。順序は入力順を保つ */
export function postsMentioning<P extends { title: string }>(playerName: string, posts: P[]): P[] {
  const n = normalizeName(playerName);
  if (n.length < 2) return [];
  return posts.filter((p) => normalizeName(p.title).includes(n));
}
