/* Building Kit Engine (Paul Perth Library, Nov 2026) — buildings assembled from parts, for three.js r128.
   const B=BuildingKit.create({scene,heightAt});
   B.build({x,z,rot, w,d,floors, style:'cottage'|'shop'|'terrace'|'cafe'|'lighthouse'|'kiosk'|'house', wall:'#..', roof:'gable'|'hip'|'flat'|'skillion',
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
  box(W,w+.12,h+.12,.06,o.trim,0,0,.02);const gl=box(W,w,h,.03,GLASS,0,0,.05);if(o.windows!=='shop'){box(W,w,.03,.035,o.trim,0,0,.07);box(W,.03,h,.035,o.trim,0,0,.07);}box(W,w+.24,.06,.16,o.trim,0,-h/2-.06,.08);
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
  lighthouse:{w:3,d:3,floors:6,wall:'#f8f6f0',trim:'#c8344a',round:true}};
function create(o){const scene=o.scene,H=o.heightAt||(()=>0),list=[];
  function build(op){const o2=Object.assign({},STY[op.style||'cottage'],op);const G=new THREE.Group(),w=o2.w,d=o2.d,fh=2.8,hh=fh*o2.floors;
    if(o2.round){const tw=new THREE.Mesh(new THREE.CylinderGeometry(w*.35,w*.5,hh,24),M(o2.wall));tw.position.y=hh/2;tw.castShadow=true;G.add(tw);for(let f=1;f<o2.floors;f+=2){const b=new THREE.Mesh(new THREE.CylinderGeometry(w*.5-.1*f/o2.floors*w*.15+.02,w*.5-.1*(f)/o2.floors*w*.15+.02,.6,24),M(o2.trim));b.position.y=f*fh;G.add(b);}
      const gal=new THREE.Mesh(new THREE.CylinderGeometry(w*.48,w*.48,.15,24),M('#2a2e33'));gal.position.y=hh+.1;G.add(gal);const lan=new THREE.Mesh(new THREE.CylinderGeometry(w*.25,w*.25,1.4,12),GLASS);lan.position.y=hh+.9;G.add(lan);const cap=new THREE.Mesh(new THREE.ConeGeometry(w*.3,.9,12),M(o2.trim));cap.position.y=hh+2;G.add(cap);
      doorPart(G,0,w*.47,0,o2);}
    else{box(G,w,hh,d,o2.wall,0,hh/2,0);box(G,w+.1,.3,d+.1,o2.trim,0,.15,0);/* plinth */
      for(let f=0;f<o2.floors;f++){const y=f*fh+fh*.55,front=d/2+.01;
        if(f===0&&o2.windows==='shop'){windowPart(G,-w*.25,y-.2,front,w*.36,1.7,0,o2);windowPart(G,w*.3,y-.2,front,w*.26,1.7,0,o2);doorPart(G,w*.04,front,0,o2);}
        else{const n=Math.max(1,Math.round(w/2.2));for(let k=0;k<n;k++){const x=-w/2+(k+.5)*w/n;if(f===0&&k===Math.floor(n/2))doorPart(G,x,front,0,o2);else windowPart(G,x,y,front,.8,1.1,0,o2);}}
        const ns=Math.max(1,Math.round(d/2.6));for(let k=0;k<ns;k++){const z=-d/2+(k+.5)*d/ns;[-1,1].forEach(s=>windowPart(G,s*(w/2+.01),y,z,.7,1,s*Math.PI/2,o2));}
        if(f>0)box(G,w+.16,.14,d+.16,o2.trim,0,f*fh,0);}
      if(o2.parapet){box(G,w+.1,.9,.2,o2.trim,0,hh+.45,d/2);}
      [-1,1].forEach(s=>box(G,.2,hh,.2,o2.trim,s*w/2,hh/2,d/2));/* quoins */box(G,w+.2,.18,d+.2,o2.trim,0,hh-.05,0);/* cornice */
      roof(G,w,d,hh,o2);
      if(o2.chimney){box(G,.6,1.6,.6,'#b8806a',w*.3,hh+1,-d*.15);box(G,.7,.12,.7,'#8a5a4a',w*.3,hh+1.8,-d*.15);}
      if(o2.verandah){const vd=1.8,vy=fh*.95;box(G,w+.2,.08,vd,o2.roofColor||'#7a8088',0,vy,d/2+vd/2).rotation.x=.12;for(let k=0;k<=Math.round(w/2);k++){const x=-w/2+k*w/Math.round(w/2);box(G,.1,vy,.1,o2.trim,x,vy/2,d/2+vd-.1);}box(G,w,.08,vd,'#a8744a',0,.12,d/2+vd/2);
        if(o2.balcony&&o2.floors>1){box(G,w,.08,vd,'#a8744a',0,fh+.04,d/2+vd/2);for(let k=0;k<w*4;k++)box(G,.03,.8,.03,o2.trim,-w/2+k/4,fh+.45,d/2+vd-.05);box(G,w,.06,.06,o2.trim,0,fh+.85,d/2+vd-.05);}}
      if(o2.awning){const cv=document.createElement('canvas');cv.width=64;cv.height=8;const x=cv.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=i%2?'#f6f2e8':o2.awning;x.fillRect(i*8,0,8,8);}const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.magFilter=THREE.NearestFilter;
        const a=new THREE.Mesh(new THREE.PlaneGeometry(w*.9,1.3),new THREE.MeshLambertMaterial({map:t,side:THREE.DoubleSide}));a.position.set(0,fh*.82,d/2+.55);a.rotation.x=-1.0;a.castShadow=true;G.add(a);}
      if(o2.deck){box(G,w+1,.25,3,'#a8744a',0,.12,d/2+1.5);for(let k=0;k<3;k++){const ty=new THREE.Group();ty.position.set(-w/3+k*w/3,0,d/2+1.6);G.add(ty);box(ty,.08,.75,.08,'#2a2420',0,.6,0);const tp=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,16),M('#f2ece0'));tp.position.y=.98;ty.add(tp);}}
      if(o2.sign){const s=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.8,4.2),Math.min(w*.8,4.2)*28/160),new THREE.MeshLambertMaterial({map:signTex(o2.sign,o2.signBg||'#2f5a3a',o2.signFg||'#f5ecd8')}));s.position.set(0,o2.parapet?hh+.45:fh*.98,d/2+(o2.parapet?.11:.06));G.add(s);}}
    G.position.set(op.x||0,H(op.x||0,op.z||0),op.z||0);G.rotation.y=op.rot||0;G.userData.foot=[-w/2,-d/2,w/2,d/2+(o2.verandah?1.8:0)];G.traverse(q=>{q.__pxSkip=1;});scene.add(G);list.push(G);return G;}
  return{build,list,street(pts,op){op=op||{};const st=op.styles||['shop','terrace','shop','cottage'];let i=0,acc=op.start||3;for(let s=1;s<pts.length;s++){const a=pts[s-1],b=pts[s],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      while(acc<L-2){const sty=st[i%st.length],w=STY[sty].w;const t=(acc+w/2)/L;if(t>1)break;[1,-1].forEach(side=>{if(op.side&&op.side!==side)return;const off=(op.lot||6)*side,x=a[0]+(b[0]-a[0])*t-Math.sin(ang)*off,z=a[1]+(b[1]-a[1])*t+Math.cos(ang)*off;
          build(Object.assign({x,z,rot:-ang+(side>0?Math.PI:0)-Math.PI/2+Math.PI/2*0,style:sty},op.each?op.each(i,side):{}));});acc+=w+(op.gap||.6);i++;}acc-=L;}},STYLES:Object.keys(STY)};}
g.BuildingKit={create,STYLES:Object.keys(STY)};})(typeof window!=='undefined'?window:this);
