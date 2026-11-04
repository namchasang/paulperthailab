// Renders each #id block of an overlay HTML page to a transparent 1080x1920 PNG.
// node tools/overlays.cjs <page.html> <outdir> id1 id2 ...
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [html,dir,...ids]=process.argv.slice(2);const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+path.resolve(html));
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
for(const id of ids){await (await p.$('#'+id)).screenshot({path:path.join(dir,id+'.png'),omitBackground:true});}
await b.close();})();
