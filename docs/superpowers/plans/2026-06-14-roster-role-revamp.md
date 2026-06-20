# ロスター刷新（role対応・コーチ表示）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 更新フォーム75名（PL/STF/コーチ）とDrive写真でロスターを再構築し、カードのロールバッジ・期内PL→STF並べ替え・コーチ最下部・詳細のrole別出し分けを実装する。

**Architecture:** データは一時スクリプト（`tmp-roster-import/`）で全削除→再投入（HEIC変換込み）。フロントは既存4ファイルを最小改修。microCMSスキーマ追加は完了済み。

**Tech Stack:** Node.js v24, microCMS Content/Media API, Next.js(App Router), Tailwind, macOS `sips`。

## Global Constraints

- 作業ディレクトリ: `/Users/rikubon50/Desktop/eagles-mvp`。microCMS系は事前に環境変数export:
  ```bash
  export MICROCMS_SERVICE_DOMAIN=$(grep -E '^MICROCMS_SERVICE_DOMAIN=' .env.local | cut -d= -f2)
  export MICROCMS_API_KEY=$(grep -E '^MICROCMS_API_KEY=' .env.local | cut -d= -f2)
  ```
- microCMS新フィールド（追加済み・全テキスト任意）: `role`(PL/STF/C) / `position` / `univ` / `career` / `achievement` / `organization`。
- 既存必須テキスト（`alphabet/faculty/highschool/sports/favoriteWord/hobby/comment`）と `year`(select1-4必須)・`cohort`(数値) は維持。空必須は `ー` 補完。
- コーチ(role=C)は学年なし → `year=["4"]`・`cohort=99` のセンチネル。表示は role で判定し学生セクションから除外。
- ブランド緑: `#0f6536`。
- 画像はブラウザ表示可能なJPEG/PNGのみ（HEICはアップロード前に`sips`変換）。

---

## Phase A: データ再投入

### Task 1: 取得・解析を新フォーム対応に更新

**Files:**
- Modify: `tmp-roster-import/fetch-data.mjs`（変更不要だが再取得に使用）
- Modify: `tmp-roster-import/lib.mjs`（列追加・名前正規化・HEIC変換アップロード）

**Interfaces:**
- Produces: `loadPlayers()` が `{name, alphabet, cohort, grade, faculty, highschool, sports, favoriteWord, hobby, comment, role, position, univ, career, achievement, organization}` を返す。
- Produces: `uploadMediaConverted(buf, filename)` — HEIC等を`sips`でJPEG化してから`uploadMedia`。

- [ ] **Step 1: 最新データ取得**

Run: `node tmp-roster-import/fetch-data.mjs`
Expected: `sheet bytes: ~ | drive bytes: ~`（sheetは20列・75行、driveは72件）

- [ ] **Step 2: `lib.mjs` の `rowToPlayer` を新列対応に更新**

`tmp-roster-import/lib.mjs` の `rowToPlayer` を置き換え（列index: 14=role,15=univ,16=career,17=achievement,18=position,19=organization）:
```js
export function rowToPlayer(r){
  const t=v=>(v||"").trim().replace(/[　 ]+/g," ").trim();
  const grade=Number(String(r[3]).replace(/[^0-9]/g,""));
  return {
    name:t(r[1]).replace(/[　 ]/g,""), alphabet:t(r[2]),
    grade: grade||null, cohort: (grade>=1&&grade<=4)?(41-grade):null,
    faculty:t(r[4]), highschool:t(r[5]), sports:t(r[6]), favoriteWord:t(r[7]), hobby:t(r[8]),
    comment:t(r[13]),
    role:t(r[14]), univ:t(r[15]), career:t(r[16]), achievement:t(r[17]), position:t(r[18]), organization:t(r[19]),
  };
}
```
（注: 旧コードの rolemodel/animal 等の列は新フォームに無いため削除。name は全角スペース除去で写真姓一致を安定化。）

- [ ] **Step 3: HEIC変換アップロードを追加**

