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

export const revalidate = 300; // ISR: 5分ごとに再生成

export default async function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": "EAGLES Lacrosse",
    "sport": "Lacrosse",
    "url": process.env.NEXT_PUBLIC_SITE_URL ?? "https://eagles-lacrosse.vercel.app",
    "memberOf": {
      "@type": "SportsOrganization",
      "name": "関東学生ラクロス連盟"
    }
  };

  return (
    <div className="space-y-16">
      <div className="space-y-0">
        {/* Hero */}
        <div className="relative w-screen h-[calc(100vh-85px)] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <Image
            src="/img/28FDFC22-09FD-44DE-9E74-E939FA035794.PNG"
            alt="About EAGLES"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* NewsTicker */}
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900/90 text-white">
          <Suspense fallback={<div className="h-10 bg-slate-900/90" />}>
            <NewsTickerSection />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <UpcomingSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <StandingsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <NewsSection />
      </Suspense>

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

      <Suspense fallback={<SectionSkeleton />}>
        <BlogSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <RosterSection />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
