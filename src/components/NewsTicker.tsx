import React from "react";
import Link from "next/link";

export type News = {
  id: string;
  title: string;
  excerpt?: string;
  body: string;
  category: "お知らせ" | "新歓" | "試合情報";
  publishedAt: string;
};

type NewsTickerProps = {
  items: News[];
};

// NEW badge if published within 7 days
const isNew = (publishedAt: string): boolean => {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffDays = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

const NewsTicker: React.FC<NewsTickerProps> = ({ items }) => {
  // No news: hide the whole band
  if (items.length === 0) {
    return null;
  }

  // Fewer than 3 items: a looping marquee looks broken, so show the
  // latest item as a single static, centered row instead
  if (items.length < 3) {
    const latest = items[0];
    return (
      <div className="w-full bg-slate-900 text-white py-5 md:py-8">
        <Link
          href={`/news/${latest.id}`}
          className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-6 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {/* date */}
          <span className="shrink-0 text-sm md:text-lg font-bold tracking-wider tabular-nums">
            {latest.publishedAt.substring(0, 10).replaceAll("-", "/")}
          </span>
          {isNew(latest.publishedAt) && (
            <span className="shrink-0 bg-[#0f6536] text-white px-4 py-2 rounded text-sm md:text-base font-bold">
              NEW
            </span>
          )}
          {/* category badge */}
          <span className="shrink-0 rounded border border-white/40 px-3 py-1 text-sm md:text-base uppercase font-bold text-white/80">
            {latest.category}
          </span>
          {/* title */}
          <span className="min-w-0 truncate text-sm md:text-lg font-bold">
            {latest.title}
          </span>
        </Link>
      </div>
    );
  }

  // Duplicate the items so the marquee loops seamlessly
  const tickerItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-slate-900 text-white py-5 md:py-8">
      {/* track */}
      <div className="flex whitespace-nowrap animate-ticker">
        {tickerItems.map((item, idx) => {
          return (
            <Link
              key={item.id + "-" + idx}
              href={`/news/${item.id}`}
              className="inline-flex items-center gap-4 px-6 py-0 border-r border-white/10 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {/* date */}
              <span className="text-2xl md:text-3xl font-bold tracking-wider">
                {item.publishedAt.substring(0, 10)}
              </span>
              {isNew(item.publishedAt) && (
                <span className="bg-[#0f6536] text-white px-4 py-2 rounded text-sm md:text-base font-bold">
                  NEW
                </span>
              )}
              {/* category */}
              <span className="text-lg md:text-xl uppercase font-bold text-white/80">
                {item.category}
              </span>
              {/* title */}
              <span className="text-xl md:text-2xl font-bold">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default NewsTicker;