// src/lib/games.ts
// 公開側（games一覧・詳細・ホームUpcoming）のデータ取得。Supabase の games テーブルから読む。
import { createSupabasePublic } from "@/lib/supabase/public";
import { deriveResult } from "@/lib/games-domain";
import { sanitizePostBody } from "@/lib/sanitize-body";

export type GameView = {
  id: string;
  title: string;
  startAt: string;
  venue: string;
  homeTeamName: string;
  homeTeamLogo: { url: string; width: number; height: number };
  awayTeamName: string;
  awayTeamLogo?: { url: string; width: number; height: number };
  status: "scheduled" | "live" | "finished" | "postponed";
  ourScore?: number;
  oppScore?: number;
  result?: "win" | "lose" | "draw";
  text?: string;
};

type GameRow = {
  id: string;
  title: string;
  start_at: string;
  venue: string;
  opponent: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  our_score: number | null;
  opp_score: number | null;
  note: string | null;
  opponent_logo_url: string | null;
};

const HOME_TEAM_NAME = "青山学院大学";
const HOME_TEAM_LOGO = { url: "/img/logo.png", width: 977, height: 599 };

const GAME_SELECT =
  "id,title,start_at,venue,opponent,status,our_score,opp_score,note,opponent_logo_url";

function toGameView(row: GameRow): GameView {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    venue: row.venue,
    homeTeamName: HOME_TEAM_NAME,
    homeTeamLogo: HOME_TEAM_LOGO,
    awayTeamName: row.opponent,
    awayTeamLogo: row.opponent_logo_url
      ? { url: row.opponent_logo_url, width: 400, height: 400 }
      : undefined,
    status: row.status,
    ourScore: row.our_score ?? undefined,
    oppScore: row.opp_score ?? undefined,
    result: deriveResult(row.status, row.our_score, row.opp_score) ?? undefined,
    // note は管理画面のtextareaから部員が自由入力できるため、公開ページの
    // dangerouslySetInnerHTML に渡す前に許可リストでサニタイズする（stored-XSS対策）。
    text: row.note ? sanitizePostBody(row.note) : undefined,
  };
}

// 進行中の試合（status=live、start_at 昇順）。失敗時は throw。
export async function fetchGamesLive(): Promise<GameView[]> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("status", "live")
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data as GameRow[]).map(toGameView);
}

// これからの試合（start_at > now、昇順）。live は速報セクションに出すため除外。失敗時は throw。
export async function fetchGamesUpcoming(): Promise<GameView[]> {
  const now = new Date().toISOString();
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .gt("start_at", now)
    .neq("status", "live")
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data as GameRow[]).map(toGameView);
}

// 終了した試合（start_at <= now、降順）。live は速報セクションに出すため除外。失敗時は throw。
export async function fetchGamesArchive(): Promise<GameView[]> {
  const now = new Date().toISOString();
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .lte("start_at", now)
    .neq("status", "live")
    .order("start_at", { ascending: false });

  if (error) throw error;
  return (data as GameRow[]).map(toGameView);
}

// 試合詳細（/games/[id]）。存在しない場合は null、失敗時は throw。
export async function fetchGameById(id: string): Promise<GameView | null> {
  const supabase = createSupabasePublic();
  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toGameView(data as GameRow);
}