`tmp-roster-import/lib.mjs` 末尾に追加:
```js
import {execSync} from 'child_process';
import {writeFileSync as _wf, readFileSync as _rf} from 'fs';
// HEIC等は sips でJPEG化してからアップロード
export async function uploadMediaConverted(buf, filename){
  const jpeg = buf[0]===0xFF&&buf[1]===0xD8;
  const png  = buf[0]===0x89&&buf[1]===0x50;
  if(jpeg||png) return await uploadMedia(buf, filename);
  _wf("/tmp/rconv.in", buf);
  execSync("sips -s format jpeg /tmp/rconv.in --out /tmp/rconv.out.jpg", {stdio:"ignore"});
  const out=_rf("/tmp/rconv.out.jpg");
  return await uploadMedia(out, filename.replace(/\.[^.]+$/,"")+".jpg");
}
```

- [ ] **Step 4: パース確認**

Run:
```bash
node -e 'import("./tmp-roster-import/lib.mjs").then(L=>{const p=L.loadPlayers();const rc={};p.forEach(x=>rc[x.role]=(rc[x.role]||0)+1);console.log("players:",p.length,"roles:",JSON.stringify(rc));console.log("coach sample:",JSON.stringify(p.find(x=>x.role==="C")));})'
```
Expected: `players: 75 roles: {"PL":51,"STF":16,"C":8}`、コーチsampleに univ/position が入っている。

- [ ] **Step 5: Commit**
```bash
git add tmp-roster-import/lib.mjs
git commit -m "feat(roster-import): 新フォーム列(role/コーチ項目)対応＋HEIC変換アップロード"
```

### Task 2: ドライラン（写真マッチ＋コーチ確認ゲート）

**Files:**
- Modify: `tmp-roster-import/dryrun.mjs`（コーチ `C_*` マッチを追加）

**Interfaces:**
- Produces: `tmp-roster-import/data/match-table.json` = `{table:[{name,role,grade,cohort,photoName,photoId,ambiguous,candidates}], orphanPhotos:[]}`。

- [ ] **Step 1: `dryrun.mjs` をrole対応に更新**

学生は従来の `学年_姓` マッチ、コーチ(role=C)は `C_姓` マッチに分岐。`dryrun.mjs` のマッチ部を更新:
```js
// Driveを学年別 + コーチ別にグループ化
const byGrade={}, coachPhotos=[];
for(const f of drive){
  const mg=f.name.match(/^([1-4])_(.+)$/); const mc=f.name.match(/^C_(.+)$/);
  if(mg){(byGrade[mg[1]]=byGrade[mg[1]]||[]).push({...f,rest:mg[2]});}
  else if(mc){coachPhotos.push({...f, rest:mc[1]});}
}
function matchCoach(p){
  const pool=coachPhotos.filter(c=>{const s=norm(c.rest); return s && (norm(p.name).includes(s)||norm(p.name).startsWith(s));});
  if(pool.length===1) return {photo:pool[0]};
  return {photo:null, ambiguous:pool.length>1, candidates:pool};
}
```
各playerについて `role==="C"?matchCoach(p):matchPhoto(p)` を使い、table行に `role` を含める。
（norm/VARIANTS/matchPhoto は既存を流用。）

- [ ] **Step 2: ドライラン実行**

Run: `node tmp-roster-import/dryrun.mjs`
Expected: 写真マッチ集計、曖昧・写真無し・未割当を表示。**コーチ `C_ウルフ`/`C_モナ` は未マッチ**として出る見込み。

- [ ] **Step 3: コーチ写真の手動確定（ゲート）**

`C_ウルフ`/`C_モナ` が誰か（HC=山本大介 等）をユーザーに確認し、`tmp-roster-import/resolve-coach.mjs` を作成して match-table.json に反映:
```js
import {readFileSync, writeFileSync} from 'fs';
import {loadDriveFiles} from './lib.mjs';
const path="tmp-roster-import/data/match-table.json";
const data=JSON.parse(readFileSync(path,"utf8"));
const drive=loadDriveFiles(); const byName=Object.fromEntries(drive.map(f=>[f.name,f]));
// 手動確定（ユーザー確認後に値を埋める）
const fixes={ /* "山本大介":"C_ウルフ", "（誰か）":"C_モナ" */ };
for(const row of data.table){ if(fixes[row.name]){const f=byName[fixes[row.name]];row.photoName=f.name;row.photoId=f.id;row.ambiguous=false;row.candidates=null;} }
const used=new Set(data.table.filter(t=>t.photoId).map(t=>t.photoId));
data.orphanPhotos=drive.filter(f=>!used.has(f.id));
writeFileSync(path, JSON.stringify(data,null,1));
console.log("coach resolved. 写真付き:",data.table.filter(t=>t.photoId).length,"/",data.table.length);
```
ユーザーに「対象75名/写真有無/コーチ対応」を報告し承認を得る。

