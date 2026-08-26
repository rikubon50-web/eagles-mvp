// tmp-games-migrate/migrate.mjs
// microCMS games 全件を Supabase games へ移行。id 保持・再実行安全（既存 id はスキップ）。
// 使い方: node tmp-games-migrate/migrate.mjs  (ドライラン) / WRITE=1 で実行
import fs from "fs";
const ROOT = "/Users/rikubon50/Desktop/eagles-mvp";
const env = fs.readFileSync(`${ROOT}/.env.local`, "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const MC_KEY = process.env.MICROCMS_API_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WRITE = process.env.WRITE === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) microCMS 全件
const all = [];
for (let offset = 0; ; offset += 100) {
  const r = await fetch(
    `https://eagles-mvp.microcms.io/api/v1/games?limit=100&offset=${offset}&orders=-startAt`,
    { headers: { "X-MICROCMS-API-KEY": MC_KEY } });
  const j = await r.json();
  all.push(...j.contents);
  if (offset + 100 >= j.totalCount) break;
  await sleep(200);
}
console.log(`microCMS: ${all.length}件`);

// 2) Supabase 側の既存 id
const sb = async (path, opts = {}) =>
  fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", ...(opts.headers || {}) },
  });
const existing = new Set();
for (let offset = 0; ; offset += 1000) {
  const r = await sb(`games?select=id&limit=1000&offset=${offset}`);
  const rows = await r.json();
  rows.forEach((x) => existing.add(x.id));
  if (rows.length < 1000) break;
}
const todo = all.filter((c) => !existing.has(c.id));
console.log(`mode: ${WRITE ? "WRITE" : "DRY-RUN"} | 既存 ${existing.size} / 投入対象 ${todo.length}`);
if (!WRITE) process.exit(0);

// 3) 100件ずつ bulk insert
let ok = 0;
const sanitize = (str) => (typeof str === "string" ? str.replace(/\0/g, "") : str);
for (let i = 0; i < todo.length; i += 100) {
  const batch = todo.slice(i, i + 100).map((c) => ({
    id: c.id,
    title: sanitize(c.title),
    start_at: c.startAt,
    venue: sanitize(c.venue ?? ""),
    opponent: sanitize(c.awayTeamName ?? ""),
    status: Array.isArray(c.status) ? c.status[0] ?? "scheduled" : c.status ?? "scheduled",
    our_score: c.ourScore ?? null,
    opp_score: c.oppScore ?? null,
    note: sanitize(c.text ?? ""),
    opponent_logo_url: c.awayTeamLogo?.url ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt ?? c.createdAt,
  }));
  const r = await sb("games", { method: "POST", body: JSON.stringify(batch) });
  if (!r.ok) throw new Error(`insert http ${r.status}: ${(await r.text()).slice(0, 300)}`);
  ok += batch.length;
  console.log(`${ok}/${todo.length}`);
  await sleep(300);
}
// 4) 件数照合
const cnt = await (await sb("games?select=id", { headers: { Prefer: "count=exact", Range: "0-0" } })).headers;
console.log("完了。games側件数ヘッダ:", cnt.get("content-range"));
