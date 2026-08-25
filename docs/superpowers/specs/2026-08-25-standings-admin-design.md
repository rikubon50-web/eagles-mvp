# 星取表 内製編集画面（フェーズ1: 共通基盤＋星取表）設計書

日付: 2026-08-25
ステータス: 承認済み（フェーズ1）

## 背景と目的

星取表（リーグ戦順位表）は現在 Google スプレッドシートの公開 CSV
（`STANDINGS_CSV`）を 5 分キャッシュで取得して表示している。担当部員から
「入力・操作が面倒」という声があり、サイト内に編集画面を内製する。

さらに将来（フェーズ2）、ブログを部員全員が各自ログインして直接投稿できる
ようにしたい。microCMS はメンバー数制限（無料 3 人）があり全員ログインには
使えないため、認証と保存を内製基盤に置く。フェーズ1でその共通基盤
（認証＋DB）を作り、小さい星取表編集で end-to-end を成立させる。

## スコープ

### フェーズ1（本設計書）
- Supabase プロジェクト（認証＋Postgres）
- `/admin` エリア: ログイン、招待コード式サインアップ、星取表編集画面
- 公開側星取表のデータ源を CSV → Supabase に切替、保存時即時反映
- スプレッドシート連携の廃止（`STANDINGS_CSV`、`sheets.ts` の CSV 依存削除）

### フェーズ2（別設計・本書対象外）
- ブログ編集（記事エディタ、画像アップロード=Supabase Storage、公開フロー）
- 公開は承認なしの直接公開（部内決定済み）
- 既存 microCMS ブログ記事の移行

## 全体構成

```
部員（スマホ/PC）
  └─ /admin/login ──────────── Supabase Auth（メール＋パスワード）
  └─ /admin/standings（編集） ─ Server Actions ─ Supabase Postgres
                                     └─ 保存成功時 revalidatePath("/", "/standings")
公開ページ（/ と /standings）
  └─ StandingsSection ─ lib/standings.ts ─ Supabase（anonキー・読取専用）
```

- 既存の表示コンポーネント `StandingsBoard` は変更しない。
  データ取得部（`fetchStandingsFromCsv`）を Supabase 版に差し替える。
- microCMS（news/games/players/blog）はフェーズ1では現状維持。

## データモデル

### `standings_rows`
| 列 | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| block | text | "A" / "B" |
| rank | int | 順位 |
| university | text | 大学名 |
| points | int | 勝点 |
| games | int | 試合数 |
| gf | int | 総得点 |
| diff | int | 得失点差 |
| sort_order | int | ブロック内表示順 |

### `standings_meta`
| 列 | 型 | 説明 |
|---|---|---|
| id | int PK (=1 固定) | 単一行 |
| updated_at | timestamptz | 保存時に自動更新。公開側の「更新日」表示に使用 |

### `profiles`
| 列 | 型 | 説明 |
|---|---|---|
| user_id | uuid PK (auth.users FK) | |
| name | text | 表示名（フェーズ2でブログ著者名に使用） |
| role | text | "admin" / "member"（デフォルト member） |

## 認証・権限

- サインアップ: `/admin/signup` で招待コード＋メール＋パスワード＋名前。
  招待コードは環境変数 `ADMIN_INVITE_CODE`（部内共有の合言葉）。
  コード不一致なら登録不可。
- ログイン: Supabase Auth のメール＋パスワード（`@supabase/ssr` で
  セッションを cookie 管理）。
- 権限:
  - `admin`: 星取表編集（＋フェーズ2で全記事管理）
  - `member`: フェーズ1では管理画面へのログインのみ（編集不可）。
    フェーズ2で自分のブログ記事の作成・編集。
  - 初代 admin は Supabase ダッシュボードから手動昇格。
- RLS（行レベルセキュリティ）:
  - `standings_rows` / `standings_meta`: 読取 = 全員（anon 含む）、
    書込 = role が admin の認証ユーザーのみ。
  - `profiles`: 本人のみ読書き（role 列の変更は不可）、admin は全読取。
  - 画面側チェックに加えた二重防御。

## 星取表編集画面（/admin/standings）

- A/B ブロックごとの表形式。列: 順位・大学名・勝点・試合数・総得点・得失点差
- セル直接編集。数値セルは `inputmode="numeric"`（スマホでテンキー）
- 行の追加・削除、順位（表示順）の上下入れ替え
- 「保存」で全行を一括置換（transaction: delete + insert）。
  保存成功 → `standings_meta.updated_at` を現在時刻（JST 表示）に更新 →
  `revalidatePath` で公開ページ即反映 → 完了トースト表示
- 入力検証（zod）: block は A/B、数値列は整数、大学名は非空。
  エラーは該当セルに赤枠＋メッセージ、保存は中断
- 同時編集は last-write-wins（担当は実質 1 人のため楽観的で良い）

## 移行手順

1. Supabase プロジェクト作成（ユーザー案内のもと）、テーブル＋RLS 設定
2. 現行スプレッドシート CSV の内容を初期データとして投入
3. 公開側の取得を Supabase に切替（表示崩れなしを確認）
4. 編集担当の部員アカウントを作成し admin へ昇格
5. 動作確認後、`STANDINGS_CSV` と `sheets.ts` の standings 用コードを削除

## 環境変数（追加）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用・初期データ投入スクリプトのみで使用。
  通常の保存は admin ユーザーのセッションで RLS を通して行う）
- `ADMIN_INVITE_CODE`

## エラーハンドリング

- Supabase 到達不能時の公開側: ビルド/ISR 時に前回キャッシュを維持
  （fetch 失敗で throw せず空配列＋ログ）。表示は「データ取得中」ではなく
  最後に成功した内容を出す
- 編集画面: 保存失敗時は入力内容を保持したままエラーメッセージ表示
  （再送可能）
- 未ログイン/権限なしで /admin/standings へアクセス → /admin/login へ
  リダイレクト

## テスト

- 単体: 入力検証（zod スキーマ）、行の並べ替え・追加削除のリデューサ
- 結合: ローカルで 編集→保存→公開ページ反映 の一連をブラウザ確認
- ビルド: `next build` 成功、既存ページの回帰なし（roster/news 等）
