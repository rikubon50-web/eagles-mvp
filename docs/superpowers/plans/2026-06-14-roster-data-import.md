# ロスター実データ投入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スプレッドシート(フォーム回答)とDrive写真から約73名の選手をmicroCMS `players` へ投入し、ダミー7件を削除してロスターを完成させる。

**Architecture:** ブログ画像修正と同様の一時Nodeスクリプト(`tmp-roster-import/`)。フェーズ1(ドライラン: 解析・写真マッチ・集計、書き込み無し)でマッチ表をユーザー確認 → フェーズ2(本番: プレースホルダ生成・カナリア検証・全件作成・ダミー削除)。レート制限と429バックオフ付き。原則アプリのコード変更なし。

**Tech Stack:** Node.js v24 (グローバルfetch/FormData/Blob), microCMS Content API + Management/Media API, Google Sheets CSV export, Google Drive 公開フォルダ。

**データ源/認証:**
- スプシ CSV: `https://docs.google.com/spreadsheets/d/151EoQn5ZSvtvlYnzQEDVLRJXmwkJINlI21Lgo37dWG0/gviz/tq?tqx=out:csv`
- Drive 一覧: `https://drive.google.com/embeddedfolderview?id=1qub3RgHrUWdzm6qjni2KzXfGoLXlnI0N#list`
- 認証: `/Users/rikubon50/Desktop/eagles-mvp/.env.local` の `MICROCMS_SERVICE_DOMAIN`(=eagles-mvp) / `MICROCMS_API_KEY`。各値は個別grep抽出。

すべての `node`/`curl` コマンドは作業ディレクトリ `/Users/rikubon50/Desktop/eagles-mvp` で実行し、
microCMS系コマンドは事前に環境変数を export すること:
```bash
export MICROCMS_SERVICE_DOMAIN=$(grep -E '^MICROCMS_SERVICE_DOMAIN=' .env.local | cut -d= -f2)
export MICROCMS_API_KEY=$(grep -E '^MICROCMS_API_KEY=' .env.local | cut -d= -f2)
```

---

## File Structure

- `tmp-roster-import/lib.mjs` — 共通: CSVパース・cohort変換・フィールドマッピング・Drive一覧パース・写真マッチング・microCMSヘルパ(upload/create/delete, 429バックオフ)。
- `tmp-roster-import/dryrun.mjs` — フェーズ1: データ取得→解析→マッチ→`match-table.json` 出力＋集計レポート。書き込み無し。
- `tmp-roster-import/run.mjs` — フェーズ2: プレースホルダ生成→カナリア→全件作成→ダミー削除。`results.json`で再開可能。
- `tmp-roster-import/data/` — 取得した `sheet.csv` / `drive.html` / `match-table.json` / `results.json` の置き場。
- アプリ本体(`src/`)の変更は無し（プレースホルダ割当でphoto常時埋まるため）。

---

## Task 1: スキャフォールド＋データ取得

**Files:**
- Create: `tmp-roster-import/data/` (dir)
- Create: `tmp-roster-import/fetch-data.mjs`

- [ ] **Step 1: ディレクトリ作成**

```bash
mkdir -p tmp-roster-import/data
```

- [ ] **Step 2: スプシCSVとDrive一覧HTMLを取得**

`tmp-roster-import/fetch-data.mjs`:
```js
import {writeFileSync} from 'fs';
const SHEET="151EoQn5ZSvtvlYnzQEDVLRJXmwkJINlI21Lgo37dWG0";
const FOLDER="1qub3RgHrUWdzm6qjni2KzXfGoLXlnI0N";
const csv=await (await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv`)).text();
writeFileSync("tmp-roster-import/data/sheet.csv", csv);
const html=await (await fetch(`https://drive.google.com/embeddedfolderview?id=${FOLDER}#list`)).text();
writeFileSync("tmp-roster-import/data/drive.html", html);
console.log("sheet bytes:", csv.length, "| drive bytes:", html.length);
```

Run: `node tmp-roster-import/fetch-data.mjs`
Expected: `sheet bytes: ~19000 | drive bytes: ~51000`

- [ ] **Step 3: Commit**

```bash
git add tmp-roster-import/fetch-data.mjs
git commit -m "chore(roster-import): スプシ/Driveのデータ取得スクリプト"
```

---

## Task 2: 共通ライブラリ (CSVパース・マッピング・Drive一覧・microCMSヘルパ)

**Files:**
- Create: `tmp-roster-import/lib.mjs`

- [ ] **Step 1: lib.mjs を作成**

`tmp-roster-import/lib.mjs`:
```js
import {readFileSync} from 'fs';
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const DOMAIN=process.env.MICROCMS_SERVICE_DOMAIN, KEY=process.env.MICROCMS_API_KEY;

