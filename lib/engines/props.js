/* Props Engine (Paul Perth Library, Nov 2026) — small 3D street and park furniture for three.js r128.
   const P=PropsEngine.create({scene,heightAt});
   P.add(kind,x,z,{rot,scale,text,color,lines})  -> Group      kinds: lamp, bench, bin, sign, busstop, fence (lines:[[x,z],...]),
        bollard, planter (flowers), picnic, bikerack, bikes, umbrella, jetty (lines:[start,end], width), buoy, rock, crate, tap
   P.along(kind,pts,spacing,opts)  places one every <spacing> units along a line, facing along it.
   P.update(t) lights the lamps at night (P.night=0..1) and bobs buoys.
   Everything is real geometry with soft toon colours (no pictures except sign lettering, drawn crisp at 4x).
   Each prop gets userData.prop={kind} and a footprint userData.foot=[x1,z1,x2,z2] for colliders. */
(function(g){
const M={},m=c=>M[c]||(M[c]=new THREE.MeshLambertMaterial({color:new THREE.Color(c).convertSRGBToLinear()}));
const box=(G,w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m(c));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;G.add(o);return o;};
const cyl=(G,r1,r2,h,c,x,y,z,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg||10),m(c));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;G.add(o);return o;};
const sph=(G,r,c,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),m(c));o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);o.castShadow=true;G.add(o);return o;};
function signTex(lines,bg,fg){const S=4,W=128*S,Hh=Math.max(1,lines.length)*26*S+10*S,c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,W,Hh);
  x.strokeStyle=fg;x.lineWidth=3*S;x.strokeRect(4*S,4*S,W-8*S,Hh-8*S);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';lines.forEach((l,i)=>{x.font=`bold ${16*S}px system-ui,sans-serif`;let fs=16*S;while(x.measureText(l).width>W-20*S&&fs>8*S){fs-=S;x.font=`bold ${fs}px system-ui,sans-serif`;}x.fillText(l,W/2,5*S+13*S+i*26*S);});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return{t,a:W/Hh};}
