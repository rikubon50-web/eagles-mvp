// src/app/games/[id]/page.tsx
import { client, type Game } from "@/lib/microcms";
import { notFound } from "next/navigation";

export const revalidate = 60;

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