- [ ] **Step 4: Commit**
```bash
git add tmp-roster-import/dryrun.mjs tmp-roster-import/resolve-coach.mjs
git commit -m "feat(roster-import): role対応ドライラン＋コーチ写真確認"
```

### Task 3: 全削除→再投入（75名）

**Files:**
- Modify: `tmp-roster-import/run.mjs`（role/コーチ項目・センチネル・HEIC変換・全削除）

**Interfaces:**
- Consumes: `match-table.json`, `placeholder.json`, `loadPlayers()`, `uploadMediaConverted`, `createPlayer`, `deletePlayer`。

- [ ] **Step 1: 既存全削除スクリプト**

`tmp-roster-import/wipe-all.mjs`:
```js
import {deletePlayer, DOMAIN, KEY, sleep} from './lib.mjs';
const DRY=!process.argv.includes("--go");
let all=[],off=0,total=1;
while(off<total){const j=await(await fetch(`https://${DOMAIN}.microcms.io/api/v1/players?limit=100&offset=${off}&fields=id,name`,{headers:{"X-MICROCMS-API-KEY":KEY}})).json();total=j.totalCount;all.push(...j.contents);off+=100;}
console.log("削除対象:",all.length);
if(DRY){console.log("DRY (use --go)");process.exit(0);}
for(const c of all){await deletePlayer(c.id);await sleep(120);}
console.log("wiped",all.length);
```
Run（確認）: `node tmp-roster-import/wipe-all.mjs` → 件数確認。

- [ ] **Step 2: `run.mjs` の `buildFields` を更新（role/コーチ項目・センチネル）**

`tmp-roster-import/run.mjs` の `buildFields` を置換:
```js
const REQUIRED_TEXT=["alphabet","faculty","highschool","sports","favoriteWord","hobby","comment"];
const OPTIONAL_NEW=["role","position","univ","career","achievement","organization"];
function buildFields(p, photoUrl){
  const isCoach = p.role==="C";
  const grade = isCoach ? 4 : (p.grade ?? (41 - p.cohort));
  const cohort = isCoach ? 99 : p.cohort;
  const f={name:p.name, cohort, year:[String(grade)], photo:photoUrl};
  for(const k of REQUIRED_TEXT){ f[k]=(p[k]&&p[k].trim())?p[k]:"ー"; }
  for(const k of OPTIONAL_NEW){ if(p[k]&&p[k].trim()) f[k]=p[k]; }
  return f;
}
```
`photoFor` のアップロードを `uploadMediaConverted` に差し替え（HEIC対策）。

- [ ] **Step 3: カナリア（PL1・コーチ1）**

`run.mjs --canary` を PL1名＋コーチ1名で実行するよう調整し、両方で role/コーチ項目が永続化されることをGET確認。
Run: `node tmp-roster-import/run.mjs --canary`
Expected: `persisted keys` に role/position/univ 等、`photo url` がmicrocms-assets。

- [ ] **Step 4: 全削除→全件作成**

Run:
```bash
node tmp-roster-import/wipe-all.mjs --go
node tmp-roster-import/run.mjs
```
Expected: `created=~75 failed=0`。

- [ ] **Step 5: 検証（件数・role・画像形式）**

Run:
```bash
node -e 'const D=process.env.MICROCMS_SERVICE_DOMAIN,K=process.env.MICROCMS_API_KEY;(async()=>{const j=await(await fetch(`https://${D}.microcms.io/api/v1/players?limit=100`,{headers:{"X-MICROCMS-API-KEY":K}})).json();const rc={};j.contents.forEach(c=>rc[c.role||"?"]=(rc[c.role||"?"]||0)+1);console.log("total:",j.totalCount,"roles:",JSON.stringify(rc));let bad=0;for(const c of j.contents){const u=c.photo&&c.photo.url;if(!u){continue;}const b=Buffer.from(await(await fetch(u)).arrayBuffer());if(!(b[0]===0xFF&&b[1]===0xD8||b[0]===0x89&&b[1]===0x50))bad++;}console.log("非JPEG/PNG:",bad);})()'
```
Expected: `total: ~75 roles: {"PL":51,"STF":16,"C":8} 非JPEG/PNG: 0`。

- [ ] **Step 6: Commit**
```bash
git add tmp-roster-import/run.mjs tmp-roster-import/wipe-all.mjs
git commit -m "feat(roster-import): 全削除→75名(role/コーチ)再投入"
```

---

## Phase B: フロントエンド

### Task 4: Player型の拡張

**Files:**
- Modify: `src/lib/microcms.ts`（`Player` 型）

**Interfaces:**
- Produces: `Player` に `role?: string; position?: string; univ?: string; career?: string; achievement?: string; organization?: string;`。

- [ ] **Step 1: 型にフィールド追加**

`src/lib/microcms.ts` の `Player` 型に追記（`alphabet?` の下あたり）:
```ts
  role?: string;          // "PL" | "STF" | "C"
  position?: string;      // 役職（主将/HC 等）
  univ?: string;          // 出身大学（コーチ）
  career?: string;        // コーチ歴
  achievement?: string;   // 実績
  organization?: string;  // 組織運営
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし（既存と矛盾しない）。

