# Visual Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce alternating dark/light full-width section backgrounds on the homepage to give the site a sporty, bold Pro-sports feel while preserving all existing components and data flows.

**Architecture:** Each homepage section is wrapped in a full-width breakout div using the existing Hero technique (`w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]`). Sections that render on slate-900 receive a `dark` boolean prop that toggles heading and text colors. Card components are unchanged except for `NewsCard`, which gains a `dark` variant.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v3 (JIT), TypeScript, pnpm

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/page.tsx` | Modify | Remove `space-y-16`, add per-section full-width wrappers |
| `src/components/sections/NewsSection.tsx` | Modify | Accept `dark` prop, pass to heading + NewsCard |
| `src/components/NewsCard.tsx` | Modify | Accept `dark` prop, apply dark variant styles |
| `src/components/sections/RosterSection.tsx` | Modify | Accept `dark` prop, apply to heading |

---

### Task 1: Restructure page.tsx with full-width section wrappers

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the outer `space-y-16` wrapper and section layout**

Open `src/app/page.tsx`. Replace the entire JSX return body with the following. The Hero + NewsTicker `space-y-0` div is preserved unchanged. Each section gets its own full-width wrapper with the background color from the spec.

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors. (A type error will appear for `dark` props since those components don't accept them yet — that's expected and will be fixed in Tasks 2 and 3.)

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: restructure homepage with full-width section wrappers"
```

---

### Task 2: Add dark variant to NewsSection and NewsCard

**Files:**
- Modify: `src/components/sections/NewsSection.tsx`
- Modify: `src/components/NewsCard.tsx`

- [ ] **Step 1: Update NewsSection.tsx to accept and forward the `dark` prop**

Replace the entire contents of `src/components/sections/NewsSection.tsx`:

```tsx
import { fetchNewsList } from "@/lib/microcms";
import NewsCard from "@/components/NewsCard";
import Link from "next/link";

export default async function NewsSection({ dark = false }: { dark?: boolean }) {
  const news = await fetchNewsList();
  return (
    <section>
      <h2 className={`section-title text-3xl md:text-4xl font-bold mb-6 ${dark ? "text-white" : ""}`}>News</h2>
      {news.length > 0 ? (
        <div className="space-y-4">
          {news.slice(0, 5).map((n) => (
            <NewsCard key={n.id} item={n} dark={dark} />
          ))}
        </div>
      ) : (
        <p className={dark ? "text-slate-400" : "text-slate-500"}>ニュース記事はまだありません。</p>
      )}
      <div className="mt-4 mb-8">
        <Link href="/news" className="button-32 mt-4">すべてのニュースを見る</Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update NewsCard.tsx to accept and apply the `dark` prop**

Replace the entire contents of `src/components/NewsCard.tsx`:

```tsx
// src/components/NewsCard.tsx
import Link from "next/link";
import type { News } from "@/lib/microcms";

type Props = {
  item: News;
  className?: string;
  dark?: boolean;
};

export default function NewsCard({ item, className = "", dark = false }: Props) {
  return (
    <li className={`list-none ${className}`}>
      <Link
        href={`/news/${item.id}`}
        className={`flex flex-col md:flex-row items-start md:items-center border-b py-4 transition-colors ${
          dark
            ? "border-white/15 hover:bg-slate-800"
            : "border-slate-300 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* 日付 */}
          <time className={`w-28 shrink-0 font-bold text-sm md:text-base ${dark ? "text-slate-300" : "text-slate-900"}`}>
            {new Date(item.publishedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </time>

          {/* カテゴリ */}
          {item.category && (
            <span className={`inline-block border text-xs px-2 py-0.5 ${dark ? "border-white/40 text-white/80" : "border-slate-900 text-slate-900"}`}>
              {item.category}
            </span>
          )}

          {/* NEWラベル */}
          {new Date(item.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <span className="text-xs font-bold text-white bg-[#0f6536] px-2 py-0.5">
              NEW
            </span>
          )}
        </div>

        {/* タイトル */}
        <span className={`md:ml-4 mt-2 md:mt-0 text-base md:text-lg hover:underline flex-1 block h-full py-2 ${dark ? "text-white" : "text-slate-900"}`}>
          {item.title}
        </span>
      </Link>
    </li>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds. The `dark` prop type error for `RosterSection` may still appear — that's resolved in Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/NewsSection.tsx src/components/NewsCard.tsx
git commit -m "feat: add dark variant to NewsSection and NewsCard"
```

---

### Task 3: Add dark variant to RosterSection

**Files:**
- Modify: `src/components/sections/RosterSection.tsx`

- [ ] **Step 1: Update RosterSection.tsx to accept the `dark` prop**

Replace the entire contents of `src/components/sections/RosterSection.tsx`:

```tsx
import { fetchPlayers } from "@/lib/microcms";
import PlayerCard from "@/components/PlayerCard";
import Link from "next/link";

export default async function RosterSection({ dark = false }: { dark?: boolean }) {
  const players = await fetchPlayers();
  return (
    <section>
      <h2 className={`section-title text-3xl md:text-4xl font-bold mb-6 ${dark ? "text-white" : ""}`}>Roster</h2>
      {players && players.length > 0 ? (
        <div className="grid grid-flow-col auto-cols-[minmax(50%,_1fr)] md:auto-cols-[minmax(33.333%,_1fr)] lg:auto-cols-[minmax(25%,_1fr)] gap-4 overflow-x-auto">
          {players.slice(0, 6).map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      ) : (
        <p className={dark ? "text-slate-400" : "text-slate-700"}>選手データはまだありません。</p>
      )}
      <div className="mt-6">
        <Link href="/roster" className="button-32">選手一覧を見る</Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify clean build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors and no warnings.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/RosterSection.tsx
git commit -m "feat: add dark variant to RosterSection"
```

---

## Manual Verification Checklist

After all tasks are committed, start the dev server and check:

```bash
pnpm dev
```

Open `http://localhost:3000` and verify:

- [ ] UpcomingSection renders on white background (`bg-white`)
- [ ] StandingsSection renders on light gray background (`bg-slate-100`); the STANDINGS board header is still dark navy
- [ ] NewsSection renders on slate-900; all news list items are readable (white text, slate-300 dates, white/80 category badges)
- [ ] Attraction full-width image section appears between News and Blog with no extra margin/gap
- [ ] BlogSection renders on white background; blog cards with images are readable
- [ ] RosterSection renders on slate-900; "Roster" heading is white; player cards show green gradient footer
- [ ] `button-32` ("すべての〇〇を見る") appears correctly on both white and dark sections (white bg with green border on dark; fills green on hover)
- [ ] No horizontal scroll introduced by full-width wrappers
