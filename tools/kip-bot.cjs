// Kip the Barista difficulty bot: plays the real game build headless, Rottnest Day 1, with 3 player profiles.
// usage: node tools/kip-bot.cjs <url> <runsPerProfile> [parallel]
const {chromium}=require('playwright');
const URL=process.argv[2], N=+process.argv[3]||12, PAR=+process.argv[4]||6, WARP=+process.env.WARP||5;
const PROFILES={
 careful:{R:3,T:1.0,L:4,eTill:.02,eStep:.03,forget:.05},
 casual:{R:5,T:1.6,L:8,eTill:.06,eStep:.08,forget:.25},
 sloppy:{R:7,T:2.3,L:12,eTill:.12,eStep:.15,forget:.40}};
const INIT=`(()=>{const W=${WARP};const pn=performance.now.bind(performance),t0=pn();performance.now=()=>t0+(pn()-t0)*W;
 const dn=Date.now,d0=dn();Date.now=()=>d0+(dn()-d0)*W;const st=window.setTimeout;window.setTimeout=(f,ms,...a)=>st(f,(ms||0)/W,...a);
 const si=window.setInterval;window.setInterval=(f,ms,...a)=>si(f,(ms||0)/W,...a);
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(performance.now()));
 try{localStorage.clear();localStorage.setItem('kip.lang',JSON.stringify('en'))}catch(e){}})();`;
function botSrc(P){return `(async()=>{const P=${JSON.stringify(P)};const K=window.__kip,S=K.S;const $=s=>document.querySelector(s);
 const wait=s=>new Promise(r=>setTimeout(r,s*1000*(0.7+Math.random()*0.6)));const tap=async id=>{await wait(P.T);const b=$('#'+id);if(b)b.click()};
 const log=[];let first=true;
 while(true){ if(!$('#ovEnd').hidden){break}
  if(S.phase==='till'&&S.cust&&!$('#orderBubble').classList.contains('off')){const c=S.cust,o=c.o,idx=S.custIdx;const st0=S.starsTotal;
   await wait(P.R+(first?P.L:0));first=false;const d=K.DR[o.drink];
   let size=o.size,milk=o.milk;const SZ=['S','M','L'],MK=['full','oat'];
   if(d.size&&Math.random()<P.eTill)size=SZ.filter(x=>x!==o.size)[Math.floor(Math.random()*2)];
   if(d.milk&&Math.random()<P.eTill)milk=MK.filter(x=>x!==o.milk)[0];
   await tap('dr-'+o.drink); if(d.size&&size!=='M')await tap('sz-'+size); if(d.milk&&milk!=='full')await tap('mk-'+milk);
   await tap('charge');
   const r=K.recipe(S.ticket);const needJug=r.some(x=>x==='silk'||x==='foam');
   let jugDone=false;
   for(let tries=0;tries<3&&S.phase==='make';tries++){
     let bad=false;
     for(const s of r){ if(S.phase!=='make')break;
       if((s==='silk'||s==='foam')&&!jugDone){ if(Math.random()<P.forget){await tap('ac-'+s);} await tap('jg-'+S.ticket.milk);jugDone=true;}
       if(Math.random()<P.eStep){const all=['shot','water','silk','foam','dust'].filter(x=>x!==s);await tap('ac-'+all[Math.floor(Math.random()*all.length)]);bad=true;break}
       await tap('ac-'+s);}
     if(bad&&S.phase==='make'){await wait(P.R*0.5);await tap('ac-bin');continue}
     break}
   if(S.phase==='make')await tap('ac-serve');
   await new Promise(r=>setTimeout(r,200));
   log.push({i:idx,drink:o.drink,got:S.starsTotal-st0,ord:JSON.stringify(o),tk:JSON.stringify(S.ticket),steps:S.cup.steps.join(','),ok:S.phase==='done'?1:0,left:Math.max(0,+(c.pat/c.max).toFixed(2)),walk:c.pat<=0?1:0});
  }
  await new Promise(r=>setTimeout(r,100));}
 const sv=+$('#eStats b').textContent.split('/')[0];const stars=[...document.querySelectorAll('#eStars path')].filter(p=>p.getAttribute('fill')==='#E8B24A').length;
 window.__res={stars,starsTotal:S.starsTotal,total:S.total,perfect:S.perfect,log};})()`;}
async function one(browser,name){const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.route(/\.(mp4|woff2?)$|fonts\.g/,r=>r.abort());
 await ctx.addInitScript(INIT);const p=await ctx.newPage();
 try{await p.goto(URL);await p.waitForFunction(()=>window.__kip,{timeout:20000});
  await p.evaluate(()=>document.querySelector('#bGo').click());await p.waitForTimeout(600);
  await p.evaluate(()=>document.querySelector('#bStart').click());
  await p.evaluate(botSrc(PROFILES[name]));
  await p.waitForFunction(()=>window.__res,{timeout:180000,polling:500});
  const r=await p.evaluate(()=>window.__res);await ctx.close();return r;}catch(e){await ctx.close();return {err:String(e).slice(0,120)}}}
(async()=>{const b=await chromium.launch();const jobs=[];for(const n of (process.env.PROF?process.env.PROF.split(","):Object.keys(PROFILES)))for(let i=0;i<N;i++)jobs.push(n);
 const out={};let k=0;async function worker(){while(k<jobs.length){const n=jobs[k++];const r=await one(b,n);(out[n]=out[n]||[]).push(r)}}
 await Promise.all(Array.from({length:PAR},worker));await b.close();
 const sum={};for(const [n,rs] of Object.entries(out)){const ok=rs.filter(r=>!r.err);const d=[0,0,0,0];ok.forEach(r=>d[r.stars]++);
  const cust=ok.flatMap(r=>r.log);sum[n]={runs:ok.length,errs:rs.length-ok.length,day3:+(d[3]/ok.length).toFixed(2),day2plus:+((d[2]+d[3])/ok.length).toFixed(2),day1plus:+((d[1]+d[2]+d[3])/ok.length).toFixed(2),
   avgCustStars:+(ok.reduce((a,r)=>a+r.starsTotal/r.total,0)/ok.length).toFixed(2),walkouts:+(cust.filter(c=>c.walk).length/Math.max(1,cust.length)).toFixed(3),
   avgLeft:+(cust.reduce((a,c)=>a+c.left,0)/Math.max(1,cust.length)).toFixed(2),firstErr:rs.find(r=>r.err)?.err}}
 console.log(JSON.stringify(sum,null,1));require('fs').writeFileSync(process.env.OUT||'/tmp/kipbot-last.json',JSON.stringify(out));})();
