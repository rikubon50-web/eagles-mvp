# ロスター実データ投入 設計書

- 日付: 2026-06-14
- 対象: eagles-mvp（Next.js + microCMS）の選手ロスター（`/roster`, `/roster/[id]`）
- データ源:
  - スプレッドシート（Googleフォーム回答）: 選手プロフィール 約70名
    `https://docs.google.com/spreadsheets/d/151EoQn5ZSvtvlYnzQEDVLRJXmwkJINlI21Lgo37dWG0/edit`
  - Google Driveフォルダ: 選手写真 64枚
    `https://drive.google.com/drive/folders/1qub3RgHrUWdzm6qjni2KzXfGoLXlnI0N`

## 1. ゴール

スプレッドシートの実選手データを microCMS `players` エンドポイントへ登録し、Drive の写真を
紐付けてロスターを完成させる。既存のダミー7件（全て「舩井陸太」のテストデータ）は削除する。
ロスターのUI・コードは既に完成・稼働中のため、原則コード変更は不要。

## 2. 現状

- microCMS `players`: ダミー7件のみ（`舩井陸太` × 異なる cohort）。
- ロスターページ `src/app/roster/page.tsx`: cohort（期）別にグルーピングし、現役期のみ表示。
- 詳細ページ `src/app/roster/[id]/page.tsx`: `player.photo.url` を直接参照するため、
  **写真が無いと描画エラー**になる（→ 全員に写真 or プレースホルダを割り当てて回避）。
- データモデル `src/lib/microcms.ts` の `Player` 型 / cohort計算 `src/lib/cohort.ts`。

## 3. データ突き合わせ結果（確定事項）

学年別の件数:

| 学年 | スプシ(名) | 写真(枚) | 状況 |
|---|---|---|---|
| 1年 | 30 | 20 | 10名が写真無し → プレースホルダ |
| 2年 | 19 | 19 | 全員 surname 一致（クリア） |
| 3年 | 9 | 9 | 全員 surname 一致（クリア） |
| 4年 | 13 | 16 | 12名一致＋北村の振り分け要確認＋フォーム未回答3名 |

- **4年の写真超過の正体**:
  - フォーム未回答だが写真がある3名: `4_倉林` / `4_小竹` / `4_川本`
    → **写真＋姓のみで登録**（プロフィール項目は空。フルネーム/アルファベットは後日補完）。
  - 同姓「北村」2名（北村尚士=なおし / 北村祐理=ゆうり）と写真2枚（`4_北村な` / `4_北村ち`）。
    `な`=尚士 は明らかだが `ち` の対応が読みと合わず曖昧 → **ドライランのマッチ表でユーザー確認**。

登録総数の見込み: スプシ約70名 + フォーム未回答3名 = **約73エントリ**。

## 4. フィールド対応（スプシ列 → microCMS fieldId）

| スプシ列 | microCMS fieldId |
|---|---|
| 名前（フルネーム漢字） | `name` |
| 名前（フルネームアルファベット） | `alphabet` |
| 学年 | `cohort`（下記変換） |
| 学部学科 | `faculty` |
| 出身高校 | `highschool` |
| 出身(経験)スポーツ（部活） | `sports` |
| Eaglesの好きなところ | `favoriteWord` |
| オフの過ごし方 | `hobby` |
| 憧れのPL/人物 | `rolemodel` |
| 自分を生き物に例えると | `animal` |
| 無人島に一つだけ持っていくなら | `islandItem` |
| もしラクロス部に入っていなかったら | `alternativePath` |
| 一言 | `comment` |
| Drive写真 | `photo`（画像フィールド） |

**学年→cohort変換（FY2026基準, `src/lib/cohort.ts` 準拠）**: cohort = 41 − 学年
→ 1年=40期 / 2年=39期 / 3年=38期 / 4年=37期。

**スキーマ検証**: `rolemodel` / `animal` / `islandItem` / `alternativePath` などの fieldId が
microCMSスキーマに実在するかは管理APIで読めなかったため、**本番フェーズのカナリア1件作成**で検証する。
400が返ったフィールドはエラー内容から特定し、送信対象から除外して再試行する。

## 5. 写真マッチング・アルゴリズム

