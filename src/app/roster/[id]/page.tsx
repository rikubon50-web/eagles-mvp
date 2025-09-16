// src/app/roster/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchPlayers } from "@/lib/microcms";

export const revalidate = 60;

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const list = await fetchPlayers().catch(() => [] as any[]);
  const player = list.find((p: any) => p.id === params.id) ?? null;
  if (!player) return notFound();

  // Build rows array based on available player fields
  const rows: { label: string; value: string }[] = [];
  if (player.faculty) rows.push({ label: "学部・学科", value: player.faculty });
  if (player.highschool) rows.push({ label: "出身高校", value: player.highschool });
  if (player.sports) rows.push({ label: "経験スポーツ", value: player.sports });
  // Use favoriteWord, fallback to comment for this row
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
    <article className="container py-10">
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
          <h1 className="section-title text-4xl md:text-5xl font-bold mb-2">{player.name}</h1>
          <p className="text-slate-500 mb-6">{player.alphabet}</p>

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

          {/* Render comment block only if it exists and was not used above */}
          {player.comment && !usedCommentForFavorite && (
            <div className="mt-8 p-6 md:p-8 bg-white border-2 border-slate-300 rounded-xl shadow-md">
              <h2 className="section-title text-2xl font-bold mb-3">一言コメント</h2>
              <p className="leading-8 text-slate-700 whitespace-pre-line text-xl md:text-2xl font-bold">{player.comment}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}