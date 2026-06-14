import {writeFileSync} from 'fs';
import {loadPlayers, loadDriveFiles} from './lib.mjs';

const players=loadPlayers();
const drive=loadDriveFiles();

// Drive を grade ごとにグループ化
const byGrade={};
for(const f of drive){const m=f.name.match(/^([1-4])_(.+)$/);if(!m)continue;
  (byGrade[m[1]]=byGrade[m[1]]||[]).push({...f, rest:m[2]});}

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

const usedPhotoIds=new Set();
const table=[];
for(const p of players){
  const r=matchPhoto(p);
  if(r.photo && !usedPhotoIds.has(r.photo.id)){usedPhotoIds.add(r.photo.id);}
  table.push({name:p.name, grade:p.grade, cohort:p.cohort,
    photoName:r.photo?r.photo.name:null, photoId:r.photo?r.photo.id:null,
    ambiguous:!!r.ambiguous, candidates:r.candidates?r.candidates.map(c=>c.name):null});
}

// どの選手にも割り当てられなかった Drive 写真
const orphanPhotos=drive.filter(f=>!usedPhotoIds.has(f.id) && /^[1-4]_/.test(f.name));

const matched=table.filter(t=>t.photoId).length;
const noPhoto=table.filter(t=>!t.photoId && !t.ambiguous);
const ambiguous=table.filter(t=>t.ambiguous);

writeFileSync("tmp-roster-import/data/match-table.json",
  JSON.stringify({table, orphanPhotos}, null, 1));

console.log("=== DRY RUN ===");
console.log("選手数:", players.length, "| Drive写真:", drive.length);
console.log("写真マッチ:", matched, "| 写真無し:", noPhoto.length, "| 曖昧:", ambiguous.length, "| 未割当写真:", orphanPhotos.length);
console.log("\n-- 曖昧(要確認) --");
for(const t of ambiguous) console.log(` ${t.grade}年 ${t.name} -> 候補: ${(t.candidates||[]).join(", ")}`);
console.log("\n-- 写真無し(→プレースホルダ) --");
console.log(" "+noPhoto.map(t=>`${t.grade}年 ${t.name}`).join(" / "));
console.log("\n-- 未割当の写真(フォーム未回答 等) --");
console.log(" "+orphanPhotos.map(f=>f.name).join(" / "));
