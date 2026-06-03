// src/app/roster/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchPlayers } from "@/lib/microcms";
import { cohortLabel, cohortOf } from "@/lib/cohort";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const players = await fetchPlayers();
  const player = players.find((p) => p.id === params.id);
  if (!player) return {};
  return {
    title: player.name,
    description: `${player.name}選手のプロフィール`,
    openGraph: {
      title: `${player.name} | EAGLES Lacrosse`,
      description: `${player.name}選手のプロフィール`,
      images: player.photo ? [{ url: player.photo.url, width: player.photo.width, height: player.photo.height }] : undefined,
    },
  };
}

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const list = await fetchPlayers().catch(() => [] as any[]);
  const player = list.find((p: any) => p.id === params.id) ?? null;
  if (!player) return notFound();

  const rows: { label: string; value: string }[] = [];
  if (player.faculty)    rows.push({ label: "学部・学科",           value: player.faculty });
  if (player.highschool) rows.push({ label: "出身高校",             value: player.highschool });
  if (player.sports)     rows.push({ label: "経験スポーツ",         value: player.sports });

  let usedCommentForFavorite = false;
  if (player.favoriteWord) {
    rows.push({ label: "EAGLESの好きなところ", value: player.favoriteWord });
  } else if (player.comment) {
    rows.push({ label: "EAGLESの好きなところ", value: player.comment });
    usedCommentForFavorite = true;
  }

  if (player.hobby)            rows.push({ label: "オフの過ごし方",           value: player.hobby });

  return (
    <>
      {/* ダーク見出し帯 */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900 py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-5">
          <Link
            href="/roster"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-5"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ロスター一覧へ
          </Link>
          <div className="flex items-end gap-4">
            <div>
              {(() => {
                const c = cohortOf(player);
                return c !== null ? (
                  <p className="text-slate-400 text-sm mb-1">{cohortLabel(c)}</p>
                ) : null;
              })()}
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{player.name}</h1>
              {player.alphabet && (
                <p className="text-slate-400 text-sm mt-2 tracking-widest">{player.alphabet}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">

          {/* 写真 */}
          <div className="w-full md:w-auto md:flex-shrink-0 md:max-w-[280px]">
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <Image
                src={player.photo.url}
                alt={player.name}
                width={player.photo.width}
                height={player.photo.height}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>

          {/* プロフィール */}
          <div className="flex-1 min-w-0">
            {rows.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {rows.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`flex flex-row${idx < rows.length - 1 ? " border-b border-slate-200" : ""}`}
                  >
                    <div className="bg-[#0f6536] text-white font-bold text-sm flex items-center justify-center px-3 py-3 w-[38%] flex-shrink-0 text-center leading-snug">
                      {row.label}
                    </div>
                    <div className="bg-white text-gray-800 font-semibold text-sm sm:text-base flex items-center px-4 py-3 flex-1 min-w-0 leading-snug">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {player.comment && !usedCommentForFavorite && (
              <div className="mt-6 p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <h2 className="text-xs font-bold text-[#0f6536] uppercase tracking-widest mb-3">Comment</h2>
                <p className="leading-7 text-slate-700 whitespace-pre-line text-base md:text-lg font-semibold">
                  {player.comment}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/roster" className="button-32">
            ロスター一覧へ戻る
          </Link>
        </div>
      </div>
    </>
  );
}