// --- CSV パース (引用符・改行入りセル対応) ---
export function parseCSV(text){
  const rows=[];let f=[],cur="",q=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}
    else{if(ch==='"')q=true;else if(ch===','){f.push(cur);cur="";}
      else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;f.push(cur);rows.push(f);f=[];cur="";}
      else cur+=ch;}}
  if(cur!==""||f.length){f.push(cur);rows.push(f);}
  return rows.filter(r=>r.some(c=>c.trim()!==""));
}

// --- 学年(例 "1年") → cohort (FY2026: 41 - 学年) ---
export function gradeToCohort(gradeStr){
  const g=Number(String(gradeStr).replace(/[^0-9]/g,""));
  if(!(g>=1&&g<=4)) return null;
  return 41 - g;
}

// --- スプシ列 → microCMS フィールド (列の順序固定) ---
// 0:timestamp 1:name(漢字) 2:alphabet 3:学年 4:faculty 5:highschool 6:sports
// 7:favoriteWord(Eaglesの好きなところ) 8:hobby 9:rolemodel 10:animal 11:islandItem 12:alternativePath 13:comment
export function rowToPlayer(r){
  const t=v=>(v||"").trim();
  return {
    name:t(r[1]), alphabet:t(r[2]), cohort:gradeToCohort(r[3]), grade:Number(String(r[3]).replace(/[^0-9]/g,"")),
    faculty:t(r[4]), highschool:t(r[5]), sports:t(r[6]), favoriteWord:t(r[7]), hobby:t(r[8]),
    rolemodel:t(r[9]), animal:t(r[10]), islandItem:t(r[11]), alternativePath:t(r[12]), comment:t(r[13]),
  };
}
export function loadPlayers(csvPath="tmp-roster-import/data/sheet.csv"){
  const rows=parseCSV(readFileSync(csvPath,"utf8"));
  return rows.slice(1).filter(r=>r[1]&&r[1].trim()).map(rowToPlayer);
}

// --- Drive embeddedfolderview から {name, id} を DOM順で抽出 ---
export function loadDriveFiles(htmlPath="tmp-roster-import/data/drive.html"){
  const html=readFileSync(htmlPath,"utf8");
  // 各エントリ: id="entry-<FILEID>" ... flip-entry-title">NAME
  const re=/id="entry-([A-Za-z0-9_-]{20,})"[\s\S]*?flip-entry-title">([^<]+)/g;
  const out=[];let m;
  while((m=re.exec(html))!==null) out.push({id:m[1], name:m[2].trim()});
  return out;
}
// Drive ファイル名 "2_佐藤そ" → {grade:2, surname:"佐藤", disambig:"そ"}
export function parseDriveName(name){
  const m=name.match(/^([1-4])_(.+)$/);
  if(!m) return null;
  const grade=Number(m[1]); const rest=m[2];
  // 姓は先頭の漢字連続、残りを区別文字とみなす(完全ではないのでマッチ側で吸収)
  return {grade, rest, raw:name};
}

// --- microCMS: メディアアップロード (429バックオフ) ---
export async function uploadMedia(buf, filename){
  let delay=700;
  for(let a=0;a<6;a++){
    const fd=new FormData();
    fd.append("file", new Blob([buf],{type:"image/jpeg"}), filename);
    const r=await fetch(`https://${DOMAIN}.microcms-management.io/api/v1/media`,
      {method:"POST",headers:{"X-MICROCMS-API-KEY":KEY},body:fd});
    if(r.ok){await sleep(700); return (await r.json()).url;}
    if(r.status===429){await sleep(delay); delay=Math.min(delay*2,20000); continue;}
    throw new Error(`media http ${r.status}: ${(await r.text()).slice(0,200)}`);
  }
  throw new Error("media upload failed after retries");
}

