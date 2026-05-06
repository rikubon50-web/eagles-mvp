// src/app/games/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
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

export default async function GameTextPage({ params }: { params: { id: string } }) {
  try {
    const game = await client.getListDetail<Game>({
      endpoint: "games",
      contentId: params.id,
    });

    if (!game || !game.text) {
      return notFound();
    }

    const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
    const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": game.title,
      "startDate": game.startAt,
      "location": { "@type": "Place", "name": game.venue ?? "" },
      "homeTeam": { "@type": "SportsTeam", "name": game.homeTeamName },
      "awayTeam": { "@type": "SportsTeam", "name": game.awayTeamName },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* ダーク見出し帯 */}
        <div className={`${fullWidth} bg-slate-900 py-12`}>
          <div className={innerCls}>
            <Link href="/games" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              試合一覧へ
            </Link>

            {game.startAt && (
              <div className="mb-4">
                <time className="text-slate-400 text-sm">
                  {new Date(game.startAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
            )}

            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-snug">
              {game.title}
            </h1>

            {game.venue && (
              <p className="text-slate-400 mt-2 text-sm">{game.venue}</p>
            )}
          </div>
        </div>

        {/* 本文エリア */}
        <div className="pt-16 pb-16 md:pt-20 md:pb-20">
          <div className="max-w-3xl mx-auto px-4">
            <article
              className="prose prose-slate prose-lg prose-headings:font-bold prose-a:text-[#0f6536] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-img:mt-8"
              dangerouslySetInnerHTML={{ __html: game.text }}
            />

            <div className="mt-12 pt-8 border-t border-slate-200">
              <Link href="/games" className="button-32">
                試合一覧へ戻る
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  } catch {
    return notFound();
  }
}
