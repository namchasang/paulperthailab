/* ==== PXKIT: pixel-art building parts (3d shapes, pixel skins) · Paul Oct 2026 ====
   One kit for walls, roofs, windows, doors and trims. Every painter draws at PXK.PPM pixels per metre
   (32 = the original sprite pixel size), so a wall 3 m wide is 96 px and matches the people and plants.
   PXK.wall(w,h,{base,kind,win,door,quoins,plinth,cornice,moss,ivy,seed}) -> canvas
   PXK.roof(w,h,{base,kind:'tile'|'slate'|'tin',seed,across}) -> canvas (rows run along x unless across)
   PXK.window(lit) / PXK.door(col) -> small canvases for separate panes
   Colours: give the building's own colour as base; the kit lights the tops and shades the bottoms of every block. */
var PXK=(function(){
const PPM=32;
let S=1;const rnd=()=>(S=(S*16807)%2147483647)/2147483647,seed=s=>{S=(s|0)%2147483646+1;};
const rgb=c=>{if(Array.isArray(c))return c;if(c[0]==='r')return c.match(/\d+/g).slice(0,3).map(Number);const n=parseInt(c.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const sh=(c,f)=>{const a=rgb(c);return`rgb(${Math.min(255,a[0]*f|0)},${Math.min(255,a[1]*f|0)},${Math.min(255,a[2]*f|0)})`;};
const mix=(a,b,t)=>{a=rgb(a);b=rgb(b);return'#'+[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t).toString(16).padStart(2,'0')).join('');};
const lum=c=>{const a=rgb(c);return(a[0]*.3+a[1]*.59+a[2]*.11)/255;};
function cv(w,h){const c=document.createElement('canvas');c.width=Math.max(2,w|0);c.height=Math.max(2,h|0);const x=c.getContext('2d');x.imageSmoothingEnabled=false;return[c,x];}
const P=(x,c,X,Y,W=1,H=1)=>{x.fillStyle=c;x.fillRect(X|0,Y|0,W|0,H|0);};
const INK='#2a2230';
/* --- surfaces --- */
function blocks(x,W,H,base,{rowH=7,minW=10,varW=8,mortar=.62,y0=0,h1=H}={}){P(x,sh(base,mortar),0,y0,W,h1-y0);let y=y0,row=0;
  while(y<h1){const bh=Math.min(rowH+(row%2),h1-y);let X=-((row*5)%9);while(X<W){const bw=minW+(rnd()*varW|0),f=.9+rnd()*.15;P(x,sh(base,f),X+1,y+1,bw-1,bh-1);P(x,sh(base,f*1.1),X+1,y+1,bw-1,1);P(x,sh(base,f*.86),X+1,y+bh-1,bw-1,1);
    if(rnd()<.22)P(x,sh(base,f*.8),X+2+(rnd()*(bw-4)|0),y+2+(rnd()*Math.max(1,bh-4)|0));X+=bw;}y+=bh;row++;}}
function plaster(x,W,H,base){P(x,base,0,0,W,H);for(let i=0;i<W*H/9;i++){const f=rnd()<.5?.95:1.04;P(x,sh(base,f),rnd()*W,rnd()*H);}
  for(let i=0;i<W/18;i++){const X=rnd()*W|0,Y=rnd()*H*.8|0;for(let k=0;k<4;k++)P(x,sh(base,.9),X+k,Y+(k>>1));}}
function weatherboard(x,W,H,base){for(let y=0;y<H;y+=5){const f=.94+rnd()*.08;P(x,sh(base,f),0,y,W,5);P(x,sh(base,f*1.12),0,y,W,1);P(x,sh(base,f*.72),0,y+4,W,1);}}
function bricks(x,W,H,base){P(x,sh(base,.6),0,0,W,H);for(let y=0,r=0;y<H;y+=4,r++)for(let X=-(r%2)*4;X<W;X+=8){const f=.86+rnd()*.24;P(x,sh(base,f),X+1,y+1,7,3);P(x,sh(base,f*1.12),X+1,y+1,7,1);}}
function moss(x,W,H,amt=1){for(let i=0;i<W*1.3*amt;i++){const X=rnd()*W|0,Y=H-1-(Math.pow(rnd(),2.2)*H*.26|0);P(x,rnd()<.5?'#5d7a3a':'#7a9a48',X,Y);}}
function ivy(x,X0,W,H){const top=H*(.35+rnd()*.35);for(let i=0;i<W*H*.08;i++){const X=X0+rnd()*W|0,Y=H-(Math.pow(rnd(),.8)*(H-top))|0;const c=['#3f7a34','#5a9a40','#2f6a2e','#78b050'][rnd()*4|0];P(x,c,X,Y,2,2);if(rnd()<.3)P(x,'#9ad060',X,Y);}}
/* --- trims --- */
function cornice(x,W,H,base){P(x,sh(base,1.18),0,0,W,2);P(x,sh(base,1.02),0,2,W,2);P(x,sh(base,.62),0,4,W,1);for(let X=2;X<W;X+=6)P(x,sh(base,.78),X,5,2,2);}
function plinth(x,W,H,base){const b=sh(base,.72);P(x,b,0,H-7,W,7);P(x,sh(base,.9),0,H-7,W,1);P(x,sh(base,.5),0,H-1,W,1);for(let X=0;X<W;X+=12+(rnd()*6|0))P(x,sh(base,.55),X,H-7,1,6);}
function quoins(x,W,H,base){[0,W-7].forEach(X=>{for(let y=6,k=0;y<H-8;y+=7,k++){const w=k%2?5:7,xx=X===0?0:W-w,f=.98+rnd()*.06;P(x,sh(base,.6),xx,y,w,7);P(x,sh(base,f*1.1),xx,y,w,6);P(x,sh(base,f*1.24),xx,y,w,1);}});}
/* --- openings painted into a wall --- */
function win(x,X,Y,w,h,{arch=false,shutter=null,box=true,lit=false,frame='#efe4cc',sash=true}={}){
  const glass=lit?['#ffe8a8','#ffc860','#f49a40']:['#6a8aa6','#86a8c2','#46627e'];
  P(x,INK,X-2,Y-2,w+4,h+4);P(x,frame,X-1,Y-1,w+2,h+2);
  for(let j=0;j<h;j++)P(x,glass[j<h*.3?0:j<h*.7?1:2],X,Y+j,w,1);
  if(arch){const r=w/2+1;for(let k=0;k<=r;k++){const yy=Math.round(Math.sqrt(Math.max(0,r*r-k*k))*.6);P(x,INK,X+w/2-k-1,Y-2-yy,1,1);P(x,INK,X+w/2+k,Y-2-yy,1,1);P(x,frame,X+w/2-k,Y-1-yy,1,yy);P(x,frame,X+w/2+k-1,Y-1-yy,1,yy);}
    P(x,sh(frame,.85),X+w/2-1,Y-3-Math.round(r*.6),2,2);}
  if(sash){P(x,frame,X+(w>>1),Y,1,h);P(x,frame,X,Y+(h>>1),w,1);if(h>14)P(x,frame,X,Y+(h>>2),w,1),P(x,frame,X,Y+(3*h>>2),w,1);}
  if(!lit){P(x,'#d8ecf8',X+1,Y+1,2,1);P(x,'#d8ecf8',X+1,Y+2,1,1);}
  P(x,sh(frame,.86),X-3,Y+h+1,w+6,2);P(x,INK,X-3,Y+h+3,w+6,1);P(x,sh(frame,1.1),X-2,Y-3,w+4,1);
  if(shutter)[X-2-5,X+w+2].forEach(sx=>{P(x,INK,sx,Y-2,5,h+4);P(x,shutter,sx+1,Y-1,3,h+2);for(let j=0;j<h+2;j+=2)P(x,sh(shutter,.75),sx+1,Y-1+j,3,1);});
  if(box){P(x,'#6a4028',X-1,Y+h+3,w+2,3);P(x,INK,X-1,Y+h+6,w+2,1);for(let k=0;k<w;k+=2){P(x,['#e05a6a','#f4d04a','#f0f0f0','#c070e0'][rnd()*4|0],X+k,Y+h+1,1,1);P(x,'#4f8a3a',X+k+1,Y+h+2,1,1);}}}
function door(x,X,Y,w,h,col='#2f6a74',{arch=true,lamp=true,step=true}={}){P(x,INK,X-2,Y-3,w+4,h+3);P(x,'#e8dcc0',X-1,Y-2,w+2,h+2);P(x,sh(col,.7),X,Y-1,w,h+1);
  for(let k=1;k<w-1;k+=4)P(x,col,X+k,Y+5,3,h-6),P(x,sh(col,1.15),X+k,Y+5,1,h-6);
  if(arch){P(x,'#ffe29a',X+2,Y+1,w-4,3);P(x,INK,X+(w>>1),Y+1,1,3);}P(x,'#f2c04a',X+w-4,Y+(h>>1)+2,2,2);
  if(step){P(x,sh('#b8a88c',1),X-4,Y+h-2,w+8,2);P(x,INK,X-4,Y+h-1,w+8,1);}
  if(lamp){P(x,INK,X+w+3,Y+2,4,6);P(x,'#ffd98a',X+w+4,Y+3,2,4);}}
/* --- whole wall face --- */
function wall(w,h,o={}){seed(o.seed||7);const W=Math.round(w*PPM),H=Math.round(h*PPM);const[c,x]=cv(W,H);const base=o.base||'#e4d2a8',kind=o.kind||(lum(base)>.8?'stone':'plaster');
  if(kind==='stone')blocks(x,W,H,base);else if(kind==='brick')bricks(x,W,H,base);else if(kind==='board')weatherboard(x,W,H,base);else plaster(x,W,H,base);
  const tb=o.trim||(kind==='stone'?mix(base,'#ffffff',.15):mix(base,'#f4ecd8',.55));
  if(o.quoins!==false&&kind!=='stone'&&W>40)quoins(x,W,H,mix(base,'#e8dcc0',.6));
  if(o.plinth!==false)plinth(x,W,H,kind==='stone'?sh(base,.85):'#b8a88c');
  if(o.cornice!==false&&H>40)cornice(x,W,H,tb);
  const n=o.win==null?Math.max(0,Math.floor((W-16)/44)):o.win;const doorAt=o.door?(o.doorAt!=null?o.doorAt:.5):-1;
  if(n||o.door){const slots=n+(o.door?1:0),step=W/slots;let k=0,dIdx=o.door?Math.min(slots-1,Math.round(doorAt*(slots-1))):-1;
    for(let i=0;i<slots;i++){const cx=step*(i+.5);if(i===dIdx){const dw=Math.min(26,step-10|0),dh=Math.min(H-14,44);door(x,cx-dw/2,H-dh-3,dw,dh,o.doorCol||'#2f6a74');}
      else{const ww=Math.min(o.winW||22,step-16|0),wh=Math.min(o.winH||26,H-30);if(ww>6&&wh>8)win(x,cx-ww/2,Math.max(10,H*.42-wh/2),ww,wh,{arch:o.arch,shutter:o.shutter,lit:o.lit,box:o.box!==false});k++;}}}
  if(o.moss!==false)moss(x,W,H,kind==='stone'?1:.5);if(o.ivy)ivy(x,o.ivy[0]*W,o.ivy[1]*W,H);
  return c;}
/* --- roofs --- */
function roofRows(x,W,H,base,kind){if(kind==='tin'){for(let X=0;X<W;X+=3){const f=X%6?.92:1.08;P(x,sh(base,f),X,0,3,H);P(x,sh(base,f*1.18),X,0,1,H);}for(let y=0;y<H;y+=24)P(x,sh(base,.7),0,y,W,1);return;}
  const tw=kind==='slate'?7:8,th=kind==='slate'?5:6;P(x,sh(base,.55),0,0,W,H);
  for(let y=0,r=0;y<H;y+=th,r++)for(let X=-(r%2)*(tw>>1);X<W;X+=tw){const f=.94+rnd()*.1;P(x,sh(base,f),X,y,tw,th);P(x,sh(base,f*1.16),X+1,y,tw-2,1);P(x,sh(base,f*.78),X,y+th-2,tw,1);P(x,sh(base,.52),X,y+th-1,tw,1);P(x,sh(base,f*.7),X+tw-1,y,1,th-1);
    if(rnd()<.035)P(x,'#6f8a44',X+2,y+2,2,1);}}
function roof(w,h,o={}){seed(o.seed||11);const W=Math.round(w*PPM),H=Math.round(h*PPM);const base=o.base||'#b85434',kind=o.kind||'tile';
  if(!o.across){const[c,x]=cv(W,H);roofRows(x,W,H,base,kind);return c;}
  // rows run along the canvas height (for cylinder prisms, whose slope goes around u)
  const[t,tx]=cv(H,W);roofRows(tx,H,W,base,kind);const[c,x]=cv(W,H);x.translate(W,0);x.rotate(Math.PI/2);x.drawImage(t,0,0);return c;}
function pane(lit,w=12,h=14,frame='#efe4cc'){const[c,x]=cv(w+6,h+6);P(x,INK,0,0,w+6,h+6);win(x,3,3,w,h,{lit,box:false,frame});return c;}
function doorPane(col,w=20,h=38){const[c,x]=cv(w+6,h+4);P(x,'#e8dcc0',0,0,w+6,h+4);door(x,3,3,w,h,col,{lamp:false,step:false});return c;}
return{PPM,wall,roof,pane,doorPane,blocks,plaster,bricks,weatherboard,win,door,cornice,plinth,quoins,moss,ivy,mix,sh,lum,seed,rnd,cv,P};
})();
