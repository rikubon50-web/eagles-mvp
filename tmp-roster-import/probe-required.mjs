import {readFileSync} from 'fs';
import {DOMAIN, KEY} from './lib.mjs';
const ph=JSON.parse(readFileSync("tmp-roster-import/data/placeholder.json","utf8")).url;
const fields={name:"__probe__", cohort:37, year:["4"], photo:ph};
const required=[];
for(let i=0;i<15;i++){
  const r=await fetch(`https://${DOMAIN}.microcms.io/api/v1/players`,{method:"POST",headers:{"X-MICROCMS-API-KEY":KEY,"Content-Type":"application/json"},body:JSON.stringify(fields)});
  if(r.ok){const j=await r.json();console.log("PROBE created id",j.id);
    await fetch(`https://${DOMAIN}.microcms.io/api/v1/players/${j.id}`,{method:"DELETE",headers:{"X-MICROCMS-API-KEY":KEY}});
    console.log("PROBE deleted"); break;}
  const t=await r.text(); const m=t.match(/'([^']+)' field required/);
  if(m){ required.push(m[1]); fields[m[1]] = m[1]==="year" ? ["4"] : "ー"; console.log("required:",m[1]); }
  else { console.log("other error:",t); break; }
}
console.log("=== REQUIRED FIELDS:", JSON.stringify(required));
