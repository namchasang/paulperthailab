/* Building Kit Engine (Paul Perth Library, Nov 2026) — buildings assembled from parts, for three.js r128.
   const B=BuildingKit.create({scene,heightAt});
   B.build({x,z,rot, w,d,floors, style:'cottage'|'shop'|'terrace'|'cafe'|'lighthouse'|'kiosk'|'house'|'strip'|'pub'|'bigbox'|'bungalow'|'flats'|'heritage'|'mallshop'|'tower'|'slab', (tower/slab: floors, glass, frame, crown:'flat'|'spire'|'stepped'|'slant', podium) wall:'#..', roof:'gable'|'hip'|'flat'|'skillion',
            roofColor, trim, verandah:true, awning:'#e85a6a', sign:'TEXT', windows:'sash'|'shop'|'round', chimney:true, steps:true}) -> Group
   B.street(pts,{styles:[...],gap,lot}) lines a street with buildings facing it.
   Parts: walls with real window and door openings (frames, sills, glass with a sky tint, shutters), cornices and quoins, gable,
   hip, skillion or flat roofs with tile, slate or tin ridges, verandahs on posts with lace brackets, striped awnings, chimneys,
   steps, gutters and downpipes, painted signboards. Everything is 3D (signs are crisp 4x lettering). Footprint in userData.foot. */
(function(g){
const lin=c=>new THREE.Color(c).convertSRGBToLinear(),MC={};const M=c=>MC[c]||(MC[c]=new THREE.MeshLambertMaterial({color:lin(c)}));
const box=(G,w,h,d,c,x,y,z,ry)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?M(c):c);o.position.set(x,y,z);if(ry)o.rotation.y=ry;o.castShadow=o.receiveShadow=true;G.add(o);return o;};
const GLASS=new THREE.MeshLambertMaterial({color:lin('#7aa8c4'),emissive:lin('#203848')});
function tiles(c,kind){const S=4,cv=document.createElement('canvas');cv.width=cv.height=64*S;const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,64*S,64*S);const col=new THREE.Color(c);
  if(kind==='tin'){for(let i=0;i<64*S;i+=6*S){x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i,0,2*S,64*S);x.fillStyle='rgba(0,0,0,.15)';x.fillRect(i+3*S,0,2*S,64*S);}}
  else{for(let r=0;r<8;r++)for(let k=0;k<8;k++){const ox=(r%2)*4*S;x.fillStyle=`rgba(0,0,0,${.08+((r*7+k*3)%5)*.03})`;x.beginPath();x.arc(k*8*S+ox+4*S,r*8*S+8*S,4.2*S,Math.PI,0);x.fill();x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,r*8*S+7*S,64*S,S);}}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
const TC={};const roofMat=(c,k)=>{const key=c+k;return TC[key]||(TC[key]=new THREE.MeshLambertMaterial({map:tiles(c,k),side:THREE.DoubleSide}));};
function signTex(t,bg,fg){const S=4,cv=document.createElement('canvas');cv.width=160*S;cv.height=28*S;const x=cv.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,cv.width,cv.height);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';let fs=18*S;x.font=`bold ${fs}px Georgia,serif`;while(x.measureText(t).width>cv.width-16*S){fs-=S;x.font=`bold ${fs}px Georgia,serif`;}x.fillText(t,cv.width/2,cv.height/2+S);const tx=new THREE.CanvasTexture(cv);tx.encoding=THREE.sRGBEncoding;tx.anisotropy=8;return tx;}
function windowPart(G,x,y,z,w,h,face,o){/* frame, sill, glass, glazing bars, shutters; face = outward normal angle */const W=new THREE.Group();W.position.set(x,y,z);W.rotation.y=face;G.add(W);
  box(W,w+.12,h+.12,.06,o.trim,0,0,.02);const gl=box(W,w,h,.03,GLASS,0,0,.05);if(o.__win)o.__win.push({W,w,h,x,y,z,face});if(o.windows==='round'){const ar=new THREE.Mesh(new THREE.CylinderGeometry(w/2+.08,w/2+.08,.08,14,1,false,-Math.PI/2,Math.PI),M(o.trim));ar.rotation.x=Math.PI/2;ar.position.set(0,h/2+.02,.04);W.add(ar);const ks=new THREE.Mesh(new THREE.BoxGeometry(.18,.26,.1),M(o.trim));ks.position.set(0,h/2+w/2+.06,.06);W.add(ks);}if(o.windows!=='shop'){box(W,w,.03,.035,o.trim,0,0,.07);box(W,.03,h,.035,o.trim,0,0,.07);}box(W,w+.24,.06,.16,o.trim,0,-h/2-.06,.08);
  if(o.shutters)[-1,1].forEach(s=>box(W,w*.5,h,.04,o.shutters,s*(w*.75+.04),0,.05));}
