/* Life Engine (Paul Perth Library, Nov 2026) — people, animals, birds and boats that live on their own, for three.js r128.
   const L=LifeEngine.create({scene,heightAt,kindAt,paths:[pts...],water:(x,z)=>bool,bounds:[x0,z0,x1,z1]});
   L.spawn(kind,n,opts)   kinds: walker, jogger, cyclist, quokka, kangaroo, gull, butterfly, pelican, dolphin, boat, kayak
   L.update(t,dt,{night,wind})   L.near(x,z,r) -> list of agents   L.agents
   Behaviour: walkers stroll the paths (pick a direction at each end, stop to look around, sit for a while), joggers and cyclists
   run them faster, quokkas graze and hop between bushes and freeze when someone passes, kangaroos graze in open grass and bound
   away from people, gulls wheel over the beach and land on the sand, butterflies flutter round flowers in the day, pelicans glide
   low over the water, dolphins surface in pods, boats and kayaks cruise and anchor. Everyone goes home at night except gulls.
   Models are toon 3D built in code (no pictures), coloured from a soft palette. People are island folk by default: quokkas, wombats,
   koalas, kangaroos and possums in clothes, like the characters of Quokka Cafe (option folk:false for humans). */
(function(g){
const lin=c=>new THREE.Color(c).convertSRGBToLinear(),MC={};const TM=c=>MC[c]||(MC[c]=new THREE.MeshToonMaterial({color:lin(c)}));
const msh=(G,geo,c,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(geo,TM(c));o.position.set(x||0,y||0,z||0);if(sx)o.scale.set(sx,sy,sz);o.castShadow=true;G.add(o);return o;};
const SPH=new THREE.SphereGeometry(1,14,10),CYL=new THREE.CylinderGeometry(1,1,1,8),BOX=new THREE.BoxGeometry(1,1,1);
const SKIN=['#f1c7a0','#d8a47a','#c99472','#8d5a3b','#5a3a28'],SHIRT=['#e0434f','#3f7ad0','#f2c14e','#3f9a6a','#8a5ad0','#f08a3c','#f4f2ec','#5ac8c8'],PANTS=['#3b4a6b','#2f3b5c','#5a4a3a','#3a3a3a','#c8b496'],HAIR=['#2a2420','#6b4226','#d8b25a','#1d1712','#a85a2a'];
/* island folk (Paul, 14 Nov 2026): visitors are animals in clothes like the story's characters: quokka, wombat, koala, kangaroo, possum.
   Option LifeEngine.create({folk:false}) brings back the human walkers. */
const FOLK=[{n:'quokka',f:'#8a6446',l:'#c8a07a',ear:'round',sn:.07},{n:'wombat',f:'#7a6658',l:'#9a8676',ear:'small',sn:.09,wide:1.25,nose:'#3a2a24'},
  {n:'koala',f:'#9aa0a6',l:'#e8e6e2',ear:'fluffy',sn:.05,nose:'#2a2426'},{n:'kangaroo',f:'#b0703e',l:'#d8b08a',ear:'tall',sn:.13},{n:'possum',f:'#6e6a68',l:'#d8d2c8',ear:'point',sn:.08,nose:'#e8a0a8'}];
let FOLK_ON=true;
function folkHead(G,r){const sp=FOLK[r()*FOLK.length|0],f=sp.f,w=sp.wide||1;msh(G,SPH,f,0,1.08,0,.15*w,.15,.14);
  msh(G,SPH,sp.l,0,1.04,.1,.08*w,.07,.06+sp.sn*.4);/* muzzle */msh(G,SPH,sp.nose||'#2a2020',0,1.07,.13+sp.sn*.5,.03*w,.025,.025);
  [-1,1].forEach(s=>{msh(G,SPH,'#1a1412',s*.055*w,1.12,.115,.022,.026,.015);/* eyes */
    if(sp.ear==='tall'){const e=msh(G,SPH,f,s*.07,1.29,-.01,.035,.1,.025);e.rotation.z=-s*.2;}
    else if(sp.ear==='fluffy'){msh(G,SPH,f,s*.14,1.2,-.01,.07,.07,.03);msh(G,SPH,sp.l,s*.14,1.2,.01,.045,.045,.02);}
    else if(sp.ear==='point'){const e=msh(G,SPH,f,s*.08,1.24,0,.04,.07,.02);e.rotation.z=-s*.35;}
    else msh(G,SPH,f,s*.09*w,1.21,0,sp.ear==='small'?.03:.045,sp.ear==='small'?.03:.045,.025);});
  if(sp.n==='kangaroo'||sp.n==='possum'||sp.n==='quokka'){const t=msh(G,CYL,f,0,.5,-.18,.04,sp.n==='kangaroo'?.6:.35,.04);t.rotation.x=1.1;}
  return sp.f;}
function person(r){const G=new THREE.Group(),sh=SHIRT[r()*8|0],pa=PANTS[r()*5|0],ha=HAIR[r()*5|0];let sk=SKIN[r()*5|0];
  const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.09,.46,0);msh(L,CYL,pa,0,-.22,0,.065,.46,.065);msh(L,SPH,'#2a2a30',0,-.46,.04,.07,.04,.1);G.add(L);return L;});
  msh(G,CYL,sh,0,.7,0,.17,.48,.12);if(FOLK_ON)sk=folkHead(G,r);else{msh(G,SPH,sk,0,1.07,0,.13,.14,.13);msh(G,SPH,ha,0,1.13,-.02,.135,.1,.13);}
  const arms=[-1,1].map(s=>{const A=new THREE.Group();A.position.set(s*.21,.9,0);msh(A,CYL,sh,0,-.12,0,.05,.24,.05);msh(A,SPH,sk,0,-.3,0,.05,.06,.05);G.add(A);return A;});
  if(r()<.35){msh(G,CYL,['#f6f2e8','#e85a6a','#3a8ad0'][r()*3|0],0,1.22,0,.17,.03,.17);msh(G,CYL,'#f6f2e8',0,1.25,0,.11,.08,.11);}/* sun hat */G.userData={legs,arms};return G;}
