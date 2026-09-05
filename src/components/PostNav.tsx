// ブログ記事の「前の記事／次の記事」ナビ。サムネ＋タイトルで、引退ブログを連続で読ませる導線。
import Link from "next/link";
import Image from "next/image";
import type { PostSummary } from "@/lib/posts";
import { mcmsImg } from "@/lib/image-url";

function NavCard({ post, dir }: { post: PostSummary; dir: "prev" | "next" }) {
  const isPrev = dir === "prev";
  return (
    <Link
      href={`/blog/${post.id}`}
      className={`group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-emerald-600 ${
        isPrev ? "flex-row" : "flex-row-reverse text-right"
      }`}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-900">
        {post.thumbnailUrl ? (
          <Image src={mcmsImg(post.thumbnailUrl, 240)} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <Image src="/img/logo-sm.webp" alt="" fill sizes="80px" className="object-contain p-2 opacity-90" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {isPrev ? "← 前の記事" : "次の記事 →"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-emerald-700">
          {post.title}
        </p>
      </div>
    </Link>
  );
}

export default function PostNav({ prev, next }: { prev: PostSummary | null; next: PostSummary | null }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="前後の記事" className="grid gap-3 md:grid-cols-2">
      {prev ? <NavCard post={prev} dir="prev" /> : <div className="hidden md:block" />}
      {next && <NavCard post={next} dir="next" />}
    </nav>
  );
}
