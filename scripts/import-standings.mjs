// scripts/import-standings.mjs
// 現行スプレッドシートCSVを Supabase standings_rows に投入する（1回限りの移行用）
// 実行: node scripts/import-standings.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const csvUrl = env.STANDINGS_CSV;
if (!url || !key || !csvUrl) {
  console.error("必要な環境変数が .env.local にありません");
  process.exit(1);
}

const res = await fetch(csvUrl);
if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
const text = await res.text();
const lines = text.trim().split(/\r?\n/);
const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
const rows = lines.slice(1).map((line) => {
  const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
  return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
});

const perBlockCount = { A: 0, B: 0 };
const records = rows
  .filter((r) => ["A", "B"].includes((r.block ?? "").toUpperCase()))
  .map((r) => {
    const block = r.block.toUpperCase();
    return {
      block,
      rank: parseInt(r.rank, 10) || 0,
      university: r.university,
      points: parseInt(r.points, 10) || 0,
      games: parseInt(r.games, 10) || 0,
      gf: parseInt(r.gf, 10) || 0,
      diff: parseInt(r.diff, 10) || 0,
      sort_order: perBlockCount[block]++,
    };
  });

const supabase = createClient(url, key, { auth: { persistSession: false } });
const del = await supabase.from("standings_rows").delete().neq("block", "");
if (del.error) throw del.error;
const ins = await supabase.from("standings_rows").insert(records);
if (ins.error) throw ins.error;
console.log(`投入完了: ${records.length}行 (A:${records.filter((r) => r.block === "A").length} / B:${records.filter((r) => r.block === "B").length})`);
