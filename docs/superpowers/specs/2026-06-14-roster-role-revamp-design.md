# ロスター刷新（role対応・コーチ表示）設計書

- 日付: 2026-06-14
- 対象: eagles-mvp（Next.js + microCMS）の選手/スタッフ/コーチ ロスター（`/roster`, `/roster/[id]`）
- データ源:
  - 更新フォーム（Googleフォーム回答）: `role` 列＋コーチ専用項目を追加。回答 **75件**（PL51 / STF16 / C8）
    `https://docs.google.com/spreadsheets/d/151EoQn5ZSvtvlYnzQEDVLRJXmwkJINlI21Lgo37dWG0/edit`
  - Google Driveフォルダ: 写真 **72枚**（学年別65＋コーチ `C_*` 6）
    `https://drive.google.com/drive/folders/1qub3RgHrUWdzm6qjni2KzXfGoLXlnI0N`

## 1. ゴール

更新フォーム（role付き・75名）とDrive写真でロスターを再構築する。
- カード左上に **ロールバッジ（PL/STF）** を表示。
- 各期（cohort）内を **PL → STF の順** に並べる。
- **コーチ（role=C）はページ最下部の専用セクション** に表示。
- 詳細ページを **role別** に出し分け（選手＝学生項目、コーチ＝コーチ項目）。

## 2. 現状と前提

- microCMS `players`: 旧フォーム由来の67名が登録済み（→**全削除して再投入**）。
- ロスターページ `src/app/roster/page.tsx`: cohort別グルーピング＋現役期のみ表示（`isActiveCohort`）。
- 詳細ページ `src/app/roster/[id]/page.tsx`: `photo.url` 直接参照、学生項目の行表示。
- カード `src/components/PlayerCard.tsx`: 写真＋下部に名前。
- 型/取得 `src/lib/microcms.ts`、cohort計算 `src/lib/cohort.ts`。
- **microCMSスキーマに role 等の新フィールドが存在しない**（POST時 "unexpected key"。確認済み）。

## 3. データ突き合わせ（確定事項）

- フォーム列に追加: `[14]ロール(PL/STF/C)` `[15]出身大学` `[16]コーチ歴` `[17]実績` `[18]役職` `[19]組織運営`。
- ロール分布: PL51 / STF16 / C8。コーチは学年が空。
- 役職(`[18]`)は **選手にも存在**（主将=丸野翼、副将=北村尚士/木場崇大、各リーダー等）。コーチは HC/GM/OFコーチ 等。
- Drive更新: `1_前野`/`1_竹田`（旧プレースホルダ2名に写真追加）、`1_佐藤し`（新規1年）、コーチ `C_安西/C_丸山/C_中村/C_岩佐` ＋ニックネーム `C_ウルフ/C_モナ`（要手動対応付け）。
- 写真無し見込み: 菅原麟、写真未提出コーチ2名（8コーチ−写真6枚）→ プレースホルダ。

## 4. microCMSスキーマ追加（管理画面での手作業・実装の前提）

`players` に以下を **テキストフィールド・すべて任意（必須にしない）** で追加する。
フィールドIDは下表の英字で作成すること（インポートコードがこのIDへ書き込むため）。

| 表示名 | フィールドID | 用途 |
|---|---|---|
| ロール | `role` | `PL` / `STF` / `C` |
| 役職 | `position` | 主将・副将・HC・GM 等（全ロール共通） |
| 出身大学 | `univ` | コーチ |
| コーチ歴 | `career` | コーチ |
| 実績 | `achievement` | コーチ |
| 組織運営 | `organization` | コーチ |

任意フィールドにする理由: 選手にはコーチ項目が空、コーチには学生項目が空のため、
必須だと作成時に400になる。

## 5. フィールド対応（フォーム列 → microCMS）

| フォーム列 | microCMS |
|---|---|
| 名前（漢字） | `name`（前後の全角/半角スペースは除去） |
| 名前（アルファベット） | `alphabet` |
| 学年 | `cohort`（41−学年）／`year`（[String(学年)]）。コーチは下記センチネル |
| 学部学科 | `faculty` |
| 出身高校 | `highschool` |
| 出身スポーツ | `sports` |
| Eaglesの好きなところ | `favoriteWord` |
| オフの過ごし方 | `hobby` |
| 一言 | `comment` |
| ロール | `role`（PL/STF/C） |
| 役職 | `position` |
| 出身大学 | `univ` |
| コーチ歴 | `career` |
| 実績 | `achievement` |
| 組織運営 | `organization` |
| Drive写真 | `photo` |

