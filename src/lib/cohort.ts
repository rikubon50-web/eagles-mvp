// src/lib/cohort.ts
// 「期(○○期)」と「学年」を日付から自動計算するユーティリティ。
// 期(cohort)は不変値。学年・現役判定は年度(4/1切替)から導出するため、
// 毎年の手作業更新が不要になる。
//
// アンカー: 2026年度(2026/4〜2027/3)時点で 4年生 = 37期。
//   → 3年=38期 / 2年=39期 / 1年=40期。期は入学が新しいほど大きい。

export const ANCHOR_FY = 2026; // 基準年度
export const ANCHOR_4TH = 37; // 基準年度の4年生の期

/** 日付 → 年度。4/1で切り替わる（1〜3月はまだ前年度）。 */
export function fiscalYear(date: Date): number {
  const month = date.getMonth() + 1; // 1〜12
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
}

/** 期 → その年度での学年（1=1年, 4=4年, 5以上=卒業）。 */
export function gradeOf(cohort: number, fy: number): number {
  return fy - ANCHOR_FY + (ANCHOR_4TH + 4) - cohort;
}

/** 現役(1〜4年相当)か。卒業した期や未来の期は false。 */
export function isActiveCohort(cohort: number, fy: number): boolean {
  const g = gradeOf(cohort, fy);
  return g >= 1 && g <= 4;
}

/** 表示ラベル（例: "37期"）。 */
export function cohortLabel(cohort: number): string {
  return `${cohort}期`;
}

/**
 * microCMSの値から整数を取り出す。フィールドが数値・文字列・配列(["2"]等)
 * のいずれで返ってきても数値化できるようにする。取り出せない場合は null。
 */
export function toInt(value: unknown): number | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === null || first === undefined) return null;
  const n =
    typeof first === "string"
      ? Number(first.replace(/[^0-9]/g, ""))
      : Number(first);
  return Number.isFinite(n) ? n : null;
}

/**
 * 部員の期を取り出す。cohort未入力の場合は、その年度の学年(year)から逆算する
 * フォールバック。※フォールバックは「入力時点の年度」でしか正しくないため、
 * 毎年の更新を不要にするには cohort の入力が必須。
 * year / cohort が配列や文字列で返ってきても扱えるよう正規化する。
 */
export function cohortOf(
  player: { cohort?: unknown; year?: unknown },
  fy: number
): number | null {
  const c = toInt(player.cohort);
  if (c !== null) return c;
  const y = toInt(player.year);
  if (y !== null) {
    // gradeOf の逆算: cohort = fy - ANCHOR_FY + (ANCHOR_4TH + 4) - year
    return fy - ANCHOR_FY + (ANCHOR_4TH + 4) - y;
  }
  return null;
}