- [ ] **Step 3: Commit**
```bash
git add src/lib/microcms.ts
git commit -m "feat(roster): Player型にrole/コーチ項目を追加"
```

### Task 5: カードにロールバッジ

**Files:**
- Modify: `src/components/PlayerCard.tsx`

**Interfaces:**
- Consumes: `player.role` / `player.position`。
- Produces: カード左上にバッジ表示。コーチは役職（無ければ "COACH"）、学生は PL/STF。

- [ ] **Step 1: バッジを追加**

`PlayerCard.tsx` の `figureContents` の先頭（`_photoUrl ? (...)` の直前、`<>` の直後）にバッジを挿入:
```tsx
{(() => {
  const role = p?.role;
  if (!role) return null;
  const label = role === "C" ? (p?.position || "COACH") : role; // PL / STF / 役職
  return (
    <div
      style={{
        position: "absolute", top: "0.6rem", left: "0.6rem", zIndex: 4,
        background: "#0f6536", color: "#fff", fontWeight: 700,
        fontSize: "0.72rem", letterSpacing: "0.06em",
        padding: "0.18rem 0.55rem", borderRadius: "999px",
      }}
    >
      {label}
    </div>
  );
})()}
```

- [ ] **Step 2: 確認（ビルド）**

Run: `npx tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 3: Commit**
```bash
git add src/components/PlayerCard.tsx
git commit -m "feat(roster): カード左上にロールバッジを表示"
```

### Task 6: 一覧の並べ替え＋コーチセクション

**Files:**
- Modify: `src/app/roster/page.tsx`

**Interfaces:**
- Consumes: `fetchPlayers()`, `player.role`, `cohortOf`, `isActiveCohort`。
- Produces: 学生は期別（PL→STF→name順）、コーチは最下部 `COACH` セクション。

- [ ] **Step 1: 学生/コーチ分割＋並べ替え**

`src/app/roster/page.tsx` の本文ロジックを更新。`const players = await fetchPlayers();` の後を:
```tsx
  const coaches = players.filter((p) => p.role === "C");
  const students = players.filter((p) => p.role !== "C");

  const groups = new Map<number, typeof students>();
  for (const p of students) {
    const cohort = cohortOf(p);
    if (cohort === null || !isActiveCohort(cohort, fy)) continue;
    if (!groups.has(cohort)) groups.set(cohort, []);
    groups.get(cohort)!.push(p);
  }
  const cohorts = Array.from(groups.keys()).sort((a, b) => a - b);
  const roleRank = (p: { role?: string }) => (p.role === "PL" ? 0 : 1); // PL→STF
```
各 cohort の `list` ソートを名前順から:
```tsx
const list = (groups.get(cohort) ?? []).sort(
  (a, b) => roleRank(a) - roleRank(b) || a.name.localeCompare(b.name, "ja")
);
```

- [ ] **Step 2: コーチセクションを最下部に追加**

`cohorts.map(...)` セクション群の **直後**（`</div>` で締める前）に追加:
```tsx
{coaches.length > 0 && (
  <section id="coach" className="space-y-6">
    <div className="w-full bg-slate-900 text-white text-center font-extrabold text-4xl sm:text-6xl py-6">
      COACH
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {coaches
        .sort((a, b) => a.name.localeCompare(b.name, "ja"))
        .map((p) => (
          <PlayerCard key={p.id} player={p} />
        ))}
    </div>
  </section>
)}
```

- [ ] **Step 3: 確認（ビルド）**

Run: `npx tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 4: Commit**
```bash
git add src/app/roster/page.tsx
git commit -m "feat(roster): 期内PL→STF並べ替え＋コーチを最下部セクションに表示"
```

