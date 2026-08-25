# 星取表 内製編集画面（フェーズ1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 星取表の編集を Google スプレッドシートから、サイト内蔵の認証付き編集画面（保存先 Supabase）に置き換える。

**Architecture:** Supabase（Auth + Postgres, RLS）を新設し、Next.js 14 App Router に `/admin` エリア（招待コード式サインアップ、ログイン、星取表エディタ）を追加。公開側は既存 `StandingsBoard` を変えず、データ取得だけ CSV → Supabase に差し替え、保存時に `revalidatePath` で即時反映する。

**Tech Stack:** Next.js 14.2.5 (App Router / Server Actions), @supabase/supabase-js, @supabase/ssr, zod, vitest, pnpm

**Spec:** docs/superpowers/specs/2026-08-25-standings-admin-design.md

## Global Constraints

- パッケージマネージャは pnpm（`pnpm add` / `pnpm test`）
- Next.js 14.2.5 / React 18.3 / TypeScript strict。既存コードのパス別名は `@/` = `src/`
- 公開側の見た目（`StandingsBoard`）は変更しない。`StandingsBoard` が受け取る rows は文字列値の `Record<string, string>`（キー: block, rank, university, points, games, gf, diff）
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`（初期投入スクリプト専用）, `ADMIN_INVITE_CODE`
- コミットメッセージは既存流儀（`feat:` / `fix:` / `chore:` + 日本語要約）に合わせる
- main への push は Vercel 本番デプロイと同義。**タスク内では commit のみ行い、push はユーザー確認後**

---

### Task 1: 依存追加と vitest セットアップ

**Files:**
- Modify: `package.json`（scripts に `"test": "vitest run"` 追加）
- Create: `vitest.config.ts`
- Test: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `pnpm test` が動く状態。以後のタスクは vitest でテストを書く

- [ ] **Step 1: 依存をインストール**

```bash
cd /Users/rikubon50/Desktop/eagles-mvp
pnpm add @supabase/supabase-js @supabase/ssr zod
pnpm add -D vitest
```

- [ ] **Step 2: vitest 設定を作成**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

`package.json` の scripts に追加:

```json
"test": "vitest run"
```

- [ ] **Step 3: スモークテストを書く**

```ts
// src/lib/__tests__/smoke.test.ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/__tests__/smoke.test.ts
git commit -m "chore: Supabase/zod依存とvitestを追加"
```

### Task 2: Supabase スキーマ定義とプロジェクト準備（ユーザー作業を含む）

**Files:**
- Create: `supabase/schema.sql`
- Modify: `.env.local`（ユーザーが値を貼る）

**Interfaces:**
- Produces: Supabase プロジェクトにテーブル `standings_rows` / `standings_meta` / `profiles` と RLS が存在し、`.env.local` に 4 つの環境変数が入った状態

**注意: このタスクは Supabase アカウント作成などユーザー本人の操作が必要。エージェントは schema.sql の作成とコミットまでを行い、残りはユーザーに手順を案内して完了を待つこと。**

- [ ] **Step 1: スキーマ SQL をリポジトリに作成**

```sql
-- supabase/schema.sql
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行する

create table public.standings_rows (
  id uuid primary key default gen_random_uuid(),
  block text not null check (block in ('A','B')),
  rank int not null,
  university text not null,
  points int not null default 0,
  games int not null default 0,
  gf int not null default 0,
  diff int not null default 0,
  sort_order int not null
);

create table public.standings_meta (
  id int primary key check (id = 1),
  updated_at timestamptz not null default now()
);
insert into public.standings_meta (id) values (1);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('member','admin'))
);

alter table public.standings_rows enable row level security;
alter table public.standings_meta enable row level security;
alter table public.profiles enable row level security;

-- 星取表: 誰でも読める / admin だけ書ける
create policy "standings_read_all" on public.standings_rows
  for select using (true);
create policy "standings_admin_write" on public.standings_rows
  for all using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  );

create policy "meta_read_all" on public.standings_meta
  for select using (true);
create policy "meta_admin_update" on public.standings_meta
  for update using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid() and p.role = 'admin')
  );

-- プロフィール: 本人のみ読み書き。insert 時 role は member 固定
-- （admin 昇格は Supabase ダッシュボードから手動。全件読取はフェーズ2で検討）
create policy "profiles_own_select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_own_insert" on public.profiles
  for insert with check (auth.uid() = user_id and role = 'member');
