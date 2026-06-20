import {readFileSync, writeFileSync, existsSync} from 'fs';
import {loadPlayers, downloadDriveImage, uploadMediaConverted, createPlayer, sleep, DOMAIN, KEY} from './lib.mjs';

const CANARY=process.argv.includes("--canary");
const placeholder=JSON.parse(readFileSync("tmp-roster-import/data/placeholder.json","utf8")).url;
const {table, orphanPhotos}=JSON.parse(readFileSync("tmp-roster-import/data/match-table.json","utf8"));
const players=loadPlayers();
const byName=new Map(players.map(p=>[p.name,p]));
const RES="tmp-roster-import/data/results.json";
let results=existsSync(RES)?JSON.parse(readFileSync(RES,"utf8")):{};
const save=()=>writeFileSync(RES,JSON.stringify(results,null,1));

// スキーマ上の必須テキストフィールド(プローブで確定)。空なら "ー" で補完しないと400。
// rolemodel/animal/islandItem/alternativePath はスキーマに無い(400 "unexpected key")ため除外。
const REQUIRED_TEXT=["alphabet","faculty","highschool","sports","favoriteWord","hobby","comment"];
const OPTIONAL_NEW=["role","position","univ","career","achievement","organization"];
function buildFields(p, photoUrl){
  const isCoach = p.role==="C";
  const grade = isCoach ? 4 : (p.grade ?? (41 - p.cohort)); // year(必須select 1-4)用
  const cohort = isCoach ? 99 : p.cohort;                   // コーチはセンチネル
  const f={name:p.name, cohort, year:[String(grade)], photo:photoUrl};
  for(const k of REQUIRED_TEXT){ f[k] = (p[k] && p[k].trim()) ? p[k] : "ー"; }
  for(const k of OPTIONAL_NEW){ if(p[k] && p[k].trim()) f[k]=p[k]; }
  return f;
}

async function photoFor(row){
  if(row.photoId){ const buf=await downloadDriveImage(row.photoId); if(buf) return await uploadMediaConverted(buf,(row.photoName||"p")+".jpg"); }
  return placeholder;
}

if(CANARY){
  const row=table.find(t=>t.photoId);
  const p=byName.get(row.name);
  const url=await photoFor(row);
  const fields=buildFields(p,url);
  console.log("canary:", row.name, "| fields keys:", Object.keys(fields).join(","));
  const id=await createPlayer(fields);
  console.log("created id:", id);
  const got=await (await fetch(`https://${DOMAIN}.microcms.io/api/v1/players/${id}`,{headers:{"X-MICROCMS-API-KEY":KEY}})).json();
  console.log("persisted keys:", Object.keys(got).join(","));
  console.log("photo url:", got.photo?.url||"NONE");
  results[row.name]={id, photo:url, canary:true};
  save();
  process.exit(0);
}

// --- 全件作成 ---
const allRows=[...table];
// フォーム未回答(orphan)を 姓＋写真 で登録
for(const f of orphanPhotos){
  const m=f.name.match(/^([1-4])_(.+)$/); if(!m) continue;
  const surname=m[2].replace(/[ぁ-んァ-ンー　 ]+$/,"");
  if(allRows.some(r=>r.photoId===f.id)) continue;
  allRows.push({name:surname, grade:Number(m[1]), cohort:41-Number(m[1]), photoId:f.id, photoName:f.name, orphan:true});
}

let created=0, failed=0, skipped=0;
for(const row of allRows){
  if(results[row.name]?.id){ skipped++; continue; }
  try{
    const p = byName.get(row.name) || {name:row.name, cohort:row.cohort};
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
console.log(`=== DONE created=${created} skipped=${skipped} failed=${failed} total=${allRows.length} ===`);