function quokka(r){const G=new THREE.Group(),f='#8a6446',l='#c8a07a';msh(G,SPH,f,0,.22,0,.2,.2,.24);msh(G,SPH,l,0,.2,.08,.13,.15,.14);msh(G,SPH,f,0,.42,.12,.13,.12,.12);[-1,1].forEach(s=>msh(G,SPH,f,s*.08,.53,.1,.04,.04,.03));
  msh(G,SPH,'#1a1412',0,.42,.24,.025,.02,.02);msh(G,SPH,f,0,.12,-.24,.05,.05,.16);G.userData={legs:[],arms:[]};return G;}
function roo(r){const G=new THREE.Group(),f='#b0703e',l='#d8b08a';msh(G,SPH,f,0,.75,0,.28,.42,.3);msh(G,SPH,l,0,.72,.14,.18,.3,.18);const N=msh(G,SPH,f,0,1.2,.18,.13,.15,.18);[-1,1].forEach(s=>msh(G,SPH,f,s*.07,1.38,.14,.04,.1,.03));
  const T=msh(G,CYL,f,0,.35,-.5,.07,.8,.07);T.rotation.x=1.1;const legs=[-1,1].map(s=>{const Lg=new THREE.Group();Lg.position.set(s*.14,.45,0);msh(Lg,SPH,f,0,-.2,.05,.1,.22,.12);msh(Lg,CYL,f,0,-.42,.14,.04,.05,.28).rotation.x=1.4;G.add(Lg);return Lg;});G.userData={legs,arms:[]};return G;}
function gull(){const G=new THREE.Group();msh(G,SPH,'#f8f8f4',0,0,0,.12,.1,.26);msh(G,SPH,'#f8f8f4',0,.06,.22,.08,.08,.08);const bk=msh(G,CYL,'#f2b632',0,.05,.32,.015,.08,.015);bk.rotation.x=Math.PI/2;
  const w=[-1,1].map(s=>{const W=new THREE.Group();msh(W,BOX,'#b8c0c6',s*.24,0,0,.44,.02,.16);msh(W,BOX,'#26282c',s*.44,0,-.02,.08,.021,.12);G.add(W);return W;});G.userData={wings:w};return G;}
