# 試合情報内製化（フェーズ3）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 試合情報を microCMS から Supabase ＋ /admin/games（admin専用）に移行する。星取表連動なし。

**Architecture:** フェーズ1/2 の確立パターンの反復。`games` テーブル＋RLS、admin専用フォーム、Server Actions（authz二重チェック＋revalidatePath 即時反映）、公開側の取得元切替（GameCard 見た目不変）、3件の id 保持移行、microCMS games コード除去。

**Tech Stack:** Next.js 14.2.5 / @supabase/ssr / zod / vitest / pnpm（新規依存なし）

**Spec:** docs/superpowers/specs/2026-08-27-games-inhouse-design.md

## Global Constraints

- pnpm / TypeScript strict / `@/` = `src/`。コミットは既存流儀＋日本語要約。**commit のみ、push はユーザー承認後**
- GameCard の見た目・レンダリングは不変（props は互換オブジェクトで吸収）
- URL `/games/{id}` は移行後も不変（3件は microCMS id 保持）
- 公開側 fetch は失敗時 throw。管理系は authz 二重チェック（getProfile admin ＋ RLS is_admin()）
- result は保存せずスコアから導出。finished 以外はスコア null 正規化
- microCMS の games 以外（news/players/about）のコードには触れない
- 環境変数追加なし

---

### Task 1: games スキーマ定義とユーザー実行

**Files:** Create: `supabase/games-schema.sql`

- [ ] **Step 1: SQL 作成**

```sql
-- supabase/games-schema.sql
-- Supabase ダッシュボード > SQL Editor で実行する（フェーズ3: 試合情報内製化）

create table public.games (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  title text not null,
  start_at timestamptz not null,
  venue text not null default '',
  opponent text not null,
  status text not null default 'scheduled' check (status in ('scheduled','finished','postponed')),
  our_score int,
  opp_score int,
  note text not null default '',
  opponent_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_start_idx on public.games (start_at);

alter table public.games enable row level security;

create policy "games_read_all" on public.games for select using (true);
create policy "games_admin_write" on public.games for all
  using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Commit**（`feat(games): gamesテーブルのスキーマ定義`）
- [ ] **Step 3: ユーザーに SQL 実行を依頼し完了を待つ**（コントローラ担当）
- [ ] **Step 4: 適用検証** — anon で `GET /rest/v1/games?select=id&limit=1` → 200 `[]`

### Task 2: ドメインロジック（検証・result導出）

**Files:** Create: `src/lib/games-domain.ts` / Test: `src/lib/__tests__/games-domain.test.ts`

**Interfaces:**
- `gameInputSchema`: zod。`{ title: trim 1..120, startAt: ISO文字列(z.string().min(1)), venue: string(max 120), opponent: trim 1..60, status: enum, ourScore: number|null, oppScore: number|null, note: string(max 2000), opponentLogoUrl: string|null(URL形式またはnull) }` ＋ `.superRefine`: status='finished' なら両スコア必須(0以上の整数)、それ以外はスコアを null に変換（transform）
- `deriveResult(status: string, ourScore: number | null, oppScore: number | null): "win" | "lose" | "draw" | null` — finished かつ両スコア非null のときのみ導出

- [ ] **Step 1: 失敗するテスト**（TDD）

```ts
// src/lib/__tests__/games-domain.test.ts
import { describe, it, expect } from "vitest";
import { gameInputSchema, deriveResult } from "@/lib/games-domain";

const base = {
  title: "リーグ戦", startAt: "2026-09-10T13:00:00+09:00", venue: "大井",
  opponent: "早稲田大学", status: "scheduled", ourScore: null, oppScore: null, note: "",
};

describe("gameInputSchema", () => {
  it("予定試合を受理し、スコアはnullのまま", () => {
    const r = gameInputSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.ourScore).toBeNull();
  });
  it("finishedでスコア欠落は拒否", () => {
    expect(gameInputSchema.safeParse({ ...base, status: "finished", ourScore: 5 }).success).toBe(false);
  });
  it("finishedで両スコアありは受理", () => {
    expect(gameInputSchema.safeParse({ ...base, status: "finished", ourScore: 5, oppScore: 3 }).success).toBe(true);
  });
  it("scheduledに入ったスコアはnullへ正規化", () => {
    const r = gameInputSchema.safeParse({ ...base, ourScore: 4, oppScore: 2 });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.ourScore).toBeNull(); expect(r.data.oppScore).toBeNull(); }
  });
  it("相手校空欄は拒否", () => {
    expect(gameInputSchema.safeParse({ ...base, opponent: " " }).success).toBe(false);
  });
});

