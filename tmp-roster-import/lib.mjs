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
  const grade=Number(String(r[3]).replace(/[^0-9]/g,""));
  return {
    name:t(r[1]).replace(/[　 ]/g,""), alphabet:t(r[2]),
    grade: (grade>=1&&grade<=4)?grade:null, cohort: (grade>=1&&grade<=4)?(41-grade):null,
    faculty:t(r[4]), highschool:t(r[5]), sports:t(r[6]), favoriteWord:t(r[7]), hobby:t(r[8]),
    comment:t(r[13]),
    role:t(r[14]), univ:t(r[15]), career:t(r[16]), achievement:t(r[17]), position:t(r[18]), organization:t(r[19]),
  };
}
export function loadPlayers(csvPath="tmp-roster-import/data/sheet.csv"){
  const rows=parseCSV(readFileSync(csvPath,"utf8"));
  return rows.slice(1).filter(r=>r[1]&&r[1].trim()).map(rowToPlayer);
}

// --- Drive embeddedfolderview から {name, id} を DOM順で抽出 ---
export function loadDriveFiles(htmlPath="tmp-roster-import/data/drive.html"){
  const html=readFileSync(htmlPath,"utf8");
  const re=/id="entry-([A-Za-z0-9_-]{20,})"[\s\S]*?flip-entry-title">([^<]+)/g;
  const out=[];let m;
  while((m=re.exec(html))!==null) out.push({id:m[1], name:m[2].trim()});
  return out;
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

import {execSync} from 'child_process';
import {writeFileSync as _wf, readFileSync as _rf} from 'fs';
// HEIC等(JPEG/PNG以外)は sips でJPEG化してからアップロード
export async function uploadMediaConverted(buf, filename){
  const jpeg = buf[0]===0xFF&&buf[1]===0xD8;
  const png  = buf[0]===0x89&&buf[1]===0x50;
  if(jpeg||png) return await uploadMedia(buf, filename);
  _wf("/tmp/rconv.in", buf);
  execSync("sips -s format jpeg /tmp/rconv.in --out /tmp/rconv.out.jpg", {stdio:"ignore"});
  const out=_rf("/tmp/rconv.out.jpg");
  return await uploadMedia(out, filename.replace(/\.[^.]+$/,"")+".jpg");
}