function bfly(r){const G=new THREE.Group(),c=['#f2a33a','#e8e8f4','#f2d24a','#6aa8e8','#e86a9a'][r()*5|0];const w=[-1,1].map(s=>{const W=new THREE.Group();msh(W,SPH,c,s*.06,0,0,.06,.006,.05);G.add(W);return W;});msh(G,CYL,'#2a2420',0,0,0,.008,.07,.008).rotation.x=Math.PI/2;G.userData={wings:w};return G;}
function pelican(){const G=new THREE.Group();msh(G,SPH,'#f2f0ea',0,0,0,.2,.16,.4);msh(G,SPH,'#f2f0ea',0,.12,.36,.1,.1,.1);msh(G,SPH,'#f0b060',0,.08,.56,.05,.04,.2);const w=[-1,1].map(s=>{const W=new THREE.Group();msh(W,BOX,'#f2f0ea',s*.5,0,0,.9,.03,.3);msh(W,BOX,'#2a2a30',s*.9,0,-.04,.2,.031,.22);G.add(W);return W;});G.userData={wings:w};return G;}
function dolphin(){const G=new THREE.Group();msh(G,SPH,'#5a6a7a',0,0,0,.22,.2,.6);msh(G,SPH,'#c8d0d6',0,-.06,.05,.15,.12,.5);msh(G,SPH,'#5a6a7a',0,0,.62,.07,.06,.14);const f=msh(G,BOX,'#5a6a7a',0,.2,-.05,.04,.2,.16);f.rotation.x=-.4;msh(G,BOX,'#5a6a7a',0,0,-.62,.4,.03,.12);return G;}
function boat(r){const G=new THREE.Group(),c=['#f6f6f2','#2f78a8','#f1c64a','#e85a6a'][r()*4|0];msh(G,BOX,c,0,.1,0,1,.4,2.6);msh(G,BOX,'#f6f2e8',0,.45,-.2,.8,.35,.9);msh(G,BOX,'#c79a62',0,.31,.7,.9,.02,.8);if(r()<.5){msh(G,CYL,'#d8d8d0',0,1.6,.1,.03,2.6,.03);const s=new THREE.Mesh(new THREE.ConeGeometry(.7,2.2,3,1,true),new THREE.MeshToonMaterial({color:0xfbfaf2,side:THREE.DoubleSide}));s.position.set(0,1.6,.4);s.scale.z=.05;G.add(s);}return G;}
function kayak(r){const G=new THREE.Group();msh(G,SPH,['#f1c64a','#e8734a','#3fb0a0'][r()*3|0],0,0,0,.22,.1,1.1);const P=person(r);P.scale.setScalar(.8);P.position.y=-.35;P.userData.legs.forEach(l=>l.visible=false);G.add(P);const pd=msh(G,CYL,'#2a2a30',0,.5,0,.02,1.5,.02);pd.rotation.z=Math.PI/2;G.userData={paddle:pd};return G;}
function seated(r){const P=person(r);P.userData.legs.forEach(l=>{l.rotation.x=-1.45;});P.position.y=0;const G=new THREE.Group();P.position.y=-.42;G.add(P);G.userData=Object.assign({},P.userData,{p:P});return G;}
function picnic(r){const G=new THREE.Group();const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');const col=['#e85a6a','#3a8ad0','#3f9a6a'][r()*3|0];for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#f6f2e8':col;x.fillRect(i*4,j*4,4,4);}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;const b=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.MeshLambertMaterial({map:t}));b.rotation.x=-Math.PI/2;b.position.y=.02;b.receiveShadow=true;G.add(b);
  const n=2+(r()*2|0),ppl=[];for(let i=0;i<n;i++){const P=seated(r);const a=i/n*6.28;P.position.set(Math.sin(a)*.6,0,Math.cos(a)*.6);P.rotation.y=a+Math.PI;G.add(P);ppl.push(P);}
  msh(G,BOX,'#a8783a',0,.12,0,.4,.22,.28);msh(G,CYL,'#e85a6a',.3,.08,.2,.05,.14,.05);G.userData={ppl,legs:[],arms:[]};return G;}
function kid(r){const P=person(r);P.scale.setScalar(.62);return P;}
function sandcastle(r){const G=new THREE.Group();const sand='#e6d3a6';msh(G,CYL,sand,0,.15,0,.45,.3,.45);msh(G,CYL,sand,0,.42,0,.25,.25,.25);[0,1,2,3].forEach(i=>{const a=i*1.57;msh(G,CYL,sand,Math.sin(a)*.5,.2,Math.cos(a)*.5,.12,.4,.12);});
  const fl=msh(G,BOX,'#e85a6a',.06,.75,0,.12,.08,.01);msh(G,CYL,'#f6f2e8',0,.65,0,.01,.25,.01);const k=kid(r);k.position.set(.9,0,.3);k.rotation.y=-1.9;G.add(k);
  const pail=msh(G,CYL,['#f2c14e','#3a8ad0','#e85a6a'][r()*3|0],.6,.1,-.5,.1,.2,.1);G.userData={kid:k,legs:[],arms:k.userData.arms};return G;}
function dog(r){const G=new THREE.Group(),c=['#c8a070','#2a2420','#f2ece0','#8a5a3a'][r()*4|0];msh(G,SPH,c,0,.32,0,.16,.15,.32);msh(G,SPH,c,0,.48,.3,.12,.12,.13);msh(G,SPH,'#1a1412',0,.47,.43,.03,.03,.03);
  [-1,1].forEach(sx=>msh(G,SPH,c,sx*.08,.56,.27,.04,.07,.03));const tl=msh(G,CYL,c,0,.42,-.32,.025,.22,.025);tl.rotation.x=-.8;const legs=[[-.08,.18],[.08,.18],[-.08,-.18],[.08,-.18]].map(([x,z])=>{const L=new THREE.Group();L.position.set(x,.2,z);msh(L,CYL,c,0,-.1,0,.035,.2,.035);G.add(L);return L;});G.userData={legs,arms:[],tail:tl};return G;}