const K={
  lamp(G,o){cyl(G,.06,.09,3,'#2a2e33',0,1.5,0,8);cyl(G,.16,.2,.18,'#2a2e33',0,.09,0);const arm=box(G,.5,.06,.06,'#2a2e33',.22,2.95,0);const head=cyl(G,.04,.2,.28,'#2a2e33',.44,2.82,0,8);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshBasicMaterial({color:0xfff1c0}));bulb.position.set(.44,2.66,0);G.add(bulb);const L=new THREE.PointLight(0xffd59a,0,9,2);L.position.set(.44,2.5,0);G.add(L);G.userData.lamp={bulb,L};G.userData.foot=[-.2,-.2,.2,.2];},
  bench(G,o){const wood=o.color||'#a8744a';for(let i=0;i<3;i++)box(G,1.6,.05,.12,wood,0,.45,-.18+i*.16);for(let i=0;i<2;i++)box(G,1.6,.12,.04,wood,0,.66+i*.16,-.27);[-.68,.68].forEach(x=>{box(G,.06,.45,.5,'#2f3438',x,.22,-.05);box(G,.06,.4,.06,'#2f3438',x,.65,-.28);});G.userData.foot=[-.85,-.35,.85,.3];},
  bin(G){cyl(G,.24,.21,.8,o2(G,'#3e7d5c'),0,.4,0,12);cyl(G,.26,.26,.06,'#2a5a40',0,.83,0,12);G.userData.foot=[-.25,-.25,.25,.25];},
  sign(G,o){const lines=o.text||['SIGN'],st=signTex(lines,o.bg||'#2f5a3a',o.fg||'#f5ecd8'),w=o.w||1.4,h=w/st.a;cyl(G,.05,.05,1.6+h,'#5a4030',-w/2+.08,(1.6+h)/2,-.03,6);cyl(G,.05,.05,1.6+h,'#5a4030',w/2-.08,(1.6+h)/2,-.03,6);
    const b=box(G,w,h,.06,'#3a2a20',0,1.5+h/2,0);const mat=new THREE.MeshLambertMaterial({map:st.t});[.031,-.031].forEach((z,i)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w-.04,h-.04),mat);p.position.set(0,1.5+h/2,z);if(i)p.rotation.y=Math.PI;G.add(p);});G.userData.foot=[-w/2,-.1,w/2,.1];},
  busstop(G,o){box(G,2.6,.08,1.2,'#e8e2d0',0,2.3,-.1);[-1.2,1.2].forEach(x=>cyl(G,.05,.05,2.3,'#2f3a44',x,1.15,.4,6));box(G,2.5,1.6,.04,'#cfe6f0',0,1.2,-.62).material=new THREE.MeshLambertMaterial({color:0xcfe6f0,transparent:true,opacity:.45});
    box(G,1.6,.06,.36,'#a8744a',0,.48,-.4);const s=signTex(o.text||['BUS STOP'],'#1f5fae','#ffffff');const p=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9/s.a),new THREE.MeshLambertMaterial({map:s.t}));p.position.set(1.3,2.0,.42);G.add(p);cyl(G,.04,.04,2.4,'#2f3a44',1.3,1.2,.4,6);G.userData.foot=[-1.3,-.7,1.4,.5];},
  bollard(G){cyl(G,.1,.12,.8,'#3a3e44',0,.4,0,10);cyl(G,.12,.12,.06,'#e8c040',0,.7,0,10);G.userData.foot=[-.12,-.12,.12,.12];},
  planter(G,o){box(G,1.2,.45,.5,o.color||'#b9a68a',0,.22,0);box(G,1.14,.06,.44,'#5a3e2a',0,.44,0);const cols=['#f5a3c0','#ffffff','#f6e27a','#c9a2f0','#f08a5a'];for(let i=0;i<12;i++){const x=-.48+(i%6)*.19,z=i<6?-.1:.1;cyl(G,.012,.012,.25,'#4f7a3a',x,.58,z,4);sph(G,.055,cols[(i*7)%5],x,.72,z);sph(G,.09,'#4f8a40',x,.5,z,1,.6,1);}G.userData.foot=[-.6,-.25,.6,.25];},
  picnic(G){const w='#9a6a42';box(G,1.8,.06,.8,w,0,.74,0);[-.6,.6].forEach(z=>box(G,1.8,.05,.28,w,0,.44,z));[-.75,.75].forEach(x=>{const a=box(G,.07,.85,.07,w,x,.38,0);a.rotation.x=.5;const b=box(G,.07,.85,.07,w,x,.38,0);b.rotation.x=-.5;});G.userData.foot=[-.95,-.8,.95,.8];},
  bikerack(G){for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,6,16,Math.PI),m('#9aa4ac'));t.position.set(-.75+i*.5,.0,0);t.rotation.y=Math.PI/2;t.castShadow=true;G.add(t);}G.userData.foot=[-1,-.3,1,.3];},
  bikes(G,o){K.bikerack(G);const cols=['#e0434f','#f2c14e','#3f7ad0','#3f9a6a'];for(let i=0;i<(o.n||3);i++){const B=new THREE.Group();B.position.set(-.75+i*.5,0,0);[-.38,.38].forEach(z=>{const w=new THREE.Mesh(new THREE.TorusGeometry(.26,.03,6,18),m('#26282c'));w.rotation.y=Math.PI/2;w.position.set(0,.29,z);B.add(w);});
    box(B,.04,.04,.74,cols[i%4],0,.55,0);const s=box(B,.04,.32,.04,cols[i%4],0,.45,-.18);s.rotation.x=.3;box(B,.04,.32,.04,cols[i%4],0,.48,.28).rotation.x=-.25;box(B,.08,.04,.2,'#26282c',0,.7,-.22);box(B,.4,.03,.03,'#26282c',0,.75,.34);G.add(B);}},
  umbrella(G,o){cyl(G,.03,.03,2.2,'#e8e2d0',0,1.1,0,6);const c=new THREE.Mesh(new THREE.ConeGeometry(1.1,.4,12,1,true),new THREE.MeshLambertMaterial({color:new THREE.Color(o.color||'#e85a6a').convertSRGBToLinear(),side:THREE.DoubleSide}));c.position.y=2.1;c.castShadow=true;G.add(c);G.userData.foot=[-.1,-.1,.1,.1];},
  buoy(G,o){cyl(G,.25,.32,.5,o.color||'#f08a2a',0,.1,0,12);cyl(G,.03,.03,.5,'#e8e2d0',0,.55,0,6);G.userData.bob=1;},
  rock(G,o){const r=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),m('#b8a888'));const p=r.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);v.multiplyScalar(.8+Math.sin(i*12.9)*.15);v.y*=.6;p.setXYZ(i,v.x,v.y,v.z);}r.geometry.computeVertexNormals();r.position.y=.12;r.castShadow=true;G.add(r);},
  crate(G){box(G,.6,.5,.6,'#b98a5a',0,.25,0);box(G,.62,.06,.62,'#8a6440',0,.47,0);},
  tap(G){cyl(G,.05,.05,.9,'#7a8088',0,.45,0,8);box(G,.25,.05,.05,'#7a8088',.1,.86,0);box(G,.4,.08,.3,'#6a6e74',0,.04,0);},
  fence(G,o){const L=o.lines||[[0,0],[4,0]];for(let i=1;i<L.length;i++){const a=L[i-1],b=L[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),n=Math.max(1,Math.round(len/1.5));
      for(let k=0;k<=n;k++){const t=k/n;cyl(G,.05,.06,.9,'#d8ccb0',a[0]+(b[0]-a[0])*t,.45,a[1]+(b[1]-a[1])*t,6);}[.35,.75].forEach(y=>{const r=box(G,len,.06,.04,'#d8ccb0',(a[0]+b[0])/2,y,(a[1]+b[1])/2);r.rotation.y=-ang;});}},
  jetty(G,o){const L=o.lines||[[0,0],[0,10]],a=L[0],b=L[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),w=o.width||2;const D=new THREE.Group();D.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2);D.rotation.y=-ang;G.add(D);
    for(let k=0;k<len/.3;k++)box(D,.28,.08,w,k%2?'#a0764a':'#b08454',-len/2+.15+k*.3,.6,0);for(let k=0;k<=len/2;k++)[-w/2+.1,w/2-.1].forEach(z=>cyl(D,.09,.1,2.4,'#6a4a30',-len/2+k*2,-.4,z,8));G.userData.foot=null;}};
