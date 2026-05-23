export async function fetchCsv(url: string, revalidateSec = 300) {
  const res = await fetch(url, { next: { revalidate: revalidateSec } });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  // シンプルなCSVパーサ（1行 = 1レコード、カンマ区切り）
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      line.split(",").map((c) =>
        c
          .replace(/^"|"$/g, "") // 両端の " を削除
          .replace(/""/g, '"')   // CSVの二重クオートを通常のクオートに
      )
    );

  const [header, ...data] = rows;
  const headerNorm = header.map((h) => (h ?? "").trim().toLowerCase());
  return data.map((r) => {
    const obj: Record<string, string> = {};
    headerNorm.forEach((h, i) => {
      obj[h] = r[i]?.trim?.() ?? "";
    });
    return obj;
  });
}

export type StandingRow = {
  [key: string]: string;
};

// ===============================
// Standings (CSV) with updatedAt
// ===============================
export type StandingsData = {
  rows: Record<string, string>[];
  updatedAt?: string;
};

function pickFrom(obj: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

export async function fetchStandingsFromCsv(url = process.env.STANDINGS_CSV): Promise<StandingsData> {
  if (!url) return { rows: [], updatedAt: undefined };
  const rows = await fetchCsv(url);

  let updatedAt: string | undefined;
  if (rows.length > 0) {
    const r0 = rows[0];
    // fetchCsv はヘッダーを小文字化する実装なので、小文字キーで探す
    updatedAt = pickFrom(r0, [
      "updatedat",
      "updated_at",
      "update",
      "lastupdated",
      "last_updated",
      "updated"
    ]);
    if (updatedAt) updatedAt = updatedAt.trim();
  }

  return { rows, updatedAt };
}
