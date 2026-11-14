/* Prologue preview "Last Summer" (Paul, 14 Nov 2026): the island before the storm, the storm, the same island the morning after.
   Runs on the Island Builder engines with two maps: window.IB_PRO = {before, after}. Built by tools/makeeditor.py --prologue. */
(function(){const P=window.IB_PRO;if(!P||!window.__ED)return;const ED=window.__ED;
  let lang='th';
  const css=document.createElement('style');css.textContent=`
body.pro #top,body.pro #bar,body.pro #hud,body.pro #tray,body.pro #bubble,body.pro #confirm,body.pro #toast,body.pro #daynight,body.pro #menuBtn,body.pro #menu{display:none!important}
#proUI{position:fixed;inset:0;pointer-events:none;z-index:30;font-family:system-ui,sans-serif}
#proDark{position:absolute;inset:0;background:#0a1020;opacity:0;transition:opacity 2.5s}
#proRain{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.5s}
#proFlash{position:absolute;inset:0;background:#dfe8ff;opacity:0}
#proCap{position:absolute;left:0;right:0;top:38%;text-align:center;color:#fff;font:700 clamp(26px,6vw,46px)/1.25 Georgia,serif;text-shadow:0 2px 12px rgba(0,0,0,.6);opacity:0;transition:opacity 1.2s;padding:0 20px}
#proCap small{display:block;font:500 clamp(14px,3.4vw,19px) system-ui;opacity:.85;margin-top:6px}
#proSay{position:absolute;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(92vw,640px);background:rgba(20,26,46,.9);border:2px solid #f5ecd8;border-radius:14px;padding:12px 16px;color:#f5ecd8;opacity:0;transition:opacity .5s}
#proSay b{color:#ffd34d;display:block;font-size:14px;margin-bottom:3px}#proSay span{font-size:17px;line-height:1.4}
#proBtns{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:12px;display:flex;gap:8px;pointer-events:auto}
#proBtns button{border:2px solid #f5ecd8;background:rgba(20,26,46,.82);color:#f5ecd8;border-radius:10px;padding:8px 12px;font:700 14px system-ui}
#proEnd{position:absolute;inset:0;display:none;place-items:center;background:rgba(10,14,28,.55);pointer-events:auto}
#proEnd div{text-align:center;color:#fff}#proEnd button{margin:8px;border:0;border-radius:12px;padding:14px 22px;font:700 17px system-ui;background:#ffd34d;color:#141a2e}`;
  document.head.appendChild(css);document.body.classList.add('pro');
  const ui=document.createElement('div');ui.id='proUI';ui.innerHTML='<div id=proDark></div><canvas id=proRain></canvas><div id=proFlash></div><div id=proCap></div><div id=proSay><b></b><span></span></div><div id=proBtns><button id=proLang>EN</button><button id=proSkip>ข้าม ⏭</button></div><div id=proEnd><div><div style="font:700 28px Georgia,serif;margin-bottom:14px" id=proEndT></div><button id=proAgain>ดูอีกครั้ง ↺</button></div></div>';
  document.body.appendChild(ui);const $=id=>document.getElementById(id);
  /* rain */const rc=$('proRain'),rx=rc.getContext('2d');const drops=[];for(let i=0;i<260;i++)drops.push([Math.random(),Math.random(),.6+Math.random()*.6]);
  function rain(){rc.width=innerWidth;rc.height=innerHeight;rx.clearRect(0,0,rc.width,rc.height);rx.strokeStyle='rgba(200,215,255,.55)';rx.lineWidth=1.3;rx.beginPath();drops.forEach(d=>{d[1]+=.03*d[2];d[0]+=.008*d[2];if(d[1]>1){d[1]=0;d[0]=Math.random();}if(d[0]>1)d[0]-=1;const x=d[0]*rc.width,y=d[1]*rc.height;rx.moveTo(x,y);rx.lineTo(x+7*d[2],y+22*d[2]);});rx.stroke();}
  const T={th:{last:['ฤดูร้อนที่แล้ว',''],storm:['คืนนั้น พายุที่แรงที่สุดในรอบหลายสิบปี','พัดผ่านเกาะ'],after:['เช้าวันต่อมา',''],year:['หนึ่งปีต่อมา',''],end:'จบบทนำ · ต่อด้วยบท 1 เรือลำแรก',again:'ดูอีกครั้ง ↺',skip:'ข้าม ⏭'},
           en:{last:['Last summer',''],storm:['That night, the strongest storm in decades','swept across the island'],after:['The next morning',''],year:['One year later',''],end:'End of prologue · Chapter 1: The First Ferry',again:'Watch again ↺',skip:'Skip ⏭'}};
  const LINES={
    nonna1:['Nonna Shell','ช้า ๆ หลาน ชาหกเมื่อไหร่ ลูกค้ายิ้มน้อยลงหนึ่งคน','Slowly, dear. Every cup you spill is one less smile.'],
    kip1:['Kip','ร้านคุณยายคนเยอะทุกวันเลยเหรอครับ','Is it this busy every day, Nonna?'],
    nonna2:['Nonna Shell','ทุกวันตั้งแต่ยายยังสาว ร้านนี้ขายชาให้คนทั้งเกาะ','Every day since I was young. This place pours tea for the whole island.'],
    kip2:['Kip','ตั้งแต่เด็กผมฝันอยากมีร้านของตัวเอง ...ร้านแบบนี้แหละครับ','Ever since I was little I’ve dreamed of my own café. ...One just like this.'],
    nonna3:['Nonna Shell','งั้นเรียนให้จบ แล้วกลับมาหายายนะ','Then finish your studies, and come back to me.'],
    nonna4:['Nonna Shell','...ยายแก่เกินจะสร้างใหม่แล้วล่ะ','...I’m too old to build it all again.'],
    kip3:['Kip','เรียนจบเมื่อไหร่ ผมจะกลับมาเปิดร้านนี้ใหม่ ให้ดีกว่าเดิมครับ','The day I graduate, I’m coming back to reopen this place. Better than before.']};
  const cap=(k)=>{const c=$('proCap');if(!k){c.style.opacity=0;return;}const v=T[lang][k];c.innerHTML=v[0]+(v[1]?'<small>'+v[1]+'</small>':'');c.style.opacity=1;};
  const say=(k)=>{const s=$('proSay');if(!k){s.style.opacity=0;return;}const v=LINES[k];s.querySelector('b').textContent=v[0];s.querySelector('span').textContent=lang==='th'?v[1]:v[2];s.style.opacity=1;};
  /* camera: a path over the island and a close look at the café; same path before and after */
  const cafe=()=>{const c=ED.doc.bld.find(b=>b.s==='cafe')||{x:0,z:0};return c;};
  const fly=[[-95,60,80,-60,0,10],[-30,55,70,-10,0,-5],[30,45,45,40,0,-15],[50,24,8,cafe().x,0,cafe().z]];
  const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function camAt(path,u){const n=path.length-1,f=Math.min(n-1e-6,u*n),i=Math.floor(f),t=ease(f-i),A=path[i],B=path[i+1];ED.cam.position.set(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));ED.ctl.target.set(lerp(A[3],B[3],t),0,lerp(A[5],B[5],t));ED.ctl.update();}
  function closeUp(){/* in front of the café, high enough to look over the trees */const c=cafe(),r=c.r||0,fx=Math.sin(r),fz=Math.cos(r);ED.cam.position.set(c.x+fx*15+fz*4,15,c.z+fz*15-fx*4);ED.ctl.target.set(c.x,1,c.z);ED.ctl.update();}
  /* timeline (seconds) */
  const SC=[
    {t:0,go:()=>{load('before');setSky(10,'sunny');dark(0);rainOn(0);cap('last');}},
    {t:3.5,go:()=>cap(null)},{t:0,path:[0,14]},
    {t:14,go:()=>{closeUp();say('nonna1');}},{t:18,go:()=>say('kip1')},{t:21.5,go:()=>say('nonna2')},
    {t:25.5,go:()=>{setSky(18.3,'golden');say('kip2');}},{t:30,go:()=>say('nonna3')},{t:34,go:()=>say(null)},
    {t:34.5,go:()=>{setSky(19.5,'breezy');dark(.62);rainOn(1);cap('storm');flashes(36,46);}},{t:40,go:()=>cap(null)},
    {t:46,go:()=>{dark(1);}},
    {t:48.5,go:()=>{load('after');setSky(8.5,'breezy');rainOn(0);dark(0);cap('after');}},{t:51,go:()=>cap(null)},{t:48.5,path:[48.5,61]},
    {t:61,go:()=>{closeUp();say('nonna4');}},{t:65,go:()=>say('kip3')},{t:70,go:()=>{say(null);setSky(10,'sunny');cap('year');}},
    {t:74,go:()=>{cap(null);end();}}];
  let t0=0,fired=new Set(),run=false,raf=0;
  function load(k){ED.doc=JSON.parse(JSON.stringify(P[k]));ED.rebuild();}
  function setSky(h,w){ED.doc.sky.hour=h;try{Sky.setWeather(w);}catch(e){}}
  function dark(o){$('proDark').style.opacity=o;}
  function rainOn(o){$('proRain').style.opacity=o;}
  let flashT=[];function flashes(a,b){flashT=[];for(let x=a;x<b;x+=1.6+Math.random()*1.8)flashT.push(x);}
  function tick(){raf=requestAnimationFrame(tick);if(!run)return;const t=(performance.now()-t0)/1000;
    SC.forEach((s,i)=>{if(s.go&&t>=s.t&&!fired.has(i)){fired.add(i);s.go();}});
    SC.forEach(s=>{if(s.path&&t>=s.path[0]&&t<=s.path[1])camAt(fly,(t-s.path[0])/(s.path[1]-s.path[0]));});
    if(+$('proRain').style.opacity>0)rain();
    const f=flashT.find(x=>t>=x&&t<x+.25);$('proFlash').style.opacity=f!=null?(.7*(1-(t-f)/.25)):0;}
  function start(){fired=new Set();t0=performance.now();run=true;$('proEnd').style.display='none';}
  function end(){run=false;$('proEnd').style.display='grid';$('proEndT').textContent=T[lang].end;$('proAgain').textContent=T[lang].again;}
  $('proSkip').onclick=()=>{say(null);cap(null);rainOn(0);dark(0);load('after');setSky(10,'sunny');closeUp();end();};
  $('proAgain').onclick=start;
  $('proLang').onclick=()=>{lang=lang==='th'?'en':'th';$('proLang').textContent=lang==='th'?'EN':'TH';$('proSkip').textContent=T[lang].skip;};
  tick();setTimeout(start,2500);
})();
