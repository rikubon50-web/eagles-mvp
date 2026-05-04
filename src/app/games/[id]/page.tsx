// src/app/games/[id]/page.tsx
import type { Metadata } from "next";
import { client, type Game, fetchGamesUpcoming, fetchGamesArchive } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const [upcoming, archive] = await Promise.all([fetchGamesUpcoming(), fetchGamesArchive()]);
  const game = [...upcoming, ...archive].find((g) => g.id === params.id);
  if (!game) return {};
  return {
    title: game.title,
    description: `${game.startAt ? new Date(game.startAt).toLocaleDateString("ja-JP") : ""} ${game.venue ?? ""}`.trim(),
    openGraph: {
      title: game.title,
      description: `${game.startAt ? new Date(game.startAt).toLocaleDateString("ja-JP") : ""} ${game.venue ?? ""}`.trim(),
      images: game.homeTeamLogo ? [{ url: game.homeTeamLogo.url, width: game.homeTeamLogo.width, height: game.homeTeamLogo.height }] : undefined,
    },
  };
}

export default async function GameTextPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const game = await client.getListDetail<Game>({
      endpoint: "games",
      contentId: params.id,
    });

    // text が空なら 404 扱い（必要に応じて変えてOK）
    if (!game || !game.text) {
      return notFound();
    }

    return (
      <article className="prose-mcms max-w-3xl mx-auto px-4 py-10">
        {/* microCMS リッチエディタのHTMLをそのまま描画 */}
        <div dangerouslySetInnerHTML={{ __html: game.text }} />
      </article>
    );
  } catch {
    return notFound();
  }
}