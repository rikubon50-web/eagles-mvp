// src/app/roster/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchPlayers } from "@/lib/microcms";

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

  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";

  const rows: { label: string; value: string }[] = [];
  if (player.faculty) rows.push({ label: "学部・学科", value: player.faculty });
  if (player.highschool) rows.push({ label: "出身高校", value: player.highschool });
  if (player.sports) rows.push({ label: "経験スポーツ", value: player.sports });
  let usedCommentForFavorite = false;
  if (player.favoriteWord) {
    rows.push({ label: "EAGLESの好きなところ", value: player.favoriteWord });
  } else if (player.comment) {
    rows.push({ label: "EAGLESの好きなところ", value: player.comment });
    usedCommentForFavorite = true;
  }
  if (player.hobby) rows.push({ label: "オフの過ごし方", value: player.hobby });
  if (player.rolemodel) rows.push({ label: "憧れの人", value: player.rolemodel });
  if (player.animal) rows.push({ label: "生き物に例えると", value: player.animal });
  if (player.islandItem) rows.push({ label: "無人島に1つだけ持っていくなら", value: player.islandItem });
  if (player.alternativePath) rows.push({ label: "もしラクロスやってなかったら", value: player.alternativePath });

  return (
    <>
      {/* ダーク見出し帯 */}
      <div className={`${fullWidth} bg-slate-900 py-12`}>
        <div className={innerCls}>
          <Link href="/roster" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ロスター一覧へ
          </Link>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-snug">{player.name}</h1>
          {player.alphabet && <p className="text-slate-400 mt-2">{player.alphabet}</p>}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* 写真 */}
            <div className="relative overflow-hidden rounded-2xl shadow-card">
              <Image
                src={player.photo.url}
                alt={player.name}
                width={player.photo.width}
                height={player.photo.height}
                className="w-full h-auto object-cover max-w-[510px] mx-auto"
                priority
              />
            </div>
            {/* 情報 */}
            <div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-300">
                {rows.map((row, idx) => {
                  const isLast = idx === rows.length - 1;
                  return (
                    <div
                      key={row.label}
                      className={`grid grid-cols-[200px,1fr] md:grid-cols-[320px,1fr]`}
                    >
                      <div
                        className={`bg-[#0f6536] text-white font-extrabold text-base md:text-lg flex items-center justify-center py-3 md:py-4 px-3 md:px-5 text-center ${
                          !isLast ? "border-b-2 border-slate-300" : ""
                        }`}
                      >
                        {row.label}
                      </div>
                      <div
                        className={`bg-white text-gray-800 text-base md:text-lg font-extrabold flex items-center px-4 md:px-6 py-3 md:py-4 ${
                          !isLast ? "border-b-2 border-slate-300" : ""
                        }`}
                      >
                        {row.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              {player.comment && !usedCommentForFavorite && (
                <div className="mt-8 p-6 md:p-8 bg-white border-2 border-slate-300 rounded-xl shadow-md">
                  <h2 className="section-title text-2xl font-bold mb-3">一言コメント</h2>
                  <p className="leading-8 text-slate-700 whitespace-pre-line text-xl md:text-2xl font-bold">{player.comment}</p>
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
      </div>
    </>
  );
}
