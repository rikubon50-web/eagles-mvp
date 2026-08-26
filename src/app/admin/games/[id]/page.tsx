import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import GameForm from "../GameForm";

export const dynamic = "force-dynamic";

type GameRow = {
  id: string;
  title: string;
  start_at: string;
  venue: string;
  opponent: string;
  status: "scheduled" | "finished" | "postponed";
  our_score: number | null;
  opp_score: number | null;
  note: string;
  opponent_logo_url: string | null;
};

export default async function AdminGameEditPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  if (profile.role !== "admin") {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="text-slate-600 text-sm">
          試合情報の編集には管理者権限が必要です。担当者に連絡してください。
        </p>
      </div>
    );
  }

  const supabase = createSupabaseServer();
  const { data: game, error } = await supabase
    .from("games")
    .select("id, title, start_at, venue, opponent, status, our_score, opp_score, note, opponent_logo_url")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("AdminGameEditPage: game fetch failed", error);
  }

  if (!game) {
    notFound();
  }

  const row = game as GameRow;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">試合編集</h1>
      <GameForm
        initial={{
          id: row.id,
          title: row.title,
          startAt: row.start_at,
          venue: row.venue,
          opponent: row.opponent,
          status: row.status,
          ourScore: row.our_score,
          oppScore: row.opp_score,
          note: row.note,
          opponentLogoUrl: row.opponent_logo_url,
        }}
      />
    </div>
  );
}
