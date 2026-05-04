# Eagles MVP サイト最適化設計書

**日付:** 2026-05-04  
**対象アプローチ:** C — フルスタック最適化  
**スコープ:** パフォーマンス + SEO + TypeScript型安全

---

## 背景・目的

Next.js 14 App Router で構築された青山学院大学男子ラクロス部の公式サイト。現状のボトルネックは以下の3点：

1. `revalidate = 0` によりキャッシュが完全無効化されており、毎リクエストごとにmicroCMS・Google Sheetsへ6本のAPIが走る
2. OGP/Twitter Cardが未整備で、SNSシェア時に画像・タイトルが出ない
3. `any` 型が散在しており、CMS側の変更を型チェックで検出できない

**成功基準:**

- 2回目以降のアクセスで TTFB が体感で明らかに改善すること
- X（旧Twitter）でURLをシェアした際に画像・タイトルが表示されること
- `tsc --noEmit` でエラーゼロになること

---

## セクション 1: パフォーマンス

### ISRキャッシュの修正

全ページで `revalidate = 300`（5分）を設定。現状の `revalidate = 0` はISRを無効化しており、毎リクエストでAPIを叩く原因となっている。

| ファイル | 変更内容 |
|---|---|
| `src/app/page.tsx` | `revalidate = 0` → `revalidate = 300` |
| `src/app/news/page.tsx` | `revalidate = 300` を追加 |
| `src/app/news/[id]/page.tsx` | `revalidate = 300` を追加 |
| `src/app/blog/page.tsx` | `revalidate = 300` を追加 |
| `src/app/blog/[id]/page.tsx` | `revalidate = 300` を追加 |
| `src/app/roster/page.tsx` | `revalidate = 300` を追加 |
| `src/app/roster/[id]/page.tsx` | `revalidate = 300` を追加 |
| `src/app/games/page.tsx` | `revalidate = 300` を追加 |
| `src/app/games/[id]/page.tsx` | `revalidate = 300` を追加 |
| `src/app/standings/page.tsx` | `revalidate = 300` を追加 |
| `src/lib/sheets.ts` | `fetchCsv` のデフォルト `revalidateSec` を `10` → `300` に変更 |

### Suspenseストリーミング（トップページ）

トップページ（`src/app/page.tsx`）を再構成し、Hero・NewsTicker は即時表示、データ依存セクションは各々 Suspense でラップして並列ストリーミング。

**新構造:**

```
<Hero />                         ← 即時表示（データ不要）
<Suspense fallback={<TickerSkeleton />}><NewsTickerSection /></Suspense>
<Suspense fallback={<Skeleton />}><UpcomingSection /></Suspense>
<Suspense fallback={<Skeleton />}><StandingsSection /></Suspense>
<Suspense fallback={<Skeleton />}><NewsSection /></Suspense>
<Attraction />                   ← 静的コンテンツ
<Suspense fallback={<Skeleton />}><BlogSection /></Suspense>
<Suspense fallback={<Skeleton />}><RosterSection /></Suspense>
```

`NewsTickerSection` は news 上位20件を取得して `<NewsTicker>` に渡す。`NewsTicker` コンポーネント自体は props を受け取るだけのサーバーコンポーネントとして扱い、Client Component化は不要。

各 `*Section` コンポーネントを `src/components/sections/` に新規作成し、データ取得ロジックをそこへ移動する。`page.tsx` はレイアウトのみを担う。

**Skeletonコンポーネント:** `src/components/Skeleton.tsx` を新規作成。各セクション用のスケルトン表示を提供する。

### ヒーロー画像のblurプレースホルダー

`src/app/page.tsx` のヒーロー `<Image>` に `placeholder="blur"` と `blurDataURL`（base64のLQIP）を追加し、CLSを防止する。

---

## セクション 2: SEO

### レイアウト共通OGP（`src/app/layout.tsx`）

```typescript
export const metadata: Metadata = {
  title: { default: "EAGLES Lacrosse", template: "%s | EAGLES Lacrosse" },
  description: "青山学院大学男子ラクロス部 公式サイト",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "EAGLES Lacrosse",
    images: [{ url: "/img/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

`NEXT_PUBLIC_SITE_URL` を `.env.local` および Vercel の環境変数に設定すること（例: `https://eagles-lacrosse.vercel.app`）。