// --- microCMS: コンテンツ作成 (POST, 自動id) ---
export async function createPlayer(fields){
  let delay=1000;
  for(let a=0;a<6;a++){
    const r=await fetch(`https://${DOMAIN}.microcms.io/api/v1/players`,
      {method:"POST",headers:{"X-MICROCMS-API-KEY":KEY,"Content-Type":"application/json"},body:JSON.stringify(fields)});
    if(r.ok) return (await r.json()).id;
    if(r.status===429){await sleep(delay); delay=Math.min(delay*2,20000); continue;}
    throw new Error(`create http ${r.status}: ${(await r.text()).slice(0,300)}`);
  }
  throw new Error("create failed after retries");
}

// --- microCMS: コンテンツ削除 ---
export async function deletePlayer(id){
  const r=await fetch(`https://${DOMAIN}.microcms.io/api/v1/players/${id}`,
    {method:"DELETE",headers:{"X-MICROCMS-API-KEY":KEY}});
  if(!r.ok && r.status!==404) throw new Error(`delete http ${r.status}`);
  return true;
}

// --- Drive 画像ダウンロード (usercontent → thumbnail フォールバック) ---
export async function downloadDriveImage(id){
  const tryFetch=async(url)=>{
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});
    if(!r.ok) return null;
    const ct=r.headers.get("content-type")||"";
    if(ct.startsWith("text/")) return null; // interstitial
    const buf=Buffer.from(await r.arrayBuffer());
    return buf.length>1000?buf:null;
  };
  return (await tryFetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`))
      || (await tryFetch(`https://drive.google.com/thumbnail?id=${id}&sz=w2000`));
}
```

- [ ] **Step 2: パース健全性チェック**

Run:
```bash
node -e 'import("./tmp-roster-import/lib.mjs").then(L=>{const p=L.loadPlayers();const d=L.loadDriveFiles();console.log("players:",p.length,"| drive files:",d.length);console.log("sample player:",JSON.stringify(p[0]));console.log("sample drive:",JSON.stringify(d[0]));const g={};p.forEach(x=>g[x.grade]=(g[x.grade]||0)+1);console.log("grade dist:",JSON.stringify(g));})'
```
Expected: `players: ~70 | drive files: 64`、grade dist が `{1:30,2:19,3:9,4:13}` 近辺、sample player の cohort が 40。

- [ ] **Step 3: Commit**

```bash
git add tmp-roster-import/lib.mjs
git commit -m "feat(roster-import): 共通ライブラリ(CSV/マッピング/Drive/microCMSヘルパ)"
```

---

## Task 3: フェーズ1 ドライラン (写真マッチング＋マッチ表＋集計)

**Files:**
- Create: `tmp-roster-import/dryrun.mjs`

- [ ] **Step 1: dryrun.mjs を作成**

`tmp-roster-import/dryrun.mjs`:
```js
import {writeFileSync} from 'fs';
import {loadPlayers, loadDriveFiles} from './lib.mjs';

const players=loadPlayers();
const drive=loadDriveFiles();

// Drive を grade ごとにグループ化
const byGrade={};
for(const f of drive){const m=f.name.match(/^([1-4])_(.+)$/);if(!m)continue;
  (byGrade[m[1]]=byGrade[m[1]]||[]).push({...f, rest:m[2]});}

// マッチング: 同学年で、ファイル名 rest が選手の姓(name先頭)で始まる or 名前先頭2-3文字を含む
function matchPhoto(p){
  const cands=(byGrade[String(p.grade)]||[]);
  // 1) rest が name の先頭1-3文字いずれかに前方一致
  const exact=cands.filter(c=> p.name.startsWith(c.rest) || c.rest.startsWith(p.name.slice(0,1)) && p.name.startsWith(c.rest.replace(/[ぁ-ん]+$/,"")) );
  // 2) 姓(先頭の連続漢字、最大3字)で前方一致
  const surnameCands=cands.filter(c=>{
    const surnameKanji=c.rest.replace(/[ぁ-んァ-ン　 ]+$/,"");
    return surnameKanji && p.name.startsWith(surnameKanji);
  });
  const pool = surnameCands.length?surnameCands:exact;
  if(pool.length===1) return {photo:pool[0], ambiguous:false};
  if(pool.length>1) return {photo:null, ambiguous:true, candidates:pool.map(c=>c.name)};
  return {photo:null, ambiguous:false};
}