### Task 7: 詳細ページのrole別出し分け

**Files:**
- Modify: `src/app/roster/[id]/page.tsx`

**Interfaces:**
- Consumes: `player.role` と各項目。
- Produces: コーチは出身大学/役職/コーチ歴/実績/組織運営、学生は従来＋役職。

- [ ] **Step 1: プロフィール行をrole別に構築**

`src/app/roster/[id]/page.tsx` の `const rows ...` ブロックを置換:
```tsx
  const isCoach = player.role === "C";
  const rows: { label: string; value: string }[] = [];
  if (isCoach) {
    if (player.position)     rows.push({ label: "役職",       value: player.position });
    if (player.univ)         rows.push({ label: "出身大学",   value: player.univ });
    if (player.career)       rows.push({ label: "コーチ歴",   value: player.career });
    if (player.achievement)  rows.push({ label: "実績",       value: player.achievement });
    if (player.organization) rows.push({ label: "組織運営",   value: player.organization });
  } else {
    if (player.position)   rows.push({ label: "役職",         value: player.position });
    if (player.faculty)    rows.push({ label: "学部・学科",   value: player.faculty });
    if (player.highschool) rows.push({ label: "出身高校",     value: player.highschool });
    if (player.sports)     rows.push({ label: "経験スポーツ", value: player.sports });
    if (player.favoriteWord) rows.push({ label: "EAGLESの好きなところ", value: player.favoriteWord });
    else if (player.comment) rows.push({ label: "EAGLESの好きなところ", value: player.comment });
    if (player.hobby)      rows.push({ label: "オフの過ごし方", value: player.hobby });
  }
```
（`usedCommentForFavorite` を使う既存 comment セクションは学生のみ表示のまま。コーチは `comment` 空(`ー`)なので影響なし。`ー` の行は表示されるが許容。）

- [ ] **Step 2: 期ラベルをコーチは "COACH" に**

`cohortOf(player)` を使う見出し部を:
```tsx
{(() => {
  if (player.role === "C") return <p className="text-slate-400 text-sm mb-1">COACH</p>;
  const c = cohortOf(player);
  return c !== null ? <p className="text-slate-400 text-sm mb-1">{cohortLabel(c)}</p> : null;
})()}
```

- [ ] **Step 3: 確認（ビルド）**

Run: `npx tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 4: Commit**
```bash
git add 'src/app/roster/[id]/page.tsx'
git commit -m "feat(roster): 詳細ページをrole別(コーチ/選手)に出し分け"
```

### Task 8: ビルド＆デプロイ検証

- [ ] **Step 1: 本番ビルド**

Run: `npm run build`
Expected: ビルド成功（型/ESLintエラーなし）。

- [ ] **Step 2: ローカルで表示確認**

`npm run dev` を起動し `http://localhost:3000/roster` を Chrome MCP でスクショ。
Expected: 各期で PL→STF 順、カード左上にバッジ、最下部に COACH セクション、写真表示。

- [ ] **Step 3: デプロイ（ユーザー確認後）**

`git push`（mainへ）→ Vercel自動デプロイ。デプロイ後 `https://eagles-mvp-c8m4.vercel.app/roster` を検証。
Expected: 反映、詳細ページ（選手/コーチ各HTTP200・role別表示）。

---

## Self-Review

- **Spec coverage:** スキーマ追加=済(別途)。再投入(75/role/コーチ/HEIC)=Task1-3。型=Task4。バッジ=Task5。並べ替え＋コーチ最下部=Task6。詳細role別=Task7。検証=Task3 Step5・Task8。全カバー。
- **Placeholder scan:** Task2 Step3 の `fixes={}` はユーザー確認待ちの意図的空（コーチ写真確定後に埋める）。それ以外にTBD無し。
- **Type consistency:** `role`値は "PL"/"STF"/"C" で全タスク一貫。`buildFields`/`roleRank`/`isCoach` の判定一致。match-table構造（table行に role/photoId）一致。Player型の新フィールド名はimportの書込キーと一致。