function o2(G,c){return c;}
function create(o){const scene=o.scene,H=o.heightAt||(()=>0),list=[];const api={night:0,list,
  add(kind,x,z,op){op=op||{};const G=new THREE.Group();(K[kind]||K.crate)(G,op);const y=kind==='jetty'||kind==='fence'?0:H(x,z);if(kind!=='jetty'&&kind!=='fence')G.position.set(x,y,z);
    G.rotation.y=op.rot||0;if(op.scale)G.scale.setScalar(op.scale);G.userData.prop={kind};G.traverse(q=>{q.__pxSkip=1;});(op.parent||scene).add(G);list.push(G);return G;},
  along(kind,pts,sp,op){op=op||{};let carry=sp/2;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);let d=carry;
      while(d<L){const t=d/L,nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L,off=op.offset||0;api.add(kind,a[0]+(b[0]-a[0])*t+nx*off,a[1]+(b[1]-a[1])*t+nz*off,Object.assign({},op,{rot:-ang+(op.turn||0)}));d+=sp;}carry=d-L;}},
  update(t){list.forEach((G,i)=>{const l=G.userData.lamp;if(l){l.L.intensity=api.night*1.4;l.bulb.material.color.setRGB(.6+.4*api.night,.55+.4*api.night,.4+.35*api.night);}if(G.userData.bob){G.position.y=Math.sin(t*1.4+i)*.06-.05;G.rotation.z=Math.sin(t+i)*.08;}});}};return api;}
g.PropsEngine={create,kinds:Object.keys(K)};})(typeof window!=='undefined'?window:this);