const usedPhotoIds=new Set();
const table=[];
for(const p of players){
  const r=matchPhoto(p);
  if(r.photo && !usedPhotoIds.has(r.photo.id)){usedPhotoIds.add(r.photo.id);}
  table.push({name:p.name, grade:p.grade, cohort:p.cohort,
    photoName:r.photo?r.photo.name:null, photoId:r.photo?r.photo.id:null,
    ambiguous:!!r.ambiguous, candidates:r.candidates||null});
}

// どの選手にも割り当てられなかった Drive 写真 (= フォーム未回答者など)
const orphanPhotos=drive.filter(f=>!usedPhotoIds.has(f.id) && /^[1-4]_/.test(f.name));

const matched=table.filter(t=>t.photoId).length;
const noPhoto=table.filter(t=>!t.photoId && !t.ambiguous);
const ambiguous=table.filter(t=>t.ambiguous);

writeFileSync("tmp-roster-import/data/match-table.json",
  JSON.stringify({table, orphanPhotos}, null, 1));

console.log("=== DRY RUN ===");
console.log("選手数:", players.length, "| Drive写真:", drive.length);
console.log("写真マッチ:", matched, "| 写真無し:", noPhoto.length, "| 曖昧:", ambiguous.length);
console.log("\n-- 曖昧(要確認) --");
for(const t of ambiguous) console.log(` ${t.grade}年 ${t.name} -> 候補: ${(t.candidates||[]).join(", ")}`);
console.log("\n-- 写真無し(→プレースホルダ) --");
console.log(noPhoto.map(t=>`${t.grade}年 ${t.name}`).join(" / "));
console.log("\n-- 未割当の写真(フォーム未回答 等) --");
console.log(orphanPhotos.map(f=>f.name).join(" / "));
```

- [ ] **Step 2: ドライラン実行**

Run: `node tmp-roster-import/dryrun.mjs`
Expected: マッチ約60、写真無しに1年の約10名、曖昧に `4年 北村...`、未割当に `4_倉林 / 4_小竹 / 4_川本`(と北村の片方)。

- [ ] **Step 3: マッチ表をユーザーに提示し確認・修正・承認を得る (ゲート)**

`tmp-roster-import/data/match-table.json` を要約提示。特に:
- 北村 な/ち の振り分け (北村尚士=なおし / 北村祐理=ゆうり)
- 1年 写真無しリスト
- 未割当写真 倉林/小竹/川本 = 写真＋姓のみ登録

ユーザーが確定した対応を `match-table.json` に手動反映 (北村の photoId 設定、未回答3名のエントリ追加)。

- [ ] **Step 4: Commit**

```bash
git add tmp-roster-import/dryrun.mjs
git commit -m "feat(roster-import): ドライラン(写真マッチ＋マッチ表＋集計)"
```

---

## Task 4: 画像DL→microCMSメディアUP の単発検証

**Files:** (検証のみ、新規ファイルなし)

- [ ] **Step 1: 1枚をDL→UPして往復確認**

Run (環境変数 export 済みで):
```bash
node -e 'import("./tmp-roster-import/lib.mjs").then(async L=>{const d=L.loadDriveFiles();const f=d[0];const buf=await L.downloadDriveImage(f.id);console.log("downloaded:",f.name,buf?buf.length:"FAIL","bytes");const url=await L.uploadMedia(buf,f.name+".jpg");console.log("uploaded:",url);const h=await fetch(url);console.log("verify:",h.status,h.headers.get("content-type"));})'
```
Expected: `downloaded: ... >5000 bytes`、`uploaded: https://images.microcms-assets.io/...`、`verify: 200 image/jpeg`。

DL失敗(thumbnailも不可)の場合はそのファイルのDrive共有設定を確認しログ化。

---

## Task 5: UPCOMINGプレースホルダ生成＋アップロード

**Files:**
- Create: `tmp-roster-import/make-placeholder.mjs`

- [ ] **Step 1: プレースホルダ(SVG→PNG不要、JPEGとしてアップロードするためsharp無しでSVGバイト直接UP)**