function doorPart(G,x,z,face,o){const D=new THREE.Group();D.position.set(x,0,z);D.rotation.y=face;G.add(D);box(D,.95,2.05,.06,o.trim,0,1.03,.02);box(D,.8,1.95,.05,o.door||'#5a3a26',0,1.0,.05);box(D,.06,.06,.06,'#d8b040',.28,1,.09);if(o.steps!==false)box(D,1.3,.16,.5,'#bdb4a2',0,.08,.3);}
function roof(G,w,d,y,o){const kind=o.roof||'gable',rc=o.roofColor||'#c2603a',mat=roofMat(rc,o.roofKind||(kind==='skillion'||o.style==='kiosk'?'tin':'tile')),ov=.35,rise=o.rise||Math.min(w,d)*.42;
  if(kind==='flat'){box(G,w+.2,.25,d+.2,o.trim,0,y+.12,0);box(G,w+.3,.12,d+.3,o.trim,0,y+.3,0);return;}
  if(kind==='skillion'){const s=new THREE.Mesh(new THREE.PlaneGeometry(w+ov*2,Math.hypot(d+ov*2,rise*.5)),mat);s.rotation.x=-Math.PI/2+Math.atan2(rise*.5,d+ov*2);s.position.set(0,y+rise*.25,0);s.castShadow=true;G.add(s);mat.map.repeat.set((w+ov*2)/2,(d+ov*2)/2);return;}
  if(kind==='hip'){const c=new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w,d)/2+ov,rise,4,1,true),mat);c.rotation.y=Math.PI/4;c.scale.set((w+ov*2)/Math.hypot(w,d)*Math.SQRT2/1.0,1,(d+ov*2)/Math.hypot(w,d)*Math.SQRT2/1.0);c.position.y=y+rise/2;c.castShadow=true;G.add(c);mat.map.repeat.set(3,3);return;}
  /* gable: two sloped planes, ridge along w, end gables as walls */const half=d/2+ov,sl=Math.hypot(half,rise);[-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w+ov*2,sl),mat);p.position.set(0,y+rise/2,s*half/2);p.rotation.x=-s*(Math.PI/2-Math.atan2(half,rise));p.castShadow=p.receiveShadow=true;G.add(p);});mat.map.repeat.set((w+ov*2)/1.5,sl/1.2);
  const sh=new THREE.Shape();sh.moveTo(-d/2,0);sh.lineTo(d/2,0);sh.lineTo(0,rise*(d/2)/half);sh.lineTo(-d/2,0);[-1,1].forEach(s=>{const gm=new THREE.Mesh(new THREE.ShapeGeometry(sh),M(o.wall));gm.rotation.y=Math.PI/2;gm.position.set(s*w/2,y,0);gm.material.side=THREE.DoubleSide;G.add(gm);});
  box(G,w+ov*2+.05,.1,.16,o.ridge||'#8a3a2a',0,y+rise+.02,0);}
const STY={cottage:{w:6,d:5,floors:1,wall:'#f6f0e2',roof:'gable',roofColor:'#c2603a',trim:'#f2ece0',verandah:true,shutters:'#3e7d5c',chimney:true},
  house:{w:7,d:6,floors:1,wall:'#e8d8b8',roof:'hip',roofColor:'#8a4a3a',trim:'#f6f2e8',verandah:true},
  shop:{w:6,d:7,floors:2,wall:'#e6d7b4',roof:'flat',trim:'#f4ecd8',windows:'shop',awning:'#e85a6a',parapet:true},
  terrace:{w:4.5,d:8,floors:2,wall:'#d8b8a0',roof:'skillion',roofColor:'#7a8088',roofKind:'tin',trim:'#f2ece0',verandah:true,balcony:true},
  cafe:{w:8,d:6,floors:1,wall:'#f6f2e8',roof:'gable',roofColor:'#e07040',trim:'#ffffff',windows:'shop',awning:'#3e7d5c',verandah:false,deck:true},
  kiosk:{w:3.5,d:3,floors:1,wall:'#f2e6c8',roof:'skillion',roofColor:'#3a8ad0',roofKind:'tin',trim:'#ffffff',windows:'shop',awning:'#f2c14e'},
  lighthouse:{w:3,d:3,floors:6,wall:'#f8f6f0',trim:'#c8344a',round:true},
  /* Rottnest settlement: whitewashed limestone cottages with tin roofs and green trim, small holiday cabins */
  islandcottage:{w:7,d:6,floors:1,wall:'#f3eee0',roof:'hip',roofColor:'#8f969c',roofKind:'tin',trim:'#3e5a44',verandah:true,shutters:'#3e5a44',chimney:true,limestone:true},
  cabin:{w:5,d:4.5,floors:1,wall:'#e8e2d0',roof:'skillion',roofColor:'#7a8088',roofKind:'tin',trim:'#c8b48a',verandah:true},
  /* Victoria Park (Albany Highway strip and the streets behind it) */
  strip:{w:5.4,d:8,floors:1,fh:3.4,wall:'#f2e6c8',roof:'flat',windows:'shop',parapet:true,parapetH:1.6,verandah:true,roofColor:'#7a8088',trim:'#f4ecd8'},
  pub:{w:10,d:10,floors:2,fh:3.2,wall:'#e2d2a8',roof:'hip',roofColor:'#8a3a2a',trim:'#f4ecd8',verandah:true,balcony:true,parapet:true,parapetH:1.1,chimney:true},
  bigbox:{w:16,d:14,floors:1,fh:5,wall:'#f6f6f0',roof:'flat',windows:'shop',parapet:true,parapetH:1.4,awning:'#d8343a',trim:'#e8e8e4'},
  bungalow:{w:8,d:9,floors:1,wall:'#b25a40',roof:'hip',roofColor:'#a8503a',trim:'#f2e6cc',verandah:true,chimney:true,brick:true},
  flats:{w:12,d:9,floors:3,wall:'#e6d8b8',roof:'hip',roofColor:'#6a7078',trim:'#f6f2e8',verandah:true,balcony:true,brick:true},
  /* Perth CBD (St Georges Terrace, Hay Street Mall) */
  heritage:{w:11,d:8,floors:3,fh:3.4,wall:'#e8d4a8',roof:'flat',parapet:true,parapetH:1.2,trim:'#f6ecd4',windows:'round'},
  mallshop:{w:5.6,d:8,floors:2,fh:3.4,wall:'#f2ead8',roof:'flat',windows:'shop',parapet:true,parapetH:1,awning:'#1d3a6e',trim:'#f8f2e4'},
  tower:{w:9,d:9,floors:16,tower:true,glass:'#86a8c4',frame:'#c8d2d8',crown:'flat',podium:true},
  slab:{w:13,d:8,floors:10,tower:true,glass:'#4e6070',frame:'#d8d0c0',bands:true,crown:'flat',podium:true}};
