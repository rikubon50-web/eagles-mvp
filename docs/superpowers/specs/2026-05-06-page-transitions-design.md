# Page Transitions Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add smooth fade + slide-up transition animations between all pages using Framer Motion's AnimatePresence.

**Architecture:** A client-side `PageTransition` wrapper component sits inside `layout.tsx` and uses `AnimatePresence` keyed on the current pathname. Every page fades in from slightly below and fades out upward. Duration is 0.3s — fast enough not to block navigation, noticeable enough to feel polished.

**Tech Stack:** Next.js 14 App Router, Framer Motion (already installed v12), `usePathname` from `next/navigation`.

---

## Design

### Transition style
- **Enter:** `opacity: 0, y: 12` → `opacity: 1, y: 0` over 0.3s, ease `[0.25, 0.46, 0.45, 0.94]`
- **Exit:** `opacity: 1, y: 0` → `opacity: 0, y: -8` over 0.2s, ease `easeIn`
- Exit is slightly faster and moves up (not down) to feel directional

### Component structure
```
layout.tsx (server component)
└── <main>
    └── <PageTransition> (client component — "use client")
        └── <AnimatePresence mode="wait">
            └── <motion.div key={pathname}>
                └── {children}
```

### File
- **Create:** `src/components/motion/PageTransition.tsx`
- **Modify:** `src/app/layout.tsx` — wrap `{children}` with `<PageTransition>`

### layout.tsx integration
`layout.tsx` is a server component. `PageTransition` is a client component that receives `children` as a prop — this is the standard Next.js App Router pattern for mixing server and client components.

### Constraints
- `mode="wait"` on AnimatePresence ensures the exit animation completes before the enter animation starts — avoids two pages being visible simultaneously
- Do not animate the `<Header>` or `<Footer>` — only the page content transitions
- Hero images use `priority` — they load fast enough that the transition won't mask slow image loads
