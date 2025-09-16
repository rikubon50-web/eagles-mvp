export async function fetchCsv(url: string, revalidateSec = 10) {
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

function toGDriveDirectLink(url: string | undefined): string {
  if (!url) return "";
  let match = url.match(/\/file\/d\/([^/]+)\//); // https://drive.google.com/file/d/ID/view
  if (match) return `https://drive.google.com/uc?id=${match[1]}`;
  match = url.match(/\/d\/([^/]+)\//); // fallback: /d/ID/view
  if (match) return `https://drive.google.com/uc?id=${match[1]}`;
  match = url.match(/[?&]id=([^&]+)/); // ?id=ID
  if (match) return `https://drive.google.com/uc?id=${match[1]}`;
  return url; // そのまま返す
}

async function fallbackSingleLine(url: string): Promise<AboutSheet | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    const text = await res.text();
    const firstLine = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (!firstLine) return null;
    const cells = firstLine.split(",");
    if (cells.length === 0) return null;

    const rawSlogan = (cells[0] ?? "").trim();
    const rawBg = (cells[1] ?? "").trim();
    const rawBody = cells.slice(2).join(",").trim();

    return {
      slogan: rawSlogan,
      backgroundImgUrl: toGDriveDirectLink(rawBg),
      body: rawBody,
      updatedAt: undefined,
    };
  } catch {
    return null;
  }
}

export type AboutSheet = {
  slogan: string;
  allBoxMemberImgUrl?: string;
  backgroundImgUrl: string;
  body: string;
  updatedAt?: string;
};

export async function fetchAboutFromCsv(url = process.env.ABOUT_CSV): Promise<AboutSheet | null> {
  if (!url) return null;
  const rows = await fetchCsv(url);
  if (rows.length === 0) return null;
  const row: Record<string, string> = rows[0] as any;

  // helper: first non-empty match
  const pick = (keys: string[]) => {
    for (const k of keys) {
      const kk = k.toLowerCase();
      const v = row[kk];
      if (typeof v === 'string' && v !== '') return v;
    }
    return '';
  };

  const slogan = pick([
    "slogan",
    "allBoxMember",
    "all-box-member",
    "all_box_member",
    "title",
  ]);
  const memberUrl = pick([
    "allBoxMemberImgUrl",
    "all-box-member-img-url",
    "all_box_member_img_url",
  ]);
  const bgUrl = pick([
    "backgroundImgUrl",
    "background-img-url",
    "backgroung-img-url", // provided typo
    "background_img_url",
  ]);
  const body = pick(["body", "text", "content"]);
  const updatedAt = pick(["updatedAt", "updated_at", "update", "lastUpdated"]) || undefined;

  const result: AboutSheet = {
    slogan,
    backgroundImgUrl: toGDriveDirectLink(bgUrl),
    body,
    updatedAt,
  };
  if (memberUrl) {
    result.allBoxMemberImgUrl = toGDriveDirectLink(memberUrl);
  }


  // Fallback: ヘッダーがなく A1 に「slogan,bg,body」が 1 行だけのCSVを許容
  if (!result.slogan && !result.backgroundImgUrl && !result.body) {
    const fb = await fallbackSingleLine(url);
    if (fb) return fb;
  }

  return result;
}
// ===============================
// Standings (CSV) with updatedAt
// ===============================
export type StandingsData = {
  rows: Record<string, string>[];
  updatedAt?: string;
};

function pickFrom(obj: Record<string, any>, keys: string[]): string | undefined {
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
    const r0 = rows[0] as Record<string, any>;
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