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

export type Game = {
  id: string;
  title: string;
  startAt: string;
  venue: string;
  homeTeamName: string;
  homeTeamLogo: { url: string; width: number; height: number };
  awayTeamName: string;
  awayTeamLogo?: { url: string; width: number; height: number };

  status: "scheduled" | "finished" | "postponed";

  // スコア
  ourScore?: number;
  oppScore?: number;

  // 「勝敗」ラベル（win/lose/draw）
  result?: "win" | "lose" | "draw";

  // 任意の追加情報
  text?: string;
};

// ★ Roster（部員紹介）
export type Player = {
  id: string;
  name: string;    // 名前
  year: number; // 学年（1,2,3,4）
  photo: { url: string; width: number; height: number }; // 写真
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
};

// ★ Blog（ブログ）
export type Blog = {
  id: string;
  title: string;
  excerpt?: string;
  body: string;
  thumbnail?: { url: string; width: number; height: number };
  publishedAt: string;
};

// ゲーム一覧で使うフィールドを明示（status / ourScore / oppScore を忘れずに）
const GAME_LIST_FIELDS = [
  "id",
  "title",
  "startAt",
  "venue",
  "homeTeamName",
  "homeTeamLogo",
  "awayTeamName",
  "awayTeamLogo",
  "status",
  "ourScore",
  "oppScore",
  "ctaText",
  "ctaUrl",
  "season",
].join(",");

const PLAYER_LIST_FIELDS = [
  "id",
  "name",
  "year",
  "alphabet",
  "classYear",
  "photo",
  "highschool",
  "sports",
  "faculty",
  "comment",
  "rolemodel",
  "hobby",
  "animal",
  "islandItem",
  "alternativePath",
  "favoriteWord",
].join(",");

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
export async function fetchNewsById(id: string) {
  const { contents } = await client.getList<News>({
    endpoint: "news",
    queries: { filters: `id[equals]${id}`, limit: 1 },
  });
  return contents[0] ?? null;
}

// これからの試合
export async function fetchGamesUpcoming() {
  const now = new Date().toISOString();
  const { contents } = await client.getList<Game>({
    endpoint: "games",
    queries: { filters: `startAt[greater_than]${now}`, orders: "startAt", limit: 100, fields: GAME_LIST_FIELDS },
  });
  return contents;
}

// 終了した試合
export async function fetchGamesArchive() {
  const now = new Date().toISOString();
  const { contents } = await client.getList<Game>({
    endpoint: "games",
    queries: { filters: `startAt[less_than]${now}`, orders: "-startAt", limit: 100, fields: GAME_LIST_FIELDS },
  });
  return contents;
}

// About
export async function fetchAbout() {
  return await client.getObject<About>({ endpoint: "about" });
}

// Rosters一覧
export async function fetchPlayers() {
  const { contents } = await client.getList<Player>({
    endpoint: "players",
    queries: { orders: "year,name", limit: 100, fields: PLAYER_LIST_FIELDS },
  });
  return contents;
}


// Blog一覧
export async function fetchBlogList() {
  const { contents } = await client.getList<Blog>({
    endpoint: "blog",
    queries: { orders: "-publishedAt", limit: 24 },
  });
  return contents;
}

export async function fetchBlogById(id: string) {
  const { contents } = await client.getList<Blog>({
    endpoint: "blog",
    queries: { filters: `id[equals]${id}`, limit: 1 },
  });
  return contents[0] ?? null;
}