// src/lib/microcms.ts
import { createClient } from "microcms-js-sdk";

// ==========================
// microCMS クライアント
// ==========================
export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

// ==========================
// 型定義
// ==========================

export type About = {
  visual: { url: string; width: number; height: number };
  body: string;
};

export type News = {
  id: string;
  title: string;
  excerpt?: string;
  body: string;
  category: "お知らせ" | "新歓" | "試合情報";
  publishedAt: string;
};

// ★ Roster（部員紹介）
export type Player = {
  id: string;
  name: string;    // 名前
  cohort: number; // 期（37,38,...）不変値。表示・現役判定の主データ（microCMS必須）
  photo: { url: string; width: number; height: number }; // 写真（1枚目・カード用）
  photo2?: { url: string; width: number; height: number }; // 写真2枚目（宣材写真・詳細のスライド用）
  highschool?: string;       // 出身高校
  sports?: string;           // 出身スポーツ
  faculty?: string;          // 学科学部
  comment?: string;          // 選手から一言
  rolemodel?: string;        // 憧れのプレーヤー／人物
  hobby?: string;            // 趣味・特技
  animal?: string;           // 自分を生き物に例えると？
  islandItem?: string;       // 無人島に1つだけ持っていくなら
  alternativePath?: string;  // もしラクロスやってなかったら何してた？
  favoriteWord?: string;     // 好きな言葉／口癖
  alphabet?: string;        // 名前のアルファベット表記
  isTestimonial?: boolean;  // 先輩の声に表示
  role?: string;            // "PL" | "MG" | "TR" | "AS" | "C"（ロール。旧STFはMG/TR/ASに細分化）
  position?: string;        // 役職（主将/HC/MGリーダー 等）
  univ?: string;            // 出身大学（コーチ）
  career?: string;          // コーチ歴（コーチ）
  achievement?: string;     // 実績（コーチ）
  organization?: string;    // 組織運営（コーチ）
};

// ==========================
// データ取得関数
// ==========================

// News一覧
export async function fetchNewsList() {
  const { contents } = await client.getList<News>({
    endpoint: "news",
    queries: { orders: "-publishedAt", limit: 24 },
  });
  return contents;
}

// News詳細
export async function fetchNewsById(id: string): Promise<News | null> {
  const { contents } = await client.getList<News>({
    endpoint: "news",
    queries: { filters: `id[equals]${id}`, limit: 1 },
  });
  return contents[0] ?? null;
}

// About
export async function fetchAbout() {
  return await client.getObject<About>({ endpoint: "about" });
}

// Rosters一覧
// 注意: fields でフィールドを限定すると、microCMS スキーマに存在しない
// フィールド名（移行途中の cohort 等）を要求した瞬間に 400 で全件失敗する。
// スキーマ変更に強くするため fields は指定せず全フィールドを取得し、
// 並び順も常に存在する name にする（学年/期の並びはページ側で行う）。
export async function fetchPlayers() {
  const { contents } = await client.getList<Player>({
    endpoint: "players",
    queries: { orders: "name", limit: 100 },
  });
  return contents;
}

export async function fetchTestimonialPlayers(): Promise<Player[]> {
  const { contents } = await client.getList<Player>({
    endpoint: "players",
    queries: { filters: "isTestimonial[equals]true", limit: 10 },
  });
  return contents;
}
