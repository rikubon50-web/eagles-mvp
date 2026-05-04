// src/app/page.tsx
import { Suspense } from "react";
import Image from "next/image";
import Attraction from "@/components/Attraction";
import { SectionSkeleton } from "@/components/Skeleton";
import NewsTickerSection from "@/components/sections/NewsTickerSection";
import UpcomingSection from "@/components/sections/UpcomingSection";
import StandingsSection from "@/components/sections/StandingsSection";
import NewsSection from "@/components/sections/NewsSection";
import BlogSection from "@/components/sections/BlogSection";
import RosterSection from "@/components/sections/RosterSection";

export const revalidate = 300;

export default async function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": "EAGLES Lacrosse",
    "sport": "Lacrosse",
    "url": process.env.NEXT_PUBLIC_SITE_URL ?? "https://eagles-mvp-c8m4.vercel.app",
    "memberOf": {
      "@type": "SportsOrganization",
      "name": "関東学生ラクロス連盟"
    }
  };

  const innerCls = "max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6";
  const fullWidth = "relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]";

  return (
    <div>
      {/* Hero + NewsTicker */}
      <div className="space-y-0">
        <div className={`${fullWidth} bg-[#0f6536]`} style={{ aspectRatio: "1672/941", maxHeight: "calc(100vh - 85px)" }}>
          <Image
            src="/img/hero.png"
            alt="EAGLES Lacrosse"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className={`${fullWidth} bg-slate-900/90 text-white`}>
          <Suspense fallback={<div className="h-10 bg-slate-900/90" />}>
            <NewsTickerSection />
          </Suspense>
        </div>
      </div>

      {/* UpcomingSection — white */}
      <div className={`${fullWidth} bg-white py-16`}>
        <div className={innerCls}>
          <Suspense fallback={<SectionSkeleton />}>
            <UpcomingSection />
          </Suspense>
        </div>
      </div>

      {/* StandingsSection — slate-100 */}
      <div className={`${fullWidth} bg-slate-100 py-16`}>
        <div className={innerCls}>
          <Suspense fallback={<SectionSkeleton />}>
            <StandingsSection />
          </Suspense>
        </div>
      </div>

      {/* NewsSection — slate-900 (dark) */}
      <div className={`${fullWidth} bg-slate-900 py-16`}>
        <div className={innerCls}>
          <Suspense fallback={<SectionSkeleton />}>
            <NewsSection dark />
          </Suspense>
        </div>
      </div>

      {/* Attraction — full-width image, handles its own breakout */}
      <Attraction
        backgroundImgUrl="/img/IMG_8307.JPG"
        slogan={"ALL\nBOX\nMEMBER"}
        body={`EAGLESに関わるすべての人が同じゴールを目指すための合言葉。

              グラウンドで戦うプレーヤー、戦術を支えるスタッフ、声援を送り続けるサポーター、
              そして伝統を築き上げてきたOBの方々――。

              誰一人欠けることなく、全員が「チームの一員」としてつながっている。

              私たちは、その結束を力に変え、互いを信じ、互いを高め合いながら挑戦を続ける。

              勝利の喜びも、敗北の悔しさも、すべてを共有するからこそ、一瞬一瞬が大きな意味を持つ。

              EAGLESは「ALL BOX MEMBER」の理念のもと、
              関わるすべての人と喜びを分かち合い、共に未来を切り拓く。`}
      />

      {/* BlogSection — white */}
      <div className={`${fullWidth} bg-white py-16`}>
        <div className={innerCls}>
          <Suspense fallback={<SectionSkeleton />}>
            <BlogSection />
          </Suspense>
        </div>
      </div>

      {/* RosterSection — slate-900 (dark) */}
      <div className={`${fullWidth} bg-slate-900 py-16`}>
        <div className={innerCls}>
          <Suspense fallback={<SectionSkeleton />}>
            <RosterSection dark />
          </Suspense>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
