# 試合情報内製化（フェーズ3）設計書

日付: 2026-08-27
ステータス: 承認済み
前提: フェーズ1/2 の Supabase 基盤（認証 / profiles / member・admin / RLS、
/admin エリア、revalidatePath 即時反映パターン）が本番稼働済み。

## 背景と決定事項

- 試合情報（games）を microCMS から Supabase ＋ /admin/games 内製編集に移行する
- **星取表との自動連動は行わない**（部内決定。星取表は現状の手動編集を継続）
- 編集権限は **admin のみ**（閲覧は全員）
- ロゴは簡素化: 自チームは常にサイトロゴ（/img/logo.png）、**相手ロゴ機能は廃止**
  （既存データで実運用ゼロ。要望が出たら後付け）
- 勝敗（win/lose/draw）は手入力せず**スコアから導出**する

## データモデル

### `games`
| 列 | 型 | 説明 |
|---|---|---|
| id | text PK default replace(gen_random_uuid()::text,'-','') | 新規はDB側で自動採番。移行3件は microCMS の id を保持（URL /games/{id} 維持） |
| title | text not null | 大会名（例: 2026年度関東学生ラクロスリーグ戦） |
| start_at | timestamptz not null | 試合日時 |
| venue | text not null default '' | 会場 |
| opponent | text not null | 相手校名 |
| status | text not null default 'scheduled' | scheduled / finished / postponed |
| our_score | int null | 終了時のみ |
| opp_score | int null | 終了時のみ |
| note | text not null default '' | 補足（旧 text フィールド相当） |
| created_at / updated_at | timestamptz | |

- result は保存しない。表示時に `our_score > opp_score → win` 等で導出
  （finished かつ両スコア非null のときのみ）
- RLS: select = 全員（anon 含む）。insert/update/delete = `public.is_admin()`
  （フェーズ2で作成済みの security definer 関数を再利用）

## 管理画面（/admin/games、adminのみ）

- 一覧: これからの試合（start_at 昇順）と過去の試合（降順）をセクション分け。
  新規作成ボタン、各行に編集リンク・削除ボタン（confirm）
- フォーム（新規/編集共通）: 日時（datetime-local）・大会名・会場・相手校・
  ステータス・スコア2つ（status=finished のときのみ入力欄を表示）
- 検証: title/opponent 非空、finished なら両スコア必須（0以上の整数）、
  scheduled/postponed ならスコアは null に正規化
- 保存/削除で `/games` `/games/{id}` `/` を revalidatePath（即時反映）
- 非adminは 権限がありません 表示（/admin/standings と同型）

## 公開側の変更

- `/games`（一覧）・`/games/[id]`・ホーム UpcomingSection・sitemap の取得元を
  Supabase に切替。**GameCard の見た目は不変**（props は互換オブジェクトで吸収）:
  homeTeamName=青山学院大学・homeTeamLogo=サイトロゴ固定・awayTeamName=opponent・
  awayTeamLogo=なし・result=導出値
- 取得失敗時は throw（ISR が前回成功ページを維持。フェーズ1/2と同方針）

## 移行

- 既存3件を id 保持で移行（title/startAt/venue/status/ourScore/oppScore/text）。
  opponent は旧 awayTeamName（全件「青山学院大学」のプレースホルダ）をそのまま入れ、
  admin が編集画面で直せる状態にする
- 切替後、microcms.ts から Game 型・fetchGamesUpcoming/fetchGamesArchive を削除
  （news/players/about は不変）。microCMS の games はアーカイブとして凍結

## テスト・検証

- 単体（TDD）: 入力検証スキーマ、result 導出関数、（必要なら）日時整形
- E2E: admin で作成→公開ページ即反映→スコア入力（finished化）→表示切替→削除。
  member は /admin/games で権限なし表示
- `next build` 成功、既存ページ回帰なし。移行3件の URL 維持確認

## 環境変数・ユーザー作業

- 環境変数追加なし。ユーザー作業は supabase/games-schema.sql の SQL Editor 実行のみ