microCMSメディアはSVGも受け付ける。`make-placeholder.mjs`:
```js
import {writeFileSync} from 'fs';
import {uploadMedia} from './lib.mjs';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<rect width="600" height="800" fill="#0f6536"/>
<text x="300" y="380" fill="#ffffff" font-family="sans-serif" font-size="64" font-weight="bold" text-anchor="middle">UPCOMING</text>
<text x="300" y="450" fill="#bfe3cd" font-family="sans-serif" font-size="28" text-anchor="middle">COMING SOON</text>
</svg>`;
const buf=Buffer.from(svg,"utf8");
const url=await uploadMedia(buf,"upcoming-placeholder.svg");
writeFileSync("tmp-roster-import/data/placeholder.json", JSON.stringify({url}));
console.log("placeholder url:", url);
```

> 注: microCMSメディアがSVGを拒否(415)した場合は、`uploadMedia` のBlob typeを変えず、
> 代替として 600x800 単色JPEGを生成する必要がある。その際は Step 1' を使う。

- [ ] **Step 1' (フォールバック): SVGが不可ならCanvasでJPEG生成**

`node_modules` に `@napi-rs/canvas` 等が無ければ、最小手段として 1x1 緑JPEGを拡大利用するのではなく、
オンライン依存を避けるため SVG が通る前提で進める。415が出た場合のみユーザーに相談。

- [ ] **Step 2: 実行**

Run: `node tmp-roster-import/make-placeholder.mjs`
Expected: `placeholder url: https://images.microcms-assets.io/...`

- [ ] **Step 3: Commit**

```bash
git add tmp-roster-import/make-placeholder.mjs
git commit -m "feat(roster-import): UPCOMINGプレースホルダ生成"
```

---

## Task 6: カナリア作成 (スキーマ/画像フィールド検証)

**Files:**
- Create: `tmp-roster-import/run.mjs` (まずカナリアのみ動作)

- [ ] **Step 1: run.mjs の骨格＋カナリア**

`tmp-roster-import/run.mjs`:
```js
import {readFileSync, writeFileSync, existsSync} from 'fs';
import {loadPlayers, downloadDriveImage, uploadMedia, createPlayer, deletePlayer, sleep} from './lib.mjs';

const CANARY=process.argv.includes("--canary");
const placeholder=JSON.parse(readFileSync("tmp-roster-import/data/placeholder.json","utf8")).url;
const {table, orphanPhotos}=JSON.parse(readFileSync("tmp-roster-import/data/match-table.json","utf8"));
const players=loadPlayers();
const byName=new Map(players.map(p=>[p.name,p]));
const RES="tmp-roster-import/data/results.json";
let results=existsSync(RES)?JSON.parse(readFileSync(RES,"utf8")):{};
const save=()=>writeFileSync(RES,JSON.stringify(results,null,1));

// 全フィールドを送る候補。カナリアで400なら不正キーを除外。
function buildFields(p, photoUrl){
  const f={name:p.name, cohort:p.cohort, photo:photoUrl};
  for(const k of ["alphabet","faculty","highschool","sports","favoriteWord","hobby","rolemodel","animal","islandItem","alternativePath","comment"]){
    if(p[k]) f[k]=p[k];
  }
  return f;
}

async function photoFor(row){
  if(row.photoId){const buf=await downloadDriveImage(row.photoId); if(buf) return await uploadMedia(buf,(row.photoName||"p")+".jpg");}
  return placeholder;
}

if(CANARY){
  const row=table.find(t=>t.photoId); // 写真ありの1名
  const p=byName.get(row.name);
  const url=await photoFor(row);
  const fields=buildFields(p,url);
  console.log("canary fields keys:", Object.keys(fields).join(","));
  const id=await createPlayer(fields);
  console.log("created id:", id);
  // GETして永続化を確認
  const D=process.env.MICROCMS_SERVICE_DOMAIN,K=process.env.MICROCMS_API_KEY;
  const got=await (await fetch(`https://${D}.microcms.io/api/v1/players/${id}`,{headers:{"X-MICROCMS-API-KEY":K}})).json();
  console.log("persisted keys:", Object.keys(got).join(","));
  console.log("photo url:", got.photo?.url||"NONE");
  results[row.name]={id, canary:true};
  save();
  process.exit(0);
}
```

- [ ] **Step 2: カナリア実行 (環境変数export済み)**

Run: `node tmp-roster-import/run.mjs --canary`
Expected: `created id: ...`、`persisted keys:` に name/cohort/photo/alphabet/faculty 等が含まれる、`photo url:` が microcms-assets。

- [ ] **Step 3: 400が出た場合の調整**

`create http 400` のメッセージに不正フィールド名が出る。`buildFields` の対象配列から該当キーを削除して再実行。
成功するまで繰り返す。確定した有効フィールド集合をコメントで run.mjs に記録。

- [ ] **Step 4: Commit**

```bash
git add tmp-roster-import/run.mjs
git commit -m "feat(roster-import): カナリア作成でスキーマ/画像フィールド検証"
```

---

## Task 7: 全件作成 (本番)

**Files:**
- Modify: `tmp-roster-import/run.mjs` (全件ループ追加)

- [ ] **Step 1: 全件作成ロジックを追加 (CANARYブロックの後)**

`tmp-roster-import/run.mjs` に追記:
```js
// --- 全件作成 ---
log: {} // (no-op marker)
const allRows=[...table];
// 未回答3名(orphan)を姓のみで登録: match-table.json に手動追加済みのものを優先。
// 手動追加が無ければ orphanPhotos からエントリ化(name=姓, grade=ファイル名先頭)。
for(const f of orphanPhotos){
  const m=f.name.match(/^([1-4])_(.+)$/); if(!m) continue;
  const surname=m[2].replace(/[ぁ-んァ-ン　 ]+$/,"");
  if(allRows.some(r=>r.photoId===f.id)) continue;
  allRows.push({name:surname, grade:Number(m[1]), cohort:41-Number(m[1]), photoId:f.id, photoName:f.name, orphan:true});
}

