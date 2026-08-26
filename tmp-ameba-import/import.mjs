// アメブロ(agulax13)の未反映記事を microCMS blog に取り込む差分同期スクリプト。
// 既定はドライラン。 WRITE=1 で実行。 LIMIT=n で件数制限（テスト用）。
//
// 使い方:
//   node tmp-ameba-import/import.mjs              # ドライラン（対象一覧の表示のみ）
//   LIMIT=1 WRITE=1 node tmp-ameba-import/import.mjs   # 最古の1件だけ投入（テスト）
//   WRITE=1 node tmp-ameba-import/import.mjs      # 全件投入
//
// 再実行安全: サイト側に同タイトル（空白無視で比較）があれば自動スキップ。
import fs from "fs";

const ROOT = "/Users/rikubon50/Desktop/eagles-mvp";
const env = fs.readFileSync(`${ROOT}/.env.local`, "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const WRITE = process.env.WRITE === "1";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const UA = { "User-Agent": "Mozilla/5.0 (compatible; eagles-mvp-import)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || "").replace(/\s/g, "").normalize("NFKC");

// --- microCMS 側の既存タイトル（全件） ---
async function fetchSiteTitles() {
  const titles = new Set();
  for (let offset = 0; ; offset += 100) {
    const r = await fetch(
      `https://${DOMAIN}.microcms.io/api/v1/blog?limit=100&offset=${offset}&fields=title`,
      { headers: { "X-MICROCMS-API-KEY": KEY } }
    );
    const j = await r.json();
    for (const c of j.contents) titles.add(norm(c.title));
    if (offset + 100 >= j.totalCount) break;
    await sleep(200);
  }
  return titles;
}

// --- アメブロ記事ページから本文HTML等を抽出 ---
async function fetchAmebaEntry(id) {
  const r = await fetch(`https://ameblo.jp/agulax13/entry-${id}.html`, { headers: UA });
  if (!r.ok) throw new Error(`ameba http ${r.status} for entry ${id}`);
  const html = await r.text();
  const m = html.match(/window\.INIT_DATA\s*=\s*({.*?});/s);
  if (!m) throw new Error(`INIT_DATA not found for entry ${id}`);
  const e = JSON.parse(m[1]).entryState.entryMap[String(id)];
  if (!e || !e.entry_text) throw new Error(`entry_text not found for entry ${id}`);
  return e;
}

// --- 画像ダウンロード（stat.ameba.jp のフル解像度） ---
async function downloadImage(url) {
  const clean = url.replace(/\?.*$/, ""); // ?caw=800 等を除去しフル解像度取得
  const r = await fetch(clean, { headers: UA });
  if (!r.ok) throw new Error(`img http ${r.status}: ${clean}`);
  return Buffer.from(await r.arrayBuffer());
}

