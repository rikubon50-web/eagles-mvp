// src/components/BlogCard.tsx
import Link from "next/link";
import Image from "next/image";
import type { Blog } from "@/lib/microcms";

export default function BlogCard({ item }: { item: Blog }) {
  return (
    <Link
      href={`/blog/${item.id}`}
      className="group card rounded-xl bg-gradient-to-b from-white to-slate-50 hover:shadow-2xl hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col p-4 md:p-6"
      aria-label={item.title}
    >
      <div className="mb-3 overflow-hidden rounded-lg aspect-[16/9] bg-slate-100">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail.url}
            alt={item.title}
            width={item.thumbnail.width}
            height={item.thumbnail.height}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No Image
          </div>
        )}
      </div>
      <h3 className="mb-2 line-clamp-2 font-bold leading-snug text-lg md:text-xl">{item.title}</h3>
      {item.excerpt && (
        <p className="mt-2 text-sm text-slate-700">{item.excerpt}</p>
      )}
      <time
        dateTime={item.publishedAt}
        className="block mt-2 mb-2 text-xs text-slate-500"
      >
        {new Date(item.publishedAt).toLocaleDateString("ja-JP")}
      </time>
    </Link>
  );
}