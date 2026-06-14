import {readFileSync, writeFileSync, existsSync} from 'fs';
import {execSync} from 'child_process';
import {uploadMedia, sleep, DOMAIN, KEY} from './lib.mjs';

const mt=JSON.parse(readFileSync("tmp-roster-import/data/match-table.json","utf8"));
const results=JSON.parse(readFileSync("tmp-roster-import/data/results.json","utf8"));
// name -> driveId (matched players)
const driveIdByName=new Map(mt.table.filter(t=>t.photoId).map(t=>[t.name,{id:t.photoId,name:t.photoName}]));

function isDisplayable(buf){
  const jpeg=buf[0]===0xFF&&buf[1]===0xD8;
  const png=buf[0]===0x89&&buf[1]===0x50;
  return jpeg||png;
}

async function patchPhoto(contentId, url){
  let delay=1000;
  for(let a=0;a<6;a++){
    const r=await fetch(`https://${DOMAIN}.microcms.io/api/v1/players/${contentId}`,
      {method:"PATCH",headers:{"X-MICROCMS-API-KEY":KEY,"Content-Type":"application/json"},body:JSON.stringify({photo:url})});
    if(r.ok) return true;
    if(r.status===429){await sleep(delay);delay=Math.min(delay*2,20000);continue;}
    throw new Error(`patch ${r.status}: ${(await r.text()).slice(0,150)}`);
  }
  throw new Error("patch failed");
}

async function downloadDrive(id){
  for(const url of [`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
                    `https://drive.google.com/uc?export=download&id=${id}`]){
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});
    if(!r.ok) continue;
    const ct=r.headers.get("content-type")||"";
    if(ct.startsWith("text/")) continue;
    const buf=Buffer.from(await r.arrayBuffer());
    if(buf.length>2000) return buf;
  }
  return null;
}

const j=await (await fetch(`https://${DOMAIN}.microcms.io/api/v1/players?limit=100`,{headers:{"X-MICROCMS-API-KEY":KEY}})).json();
let fixed=0, skipped=0, failed=0;
const LOGP="tmp-roster-import/data/fix-heic-log.json";
const log=existsSync(LOGP)?JSON.parse(readFileSync(LOGP,"utf8")):{};

for(const c of j.contents){
  const u=c.photo&&c.photo.url; if(!u||u.includes("placeholder")){skipped++;continue;}
  const cur=Buffer.from(await (await fetch(u)).arrayBuffer());
  if(isDisplayable(cur)){skipped++;continue;} // already JPEG/PNG
  const d=driveIdByName.get(c.name);
  if(!d){ console.log(`NO DRIVE ID for ${c.name} (current not displayable)`); failed++; continue; }
  try{
    const orig=await downloadDrive(d.id);
    if(!orig){throw new Error("drive download failed");}
    writeFileSync("/tmp/heicfix.in", orig);
    execSync("sips -s format jpeg /tmp/heicfix.in --out /tmp/heicfix.out.jpg", {stdio:"ignore"});
    const jpg=readFileSync("/tmp/heicfix.out.jpg");
    if(!isDisplayable(jpg)) throw new Error("conversion did not yield jpeg");
    const newUrl=await uploadMedia(jpg, (d.name||c.name)+".jpg");
    await patchPhoto(c.id, newUrl);
    fixed++;
    log[c.name]={id:c.id, newUrl, ts:""};
    console.log(`fixed ${fixed}: ${c.name} -> ${newUrl.split("/").pop()}`);
  }catch(e){ failed++; console.log(`FAIL ${c.name}: ${e.message}`); }
  writeFileSync(LOGP, JSON.stringify(log,null,1));
  await sleep(200);
}
console.log(`=== DONE fixed=${fixed} skipped(ok/placeholder)=${skipped} failed=${failed} ===`);
