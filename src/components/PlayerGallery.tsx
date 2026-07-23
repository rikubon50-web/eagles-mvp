"use client";

import { useState } from "react";
import Image from "next/image";

export type GalleryImage = { url: string; width: number; height: number };

/**
 * 選手詳細の写真ギャラリー。
 * 画像が1枚のときは従来どおり単純表示、2枚以上でスワイプ/矢印/ドットが出る。
 */
export default function PlayerGallery({
  images,
  alt,
}: {
  images: GalleryImage[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const count = images.length;
  const multi = count > 1;
  const go = (i: number) => setIndex((i + count) % count);

  if (count === 0) return null;

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg bg-slate-100"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
          setTouchStartX(null);
        }}
      >
        {/* 横並びトラックをスライド */}
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={img.url} className="w-full flex-shrink-0">
              <Image
                src={img.url}
                alt={count > 1 ? `${alt}（${i + 1}/${count}）` : alt}
                width={img.width}
                height={img.height}
                className="w-full h-auto object-cover"
                sizes="(min-width: 768px) 280px, 100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {multi && (
          <>
            <button
              type="button"
              aria-label="前の写真"
              onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="次の写真"
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {multi && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={`${i + 1}枚目を表示`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-[#0f6536]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