function dogfetch(r){const G=new THREE.Group();const o=person(r);G.add(o);const d=dog(r);G.add(d);const ball=msh(G,SPH,'#d8e84a',0,.1,0,.07,.07,.07);G.userData={owner:o,dog:d,ball,legs:[],arms:[]};return G;}
function flock(r){const G=new THREE.Group(),birds=[];const c=r()<.5?'#f8f8f4':'#3a3a40';for(let i=0;i<9;i++){const b=gull();b.scale.setScalar(.6);b.children.forEach(m=>{if(m.material&&m.material.color&&m.scale.x>.1)m.material=TM(c);});b.userData.off=[(r()-.5)*3,(r()-.5)*3,r()*6];G.add(b);birds.push(b);}G.userData={birds,legs:[],arms:[]};return G;}
function fishjump(r){const G=new THREE.Group();const f=new THREE.Group();msh(f,SPH,'#9ab0c0',0,0,0,.06,.09,.25);msh(f,BOX,'#9ab0c0',0,0,-.26,.02,.14,.08);G.add(f);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.28,20),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6,depthWrite:false}));ring.rotation.x=-Math.PI/2;G.add(ring);G.userData={fish:f,ring,legs:[],arms:[]};return G;}
function sitter(r){const G=new THREE.Group();msh(G,BOX,'#8a6440',0,.42,0,1.3,.06,.4);[-.55,.55].forEach(x=>msh(G,BOX,'#3a3a40',x,.2,0,.06,.42,.36));msh(G,BOX,'#8a6440',0,.72,-.2,1.3,.3,.05);
  const P=seated(r);P.position.set(-.25,.42,0);G.add(P);let Q=null;if(r()<.5){Q=seated(r);Q.position.set(.3,.42,0);G.add(Q);}G.userData={p:P,q:Q,legs:[],arms:P.userData.arms};return G;}
function swimmer(r){const G=new THREE.Group();const sk=SKIN[r()*5|0];msh(G,SPH,sk,0,.05,0,.12,.13,.12);msh(G,SPH,['#e85a6a','#f2c14e','#3a8ad0','#f6f2e8'][r()*4|0],0,.12,-.01,.13,.08,.13);
  const arms=[-1,1].map(s=>{const A=new THREE.Group();A.position.set(s*.2,-.05,0);msh(A,CYL,sk,0,.2,0,.04,.4,.04);G.add(A);return A;});G.userData={legs:[],arms};return G;}
function sunbather(r){const G=new THREE.Group();const c=document.createElement('canvas');c.width=8;c.height=16;const x=c.getContext('2d');const col=['#3a8ad0','#e85a6a','#f2c14e','#3fb0a0'][r()*4|0];for(let i=0;i<4;i++){x.fillStyle=i%2?'#f6f2e8':col;x.fillRect(0,i*4,8,4);}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;const tw=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.8),new THREE.MeshLambertMaterial({map:t}));tw.rotation.x=-Math.PI/2;tw.position.y=.02;G.add(tw);
  const P=person(r);P.rotation.x=-Math.PI/2;P.position.set(0,.14,.62);G.add(P);if(r()<.6){const u=new THREE.Mesh(new THREE.ConeGeometry(1,.4,10,1,true),new THREE.MeshToonMaterial({color:lin(['#f2c14e','#e85a6a','#3a8ad0'][r()*3|0]),side:THREE.DoubleSide}));u.position.set(.7,1.9,-.2);u.castShadow=true;G.add(u);msh(G,CYL,'#f6f2e8',.7,.9,-.2,.025,1.9,.025);}
  G.userData={p:P,legs:P.userData.legs,arms:P.userData.arms};return G;}
function fisher(r){const G=new THREE.Group();const P=person(r);G.add(P);const rod=msh(G,CYL,'#3a2a20',.2,1.3,.9,.012,2.2,.012);rod.rotation.x=1.0;
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.2,1.85,1.85),new THREE.Vector3(.2,0,3.4)]),new THREE.LineBasicMaterial({color:0xe8e8e8}));G.add(line);msh(G,SPH,'#e85a6a',.2,.02,3.4,.05,.05,.05);
  msh(G,BOX,'#3a6a8a',-.5,.15,.1,.4,.3,.28);G.userData={legs:[],arms:P.userData.arms,rod};return G;}
function seal(r){const G=new THREE.Group(),c=['#5a4e44','#6a5c50','#4e443c'][r()*3|0];const b=msh(G,SPH,c,0,.22,0,.3,.24,.75);msh(G,SPH,c,0,.34,.62,.2,.19,.24);msh(G,SPH,'#1a1412',.08,.4,.8,.03,.03,.03);msh(G,SPH,'#1a1412',-.08,.4,.8,.03,.03,.03);
  const fl=[-1,1].map(sx=>{const f=msh(G,SPH,c,sx*.3,.1,.25,.2,.05,.1);return f;});const tail=msh(G,SPH,c,0,.12,-.78,.25,.06,.14);G.userData={legs:[],arms:[],fl,tail,body:b};return G;}