let created=0, failed=0;
for(const row of allRows){
  if(results[row.name]?.id){continue;} // 再開スキップ(カナリア含む)
  try{
    const p = byName.get(row.name) || {name:row.name, cohort:row.cohort}; // orphanは最小情報
    const url = await photoFor(row);
    const fields = buildFields(p, url);
    const id = await createPlayer(fields);
    results[row.name]={id, photo:url, orphan:!!row.orphan};
    created++;
    console.log(`created ${created}: ${row.name} (${row.cohort}期) photo=${url.includes("placeholder")?"PLACEHOLDER":"ok"}`);
  }catch(e){
    failed++; results[row.name]={error:e.message};
    console.log(`FAIL ${row.name}: ${e.message}`);
  }
  save(); await sleep(300);
}
console.log(`=== DONE created=${created} failed=${failed} total=${allRows.length} ===`);
```
(注: 先頭の `log: {}` 行は誤り。実装時は入れないこと。CANARYブロックの `process.exit(0)` の後ろにこの本体を置く。)

- [ ] **Step 2: 全件作成を実行**

Run: `node tmp-roster-import/run.mjs`
Expected: `created=~73 failed=0`。各行に作成ログ。

- [ ] **Step 3: microCMS件数確認**

Run:
```bash
node -e 'const D=process.env.MICROCMS_SERVICE_DOMAIN,K=process.env.MICROCMS_API_KEY;fetch(`https://${D}.microcms.io/api/v1/players?limit=0`,{headers:{"X-MICROCMS-API-KEY":K}}).then(r=>r.json()).then(j=>console.log("totalCount:",j.totalCount))'
```
Expected: `totalCount: ~80` (実選手約73 + ダミー7、削除前)。

- [ ] **Step 4: Commit**

```bash
git add tmp-roster-import/run.mjs
git commit -m "feat(roster-import): 全選手をmicroCMSへ作成"
```

---

## Task 8: ダミー7件の削除 (姓名ガード付き)

**Files:**
- Create: `tmp-roster-import/delete-dummies.mjs`

- [ ] **Step 1: delete-dummies.mjs を作成**

`tmp-roster-import/delete-dummies.mjs`:
```js
import {deletePlayer} from './lib.mjs';
const D=process.env.MICROCMS_SERVICE_DOMAIN,K=process.env.MICROCMS_API_KEY;
const DRY=!process.argv.includes("--go");
const j=await (await fetch(`https://${D}.microcms.io/api/v1/players?limit=100`,{headers:{"X-MICROCMS-API-KEY":K}})).json();
const dummies=j.contents.filter(c=>c.name==="舩井陸太"); // ガード: 舩井陸太 のみ
console.log("dummy candidates:", dummies.length, dummies.map(d=>d.id).join(","));
if(DRY){console.log("DRY (use --go to delete)");process.exit(0);}
for(const d of dummies){await deletePlayer(d.id);console.log("deleted",d.id);}
console.log("done");
```

- [ ] **Step 2: ドライラン確認**

Run: `node tmp-roster-import/delete-dummies.mjs`
Expected: `dummy candidates: 7 ...`、`DRY`。件数が7であることを必ず確認。

- [ ] **Step 3: 削除実行**

Run: `node tmp-roster-import/delete-dummies.mjs --go`
Expected: `deleted ...` ×7、`done`。

- [ ] **Step 4: Commit**

```bash
git add tmp-roster-import/delete-dummies.mjs
git commit -m "feat(roster-import): ダミー7件を削除(姓名ガード付き)"
```

---

## Task 9: ライブサイト検証

**Files:** (検証のみ)

- [ ] **Step 1: microCMS最終件数**

Run:
```bash
node -e 'const D=process.env.MICROCMS_SERVICE_DOMAIN,K=process.env.MICROCMS_API_KEY;fetch(`https://${D}.microcms.io/api/v1/players?limit=100`,{headers:{"X-MICROCMS-API-KEY":K}}).then(r=>r.json()).then(j=>{console.log("total:",j.totalCount);const g={};j.contents.forEach(c=>g[c.cohort]=(g[c.cohort]||0)+1);console.log("cohort dist:",JSON.stringify(g));console.log("舩井陸太 残:",j.contents.filter(c=>c.name==="舩井陸太").length);console.log("photo無:",j.contents.filter(c=>!c.photo).length);})'
```
Expected: `total: ~73`、cohort分布が 37/38/39/40 に分散、舩井陸太残=0、photo無=0。

- [ ] **Step 2: ライブサイトのロスターHTML確認 (ISR 5分。必要なら待つ)**

Run:
```bash
curl -s -A "Mozilla/5.0" https://eagles-mvp-c8m4.vercel.app/roster | grep -oE '(37|38|39|40)期' | sort | uniq -c
curl -s -A "Mozilla/5.0" https://eagles-mvp-c8m4.vercel.app/roster | grep -oc 'microcms-assets.io'
```
Expected: 各期ラベルが出現、microcms-assets画像が多数。

- [ ] **Step 3: 詳細ページが壊れないこと (写真有/プレースホルダ各1名)**

`results.json` から id を2件選び:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://eagles-mvp-c8m4.vercel.app/roster/<ID>
```
Expected: 両方 `200`。

