/* Life Engine (Paul Perth Library, Nov 2026) — people, animals, birds and boats that live on their own, for three.js r128.
   const L=LifeEngine.create({scene,heightAt,kindAt,paths:[pts...],water:(x,z)=>bool,bounds:[x0,z0,x1,z1]});
   L.spawn(kind,n,opts)   kinds: walker, jogger, cyclist, quokka, kangaroo, gull, butterfly, pelican, dolphin, boat, kayak
   L.update(t,dt,{night,wind})   L.near(x,z,r) -> list of agents   L.agents
   Behaviour: walkers stroll the paths (pick a direction at each end, stop to look around, sit for a while), joggers and cyclists
   run them faster, quokkas graze and hop between bushes and freeze when someone passes, kangaroos graze in open grass and bound
   away from people, gulls wheel over the beach and land on the sand, butterflies flutter round flowers in the day, pelicans glide
   low over the water, dolphins surface in pods, boats and kayaks cruise and anchor. Everyone goes home at night except gulls.
   Models are toon 3D built in code (no pictures), coloured from a soft palette. */
(function(g){
const lin=c=>new THREE.Color(c).convertSRGBToLinear(),MC={};const TM=c=>MC[c]||(MC[c]=new THREE.MeshToonMaterial({color:lin(c)}));
const msh=(G,geo,c,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(geo,TM(c));o.position.set(x||0,y||0,z||0);if(sx)o.scale.set(sx,sy,sz);o.castShadow=true;G.add(o);return o;};
const SPH=new THREE.SphereGeometry(1,14,10),CYL=new THREE.CylinderGeometry(1,1,1,8),BOX=new THREE.BoxGeometry(1,1,1);
const SKIN=['#f1c7a0','#d8a47a','#c99472','#8d5a3b','#5a3a28'],SHIRT=['#e0434f','#3f7ad0','#f2c14e','#3f9a6a','#8a5ad0','#f08a3c','#f4f2ec','#5ac8c8'],PANTS=['#3b4a6b','#2f3b5c','#5a4a3a','#3a3a3a','#c8b496'],HAIR=['#2a2420','#6b4226','#d8b25a','#1d1712','#a85a2a'];
function person(r){const G=new THREE.Group(),sk=SKIN[r()*5|0],sh=SHIRT[r()*8|0],pa=PANTS[r()*5|0],ha=HAIR[r()*5|0];
  const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.09,.46,0);msh(L,CYL,pa,0,-.22,0,.065,.46,.065);msh(L,SPH,'#2a2a30',0,-.46,.04,.07,.04,.1);G.add(L);return L;});
  msh(G,CYL,sh,0,.7,0,.17,.48,.12);msh(G,SPH,sk,0,1.07,0,.13,.14,.13);msh(G,SPH,ha,0,1.13,-.02,.135,.1,.13);
  const arms=[-1,1].map(s=>{const A=new THREE.Group();A.position.set(s*.21,.9,0);msh(A,CYL,sh,0,-.12,0,.05,.24,.05);msh(A,SPH,sk,0,-.3,0,.05,.06,.05);G.add(A);return A;});
  if(r()<.35){msh(G,CYL,['#f6f2e8','#e85a6a','#3a8ad0'][r()*3|0],0,1.22,0,.17,.03,.17);msh(G,CYL,'#f6f2e8',0,1.25,0,.11,.08,.11);}G.userData={legs,arms};return G;}
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
const MAKE={walker:person,jogger:person,cyclist:person,quokka,kangaroo:roo,gull,butterfly:bfly,pelican,dolphin,boat,kayak};
function rnd(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function create(o){const scene=o.scene,H=o.heightAt||(()=>0),K=o.kindAt||(()=>'grass'),W=o.water||((x,z)=>H(x,z)<0),B=o.bounds||[-50,-50,50,50],P=o.paths||[],agents=[],r=rnd(o.seed||7);
  const pathPt=(pi,s)=>{const p=P[pi];let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);let d=Math.max(0,Math.min(1,s))*L;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l){const t=d/l;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,L];}d-=l;}const e=p[p.length-1];return[e[0],e[1],L];};
  const where=test=>{for(let i=0;i<80;i++){const x=B[0]+r()*(B[2]-B[0]),z=B[1]+r()*(B[3]-B[1]);if(test(x,z))return[x,z];}return[0,0];};
  function spawn(kind,n,op){op=op||{};for(let i=0;i<n;i++){const G=MAKE[kind](r);G.traverse(q=>{q.__pxSkip=1;});scene.add(G);const a={kind,G,x:0,z:0,y:0,h:r()*6.28,v:0,t:r()*10,st:'go',ph:r()*6,op};
      if(kind==='walker'||kind==='jogger'||kind==='cyclist'){a.pi=r()*P.length|0;a.s=r();a.dir=r()<.5?1:-1;a.side=(r()-.5)*.5;a.v={walker:1.1,jogger:2.8,cyclist:4.2}[kind]*(.85+r()*.3);
        if(kind==='cyclist'){const bk=new THREE.Group();[-.4,.4].forEach(z=>{const w=new THREE.Mesh(new THREE.TorusGeometry(.28,.03,6,16),TM('#26282c'));w.rotation.y=Math.PI/2;w.position.set(0,.29,z);bk.add(w);});const f=new THREE.Mesh(BOX,TM(SHIRT[r()*8|0]));f.scale.set(.04,.04,.8);f.position.y=.55;bk.add(f);G.add(bk);G.userData.bike=bk;G.userData.legs.forEach(l=>l.position.y+=.25);}}
      else if(kind==='quokka'||kind==='kangaroo'){[a.x,a.z]=where((x,z)=>K(x,z)==='grass');a.home=[a.x,a.z];}
      else if(kind==='gull'||kind==='pelican'){[a.x,a.z]=where((x,z)=>kind==='gull'?K(x,z)==='sand':W(x,z));a.home=[a.x,a.z];a.fly=1;}
      else if(kind==='butterfly'){[a.x,a.z]=where((x,z)=>K(x,z)==='grass');a.home=[a.x,a.z];}
      else{[a.x,a.z]=where((x,z)=>W(x,z)&&H(x,z)<-1.2);a.home=[a.x,a.z];a.v=kind==='boat'?2.5:1;}agents.push(a);}}
  const avoid=(a,x,z)=>agents.some(b=>b!==a&&(b.kind==='walker'||b.kind==='jogger'||b.kind==='cyclist')&&Math.hypot(b.x-x,b.z-z)<3);
  return{agents,spawn,
    near:(x,z,R)=>agents.filter(a=>Math.hypot(a.x-x,a.z-z)<R),
    update(t,dt,op){op=op||{};const night=op.night||0;agents.forEach(a=>{a.t+=dt;const G=a.G,u=G.userData;const out=night>.6&&a.kind!=='gull'&&a.kind!=='dolphin'&&a.kind!=='boat';G.visible=!out;if(out)return;
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
      else if(a.kind==='butterfly'){const x=a.home[0]+Math.sin(a.t*.4+a.ph)*2+Math.sin(a.t*1.3)*.4,z=a.home[1]+Math.cos(a.t*.33+a.ph)*2;G.position.set(x,H(x,z)+.5+Math.sin(a.t*2.3)*.25,z);G.rotation.y=a.t*.4+a.ph;const f=Math.sin(a.t*22)*1.1;u.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*f);a.x=x;a.z=z;}
      else if(a.kind==='dolphin'){const c=Math.sin(a.t*1.2+a.ph);a.ang=(a.ang||0)+dt*.15;const x=a.home[0]+Math.cos(a.ang)*10,z=a.home[1]+Math.sin(a.ang)*10;G.position.set(x,Math.max(-.6,c)*.5-.25,z);G.rotation.y=a.ang+Math.PI;G.rotation.x=-Math.cos(a.t*1.2+a.ph)*.6;a.x=x;a.z=z;}
      else{if(a.anchor>0){a.anchor-=dt;}else{if(!a.tg||Math.hypot(a.tg[0]-a.x,a.tg[1]-a.z)<2){a.tg=where((x,z)=>W(x,z)&&H(x,z)<-1.2);if(r()<.4)a.anchor=10+r()*20;}const dx=a.tg[0]-a.x,dz=a.tg[1]-a.z,d=Math.hypot(dx,dz)||1;let dh=Math.atan2(dx,dz)-a.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));a.h+=dh*Math.min(1,dt*.6);a.x+=Math.sin(a.h)*a.v*dt;a.z+=Math.cos(a.h)*a.v*dt;}
        G.position.set(a.x,Math.sin(a.t*1.3+a.ph)*.05-.1,a.z);G.rotation.y=a.h;G.rotation.z=Math.sin(a.t+a.ph)*.04;if(u.paddle)u.paddle.rotation.x=Math.sin(a.t*3)*.6;}});}};}
g.LifeEngine={create,kinds:Object.keys(MAKE)};})(typeof window!=='undefined'?window:this);
