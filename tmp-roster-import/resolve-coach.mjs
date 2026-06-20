import {readFileSync, writeFileSync} from 'fs';
import {loadDriveFiles} from './lib.mjs';
const path="tmp-roster-import/data/match-table.json";
const data=JSON.parse(readFileSync(path,"utf8"));
const drive=loadDriveFiles(); const byName=Object.fromEntries(drive.map(f=>[f.name,f]));

// 手動確定（読み仮名/ニックネーム）
const fixes={
  "佐藤遼海":"1_佐藤は",  // Harumi
  "佐藤俊太":"1_佐藤し",  // Shunta
  "北村尚士":"4_北村な",  // Naoto
  "北村祐理":"4_北村ち",  // Yuri (ユーザー確定: ち=祐理)
  "関口智久":"C_ウルフ",  // ウルフ=関口
  "山本大介":"C_モナ",    // モナ=山本
};
for(const row of data.table){
  if(fixes[row.name]){const f=byName[fixes[row.name]];row.photoName=f.name;row.photoId=f.id;row.ambiguous=false;row.candidates=null;}
}
const used=new Set(data.table.filter(t=>t.photoId).map(t=>t.photoId));
data.orphanPhotos=drive.filter(f=>!used.has(f.id) && /^([1-4]_|C_)/.test(f.name));
writeFileSync(path, JSON.stringify(data,null,1));
const ph=data.table.filter(t=>!t.photoId);
console.log("解決完了。写真付き:",data.table.filter(t=>t.photoId).length,"/",data.table.length);
console.log("曖昧残:",data.table.filter(t=>t.ambiguous).length);
console.log("プレースホルダ:",ph.map(t=>`[${t.role}]${t.name}`).join(" / "));
console.log("未割当写真:",data.orphanPhotos.map(f=>f.name).join(" / ")||"なし");
