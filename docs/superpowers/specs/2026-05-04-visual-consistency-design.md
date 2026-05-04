# Visual Consistency Design — Eagles MVP

**Date:** 2026-05-04  
**Status:** Approved

## Overview

Improve visual consistency across the homepage by introducing alternating dark/light section backgrounds (White ↔ slate-900), giving the site a sporty, bold Pro-sports feel while keeping the existing card components intact.

## Design Decisions

- **Style direction:** Sporty/Bold (B) — strong contrast, pro sports aesthetic
- **Background pattern:** White ↔ slate-900 (B) — clean alternation
- **Card components:** No changes — GameCard, BlogCard, PlayerCard, NewsCard each retain their individual design language

## Section Background Map

| Section | Background | Notes |
|---|---|---|
| Hero | `#0f6536` | unchanged |
| NewsTicker | `bg-slate-900` | unchanged |
| UpcomingSection | `bg-white` | full-width white |
| StandingsSection | `bg-slate-100` | subtle gray — StandingsBoard has its own dark header internally |
| NewsSection | `bg-slate-900` | dark — requires NewsCard dark variant |
| Attraction | full-width image | unchanged |
| BlogSection | `bg-white` | full-width white |
| RosterSection | `bg-slate-900` | dark — PlayerCard already works on dark |

## Architecture

### Full-Width Section Wrapper

Each section in `page.tsx` gets a full-width breakout wrapper using the same technique as the Hero:

```tsx
<div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900 py-16">
  <div className="max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem] mx-auto px-6">
    <Suspense fallback={<SectionSkeleton />}>
      <NewsSection dark />
    </Suspense>
  </div>
</div>
```

The outer `space-y-16` wrapper in `page.tsx` is removed. Vertical spacing is managed via `py-16` on each section wrapper.

### Dark Prop Pattern

Sections that render on slate-900 accept `dark?: boolean`. They use it to:
1. Switch heading color: `text-slate-900` → `text-white`
2. Switch empty-state text: `text-slate-500` → `text-slate-400`
3. Pass `dark` to child card components as needed

Only `NewsSection` and `RosterSection` need this prop. `BlogSection` and `UpcomingSection` stay on white. `StandingsSection` is slate-100 but StandingsBoard handles its own dark header internally — no prop needed.

## Files Changed

### `src/app/page.tsx`
- Remove `<div className="space-y-16">` outer wrapper
- Keep `<div className="space-y-0">` for Hero + NewsTicker pair
- Wrap each section in a full-width div with appropriate bg color and `py-16`
- Inner content div uses same max-width classes as `<main>` in layout.tsx
- Pass `dark` prop to `NewsSection` and `RosterSection`

### `src/components/sections/NewsSection.tsx`
- Add `dark?: boolean` prop
- Heading: conditionally `text-white` or `text-slate-900`
- Empty state: conditionally `text-slate-400` or `text-slate-500`
- Pass `dark` prop to each `<NewsCard>`

### `src/components/NewsCard.tsx`
- Add `dark?: boolean` prop
- Light (default): unchanged — `hover:bg-slate-100`, `text-slate-900`, `border-slate-300`
- Dark variant: `hover:bg-slate-800`, `text-white`, `border-white/15`, date `text-slate-400`, category badge border `border-white/40 text-white/80`

### `src/components/sections/RosterSection.tsx`
- Add `dark?: boolean` prop
- Heading: conditionally `text-white` or `text-slate-900`
- Empty state: conditionally `text-slate-400` or `text-slate-700`
- No changes to `PlayerCard` (green gradient overlay already works on dark)

## Out of Scope

- Card border-radius unification (each card has a distinct design intent)
- Dark mode toggle or system preference detection
- Changes to inner pages (news detail, blog detail, roster detail, etc.)
- StandingsBoard dark theming (already has internal dark header)
- Footer/Header changes

## Testing Criteria

- Homepage renders without errors
- All 5 section backgrounds correct: white / slate-100 / dark / white / dark
- NewsCard readable on slate-900 background
- RosterSection heading is white on slate-900
- PlayerCard green gradient footer visible on slate-900
- Attraction section (full-width image) visually separates the two white sections
- No regression on existing card hover effects
