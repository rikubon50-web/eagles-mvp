import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logout } from "@/app/admin/actions";
import DeleteGameButton from "./DeleteGameButton";

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
};

const STATUS_LABEL: Record<GameRow["status"], string> = {
  scheduled: "予定",
  finished: "終了",
  postponed: "延期",
};

const STATUS_CLASS: Record<GameRow["status"], string> = {
  scheduled: "bg-emerald-100 text-emerald-700",
  finished: "bg-slate-100 text-slate-600",
  postponed: "bg-amber-100 text-amber-700",
};

function formatJst(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GameRowItem({ game }: { game: GameRow }) {
  return (
    <div key={game.id} className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_CLASS[game.status]}`}>
            {STATUS_LABEL[game.status]}
          </span>
          <span className="text-xs text-slate-400">{formatJst(game.start_at)}</span>
        </div>
        <p className="truncate font-semibold text-slate-900">
          vs {game.opponent}
          {game.status === "finished" && game.our_score != null && game.opp_score != null && (
            <span className="ml-2 text-slate-600 font-normal">
              {game.our_score} - {game.opp_score}
            </span>
          )}
        </p>
        <p className="truncate text-sm text-slate-500">{game.title}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href={`/admin/games/${game.id}`} className="text-sm text-emerald-700 underline">
          編集
        </Link>
        <DeleteGameButton id={game.id} />
      </div>
    </div>
  );
}

export default async function AdminGamesListPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  if (profile.role !== "admin") {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="text-slate-600 text-sm">
          試合情報の編集には管理者権限が必要です。担当者に連絡してください。
        </p>
        <form action={logout}>
          <button className="text-sm text-emerald-700 underline">ログアウト</button>
        </form>
      </div>
    );
  }

  const supabase = createSupabaseServer();
  const now = new Date().toISOString();
  const SELECT = "id, title, start_at, venue, opponent, status, our_score, opp_score";

  const [{ data: upcomingData, error: upcomingError }, { data: pastData, error: pastError }] =
    await Promise.all([
      supabase.from("games").select(SELECT).gte("start_at", now).order("start_at", { ascending: true }),
      supabase.from("games").select(SELECT).lt("start_at", now).order("start_at", { ascending: false }),
    ]);

  const error = upcomingError || pastError;
  if (error) {
    console.error("AdminGamesListPage: games fetch failed", error);
  }

  const upcoming = (upcomingData ?? []) as GameRow[];
  const past = (pastData ?? []) as GameRow[];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">試合情報の編集</h1>
        <form action={logout}>
          <button className="text-sm text-slate-500 underline">ログアウト</button>
        </form>
      </div>

      <div className="flex justify-end mb-4">
        <Link
          href="/admin/games/new"
          className="rounded bg-emerald-600 text-white px-4 py-2 font-bold hover:bg-emerald-700"
        >
          新規作成
        </Link>
      </div>

      {error ? (
        <p className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          データの取得に失敗しました。再読み込みしてください。
        </p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">これからの試合</h2>
            {upcoming.length === 0 ? (
              <p className="text-slate-500 text-sm">予定されている試合はありません。</p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
                {upcoming.map((game) => (
                  <GameRowItem key={game.id} game={game} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">終了・延期</h2>
            {past.length === 0 ? (
              <p className="text-slate-500 text-sm">試合結果はありません。</p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
                {past.map((game) => (
                  <GameRowItem key={game.id} game={game} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