describe("deriveResult", () => {
  it("勝ち", () => expect(deriveResult("finished", 8, 6)).toBe("win"));
  it("負け", () => expect(deriveResult("finished", 2, 9)).toBe("lose"));
  it("引き分け", () => expect(deriveResult("finished", 3, 3)).toBe("draw"));
  it("未終了はnull", () => expect(deriveResult("scheduled", null, null)).toBeNull());
  it("finishedでもスコアnullならnull", () => expect(deriveResult("finished", null, null)).toBeNull());
});
```

- [ ] **Step 2: FAIL 確認** → **Step 3: 実装** → **Step 4: PASS 確認** → **Step 5: Commit**（`feat(games): 試合入力スキーマとresult導出`）

実装参考（Step 3）:

```ts
// src/lib/games-domain.ts
import { z } from "zod";

const score = z.number().int().min(0).nullable();

export const gameInputSchema = z
  .object({
    title: z.string().trim().min(1, "大会名を入力してください").max(120),
    startAt: z.string().min(1, "日時を入力してください"),
    venue: z.string().trim().max(120),
    opponent: z.string().trim().min(1, "相手校を入力してください").max(60),
    status: z.enum(["scheduled", "finished", "postponed"]),
    ourScore: score,
    oppScore: score,
    note: z.string().max(2000),
  })
  .superRefine((v, ctx) => {
    if (v.status === "finished" && (v.ourScore == null || v.oppScore == null)) {
      ctx.addIssue({ code: "custom", message: "終了した試合は両チームのスコアが必要です", path: ["ourScore"] });
    }
  })
  .transform((v) =>
    v.status === "finished" ? v : { ...v, ourScore: null, oppScore: null }
  );
export type GameInput = z.infer<typeof gameInputSchema>;

