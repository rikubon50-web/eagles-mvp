import {readFileSync, writeFileSync} from 'fs';
import {loadDriveFiles} from './lib.mjs';

const path="tmp-roster-import/data/match-table.json";
const data=JSON.parse(readFileSync(path,"utf8"));
const drive=loadDriveFiles();
const byName=Object.fromEntries(drive.map(f=>[f.name,f]));

// 手動確定: 北村 な=尚士 / ち=祐理
const fixes={ "北村尚士":"4_北村な", "北村祐理":"4_北村ち" };
for(const row of data.table){
  if(fixes[row.name]){
    const f=byName[fixes[row.name]];
    row.photoName=f.name; row.photoId=f.id; row.ambiguous=false; row.candidates=null;
  }
}

// オーファン再計算: table で使用された photoId を除外
const used=new Set(data.table.filter(t=>t.photoId).map(t=>t.photoId));
data.orphanPhotos=drive.filter(f=>!used.has(f.id) && /^[1-4]_/.test(f.name));

writeFileSync(path, JSON.stringify(data,null,1));
console.log("北村 resolved.");
console.log("写真付き選手:", data.table.filter(t=>t.photoId).length, "| プレースホルダ:", data.table.filter(t=>!t.photoId).length);
console.log("曖昧残:", data.table.filter(t=>t.ambiguous).length);
console.log("オーファン(フォーム未回答):", data.orphanPhotos.map(f=>f.name).join(" / "));