デフォルトOGP画像として `public/img/og-default.png`（1200×630px）を用意する。

### 動的メタデータ（generateMetadata）

各動的ページで `generateMetadata()` を実装し、CMSデータをメタデータに反映する。

| ページ | title | og:image |
|---|---|---|
| `/news/[id]` | 記事タイトル | デフォルト画像（News型に画像フィールドなし） |
| `/blog/[id]` | 記事タイトル | thumbnail.url（あれば） |
| `/roster/[id]` | 選手名 | photo.url |
| `/games/[id]` | 試合タイトル | homeTeamLogo.url |

### Sitemap（`src/app/sitemap.ts` 新規）

Next.js 14の `MetadataRoute.Sitemap` を使い、microCMSから全IDを取得して動的サイトマップを生成。

```typescript
// 含めるパス
// - 静的ページ: /, /about, /news, /blog, /roster, /games, /standings, /support, /contact, /membership
// - 動的ページ: /news/[id], /blog/[id], /roster/[id], /games/[id]
```

### JSON-LD構造化データ

**トップページ（SportsTeam）:**

```json
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": "EAGLES Lacrosse",
  "sport": "Lacrosse",
  "url": "https://eagles-lacrosse.vercel.app",
  "memberOf": { "@type": "SportsOrganization", "name": "関東学生ラクロス連盟" }
}
```

**試合詳細ページ（SportsEvent）:**

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "試合タイトル",
  "startDate": "ISO8601形式",
  "location": { "@type": "Place", "name": "会場名" },
  "competitor": [HomeTeam, AwayTeam]
}
```

---

## セクション 3: TypeScript型安全

### 修正箇所一覧

| ファイル | 問題 | 修正 |
|---|---|---|
| `src/app/page.tsx` | `.map((n: any) =>` | `News` 型を直接使用 |
| `src/app/page.tsx` | `(about as any).backgroundImgUrl` | `AboutSheet` 型に `backgroundImgUrl` が既にある（キャスト削除） |
| `src/components/StandingsBoard.tsx` | `rows as any[]` | `StandingRow[]` 型を使用 |
| `src/lib/sheets.ts` | `rows[0] as any` | `fetchCsv` の戻り値型を明示 |
| `src/lib/microcms.ts` | 戻り値型が推論のみ | `Promise<News | null>` 等を明示 |

### 新規型定義

**`src/lib/sheets.ts` に追加:**

```typescript
export type StandingRow = {
  team: string;
  wins: string;
  losses: string;
  draws: string;
  [key: string]: string;
};
```

**`src/lib/format.ts` に追加（page.tsx のインライン関数を移動）:**

```typescript
export function normalizeText(s?: string): string
export function normalizeUrl(u?: string): string | undefined
export function normalizeCategory(cat: unknown): string
```

---

## ファイル構成の変化（まとめ）

```
src/
  app/
    layout.tsx              # OGP共通メタデータ追加
    page.tsx                # revalidate修正・Suspense構造に変更
    sitemap.ts              # 新規
    news/[id]/page.tsx      # generateMetadata追加
    blog/[id]/page.tsx      # generateMetadata追加
    roster/[id]/page.tsx    # generateMetadata追加
    games/[id]/page.tsx     # generateMetadata追加・JSON-LD追加
    （各一覧ページ）         # revalidate追加
  components/
    Skeleton.tsx            # 新規
    sections/               # 新規ディレクトリ
      NewsTickerSection.tsx
      UpcomingSection.tsx
      StandingsSection.tsx
      NewsSection.tsx
      BlogSection.tsx
      RosterSection.tsx
  lib/
    microcms.ts             # 戻り値型明示
    sheets.ts               # 型追加・revalidate修正
    format.ts               # 正規化関数を集約
public/
  img/
    og-default.png          # 新規（1200×630px OGP画像）
```

---

## 制約・注意事項

- `revalidate = 300` に変更するため、CMS更新から反映まで最大5分の遅延が生じる（承認済み）
- OGPデフォルト画像（`og-default.png`）は実装時に用意が必要。既存の `/img/logo.png` を流用するか新規作成する
- SiteMapに含めるベースURLは本番デプロイ後のURLに合わせて環境変数化すること（`NEXT_PUBLIC_SITE_URL`）
- Suspenseストリーミングはサーバーコンポーネント前提。Client Component化されているコンポーネントがあれば確認が必要
