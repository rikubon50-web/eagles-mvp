import {writeFileSync} from 'fs';
const SHEET="151EoQn5ZSvtvlYnzQEDVLRJXmwkJINlI21Lgo37dWG0";
const FOLDER="1qub3RgHrUWdzm6qjni2KzXfGoLXlnI0N";
const csv=await (await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv`)).text();
writeFileSync("tmp-roster-import/data/sheet.csv", csv);
const html=await (await fetch(`https://drive.google.com/embeddedfolderview?id=${FOLDER}#list`)).text();
writeFileSync("tmp-roster-import/data/drive.html", html);
console.log("sheet bytes:", csv.length, "| drive bytes:", html.length);