export function deriveResult(
  status: string, ourScore: number | null, oppScore: number | null
): "win" | "lose" | "draw" | null {
  if (status !== "finished" || ourScore == null || oppScore == null) return null;
  if (ourScore > oppScore) return "win";
  if (ourScore < oppScore) return "lose";
  return "draw";
}
```

### Task 3: 移行スクリプトと実行

**Files:** Create: `tmp-games-migrate/migrate.mjs`

- microCMS games 全件（3件）→ games へ id 保持で投入。マッピング: title/startAt→start_at/venue/awayTeamName→opponent/status[0]（microCMSのselectは配列）/ourScore/oppScore/text→note/awayTeamLogo.url→opponent_logo_url。再実行安全（既存 id スキップ）。tmp-blog-migrate/migrate.mjs と同構造（.env.local 読み・service role・ドライラン既定・WRITE=1）
- [ ] Step 1: スクリプト作成 → Step 2: ドライラン→WRITE=1 実行（3件） → Step 3: anon で件数・内容照合 → Step 4: Commit（`feat(games): microCMS→Supabaseの試合データ移行スクリプト`）

### Task 4: 公開側データ層と切替

**Files:** Create: `src/lib/games.ts` / Modify: `src/app/games/page.tsx`, `src/app/games/[id]/page.tsx`, `src/components/sections/UpcomingSection.tsx`, `src/app/sitemap.ts`, `src/components/GameCard.tsx`（props型のみ）

**Interfaces（src/lib/games.ts）:**
- `type GameView` — GameCard 互換: `{ id, title, startAt, venue, homeTeamName: "青山学院大学", homeTeamLogo: { url: "/img/logo.png", width: 977, height: 599 }, awayTeamName, awayTeamLogo: opponent_logo_url ? { url, width: 400, height: 400 } : undefined, status, ourScore?, oppScore?, result?, text? }`（現行 microCMS Game 型のフィールド名に合わせ、GameCard 側の変更を props 型差し替えのみに留める）
- `fetchGamesUpcoming(): Promise<GameView[]>` — start_at > now、昇順。**失敗時 throw**
- `fetchGamesArchive(): Promise<GameView[]>` — start_at <= now、降順。失敗時 throw
- `fetchGameById(id): Promise<GameView | null>`（/games/[id] が使う場合のみ。現状の実装を読んで合わせる）
- result は deriveResult で導出して詰める

- [ ] Step 1: lib 実装 → Step 2: 各ページ切替（JSX/見た目不変） → Step 3: dev サーバーで /games・ホーム・詳細を curl 確認 → Step 4: `pnpm exec tsc --noEmit && pnpm test` → Step 5: Commit（`feat(games): 公開側の試合情報をSupabase取得に切替`）

### Task 5: 管理画面と Server Actions

**Files:** Create: `src/app/admin/games/page.tsx`（一覧・admin専用）, `src/app/admin/games/new/page.tsx`, `src/app/admin/games/[id]/page.tsx`, `src/app/admin/games/GameForm.tsx`（client）, `src/app/admin/games/actions.ts`, `src/app/admin/games/DeleteGameButton.tsx`

**Interfaces:**
- `saveGame(input: GameInput & { id: string | null }): Promise<{ok:true;id:string}|{ok:false;error:string}>` — admin チェック → gameInputSchema 検証 → id null なら insert（DB採番: insert 後 select で id 取得 or `.select("id").single()`）/ あれば update。成功時 revalidatePath("/games", `/games/${id}`, "/")
- `deleteGame(id): Promise<{ok:boolean;error?:string}>` — admin のみ、成功時同様に revalidate
- 相手ロゴ: GameForm に任意の画像アップロード欄（プレビュー＋削除ボタン）。既存 `/api/admin/upload` を**thumb 任意**に一般化（thumb 無しなら image のみ保存し {url} を返す。既存のブログ経路は thumb 必須のまま互換）。クライアントは `src/lib/image-client.ts` に `prepareLogoForUpload(file): Promise<Blob>`（最大400pxに縮小・JPEG）を追加して使用。アップロード先パスは既存規約どおり {userId}/{gameId or 'new-'+一時id}/{ts}.jpg
- GameForm: datetime-local 入力（JST変換に注意: `start_at` は timestamptz、フォーム値はローカル時刻文字列 → ISO 変換して送る。編集時は逆変換して初期値に）。status セレクト、finished 選択時のみスコア2欄を表示。エラーは赤バナー（/admin/standings と同型のスタイル）
- 一覧: 「これからの試合」（昇順）/「終了・延期」（降順）の2セクション、日付・相手・スコア表示、編集/削除
- 非admin: /admin/standings と同じ「権限がありません」表示

- [ ] Step 1: actions 実装 → Step 2: ページ・フォーム実装 → Step 3: 検証（tsc/test/curl: 未認証 /admin/games → 307） → Step 4: Commit（`feat(games): 試合情報の管理画面（admin専用）`）

### Task 6: microCMS games 依存の除去とビルド確認

**Files:** Modify: `src/lib/microcms.ts`（Game 型・GAME_LIST_FIELDS・fetchGamesUpcoming・fetchGamesArchive を削除。news/players/about は不変）、残参照の掃き出し

- [ ] Step 1: `grep -rn "fetchGamesUpcoming\|fetchGamesArchive\|GAME_LIST_FIELDS" src/` で残参照ゼロ確認（Task 4 で切替済みのはず） → Step 2: 削除 → Step 3: `pnpm test && pnpm exec tsc --noEmit && pnpm build` → Step 4: Commit（`chore(games): microCMS games依存を除去`）

### Task 7: E2E とリリース（コントローラ実施）

- [ ] admin アカウントで: 新規作成（予定）→ /games とホームに即反映 → 編集でスコア入力し finished 化 → 勝敗表示切替 → 削除 → 反映確認
- [ ] member アカウントで /admin/games → 権限がありません
- [ ] 移行3件の URL /games/{旧id} が 200
- [ ] ユーザー承認のうえ main へマージ・push → 本番確認
