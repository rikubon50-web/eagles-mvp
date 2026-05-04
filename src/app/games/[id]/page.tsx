// src/app/games/[id]/page.tsx
import type { Metadata } from "next";
import { client, type Game } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const game = await client.getListDetail<Game>({ endpoint: "games", contentId: params.id });
    if (!game) return {};
    const description = `${game.startAt ? new Date(game.startAt).toLocaleDateString("ja-JP") : ""} ${game.venue ?? ""}`.trim();
    return {
      title: game.title,
      description,
      openGraph: {
        title: game.title,
        description,
        images: game.homeTeamLogo ? [{ url: game.homeTeamLogo.url, width: game.homeTeamLogo.width, height: game.homeTeamLogo.height }] : undefined,
      },
    };
  } catch {
    return {};
  }
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

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": game.title,
      "startDate": game.startAt,
      "location": {
        "@type": "Place",
        "name": game.venue ?? ""
      },
      "homeTeam": {
        "@type": "SportsTeam",
        "name": game.homeTeamName
      },
      "awayTeam": {
        "@type": "SportsTeam",
        "name": game.awayTeamName
      }
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="prose-mcms max-w-3xl mx-auto px-4 py-10">
          {/* microCMS リッチエディタのHTMLをそのまま描画 */}
          <div dangerouslySetInnerHTML={{ __html: game.text }} />
        </article>
      </>
    );
  } catch {
    return notFound();
  }
}