- Drive ファイル名 = `<学年数字>_<姓漢字>[読み仮名等の区別文字]`（例: `2_佐藤そ`, `1_佐藤は`）。
- 各スプシ選手について「学年一致 かつ 姓がファイル名の姓部分の先頭一致」で候補抽出。
- 候補が複数（同学年同姓）の場合は区別文字（読み仮名）で照合するが、
  曖昧（例: 北村 な/ち）なケースは**フラグして手動確認**。
- マッチしない選手 → UPCOMING プレースホルダ画像を割り当て。
- どのスプシ行にも紐づかない写真 → フォーム未回答者として別扱い（4年 倉林/小竹/川本）。

## 6. プレースホルダ画像

緑基調（#0f6536）の「UPCOMING / COMING SOON」画像を1枚生成し、microCMSメディアへ1回アップロード。
写真無しの選手の `photo` フィールドにそのURLを割り当てる。これにより `photo.url` が常に存在し、
詳細ページのエラーを回避できる（コード変更不要）。

## 7. 実装方針（一時スクリプト）

ブログ画像修正タスクと同様、`tmp-roster-import/` に一時的なNodeスクリプトを作る。

認証: `/Users/rikubon50/Desktop/eagles-mvp/.env.local` の
`MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY`（管理API・メディア・コンテンツ書込権限あり）。
各値は個別にgrep抽出して使う。

API:
- スプシ取得: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv`（CSV）
- Drive一覧: `https://drive.google.com/embeddedfolderview?id=<FID>#list`（HTMLからファイル名+IDを抽出）
- Drive画像DL: `https://drive.google.com/uc?export=download&id=<FILE_ID>`
  （ウイルススキャン確認ページが返る場合は confirm トークンを処理）
- メディアUP: `POST https://<domain>.microcms-management.io/api/v1/media`,
  header `X-MICROCMS-API-KEY`, multipart field `file` → `{url}` を返す。
  **間隔700ms + 429指数バックオフ（最大6回）**。
- player作成: `POST https://<domain>.microcms.io/api/v1/players`, body にフィールド群。
  画像フィールド `photo` はアップロード済みメディアのURLを渡す（カナリアで形式確認）。
- ダミー削除: `DELETE https://<domain>.microcms.io/api/v1/players/<id>`。

## 8. 進め方（2フェーズ）

### フェーズ1: ドライラン（書き込み無し）
1. スプシCSV解析（堅牢なCSVパーサ。改行入りセル対応）。
2. Drive一覧取得（ファイル名+ID）。
3. 写真マッチング → 全員の「選手名 ↔ 割当写真（or プレースホルダ）」マッチ表生成。
4. 各Drive画像のDL可否（HTTP 200/サイズ）をサンプル確認。
5. 集計報告: 登録予定数、写真有/無の内訳、曖昧ケース（北村）、フォーム未回答3名、フィールドマッピング例。
6. **ユーザーがマッチ表を確認・修正・承認**。

### フェーズ2: 本番（書き込み）
1. UPCOMING プレースホルダ画像を生成・アップロード。
2. **カナリア**: 1名を全フィールドで作成 → GETで永続化フィールド・画像表示を検証。
   400なら不正フィールドを除外して再調整。検証用に作った1件はそのまま本登録として使う。
3. 全件作成（レート制限・429バックオフ・失敗時スキップ＋ログ）。
4. ダミー7件を削除。
5. ライブサイト（`https://eagles-mvp-c8m4.vercel.app/roster`）でサンプル数件の表示・写真・
   詳細ページ・期別グルーピングを検証。

## 9. 安全策

- 本番microCMSへの書き込み（新規作成＋ダミー削除）。ドライラン承認後にのみ実行。
- アップロード/作成失敗は当該選手のみスキップしログに残す（全体停止しない）。
- 再開可能なログ（results.json）で、作成済み選手の重複作成を防ぐ。
- ダミー削除は「対象が `舩井陸太` であること」を確認してから実行（実選手の誤削除防止）。
- 一時スクリプトは完了後の扱い（残す/削除）をユーザーに確認する。

## 10. スコープ外 / 留意

- サイトは ISR revalidate 300 で自動反映。コード変更・デプロイは原則不要。
- フォーム未回答3名のフルネーム/アルファベットは後日ユーザーが補完。
- 1年の写真無し10名の写真も後日追加可能（プレースホルダから差し替え）。