- 既存の必須テキスト（`faculty/highschool/sports/favoriteWord/hobby/comment/alphabet`）は
  空なら `ー` で補完（前回同様）。
- **コーチ（role=C）は学年が無い**ため、`year=["4"]`・`cohort=99` のセンチネルを入れて作成する
  （`year`は必須selectで1-4のみ許容、`cohort`は数値）。表示側は **role判定でコーチを学年セクションから除外** するため、このセンチネルは画面に出ない。

## 6. 写真マッチング

- 学生: 既存ロジック（`学年_姓`、異体字正規化、同姓は読み仮名）。フォーム名の全角スペース除去後に照合。
- コーチ: `C_姓` をコーチ名の姓に前方一致。ニックネーム `C_ウルフ`/`C_モナ` は
  自動一致しないため **ドライランのマッチ表で手動確認**（HC=山本大介 等）。
- 写真が無い人は UPCOMING プレースホルダ。
- **HEIC対策**: ダウンロード後にバイト先頭を判定し、JPEG/PNGでなければ `sips` でJPEG変換してからアップロード（前回のHEIC非表示を再発させない）。

## 7. フロントエンド変更

### 7.1 型・取得 `src/lib/microcms.ts`
`Player` 型に `role?, position?, univ?, career?, achievement?, organization?` を追加。

### 7.2 カード `src/components/PlayerCard.tsx`
- 左上に **ロールバッジ** を追加。表記は `PL` / `STF`（コーチ欄では役職 or `COACH`）。
- バッジはブランド緑(#0f6536)地＋白文字の小ピル。写真の上、`z-index`を前面に。

### 7.3 一覧 `src/app/roster/page.tsx`
- 取得選手を role で3分類: 学生（PL/STF）とコーチ（C）。
- 学生: 従来通り cohort 別グルーピング（現役期のみ）。各グループ内の並びを
  **role優先（PL→STF）→ name順** に変更。
- コーチ: ページ最下部に **専用セクション**（見出し例: `COACH`）。役職順（HC/GM等を優先）→ name順。
- コーチカードもPlayerCardを再利用（バッジに役職、リンクは詳細へ）。

### 7.4 詳細 `src/app/roster/[id]/page.tsx`
- role判定で出し分け:
  - 選手（PL/STF）: 学部・学科／出身高校／経験スポーツ／EAGLESの好きなところ／オフの過ごし方／Comment（従来）＋ 役職があれば表示。
  - コーチ（C）: 出身大学／役職／コーチ歴／実績／組織運営。期ラベルの代わりに「COACH」等。
- 写真は全員に存在（実写真 or プレースホルダ）するため従来のまま安全。

## 8. 実装方針（一時スクリプト）

`tmp-roster-import/` を再利用。
- フェーズ1: 最新フォーム/Drive取得 → role分類 → 写真マッチ → マッチ表で **コーチ写真(ウルフ/モナ)確認**（ゲート）。
- フェーズ2: 現67名を全削除 → カナリア（PL1・コーチ1）でスキーマ検証 → 全75名作成（HEIC変換・レート制限・429・再開ログ）。
- フロントは別途コード変更＋Vercelデプロイ（ISRではなくコード変更のためデプロイ必要）。

## 9. 検証

- microCMS: 件数75、role分布(PL51/STF16/C8)、写真欠損0、非JPEG/PNG 0。
- ライブ: カードバッジ表示、各期PL→STF順、コーチが最下部、詳細ページがrole別、HTTP200。
- 写真の実体がブラウザ表示可能（JPEG/PNG）であることを再スキャンで確認。

## 10. スコープ外 / 留意

- スキーマ追加は管理画面の手作業（API不可）。これが完了するまで再投入は実行不可。
- コードはGitHub→Vercelデプロイ。デザインの大きな作り込みは今回スコープ外（既存カードに最小追加）。
- 役職の表示優先順位（HC>GM>…）は実装時に定義。