// --- microCMS メディアアップロード（tmp-roster-import/lib.mjs と同方式、429バックオフ） ---
async function uploadMedia(buf, filename) {
  let delay = 700;
  for (let a = 0; a < 6; a++) {
    const fd = new FormData();
    const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";
    fd.append("file", new Blob([buf], { type }), filename);
    const r = await fetch(`https://${DOMAIN}.microcms-management.io/api/v1/media`, {
      method: "POST", headers: { "X-MICROCMS-API-KEY": KEY }, body: fd,
    });
    if (r.ok) { await sleep(700); return (await r.json()).url; }
    if (r.status === 429) { await sleep(delay); delay = Math.min(delay * 2, 20000); continue; }
    throw new Error(`media http ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
  throw new Error("media upload failed after retries");
}

// --- サムネイル用整形: blogスキーマの制約（1280x720固定）に合わせて中央クロップ ---
import { execFileSync } from "child_process";
function resizeTo1280(buf, entryId) {
  const tmp = `${ROOT}/tmp-ameba-import/data/thumb-${entryId}.jpg`;
  fs.writeFileSync(tmp, buf);
  // 元画像のアスペクト比に応じて、両辺が1280x720を覆うようにリサイズしてから中央クロップ
  const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", tmp]).toString();
  const w = Number(info.match(/pixelWidth: (\d+)/)[1]);
  const h = Number(info.match(/pixelHeight: (\d+)/)[1]);
  if (w / h > 1280 / 720) {
    execFileSync("sips", ["--resampleHeight", "720", tmp], { stdio: "ignore" });
  } else {
    execFileSync("sips", ["--resampleWidth", "1280", tmp], { stdio: "ignore" });
  }
  execFileSync("sips", ["--cropToHeightWidth", "720", "1280", tmp], { stdio: "ignore" });
  const out = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  return out;
}

// --- 本文変換: アメブロ画像を microCMS アセットに差し替え ---
// パターン1: <a href="https://stat.ameba.jp/user_images/....jpg"><img ...></a>（遅延読み込み）
// パターン2: <img src="https://stat.ameba.jp/user_images/..."> 直置き
async function transformBody(body, entryId) {
  const uploaded = new Map(); // 元URL(クエリ除去) -> microCMS URL
  let thumbnail = null; // 最初の画像を幅1280pxにリサイズした別アップロード
  let idx = 0;

  async function replaceUrl(orig) {
    const cleanUrl = orig.replace(/\?.*$/, "");
    if (!uploaded.has(cleanUrl)) {
      const buf = await downloadImage(cleanUrl);
      const ext = cleanUrl.match(/\.png$/i) ? "png" : "jpg";
      idx += 1;
      const url = await uploadMedia(buf, `ameba-${entryId}-${idx}.${ext}`);
      uploaded.set(cleanUrl, url);
      if (!thumbnail) {
        thumbnail = await uploadMedia(resizeTo1280(buf, entryId), `ameba-${entryId}-thumb.jpg`);
      }
    }
    return uploaded.get(cleanUrl);
  }

  // パターン1: aタグ全体を単純な img に置換
  const linkRe = /<a\s+href="(https:\/\/stat\.ameba\.jp\/user_images\/[^"]+?\.(?:jpe?g|png)(?:\?[^"]*)?)"[^>]*>\s*<img[^>]*>\s*<\/a>/gi;
  const linkMatches = [...body.matchAll(linkRe)];
  for (const m of linkMatches) {
    const url = await replaceUrl(m[1]);
    body = body.replace(m[0], `<img src="${url}" alt="">`);
  }
  // パターン2: 直置き img の src を差し替え
  const imgRe = /<img([^>]*?)src="(https:\/\/stat\.ameba\.jp\/user_images\/[^"]+?)"([^>]*)>/gi;
  const imgMatches = [...body.matchAll(imgRe)];
  for (const m of imgMatches) {
    const url = await replaceUrl(m[2]);
    body = body.replace(m[0], `<img src="${url}" alt="">`);
  }
  // 残った遅延読み込みプレースホルダ（data:image/svg）はリンク先が画像でなかった場合のみ。除去する
  body = body.replace(/<img[^>]*src="data:image\/svg[^"]*"[^>]*>/gi, "");
  return { body, thumbnail, imageCount: uploaded.size };
}

// --- microCMS 記事作成 + publishedAt 上書き ---
async function createPost(fields, publishedAt) {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blog`, {
    method: "POST",
    headers: { "X-MICROCMS-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!r.ok) throw new Error(`create http ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const id = (await r.json()).id;
  await sleep(500);
  // publishedAt をアメブロの元日時に上書き
  const p = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blog/${id}`, {
    method: "PATCH",
    headers: { "X-MICROCMS-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ publishedAt }),
  });
  const patchOk = p.ok;
  const patchMsg = patchOk ? "" : `patch http ${p.status}: ${(await p.text()).slice(0, 200)}`;
  await sleep(500);
  // 検証: 反映後の publishedAt を取得
  const g = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blog/${id}?fields=publishedAt`, {
    headers: { "X-MICROCMS-API-KEY": KEY },
  });
  const got = (await g.json()).publishedAt;
  return { id, patchOk, patchMsg, publishedAtResult: got };
}

// --- main ---
const missing = JSON.parse(fs.readFileSync(`${ROOT}/tmp-ameba-import/data/ameba-missing.json`, "utf8"))
  .sort((a, b) => a.datetime.localeCompare(b.datetime)); // 古い順

console.log(`microCMS既存タイトルを取得中...`);
const siteTitles = await fetchSiteTitles();
const todo = missing.filter((e) => !siteTitles.has(norm(e.title))).slice(0, LIMIT);
const skipped = missing.length - missing.filter((e) => !siteTitles.has(norm(e.title))).length;

console.log(`mode: ${WRITE ? "WRITE ✍️" : "DRY-RUN"} | 未反映候補 ${missing.length}件 / 既存スキップ ${skipped}件 / 実行対象 ${todo.length}件`);
if (!WRITE) {
  todo.forEach((e) => console.log(`  ${e.datetime.slice(0, 10)} ${e.title}`));
  console.log("\n※ ドライラン。WRITE=1 で実行してください。");
  process.exit(0);
}

let ok = 0, fail = 0;
const failures = [];
for (const [i, e] of todo.entries()) {
  try {
    const entry = await fetchAmebaEntry(e.id);
    const { body, thumbnail, imageCount } = await transformBody(entry.entry_text, e.id);
    const fields = {
      title: e.title,
      body,
      tags: ["ブログ"],
      ...(thumbnail ? { thumbnail } : {}),
    };
    const res = await createPost(fields, e.datetime);
    ok += 1;
    console.log(
      `[${i + 1}/${todo.length}] OK ${e.datetime.slice(0, 10)} ${e.title} ` +
      `(img:${imageCount}, id:${res.id}, publishedAt→${res.publishedAtResult}${res.patchOk ? "" : " ⚠️" + res.patchMsg})`
    );
    if (!res.patchOk) { failures.push({ title: e.title, error: res.patchMsg }); }
    await sleep(800);
  } catch (err) {
    fail += 1;
    failures.push({ title: e.title, error: String(err).slice(0, 300) });
    console.log(`[${i + 1}/${todo.length}] FAIL ${e.title}: ${String(err).slice(0, 200)}`);
    await sleep(1500);
  }
}
console.log(`\n完了: 成功 ${ok} / 失敗 ${fail}`);
if (failures.length) console.log(JSON.stringify(failures, null, 1));