- [ ] **Step 4: 後始末をユーザーに確認**

`tmp-roster-import/` を残すか削除するか確認。`results.json` は再実行防止に有用なため、削除前に方針確認。

---

## Self-Review

- **Spec coverage:** ゴール(投入＋ダミー削除)=Task7,8。フィールド対応=Task2 `rowToPlayer`/`buildFields`。cohort変換=Task2 `gradeToCohort`。写真マッチ=Task3。プレースホルダ=Task5。スキーマ検証=Task6カナリア。フォーム未回答3名=Task7 orphan処理。レート制限/429=Task2ヘルパ。再開可能/ログ=run.mjs results.json。ダミー誤削除防止=Task8 姓名ガード。ライブ検証=Task9。全要件カバー。
- **Placeholder scan:** Task7 Step1の `log: {}` は意図的な誤り注記付き(実装時除外)。それ以外に未確定の "TBD" は無し。SVG拒否時のフォールバック(Task5 Step1')のみ条件分岐として残すが、発生時はユーザー相談と明記。
- **Type consistency:** `loadPlayers`/`loadDriveFiles`/`uploadMedia`/`createPlayer`/`deletePlayer`/`downloadDriveImage`/`buildFields`/`photoFor` の名称・引数は Task間で一致。match-table.json の構造(`{table, orphanPhotos}`、各行 `{name,grade,cohort,photoName,photoId,ambiguous,candidates}`)は Task3生成→Task6,7消費で一致。
