// src/app/recruit/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchNewsList, fetchPlayers, Player } from "@/lib/microcms";
import NewsCard from "@/components/NewsCard";
import FadeIn from "@/components/motion/FadeIn";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "新歓 | EAGLES Lacrosse",
  description: "青山学院大学男子ラクロス部 EAGLES の新入部員募集ページ。初心者大歓迎です。",
  openGraph: {
    title: "新歓 | EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 EAGLES の新入部員募集ページ。初心者大歓迎です。",
    type: "website",
    images: [{ url: "/img/og-default.png", width: 1200, height: 630, alt: "新歓 | EAGLES Lacrosse" }],
  },
};

const STATS = [
  { value: "約100名", label: "部員数" },
  { value: "約90%", label: "初心者からのスタート" },
  { value: "週5日", label: "活動日数" },
  { value: "35年以上", label: "の歴史" },
];

const STEPS = [
  { num: 1, title: "体験参加", desc: "まずは気軽にグラウンドへ" },
  { num: 2, title: "見学・練習参加", desc: "雰囲気を掴む" },
  { num: 3, title: "入部届提出", desc: "簡単な手続きのみ" },
  { num: 4, title: "活動スタート", desc: "一緒に日本一を目指す" },
];

const FAQS = [
  {
    q: "ラクロス未経験でも大丈夫ですか？",
    a: "大丈夫です！現役部員の約90%はラクロス未経験からスタートしています。",
  },
  {
    q: "活動日はいつですか？",
    a: "火・水・金・土・日の週5日活動しています。1年生は例年、月・火・木・土・日に練習しています。",
  },
  {
    q: "費用はどれくらいかかりますか？",
    a: "部費・合宿費・道具代などがかかります。道具は中古の活用も可能です。詳しくはお問い合わせください。",
  },
  {
    q: "アルバイトや勉強と両立できますか？",
    a: "できます。現役部員の約75%がアルバイトをしています。基本は朝練なので、午後の時間を自由に使えます。",
  },
  {
    q: "いつから入部できますか？",
    a: "いつでも歓迎です！毎年、夏や秋から新しく始める部員もいます。",
  },
];

export default async function ShinkanPage() {
  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";
  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";

  const [allNews, players] = await Promise.all([
    fetchNewsList().catch(() => []),
    fetchPlayers().catch(() => []),
  ]);
  const shinkanNews = allNews.filter((n) => n.category === "新歓").slice(0, 6);

  const testimonials = players.filter((p: Player) => p.comment).slice(0, 3);

  return (
    <>
      {/* 1. Hero */}
      <div className={`${fullWidth} relative min-h-[80vh] flex items-center overflow-hidden`}>
        <Image
          src="/img/IMG_8307.JPG"
          alt="EAGLES Lacrosse"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/65" />
        <div className={`${innerCls} relative text-white py-24`}>
          <p className="text-[#4ade80] font-bold tracking-widest mb-4 text-sm md:text-base uppercase">
            青山学院大学男子ラクロス部 EAGLES
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] mb-6 text-white">
            一緒に<br />グラウンドに<br />立とう
          </h1>
          <p className="text-slate-200 text-lg mb-10 max-w-xl leading-relaxed">
            初心者大歓迎。ゼロから始めて、<br className="hidden md:block" />
            仲間と共に日本一を目指す。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://www.instagram.com/eagles_agulax"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0f6536] hover:bg-[#0a5229] text-white font-bold px-6 py-3 rounded-md transition-colors"
            >
              Instagram をフォロー
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold px-6 py-3 rounded-md transition-colors"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 新歓情報 */}
      <div className={`${fullWidth} bg-white py-16`}>
        <FadeIn className={innerCls}>
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-8">新歓情報</h2>
          {shinkanNews.length > 0 ? (
            <>
              <ul>
                {shinkanNews.map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </ul>
              <div className="mt-10 text-center">
                <Link href="/news" className="button-32">ニュース一覧を見る</Link>
              </div>
            </>
          ) : (
            <p className="text-slate-500">
              新歓情報は随時更新されます。
              <Link
                href="https://www.instagram.com/eagles_agulax"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0f6536] underline ml-1"
              >
                Instagram をチェックしてください。
              </Link>
            </p>
          )}
        </FadeIn>
      </div>

      {/* 3. EAGLESの数字 */}
      <div className={`${fullWidth} bg-slate-100 py-16`}>
        <FadeIn className={innerCls}>
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-10 text-center">
            EAGLESの数字
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="text-4xl md:text-5xl font-extrabold text-[#0f6536] leading-tight">
                  {value}
                </p>
                <p className="mt-2 text-slate-600 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* 4. 入部の流れ */}
      <div className={`${fullWidth} bg-white py-16`}>
        <FadeIn className={innerCls}>
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-10">入部の流れ</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-0">
            {STEPS.map(({ num, title, desc }, idx) => (
              <>
                <div key={num} className="flex flex-col items-center flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#0f6536] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                    {num}
                  </div>
                  <div className="mt-3">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{title}</h3>
                    <p className="text-slate-600 text-sm">{desc}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div key={`arrow-${idx}`} className="hidden md:block text-slate-300 text-3xl shrink-0">→</div>
                )}
              </>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* 5. 先輩の声 */}
      {testimonials.length > 0 && (
        <div className={`${fullWidth} bg-slate-900 py-16`}>
          <FadeIn className={innerCls}>
            <h2 className="section-title text-3xl md:text-4xl font-bold mb-10 text-white">
              先輩の声
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((p: Player) => (
                <div key={p.id} className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
                  {p.photo && (
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shrink-0">
                      <Image
                        src={p.photo.url}
                        alt={p.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="font-bold text-white mb-0.5">{p.name}</p>
                  <p className="text-slate-400 text-xs mb-4">{p.year}年生</p>
                  <p className="text-slate-300 text-sm leading-relaxed">「{p.comment}」</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      )}

      {/* 6. FAQ */}
      <div className={`${fullWidth} bg-white py-16`}>
        <FadeIn className={innerCls}>
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-8">よくある質問</h2>
          <div className="faq space-y-3 max-w-3xl">
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="faq__item group overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <summary className="faq__q flex items-center gap-3 px-5 py-5 cursor-pointer bg-slate-50">
                  <span className="text-green-700 font-bold shrink-0">Q.</span>
                  <span className="grow pr-3 text-slate-900 font-semibold break-words leading-snug">
                    {item.q}
                  </span>
                  <span aria-hidden className="ml-auto inline-flex items-center justify-center shrink-0 w-6 h-6 relative">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-4 bg-green-700 rounded" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-green-700 rounded transition-opacity duration-200 group-open:opacity-0" />
                  </span>
                </summary>
                <div className="faq__a flex items-start gap-3 px-5 py-6 border-t border-slate-200">
                  <span className="text-red-600 font-bold mt-[5px] shrink-0">A.</span>
                  <p className="text-slate-700 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* 7. CTA */}
      <div className={`${fullWidth} bg-[#0f6536] py-16`}>
        <FadeIn className={`${innerCls} text-center`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            まずは気軽に連絡してください
          </h2>
          <p className="text-green-100 mb-10 text-lg">
            見学だけでも大歓迎。一緒に走ってみましょう。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://www.instagram.com/eagles_agulax"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#0f6536] font-bold px-8 py-3 rounded-md hover:bg-green-50 transition-colors"
            >
              Instagram で DM
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-3 rounded-md hover:bg-white/10 transition-colors"
            >
              お問い合わせフォーム
            </Link>
          </div>
        </FadeIn>
      </div>
    </>
  );
}
