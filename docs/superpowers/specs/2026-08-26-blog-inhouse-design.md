# ブログ内製化（フェーズ2）設計書

日付: 2026-08-26
ステータス: 承認済み
前提: フェーズ1（docs/superpowers/specs/2026-08-25-standings-admin-design.md）の
Supabase 認証基盤（招待コード式サインアップ / profiles / member・admin ロール / RLS）が
本番稼働済みであること。

## 背景と目的

ブログは現在アメブロで執筆され、誰かが microCMS へ転載する二度手間になっている
（2026-08-26 に未反映 56 記事を tmp-ameba-import で一括取り込みした）。
microCMS は無料プランのメンバー上限（3人）により部員全員のログインができない。
部員全員（約75人）が各自ログインしてサイトに直接記事を書けるようにする。
公開は承認なしの直接公開（部内決定済み）。

## スコープ

### 対象
- 記事の保存先を microCMS blog → Supabase に一元化
- `/admin/blog` 部員向け記事管理（一覧・新規・編集・削除・下書き）
- Tiptap によるリッチテキストエディタ（スマホ対応）
- 画像アップロード（Supabase Storage）とサムネイル自動生成
- 既存 1,699 記事の移行（テキスト・タグ・日時。URL 不変）
- 公開側（/blog 一覧・詳細・ホームの BlogSection）の取得元切替とページング化

### 対象外（将来フェーズ）
- games / players / news / about の内製化
  - フェーズ3候補: games ＋ 星取表自動連動（試合結果入力から勝点・得失点差を自動計算）
  - フェーズ4候補: players（部員が自分でプロフィール登録する年次フロー）
  - news / about は痛みがないため最後。microCMS 完全撤去時に旧ブログ画像を
    Cloudflare R2 等へ移してから契約を畳む
- 旧記事画像の移設（下記「画像の方針」参照）

## 画像の方針（決定済み）

- **既存記事の画像は microCMS の配信 URL（images.microcms-assets.io）をそのまま参照する。**
  - 実測: 旧記事の画像は推定約6,000枚・約1.0GB で Supabase 無料枠(1GB)とほぼ同量、
    かつ Supabase 無料枠の転送量は月5GBしかなく閲覧増の月にリスクがある
  - microCMS は news / games / players / about で引き続き必須のため、
    画像置き場としての維持は追加依存にならない（解約しないことをルール化）
- **新規記事の画像は Supabase Storage（公開バケット `blog-images`）に保存する。**

## 全体構成

```
部員（スマホ/PC） ─ /admin/login（フェーズ1の認証をそのまま利用）
  └─ /admin/blog          自分の記事一覧（admin は全記事）
  └─ /admin/blog/new      新規作成（Tiptap）
  └─ /admin/blog/[id]     編集
        └─ 画像アップロード → Supabase Storage(blog-images)
        └─ 保存/公開 → Supabase posts → revalidatePath で即時反映
公開ページ
  └─ /blog（一覧・検索・タグ絞り込み・ページング）
  └─ /blog/[id]（詳細。URL はフェーズ1以前と不変）
  └─ ホーム BlogSection
      いずれも Supabase から取得（microCMS blog は読まなくなる）
```

## データモデル

### `posts`
| 列 | 型 | 説明 |
|---|---|---|
| id | text PK | 移行記事は microCMS の id を引き継ぎ（URL 不変）。新規は生成 slug |
| title | text not null | |
| body | text not null | HTML（Tiptap 出力。移行記事は microCMS の body そのまま） |
| thumbnail_url | text | 1280x720。新規は本文1枚目から自動生成 |
| tags | text[] | 既存タグ体系（"ブログ" 等）を維持 |
| author_id | uuid FK→profiles | 移行記事は null |
| status | text | "draft" / "published" |
| published_at | timestamptz | 公開日時（移行記事は元の値を保持） |
| created_at / updated_at | timestamptz | |