create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and role = (select role from public.profiles where user_id = auth.uid()));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(standings): Supabaseスキーマ定義を追加"
```

- [ ] **Step 3: ユーザーにセットアップ手順を案内し、完了を待つ**

案内する内容（このまま提示する）:

1. https://supabase.com で無料アカウントを作成（GitHub ログイン可）
2. 「New project」でプロジェクト作成（リージョンは Tokyo / ap-northeast-1 推奨。DBパスワードは保管）
3. SQL Editor を開き、`supabase/schema.sql` の中身を貼り付けて Run
4. Authentication > Sign In / Up > Email で **「Confirm email」をオフ**にする（部内ツールのためメール確認なしで即ログイン可にする）
5. Project Settings > API から以下を `.env.local` に追記して内容を教えてください（キー値はチャットに貼らず、`.env.local` に直接記入でOK）:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（anon public キー）
SUPABASE_SERVICE_ROLE_KEY=（service_role キー・秘匿）
ADMIN_INVITE_CODE=（部内で共有する合言葉を決めて記入）
```

- [ ] **Step 4: 環境変数が入ったことを確認**

Run: `grep -c "SUPABASE_URL\|SUPABASE_ANON\|SERVICE_ROLE\|INVITE_CODE" .env.local`
Expected: 4

### Task 3: 星取表ドメインロジック（型・検証・整形）

**Files:**
- Create: `src/lib/standings.ts`
- Test: `src/lib/__tests__/standings.test.ts`

**Interfaces:**
- Produces:
  - `type StandingsRowInput = { block: "A" | "B"; rank: number; university: string; points: number; games: number; gf: number; diff: number; sort_order: number }`
  - `standingsRowsSchema: ZodType<StandingsRowInput[]>` — 保存前検証に使う
  - `toBoardRows(rows: StandingsRowInput[]): Record<string, string>[]` — sort_order 昇順に並べ、全値を文字列化（`StandingsBoard` 互換）
  - `formatJstDate(iso: string): string` — "2026/8/25" 形式（JST）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/__tests__/standings.test.ts
import { describe, it, expect } from "vitest";
import {
  standingsRowsSchema,
  toBoardRows,
  formatJstDate,
  type StandingsRowInput,
} from "@/lib/standings";

const row = (over: Partial<StandingsRowInput> = {}): StandingsRowInput => ({
  block: "A",
  rank: 1,
  university: "青山学院大",
  points: 3,
  games: 2,
  gf: 10,
  diff: 4,
  sort_order: 0,
  ...over,
});

describe("standingsRowsSchema", () => {
  it("正しい行を受理する", () => {
    expect(standingsRowsSchema.safeParse([row()]).success).toBe(true);
  });
  it("大学名が空だと拒否する", () => {
    expect(standingsRowsSchema.safeParse([row({ university: " " })]).success).toBe(false);
  });
  it("数値が整数でないと拒否する", () => {
    expect(standingsRowsSchema.safeParse([row({ points: 1.5 })]).success).toBe(false);
  });
  it("block が A/B 以外だと拒否する", () => {
    expect(standingsRowsSchema.safeParse([{ ...row(), block: "C" }]).success).toBe(false);
  });
});

describe("toBoardRows", () => {
  it("sort_order 昇順に並べ、値を文字列化する", () => {
    const out = toBoardRows([
      row({ university: "二番目", sort_order: 1 }),
      row({ university: "一番目", sort_order: 0, diff: -2 }),
    ]);
    expect(out[0].university).toBe("一番目");
    expect(out[0].diff).toBe("-2");
    expect(out[1].university).toBe("二番目");
    expect(out[0].block).toBe("A");
  });
});

