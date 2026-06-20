import {writeFileSync} from 'fs';
import {loadPlayers, loadDriveFiles} from './lib.mjs';

const players=loadPlayers();
const drive=loadDriveFiles();

// Drive を grade別＋コーチ別にグループ化
const byGrade={}; const coachPhotos=[];
for(const f of drive){
  const mg=f.name.match(/^([1-4])_(.+)$/); const mc=f.name.match(/^C_(.+)$/);
  if(mg){(byGrade[mg[1]]=byGrade[mg[1]]||[]).push({...f, rest:mg[2]});}
  else if(mc){coachPhotos.push({...f, rest:mc[1]});}
}

// 漢字異体字の正規化 (旧字体/異体字 → 代表字)。姓の照合のみに使用。
const VARIANTS={"髙":"高","﨑":"崎","澤":"沢","邉":"辺","邊":"辺","齋":"斎","齊":"斉","德":"徳","廣":"広","濱":"浜","眞":"真","靑":"青","祐":"祐"};
const norm=s=>(s||"").replace(/[　 ]/g,"").split("").map(c=>VARIANTS[c]||c).join("");

// rest から姓(末尾のかな/空白を除いた漢字部)を取り出す
const surnameOf=rest=>rest.replace(/[ぁ-んァ-ンー　 ]+$/,"");

// マッチング: 同学年で、姓(ファイル名)が選手名の先頭に前方一致 (異体字正規化込み)
function matchPhoto(p){
  const cands=(byGrade[String(p.grade)]||[]);
  const pn=norm(p.name);
  const pool=cands.filter(c=>{const s=norm(surnameOf(c.rest)); return s && pn.startsWith(s);});
  if(pool.length===1) return {photo:pool[0], ambiguous:false};
  if(pool.length>1) return {photo:null, ambiguous:true, candidates:pool};
  return {photo:null, ambiguous:false};
}

// コーチ: C_姓 を名前に含む/前方一致
function matchCoach(p){
  const pn=norm(p.name);
  const pool=coachPhotos.filter(c=>{const s=norm(c.rest); return s && (pn.startsWith(s)||pn.includes(s));});
  if(pool.length===1) return {photo:pool[0], ambiguous:false};
  if(pool.length>1) return {photo:null, ambiguous:true, candidates:pool};
  return {photo:null, ambiguous:false};
}

const usedPhotoIds=new Set();
const table=[];
for(const p of players){
  const r=(p.role==="C")?matchCoach(p):matchPhoto(p);
  if(r.photo && !usedPhotoIds.has(r.photo.id)){usedPhotoIds.add(r.photo.id);}
  table.push({name:p.name, role:p.role, grade:p.grade, cohort:p.cohort,
    photoName:r.photo?r.photo.name:null, photoId:r.photo?r.photo.id:null,
    ambiguous:!!r.ambiguous, candidates:r.candidates?r.candidates.map(c=>c.name):null});
}

// どの選手にも割り当てられなかった Drive 写真
const orphanPhotos=drive.filter(f=>!usedPhotoIds.has(f.id) && /^([1-4]_|C_)/.test(f.name));

const matched=table.filter(t=>t.photoId).length;
const noPhoto=table.filter(t=>!t.photoId && !t.ambiguous);
const ambiguous=table.filter(t=>t.ambiguous);

writeFileSync("tmp-roster-import/data/match-table.json",
  JSON.stringify({table, orphanPhotos}, null, 1));

console.log("=== DRY RUN ===");
console.log("選手数:", players.length, "| Drive写真:", drive.length);
console.log("写真マッチ:", matched, "| 写真無し:", noPhoto.length, "| 曖昧:", ambiguous.length, "| 未割当写真:", orphanPhotos.length);
const rc={}; table.forEach(t=>rc[t.role]=(rc[t.role]||0)+1);
console.log("role分布:", JSON.stringify(rc));
console.log("\n-- 曖昧(要確認) --");
for(const t of ambiguous) console.log(` [${t.role}] ${t.name} -> 候補: ${(t.candidates||[]).join(", ")}`);
console.log("\n-- 写真無し(→プレースホルダ) --");
console.log(" "+noPhoto.map(t=>`[${t.role}] ${t.name}`).join(" / "));
console.log("\n-- 未割当の写真 --");
console.log(" "+orphanPhotos.map(f=>f.name).join(" / "));
