// ブログ記事末尾の「この記事に登場する選手」カード。
// 写真＋期・ロール＋名前を横並びにした小さなカードで、ロスター詳細へ送る。
import Link from "next/link";
import Image from "next/image";
import type { Player } from "@/lib/microcms";
import { mcmsImg } from "@/lib/image-url";
import { cohortLabel, cohortOf } from "@/lib/cohort";

export function playerSubLabel(p: Player): string {
  if (p.role === "C") return p.position || "COACH";
  const c = cohortOf(p);
  return [c !== null ? cohortLabel(c) : null, p.role].filter(Boolean).join(" / ");
}

export default function PlayerMiniCard({ player, heading = "この記事に登場する選手" }: { player: Player; heading?: string }) {
  return (
    <section className="not-prose">
      <p className="text-xs font-bold tracking-[0.2em] text-slate-500">{heading}</p>
      <Link
        href={`/roster/${player.id}`}
        className="group mt-2 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-emerald-600"
      >
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900">
          {player.photo?.url && (
            <Image
              src={mcmsImg(player.photo.url, 240)}
              alt={player.name}
              fill
              sizes="64px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{playerSubLabel(player)}</p>
          <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{player.name}</p>
          {player.alphabet && (
            <p className="truncate text-xs tracking-widest text-slate-500">{player.alphabet}</p>
          )}
        </div>
        <span className="shrink-0 text-sm font-bold text-[#0f6536] group-hover:underline">プロフィール →</span>
      </Link>
    </section>
  );
}