describe("formatJstDate", () => {
  it("UTC の ISO 文字列を JST の日付にする", () => {
    // UTC 2026-08-24 20:00 = JST 2026-08-25 05:00
    expect(formatJstDate("2026-08-24T20:00:00Z")).toBe("2026/8/25");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test`
Expected: FAIL（`@/lib/standings` が存在しない）

- [ ] **Step 3: 実装する**

```ts
// src/lib/standings.ts
import { z } from "zod";

export const standingsRowSchema = z.object({
  block: z.enum(["A", "B"]),
  rank: z.number().int(),
  university: z.string().trim().min(1, "大学名を入力してください"),
  points: z.number().int(),
  games: z.number().int(),
  gf: z.number().int(),
  diff: z.number().int(),
  sort_order: z.number().int(),
});

export const standingsRowsSchema = z.array(standingsRowSchema);

export type StandingsRowInput = z.infer<typeof standingsRowSchema>;

// StandingsBoard は文字列値の Record を期待する（既存CSV互換）
export function toBoardRows(rows: StandingsRowInput[]): Record<string, string>[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      block: r.block,
      rank: String(r.rank),
      university: r.university,
      points: String(r.points),
      games: String(r.games),
      gf: String(r.gf),
      diff: String(r.diff),
    }));
}

export function formatJstDate(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test`
Expected: PASS（全件）

- [ ] **Step 5: Commit**

```bash
git add src/lib/standings.ts src/lib/__tests__/standings.test.ts
git commit -m "feat(standings): 行スキーマ・表示変換・JST日付整形を追加"
```

### Task 4: エディタ用の純関数（行操作）

**Files:**
- Create: `src/lib/standings-editor.ts`
- Test: `src/lib/__tests__/standings-editor.test.ts`

**Interfaces:**
- Consumes: `StandingsRowInput`（Task 3）
- Produces:
  - `type EditorRow = StandingsRowInput & { key: string }`（key は React 用の一時ID）
  - `addRow(rows: EditorRow[], block: "A" | "B", key: string): EditorRow[]` — ブロック末尾に空行追加（rank は末尾+1）
  - `removeRow(rows: EditorRow[], key: string): EditorRow[]`
  - `moveRow(rows: EditorRow[], key: string, dir: -1 | 1): EditorRow[]` — 同一ブロック内で上下入替（端では何もしない）
  - `normalizeSortOrder(rows: EditorRow[]): EditorRow[]` — ブロックごとに 0..n で振り直し
  - いずれも元配列を破壊しない

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/__tests__/standings-editor.test.ts
import { describe, it, expect } from "vitest";
import {
  addRow, removeRow, moveRow, normalizeSortOrder, type EditorRow,
} from "@/lib/standings-editor";

const r = (key: string, block: "A" | "B", sort: number): EditorRow => ({
  key, block, rank: sort + 1, university: `大学${key}`,
  points: 0, games: 0, gf: 0, diff: 0, sort_order: sort,
});

describe("addRow", () => {
  it("指定ブロックの末尾に追加し rank は末尾+1", () => {
    const out = addRow([r("a1", "A", 0)], "A", "new");
    expect(out).toHaveLength(2);
    const added = out.find((x) => x.key === "new")!;
    expect(added.block).toBe("A");
    expect(added.rank).toBe(2);
    expect(added.university).toBe("");
  });
});

describe("removeRow", () => {
  it("key の行を除く", () => {
    const out = removeRow([r("a1", "A", 0), r("a2", "A", 1)], "a1");
    expect(out.map((x) => x.key)).toEqual(["a2"]);
  });
});

describe("moveRow", () => {
  it("同一ブロック内で上に移動する", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1), r("b1", "B", 0)];
    const out = moveRow(rows, "a2", -1);
    const a = out.filter((x) => x.block === "A").sort((x, y) => x.sort_order - y.sort_order);
    expect(a.map((x) => x.key)).toEqual(["a2", "a1"]);
    // 他ブロックは不変
    expect(out.find((x) => x.key === "b1")!.sort_order).toBe(0);
  });
  it("先頭をさらに上へは動かさない", () => {
    const rows = [r("a1", "A", 0), r("a2", "A", 1)];
    expect(moveRow(rows, "a1", -1)).toEqual(rows);
  });
});

describe("normalizeSortOrder", () => {
  it("ブロックごとに 0..n を振り直す", () => {
    const rows = [r("a1", "A", 5), r("a2", "A", 9), r("b1", "B", 3)];
    const out = normalizeSortOrder(rows);
    expect(out.find((x) => x.key === "a1")!.sort_order).toBe(0);
    expect(out.find((x) => x.key === "a2")!.sort_order).toBe(1);
    expect(out.find((x) => x.key === "b1")!.sort_order).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test`
Expected: FAIL（`@/lib/standings-editor` が存在しない）

- [ ] **Step 3: 実装する**

```ts
// src/lib/standings-editor.ts
import type { StandingsRowInput } from "@/lib/standings";

export type EditorRow = StandingsRowInput & { key: string };

function blockRows(rows: EditorRow[], block: "A" | "B"): EditorRow[] {
  return rows
    .filter((r) => r.block === block)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function addRow(rows: EditorRow[], block: "A" | "B", key: string): EditorRow[] {
  const siblings = blockRows(rows, block);
  const next: EditorRow = {
    key,
    block,
    rank: siblings.length + 1,
    university: "",
    points: 0,
    games: 0,
    gf: 0,
    diff: 0,
    sort_order: siblings.length,
  };
  return [...rows, next];
}

export function removeRow(rows: EditorRow[], key: string): EditorRow[] {
  return normalizeSortOrder(rows.filter((r) => r.key !== key));
}

export function moveRow(rows: EditorRow[], key: string, dir: -1 | 1): EditorRow[] {
  const target = rows.find((r) => r.key === key);
  if (!target) return rows;
  const siblings = blockRows(rows, target.block);
  const idx = siblings.findIndex((r) => r.key === key);
  const swapWith = siblings[idx + dir];
  if (!swapWith) return rows;
  return rows.map((r) => {
    if (r.key === target.key) return { ...r, sort_order: swapWith.sort_order };
    if (r.key === swapWith.key) return { ...r, sort_order: target.sort_order };
    return r;
  });
}

export function normalizeSortOrder(rows: EditorRow[]): EditorRow[] {
  const renumbered = new Map<string, number>();
  (["A", "B"] as const).forEach((block) => {
    blockRows(rows, block).forEach((r, i) => renumbered.set(r.key, i));
  });
  return rows.map((r) => ({ ...r, sort_order: renumbered.get(r.key)! }));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test`
Expected: PASS（全件）

- [ ] **Step 5: Commit**

```bash
git add src/lib/standings-editor.ts src/lib/__tests__/standings-editor.test.ts
git commit -m "feat(standings): エディタ用の行操作純関数を追加"
```

### Task 5: Supabase クライアントとデータアクセス層

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/public.ts`
- Modify: `src/lib/standings.ts`（fetch 関数を追記）

**Interfaces:**
- Consumes: 環境変数（Task 2）、`toBoardRows` / `formatJstDate`（Task 3）
- Produces:
  - `createSupabaseServer(): SupabaseClient` — cookie セッション付き（Server Component / Server Action 用）
  - `createSupabasePublic(): SupabaseClient` — anon キーのみ（公開読取用）
  - `fetchStandings(): Promise<{ rows: Record<string, string>[]; updatedAt?: string }>` — 既存 `fetchStandingsFromCsv` と同じ返り値形状。失敗時は空配列＋console.error（throw しない）

**注意: DB アクセスを含むためユニットテスト対象外。動作確認は Task 6/8 のブラウザ確認で行う。**

- [ ] **Step 1: サーバークライアントを実装**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合 set は不可（middleware が更新を担う）
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: 公開読取クライアントを実装**

```ts
// src/lib/supabase/public.ts
import { createClient } from "@supabase/supabase-js";

// 認証不要の公開読取用（cookie に依存しないので ISR/ビルドでも安全）
export function createSupabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 3: fetchStandings を standings.ts に追記**

```ts
// src/lib/standings.ts に追記
import { createSupabasePublic } from "@/lib/supabase/public";

export type StandingsData = {
  rows: Record<string, string>[];
  updatedAt?: string;
};

export async function fetchStandings(): Promise<StandingsData> {
  try {
    const supabase = createSupabasePublic();
    const [rowsRes, metaRes] = await Promise.all([
      supabase.from("standings_rows").select("*"),
      supabase.from("standings_meta").select("updated_at").eq("id", 1).single(),
    ]);
    if (rowsRes.error) throw rowsRes.error;
    const rows = toBoardRows(rowsRes.data ?? []);
    const updatedAt = metaRes.data?.updated_at
      ? formatJstDate(metaRes.data.updated_at)
      : undefined;
    return { rows, updatedAt };
  } catch (e) {
    console.error("fetchStandings failed:", e);
    return { rows: [], updatedAt: undefined };
  }
}
```

- [ ] **Step 4: 型チェックとテストが通ることを確認**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: エラーなし / 全テスト PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/public.ts src/lib/standings.ts
git commit -m "feat(standings): Supabaseクライアントと公開取得関数を追加"
```

### Task 6: 初期データ投入スクリプトと実行

**Files:**
- Create: `scripts/import-standings.mjs`

**Interfaces:**
- Consumes: `.env.local` の `STANDINGS_CSV`（現行）と `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL`
- Produces: `standings_rows` に現行スプレッドシートと同内容が入った状態

- [ ] **Step 1: 投入スクリプトを作成**

```js
// scripts/import-standings.mjs
// 現行スプレッドシートCSVを Supabase standings_rows に投入する（1回限りの移行用）
// 実行: node scripts/import-standings.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const csvUrl = env.STANDINGS_CSV;
if (!url || !key || !csvUrl) {
  console.error("必要な環境変数が .env.local にありません");
  process.exit(1);
}

const res = await fetch(csvUrl);
if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
const text = await res.text();
const lines = text.trim().split(/\r?\n/);
const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
const rows = lines.slice(1).map((line) => {
  const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
  return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
});

const perBlockCount = { A: 0, B: 0 };
const records = rows
  .filter((r) => ["A", "B"].includes((r.block ?? "").toUpperCase()))
  .map((r) => {
    const block = r.block.toUpperCase();
    return {
      block,
      rank: parseInt(r.rank, 10) || 0,
      university: r.university,
      points: parseInt(r.points, 10) || 0,
      games: parseInt(r.games, 10) || 0,
      gf: parseInt(r.gf, 10) || 0,
      diff: parseInt(r.diff, 10) || 0,
      sort_order: perBlockCount[block]++,
    };
  });

const supabase = createClient(url, key, { auth: { persistSession: false } });
const del = await supabase.from("standings_rows").delete().neq("block", "");
if (del.error) throw del.error;
const ins = await supabase.from("standings_rows").insert(records);
if (ins.error) throw ins.error;
console.log(`投入完了: ${records.length}行 (A:${records.filter((r) => r.block === "A").length} / B:${records.filter((r) => r.block === "B").length})`);
```

- [ ] **Step 2: スクリプトを実行**

Run: `node scripts/import-standings.mjs`
Expected: `投入完了: N行 (A:x / B:y)` — 現行サイトの表示行数と一致すること

- [ ] **Step 3: Commit**

```bash
git add scripts/import-standings.mjs
git commit -m "feat(standings): スプレッドシートからの初期データ投入スクリプト"
```

### Task 7: 公開側の取得を Supabase に切替

**Files:**
- Modify: `src/components/sections/StandingsSection.tsx`
- Modify: `src/app/standings/page.tsx:1-19`（import と取得部のみ。JSX は不変）

**Interfaces:**
- Consumes: `fetchStandings`（Task 5）

- [ ] **Step 1: StandingsSection を切替**

```tsx
// src/components/sections/StandingsSection.tsx（全置換）
import { fetchStandings } from "@/lib/standings";
import StandingsBoard from "@/components/StandingsBoard";

export default async function StandingsSection() {
  const standingsData = await fetchStandings();
  return (
    <section>
      <StandingsBoard rows={standingsData.rows} updatedAt={standingsData.updatedAt ?? undefined} />
    </section>
  );
}
```

- [ ] **Step 2: /standings ページを切替**

`src/app/standings/page.tsx` の変更（JSX・metadata は触らない）:

```tsx
// import を差し替え
import { fetchStandings } from "@/lib/standings";

// 関数冒頭を差し替え
export default async function StandingsPage() {
  const { rows, updatedAt } = await fetchStandings();
  // 以下の JSX は既存のまま
```

（`fetchStandingsFromCsv` の import 行と `process.env.STANDINGS_CSV!` 行を削除する）

- [ ] **Step 3: ローカルで表示確認**

Run: dev サーバーを起動し、ブラウザで `http://localhost:3000/` と `/standings` を開く
Expected: 星取表が現行と同じ内容・同じ見た目で表示され、更新日が出る（Supabase 由来）

- [ ] **Step 4: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/StandingsSection.tsx src/app/standings/page.tsx
git commit -m "feat(standings): 公開側の星取表データ源をSupabaseに切替"
```

### Task 8: 認証（middleware・ログイン・サインアップ・ガード）

**Files:**
- Create: `middleware.ts`（リポジトリルート）
- Create: `src/lib/auth.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/signup/page.tsx`
- Create: `src/app/admin/actions.ts`

**Interfaces:**
- Consumes: `createSupabaseServer`（Task 5）、環境変数 `ADMIN_INVITE_CODE`
- Produces:
  - `getProfile(): Promise<{ userId: string; name: string; role: "admin" | "member" } | null>`（`src/lib/auth.ts`）
  - Server Actions: `login(formData)`, `signup(formData)`, `logout()`（`src/app/admin/actions.ts`）
  - `/admin/*` は未ログイン時 `/admin/login` にリダイレクト（login/signup 除く）

- [ ] **Step 1: middleware を作成**

```ts
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/admin/login" || path === "/admin/signup";
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: auth ヘルパーを作成**

```ts
// src/lib/auth.ts
import { createSupabaseServer } from "@/lib/supabase/server";

export type Profile = { userId: string; name: string; role: "admin" | "member" };

export async function getProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .single();
  if (!data) return null;
  return { userId: user.id, name: data.name, role: data.role };
}
```

- [ ] **Step 3: Server Actions を作成**

```ts
// src/app/admin/actions.ts
"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/admin/login?error=" + encodeURIComponent("メールアドレスまたはパスワードが違います"));
  }
  redirect("/admin/standings");
}

export async function signup(formData: FormData) {
  const invite = String(formData.get("invite") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const fail = (msg: string) => redirect("/admin/signup?error=" + encodeURIComponent(msg));

  if (invite !== process.env.ADMIN_INVITE_CODE) fail("招待コードが違います");
  if (!name) fail("名前を入力してください");
  if (password.length < 8) fail("パスワードは8文字以上にしてください");

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) fail("登録に失敗しました: " + (error?.message ?? ""));

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ user_id: data.user!.id, name });
  if (profileError) fail("プロフィール作成に失敗しました: " + profileError.message);

  redirect("/admin/standings");
}

export async function logout() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 4: admin レイアウトとログイン/サインアップ画面を作成**

```tsx
// src/app/admin/layout.tsx
export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
```

```tsx
// src/app/admin/login/page.tsx
import Link from "next/link";
import { login } from "@/app/admin/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-sm mx-auto pt-16 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">部員ログイン</h1>
      {searchParams.error && (
        <p className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {searchParams.error}
        </p>
      )}
      <form action={login} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">メールアドレス</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">パスワード</span>
          <input name="password" type="password" required autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit"
          className="w-full rounded bg-slate-900 text-white py-2 font-semibold">
          ログイン
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        アカウントがない部員は{" "}
        <Link href="/admin/signup" className="text-emerald-700 underline">新規登録</Link>
      </p>
    </div>
  );
}
```

```tsx
// src/app/admin/signup/page.tsx
import Link from "next/link";
import { signup } from "@/app/admin/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-sm mx-auto pt-16 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">部員アカウント登録</h1>
      {searchParams.error && (
        <p className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {searchParams.error}
        </p>
      )}
      <form action={signup} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">招待コード（部内共有）</span>
          <input name="invite" type="text" required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">名前</span>
          <input name="name" type="text" required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">メールアドレス</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">パスワード（8文字以上）</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit"
          className="w-full rounded bg-slate-900 text-white py-2 font-semibold">
          登録する
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        すでにアカウントがある場合は{" "}
        <Link href="/admin/login" className="text-emerald-700 underline">ログイン</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: ブラウザで動作確認**

Run: dev サーバーで `http://localhost:3000/admin/standings` にアクセス
Expected: 未ログインなので `/admin/login` にリダイレクトされる。`/admin/signup` で招待コード誤り → エラー表示。正しい招待コードで登録 → `/admin/standings` に遷移（この時点では404で良い）

- [ ] **Step 6: 型チェックと Commit**

```bash
pnpm exec tsc --noEmit
git add middleware.ts src/lib/auth.ts src/app/admin
git commit -m "feat(admin): Supabase認証（招待コード式登録・ログイン・ガード）"
```

### Task 9: 星取表編集画面

**Files:**
- Create: `src/app/admin/standings/page.tsx`
- Create: `src/app/admin/standings/StandingsEditor.tsx`
- Create: `src/app/admin/standings/actions.ts`

**Interfaces:**
- Consumes: `getProfile`（Task 8）、`standingsRowsSchema`（Task 3）、`addRow`/`removeRow`/`moveRow`/`EditorRow`（Task 4）、`createSupabaseServer`（Task 5）、`logout`（Task 8）
- Produces: `saveStandings(rows: StandingsRowInput[]): Promise<{ ok: boolean; error?: string }>`

- [ ] **Step 1: 保存 Server Action を作成**

```ts
// src/app/admin/standings/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { standingsRowsSchema, type StandingsRowInput } from "@/lib/standings";

export async function saveStandings(
  rows: StandingsRowInput[]
): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "編集権限がありません" };
  }

  const parsed = standingsRowsSchema.safeParse(rows);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります: " + parsed.error.issues[0]?.message };
  }

  const supabase = createSupabaseServer();
  // 全置換（担当者は実質1人のため last-write-wins）
  const del = await supabase.from("standings_rows").delete().neq("block", "");
  if (del.error) return { ok: false, error: "保存に失敗しました: " + del.error.message };
  const ins = await supabase.from("standings_rows").insert(parsed.data);
  if (ins.error) return { ok: false, error: "保存に失敗しました: " + ins.error.message };
  const meta = await supabase
    .from("standings_meta")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (meta.error) return { ok: false, error: "更新日の記録に失敗しました: " + meta.error.message };

  revalidatePath("/");
  revalidatePath("/standings");
  return { ok: true };
}
```

- [ ] **Step 2: ページ（サーバー側）を作成**

```tsx
// src/app/admin/standings/page.tsx
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logout } from "@/app/admin/actions";
import StandingsEditor from "./StandingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminStandingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");

  if (profile.role !== "admin") {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="text-slate-600 text-sm">
          星取表の編集には管理者権限が必要です。担当者に連絡してください。
        </p>
        <form action={logout}>
          <button className="text-sm text-emerald-700 underline">ログアウト</button>
        </form>
      </div>
    );
  }

  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("standings_rows")
    .select("block, rank, university, points, games, gf, diff, sort_order")
    .order("sort_order");

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">星取表の編集</h1>
        <form action={logout}>
          <button className="text-sm text-slate-500 underline">ログアウト</button>
        </form>
      </div>
      <StandingsEditor initialRows={data ?? []} />
    </div>
  );
}
```

- [ ] **Step 3: エディタ（クライアント側）を作成**

```tsx
// src/app/admin/standings/StandingsEditor.tsx
"use client";
import { useId, useState, useTransition } from "react";
import type { StandingsRowInput } from "@/lib/standings";
import {
  addRow, removeRow, moveRow, normalizeSortOrder, type EditorRow,
} from "@/lib/standings-editor";
import { saveStandings } from "./actions";

const NUM_COLS = [
  ["rank", "順位"],
  ["points", "勝点"],
  ["games", "試合数"],
  ["gf", "総得点"],
  ["diff", "得失点差"],
] as const;

export default function StandingsEditor({
  initialRows,
}: {
  initialRows: StandingsRowInput[];
}) {
  const idPrefix = useId();
  const [seq, setSeq] = useState(0);
  const [rows, setRows] = useState<EditorRow[]>(() =>
    initialRows.map((r, i) => ({ ...r, key: `init-${i}` }))
  );
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const newKey = () => {
    setSeq((s) => s + 1);
    return `${idPrefix}-${seq}`;
  };

  const update = (key: string, field: keyof StandingsRowInput, value: string) => {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? { ...r, [field]: field === "university" || field === "block" ? value : Number(value) }
          : r
      )
    );
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const payload = normalizeSortOrder(rows).map(({ key, ...rest }) => rest);
      const result = await saveStandings(payload);
      setMessage(
        result.ok
          ? { kind: "ok", text: "保存しました。公開ページに反映済みです。" }
          : { kind: "error", text: result.error ?? "保存に失敗しました" }
      );
    });
  };

  const blockTable = (block: "A" | "B") => {
    const blockRows = rows
      .filter((r) => r.block === block)
      .sort((a, b) => a.sort_order - b.sort_order);
    return (
      <div key={block} className="rounded-xl border border-slate-300 bg-white overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-2 font-bold">{block}ブロック</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2 text-left">大学名</th>
                {NUM_COLS.map(([, label]) => (
                  <th key={label} className="px-2 py-2 w-20">{label}</th>
                ))}
                <th className="px-2 py-2 w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {blockRows.map((r) => (
                <tr key={r.key} className="border-t border-slate-200">
                  <td className="px-2 py-1">
                    <input
                      value={r.university}
                      onChange={(e) => update(r.key, "university", e.target.value)}
                      placeholder="大学名"
                      className="w-full min-w-32 rounded border border-slate-300 px-2 py-1.5"
                    />
                  </td>
                  {NUM_COLS.map(([field]) => (
                    <td key={field} className="px-1 py-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={Number.isNaN(r[field]) ? "" : r[field]}
                        onChange={(e) => update(r.key, field, e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-center"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 whitespace-nowrap text-center">
                    <button type="button" aria-label="上へ"
                      onClick={() => setRows((rs) => moveRow(rs, r.key, -1))}
                      className="px-1.5 py-1 text-slate-500 hover:text-slate-900">↑</button>
                    <button type="button" aria-label="下へ"
                      onClick={() => setRows((rs) => moveRow(rs, r.key, 1))}
                      className="px-1.5 py-1 text-slate-500 hover:text-slate-900">↓</button>
                    <button type="button" aria-label="削除"
                      onClick={() => setRows((rs) => removeRow(rs, r.key))}
                      className="px-1.5 py-1 text-red-500 hover:text-red-700">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-200">
          <button type="button"
            onClick={() => setRows((rs) => addRow(rs, block, newKey()))}
            className="text-sm text-emerald-700 font-semibold">
            ＋ 行を追加
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {blockTable("A")}
      {blockTable("B")}
      {message && (
        <p
          role="status"
          className={
            message.kind === "ok"
              ? "rounded bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-sm"
              : "rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm"
          }
        >
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full md:w-auto rounded bg-slate-900 text-white px-8 py-3 font-bold disabled:opacity-50"
      >
        {isPending ? "保存中..." : "保存して公開に反映"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: ブラウザで一連の動作確認**

Run: dev サーバーで確認
1. 登録した一般アカウントで `/admin/standings` → 「権限がありません」表示
2. Supabase ダッシュボード > Table Editor > profiles で担当者の role を `admin` に変更
3. 再アクセス → 編集画面が現行データ入りで表示される
4. 数値を1つ変えて保存 → 成功メッセージ → `http://localhost:3000/standings` に反映され、更新日が今日になっている
5. 行の追加・削除・↑↓もそれぞれ1回試す

Expected: 上記すべて動作

- [ ] **Step 5: 型チェック・テスト・Commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add src/app/admin/standings
git commit -m "feat(admin): 星取表編集画面と保存アクション"
```

### Task 10: スプレッドシート連携の廃止とクリーンアップ

**Files:**
- Modify: `src/lib/sheets.ts`（standings 用コード `StandingsData` 型・`pickFrom`・`fetchStandingsFromCsv` を削除。`fetchCsv` は他で未使用なら ファイルごと削除）
- Modify: `.env.local`（`STANDINGS_CSV` を削除 — Task 6 完了後のみ）

**Interfaces:**
- Consumes: Task 7 の切替が完了していること（`fetchStandingsFromCsv` の参照が残っていないこと）

- [ ] **Step 1: 参照が残っていないことを確認**

Run: `grep -rn "fetchStandingsFromCsv\|STANDINGS_CSV\|fetchCsv" src/`
Expected: `src/lib/sheets.ts` 自身のみヒット（他ファイルからの参照ゼロ）

- [ ] **Step 2: StandingsBoard の型 import を置き換える**

`src/components/StandingsBoard.tsx` は `import { type StandingRow } from "@/lib/sheets";`
を使っている。この import 行を削除し、ファイル先頭にローカル定義を置く:

```ts
type StandingRow = Record<string, string>;
```

- [ ] **Step 3: sheets.ts を削除（または standings 部分を削除）**

Step 1 で `fetchCsv` の利用が sheets.ts 内のみなら:

```bash
git rm src/lib/sheets.ts
```

他に `fetchCsv` 利用箇所があれば sheets.ts の 29 行目以降
（`StandingRow` 型〜`fetchStandingsFromCsv`）のみ削除する。

- [ ] **Step 4: .env.local から STANDINGS_CSV を削除**

`.env.local` の `STANDINGS_CSV=...` 行を削除する。

- [ ] **Step 5: ビルドとテストで回帰確認**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: すべて成功。ビルド出力に `/` `/standings` `/admin/...` が含まれる

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(standings): スプレッドシート連携(CSV)を廃止"
```

### Task 11: デプロイ準備（Vercel 環境変数）と本番反映

**Files:** なし（設定作業と確認のみ）

**Interfaces:**
- Consumes: 全タスク完了・ローカル動作確認済み

**注意: Vercel の環境変数設定はユーザーのダッシュボード操作。push は本番デプロイを意味するためユーザーの承認を得てから行うこと。**

- [ ] **Step 1: ユーザーに Vercel 環境変数の追加を案内**

Vercel ダッシュボード > eagles-mvp > Settings > Environment Variables に以下4つを追加（Production / Preview 両方）:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_INVITE_CODE`
（`STANDINGS_CSV` は削除してよい）

- [ ] **Step 2: ユーザー承認のうえ push**

```bash
git push origin main
```

- [ ] **Step 3: 本番で動作確認**

1. `https://aoyamaeagles.com/` と `/standings` の星取表が表示される
2. `/admin/login` からログイン → 編集 → 保存 → 公開ページ即反映
Expected: すべて動作。失敗時はロールバック（`git revert`）を提案する

- [ ] **Step 4: 担当部員への案内文をユーザーに渡す**

編集担当者向けの説明（URL・登録手順・使い方3行）をチャットで提示して完了。
