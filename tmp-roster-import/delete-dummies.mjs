import {deletePlayer, DOMAIN, KEY} from './lib.mjs';
const DRY=!process.argv.includes("--go");
const j=await (await fetch(`https://${DOMAIN}.microcms.io/api/v1/players?limit=100`,{headers:{"X-MICROCMS-API-KEY":KEY}})).json();
const dummies=j.contents.filter(c=>c.name==="舩井陸太"); // ガード: 舩井陸太 のみ
console.log("total players:", j.totalCount, "| dummy(舩井陸太) candidates:", dummies.length);
console.log("ids:", dummies.map(d=>d.id).join(","));
if(DRY){ console.log("DRY (use --go to delete)"); process.exit(0); }
for(const d of dummies){ await deletePlayer(d.id); console.log("deleted", d.id); }
console.log("done");