/* curtain wall: 4 bays x 4 floors per tile, so lit windows at night don't repeat in an obvious grid */
const TWT={};function towerTex(glass,frame,bands,lit,seed){const k=[glass,frame,bands,lit,seed].join();if(TWT[k])return TWT[k];const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let s=seed||7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  x.fillStyle=lit?'#000':frame;x.fillRect(0,0,256,256);for(let f=0;f<4;f++)for(let b=0;b<4;b++){const X=b*64,Y=f*64,sp=bands?26:10;
    if(lit){if(r()<.42){x.fillStyle=['#ffd890','#fff0c8','#ffe2a8'][r()*3|0];x.fillRect(X+3,Y+3,58,64-sp-6);}continue;}
    const g=x.createLinearGradient(X,Y,X+64,Y+64);const cc=new THREE.Color(glass);const l=(m)=>'rgb('+[cc.r,cc.g,cc.b].map(v=>Math.min(255,v*255*m)|0).join(',')+')';g.addColorStop(0,l(1.25));g.addColorStop(.55,l(.9));g.addColorStop(1,l(1.05+r()*.2));x.fillStyle=g;x.fillRect(X+2,Y+2,60,64-sp-2);
    x.fillStyle='rgba(255,255,255,.12)';x.fillRect(X+2,Y+2,60,4);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(X+31,Y+2,2,64-sp-2);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return TWT[k]=t;}
let LIME=null;function limeTex(){if(LIME)return LIME;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#d8d2c4';x.fillRect(0,0,128,128);let s=9;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let row=0;row<6;row++){let X=-r()*20;const h=128/6;while(X<128){const w=14+r()*22,v=.9+r()*.12;x.fillStyle='rgb('+[255*v,255*v*.985,255*v*.95].map(q=>Math.min(255,q|0)).join(',')+')';x.beginPath();x.roundRect?x.roundRect(X+1.5,row*h+1.5,w-3,h-3,4):x.rect(X+1.5,row*h+1.5,w-3,h-3);x.fill();X+=w;}}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return LIME=t;}
let BRICK=null;function brickTex(){if(BRICK)return BRICK;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#d8d0c4';x.fillRect(0,0,64,64);let s=5;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let row=0;row<8;row++)for(let k=-1;k<4;k++){const v=.82+r()*.3;x.fillStyle='rgb('+[255*v,255*v*.97,255*v*.94].map(q=>Math.min(255,q|0)).join(',')+')';x.fillRect(k*16+(row%2)*8+1,row*8+1,14,6);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return BRICK=t;}
function create(o){const scene=o.scene,H=o.heightAt||(()=>0),list=[],NIGHT=[];
  function build(op){const o2=Object.assign({},STY[op.style||'cottage'],op);o2.__win=[];const G=new THREE.Group(),w=o2.w,d=o2.d,fh=o2.fh||2.8,hh=fh*o2.floors;
    if(o2.round){const tw=new THREE.Mesh(new THREE.CylinderGeometry(w*.35,w*.5,hh,24),M(o2.wall));tw.position.y=hh/2;tw.castShadow=true;G.add(tw);for(let f=1;f<o2.floors;f+=2){const b=new THREE.Mesh(new THREE.CylinderGeometry(w*.5-.1*f/o2.floors*w*.15+.02,w*.5-.1*(f)/o2.floors*w*.15+.02,.6,24),M(o2.trim));b.position.y=f*fh;G.add(b);}
      const gal=new THREE.Mesh(new THREE.CylinderGeometry(w*.48,w*.48,.15,24),M('#2a2e33'));gal.position.y=hh+.1;G.add(gal);const lan=new THREE.Mesh(new THREE.CylinderGeometry(w*.25,w*.25,1.4,12),GLASS);lan.position.y=hh+.9;G.add(lan);const cap=new THREE.Mesh(new THREE.ConeGeometry(w*.3,.9,12),M(o2.trim));cap.position.y=hh+2;G.add(cap);
      doorPart(G,0,w*.47,0,o2);}
    else if(o2.tower){const FH=3.2,n=o2.floors,H0=o2.podium?4.4:0,th=n*FH,seed=(Math.abs(op.x||0)*7+Math.abs(op.z||0)*13+n)|0||3;
      const face=(L)=>{const m=new THREE.MeshLambertMaterial({map:towerTex(o2.glass,o2.frame,o2.bands,false,1).clone(),emissiveMap:towerTex(o2.glass,o2.frame,o2.bands,true,seed).clone(),emissive:new THREE.Color(0)});
        [m.map,m.emissiveMap].forEach(t=>{t.needsUpdate=true;t.repeat.set(L/12,n/4);});NIGHT.push(m);return m;};
      const shaft=(sw,sd,y0,hgt,nf)=>{const mf=face(sw),ms=face(sd),top=M(o2.frame);[mf,ms].forEach(m=>[m.map,m.emissiveMap].forEach(t=>t.repeat.y=nf/4));const b=new THREE.Mesh(new THREE.BoxGeometry(sw,hgt,sd),[ms,ms,top,top,mf,mf]);b.position.y=y0+hgt/2;b.castShadow=b.receiveShadow=true;G.add(b);return b;};
      if(o2.podium){box(G,w+2.4,H0,d+2.4,o2.frame,0,H0/2,0);const sf=new THREE.Mesh(new THREE.PlaneGeometry(w+1.6,H0*.62),GLASS);sf.position.set(0,H0*.36,d/2+1.21);G.add(sf);box(G,w+3,.22,1.8,'#2a2e33',0,H0*.74,d/2+2.1);for(let k=-1;k<=1;k+=2)box(G,.25,H0+.3,.25,o2.frame,k*(w/2+1.1),H0/2,d/2+1.2);}
      const crown=o2.crown;if(crown==='stepped'){const n1=Math.round(n*.7);shaft(w,d,H0,n1*FH,n1);shaft(w*.72,d*.72,H0+n1*FH,(n-n1)*FH,n-n1);}else shaft(w,d,H0,th,n);
      const top=H0+th;if(crown==='flat'||crown==='stepped'){box(G,w*.5,2,d*.45,'#b8bcc0',0,top+1,-d*.1);box(G,(crown==='stepped'?w*.72:w)+.2,.8,.2,o2.frame,0,top+.4,(crown==='stepped'?d*.36:d/2));}
      if(crown==='spire'){box(G,w*.6,2.4,d*.6,o2.frame,0,top+1.2,0);const sp=new THREE.Mesh(new THREE.ConeGeometry(.5,12,8),M('#d8dee2'));sp.position.y=top+8.4;sp.castShadow=true;G.add(sp);}
      if(crown==='slant'){const g=new THREE.BoxGeometry(w,6,d),pp=g.attributes.position;for(let i=0;i<pp.count;i++)if(pp.getY(i)>0&&pp.getZ(i)>0)pp.setY(i,-2.4);g.computeVertexNormals();const sl=new THREE.Mesh(g,GLASS);sl.position.y=top+3;sl.castShadow=true;G.add(sl);}
      if(o2.sign){const sg=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.9,6),Math.min(w*.9,6)*28/160),new THREE.MeshLambertMaterial({map:signTex(o2.sign,o2.signBg||'#1d3a6e',o2.signFg||'#f5ecd8')}));sg.position.set(0,o2.podium?H0+.6:3,d/2+(o2.podium?1.25:.06));G.add(sg);}
      o2.__win=null;}
    else{const wb=box(G,w,hh,d,o2.wall,0,hh/2,0);if(o2.brick||o2.limestone){const t=(o2.limestone?limeTex():brickTex()).clone();t.needsUpdate=true;t.repeat.set(Math.max(w,d)/(o2.limestone?4:2),hh/(o2.limestone?3:2));wb.material=new THREE.MeshLambertMaterial({color:lin(o2.wall),map:t});}box(G,w+.1,.3,d+.1,o2.trim,0,.15,0);/* plinth */
      for(let f=0;f<o2.floors;f++){const y=f*fh+fh*.55,front=d/2+.01;
        if(f===0&&o2.windows==='shop'){windowPart(G,-w*.25,y-.2,front,w*.36,1.7,0,o2);windowPart(G,w*.3,y-.2,front,w*.26,1.7,0,o2);doorPart(G,w*.04,front,0,o2);}
        else{const n=Math.max(1,Math.round(w/2.2));for(let k=0;k<n;k++){const x=-w/2+(k+.5)*w/n;if(f===0&&k===Math.floor(n/2))doorPart(G,x,front,0,o2);else windowPart(G,x,y,front,.8,1.1,0,o2);}}
        const ns=Math.max(1,Math.round(d/2.6));for(let k=0;k<ns;k++){const z=-d/2+(k+.5)*d/ns;[-1,1].forEach(s=>windowPart(G,s*(w/2+.01),y,z,.7,1,s*Math.PI/2,o2));}
        if(f>0)box(G,w+.16,.14,d+.16,o2.trim,0,f*fh,0);}
      if(o2.parapet){const ph=o2.parapetH||.9;box(G,w+.1,ph,.2,o2.trim,0,hh+ph/2,d/2);if(o2.parapetH)box(G,w+.3,.16,.3,o2.trim,0,hh+ph,d/2);}
      [-1,1].forEach(s=>box(G,.2,hh,.2,o2.trim,s*w/2,hh/2,d/2));/* quoins */box(G,w+.2,.18,d+.2,o2.trim,0,hh-.05,0);/* cornice */
      roof(G,w,d,hh,o2);
      if(o2.chimney){box(G,.6,1.6,.6,'#b8806a',w*.3,hh+1,-d*.15);box(G,.7,.12,.7,'#8a5a4a',w*.3,hh+1.8,-d*.15);}
      if(o2.verandah){const vd=1.8,vy=fh*.95;box(G,w+.2,.08,vd,o2.roofColor||'#7a8088',0,vy,d/2+vd/2).rotation.x=.12;for(let k=0;k<=Math.round(w/2);k++){const x=-w/2+k*w/Math.round(w/2);box(G,.1,vy,.1,o2.trim,x,vy/2,d/2+vd-.1);}box(G,w,.08,vd,'#a8744a',0,.12,d/2+vd/2);
        if(o2.balcony&&o2.floors>1){box(G,w,.08,vd,'#a8744a',0,fh+.04,d/2+vd/2);for(let k=0;k<w*4;k++)box(G,.03,.8,.03,o2.trim,-w/2+k/4,fh+.45,d/2+vd-.05);box(G,w,.06,.06,o2.trim,0,fh+.85,d/2+vd-.05);}}
      if(o2.awning){const cv=document.createElement('canvas');cv.width=64;cv.height=8;const x=cv.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=i%2?'#f6f2e8':o2.awning;x.fillRect(i*8,0,8,8);}const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.magFilter=THREE.NearestFilter;
        const a=new THREE.Mesh(new THREE.PlaneGeometry(w*.9,1.3),new THREE.MeshLambertMaterial({map:t,side:THREE.DoubleSide}));a.position.set(0,fh*.82,d/2+.55);a.rotation.x=-1.0;a.castShadow=true;G.add(a);}
      if(o2.deck){box(G,w+1,.25,3,'#a8744a',0,.12,d/2+1.5);for(let k=0;k<3;k++){const ty=new THREE.Group();ty.position.set(-w/3+k*w/3,0,d/2+1.6);G.add(ty);box(ty,.08,.75,.08,'#2a2420',0,.6,0);const tp=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,16),M('#f2ece0'));tp.position.y=.98;ty.add(tp);}}
      if(o2.sign){const s=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.8,4.2),Math.min(w*.8,4.2)*28/160),new THREE.MeshLambertMaterial({map:signTex(o2.sign,o2.signBg||'#2f5a3a',o2.signFg||'#f5ecd8')}));s.position.set(0,o2.parapet?hh+(o2.parapetH||.9)/2:fh*.98,d/2+(o2.parapet?.11:.06));G.add(s);}}
    if(!o2.round&&!o2.tower)extras(G,o2,w,d,hh,fh);
    G.position.set(op.x||0,H(op.x||0,op.z||0),op.z||0);G.rotation.y=op.rot||0;G.userData.foot=o2.tower&&o2.podium?[-w/2-1.2,-d/2-1.2,w/2+1.2,d/2+2.8]:[-w/2,-d/2,w/2,d/2+(o2.verandah?1.8:0)];G.traverse(q=>{q.__pxSkip=1;});scene.add(G);list.push(G);return G;}

  /* ---- detail layers: B.setLayer(name,on), B.update(t,{night}) ---- */
  const LAYERS=['nightlights','interior','flowerboxes','grime','moss','gutters','chimneysmoke','washing','solar','rooftop','antenna','fence','potplants'],hid=new Set(),anim=[];let rs=3;const rr=()=>(rs=(rs*16807)%2147483647)/2147483647;
  const lay=(G,n)=>{const U=G.userData.L||(G.userData.L={});if(!U[n]){U[n]=new THREE.Group();U[n].name=n;U[n].visible=!hid.has(n);G.add(U[n]);}return U[n];};
  const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;};
  const GRIME=ct(8,64,(x)=>{const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(40,36,30,0)');g.addColorStop(.6,'rgba(40,36,30,.12)');g.addColorStop(1,'rgba(40,36,30,.42)');x.fillStyle=g;x.fillRect(0,0,8,64);});
  const STREAK=ct(16,64,(x)=>{const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(40,36,30,.35)');g.addColorStop(1,'rgba(40,36,30,0)');x.fillStyle=g;x.fillRect(5,0,6,64);});
  const MOSS=ct(64,64,(x)=>{for(let i=0;i<60;i++){x.fillStyle=['rgba(86,110,50,.7)','rgba(110,128,60,.6)','rgba(70,90,40,.7)'][i%3];x.beginPath();x.arc(32+(Math.random()-.5)*44,32+(Math.random()-.5)*44,2+Math.random()*5,0,6.28);x.fill();}});
  const PUFF=ct(64,64,(x)=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(235,235,235,.85)');g.addColorStop(1,'rgba(235,235,235,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
  const SOLAR=ct(64,32,(x)=>{x.fillStyle='#1d2a44';x.fillRect(0,0,64,32);x.strokeStyle='#8a98b0';x.lineWidth=1;for(let i=0;i<=64;i+=8){x.beginPath();x.moveTo(i,0);x.lineTo(i,32);x.stroke();}for(let j=0;j<=32;j+=8){x.beginPath();x.moveTo(0,j);x.lineTo(64,j);x.stroke();}});
  const tm=(t,o)=>new THREE.MeshLambertMaterial(Object.assign({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2},o||{}));
  const LIT=new THREE.MeshBasicMaterial({color:lin('#ffcf7a')}),LIT2=new THREE.MeshBasicMaterial({color:lin('#ffe2a8')});
  const FLW=['#e85a6a','#f2c14e','#f5a3c0','#ffffff','#b07ad8'];
  function extras(G,o,w,d,hh,fh){const wins=o.__win;delete o.__win;const shop=o.windows==='shop';
    /* night lights: a warm pane just behind the glass on some windows */
    wins.forEach(v=>{if(rr()<.35&&!shop)return;const p=new THREE.Mesh(new THREE.PlaneGeometry(v.w*.96,v.h*.96),rr()<.5?LIT:LIT2);p.position.set(0,0,.032);v.W.add(p);const L=lay(G,'nightlights');p.userData.nl=1;L.userData.panes=(L.userData.panes||[]).concat(p);p.visible=false;});
    /* interior: shelves and a counter seen through shop windows */
    if(shop)wins.filter(v=>v.face===0&&v.h>1.5).forEach(v=>{const I=lay(G,'interior');const g=new THREE.Group();g.position.set(v.x,v.y,v.z-.5);for(let k=0;k<3;k++){box(g,v.w*.9,.04,.35,'#8a6440',0,-.5+k*.45,-.2);for(let j=0;j<5;j++)box(g,.12,.18,.12,FLW[(j+k)%5],-v.w*.4+j*v.w*.2,-.38+k*.45,-.2);}box(g,v.w*.5,.9,.4,'#c8a070',v.w*.1,-.4,.25);I.add(g);});
    /* flower boxes under side and upper windows */
    wins.forEach(v=>{if(shop&&v.y<fh)return;if(rr()<.45)return;const F=lay(G,'flowerboxes');const g=new THREE.Group();g.position.set(v.x,v.y,v.z);g.rotation.y=v.face;box(g,v.w+.1,.18,.22,'#7a5032',0,-v.h/2-.2,.16);for(let k=0;k<6;k++){const f=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),M(k%2?'#4f8a3a':FLW[(rr()*5)|0]));f.position.set(-v.w/2+.05+k*(v.w/5),-v.h/2-.06,.16+(k%2)*.05);g.add(f);}F.add(g);});
    /* grime band at the foot of each wall and streaks under windows */
    const GR=lay(G,'grime');[[0,d/2+.012,0,w],[0,-d/2-.012,Math.PI,w],[w/2+.012,0,Math.PI/2,d],[-w/2-.012,0,-Math.PI/2,d]].forEach(([x,z,ry,L])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(L,1.1),tm(GRIME));m.position.set(x,.85,z);m.rotation.y=ry;GR.add(m);});
    wins.forEach(v=>{if(rr()<.5)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(v.w*.6,1.1),tm(STREAK));const g=new THREE.Group();g.position.set(v.x,v.y,v.z);g.rotation.y=v.face;m.position.set(0,-v.h/2-.65,.013);g.add(m);GR.add(g);});
    /* moss on the roof and in shady corners */
    const MO=lay(G,'moss');if(o.roof==='gable'||!o.roof){const rise=o.rise||Math.min(w,d)*.42,half=d/2+.35;for(let k=0;k<4+rr()*4;k++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.8+rr(),.6+rr()*.6),tm(MOSS));const sd=rr()<.5?-1:1,f=.25+rr()*.65;m.position.set((rr()-.5)*w*.9,hh+rise*(1-f)+.05,sd*half*f);m.rotation.x=-sd*(Math.PI/2-Math.atan2(half,rise));MO.add(m);}}
    for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,.5),tm(MOSS));m.position.set((rr()<.5?-1:1)*(w/2-.3),.4,-d/2-.015);m.rotation.y=Math.PI;MO.add(m);}
    /* gutters and downpipes */
    if(o.roof!=='flat'){const GU=lay(G,'gutters');[-1,1].forEach(sd=>{const g=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,w+.7,8,1,true),M('#c8ccd0'));g.rotation.z=Math.PI/2;g.position.set(0,hh-.02,sd*(d/2+.38));GU.add(g);});[-1,1].forEach(sx=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,hh,6),M('#c8ccd0'));p.position.set(sx*(w/2+.12),hh/2,d/2+.3);GU.add(p);const sh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.4,6),M('#c8ccd0'));sh.rotation.x=Math.PI/2;sh.position.set(sx*(w/2+.12),.15,d/2+.48);GU.add(sh);});}
    /* chimney smoke */
    if(o.chimney){const SM=lay(G,'chimneysmoke');const puffs=[];for(let k=0;k<7;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,transparent:true,depthWrite:false}));sp.userData.k=k/7;SM.add(sp);puffs.push(sp);}anim.push({kind:'smoke',puffs,base:[w*.3,hh+1.9,-d*.15],G});}
    /* washing line behind houses */
    if(o.style==='cottage'||o.style==='house'||o.style==='terrace'){const WA=lay(G,'washing');const z=-d/2-2.2,L=Math.min(4,w*.7);[-1,1].forEach(sx=>box(WA,.07,1.8,.07,'#9aa0a6',sx*L/2,.9,z));const ln=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,L,4),M('#e8e8e8'));ln.rotation.z=Math.PI/2;ln.position.set(0,1.75,z);WA.add(ln);
      const cl=[];for(let k=0;k<5;k++){const c=new THREE.Mesh(new THREE.PlaneGeometry(.45,.6+rr()*.3),new THREE.MeshLambertMaterial({color:lin(['#f6f2e8','#3a8ad0','#e85a6a','#f2c14e','#8ac8a0'][k]),side:THREE.DoubleSide}));c.geometry.translate(0,-.3,0);c.position.set(-L/2+.45+k*(L-.9)/4,1.74,z);WA.add(c);cl.push(c);}anim.push({kind:'wash',cl});}
    /* solar panels on a sunny roof slope, racks on flat roofs */
    const SO=lay(G,'solar');if(o.roof==='gable'||(!o.roof&&!o.round)){const rise=o.rise||Math.min(w,d)*.42,half=d/2+.35,ang=Math.PI/2-Math.atan2(half,rise);const n=Math.max(2,Math.floor(w/1.3));for(let k=0;k<n;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.1,.04,1.6),[M('#9aa0a6'),M('#9aa0a6'),new THREE.MeshLambertMaterial({map:SOLAR}),M('#9aa0a6'),M('#9aa0a6'),M('#9aa0a6')]);p.position.set(-w/2+.8+k*1.2,hh+rise*.45+.08,half*.45);p.rotation.x=ang;if(k*1.2+1.4<w)SO.add(p);}}
    else if(o.roof==='flat'){for(let k=0;k<Math.floor(w/1.6);k++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.2,.04,1),[M('#9aa0a6'),M('#9aa0a6'),new THREE.MeshLambertMaterial({map:SOLAR}),M('#9aa0a6'),M('#9aa0a6'),M('#9aa0a6')]);p.position.set(-w/2+1+k*1.5,hh+.6,-d*.2);p.rotation.x=-.35;SO.add(p);box(SO,.05,.4,.05,'#9aa0a6',-w/2+1+k*1.5,hh+.4,-d*.2-.3);}}
    /* rooftop: air-con units, vents and a water tank on flat or skillion roofs */
    if(o.roof==='flat'||o.roof==='skillion'){const RT=lay(G,'rooftop');const y=o.roof==='flat'?hh+.25:hh+.4;box(RT,.9,.6,.7,'#d8dcde',w*.25,y+.3,d*.2);const fan=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.05,12),M('#4a4e52'));fan.position.set(w*.25,y+.62,d*.2);RT.add(fan);
      box(RT,.25,.5,.25,'#b8bcc0',-w*.3,y+.25,d*.25);const tk=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.9,14),M('#c8ccd0'));tk.position.set(-w*.25,y+.45,-d*.3);RT.add(tk);anim.push({kind:'fan',fan});}
    /* TV antenna or a small dish */
    {const AN=lay(G,'antenna');const rise=(o.roof==='flat'?0:(o.rise||Math.min(w,d)*.42));const x=-w*.25,y=hh+rise;box(AN,.04,1.4,.04,'#8a9096',x,y+.7,0);for(let k=0;k<5;k++)box(AN,.9-k*.12,.025,.025,'#8a9096',x,y+1.1+k*.12,0);if(rr()<.5){const ds=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8,0,Math.PI*2,0,Math.PI/2.5),M('#e8e8e4'));ds.rotation.x=-1.2;ds.position.set(w*.35,hh*.85,d/2+.2);AN.add(ds);}}
    /* front fence with a letterbox for houses */
    if(o.style==='cottage'||o.style==='house'){const FE=lay(G,'fence');const z=d/2+(o.verandah?1.8:0)+1.6,L=w+2;for(let k=0;k<=L/.22;k++){const x=-L/2+k*.22;if(Math.abs(x)<.6)continue;const pk=box(FE,.08,.75,.04,'#f6f2e8',x,.38,z);}[.22,.55].forEach(y=>{box(FE,L/2-.6,.05,.03,'#f6f2e8',-L/4-.3,y,z-.03);box(FE,L/2-.6,.05,.03,'#f6f2e8',L/4+.3,y,z-.03);});box(FE,.08,1.1,.08,'#7a5032',.9,.55,z+.1);box(FE,.35,.3,.45,'#c8344a',.9,1.2,z+.1);}
    /* pot plants by the door */
    {const PP=lay(G,'potplants');[-1,1].forEach(sx=>{const x=sx*.85+(shop?w*.04:0),z=d/2+(o.steps===false?.3:.7);const pt=new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.4,10),M('#b8643a'));pt.position.set(x,.2,z);pt.castShadow=true;PP.add(pt);for(let k=0;k<5;k++){const l=new THREE.Mesh(new THREE.SphereGeometry(.16,7,6),M(['#3e7d4a','#4f8a3a','#5a9a48'][k%3]));l.position.set(x+(rr()-.5)*.2,.5+rr()*.3,z+(rr()-.5)*.2);PP.add(l);}});}
  }
  function setLayer(n,on){if(on)hid.delete(n);else hid.add(n);list.forEach(G=>{const L=G.userData.L;if(L&&L[n])L[n].visible=!!on;});}
  function update(t,op){op=op||{};const night=op.night||0;{const k=(night>.35&&!hid.has('nightlights'))?Math.min(1,(night-.35)*3):0;NIGHT.forEach(m=>m.emissive.setRGB(k,k*.92,k*.8));}list.forEach(G=>{const L=G.userData.L;if(L&&L.nightlights)(L.nightlights.userData.panes||[]).forEach(p=>p.visible=night>.35&&L.nightlights.visible);});
    anim.forEach(a=>{if(a.kind==='smoke')a.puffs.forEach(p=>{const k=(p.userData.k+t*.12)%1;p.position.set(a.base[0]+k*1.2+Math.sin(t+k*6)*.15,a.base[1]+k*3,a.base[2]+k*.4);p.scale.setScalar(.4+k*1.6);p.material.opacity=.7*(1-k);});
      else if(a.kind==='wash')a.cl.forEach((c,i)=>{c.rotation.x=Math.sin(t*2.2+i)*.25+.15;c.rotation.y=Math.sin(t*1.3+i*2)*.15;});
      else if(a.kind==='fan')a.fan.rotation.y=t*8;});}
  return{build,list,setLayer,update,layers:LAYERS,street(pts,op){op=op||{};const st=op.styles||['shop','terrace','shop','cottage'];let i=0,acc=op.start||3;for(let s=1;s<pts.length;s++){const a=pts[s-1],b=pts[s],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      while(acc<L-2){const sty=st[i%st.length],w=STY[sty].w;const t=(acc+w/2)/L;if(t>1)break;[1,-1].forEach(side=>{if(op.side&&op.side!==side)return;const off=(op.lot||6)*side,x=a[0]+(b[0]-a[0])*t-Math.sin(ang)*off,z=a[1]+(b[1]-a[1])*t+Math.cos(ang)*off;
          build(Object.assign({x,z,rot:-ang+(side>0?Math.PI:0)-Math.PI/2+Math.PI/2*0,style:sty},op.each?op.each(i,side):{}));});acc+=w+(op.gap||.6);i++;}acc-=L;}},STYLES:Object.keys(STY)};}
g.BuildingKit={create,STYLES:Object.keys(STY)};})(typeof window!=='undefined'?window:this);
