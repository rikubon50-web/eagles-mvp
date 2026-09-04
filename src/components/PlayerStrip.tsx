// ロスター詳細の「同じ期のメンバー」横スクロール列。丸写真＋名前の小さなチップで
// 選手→選手の回遊を作る。スマホは横スクロール、PCは折り返し。
import Link from "next/link";
import Image from "next/image";
import type { Player } from "@/lib/microcms";
import { mcmsImg } from "@/lib/image-url";

export default function PlayerStrip({ players, heading }: { players: Player[]; heading: string }) {
  if (players.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{heading}</h2>
      <ul className="scrollbar-none mt-3 -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {players.map((p) => (
          <li key={p.id} className="shrink-0">
            <Link
              href={`/roster/${p.id}`}
              className="group flex w-20 flex-col items-center gap-1.5 text-center"
              aria-label={p.name}
            >
              <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-slate-900 ring-2 ring-transparent transition group-hover:ring-emerald-500">
                {p.photo?.url && (
                  <Image src={mcmsImg(p.photo.url, 160)} alt="" fill sizes="64px" className="object-cover object-top" />
                )}
              </span>
              <span className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-700 group-hover:text-emerald-700">
                {p.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
