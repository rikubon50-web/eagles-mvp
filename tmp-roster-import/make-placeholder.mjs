import {writeFileSync} from 'fs';
import {uploadMedia} from './lib.mjs';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<rect width="600" height="800" fill="#0f6536"/>
<text x="300" y="380" fill="#ffffff" font-family="sans-serif" font-size="64" font-weight="bold" text-anchor="middle">UPCOMING</text>
<text x="300" y="450" fill="#bfe3cd" font-family="sans-serif" font-size="28" text-anchor="middle">COMING SOON</text>
</svg>`;
const buf=Buffer.from(svg,"utf8");
const url=await uploadMedia(buf,"upcoming-placeholder.svg");
writeFileSync("tmp-roster-import/data/placeholder.json", JSON.stringify({url}));
console.log("placeholder url:", url);
