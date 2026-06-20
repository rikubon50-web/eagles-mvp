import {deletePlayer, DOMAIN, KEY, sleep} from './lib.mjs';
const DRY=!process.argv.includes("--go");
let all=[],off=0,total=1;
while(off<total){
  const j=await(await fetch(`https://${DOMAIN}.microcms.io/api/v1/players?limit=100&offset=${off}&fields=id,name`,{headers:{"X-MICROCMS-API-KEY":KEY}})).json();
  total=j.totalCount; all.push(...j.contents); off+=100;
}
console.log("削除対象:",all.length,"件");
if(DRY){console.log("DRY (use --go to delete)");process.exit(0);}
let n=0;
for(const c of all){ await deletePlayer(c.id); n++; if(n%20===0)console.log(" deleted",n); await sleep(120); }
console.log("wiped",n);
