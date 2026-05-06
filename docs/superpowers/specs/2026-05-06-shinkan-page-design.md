# 新歓特設ページ Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dedicated recruitment page at `/shinkan` targeting university freshmen considering joining the lacrosse team.

**Architecture:** Static Next.js App Router page (server component) with ISR. Fixed content (stats, steps, FAQ) is hardcoded. New-member news is fetched from the existing `news` microCMS API filtered by `category=新歓`. A few players are fetched from the existing `players` API for the testimonials section. No new microCMS API needed.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Framer Motion (FadeIn component already exists), microCMS (existing `news` + `players` endpoints).

---

## URL & Navigation

- Route: `/shinkan` → `src/app/shinkan/page.tsx`
- Header nav: add 「新歓」link in both desktop nav and mobile nav in `Header.tsx`
- ISR: `revalidate = 300`

---

## Sections (top to bottom)

### 1. Hero
- Full-width dark overlay on team photo (`/img/IMG_8307.JPG` or a dedicated hero image)
- Headline: **「一緒にグラウンドに立とう」**（変更可）
- Subtext: 青山学院大学男子ラクロス部 EAGLES 新入部員募集
- Two CTA buttons side by side:
  - Instagram → `https://www.instagram.com/eagles_agulax` (target\_blank)
  - お問い合わせ → `/contact`
- Full-width breakout technique (consistent with rest of site)

### 2. 新歓情報（News cards）
- Heading: 「新歓情報」
- Fetch `news` with `filters: category[equals]新歓`, `orders: -publishedAt`, `limit: 6`
- Render as `NewsCard` components (existing component, `dark={false}`)
- If zero results: show placeholder text 「新歓情報は随時更新されます。Instagram をチェックしてください。」
- Link to `/news` at bottom: 「ニュース一覧を見る」

### 3. EAGLESの数字
- White background, centered layout
- 4 stat cards in a responsive grid (2×2 on mobile, 4×1 on desktop):
  1. **約100名** — 部員数
  2. **約90%** — 初心者からのスタート
  3. **週5日** — 活動日数
  4. **創部35年以上** — 歴史
- Each card: large number in brand green `#0f6536`, label below in slate-600
- Numbers are hardcoded (update in code when they change)

### 4. 入部の流れ
- Slate-100 background
- Heading: 「入部の流れ」
- 4-step horizontal flow (vertical on mobile):
  1. 体験参加 — まずは気軽にグラウンドへ
  2. 見学・練習参加 — 雰囲気を掴む
  3. 入部届提出 — 簡単な手続きのみ
  4. 活動スタート — 一緒に日本一を目指す
- Steps connected by arrow `→` (hidden on mobile, shown on desktop)
- Step number in brand green circle

### 5. 先輩の声
- Dark background (`bg-slate-900`), white text
- Heading: 「先輩の声」
- Fetch `players` (existing `fetchPlayers()`), filter to those with `comment` field, pick first 3
- Each card: player photo (rounded), name, comment text
- If fewer than 3 have comments: show however many exist (minimum 1)

### 6. よくある質問
- White background
- Heading: 「よくある質問」
- 5 hardcoded Q&As focused on freshmen concerns:
  1. ラクロス未経験でも大丈夫ですか？
  2. 活動日はいつですか？
  3. 費用はどれくらいかかりますか？
  4. アルバイトや勉強と両立できますか？
  5. いつから入部できますか？
- `<details>`/`<summary>` accordion (same markup/CSS as `/about` FAQ)

### 7. Contact CTA
- Brand green background (`bg-[#0f6536]`)
- Headline: 「まずは気軽に連絡してください」
- Two buttons: Instagram DM / お問い合わせフォーム
- Full-width breakout

---

## FadeIn animations
Each section wrapped in `<FadeIn>` (existing component at `src/components/motion/FadeIn.tsx`) for scroll-triggered entrance. Same pattern as homepage sections.

---

## OGP Metadata
```ts
export const metadata: Metadata = {
  title: "新歓 | EAGLES Lacrosse",
  description: "青山学院大学男子ラクロス部 EAGLES の新入部員募集ページ。初心者大歓迎です。",
  openGraph: { ... }
}
```

---

## Files

| Action | Path |
|---|---|
| Create | `src/app/shinkan/page.tsx` |
| Modify | `src/components/Header.tsx` — add 新歓 nav link |