const MAKE={seal,picnic,sandcastle,dogfetch,flock,fishjump,sitter,swimmer,sunbather,fisher,walker:person,jogger:person,cyclist:person,quokka,kangaroo:roo,gull,butterfly:bfly,pelican,dolphin,boat,kayak};
function rnd(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function create(o){FOLK_ON=o.folk!==false;const scene=o.scene,H=o.heightAt||(()=>0),K=o.kindAt||(()=>'grass'),W=o.water||((x,z)=>H(x,z)<0),B=o.bounds||[-50,-50,50,50],P=o.paths||[],agents=[],r=rnd(o.seed||7);
  const pathPt=(pi,s)=>{const p=P[pi];let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);let d=Math.max(0,Math.min(1,s))*L;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l){const t=d/l;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,L];}d-=l;}const e=p[p.length-1];return[e[0],e[1],L];};
  const where=test=>{for(let i=0;i<80;i++){const x=B[0]+r()*(B[2]-B[0]),z=B[1]+r()*(B[3]-B[1]);if(test(x,z))return[x,z];}return[0,0];};
  function spawn(kind,n,op){op=op||{};for(let i=0;i<n;i++){const G=MAKE[kind](r);G.traverse(q=>{q.__pxSkip=1;});scene.add(G);const a={kind,G,x:0,z:0,y:0,h:r()*6.28,v:0,t:r()*10,st:'go',ph:r()*6,op};
      if(kind==='walker'||kind==='jogger'||kind==='cyclist'){a.pi=r()*P.length|0;a.s=r();a.dir=r()<.5?1:-1;a.side=(r()-.5)*.5;a.v={walker:1.1,jogger:2.8,cyclist:4.2}[kind]*(.85+r()*.3);
        if(kind==='cyclist'){const bk=new THREE.Group();[-.4,.4].forEach(z=>{const w=new THREE.Mesh(new THREE.TorusGeometry(.28,.03,6,16),TM('#26282c'));w.rotation.y=Math.PI/2;w.position.set(0,.29,z);bk.add(w);});const f=new THREE.Mesh(BOX,TM(SHIRT[r()*8|0]));f.scale.set(.04,.04,.8);f.position.y=.55;bk.add(f);G.add(bk);G.userData.bike=bk;G.userData.legs.forEach(l=>l.position.y+=.25);}}
      else if(kind==='quokka'||kind==='kangaroo'){[a.x,a.z]=where((x,z)=>K(x,z)==='grass');a.home=[a.x,a.z];}
      else if(kind==='gull'||kind==='pelican'){[a.x,a.z]=where((x,z)=>kind==='gull'?K(x,z)==='sand':W(x,z));a.home=[a.x,a.z];a.fly=1;}
      else if(kind==='picnic'||kind==='flock'||kind==='dogfetch'){[a.x,a.z]=where((x,z)=>K(x,z)==='grass'&&!nearPath(x,z,2));a.home=[a.x,a.z];}
      else if(kind==='sitter'){if(P.length){const pi=r()*P.length|0,p=pathPt(pi,.1+r()*.8),q=pathPt(pi,Math.min(1,(p[3]||0)+.01));a.x=p[0];a.z=p[1];const pp=pathPt(pi,.5);a.h=r()*6.28;const o2=nearPathDir(a.x,a.z);a.x+=o2[0]*1.6;a.z+=o2[1]*1.6;a.h=Math.atan2(-o2[0],-o2[1]);}else [a.x,a.z]=where((x,z)=>K(x,z)==='grass');a.home=[a.x,a.z];}
      else if(kind==='sandcastle'||kind==='sunbather'){[a.x,a.z]=where((x,z)=>K(x,z)==='sand'&&!W(x,z));a.home=[a.x,a.z];a.h=r()*6.28;}
      else if(kind==='fisher'){[a.x,a.z]=where((x,z)=>K(x,z)==='sand'&&!W(x,z)&&seaDir(x,z));const d=seaDir(a.x,a.z)||[0,1];a.h=Math.atan2(d[0],d[1]);a.home=[a.x,a.z];}
      else if(kind==='seal'){const onRock=r()<.6;[a.x,a.z]=where(onRock?(x,z)=>!W(x,z)&&(seaDir(x,z)!=null):(x,z)=>W(x,z)&&H(x,z)>-1.2);a.home=[a.x,a.z];a.h=r()*6.28;a.swim=!onRock;}
      else if(kind==='swimmer'){[a.x,a.z]=where((x,z)=>W(x,z)&&H(x,z)>-1&&H(x,z)<-.35);a.home=[a.x,a.z];}
      else if(kind==='fishjump'){[a.x,a.z]=where((x,z)=>W(x,z)&&H(x,z)<-.8);a.home=[a.x,a.z];}
      else if(kind==='butterfly'){[a.x,a.z]=where((x,z)=>K(x,z)==='grass');a.home=[a.x,a.z];}
      else{[a.x,a.z]=where((x,z)=>W(x,z)&&H(x,z)<-1.2);a.home=[a.x,a.z];a.v=kind==='boat'?2.5:1;}agents.push(a);}}
  function nearPath(x,z,R){for(const p of P)for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l));if(Math.hypot(a[0]+dx*t-x,a[1]+dz*t-z)<R)return true;}return false;}
  function nearPathDir(x,z){let best=1e9,d=[1,0];for(const p of P)for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;if(Math.hypot((a[0]+b[0])/2-x,(a[1]+b[1])/2-z)<best){best=Math.hypot((a[0]+b[0])/2-x,(a[1]+b[1])/2-z);d=[-dz/l,dx/l];}}return d;}
  function seaDir(x,z){for(let k=0;k<8;k++){const a=k/8*6.28,dx=Math.sin(a),dz=Math.cos(a);if(W(x+dx*3,z+dz*3)&&!W(x+dx*.8,z+dz*.8))return[dx,dz];}return null;}
  const hidden=new Set();
  const avoid=(a,x,z)=>agents.some(b=>b!==a&&(b.kind==='walker'||b.kind==='jogger'||b.kind==='cyclist')&&Math.hypot(b.x-x,b.z-z)<3);
  return{agents,spawn,setLayer(k,on){if(on)hidden.delete(k);else hidden.add(k);},
    near:(x,z,R)=>agents.filter(a=>Math.hypot(a.x-x,a.z-z)<R),
    update(t,dt,op){op=op||{};const night=op.night||0;agents.forEach(a=>{a.t+=dt;const G=a.G,u=G.userData;const out=hidden.has(a.kind)||(night>.6&&a.kind!=='gull'&&a.kind!=='dolphin'&&a.kind!=='boat'&&a.kind!=='fishjump'&&a.kind!=='seal');G.visible=!out;if(out)return;
      if(a.kind==='walker'||a.kind==='jogger'||a.kind==='cyclist'){if(a.st==='rest'){a.rest-=dt;if(a.rest<=0)a.st='go';}else{const [,,L]=pathPt(a.pi,0);a.s+=a.dir*a.v*dt/L;if(a.s>1||a.s<0){a.dir*=-1;a.s=Math.max(0,Math.min(1,a.s));if(a.kind==='walker'&&r()<.5){a.st='rest';a.rest=2+r()*5;}}
          const p=pathPt(a.pi,a.s),q=pathPt(a.pi,a.s+a.dir*.01),hh=Math.atan2(q[0]-p[0],q[1]-p[1]);a.h=hh;const nx=Math.cos(hh),nz=-Math.sin(hh);a.x=p[0]+nx*a.side;a.z=p[1]+nz*a.side;}
        const mv=a.st==='go'?1:0,ph=a.t*(a.kind==='walker'?6:a.kind==='jogger'?11:8);u.legs.forEach((l,i)=>l.rotation.x=Math.sin(ph+i*Math.PI)*.6*mv);u.arms.forEach((l,i)=>l.rotation.x=a.kind==='cyclist'?-1.1:Math.sin(ph+i*Math.PI+Math.PI)*.5*mv);
        if(u.bike)u.bike.children.slice(0,2).forEach(w=>w.rotation.x=a.t*6);G.position.set(a.x,H(a.x,a.z)+(a.kind==='jogger'?Math.abs(Math.sin(ph))*.06:0),a.z);G.rotation.y=a.h;}
      else if(a.kind==='quokka'||a.kind==='kangaroo'){const scared=avoid(a,a.x,a.z);if(a.st==='go'&&a.tg){const dx=a.tg[0]-a.x,dz=a.tg[1]-a.z,d=Math.hypot(dx,dz);if(d<.2)a.st='graze';else{const sp=(a.kind==='kangaroo'?4:1.2)*(scared?2:1);a.x+=dx/d*sp*dt;a.z+=dz/d*sp*dt;a.h=Math.atan2(dx,dz);}}
        else{a.wait=(a.wait||2+r()*6)-dt;if(a.wait<=0||scared){a.wait=0;let tx,tz,k=0;do{tx=a.home[0]+(r()-.5)*(a.kind==='kangaroo'?24:8);tz=a.home[1]+(r()-.5)*(a.kind==='kangaroo'?24:8);k++;}while(K(tx,tz)!=='grass'&&k<10);a.tg=[tx,tz];a.st='go';}}
        const hop=a.st==='go'?Math.abs(Math.sin(a.t*(a.kind==='kangaroo'?7:10))):0;G.position.set(a.x,H(a.x,a.z)+hop*(a.kind==='kangaroo'?.45:.12),a.z);G.rotation.y=a.h;G.rotation.x=a.st==='graze'?.25:0;}
      else if(a.kind==='gull'||a.kind==='pelican'){const R=a.kind==='gull'?6:14,sp=a.kind==='gull'?.5:.25;a.ang=(a.ang||r()*6)+dt*sp;const land=a.kind==='gull'&&Math.sin(a.t*.13+a.ph)>.6;
        const tx=a.home[0]+Math.cos(a.ang)*R,tz=a.home[1]+Math.sin(a.ang)*R;a.x+=(tx-a.x)*Math.min(1,dt*2);a.z+=(tz-a.z)*Math.min(1,dt*2);a.y+=((land?H(a.x,a.z)+.1:(a.kind==='gull'?5:1.2)+Math.sin(a.t+a.ph))-a.y)*Math.min(1,dt*1.5);
        G.position.set(a.x,a.y,a.z);G.rotation.y=a.ang+Math.PI;const f=land?0:Math.sin(a.t*(a.kind==='gull'?6:2)+a.ph)*(a.kind==='gull'?.5:.2);u.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*f);}
      else if(a.kind==='picnic'||a.kind==='sitter'||a.kind==='sunbather'||a.kind==='sandcastle'||a.kind==='fisher'){G.position.set(a.x,H(a.x,a.z),a.z);G.rotation.y=a.h||0;
        if(u.ppl)u.ppl.forEach((p,i)=>{p.userData.arms[1].rotation.x=-.6-Math.max(0,Math.sin(a.t*.9+i*2))*.9;p.children[0]&&(p.rotation.z=Math.sin(a.t*.5+i)*.03);});
        if(a.kind==='sitter'){u.p.userData.arms.forEach((l,i)=>l.rotation.x=-.3);u.p.children[0].rotation.y=Math.sin(a.t*.3+a.ph)*.4;}
        if(a.kind==='sandcastle'){const k=u.kid;k.userData.arms.forEach((l,i)=>l.rotation.x=-1.2+Math.sin(a.t*5+i)*.5);k.position.y=-.2;k.userData.legs.forEach(l=>l.rotation.x=-1.4);}
        if(a.kind==='sunbather'){u.p.userData.arms.forEach((l,i)=>l.rotation.z=(i?-1:1)*.3);}
        if(a.kind==='fisher'){u.rod.rotation.x=1.0+Math.sin(a.t*.7+a.ph)*.05+(Math.sin(a.t*.11+a.ph)>.95?-.4:0);u.arms.forEach(l=>l.rotation.x=-1);}}
      else if(a.kind==='dogfetch'){const o=u.owner,d=u.dog,b=u.ball;const cyc=(a.t+a.ph*2)%6,dir=a.h;const fx=Math.sin(dir),fz=Math.cos(dir);G.position.set(a.x,0,a.z);
        o.position.set(0,H(a.x,a.z),0);o.rotation.y=dir;let bd,bh=0,dd;if(cyc<1){bd=cyc*8;bh=Math.sin(cyc*Math.PI)*3;dd=cyc*3;o.userData.arms[0].rotation.x=-2+cyc*2;}else if(cyc<3){bd=8;dd=Math.min(8,3+(cyc-1)*4);}else{bd=Math.max(.6,8-(cyc-3)*3.6);dd=bd;}
        b.position.set(fx*bd,H(a.x+fx*bd,a.z+fz*bd)+.08+bh+(cyc>=3?.38:0),fz*bd);d.position.set(fx*dd,H(a.x+fx*dd,a.z+fz*dd),fz*dd);d.rotation.y=cyc<3?dir:dir+Math.PI;if(cyc>=3)b.position.set(d.position.x+Math.sin(d.rotation.y)*.45,d.position.y+.4,d.position.z+Math.cos(d.rotation.y)*.45);
        const run=cyc<5.4?1:0;d.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(a.t*16+i*1.6)*.8*run);d.userData.tail.rotation.z=Math.sin(a.t*14)*.5;if(cyc>5.5)a.h+=dt*1.2;}
      else if(a.kind==='flock'){const near=avoid(a,a.x,a.z);if(near&&!a.up){a.up=1;a.upT=0;}if(a.up){a.upT+=dt;if(a.upT>9){a.up=0;a.home=[a.home[0]+(r()-.5)*6,a.home[1]+(r()-.5)*6];if(K(a.home[0],a.home[1])!=='grass')a.home=[a.x,a.z];}}
        G.position.set(a.home[0],0,a.home[1]);a.x=a.home[0];a.z=a.home[1];u.birds.forEach((b,i)=>{const o=b.userData.off;const k=a.up?Math.min(1,a.upT/1.5)*(a.upT<7.5?1:Math.max(0,(9-a.upT)/1.5)):0;
          const gx=o[0],gz=o[1],ang=a.t*.8+o[2];b.position.set(gx+Math.cos(ang)*4*k,H(a.home[0]+gx,a.home[1]+gz)+.06+k*(4+Math.sin(o[2])),gz+Math.sin(ang)*4*k);b.rotation.y=k>.1?ang+Math.PI:o[2];
          const f=k>.05?Math.sin(a.t*12+o[2])*.6:0;b.userData.wings.forEach((w,j)=>w.rotation.z=(j?-1:1)*f);if(!k)b.position.y+=Math.max(0,Math.sin(a.t*3+o[2]*5))*.04;});}
      else if(a.kind==='fishjump'){const per=7+a.ph,c=(a.t%per)/per;G.position.set(a.home[0],0,a.home[1]);const j=c<.08?c/.08:-1;const f=u.fish;f.visible=j>=0;if(j>=0){f.position.set(0,Math.sin(j*Math.PI)*.8-.05,(j-.5)*1.2);f.rotation.x=(j-.5)*2.4;}
        const rg=u.ring;const rc=c<.08?0:Math.min(1,(c-.08)/.25);rg.visible=c>=.08&&rc<1;rg.scale.setScalar(.5+rc*3);rg.material.opacity=.6*(1-rc);rg.position.set(0,.03,.6);if(c>.6){a.home=[a.home[0]+(r()-.5)*.5,a.home[1]+(r()-.5)*.5];}}
      else if(a.kind==='seal'){if(a.swim){a.ang=(a.ang||r()*6)+dt*.25;const x=a.home[0]+Math.cos(a.ang)*4,z=a.home[1]+Math.sin(a.ang)*4;G.position.set(x,Math.sin(a.t*1.5+a.ph)*.05-.18,z);G.rotation.y=-a.ang;}
        else{G.position.set(a.home[0],H(a.home[0],a.home[1]),a.home[1]);G.rotation.y=a.h;const roll=Math.max(0,Math.sin(a.t*.13+a.ph*3))>.97;G.rotation.z=roll?Math.sin(a.t*3)*.4:0;u.fl.forEach((f,i)=>f.rotation.z=Math.sin(a.t*.8+i+a.ph)*.3);u.tail.rotation.x=Math.sin(a.t*.6+a.ph)*.25;u.body.scale.y=.24*(1+Math.sin(a.t*1.2+a.ph)*.04);}}
      else if(a.kind==='swimmer'){a.ang=(a.ang||r()*6)+dt*.15;const x=a.home[0]+Math.cos(a.ang)*3,z=a.home[1]+Math.sin(a.ang)*3;G.position.set(x,Math.sin(a.t*2+a.ph)*.03-.05,z);G.rotation.y=a.ang+Math.PI;a.x=x;a.z=z;u.arms.forEach((l,i)=>l.rotation.x=a.t*3+i*Math.PI);}
      else if(a.kind==='butterfly'){const x=a.home[0]+Math.sin(a.t*.4+a.ph)*2+Math.sin(a.t*1.3)*.4,z=a.home[1]+Math.cos(a.t*.33+a.ph)*2;G.position.set(x,H(x,z)+.5+Math.sin(a.t*2.3)*.25,z);G.rotation.y=a.t*.4+a.ph;const f=Math.sin(a.t*22)*1.1;u.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*f);a.x=x;a.z=z;}
      else if(a.kind==='dolphin'){const c=Math.sin(a.t*1.2+a.ph);a.ang=(a.ang||0)+dt*.15;const x=a.home[0]+Math.cos(a.ang)*10,z=a.home[1]+Math.sin(a.ang)*10;G.position.set(x,Math.max(-.6,c)*.5-.25,z);G.rotation.y=a.ang+Math.PI;G.rotation.x=-Math.cos(a.t*1.2+a.ph)*.6;a.x=x;a.z=z;}
      else{if(a.anchor>0){a.anchor-=dt;}else{if(!a.tg||Math.hypot(a.tg[0]-a.x,a.tg[1]-a.z)<2){a.tg=where((x,z)=>W(x,z)&&H(x,z)<-1.2);if(r()<.4)a.anchor=10+r()*20;}const dx=a.tg[0]-a.x,dz=a.tg[1]-a.z,d=Math.hypot(dx,dz)||1;let dh=Math.atan2(dx,dz)-a.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));a.h+=dh*Math.min(1,dt*.6);a.x+=Math.sin(a.h)*a.v*dt;a.z+=Math.cos(a.h)*a.v*dt;}
        G.position.set(a.x,Math.sin(a.t*1.3+a.ph)*.05-.1,a.z);G.rotation.y=a.h;G.rotation.z=Math.sin(a.t+a.ph)*.04;if(u.paddle)u.paddle.rotation.x=Math.sin(a.t*3)*.6;}});}};}
g.LifeEngine={create,kinds:Object.keys(MAKE)};})(typeof window!=='undefined'?window:this);
