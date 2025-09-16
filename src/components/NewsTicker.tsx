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

const NewsTicker: React.FC<NewsTickerProps> = ({ items }) => {
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
              {/* NEW badge if within 7 days */}
              {(() => {
                const publishedDate = new Date(item.publishedAt);
                const now = new Date();
                const diffDays = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays <= 7) {
                  return (
                    <span className="bg-[#0f6536] text-white px-4 py-2 rounded text-sm md:text-base font-bold">
                      NEW
                    </span>
                  );
                }
                return null;
              })()}
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