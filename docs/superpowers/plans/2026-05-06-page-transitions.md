# Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fade + slide-up page transition animations between all pages using Framer Motion's AnimatePresence.

**Architecture:** A `PageTransition` client component wraps `{children}` inside `layout.tsx`'s `<main>`. It uses `usePathname()` as the AnimatePresence key so every route change triggers enter/exit animations. Enter: fade in from y=12. Exit: fade out to y=-8. Duration 0.3s.

**Tech Stack:** Next.js 14 App Router, Framer Motion v12 (already installed), `usePathname` from `next/navigation`.

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/components/motion/PageTransition.tsx` | AnimatePresence wrapper, keyed on pathname |
| Modify | `src/app/layout.tsx` | Wrap `{children}` with `<PageTransition>` |

---

### Task 1: Create PageTransition component

**Files:**
- Create: `src/components/motion/PageTransition.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/motion/PageTransition.tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### Task 2: Integrate into layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

Current `layout.tsx` (lines 47–60):
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={abashiri.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main className="pt-0 px-6 pb-6 mx-auto w-full max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem]">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 1: Add import for PageTransition**

Add this import after the existing imports in `src/app/layout.tsx`:
```tsx
import PageTransition from "@/components/motion/PageTransition";
```

- [ ] **Step 2: Wrap children**

Replace `{children}` with `<PageTransition>{children}</PageTransition>`:
```tsx
<main className="pt-0 px-6 pb-6 mx-auto w-full max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem]">
  <PageTransition>
    {children}
  </PageTransition>
</main>
```

- [ ] **Step 3: Verify build passes**

```bash
pnpm build
```

Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/components/motion/PageTransition.tsx" src/app/layout.tsx
git commit -m "feat: ページ遷移アニメーション追加（fade + slide-up）"
```