### Storage バケット `blog-images`
- 公開読み取り。書き込みは認証ユーザーのみ（RLS/ポリシー）
- パス: `{author_id}/{postId or draft}/{filename}`
- アップロード時に幅上限（例: 1600px）へ縮小して保存し容量を節約

## 権限（アプリ層チェック＋RLS の二重防御）

- member: 自分の記事（author_id = 自分）の作成・編集・削除・下書き
- admin: 全記事の編集・削除（author_id null の移行記事の修正は admin のみ可能）
- 未ログイン/anon: status='published' の読み取りのみ
- RLS: posts の select は published を全員に、draft は本人と admin のみ。
  insert/update/delete は本人（author_id = auth.uid()）または admin。
  insert 時 author_id は auth.uid() を強制

## エディタ・投稿フロー

- Tiptap（StarterKit + TextStyle/Color + TextAlign + 画像 + リンク）。
  ツールバーはアメブロに近いリッチ構成:
  太字 / 文字色 / 文字サイズ（小・標準・大） / 見出し / 箇条書き / 中央寄せ / リンク / 画像挿入
  （参考: 既存記事の装飾使用実態は 画像58%・リンク56%・太字8%・文字色5%、
  見出し・箇条書き・中央寄せは0%。リッチ構成はユーザー要望による選択）
- 画像挿入: その場でアップロードして本文に埋め込み。iPhone の写真からそのまま可
- 下書き保存 / 公開の 2 ボタン。公開後の再編集・再公開も同フロー
- サムネイル: 公開時に本文1枚目の画像から 1280x720 中央クロップを自動生成
  （画像なし記事はサムネイルなし。一覧はプレースホルダ表示）
- タグ: 既定 "ブログ"。シリーズタグ（例: 新歓2026）を自由入力で追加可能
- 公開/更新/削除時に `/blog` `/blog/[id]` とホームを revalidate（即時反映）

## 移行（1,699記事）

1. microCMS blog 全件を取得し posts へ投入（id / title / body / thumbnail_url /
   tags / published_at を保持、status='published'、author_id=null）
2. 再実行安全（id 突合で差分のみ）。tmp-ameba-import と同方式のスクリプト
3. 移行後に公開側を切替。切替前後で URL・表示・件数（1,699）の一致を確認
4. microCMS blog は削除せず読み取り専用アーカイブとして凍結
   （切替後の新規転載は行わない。アメブロ運用も廃止し、以後はサイトで直接執筆）

## 公開側の変更

- `/blog` 一覧: microCMS 全件取得（現状 1,699 件を毎回取得）をやめ、
  Supabase でページング（例: 24件/ページ）＋タイトル検索＋タグ絞り込みに置換。
  見た目は現行の BlogCard / BlogFilterList を踏襲
- `/blog/[id]`: 取得元のみ切替。metadata / JSON-LD / OGP は現行踏襲
- ホーム BlogSection: 最新数件を Supabase から取得
- 取得失敗時はフェーズ1と同じ throw 方式（ISR が前回成功ページを維持）

## エラーハンドリング

- エディタ保存失敗: 入力内容を保持したままエラー表示（再送可能）。
  画像アップロード失敗は該当画像のみエラー、本文は失われない
- 下書きの自動保存は行わない（明示保存のみ。YAGNI）
- 認可外アクセス（他人の記事の編集 URL 直叩き）: 404 相当の拒否

## テスト・検証

- 単体（TDD）: 入力検証、サムネイル生成ロジック、ページング計算
- E2E（ブラウザ）: member で執筆→画像挿入→公開→公開ページ即反映、
  他人の記事を編集できないこと、admin が旧記事を編集できること
- 移行: 件数一致（1,699）、抜き取り表示確認、既存 URL のステータス 200 維持
- `next build` 成功、既存ページの回帰なし

## 環境変数

追加なし（フェーズ1の Supabase 変数をそのまま使用）。
Storage バケットと posts テーブル・RLS は supabase/ 配下の SQL として追加し、
ユーザーが SQL Editor で実行する（フェーズ1と同じ手順）。
