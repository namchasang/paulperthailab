/* Map Editor (Paul Perth Library, Nov 2026): edit a whole map with all eight engines, in a city-builder style interface.
   The map is one JSON document (PPLMAP1). Ground heights are a grid; everything else is a list the engines rebuild from. */
(()=>{
const $=id=>document.getElementById(id);
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.outputEncoding=THREE.sRGBEncoding;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;$('view').appendChild(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fd3ea);const cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.3,900);cam.position.set(-30,48,62);
const ctl=new THREE.OrbitControls(cam,R.domElement);ctl.target.set(0,0,0);ctl.maxPolarAngle=1.45;ctl.enableDamping=true;
const hemi=new THREE.HemisphereLight(0xbfe4ff,0x8a7a58,.5),sun=new THREE.DirectionalLight(0xfff2dc,1.05);sun.position.set(-30,45,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.far=250;scene.add(hemi,sun,sun.target);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});

/* ---------- the map document ---------- */
const CS=window.IB_PLAYER?2:1/* player version: the island is twice as big (Paul, 14 Nov 2026: buildings, roads and objects at half size next to the island) */,S=120*CS,N=121,HW=60*CS,LIM=58*CS;/* height grid: 121 x 121 cells of CS units */
const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};const vn=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),f=x-i,g=y-j,u=f*f*(3-2*f),v=g*g*(3-2*g);return(hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;};
const fbm=(x,y)=>{let s=0,a=.5;for(let o=0;o<4;o++){s+=vn(x,y)*a;x*=2.03;y*=2.03;a*=.5;}return s;};
function islandGrid(){const g=new Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=i-60,z=j-60,a=Math.atan2(z,x),r=Math.hypot(x*.9,z*1.1),R0=36+fbm(Math.cos(a)*2+5,Math.sin(a)*2+5)*16-6;
  const d=R0-r;let h=d<0?Math.max(-6,d*.2):Math.min(d*.22,1.2)+Math.max(0,d-6)*.05+(fbm(x*.06,z*.06)-.45)*1.6*Math.min(1,d/10);g[j*N+i]=+h.toFixed(2);}return g;}
const KINDS_LIFE=['walker','jogger','cyclist','quokka','kangaroo','gull','butterfly','pelican','dolphin','boat','kayak','picnic','sandcastle','dogfetch','flock','fishjump','sitter','swimmer','sunbather','fisher','seal'];
/* player version starts on the real Rottnest (Paul, 14 Nov 2026), built in with makeeditor.py --start */
function starter(){const b=starter0();if(!window.IB_START)return b;return Object.assign(b,JSON.parse(JSON.stringify(window.IB_START)),{money:25000,day:1,clock:0,badges:{}});}
function starter0(){return{v:1,name:'New island',sea:0,h:islandGrid(),
  paths:[{pts:[[-22,6],[-10,2],[0,4],[12,0],[24,-4]],w:1.2,kind:'path'},{pts:[[0,4],[2,16],[-4,26]],w:1,kind:'path'},{pts:[[-18,-14],[-4,-12],[10,-16],[22,-14]],w:1.3,kind:'lane'}],
  roads:[{pts:[[-26,-5],[-12,-5],[4,-5],[20,-5]],type:'island'}],/* straight along X (Paul, 14 Nov 2026) */
  props:[{k:'bench',x:-6,z:4.5,r:0},{k:'lamp',x:4,z:6,r:0},{k:'bin',x:-2,z:5.6,r:0},{k:'picnic',x:8,z:6,r:.4},{k:'umbrella',x:8,z:6,r:0}],
  bld:[{s:'cafe',x:-8,z:-12,r:0,sign:'QUOKKA CAFE'},{s:'islandcottage',x:6,z:-12,r:0},{s:'cabin',x:16,z:-13,r:0},{s:'shop',x:14,z:-1,r:Math.PI,sign:'ISLAND STORE'}],
  trees:[{k:'gum',x:-16,z:14},{k:'pine',x:14,z:14},{k:'pine',x:17,z:12},{k:'pepper',x:-20,z:-2},{k:'palm',x:2,z:22}],
  fol:{tuft:1.4,flower:.3,bush:.03,tree:.004},cars:4,
  life:{walker:6,jogger:2,cyclist:3,quokka:8,gull:6,butterfly:6,pelican:1,dolphin:3,boat:2,kayak:2,picnic:2,sandcastle:2,dogfetch:1,flock:1,fishjump:4,sitter:2,swimmer:3,sunbather:3,fisher:2,seal:3},
  veh:[],sky:{hour:10,wx:'sunny'},layers:{},money:25000,day:1,clock:0,biz:[],costs:true,gm:false};}
/* Player version (Paul, 14 Nov 2026): what players get in the story to build their own Rottnest. No ground, life or sky tools, no nature density sliders, roads only along the X and Z axes. Turned on by window.IB_PLAYER (tools/makeeditor.py --player). */
const PLAYER=!!window.IB_PLAYER,GRID=PLAYER?5:0/* player version: roads on a 5-unit block grid (Paul, 14 Nov 2026: city-block layout so buildings line up) */,gs=v=>GRID?Math.round(v/GRID)*GRID:v,BS=window.IB_BSCALE||(PLAYER?.75:1)/* building scale: player version 75% (Paul, 14 Nov 2026: buildings looked too big next to the roads) */,SKEY=window.IB_DEMO?'ppl-mapedit-demo-'+(window.IB_DEMO.ver||1):PLAYER?(window.IB_START?'ppl-mapedit-player-rott'+(window.IB_START.ver||''):'ppl-mapedit-player')/* a new start map (ver) starts a fresh island while the game is not out yet */:'ppl-mapedit';/* a demo page (makeeditor.py --demo map.json) opens on its own ready-built island and saves in its own slot */
let doc;try{doc=JSON.parse(localStorage.getItem(SKEY)||'null');}catch(e){}if(!doc||!doc.h||doc.h.length!==N*N)doc=window.IB_DEMO?Object.assign(starter(),JSON.parse(JSON.stringify(window.IB_DEMO))):starter();else doc=Object.assign(starter(),doc,{life:Object.assign(starter().life,doc.life||{})});
const Hfn=(x,z)=>{const fx=x/CS+60,fz=z/CS+60;if(fx<0||fz<0||fx>=N-1||fz>=N-1)return -6;const i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,g=doc.h,a=g[j*N+i],b=g[j*N+i+1],c=g[(j+1)*N+i],d=g[(j+1)*N+i+1];return(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;};
/* ground fitted to the roads (smooth, level road beds); everything except the road engine itself stands on this */
const Hg=(x,z)=>{let h=Hfn(x,z);if(E.road&&E.road.junctions)h=E.road.groundAt(x,z,h);if(E.bike&&E.bike.junctions)h=E.bike.groundAt(x,z,h);return h;};
const segD=(x,z,a,b)=>{const vx=b[0]-a[0],vz=b[1]-a[1],L=vx*vx+vz*vz||1e-6;let t=((x-a[0])*vx+(z-a[1])*vz)/L;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);};
const lineD=(x,z,pts)=>{let m=1e9;for(let i=1;i<pts.length;i++)m=Math.min(m,segD(x,z,pts[i-1],pts[i]));return m;};
const RW={bikepath:1.3,island:2.4,street:3.3,arterial:5,highway:4.6,lane:1.6,bridge:4.6};
/* footprints of everything built (buildings and businesses, terraces included) and their front yards, in world space (QA, 14 Nov 2026) */
let FPS=null;function fps(){if(FPS)return FPS;const L=[];[['bld',E.bld&&E.bld.list],['biz',E.biz&&E.biz.list]].forEach(([t,list])=>(doc[t]||[]).forEach((o,i)=>{if(t==='biz'&&BIZ[o.t]&&BIZ[o.t].boat)return;const G=list&&list[i],F=G?realFoot(G):[-3,-3,3,3];L.push({t,i,x:o.x,z:o.z,r:o.r||0,F,yd:G&&G.userData.yd||0});}));if(E.bld&&E.biz)FPS=L;return L;}
const inRect=(x,z,e,F,m)=>{const c=Math.cos(e.r),s=Math.sin(e.r),dx=x-e.x,dz=z-e.z,lx=dx*c-dz*s,lz=dx*s+dz*c;return lx>F[0]-m&&lx<F[2]+m&&lz>F[1]-m&&lz<F[3]+m;};
const yardF=e=>[e.F[0],e.F[3],e.F[2],e.F[3]+e.yd];
const inBld=(x,z,m,noYard)=>fps().some(e=>inRect(x,z,e,e.F,m)||(!noYard&&e.yd>0&&inRect(x,z,e,yardF(e),Math.min(m,.2))));
/* two turned rectangles overlap (separating axis test) */
const corn=(q,m)=>{const c=Math.cos(q.r),s=Math.sin(q.r),F=q.F;m=m||0;return[[F[0]-m,F[1]-m],[F[2]+m,F[1]-m],[F[2]+m,F[3]+m],[F[0]-m,F[3]+m]].map(([lx,lz])=>[q.x+lx*c+lz*s,q.z-lx*s+lz*c]);};
function obbHit(A,B,m){const pa=corn(A,m),pb=corn(B,0);return[A,B].every(q=>{const c=Math.cos(q.r),s=Math.sin(q.r);return[[c,-s],[s,c]].every(([u,v])=>{let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;pa.forEach(p=>{const d=p[0]*u+p[1]*v;a0=Math.min(a0,d);a1=Math.max(a1,d);});pb.forEach(p=>{const d=p[0]*u+p[1]*v;b0=Math.min(b0,d);b1=Math.max(b1,d);});return a1>b0&&b1>a0;});});}
/* the island railway (Paul, 14 Nov 2026): it stays, along its own line, and players cannot edit it. doc.rail holds the line (the real-map import will
   bring the real Rottnest line); nothing can be built on it, roads may only cross it. */
const RAIL0=[[-31,6],[-16,10],[0,11],[16,10],[30,5]].map(p=>[p[0]*CS,p[1]*CS]);
const railPts=()=>PLAYER?(doc.rail||RAIL0):(doc.rail||[]);
/* a station at each end of the line (Paul, 14 Nov 2026): platform beside the track and a small station house, fixed like the rail */
const stations=()=>{const R=railPts();if(R.length<2)return[];return[[R[0],R[1]],[R[R.length-1],R[R.length-2]]].map(([e,n])=>{const dx=n[0]-e[0],dz=n[1]-e[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L,px=-uz,pz=ux;
  /* platform along the last 9 units of track on the inland side */return{x:e[0]+ux*5+px*2.3,z:e[1]+uz*5+pz*2.3,ux,uz,px,pz,ang:-Math.atan2(uz,ux)};});};
/* the station is a box (platform + kiosk) beside the end of the track, not a big circle: a coast road may pass close by (QA, 14 Nov 2026) */
const inStation=(x,z,m)=>stations().some(st=>{const dx=x-st.x,dz=z-st.z,a=dx*st.ux+dz*st.uz,b=dx*st.px+dz*st.pz;m=m||0;return Math.abs(a)<4.8+m&&b>-1.3-m&&b<5.4+m;});
const onRail=(x,z,m)=>{const R=railPts();if(R.length<2)return false;if(lineD(x,z,R)<(m||2.4))return true;return inStation(x,z,(m||0)*.5);};
/* a road against the railway: 'station' if it touches a station, 'along' if it runs on the track for longer than a crossing, else null.
   Sampled every half unit, so a grid road with points 5 apart cannot slip past (Paul, 14 Nov 2026) */
function roadVsRail(pts,type){const R=railPts();if(R.length<2||pts.length<2)return null;const hw=(RW[type]||2.4)/2,band=hw+1.2,ST=stations();let inside=0,run=0;
  for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/.5));for(let i=0;i<=n;i++){if(k>1&&i===0)continue;const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;
    if(inStation(x,z,hw))return'station';if(lineD(x,z,R)<band){run+=L/n;if(run>inside)inside=run;}else run=0;}}
  return inside>2*band+1.5?'along':null;}
const kindAt=(x,z)=>{const h=Hg(x,z);if(h<doc.sea)return'water';if(onRail(x,z,1.3))return'path';if(doc.paths.some(p=>lineD(x,z,p.pts)<p.w/2+.3))return'path';if(doc.roads.some(r=>lineD(x,z,r.pts)<RW[r.type]))return'path';if(inBld(x,z,0))return'none';
  /* the ground engine decides where the beach is, so no grass grows on the sand */if(E.terr&&E.terr.groundKind)return E.terr.groundKind(x,z)==='sand'?'sand':'grass';if(h<doc.sea+.9)return'sand';return'grass';};
const keepOut=(x,z)=>onRail(x,z,1.6)||inBld(x,z,.5)||doc.roads.some(r=>lineD(x,z,r.pts)<RW[r.type]+.6)||doc.props.some(p=>Math.hypot(p.x-x,p.z-z)<1.2);

/* ---------- engines, each in its own group so it can be rebuilt alone ---------- */
const G={};['terr','water','fol','wl','props','road','bld','biz','life','veh','rail'].forEach(k=>{G[k]=new THREE.Group();G[k].name=k;scene.add(G[k]);});
const clear=g=>{while(g.children.length){const c=g.children.pop();c.traverse&&c.traverse(o=>{if(o.geometry)o.geometry.dispose();});}};
const E={};const Sky=SkyEngine.create({scene,renderer:R,sun,hemi,target:ctl.target});E.sky=Sky;
const BOUNDS=[-HW,-HW,HW,HW];
const mk={
  terr(){clear(G.terr);E.terr=TerrainEngine.create({size:[S,S],center:[0,0],res:.5*CS,heightAt:Hg,seaLevel:doc.sea,paths:doc.paths.map(p=>({pts:p.pts,w:p.w,kind:p.kind})).concat(railPts().length>1?[{pts:railPts(),w:2.2,kind:'gravel'}]:[])/* the rail bed */});G.terr.add(E.terr.mesh);},
  water(){if(E.water&&E.water.dispose)E.water.dispose();clear(G.water);E.water=WaterSea.create({renderer:R,scene,camera:cam,heightAt:Hg,size:220*CS,ground:null,level:doc.sea,parent:G.water});},
  fol(){clear(G.fol);E.fol=FoliageEngine.create({mix:PLAYER?'rottnest':undefined,scene:G.fol,bounds:BOUNDS,heightAt:Hg,kindAt,keepOut,density:doc.fol,radius:46*Math.min(CS,1.4)});doc.trees.forEach(t=>{if(t.k==='peppermint')t.k='pepper';if(onRail(t.x,t.z,2.6))return;/* never on the railway */try{E.fol.addTree(t.x,t.z,{kind:t.k,size:t.s||1});}catch(e){}});},
  wl(){clear(G.wl);E.wl=WaterLife.create({scene:G.wl,heightAt:Hg,level:doc.sea,bounds:BOUNDS});},
  props(){clear(G.props);E.props=PropsEngine.create({scene:G.props,heightAt:Hg});doc.props.forEach(addProp);},
  road(){clear(G.road);E.road=RoadEngine.create({scene:G.road,heightAt:Hfn,smooth:true,maxGrade:.06});/* bike paths are their own network: where one meets a road it just crosses, no junction pad or sign (QA, 14 Nov 2026) */const GB=new THREE.Group();G.road.add(GB);E.bike=PLAYER?RoadEngine.create({scene:GB,heightAt:Hfn,smooth:true,maxGrade:.06}):null;
    doc.roads.forEach(r=>{if(r.pts.length<2)return;if(r.type==='bridge')E.road.bridge(r.pts,{type:'highway',height:4});else if(E.bike&&r.type==='bikepath')E.bike.road(r.pts,{type:r.type});else E.road.road(r.pts,r.type==='lane'&&PLAYER?{type:'lane',color:'#a08c6a'}:{type:r.type});});E.road.build();if(E.bike){E.bike.build();/* where it crosses a road the road is drawn on top */GB.traverse(m=>{if(m.isMesh&&m.material&&!Array.isArray(m.material)){const q=m.material.clone();q.polygonOffset=true;q.polygonOffsetFactor=(q.polygonOffsetFactor||0)+2;q.polygonOffsetUnits=(q.polygonOffsetUnits||0)+2;m.material=q;}});}if(doc.roads.length&&!PLAYER)E.road.cars(doc.cars||0);/* player version: no generic traffic, only the island's own vehicles */},
  bld(){clear(G.bld);E.bld=BuildingKit.create({scene:G.bld,heightAt:Hg});const L=doc.bld.map(addBld);L.forEach((g,i)=>yard(g,doc.bld[i],G.bld));},
  biz(){clear(G.biz);const BB=BuildingKit.create({scene:G.biz,heightAt:Hg}),BP=PropsEngine.create({scene:G.biz,heightAt:Hg});E.biz={list:doc.biz.map(b=>makeBiz(b,BB,BP,G.biz))};E.biz.list.forEach((g,i)=>{const b=doc.biz[i];if(BIZ[b.t]&&!BIZ[b.t].boat)yard(g,b,G.biz);});},
  rail(){clear(G.rail);const R=railPts();if(R.length<2)return;const cv=new THREE.CatmullRomCurve3(R.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal'),P=cv.getSpacedPoints(Math.ceil(cv.getLength()/1.2));
    const sl=new THREE.MeshLambertMaterial({color:new THREE.Color('#6a4a32').convertSRGBToLinear()}),rl=new THREE.MeshLambertMaterial({color:new THREE.Color('#9aa0a6').convertSRGBToLinear()}),tg=new THREE.BoxGeometry(.28,.08,1.7),rg=new THREE.BoxGeometry(1,.07,.07);
    const sleepers=new THREE.InstancedMesh(tg,sl,P.length),rails=new THREE.InstancedMesh(rg,rl,(P.length-1)*2),m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);let ri=0;
    P.forEach((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],ang=-Math.atan2(b.z-a.z,b.x-a.x),y=Math.max(Hg(p.x,p.z),doc.sea)+.05;q.setFromAxisAngle(up,ang);sleepers.setMatrixAt(i,m.compose(new THREE.Vector3(p.x,y,p.z),q,sc.set(1,1,1)));
      if(i){const c=P[i-1],L=p.distanceTo(c),an=-Math.atan2(p.z-c.z,p.x-c.x),mx=(p.x+c.x)/2,mz=(p.z+c.z)/2,my=Math.max(Hg(mx,mz),doc.sea)+.12;q.setFromAxisAngle(up,an);[-.55,.55].forEach(o=>{rails.setMatrixAt(ri++,m.compose(new THREE.Vector3(mx+Math.sin(an)*o,my,mz+Math.cos(an)*o),q,sc.set(L+.02,1,1)));});}});
    sleepers.receiveShadow=rails.castShadow=true;G.rail.add(sleepers,rails);
    stations().forEach((S,i)=>{const pf=new THREE.Mesh(new THREE.BoxGeometry(9,.35,2.2),new THREE.MeshLambertMaterial({color:new THREE.Color('#d8cfbc').convertSRGBToLinear()}));pf.position.set(S.x,Math.max(Hg(S.x,S.z),doc.sea)+.18,S.z);pf.rotation.y=S.ang;pf.castShadow=pf.receiveShadow=true;G.rail.add(pf);
      const edge=new THREE.Mesh(new THREE.BoxGeometry(9,.04,.18),new THREE.MeshLambertMaterial({color:new THREE.Color('#f2c230').convertSRGBToLinear()}));edge.position.set(S.x-S.px*1.0,pf.position.y+.19,S.z-S.pz*1.0);edge.rotation.y=S.ang;G.rail.add(edge);
      const SB=BuildingKit.create({scene:G.rail,heightAt:Hg}),hx=S.x+S.px*3.4,hz=S.z+S.pz*3.4,hut=SB.build({style:'kiosk',x:hx,z:hz,rot:Math.atan2(-S.px,-S.pz),sign:i?'NORTH STATION':'SOUTH STATION'});if(hut&&BS!==1)hut.scale.setScalar(BS);
      [-3,0,3].forEach(o=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.6,6),new THREE.MeshLambertMaterial({color:0x3a4048}));c.position.set(S.x+S.ux*o+S.px*.6,pf.position.y+.95,S.z+S.uz*o+S.pz*.6);G.rail.add(c);});
      const roof=new THREE.Mesh(new THREE.BoxGeometry(7,.1,1.6),new THREE.MeshLambertMaterial({color:new THREE.Color('#2f6a74').convertSRGBToLinear()}));roof.position.set(S.x+S.px*.3,pf.position.y+1.8,S.z+S.pz*.3);roof.rotation.y=S.ang;roof.castShadow=true;G.rail.add(roof);});
    /* the island train runs the line back and forth and stops at each end (by the platforms) */E.train=VehicleEngine.create({scene:G.rail,heightAt:(x,z)=>Math.max(Hg(x,z),doc.sea)+.1,waterLevel:doc.sea});const t=E.train.add('islandtrain',R[0][0],R[0][1],{cars:3});{const cv2=new THREE.CatmullRomCurve3(R.map(p=>new THREE.Vector3(p[0],0,p[1]))),L2=cv2.getLength(),f=Math.min(.45,6/L2);E.train.rail(t,R,{speed:3,stops:[f,1-f]});}},
  veh(){clear(G.veh);E.veh=VehicleEngine.create({scene:G.veh,heightAt:Hg,waterLevel:doc.sea});if(PLAYER)doc.veh=(doc.veh||[]).filter(o=>vehOK(o.k));E.veh.list=(doc.veh||[]).map(addVeh);},
  life(){clear(G.life);E.life=LifeEngine.create({scene:G.life,heightAt:Hg,kindAt,paths:doc.paths.map(p=>p.pts),water:(x,z)=>Hg(x,z)<doc.sea,bounds:[-55*CS,-55*CS,55*CS,55*CS]});
    KINDS_LIFE.forEach(k=>{const n=doc.life[k]|0;if(!n)return;if(!doc.paths.length&&(k==='walker'||k==='jogger'||k==='cyclist'))return;try{E.life.spawn(k,n);}catch(e){console.warn(k,e);}});}};
/* ---------- businesses: buy, earn every day (rentals: every night), upgrade to 3 stars ---------- */
const BIZ={
  foodtruck:{n:'ฟู้ดทรัค',ic:'🚚',price:2000,inc:120,prop:'foodtruck',sign:'TACO TRUCK'},
  gelato:{n:'ร้านเจลาโต้',ic:'🍨',price:4500,inc:260,style:'kiosk',sign:'GELATO',awning:'#f5a3c0',wall:'#fff3e6',roofColor:'#f5a3c0'},
  cafe:{n:'คาเฟ่',ic:'☕',price:12000,inc:650,style:'cafe',sign:'SEASIDE CAFE'},
  restaurant:{n:'ร้านอาหาร',ic:'🍽️',price:20000,inc:1100,style:'shop',sign:'BAY KITCHEN',awning:'#3e7d5c',wall:'#f2e6c8'},
  rent1:{n:'กระท่อมพัก',ic:'🛖',price:5000,inc:250,rent:1,style:'cabin',sign:'BEACH CABIN'},
  rent2:{n:'บ้านพักหินปูน',ic:'🏠',price:9000,inc:450,rent:1,style:'islandcottage',sign:'HERITAGE STAY'},
  rent3:{n:'บ้านพักวิวทะเล',ic:'🏡',price:15000,inc:780,rent:1,style:'house',sign:'OCEAN VIEW',wall:'#f6f2e8',roofColor:'#5a6a74',shutters:'#2f6a9a'},
  rent4:{n:'วิลล่าสองชั้น',ic:'🏘️',price:24000,inc:1250,rent:1,style:'house',floors:2,balcony:true,sign:'BAY VILLA',wall:'#fbf8f0',roofColor:'#3a4048',w:8,d:7},
  rent5:{n:'วิลล่าหรูริมหาด',ic:'🏝️',price:40000,inc:2100,rent:1,style:'flats',floors:2,sign:'THE SANDS VILLA',wall:'#fdfbf6',roofColor:'#2f3a44',w:12,d:9,pool:true},
  fishing:{n:'เรือประมง',ic:'🎣',price:6000,inc:330,boat:'fishing'},
  party:{n:'เรือปาร์ตี้',ic:'🎉',price:15000,inc:850,boat:'party'},
  ferry:{n:'เรือเฟอร์รี่เช่าเหมา',ic:'⛴️',price:30000,inc:1600,boat:'ferry'}};
const BIZ_GROUPS=[['ร้าน',['foodtruck','gelato','cafe','restaurant']],['บ้านให้เช่า',['rent1','rent2','rent3','rent4','rent5']],['เรือ',['fishing','party','ferry']]];
const LVM=[0,1,1.6,2.4],UPF=[0,0,.8,1.5];/* player version (Paul, 14 Nov 2026): Kip already earns from his café in the story, so on the island only holiday rentals and fishing earn (plus fish stalls and vegetable plots) */const earns=t=>!PLAYER||t==='fishing'||!!(BIZ[t]&&BIZ[t].rent);const PLAYER_DINC=['fishstall','gardenplot'];const bizInc=b=>earns(b.t)?Math.round(BIZ[b.t].inc*LVM[b.lv||1]):0;const bizWorth=b=>{let w=BIZ[b.t].price;for(let l=2;l<=(b.lv||1);l++)w+=BIZ[b.t].price*UPF[l];return w;};
const LM=c=>new THREE.MeshLambertMaterial({color:new THREE.Color(c).convertSRGBToLinear()});
function boatMesh(kind){const G=new THREE.Group(),bx=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),LM(c));m.position.set(x,y,z);m.castShadow=true;G.add(m);return m;};
  const hull=(L,W,H,c)=>{const g=new THREE.BoxGeometry(L,H,W,6,1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);if(x>L*.25){const f=1-(x-L*.25)/(L*.75)*.85;p.setZ(i,p.getZ(i)*f);}if(p.getY(i)<0)p.setZ(i,p.getZ(i)*.7);}g.computeVertexNormals();const m=new THREE.Mesh(g,LM(c));m.position.y=H/2-.35;m.castShadow=true;G.add(m);return m;};
  if(kind==='fishing'){hull(5.5,2.2,1.1,'#f6f2e8');bx(5.2,.12,2,'#3a6a9a',0,.12,0);bx(1.6,1.2,1.5,'#f6f2e8',-.6,.85,0);bx(1.62,.3,1.52,'#3a6a9a',-.6,1.55,0);const mast=bx(.1,2.6,.1,'#6a6a6a',.9,1.6,0);const boom=bx(2.2,.08,.08,'#6a6a6a',1.8,2.6,0);boom.rotation.z=-.4;
    [-.8,.8].forEach(z=>{const r=bx(.04,2,.04,'#2a2a30',-2,1.2,z);r.rotation.z=.6;});bx(.6,.5,.6,'#e85a6a',1.5,.55,.5);}
  if(kind==='party'){hull(8,3.4,1.2,'#fdfbf6');bx(6.5,.15,3,'#a8845a',-.3,.3,0);bx(5,1.6,2.8,'#f6f2e8',-.6,1.2,0);bx(5.4,.15,3.2,'#2f78a8',-.6,2.05,0);[-1,1].forEach(z=>bx(5,.05,.05,'#f6f2e8',-.6,2.9,z*1.5));
    for(let i=0;i<14;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.08,6,5),new THREE.MeshBasicMaterial({color:['#ff5a6a','#ffd84a','#5ad8ff','#8aff6a'][i%4]}));b.position.set(-3+i*.4,2.5+Math.sin(i)*.15,1.55);G.add(b);G.userData.lights=(G.userData.lights||[]).concat(b);}
    for(let i=0;i<5;i++){const f=bx(.05,.5,.35,['#e85a6a','#f2c14e','#3fb0a0','#b07ad8','#3a8ad0'][i],-2.6+i*1.1,2.4,0);f.rotation.y=.3;}}
  if(kind==='ferry'){hull(11,3.8,1.4,'#f6f6f2');bx(10.4,.3,3.4,'#1d3a6e',0,.55,0);bx(7,1.5,3.2,'#f6f6f2',-.6,1.45,0);bx(7.02,.5,3.22,'#2a3a58',-.6,1.55,0);bx(4.5,1.2,2.8,'#f6f6f2',-1.2,2.8,0);bx(4.52,.4,2.82,'#2a3a58',-1.2,2.9,0);
    const fun=bx(.7,1.2,.7,'#e85a6a',-2.6,3.9,0);bx(.72,.25,.72,'#2a2a30',-2.6,4.5,0);}
  return G;}
/* building options for a business; keys left undefined would wipe the style's own size and colours */
const bopts=(d,o)=>{const r=Object.assign({style:d.style,verandah:true},o);['sign','awning','wall','roofColor','shutters','floors','balcony','w','d'].forEach(k=>{if(d[k]!==undefined)r[k]=d[k];});return r;};
function makeBiz(b,BB,BP,par){const d=BIZ[b.t];if(!d)return new THREE.Group();let G;
  if(d.prop)G=BP.add(d.prop,b.x,b.z,{rot:b.r||0,sign:d.sign});
  else if(d.boat){G=boatMesh(d.boat);G.position.set(b.x,doc.sea,b.z);G.rotation.y=b.r||0;G.userData.boat=1;par.add(G);}
  else{G=BB.build(bopts(d,{x:b.x,z:b.z,rot:b.r||0}));if(BS!==1)G.scale.setScalar(BS);
    if(d.pool){const pool=new THREE.Mesh(new THREE.BoxGeometry(5,.3,2.4),new THREE.MeshLambertMaterial({color:0x4ac0e0,emissive:0x0a3040}));pool.position.set(0,.16,(d.d||9)/2+3.6);G.add(pool);const deck=new THREE.Mesh(new THREE.BoxGeometry(6.4,.14,3.6),LM('#c8a878'));deck.position.set(0,.07,(d.d||9)/2+3.6);G.add(deck);}}
  /* stars over the business show its level */const c=document.createElement('canvas');c.width=128;c.height=40;const x=c.getContext('2d');x.font='bold 30px system-ui';x.textAlign='center';x.fillStyle='#ffd84a';x.strokeStyle='#5a3a10';x.lineWidth=4;const t='★'.repeat(b.lv||1);x.strokeText(t,64,30);x.fillText(t,64,30);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));sp.scale.set(2.4,.75,1);const bb=new THREE.Box3().setFromObject(G);const sc=G.scale.y||1;sp.position.set(0,((bb.max.y-G.position.y)+1.6)/sc,0);sp.scale.set(2.4/sc,.75/sc,1);sp.renderOrder=8;G.add(sp);return G;}
function addProp(p){const o={rot:p.k==='fence'||p.k==='jetty'?0:p.r||0};/* fence and jetty are laid out by their lines, already turned */if(p.k==='fence'){const c=Math.cos(p.r||0),s=Math.sin(p.r||0);o.lines=[[p.x-c*2,p.z+s*2],[p.x+c*2,p.z-s*2]];}if(p.k==='jetty'){const c=Math.cos(p.r||0),s=Math.sin(p.r||0),L=p.len||10;o.lines=[[p.x,p.z],[p.x+s*L,p.z+c*L]];if(p.w)o.width=p.w;}return E.props.add(p.k,p.x,p.z,o);}
/* vehicles (Vehicle Engine): parked, or on the move: road vehicles and bikes join the road network, boats sail a loop round where they were put,
   planes take off along the way they face, trains run back and forth on a straight track */
const VCAT=k=>(VehicleEngine.KINDS[k]||{}).cat;
/* player version (Paul, 14 Nov 2026): on the island only bikes, the Island Loop bus and the food truck; boats stay on the sea */
const WATERV=['fishingboat','speedboat','yacht','kayak','houseboat'];
/* boats: only the small ones a player would own (QA: no tankers or cruise ships at the island) */
const vehOK=k=>!PLAYER||k==='bike'||k==='islandbus'||k==='foodtruck'||WATERV.includes(k);
function addVeh(o){const V=E.veh;let v;try{v=V.add(o.k,o.x,o.z,{rot:o.r||0,color:o.c||undefined});}catch(e){return null;}if(!o.go)return v;const c=VCAT(o.k),a=o.r||0,ca=Math.cos(a),sa=Math.sin(a);
  if((c==='road'||c==='bike')&&E.road&&E.road.roads){let best=0,bd=1e9,net=E.road;[E.road].concat(c==='bike'&&E.bike?[E.bike]:[]).forEach(N=>N.roads.forEach((r,i)=>{const d=lineD(o.x,o.z,r.pts.map(p=>Array.isArray(p)?p:[p.x,p.z]));if(d<bd){bd=d;best=i;net=N;}}));if(bd<8)V.drive(v,net,{road:best,t:.5});}
  else if(c==='water'){const R=Math.max(4,v.L*1.6),P=[];for(let i=0;i<10;i++){const q=i/10*Math.PI*2;P.push([o.x+Math.cos(q)*R-ca*R,o.z+Math.sin(q)*R+sa*R]);}V.sail(v,P,{});}
  else if(c==='air')V.fly(v,{runway:[[o.x,o.z],[o.x+ca*30,o.z-sa*30]],alt:v.kind==='airliner'?24:12,radius:v.kind==='airliner'?40:24});
  else if(c==='rail')V.rail(v,[[o.x,o.z],[o.x+ca*20,o.z-sa*20],[o.x+ca*40,o.z-sa*40]],{speed:3});
  return v;}
/* the building's real footprint in its own frame (minX,minZ,maxX,maxZ; front = +Z), terraces, decks, awnings and tables included, not only the walls */
function realFoot(G){if(!G)return[-1.5,-1.5,1.5,1.5];if(G.userData.rfoot)return G.userData.rfoot;const B=new THREE.Box3(),bb=new THREE.Box3(),inv=new THREE.Matrix4();G.updateMatrixWorld(true);inv.copy(G.matrixWorld).invert();const m=new THREE.Matrix4();
  G.traverse(o=>{if(!o.isMesh||!o.geometry||o.isSprite)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();m.multiplyMatrices(inv,o.matrixWorld);bb.copy(o.geometry.boundingBox).applyMatrix4(m);if(bb.max.y-bb.min.y<.08&&bb.max.y<.25)return;/* skip ground decals, lawns and paving laid on the ground */
    /* measure the real corners (a box of a turned box grows; QA found pyramid roofs twice too big) */const P=o.geometry.attributes&&o.geometry.attributes.position;if(P&&P.count<6000){const v=new THREE.Vector3();for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);B.expandByPoint(v);}}else B.union(bb);});
  const f=G.userData.foot||[0,0,0,0],sc=G.scale.x||1,r=[Math.min(f[0],B.min.x),Math.min(f[1],B.min.z),Math.max(f[2],B.max.x),Math.max(f[3],B.max.z)].map(v=>+(v*sc).toFixed(2));/* the box above is in the unscaled frame */G.userData.rfoot=r;return r;}
/* sample the footprint outline (corners and edges) placed at x,z turned by r */
function footPts(x,z,r,F){const c=Math.cos(r),s=Math.sin(r),P=[];for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){if(i%4&&j%4)continue;const lx=F[0]+(F[2]-F[0])*i/4,lz=F[1]+(F[3]-F[1])*j/4;P.push([x+lx*c+lz*s,z-lx*s+lz*c]);}return P;}
/* true when any part of the footprint (plus a margin) sits on a road */
function footOnRoad(x,z,r,F,mg){return doc.roads.some(rd=>rd.type!=='bridge'&&footPts(x,z,r,F).some(p=>lineD(p[0],p[1],rd.pts)<KERB[rd.type]+(mg||0)));}
/* join road pieces of the same type that meet end to end and carry on straight (within ~20 degrees), even where a side road also ends there:
   a road cut by an edit becomes one road again, so its junctions are proper T or cross junctions, not round pads */
function mergeRoads(){const R=doc.roads,same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.7;let changed=true,n=0;
  const dirAt=(P,end)=>{const a=end?P[P.length-2]:P[1],b=end?P[P.length-1]:P[0],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return[dx/l,dz/l];};/* pointing out of the road at that end */
  while(changed){changed=false;outer:for(let i=0;i<R.length;i++)for(let j=0;j<R.length;j++){if(i===j)continue;const A=R[i],B=R[j];if(A.type!==B.type||A.type==='bridge'||A.pts.length<2||B.pts.length<2)continue;
    for(const ea of[0,1])for(const eb of[0,1]){const pa=ea?A.pts[A.pts.length-1]:A.pts[0],pb=eb?B.pts[B.pts.length-1]:B.pts[0];if(!same(pa,pb))continue;
      const da=dirAt(A.pts,ea),db=dirAt(B.pts,eb),alone=!R.some((r,k)=>k!==i&&k!==j&&r.pts.some(p=>same(p,pa)));if(da[0]*db[0]+da[1]*db[1]>-.94&&!alone)continue;/* carry on straight, or a plain corner where only these two meet: one road that bends */
      const PA=ea?A.pts:A.pts.slice().reverse(),PB=eb?B.pts.slice().reverse():B.pts;A.pts=PA.concat(PB.slice(1));R.splice(j,1);changed=true;n++;break outer;}}}return n;}
const YARD=1.0;
/* front yard: paving from the front of a building (terrace included) to the kerb of the road it faces, so no shop sits on grass gaps or on the road */
const YARDM=new THREE.MeshLambertMaterial({color:new THREE.Color('#d9cfb6').convertSRGBToLinear(),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function yard(G,b,par){if(!G||!b)return;const F=realFoot(G),r=b.r||0,dx=Math.sin(r),dz=Math.cos(r),fx=b.x+dx*F[3],fz=b.z+dz*F[3];let best=null,bd=1e9;
  doc.roads.forEach(rd=>{if(rd.type==='bridge')return;const d=lineD(fx,fz,rd.pts)-KERB[rd.type];if(d<bd){bd=d;best=rd;}});if(!best||bd<.15||bd>4)return;
  const ex=fx+dx*(bd+KERB[best.type]),ez=fz+dz*(bd+KERB[best.type]);if(lineD(ex,ez,best.pts)>.8)return;/* the road is not straight ahead of the front */
  /* the road must run square to the front: measure at both front corners (a slanted road gave paving that crossed the road, Paul 14 Nov 2026) */const cr=Math.cos(r),sr=Math.sin(r),dAt=lx=>{const px=fx+cr*lx,pz=fz-sr*lx;return lineD(px,pz,best.pts)-KERB[best.type];},dL=dAt(F[0]+.2),dR=dAt(F[2]-.2);if(Math.abs(dL-dR)>.35||Math.min(dL,dR)<.1)return;bd=Math.min(bd,dL,dR);
  const w=(F[2]-F[0])*.92,dep=bd+.15,m=new THREE.Mesh(new THREE.PlaneGeometry(w,dep),YARDM);m.rotation.set(-Math.PI/2,0,r,'YXZ');m.rotation.order='YXZ';m.rotation.y=r;m.rotation.x=-Math.PI/2;
  G.userData.yd=+dep.toFixed(2);const cx=fx+dx*dep/2,cz=fz+dz*dep/2;m.position.set(cx+Math.cos(r)*(F[0]+F[2])/2,Math.max(Hg(cx,cz),doc.sea)+.05,cz-Math.sin(r)*(F[0]+F[2])/2);m.receiveShadow=true;m.userData.yard=1;par.add(m);}
/* once per map: shops whose real footprint (terrace and all) sits on a road are moved back to the road's edge plus the front yard */
function islandVehicles(){if(!PLAYER||doc.vehdef)return;doc.vehdef=1;if((doc.veh||[]).length)return;const r=doc.roads.find(q=>q.type!=='bridge'&&q.pts.length>1);if(!r)return;
  const a=r.pts[0],b=r.pts[r.pts.length-1],at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],ang=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const p1=at(.25),p2=at(.6),p3=at(.8);doc.veh=[{k:'islandbus',x:p1[0],z:p1[1],r:ang,go:true},{k:'bike',x:p2[0],z:p2[1],r:ang,go:true},{k:'bike',x:p3[0],z:p3[1],r:ang+Math.PI,go:true}];
  /* the food truck parks on the grass beside the road, a little away from the shops */const p4=at(.45);let fx=p4[0],fz=p4[1]+5.2;if(doc.bld.some(o=>Math.hypot(o.x-fx,o.z-fz)<6))fz=p4[1]-5.2;doc.veh.push({k:'foodtruck',x:+fx.toFixed(2),z:+fz.toFixed(2),r:ang,go:false});rebuild(['veh']);save();}
function gridRoads(){if(!GRID||doc.gridfix)return;doc.gridfix=1;let ch=0;doc.roads.forEach(r=>{if(r.type==='bridge')return;const P=[];r.pts.forEach(q=>{const a=[gs(q[0]),gs(q[1])];const l=P[P.length-1];if(!l||l[0]!==a[0]||l[1]!==a[1])P.push(a);});
    /* a diagonal step becomes an L along the grid */const Q=[];P.forEach((a,i)=>{const l=Q[Q.length-1];if(l&&l[0]!==a[0]&&l[1]!==a[1])Q.push([a[0],l[1]]);Q.push(a);});if(JSON.stringify(Q)!==JSON.stringify(r.pts)){r.pts=Q;ch++;}});
  doc.roads=doc.roads.filter(r=>r.pts.length>1);if(ch){mergeRoads();doc.settled3_0_75=0;Object.keys(doc).filter(k=>k.startsWith('settled3_')).forEach(k=>delete doc[k]);rebuild();save();}}
function railClean(){if(!PLAYER||doc.railclean)return;doc.railclean=1;const n0=doc.roads.length+doc.paths.length;doc.roads=doc.roads.filter(r=>!roadVsRail(r.pts,r.type));doc.paths=doc.paths.filter(p=>!roadVsRail(p.pts,'lane'));const n=n0-doc.roads.length-doc.paths.length;if(n){rebuild();save();toast('เอาถนนที่ทับรางหรือสถานีออก '+n+' เส้น');}}
function settleOffRoads(){railClean();gridRoads();islandVehicles();if(mergeRoads()){rebuild(REB.roads);save();}const KEY='settled3_'+BS;if(doc[KEY])return;let n=0;doc.bld.forEach((b,i)=>{const G=E.bld&&E.bld.list?E.bld.list[i]:null;if(!G||b.fixed)return;const F=realFoot(G);if(!footOnRoad(b.x,b.z,b.r||0,F,.1)){/* not on a road: still pull it up to the kerb + yard if it faces a road close by (sizes changed) */const sn=snapB(b.x,b.z,0,F);if(!sn||Math.abs(((sn.r-(b.r||0)+Math.PI*3)%(Math.PI*2))-Math.PI)>.3||Math.hypot(sn.x-b.x,sn.z-b.z)<.3||footOnRoad(sn.x,sn.z,sn.r,F,.1)||doc.bld.some((o,k)=>k!==i&&Math.hypot(o.x-sn.x,o.z-sn.z)<4))return;b.x=sn.x;b.z=sn.z;b.r=sn.r;n++;return;}const sn=snapB(b.x,b.z,0,F);if(sn&&!footOnRoad(sn.x,sn.z,sn.r,F,.1)){b.x=sn.x;b.z=sn.z;b.r=sn.r;n++;}});
  doc[KEY]=1;if(n){rebuild(REB.bld||['bld']);save();toast('ขยับร้าน '+n+' หลังออกจากถนน');}}/* front yard between the front of a shop (terrace included) and the kerb */
function addBld(b){const G=E.bld.build({style:b.s,x:b.x,z:b.z,rot:b.r||0,sign:b.sign||undefined,wall:b.wall||undefined});if(G&&BS!==1)G.scale.setScalar(BS);return G;}
const LAYER_ENG={terr:'Ground',fol:'Plants',sky:'Sky',wl:'Sea life',road:'Roads',bld:'Buildings'};
function applyLayers(k){const e=E[k],L=doc.layers[k];if(!e||!e.setLayer||!L)return;Object.keys(L).forEach(n=>e.setLayer(n,L[n]));}
const ORDER=['road','terr','water','wl','props','bld','biz','fol','life','veh','rail'];/* trees after the buildings, so they keep clear of every footprint */
window.__ED={get doc(){return doc;},set doc(d){doc=d;},E,G,cam,get ctl(){return ctl;},get mergeRoads(){return mergeRoads;},get H(){return {roadVsRail,stations,snapB,realFoot,footOnRoad,footPts,onRail,lineD,Hg,BIZ,BNAME,save,starter,railPts,KERB,why,fps,inStation,smallInc,BADGES,lotOf,seaFace,obbHit,chk,snapLot,placeMoved,act,select,st};},get rebuild(){return rebuild;}};/* for tests and the agent team */
function rebuild(list){const t0=performance.now();(list||ORDER).forEach(k=>{try{mk[k]();if(k==='bld'||k==='biz')FPS=null;applyLayers(k);}catch(e){console.error(k,e);status('Error in '+k+': '+e.message);}});if(!PLAYER)status('Rebuilt '+(list||['all']).join(', ')+' in '+Math.round(performance.now()-t0)+' ms');}

/* ---------- undo / save ---------- */
const undo=[],redo=[];const snap=()=>{undo.push(JSON.stringify(doc));if(undo.length>40)undo.shift();redo.length=0;if(window.__undoUI)__undoUI();};
const save=()=>{try{localStorage.setItem(SKEY,JSON.stringify(doc));}catch(e){}};
let status=t=>{};

/* ================= city-builder style interface =================
   Bottom bar: categories. Above it a tray of picture cards. Pick a card, a see-through ghost follows the pointer
   (green ring = OK, red = can't build here); tap to place, keep tapping to place more. Roads and paths: drag to draw.
   Land: drag to paint. No card picked: tap anything to select it, then rotate / move / copy / remove from the bubble.
   Camera: drag = move around, right-drag or two fingers = turn, wheel or pinch = zoom. */
const toastEl=$('toast');let toastT=0;function toast(t){toastEl.textContent=t;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),2200);}
status=toast;
cam.position.set(0,62*CS,58*CS);ctl.target.set(0,0,0);ctl.screenSpacePanning=false;ctl.minDistance=8;ctl.maxDistance=160*CS;ctl.maxPolarAngle=1.25;

/* ---------- picture cards: each building and prop drawn once into a small image ---------- */
const TH={};const TR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});TR.setSize(112,112);TR.outputEncoding=THREE.sRGBEncoding;
const tScene=new THREE.Scene();tScene.add(new THREE.HemisphereLight(0xdff0ff,0x9a8a68,.9));{const l=new THREE.DirectionalLight(0xfff2dc,.9);l.position.set(-3,5,4);tScene.add(l);}
const tCam=new THREE.PerspectiveCamera(30,1,.1,500);const tB=BuildingKit.create({scene:tScene,heightAt:()=>0}),tP=PropsEngine.create({scene:tScene,heightAt:()=>0});
function snapObj(G){const b=new THREE.Box3().setFromObject(G),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),r=Math.max(s.x,s.y,s.z)*.62+.3;
  tCam.position.set(c.x+r*1.5,c.y+r*1.1,c.z+r*2.1);tCam.lookAt(c);TR.render(tScene,tCam);const u=TR.domElement.toDataURL();tScene.remove(G);return u;}
const thumbQ=[];let thumbBusy=false;function thumb(kind,key,img){const id=kind+':'+key;if(TH[id]){img.src=TH[id];return;}thumbQ.push([kind,key,id,img]);if(!thumbBusy)pump();}
function pump(){const j=thumbQ.shift();if(!j){thumbBusy=false;return;}thumbBusy=true;const[kind,key,id,img]=j;if(!TH[id]){try{let G;if(kind==='v'){G=new THREE.Group();tScene.add(G);VehicleEngine.create({scene:G,heightAt:()=>0}).add(key,0,0,{rot:-.5});}else if(kind==='b')G=tB.build({style:key,sign:SAMPLE_SIGN[key]});else{const o={};if(key==='fence')o.lines=[[-2,0],[2,0]];if(key==='jetty')o.lines=[[0,-4],[0,4]];G=tP.add(key,0,0,o);}TH[id]=snapObj(G);}catch(e){TH[id]='';}}
  if(TH[id])img.src=TH[id];setTimeout(pump,0);}
const SAMPLE_SIGN={shop:'STORE',cafe:'CAFE',kiosk:'KIOSK',strip:'NOODLES',pub:'HOTEL',bigbox:'MEGA STORE',mallshop:'BOOKS',heritage:'MUSEUM'};

/* ---------- names and icons ---------- */
const BNAME={units:'บ้านพักสีเหลือง',islandcottage:'บ้านพักหินปูน',cabin:'กระท่อมพัก',cottage:'กระท่อม',house:'บ้าน',bungalow:'บ้านอิฐ',terrace:'ทาวน์เฮาส์',flats:'อพาร์ตเมนต์',shop:'ร้านค้า',strip:'ร้านริมถนน',mallshop:'ร้านในห้าง',cafe:'คาเฟ่',kiosk:'คีออส',pub:'โรงแรมหัวมุม',bigbox:'ห้างใหญ่',heritage:'อาคารเก่า',slab:'ออฟฟิศ',tower:'ตึกสูง',lighthouse:'ประภาคาร'};
const BGROUP=[['บ้านบนเกาะ',['islandcottage','units','cabin','cottage','lighthouse']],['บ้าน',['house','bungalow','terrace','flats']],['ร้านค้า',['shop','strip','mallshop','cafe','kiosk','pub','bigbox']],['เมือง',['heritage','slab','tower']]];
const LIFE_IC={walker:'🚶',jogger:'🏃',cyclist:'🚴',quokka:'🐹',kangaroo:'🦘',gull:'🕊️',butterfly:'🦋',pelican:'🦢',dolphin:'🐬',boat:'⛵',kayak:'🛶',picnic:'🧺',sandcastle:'🏰',dogfetch:'🐕',flock:'🐦',fishjump:'🐟',sitter:'🪑',swimmer:'🏊',sunbather:'🏖️',fisher:'🎣',seal:'🦭'};
const LIFE_TH={walker:'คนเดิน',jogger:'คนวิ่ง',cyclist:'จักรยาน',quokka:'ควอกก้า',kangaroo:'จิงโจ้',gull:'นกนางนวล',butterfly:'ผีเสื้อ',pelican:'นกกระทุง',dolphin:'โลมา',boat:'เรือ',kayak:'คายัค',picnic:'ปิกนิก',sandcastle:'ปราสาททราย',dogfetch:'หมาคาบบอล',flock:'ฝูงนก',fishjump:'ปลากระโดด',sitter:'คนนั่งม้านั่ง',swimmer:'คนว่ายน้ำ',sunbather:'อาบแดด',fisher:'ตกปลา',seal:'แมวน้ำ'};
const CATS=[['build','🏠','สร้าง'],['road','🛣️','ถนน'],['nature','🌳','ธรรมชาติ'],['decor','🪑','ตกแต่ง'],['veh','🚗','ยานพาหนะ'],['land','⛰️','พื้นดิน'],['life','🐾','ชีวิต'],['sky','☀️','ฟ้า'],['biz','💼','ธุรกิจ'],['bulldoze','🚜','รื้อ']].filter(c=>!PLAYER||!['land','life','sky'].includes(c[0]));

/* ---------- state ---------- */
const st={cat:null,pick:null,rot:0,rad:5,str:.6,treeSize:1,sign:'',wall:'',sel:null,moving:null,draw:null};
const bar=$('bar'),tray=$('tray');
CATS.forEach(([k,ic,name])=>{const b=document.createElement('button');b.className='cat';b.dataset.k=k;b.innerHTML=`<span class=ic>${ic}</span><span class=nm>${name}</span>`;b.onclick=()=>openCat(st.cat===k?null:k);bar.appendChild(b);});
function setMode(){/* how the camera answers the left button / one finger */const drawing=(st.cat==='land'&&st.pick)||(st.cat==='road'&&st.pick);
  ctl.mouseButtons={LEFT:drawing?-1:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};ctl.touches={ONE:drawing?-1:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};
  ring.visible=st.cat==='land'&&!!st.pick;R.domElement.style.cursor=st.cat==='bulldoze'?'not-allowed':st.pick?'crosshair':'grab';}
function openCat(k){if(pend)cancelPend();if(GOV)GOV.visible=false;st.cat=k;st.hold=false;st.pick=null;st.draw=null;drawLine();clearGhost();deselect();[...bar.children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));tray.classList.toggle('open',!!k&&k!=='bulldoze');fillTray();setMode();
  if(k==='bulldoze')toast('แตะของที่อยากรื้อ (ย้อนได้ด้วย ↶)');}
/* decor: Thai names; the bigger sets and a few park things earn a little every day (QA idea 1) */
const DNAME={lamp:'โคมไฟ',bench:'ม้านั่ง',bin:'ถังขยะ',sign:'ป้าย',busstop:'ป้ายรถเมล์',fence:'รั้ว',bollard:'เสากั้น',planter:'กระถางดอกไม้',picnic:'โต๊ะปิกนิก',bikerack:'ที่จอดจักรยาน',bikes:'จักรยานให้เช่า',umbrella:'ร่มชายหาด',jetty:'ท่าเทียบเรือ',buoy:'ทุ่น',rock:'ก้อนหิน',crate:'ลังไม้',tap:'ก๊อกน้ำ',playground:'สนามเด็กเล่น',cafeset:'โต๊ะคาเฟ่ริมทาง',fishstall:'แผงปลาสด',gardenplot:'แปลงผัก',bikerepair:'จุดซ่อมจักรยาน'};
const DINC={picnic:20,umbrella:10,bikes:25,busstop:15,playground:40,cafeset:35,fishstall:60,gardenplot:25,bikerepair:45};
const DPRICE={picnic:200,umbrella:150,bikes:400,busstop:300,playground:800,cafeset:700,fishstall:1200,gardenplot:500,bikerepair:900};
/* plain shop buildings with a sign also trade a little */
const BLDINC={kiosk:40,shop:60,cafe:70,pub:90,strip:60,mallshop:60};
/* lot size (width x depth, terrace included) for the cards */
const LOT={};function lotOf(key,biz){const id=(biz?'z:':'b:')+key;if(LOT[id]!=null)return LOT[id];let t='';try{let G;if(biz){const d=BIZ[key];G=d.prop?tP.add(d.prop,0,0,{}):tB.build(bopts(d,{x:0,z:0}));}else G=tB.build({style:key});const F=realFoot(G),k=BS;t='ที่ '+Math.round((F[2]-F[0])*k)+'×'+Math.round((F[3]-F[1])*k);tScene.remove(G);G.traverse(o=>{if(o.geometry)o.geometry.dispose();});}catch(e){}return LOT[id]=t;}
const card=(key,label,html,on)=>`<button class="card${on?' on':''}" data-key="${key}">${html}<span>${label}</span></button>`;
function fillTray(){const k=st.cat;let h='';
  if(k==='build'){const g=BGROUP[st.bg||0];h=`<div class=chips>${BGROUP.map(([n],i)=>`<button class="chip${(st.bg||0)===i?' on':''}" data-bg=${i}>${n}</button>`).join('')}</div><div class=cards>${g[1].map(s=>card(s,BNAME[s]||s,`<img data-b="${s}"><em class=lot>${lotOf(s,0)}</em>`,st.pick===s)).join('')}</div>`+
    `<div class=opts><label>ป้าย <input id=o_sign maxlength=18 value="${st.sign}" placeholder="ชื่อร้าน"></label><label>สีผนัง <input type=color id=o_wall value="${st.wall||'#f2e6c8'}"><input type=checkbox id=o_wallon ${st.wall?'checked':''}></label><button class=mini id=o_rot>⟳ หมุน</button></div>`;}
  if(k==='decor')h=`<div class=cards>${PropsEngine.kinds.map(p=>card(p,DNAME[p]||p,`<img data-p="${p}">`+(DINC[p]&&(!PLAYER||PLAYER_DINC.includes(p))?`<em class=price>${money(priceOf('decor',p))}</em><em class=inc>+${money(DINC[p])}/วัน</em>`:''),st.pick===p)).join('')}</div><div class=opts><button class=mini id=o_rot>⟳ หมุน</button></div>`;
  if(k==='veh'){const VG=PLAYER?[['รถ','road'],['จักรยาน','bike'],['เรือ','water']]:[['รถ','road'],['เรือ','water'],['เครื่องบิน','air'],['รถไฟ','rail'],['จักรยาน','bike']],cg=(VG[st.vg||0]||VG[0])[1];
    h=`<div class=chips>${VG.map(([n],i)=>`<button class="chip${(st.vg||0)===i?' on':''}" data-vg=${i}>${n}</button>`).join('')}</div><div class=cards>${VehicleEngine.kinds.filter(q=>VCAT(q)===cg&&vehOK(q)).map(q=>card(q,VehicleEngine.KINDS[q].name,`<img data-v="${q}">`,st.pick===q)).join('')}</div>`+
    `<div class=opts><label><input type=checkbox id=o_vgo ${st.vgo!==false?'checked':''}> ให้วิ่ง (วางบนถนน/ในน้ำ)</label><label>สี <input type=color id=o_vc value="${st.vc||'#c8344a'}"><input type=checkbox id=o_vcon ${st.vc?'checked':''}></label><button class=mini id=o_rot>⟳ หมุน</button></div>`;}
  if(k==='nature')h=`<div class=cards>${(PLAYER?[]:[['gum','🌳','ยูคาลิปตัส'],['pine','🌲','สน'],['pepper','🌿','เปปเปอร์มินต์']]).concat([['islandpine','🌲','สนเกาะ'],['teatree','🌳','ทีทรีเกาะ'],['wattle','🌼','วอตเทิล'],['saltbush','🌿','ซอลต์บุช'],['daisybush','🌼','เดซี่ชายฝั่ง'],['fig','🌳','มะเดื่อใหญ่'],['norfolk','🎄','สนนอร์ฟอล์ก'],['datepalm','🌴','อินทผลัม'],['palm','🌴','ปาล์ม']]).map(([t,e,n])=>card(t,n,`<i>${e}</i>`,st.pick===t)).join('')}</div>
    <div class=opts>${PLAYER?'':['tuft','flower','bush','tree'].map(q=>`<label>${{tuft:'หญ้า',flower:'ดอกไม้',bush:'พุ่มไม้',tree:'ป่า'}[q]} <input type=range class=o_den data-k=${q} min=0 max=${{tuft:3,flower:1,bush:.12,tree:.03}[q]} step=${{tuft:.1,flower:.05,bush:.005,tree:.001}[q]} value=${doc.fol[q]}></label>`).join('')}</div>`;
  if(k==='road')h=`<div class=grp><b>ถนน (ลากเพื่อวาด)</b><div class=cards>${[['island','🛵','ถนนบนเกาะ'],['bikepath','🚲','ทางจักรยานแดง'],['street','🛣️','ถนนเมือง'],['arterial','🛤️','ถนนใหญ่'],['highway','🏎️','ทางหลวง'],['lane','🌾','ถนนชนบท'],['bridge','🌉','สะพาน']].filter(r=>!PLAYER||['island','bikepath','lane'].includes(r[0]))/* player version: island roads only (Paul, 14 Nov 2026) */.map(([t,e,n])=>card('r:'+t,n,`<i>${e}</i>`,st.pick==='r:'+t)).join('')}</div></div>
    ${`<div class=grp><b>ทางเดิน</b><div class=cards>${[['path','👣','ทางเท้า'],['lane','🚴','เลนจักรยาน'],['gravel','🪨','ทางกรวด']].filter(r=>!PLAYER||r[0]==='path')/* players: footpaths (Paul, 14 Nov 2026) */.map(([t,e,n])=>card('p:'+t,n,`<i>${e}</i>`,st.pick==='p:'+t)).join('')}</div></div>`}
    <div class=opts>${PLAYER?'<label>แนวตรง X / Z</label>':`<label><input type=checkbox id=o_s8 ${st.snap8!==false?'checked':''}> แนว 8 ทิศ</label>`}${PLAYER?'':`<label>🚗 รถ <button class=mini data-step=-2>−</button> <b id=o_cars>${doc.cars||0}</b> <button class=mini data-step=2>+</button></label>`}</div>`;
  if(k==='land')h=`<div class=cards>${[['raise','⛰️','ยกขึ้น'],['lower','🕳️','กดลง'],['flatten','▭','ปรับเรียบ'],['smooth','〰️','ลบเหลี่ยม'],['beach','🏖️','หาดทราย'],['sea','🌊','ขุดทะเล'],['noise','🪨','ขรุขระ']].map(([t,e,n])=>card(t,n,`<i>${e}</i>`,st.pick===t)).join('')}</div>
    <div class=opts><label>ขนาดแปรง <input type=range id=o_rad min=1 max=16 step=.5 value=${st.rad}></label><label>แรง <input type=range id=o_str min=.1 max=1.5 step=.05 value=${st.str}></label></div>`;
  if(k==='biz'){const g=BIZ_GROUPS[st.zg||0];h=`<div class=chips>${BIZ_GROUPS.map(([n],i)=>`<button class="chip${(st.zg||0)===i?' on':''}" data-zg=${i}>${n}</button>`).join('')}<span class=cash>💰 ${money(doc.money)}</span></div><div class=cards>${g[1].map(t=>{const d=BIZ[t];return card(t,d.n,`<i>${d.ic}</i><em class=price>${money(d.price)}</em>${earns(t)?`<em class=inc>+${money(d.inc)}/${d.rent?'คืน':'วัน'}</em>`:''}${d.boat?'':`<em class=lot>${lotOf(t,1)}</em>`}`,st.pick===t);}).join('')}</div><div class=opts><button class=mini id=o_rot>⟳ หมุน</button><span class=hint>${PLAYER?'วันละ 30 วินาที บ้านเช่าและเรือประมงได้เงินทุกวัน (ร้านอื่นตกแต่งเกาะ เพราะคิปมีรายได้จากคาเฟ่แล้ว) แผงปลากับแปลงผักก็ได้เงิน':'วันละ 30 วินาที ธุรกิจได้เงินทุกวัน อัปเกรดได้ถึง ★★★'}</span></div>`;}
  if(k==='life')h=`<div class=cards>${KINDS_LIFE.map(q=>`<div class="card stepper"><i>${LIFE_IC[q]}</i><span>${LIFE_TH[q]}</span><div><button class=mini data-l="${q}" data-d=-1>−</button><b id=lc_${q}>${doc.life[q]|0}</b><button class=mini data-l="${q}" data-d=1>+</button></div></div>`).join('')}</div>`;
  if(k==='sky')h=`<div class=cards>${[['6.5','🌅','เช้า'],['12','☀️','เที่ยง'],['18.2','🌇','เย็น'],['21','🌙','กลางคืน']].map(([v,e,n])=>card('h:'+v,n,`<i>${e}</i>`,false)).join('')}${[['sunny','😎','แดดจ้า'],['breezy','🍃','ลมเย็น'],['golden','✨','แสงทอง'],['clear-night','⭐','ฟ้าใส']].map(([v,e,n])=>card('w:'+v,n,`<i>${e}</i>`,doc.sky.wx===v)).join('')}</div>
    <div class=opts><label>เวลา <input type=range id=o_hr min=5 max=21 step=.1 value=${doc.sky.hour}></label><label>ระดับทะเล <input type=range id=o_sea min=-1 max=1 step=.05 value=${doc.sea}></label></div>`;
  tray.innerHTML=h;
  tray.querySelectorAll('img[data-b]').forEach(i=>thumb('b',i.dataset.b,i));tray.querySelectorAll('img[data-p]').forEach(i=>thumb('p',i.dataset.p,i));tray.querySelectorAll('img[data-v]').forEach(i=>thumb('v',i.dataset.v,i));tray.querySelectorAll('[data-vg]').forEach(b=>b.onclick=()=>{st.vg=+b.dataset.vg;fillTray();});
  tray.querySelectorAll('button.card').forEach(b=>b.onclick=()=>pickCard(b.dataset.key));tray.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{st.bg=+b.dataset.bg;fillTray();});tray.querySelectorAll('[data-zg]').forEach(b=>b.onclick=()=>{st.zg=+b.dataset.zg;fillTray();});bindOpts();}
function pickCard(key){if(st.cat==='sky'){if(key.startsWith('h:')){doc.sky.hour=+key.slice(2);const r=$('o_hr');if(r)r.value=doc.sky.hour;}else{doc.sky.wx=key.slice(2);Sky.setWeather(doc.sky.wx);fillTray();}save();return;}
  if(pend)cancelPend(true);st.hold=false;st.pick=st.pick===key?null:key;st.draw=null;drawLine();tray.querySelectorAll('button.card').forEach(b=>b.classList.toggle('on',b.dataset.key===st.pick));clearGhost();if(st.pick)makeGhost();setMode();
  if(st.pick)toast(st.cat==='road'?'กดค้างแล้วลากเพื่อวาด ปล่อยนิ้วเพื่อสร้าง':st.cat==='land'?'ลากบนพื้นเพื่อปั้น':'แตะพื้นเพื่อวาง แตะซ้ำได้หลายที่');}
function bindOpts(){const q=s=>tray.querySelector(s);const on=(s,ev,f)=>{const e=q(s);if(e)e[ev]=f;};
  on('#o_sign','oninput',e=>{st.sign=e.target.value.toUpperCase();makeGhost();});on('#o_wall','oninput',e=>{if(q('#o_wallon').checked){st.wall=e.target.value;makeGhost();}});on('#o_wallon','onchange',e=>{st.wall=e.target.checked?q('#o_wall').value:'';makeGhost();});
  on('#o_rot','onclick',rotate);on('#o_vgo','onchange',e=>st.vgo=e.target.checked);on('#o_vc','oninput',e=>{if(q('#o_vcon').checked){st.vc=e.target.value;makeGhost();}});on('#o_vcon','onchange',e=>{st.vc=e.target.checked?q('#o_vc').value:'';makeGhost();});on('#o_s8','onchange',e=>st.snap8=e.target.checked);on('#o_rad','oninput',e=>st.rad=+e.target.value);on('#o_str','oninput',e=>st.str=+e.target.value);
  tray.querySelectorAll('.o_den').forEach(i=>i.onchange=()=>{snap();doc.fol[i.dataset.k]=+i.value;rebuild(['fol']);save();});
  tray.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{snap();doc.cars=Math.max(0,Math.min(40,(doc.cars||0)+ +b.dataset.step));$('o_cars').textContent=doc.cars;rebuild(['road']);save();});
  tray.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const k=b.dataset.l;snap();doc.life[k]=Math.max(0,Math.min(40,(doc.life[k]|0)+ +b.dataset.d));$('lc_'+k).textContent=doc.life[k];clearTimeout(bindOpts.t);bindOpts.t=setTimeout(()=>{rebuild(['life']);hud();save();},400);});
  on('#o_hr','oninput',e=>{doc.sky.hour=+e.target.value;save();});on('#o_sea','onchange',e=>{snap();doc.sea=+e.target.value;rebuild();save();});}
function rotate(){st.rot=(st.rot+Math.PI/4)%(Math.PI*2);if(ghost.obj)ghost.obj.rotation.y=st.rot;}

/* ---------- confirm: nothing is built until the green tick is pressed ---------- */
const cf=$('confirm');let pend=null;
function propose(o){if(pend&&pend!==o){const old=pend;pend=null;old.no&&old.no(true);}pend=o;
  cf.innerHTML=`<span>${o.label}</span>${o.rot?'<button data-c=rot title="หมุน (R)">⟳</button>':''}<button data-c=no class=no title="ยกเลิก (Esc)">✕</button><button data-c=ok class=ok title="ยืนยัน (Enter)">✓</button>`;cf.classList.add('on');tray.classList.add('peek');
  cf.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();const c=b.dataset.c;if(c==='ok')okPend();else if(c==='no')cancelPend();else rotate();});}
function okPend(){const p=pend;if(!p)return;pend=null;cf.classList.remove('on');tray.classList.remove('peek');p.ok();}
function cancelPend(quiet){const p=pend;if(!p)return;pend=null;cf.classList.remove('on');tray.classList.remove('peek');p.no&&p.no();if(!quiet)toast('ยกเลิกแล้ว');}
/* ---------- ghost preview + validity ring ---------- */
const ghost={grp:new THREE.Group(),obj:null,ok:true};scene.add(ghost.grp);ghost.grp.visible=false;
/* block grid overlay round the pointer (player version, build and road modes): lines laid on the ground every GRID units */
const GOV=(()=>{if(!GRID)return null;const n=9,seg=8,pts=(n+1)*2*seg*2,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(pts*3*2),3));
  const L=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.45,depthTest:false}));L.renderOrder=9;L.frustumCulled=false;L.visible=false;scene.add(L);
  L.place=(x,z)=>{const P=g.attributes.position.array;let k=0;const cx=Math.round(x/GRID)*GRID-GRID*(n/2)+GRID/2,cz=Math.round(z/GRID)*GRID-GRID*(n/2)+GRID/2,S=GRID*n,
      put=(ax,az)=>{P[k++]=ax;P[k++]=Math.max(Hg(ax,az),doc.sea)+.08;P[k++]=az;};/* block edges sit half a block off the road centre lines */
    for(let i=0;i<=n;i++){const lx=cx+i*GRID-GRID/2,lz=cz+i*GRID-GRID/2;for(let j=0;j<seg;j++){const a=cz-GRID/2+S*j/seg,b=cz-GRID/2+S*(j+1)/seg;put(lx,a);put(lx,b);const c=cx-GRID/2+S*j/seg,d=cx-GRID/2+S*(j+1)/seg;put(c,lz);put(d,lz);}}
    while(k<P.length)P[k++]=0;g.attributes.position.needsUpdate=true;g.setDrawRange(0,k/3);L.visible=true;};return L;})();
const okRing=new THREE.Mesh(new THREE.RingGeometry(.85,1,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x3ccf6a,transparent:true,opacity:.85,depthTest:false}));okRing.renderOrder=10;ghost.grp.add(okRing);
const gB=BuildingKit.create({scene:new THREE.Group(),heightAt:()=>0}),gP=PropsEngine.create({scene:new THREE.Group(),heightAt:()=>0});let gV=null;
function seeThrough(G){G.traverse(o=>{if(o.material){const m=(Array.isArray(o.material)?o.material:[o.material]).map(x=>{const c=x.clone();c.transparent=true;c.opacity=.6;c.depthWrite=false;return c;});o.material=Array.isArray(o.material)?m:m[0];o.castShadow=false;}});}
function clearGhost(){if(ghost.obj){ghost.grp.remove(ghost.obj);ghost.obj=null;}ghost.grp.visible=false;}
function makeGhost(){if(ghost.obj){ghost.grp.remove(ghost.obj);ghost.obj=null;}const k=st.cat,p=st.pick;let G=null,rad=1;
  if(k==='build'&&p){G=gB.build({style:p,sign:st.sign||SAMPLE_SIGN[p],wall:st.wall||undefined});const f=G.userData.foot;rad=Math.hypot(f[2]-f[0],f[3]-f[1])/2*BS;G.position.set(0,0,0);G.scale.setScalar(BS);}
  else if(k==='decor'&&p){const o={};if(p==='fence')o.lines=[[-2,0],[2,0]];if(p==='jetty')o.lines=[[0,0],[0,10]];G=gP.add(p,0,0,o);rad=p==='jetty'?5:1.2;}
  else if(k==='biz'&&p){const d=BIZ[p];if(d.prop)G=gP.add(d.prop,0,0,{sign:d.sign});else if(d.boat)G=boatMesh(d.boat);else{G=gB.build(bopts(d,{}));G.scale.setScalar(BS);}
    const f=(G.userData&&G.userData.foot)||[-2,-2,2,2];rad=d.boat?(d.boat==='ferry'?5.5:d.boat==='party'?4:3):Math.hypot(f[2]-f[0],f[3]-f[1])/2;G.position.set(0,0,0);}
  else if(k==='veh'&&p){const hold=new THREE.Group();gV=VehicleEngine.create({scene:hold,heightAt:()=>0});const v=gV.add(p,0,0,{color:st.vc||undefined});G=hold;rad=Math.max(1.4,(v.L||3)/2+.4);}
  else if((k==='nature'&&p)||(st.moving)){rad=1.2;}
  if(G){G.parent&&G.parent.remove(G);seeThrough(G);G.rotation.y=st.rot;ghost.obj=G;ghost.grp.add(G);}okRing.scale.setScalar(rad);ghost.rad=rad;}
/* face the nearest road: front (+z) turns to the road, front wall sits just behind the kerb / footpath */
const KERB={bikepath:1.1,island:2.35,street:2.8,arterial:4.9,highway:3.8,lane:1.4,bridge:3.8};
/* holiday rentals by the shore face the sea instead of the road (beachfront, QA idea 3) */
function seaFace(x,z){let best=null,bd=11;for(let a=0;a<16;a++){const q=a/16*Math.PI*2,dx=Math.sin(q),dz=Math.cos(q);for(let d=2;d<bd;d+=1){if(Hg(x+dx*d,z+dz*d)<doc.sea){bd=d;best=q;break;}}}return best;}
function snapLot(x,z,G,pick){if(pick&&BIZ[pick]&&BIZ[pick].rent){const q=seaFace(x,z);if(q!=null){const h=GRID?GRID/2:0;return{x:h?Math.round(x/h)*h:+x.toFixed(2),z:h?Math.round(z/h)*h:+z.toFixed(2),r:+(Math.round(q/(Math.PI/2))*Math.PI/2).toFixed(3),sea:1};}}return snapB(x,z,0,realFoot(G));}
function snapB(x,z,front,F){if(F)front=F[3];let best=null,bd=1e9;doc.roads.forEach(r=>{if(r.type==='bridge')return;for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],vx=b[0]-a[0],vz=b[1]-a[1],L2=vx*vx+vz*vz||1e-6;let t=((x-a[0])*vx+(z-a[1])*vz)/L2;t=Math.max(0,Math.min(1,t));const px=a[0]+vx*t,pz=a[1]+vz*t,d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best={px,pz,r};}}});
  if(!best)return null;const off=KERB[best.r.type]+front+(F?YARD:.25);if(bd>off+6)return null;let nx=best.px-x,nz=best.pz-z;const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;
  let X=best.px-nx*off,Z=best.pz-nz*off;if(GRID){/* line lots up along the road: centre on a half-block step */const tx=-nz,tz=nx,a=X*tx+Z*tz,h=GRID/2,d=Math.round(a/h)*h-a;X+=tx*d;Z+=tz*d;}
  return{x:+X.toFixed(2),z:+Z.toFixed(2),r:+Math.atan2(nx,nz).toFixed(3)};}
/* one check for every placement, move and copy; returns '' when fine, otherwise the reason in plain Thai (QA, 14 Nov 2026) */
const fpName=e=>e.t==='biz'?(BIZ[doc.biz[e.i].t]||{}).n||'ร้าน':(BNAME[doc.bld[e.i].s]||'ตึก');
const isSkip=(sk,t,i)=>sk&&sk.type===t&&sk.i===i;
function why(o){const k=o.k,p=o.p||'',x=o.x,z=o.z,r=o.r||0,sk=o.skip,h=Hg(x,z);
  if(Math.abs(x)>LIM||Math.abs(z)>LIM)return'นอกเขตเกาะ';
  const boat=(k==='biz'&&BIZ[p]&&BIZ[p].boat)||(k==='veh'&&(VCAT(p)==='water'||p==='seaplane'));
  if(boat){if(h>doc.sea-.5)return'เรือต้องลอยในน้ำลึก';
    if(doc.biz.some((b,i)=>!isSkip(sk,'biz',i)&&BIZ[b.t]&&BIZ[b.t].boat&&Math.hypot(b.x-x,b.z-z)<7)||(doc.veh||[]).some((v,i)=>!isSkip(sk,'veh',i)&&VCAT(v.k)==='water'&&Math.hypot(v.x-x,v.z-z)<5))return'มีเรือลำอื่นจอดใกล้เกินไป';
    if(doc.props.some(q=>q.k==='jetty'&&lineD(x,z,[[q.x,q.z],[q.x+Math.sin(q.r||0)*(q.len||10),q.z+Math.cos(q.r||0)*(q.len||10)]])<1.2+(q.w||2)/2))return'ทับท่าเทียบเรือ';return'';}
  if(k==='decor'&&p==='buoy')return h>doc.sea-.3?'ทุ่นต้องอยู่ในน้ำ':'';
  if(k==='decor'&&p==='jetty'){const s=Math.sin(r),c=Math.cos(r);if(h<doc.sea-.8||h>doc.sea+1.6||Hg(x+s*7,z+c*7)>doc.sea-.2)return'ท่าเทียบเรือต้องเริ่มที่ริมฝั่งแล้วยื่นลงทะเล';return'';}
  if(h<doc.sea+.15)return'ตรงนี้เป็นทะเล';
  if(inStation(x,z,.4))return'ติดสถานีรถไฟ';
  const G=o.G,big=(k==='build'||k==='biz'||(k==='decor'&&G&&G.userData.foot))&&G;
  if(big){const F=realFoot(G),P=footPts(x,z,r,F),me={x,z,r,F};
    if(P.some(q=>Hg(q[0],q[1])<doc.sea+.05))return'ล้นลงทะเล ขยับเข้าฝั่งอีกนิด';
    /* no buildings on the beach: shops, houses and the café stand on the grass (Paul, 14 Nov 2026) */if(k!=='decor'&&E.terr&&E.terr.groundKind&&P.some(q=>E.terr.groundKind(q[0],q[1])==='sand'))return'อยู่บนชายหาด สร้างบนพื้นหญ้าเท่านั้น';
    if(railPts().length>1&&P.some(q=>onRail(q[0],q[1],1.4)))return'ทับรางรถไฟ';
    if(k==='decor'?doc.roads.some(rd=>rd.type!=='bridge'&&P.some(q=>lineD(q[0],q[1],rd.pts)<RW[rd.type]/2+.3)):footOnRoad(x,z,r,F,.15))return'ทับถนน';
    if(doc.paths.some(pa=>P.some(q=>lineD(q[0],q[1],pa.pts)<(pa.w||1.4)/2)))return'ทับทางเท้า';
    for(const e of fps()){if(isSkip(sk,e.t,e.i))continue;if(obbHit(me,e,.2))return'ชิด'+fpName(e)+'เกินไป';if(e.yd>.2&&obbHit(me,{x:e.x,z:e.z,r:e.r,F:yardF(e)},0))return'ทับลานหน้า'+fpName(e);}
    if(k==='decor'&&doc.props.some((q,i)=>!isSkip(sk,'props',i)&&inRect(q.x,q.z,me,F,.3)))return'มีของวางอยู่ตรงนี้แล้ว';
    return'';}
  if(onRail(x,z,k==='veh'?1.6:1.5))return'ทับรางรถไฟ';
  if(k==='nature'){if(kindAt(x,z)==='path')return'ปลูกบนถนนหรือทางเดินไม่ได้';if(inBld(x,z,.3))return'ติดตึกหรือลานหน้าร้าน';return'';}
  if(k==='decor'){if(doc.roads.some(rd=>rd.type!=='bridge'&&lineD(x,z,rd.pts)<RW[rd.type]/2+.4))return'ทับถนนหรือทางจักรยาน';if(doc.paths.some(pa=>lineD(x,z,pa.pts)<(pa.w||1.4)/2))return'ทับทางเท้า';
    if(inBld(x,z,.15))return'ทับตึกหรือลานหน้าร้าน';if(doc.props.some((q,i)=>!isSkip(sk,'props',i)&&Math.hypot(q.x-x,q.z-z)<.9))return'มีของวางอยู่ตรงนี้แล้ว';return'';}
  if(k==='veh'){if(inBld(x,z,.2,true))return'ทับตึก';const big2=p==='islandbus'||p==='foodtruck';
    if((doc.veh||[]).some((v,i)=>!isSkip(sk,'veh',i)&&VCAT(v.k)!=='water'&&Math.hypot(v.x-x,v.z-z)<(big2||v.k==='islandbus'||v.k==='foodtruck'?(p==='bike'||v.k==='bike'?2.6:5.5):1)))return'มีรถจอดอยู่ตรงนี้แล้ว';return'';}
  return'';}
function validAt(x,z,skip){const k=st.cat;st.why=why({k,p:st.pick||'',x,z,r:(k==='build'||k==='biz')&&st.snapTo?st.snapTo.r:st.rot,G:ghost.obj,skip});return!st.why;}

/* ---------- picking ---------- */
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function pick(e){const r=R.domElement.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mv,cam);
  const hit=E.terr&&ray.intersectObject(E.terr.mesh,false)[0];if(hit)return hit.point;plane.constant=-doc.sea;const p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null;}
const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:64},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.9}));ring.renderOrder=9;scene.add(ring);ring.visible=false;
function placeRing(p){const a=ring.geometry.attributes.position;for(let i=0;i<64;i++){const t=i/64*6.283,x=p.x+Math.cos(t)*st.rad,z=p.z+Math.sin(t)*st.rad;a.setXYZ(i,x,Math.max(Hg(x,z),doc.sea)+.15,z);}a.needsUpdate=true;}
const lineObj=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({color:0xffd84a,transparent:true,opacity:.75,depthTest:false,side:THREE.DoubleSide}));lineObj.renderOrder=9;scene.add(lineObj);
function drawLine(){const pts=st.draw?st.draw.pts:[];lineObj.geometry.dispose();if(pts.length<2){lineObj.geometry=new THREE.BufferGeometry();return;}const w=st.draw.w/2,P=[],I=[];
  for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,nx=-dz/l*w,nz=dx/l*w,y=Math.max(Hg(pts[i][0],pts[i][1]),doc.sea)+.25;P.push(pts[i][0]+nx,y,pts[i][1]+nz,pts[i][0]-nx,y,pts[i][1]-nz);if(i)I.push(i*2-2,i*2-1,i*2,i*2-1,i*2+1,i*2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);lineObj.geometry=g;}

/* ground brush (same maths as before) */
function brush(p,dt){const r=st.rad,s=st.str*dt*3,g=doc.h,i0=Math.max(0,Math.floor(p.x/CS+60-r/CS)),i1=Math.min(N-1,Math.ceil(p.x/CS+60+r/CS)),j0=Math.max(0,Math.floor(p.z/CS+60-r/CS)),j1=Math.min(N-1,Math.ceil(p.z/CS+60+r/CS)),old=g.slice(),m=st.pick;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=(i-60)*CS,z=(j-60)*CS,d=Math.hypot(x-p.x,z-p.z);if(d>r)continue;const w=Math.pow(1-d/r,1.5)*s,k=j*N+i;let h=g[k];
    if(m==='raise')h+=w;else if(m==='lower')h-=w;else if(m==='flatten')h+=(st.flat-h)*Math.min(1,w*2);
    else if(m==='smooth'){let a=0,n=0;for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const ii=i+u,jj=j+v;if(ii<0||jj<0||ii>=N||jj>=N)continue;a+=old[jj*N+ii];n++;}h+=(a/n-h)*Math.min(1,w*3);}
    else if(m==='beach')h+=(doc.sea+.35-h)*Math.min(1,w*2);else if(m==='sea')h+=(doc.sea-1.6-h)*Math.min(1,w*2);else if(m==='noise')h+=(hash(i*.37+performance.now()*.001,j*.41)-.5)*w*1.4;
    g[k]=Math.max(-8,Math.min(14,+h.toFixed(3)));}
  const mm=E.terr.mesh,pos=mm.geometry.attributes.position;for(let k=0;k<pos.count;k++){const x=pos.getX(k),z=pos.getZ(k);if(Math.abs(x-p.x)>r+1||Math.abs(z-p.z)>r+1)continue;pos.setY(k,Hg(x,z));}pos.needsUpdate=true;mm.geometry.computeBoundingSphere();}

/* ---------- selection bubble ---------- */
const selRing=new THREE.Mesh(new THREE.RingGeometry(.9,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthTest:false}));selRing.renderOrder=10;selRing.visible=false;scene.add(selRing);
const bub=$('bubble');
function nearest(p){let best=null,bd=3.2;const test=(arr,type,R2)=>arr.forEach((o,i)=>{const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<(R2||3.2)&&d<bd){bd=d;best={type,i};}});
  test(doc.props,'props');test(doc.veh||[],'veh',3.5);test(doc.trees,'trees');test(doc.bld,'bld',6);test(doc.biz||[],'biz',6);doc.paths.forEach((l,i)=>{const d=lineD(p.x,p.z,l.pts);if(d<Math.max(1,l.w)&&d<bd){bd=d;best={type:'paths',i};}});doc.roads.forEach((l,i)=>{const d=lineD(p.x,p.z,l.pts);if(d<RW[l.type]&&d<bd){bd=d;best={type:'roads',i};}});return best;}
const REB={veh:['veh'],biz:['biz','fol','life'],props:['props','fol'],trees:['fol'],bld:['bld','fol','life'],paths:['terr','fol','life'],roads:['road','terr','props','bld','biz','fol','life','veh']};
const selPos=s=>{const o=doc[s.type][s.i];if(o.x!=null)return{x:o.x,z:o.z};const m=o.pts[Math.floor(o.pts.length/2)];return{x:m[0],z:m[1]};};
function select(s){st.sel=s;const p=selPos(s),o=doc[s.type][s.i];selRing.visible=true;selRing.scale.setScalar(s.type==='bld'?6:s.type==='roads'||s.type==='paths'?3:1.6);selRing.position.set(p.x,Math.max(Hg(p.x,p.z),doc.sea)+.2,p.z);
  /* permanent fixtures (Kip's café, the jetty, landmarks): no move, turn, copy or remove (Paul, 14 Nov 2026) */if(o&&o.fixed){bub.innerHTML=`<b>📌 ${FIXNAME(s,o)}<br><small>ที่สำคัญของเกาะ ย้ายหรือรื้อไม่ได้</small></b><button data-a=x>✕</button>`;bub.classList.add('on');bub.querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.a));return;}
  if(s.type==='biz'){const d=BIZ[o.t],lv=o.lv||1,up=lv<3?Math.round(d.price*UPF[lv+1]):0;bub.innerHTML=`<b>${d.ic} ${d.n} ${'★'.repeat(lv)}<br>${earns(o.t)?`<small>+${money(bizInc(o))}/${d.rent?'คืน':'วัน'}</small>`:''}</b>${lv<3&&earns(o.t)?`<button data-a=up title="อัปเกรด" class=up>⬆<small>${money(up)}</small></button>`:''}<button data-a=rot title="หมุน">⟳</button><button data-a=move title="ย้าย">✥</button><button data-a=del title="ขาย">💲</button><button data-a=x>✕</button>`;bub.classList.add('on');bub.querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.a));return;}
  const name=s.type==='bld'?(BNAME[o.s]||o.s)+(o.sign?' · '+o.sign:''):s.type==='veh'?VehicleEngine.KINDS[o.k].name:s.type==='props'?o.k:s.type==='trees'?'ต้นไม้':s.type==='roads'?'ถนน':'ทางเดิน';const canMove=o.x!=null,canRot=s.type==='bld'||s.type==='props'||s.type==='veh';
  bub.innerHTML=`<b>${name}</b>${canRot?'<button data-a=rot title="หมุน">⟳</button>':''}${canMove?'<button data-a=move title="ย้าย">✥</button><button data-a=copy title="คัดลอก">⧉</button>':''}<button data-a=del title="รื้อ">🗑</button><button data-a=x>✕</button>`;bub.classList.add('on');
  bub.querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.a));}
const FIXNAME=(s,o)=>o.sign?o.sign:s.type==='props'?(DNAME[o.k]||o.k):(BNAME[o.s]||'ที่สำคัญ');
function askRemove(n){if((doc[n.type][n.i]||{}).fixed){toast('📌 '+FIXNAME(n,doc[n.type][n.i])+' รื้อไม่ได้');return;}const pp=selPos(n),o=doc[n.type][n.i];selRing.visible=true;selRing.material.color.set(0xff5a4a);selRing.scale.setScalar(n.type==='bld'?6:n.type==='roads'||n.type==='paths'?3:1.6);selRing.position.set(pp.x,Math.max(Hg(pp.x,pp.z),doc.sea)+.2,pp.z);
  const refund=n.type==='biz'?Math.round(bizWorth(o)*.6):n.type==='bld'?Math.round((BPRICE[o.s]||2000)*.5):n.type==='props'?25:n.type==='veh'?Math.round(priceOf('veh',o.k)*.5):0;
  const nm=n.type==='biz'?BIZ[o.t].n:n.type==='veh'?VehicleEngine.KINDS[o.k].name:n.type==='bld'?(BNAME[o.s]||o.s):n.type==='props'?o.k:n.type==='trees'?'ต้นไม้':n.type==='roads'?'ถนน':'ทางเดิน';
  propose({kind:'remove',x:pp.x,z:pp.z,label:(n.type==='biz'?'ขาย':'รื้อ')+nm+(refund&&!freeMode()?' ได้คืน '+money(refund):'')+'?',ok:()=>{snap();if(!freeMode()&&refund)earn(refund,pp);doc[n.type].splice(n.i,1);rebuild(REB[n.type]);save();hud();puff({x:pp.x,z:pp.z});deselect();toast('รื้อแล้ว');},no:()=>{deselect();}});}
function deselect(){selRing.material.color.set(0xffffff);st.sel=null;st.moving=null;selRing.visible=false;bub.classList.remove('on');}
function act(a){const s=st.sel;if(!s)return;const arr=doc[s.type],o=arr[s.i];if(o&&o.fixed&&a!=='x')return;
  if(a==='x')return deselect();
  if(a==='up'){const lv=o.lv||1,up=Math.round(BIZ[o.t].price*UPF[lv+1]);if(lv>=3)return;if(!canPay(up)){toast('เงินไม่พอ ต้องใช้ '+money(up));return;}bub.classList.remove('on');
    propose({kind:'up',x:o.x,z:o.z,label:'อัปเกรดเป็น '+'★'.repeat(lv+1)+' '+money(up)+'?',ok:()=>{snap();pay(up,o);o.lv=lv+1;rebuild(['biz']);save();hud();toast('ได้ '+money(bizInc(o))+'/'+(BIZ[o.t].rent?'คืน':'วัน')+' แล้ว');select(s);},no:()=>select(s)});return;}
  if(a==='del'){bub.classList.remove('on');askRemove(s);return;}
  if(a==='rot'){const nr=+(((o.r||0)+(PLAYER?Math.PI/2:Math.PI/4))%(Math.PI*2)).toFixed(3),c=chk(s,o.x,o.z,nr,s);if(c){toast('หมุนไม่ได้: '+c);return;}snap();o.r=nr;rebuild(REB[s.type]);save();select(s);return;}
  if(a==='move'){st.moving={...s,copy:false};bub.classList.remove('on');toast('แตะตำแหน่งใหม่');return;}
  if(a==='copy'){st.moving={...s,copy:true};bub.classList.remove('on');const c=priceOf(KCAT[s.type],pickOf(s.type,o));toast('แตะตำแหน่งที่จะวางสำเนา'+(c&&!freeMode()?' ('+money(c)+')':''));return;}}
/* the group, the check and the price of a placed thing, so move, copy, drag and turn obey the same rules as building new (QA, 14 Nov 2026) */
function selG(m){const L=(m.type==='bld'?E.bld:m.type==='biz'?E.biz:m.type==='props'?E.props:null);return L&&L.list?L.list[m.i]:null;}
const KCAT={bld:'build',biz:'biz',props:'decor',trees:'nature',veh:'veh'};
const pickOf=(t,o)=>t==='bld'?o.s:t==='biz'?o.t:t==='props'||t==='veh'?o.k:'';
function chk(m,x,z,r,skip){const k=KCAT[m.type];if(!k)return'';const o=doc[m.type][m.i];return why({k,p:pickOf(m.type,o),x,z,r,G:selG(m),skip});}
function placeMoved(p){const m=st.moving,arr=doc[m.type],src=arr[m.i];let x=+p.x.toFixed(2),z=+p.z.toFixed(2),r=src.r||0;const G=selG(m);
  if((m.type==='bld'||(m.type==='biz'&&BIZ[src.t]&&!BIZ[src.t].boat))&&G){const sn=snapLot(x,z,G,m.type==='biz'?src.t:'');if(sn){x=sn.x;z=sn.z;r=sn.r;}}
  const c=chk(m,x,z,r,m.copy?null:{type:m.type,i:m.i});if(c){toast('วางตรงนั้นไม่ได้: '+c+' ลองแตะที่อื่น');return;}
  let cost=0;if(m.copy){cost=priceOf(KCAT[m.type],pickOf(m.type,src));if(!canPay(cost)){toast('เงินไม่พอ สำเนาต้องใช้ '+money(cost));st.moving=null;return;}}
  snap();let o=src;if(m.copy){o=JSON.parse(JSON.stringify(src));if(o.lv)o.lv=1;/* a copy starts at one star */arr.push(o);pay(cost,{x,z});}
  o.x=x;o.z=z;o.r=r;rebuild(REB[m.type]);save();hud();const ns={type:m.type,i:m.copy?arr.length-1:m.i};st.moving=null;select(ns);}

/* ---------- placing ---------- */
const boatPick=()=>st.cat==='biz'&&BIZ[st.pick]&&!!BIZ[st.pick].boat;
function placeAt(p){const k=st.cat;let rr=null;if((k==='build'||(k==='biz'&&!boatPick()))&&!st.snapTo&&ghost.obj){/* a tap with no hover first (phones): snap now */const sn=snapLot(p.x,p.z,ghost.obj,st.cat==='biz'?st.pick:'');if(sn)st.snapTo=sn;else if(GRID){const h=GRID/2;p={x:Math.round(p.x/h)*h,z:Math.round(p.z/h)*h};}}if((k==='build'||k==='biz')&&st.snapTo){p={x:st.snapTo.x,z:st.snapTo.z};rr=st.snapTo.r;}const x=+p.x.toFixed(2),z=+p.z.toFixed(2);if(!validAt(x,z)){toast('วางตรงนี้ไม่ได้: '+st.why);return;}
  if(pend)cancelPend(true);st.hold=true;ghost.grp.visible=true;ghost.grp.position.set(x,boatPick()?doc.sea:Hg(x,z),z);okRing.material.color.set(0x3ccf6a);okRing.position.y=boatPick()?.15:Math.max(0,doc.sea-Hg(x,z))+.12;
  const cost=priceOf(k,st.pick);if(!canPay(cost)){toast('เงินไม่พอ ต้องใช้ '+money(cost));st.hold=false;ghost.grp.visible=false;return;}
  const label=k==='biz'?'ซื้อ'+BIZ[st.pick].n+' '+money(cost)+'?':k==='build'?'สร้าง'+(BNAME[st.pick]||'')+(cost&&doc.costs&&!doc.gm?' '+money(cost):'')+'?':k==='decor'?'วาง '+st.pick+' ตรงนี้?':k==='veh'?'วาง '+VehicleEngine.KINDS[st.pick].name+' ตรงนี้?':'ปลูกต้นไม้ตรงนี้?';
  if(rr!=null){st.rot=rr;if(ghost.obj)ghost.obj.rotation.y=rr;}propose({kind:'place',x,z,label:label+(rr!=null?' (หันหน้าเข้าถนน)':''),rot:k!=='nature',ok:()=>{st.hold=false;commitPlace({x,z});},no:()=>{st.hold=false;ghost.grp.visible=false;}});}
function commitPlace(p){const k=st.cat,x=p.x,z=p.z;const cost=priceOf(k,st.pick);if(!canPay(cost)){toast('เงินไม่พอ');return;}snap();pay(cost,p);
  if(k==='biz'){doc.biz.push({t:st.pick,x,z,r:+st.rot.toFixed(3),lv:1});rebuild(['biz','fol']);puff(p);save();hud();toast('ซื้อ'+BIZ[st.pick].n+'แล้ว!'+(earns(st.pick)?' ได้ '+money(BIZ[st.pick].inc)+'/'+(BIZ[st.pick].rent?'คืน':'วัน'):''));return;}
  if(k==='build'){const o={s:st.pick,x,z,r:+st.rot.toFixed(3)};if(st.sign)o.sign=st.sign;if(st.wall)o.wall=st.wall;doc.bld.push(o);addBld(o);rebuild(['fol']);puff(p);}
  else if(k==='decor'){const o={k:st.pick,x,z,r:+st.rot.toFixed(3)};doc.props.push(o);addProp(o);puff(p);}
  else if(k==='veh'){const o={k:st.pick,x,z,r:+st.rot.toFixed(3),go:st.vgo!==false};if(st.vc)o.c=st.vc;doc.veh.push(o);rebuild(['veh']);puff(p);}
  else if(k==='nature'){const o={k:st.pick,x,z,s:st.treeSize};doc.trees.push(o);E.fol.addTree(x,z,{kind:o.k,size:o.s});puff(p);}
  save();hud();toast('สร้างแล้ว');}
/* a small dust puff when something is placed */
const puffs=[];const puffMat=new THREE.SpriteMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false});
function puff(p){for(let i=0;i<10;i++){const s=new THREE.Sprite(puffMat.clone());const a=i/10*6.28;s.position.set(p.x,Hg(p.x,p.z)+.3,p.z);s.userData={vx:Math.cos(a)*3,vz:Math.sin(a)*3,t:0};s.scale.setScalar(.6);scene.add(s);puffs.push(s);}}

/* ---------- pointer: tap vs drag ---------- */
const cv=R.domElement;cv.addEventListener('contextmenu',e=>e.preventDefault());let down=null,lastT=0;
cv.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;down={x:e.clientX,y:e.clientY,t:performance.now()};const p=pick(e);if(!p)return;
  if(!st.pick&&st.cat!=='bulldoze'&&!st.moving&&(!pend||pend.kind==='drag')){const n=nearest(p);if(n&&(n.type==='bld'||n.type==='props'||n.type==='biz')){const G=(n.type==='bld'?E.bld:n.type==='biz'?E.biz:E.props).list[n.i];if(G&&!doc[n.type][n.i].fixed){const o=doc[n.type][n.i],D={n,G,o,ox:o.x,oz:o.z,or:o.r||0,dx:o.x-p.x,dz:o.z-p.z,live:false,armed:false};down.drag=D;
      /* press and hold (0.4 s) on a building, shop or prop picks it up: the camera stops, the object lifts and follows the finger. Moving the finger first pans the camera as usual. */
      const dn=down;D.timer=setTimeout(()=>{if(down!==dn||down.drag!==D)return;if(pend)cancelPend(true);ctl.enabled=false;D.armed=true;D.live=true;deselect();try{navigator.vibrate&&navigator.vibrate(25);}catch(_){}
        D.G.position.y+=.35;selRing.visible=true;selRing.material.color.set(0x3ccf6a);selRing.scale.setScalar(D.n.type==='bld'?6:1.6);selRing.position.set(D.o.x,Math.max(Hg(D.o.x,D.o.z),doc.sea)+.2,D.o.z);D.x=D.o.x;D.z=D.o.z;D.r=D.or;D.ok=true;toast('ยกขึ้นแล้ว ลากไปวาง แล้วปล่อยนิ้ว');},400);}}}
  if(st.cat==='land'&&st.pick){if(!pend||pend.kind!=='brush'){const pre=JSON.stringify(doc),h0=doc.h.slice();pend&&cancelPend(true);
      propose({kind:'brush',x:p.x,z:p.z,label:'ใช้พื้นแบบนี้?',ok:()=>{undo.push(pre);redo.length=0;rebuild();save();toast('ปรับพื้นแล้ว');__undoUI();},no:()=>{doc.h=h0;rebuild(['terr']);}});cf.classList.remove('on');}
    st.flat=Hfn(p.x,p.z);down.brush=p;lastT=performance.now();brush(p,.05);}
  if(st.cat==='road'&&st.pick){if(pend)cancelPend(true);const isR=st.pick.startsWith('r:'),t=st.pick.slice(2);tray.classList.add('peek');st.draw={kind:isR?'road':'path',type:t,w:isR?RW[t]*1.1:1.4,pts:[[isR?gs(p.x):p.x,isR?gs(p.z):p.z]]};drawLine();}});
cv.addEventListener('pointermove',e=>{if(down&&down.drag){const D=down.drag;if(!D.armed){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>=8){clearTimeout(D.timer);down.drag=null;}/* moved before the hold: it is a camera pan */}else{const q=pick(e);if(!q)return;D.moved=true;
    let x=q.x+D.dx,z=q.z+D.dz,r=D.or;const isBoat=D.n.type==='biz'&&BIZ[D.o.t].boat;if(D.n.type==='bld'||(D.n.type==='biz'&&!isBoat)){const sn=snapLot(x,z,D.G,D.n.type==='biz'?D.o.t:'');if(sn){x=sn.x;z=sn.z;r=sn.r;}}D.x=x;D.z=z;D.r=r;D.G.position.set(x,isBoat?doc.sea:Hg(x,z),z);D.G.rotation.y=r;
    selRing.visible=true;const why_=chk(D.n,x,z,r,{type:D.n.type,i:D.n.i}),ok=!why_;D.why=why_;D.ok=ok;selRing.material.color.set(ok?0x3ccf6a:0xff4a4a);selRing.scale.setScalar(D.n.type==='bld'?6:1.6);selRing.position.set(x,Math.max(Hg(x,z),doc.sea)+.2,z);D.G.position.y+=.35;return;}}
  let p=pick(e);if(!p){ghost.grp.visible=false;if(GOV)GOV.visible=false;return;}
  if(GOV){if((st.cat==='build'||st.cat==='road'||st.cat==='biz')&&st.pick)GOV.place(p.x,p.z);else GOV.visible=false;}
  if(st.cat==='land'&&st.pick){placeRing(p);if(down&&down.brush){const now=performance.now();brush(p,Math.min(.1,(now-lastT)/1000));lastT=now;down.brush=p;}return;}
  if(st.draw&&down&&!st.draw.done){const D=st.draw,l=D.pts[D.pts.length-1];
    if(PLAYER||st.snap8!==false){const SN=PLAYER?Math.PI/2:Math.PI/4;/* player version: straight along X or Z only. Otherwise 8 directions like the buildings: straight runs N, NE, E ... that bend in 45 degree steps */const A=D.pts[D.anchor||0],dx=p.x-A[0],dz=p.z-A[1],len=Math.hypot(dx,dz);if(len<1)return;
      const raw=Math.atan2(dz,dx),dif=D.ang==null?9:Math.abs(((raw-D.ang+3*Math.PI)%(2*Math.PI))-Math.PI),ang=dif<.55?D.ang:Math.round(raw/SN)*SN,ux=Math.cos(ang),uz=Math.sin(ang);if(D.ang!=null&&Math.abs(((ang-D.ang+3*Math.PI)%(2*Math.PI))-Math.PI)>.01&&D.pts.length-1>(D.anchor||0)){D.anchor=D.pts.length-1;D.ang=null;return;}
      D.ang=ang;D.pts.length=(D.anchor||0)+1;const STEP=GRID&&D.kind==='road'?GRID:2.5,n=GRID&&D.kind==='road'?Math.round(len/STEP):Math.floor(len/2.5);for(let i=1;i<=n;i++)D.pts.push([+(A[0]+ux*i*STEP).toFixed(2),+(A[1]+uz*i*STEP).toFixed(2)]);drawLine();return;}
    if(Math.hypot(p.x-l[0],p.z-l[1])>2.5){D.pts.push([p.x,p.z]);drawLine();}return;}
  if(((st.cat==='build'||st.cat==='decor'||st.cat==='veh'||st.cat==='nature'||st.cat==='biz')&&st.pick||st.moving)&&!st.hold){ghost.grp.visible=true;st.snapTo=null;if((st.cat==='build'||(st.cat==='biz'&&BIZ[st.pick]&&!BIZ[st.pick].boat))&&ghost.obj){const sn=snapLot(p.x,p.z,ghost.obj,st.cat==='biz'?st.pick:'');if(sn){st.snapTo=sn;p={x:sn.x,y:Hg(sn.x,sn.z),z:sn.z};ghost.obj.rotation.y=sn.r;}else{ghost.obj.rotation.y=st.rot;if(GRID){const h=GRID/2;p={x:Math.round(p.x/h)*h,y:p.y,z:Math.round(p.z/h)*h};}}}ghost.grp.position.set(p.x,boatPick()?doc.sea:Hg(p.x,p.z),p.z);const ok=validAt(p.x,p.z);okRing.material.color.set(ok?0x3ccf6a:0xff4a4a);okRing.position.y=boatPick()?.15:Math.max(0,doc.sea-Hg(p.x,p.z))+.12;}});
const isB=D=>D.n.type==='biz'&&BIZ[D.o.t].boat;
addEventListener('pointercancel',()=>{const d=down;if(!d||!d.drag)return;clearTimeout(d.drag.timer);if(d.drag.live){const D=d.drag;D.G.position.set(D.ox,isB(D)?doc.sea:Hg(D.ox,D.oz),D.oz);D.G.rotation.y=D.or;selRing.visible=false;}down=null;ctl.enabled=true;});
addEventListener('pointerup',e=>{const d=down;down=null;if(!d)return;ctl.enabled=true;if(d.drag)clearTimeout(d.drag.timer);
  if(d.drag&&d.drag.live){d.drag.G.position.y-=.35;const D=d.drag;const restore=()=>{D.G.position.set(D.ox,isB(D)?doc.sea:Hg(D.ox,D.oz),D.oz);D.G.rotation.y=D.or;selRing.visible=false;selRing.material.color.set(0xffffff);};
    if(!D.moved){restore();toast('กดค้างแล้วลากเพื่อย้าย');return;}
    if(!D.ok){restore();toast('วางตรงนั้นไม่ได้: '+(D.why||''));return;}
    propose({kind:'drag',x:D.x,z:D.z,label:'ย้ายมาตรงนี้?',ok:()=>{snap();D.o.x=D.x;D.o.z=D.z;D.o.r=D.r;selRing.visible=false;selRing.material.color.set(0xffffff);rebuild(REB[D.n.type]);save();toast('ย้ายแล้ว');},no:restore});return;}
  if(d.brush){if(pend&&pend.kind==='brush'){pend.x=d.brush.x;pend.z=d.brush.z;cf.classList.add('on');}return;}
  if(st.draw&&!st.draw.done){const D=st.draw;if(D.pts.length<2){st.draw=null;drawLine();tray.classList.remove('peek');toast('ลากให้ยาวขึ้นหน่อย');return;}
    /* snap the start and end onto a nearby road so it joins */
    if(D.kind==='road')[0,D.pts.length-1].forEach(ix=>{const q=D.pts[ix];
      if(PLAYER){/* keep the line on its axis: extend or trim this end along its own direction until it meets a road (up to 4 units) */const o=D.pts[ix?ix-1:1];if(!o)return;let ux=q[0]-o[0],uz=q[1]-o[1];const L=Math.hypot(ux,uz)||1;ux/=L;uz/=L;let bestU=null;
        doc.roads.forEach(r=>{for(let k=1;k<r.pts.length;k++){const a=r.pts[k-1],b=r.pts[k],ex=b[0]-a[0],ez=b[1]-a[1],den=ux*ez-uz*ex;if(Math.abs(den)<1e-6)continue;const u=((a[0]-q[0])*ez-(a[1]-q[1])*ex)/den,v=((a[0]-q[0])*uz-(a[1]-q[1])*ux)/den;if(v<-.02||v>1.02||u<-4||u>4)continue;if(bestU==null||Math.abs(u)<Math.abs(bestU))bestU=u;}});
        if(bestU!=null){q[0]=+(q[0]+ux*bestU).toFixed(2);q[1]=+(q[1]+uz*bestU).toFixed(2);}return;}
      let best=null,bd=4;doc.roads.forEach(r=>r.pts.forEach(pp=>{const dd=Math.hypot(pp[0]-q[0],pp[1]-q[1]);if(dd<bd){bd=dd;best=pp;}}));if(best){q[0]=best[0];q[1]=best[1];}});
    {/* roads and footpaths may cross the railway straight over, never run along it or touch a station */const why=roadVsRail(D.pts,D.kind==='road'?D.type:'lane');if(why){st.draw=null;drawLine();tray.classList.remove('peek');toast(why==='station'?'สร้างทับสถานีรถไฟไม่ได้':'ถนนวิ่งทับรางรถไฟไม่ได้ ข้ามได้อย่างเดียว');return;}}
    {/* no roads or footpaths into the sea (QA, 14 Nov 2026) */let wet=false;for(let k=1;k<D.pts.length&&!wet;k++){const a=D.pts[k-1],b=D.pts[k],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5));for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;if(Hg(x,z)<doc.sea+.05){wet=true;break;}}}
      if(wet&&D.type!=='bridge'){st.draw=null;drawLine();tray.classList.remove('peek');toast('ถนนลงทะเลไม่ได้ วาดให้จบบนฝั่ง');return;}}
    D.done=true;drawLine();const last=D.pts[D.pts.length-1];
    /* the new road wins where it lies along an old one: only the overlapped stretch of the old road is cut out, the rest stays
       and its cut ends are pulled onto the new road so they join it. A plain crossing is not an overlap and stays a junction. */
    const list=D.kind==='road'?doc.roads:doc.paths,hw=D.kind==='road'?RW[D.type]*.75:.9,rep=[];
    list.forEach((r,i)=>{const ohw=D.kind==='road'?RW[r.type]*.6:(r.w||1)/2,thr=hw+ohw,S=[];
      for(let k=1;k<r.pts.length;k++){const a=r.pts[k-1],b=r.pts[k],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L));for(let q=(k>1?1:0);q<=n;q++){const x=a[0]+(b[0]-a[0])*q/n,z=a[1]+(b[1]-a[1])*q/n;S.push({x,z,o:lineD(x,z,D.pts)<thr});}}
      /* only runs of overlap longer than a crossing count */const cross=2*thr+2;let k0=-1;for(let k=0;k<=S.length;k++){const o=k<S.length&&S[k].o;if(o&&k0<0)k0=k;if(!o&&k0>=0){if(k-k0<cross)for(let q=k0;q<k;q++)S[q].o=false;k0=-1;}}
      if(!S.some(q=>q.o))return;const runs=[];let cur=null;S.forEach((q,k)=>{if(!q.o){if(!cur){cur={pts:[],startCut:k>0};runs.push(cur);}cur.pts.push([q.x,q.z]);cur.endCut=k<S.length-1;}else cur=null;});
      const near=(x,z)=>{let best=null,bd=1e9;for(let k=1;k<D.pts.length;k++){const a=D.pts[k-1],b=D.pts[k],vx=b[0]-a[0],vz=b[1]-a[1],L2=vx*vx+vz*vz||1e-6;let t=((x-a[0])*vx+(z-a[1])*vz)/L2;t=Math.max(0,Math.min(1,t));const px=a[0]+vx*t,pz=a[1]+vz*t,d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best=[px,pz];}}return best;};
      const keep=runs.filter(u=>u.pts.length>=5).map(u=>{let P=u.pts.filter((q,k)=>k===0||k===u.pts.length-1||k%3===0);if(u.startCut){const e=near(P[0][0],P[0][1]);if(e)P.unshift(e);}if(u.endCut){const e=near(P[P.length-1][0],P[P.length-1][1]);if(e)P.push(e);}return P.map(q=>[+q[0].toFixed(2),+q[1].toFixed(2)]);});
      rep.push({i,keep});});
    D.rep=rep;if(rep.length){selRing.visible=false;toast('ตัดส่วนที่ทับ'+(D.kind==='road'?'ถนน':'ทางเดิน')+'เดิม '+rep.length+' เส้น ที่เหลือจะต่อเข้าเส้นใหม่');}
    propose({kind:'draw',x:last[0],z:last[1],label:(D.kind==='road'?'สร้างถนนเส้นนี้':'สร้างทางเดินเส้นนี้')+(D.rep.length?' (ทับเส้นเดิม '+D.rep.length+')':'')+'?',ok:()=>{st.draw=null;drawLine();let len=0;for(let i=1;i<D.pts.length;i++)len+=Math.hypot(D.pts[i][0]-D.pts[i-1][0],D.pts[i][1]-D.pts[i-1][1]);const cost=Math.round(len*(D.kind==='road'?12:4));if(!canPay(cost)){toast('เงินไม่พอ ต้องใช้ '+money(cost));return;}snap();pay(cost,{x:D.pts[D.pts.length-1][0],z:D.pts[D.pts.length-1][1]});{const L=D.kind==='road'?doc.roads:doc.paths;const add=[];D.rep.slice().sort((a,b)=>b.i-a.i).forEach(({i,keep})=>{const o=L[i];L.splice(i,1);keep.forEach(pts=>add.push(Object.assign({},o,{pts})));});
        /* a kept piece that ends exactly where the new line starts or ends, running on in the same direction, becomes part of it (no junction pad) */
        const NP=D.pts.map(q=>[+q[0].toFixed(2),+q[1].toFixed(2)]);const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.6;
        add.forEach(o=>{const P=o.pts,s0=P[0],s1=P[P.length-1];let used=false;
          if(same(s1,NP[0])){NP.splice(0,1,...P);used=true;}else if(same(s0,NP[0])){NP.splice(0,1,...P.slice().reverse());used=true;}
          else if(same(s0,NP[NP.length-1])){NP.splice(NP.length-1,1,...P);used=true;}else if(same(s1,NP[NP.length-1])){NP.splice(NP.length-1,1,...P.slice().reverse());used=true;}
          if(!used)L.push(o);});D.pts=NP;}const pts=D.pts.map(q=>[+q[0].toFixed(2),+q[1].toFixed(2)]);if(D.kind==='road'){doc.roads.push({pts,type:D.type});mergeRoads();rebuild(REB.roads);}else{doc.paths.push({pts,w:1.2,kind:D.type});rebuild(['terr','fol','life']);}save();hud();toast('สร้างแล้ว');},no:()=>{st.draw=null;drawLine();}});return;}
  const moved=Math.hypot(e.clientX-d.x,e.clientY-d.y),tap=moved<8&&performance.now()-d.t<500;if(!tap||e.target!==cv)return;const p=pick(e);if(!p)return;
  if(st.moving){if(pend)cancelPend(true);const m=st.moving;ghost.grp.visible=true;st.hold=true;ghost.grp.position.set(p.x,Hg(p.x,p.z),p.z);okRing.scale.setScalar(m.type==='bld'?5:1.4);
    propose({kind:'move',x:p.x,z:p.z,label:m.copy?'วางสำเนาตรงนี้?':'ย้ายมาตรงนี้?',ok:()=>{st.hold=false;ghost.grp.visible=false;placeMoved(p);},no:()=>{st.hold=false;ghost.grp.visible=false;}});return;}
  if(st.cat==='bulldoze'){const n=nearest(p);if(!n){toast('ไม่มีอะไรตรงนี้');return;}askRemove(n);return;}
  if(st.pick&&(st.cat==='build'||st.cat==='decor'||st.cat==='veh'||st.cat==='nature'||st.cat==='biz'))return placeAt(p);
  if(!st.pick){const n=nearest(p);if(n)select(n);else deselect();}});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(e.key==='r'||e.key==='R'){if(st.sel)act('rot');else rotate();}
  if(e.key==='Enter'&&pend){okPend();return;}if(e.key==='Escape'){if(pend){cancelPend();return;}if(st.pick)pickCard(st.pick);else{deselect();openCat(null);}}if(e.key==='Delete'||e.key==='Backspace')act('del');if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&(e.key==='z'||e.key==='Z')))){e.preventDefault();doRedo();return;}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();doUndo();}});

/* ---------- top bar: counts, day/night, undo, menu ---------- */
/* ---------- money ---------- */
const BPRICE={cabin:1200,cottage:1500,islandcottage:2200,house:2500,bungalow:2800,terrace:3000,flats:6000,lighthouse:5000,kiosk:1500,strip:3000,mallshop:3500,shop:4000,cafe:4000,pub:9000,bigbox:15000,heritage:12000,slab:18000,tower:30000};
const money=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('en-AU');
function priceOf(k,p){if(k==='biz')return BIZ[p]?BIZ[p].price:0;if(k==='build')return BPRICE[p]||2000;if(k==='decor')return DPRICE[p]||50;if(k==='veh')return({road:300,water:800,air:2500,rail:2000,bike:30})[VCAT(p)]||300;if(k==='nature')return 20;return 0;}
const freeMode=()=>doc.gm||!doc.costs;function canPay(n){return freeMode()||doc.biz&&doc.money>=n;}
function pay(n,p){if(freeMode()||!n)return;doc.money-=n;if(p)floatMoney(p.x,p.z,'-'+money(n),'#ff6a5a');}
function earn(n,p){doc.money+=n;if(p)floatMoney(p.x,p.z,'+'+money(n),'#3ccf6a');}
function floatMoney(x,z,t,c){const v=new THREE.Vector3(x,Math.max(Hg(x,z),doc.sea)+3,z).project(cam);if(v.z>1)return;const d=document.createElement('div');d.className='coin';d.textContent=t;d.style.color=c;d.style.left=((v.x+1)/2*innerWidth)+'px';d.style.top=((1-v.y)/2*innerHeight)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),1600);}
/* small earnings that need no business (QA idea 1): park things and stalls (up to 4 of each kind pay), shop buildings with a sign,
   and a nature bonus of $1 a tree up to $150. Islands with no business still earn something. */
function smallInc(){const list=[],cnt={};let tot=0;
  doc.props.forEach(p=>{const n=DINC[p.k];if(!n||(PLAYER&&!PLAYER_DINC.includes(p.k)))return;cnt[p.k]=(cnt[p.k]||0)+1;if(cnt[p.k]>4)return;list.push({x:p.x,z:p.z,n,f:1});});
  doc.bld.forEach(b=>{const n=BLDINC[b.s];if(!n||!b.sign||PLAYER)return;cnt['b'+b.s]=(cnt['b'+b.s]||0)+1;if(cnt['b'+b.s]>6)return;list.push({x:b.x,z:b.z,n,f:1});});
  const tr=PLAYER?0:Math.min(150,doc.trees.length);if(tr)list.push({n:tr});list.forEach(q=>tot+=q.n);return{list,tot};}
/* style goals: badges with a one-time reward (QA idea 5) */
const BADGES=[
  ['garden','🌳','เกาะสวน','ปลูกต้นไม้ 100 ต้น',()=>[doc.trees.length,100],2000],
  ['bike','🚲','เกาะจักรยาน','ทางจักรยานยาวรวม 150 เมตร',()=>[Math.round(doc.roads.filter(r=>r.type==='bikepath').reduce((n,r)=>n+r.pts.reduce((m,q,i)=>i?m+Math.hypot(q[0]-r.pts[i-1][0],q[1]-r.pts[i-1][1]):0,0),0)),150],2000],
  ['harbour','⚓','ท่าเรือคึกคัก','เรือ 5 ลำ (ธุรกิจเรือหรือเรือวิ่ง)',()=>[doc.biz.filter(b=>BIZ[b.t]&&BIZ[b.t].boat).length+(doc.veh||[]).filter(v=>VCAT(v.k)==='water').length,5],3000],
  ['cafe','☕','ถนนคาเฟ่','ร้านกินดื่ม 4 ร้าน',()=>[doc.biz.filter(b=>['foodtruck','gelato','cafe','restaurant'].includes(b.t)).length+doc.props.filter(p=>p.k==='cafeset'||p.k==='fishstall').length,4],2500],
  ['holiday','🏖️','ชายฝั่งวันหยุด','บ้านให้เช่า 5 หลัง',()=>[doc.biz.filter(b=>BIZ[b.t]&&BIZ[b.t].rent).length,5],4000],
  ['family','🛝','เกาะครอบครัว','สนามเด็กเล่น โต๊ะปิกนิก แปลงผัก รวม 6',()=>[doc.props.filter(p=>['playground','picnic','gardenplot'].includes(p.k)).length,6],1500],
  ['grid','📐','ผังเมืองเป๊ะ','ตึกและร้าน 8 หลังขึ้นไป ทุกหลังหันหน้าเข้าถนนมีลานหน้าร้าน',()=>{const L=fps();return[L.length>=8&&L.every(e=>e.yd>0)?1:0,1];},3000]];
function checkBadges(){if(!doc.badges)doc.badges={};let got=null;BADGES.forEach(([id,ic,n,,f,rw])=>{if(doc.badges[id])return;let v;try{v=f();}catch(e){return;}if(v[0]>=v[1]){doc.badges[id]=doc.day||1;if(!freeMode())doc.money+=rw;got=[ic,n,rw];}});
  if(got){toast('🏅 ได้เหรียญ '+got[0]+' '+got[1]+'!'+(freeMode()?'':' รางวัล '+money(got[2])));save();hud();}}
function badgePanel(){let el=$('bdgP');if(!el){el=document.createElement('div');el.id='bdgP';el.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fffaf0;border-radius:18px;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.3);z-index:20;max-width:92vw;width:360px;font:600 14px system-ui;color:#3a2a1a';el.onclick=()=>el.remove();document.body.appendChild(el);}
  el.innerHTML='<div style="font-size:18px;font-weight:900;margin-bottom:8px">🏅 เป้าหมายเกาะ</div>'+BADGES.map(([id,ic,n,d,f,rw])=>{let v=[0,1];try{v=f();}catch(e){}const ok=doc.badges&&doc.badges[id];return`<div style="display:flex;gap:10px;align-items:center;padding:6px 0;opacity:${ok?1:.75}"><span style="font-size:26px;filter:${ok?'none':'grayscale(1)'}">${ic}</span><span style="flex:1"><b>${n}</b>${ok?' ✓':''}<br><small>${d} · ${Math.min(v[0],v[1])}/${v[1]} · รางวัล ${money(rw)}</small></span></div>`;}).join('')+'<div style="text-align:center;margin-top:6px;font-size:12px;opacity:.6">แตะเพื่อปิด</div>';}
/* a game day is 30 seconds: every business pays out, rentals count it as a night */
let tickT=performance.now();setInterval(()=>{const now=performance.now(),dt=Math.min(5,(now-tickT)/1000);tickT=now;if(document.hidden||!doc.biz)return;doc.clock=(doc.clock||0)+dt;if(doc.clock<30)return;doc.clock-=30;doc.day=(doc.day||1)+1;let tot=0;doc.biz.forEach(b=>{const n=bizInc(b);tot+=n;earn(n,b);});const sm=smallInc();sm.list.forEach(q=>earn(q.n,q.f?q:null));save();hud();if(tot||sm.tot)toast('วันที่ '+doc.day+': '+'ได้ '+money(tot+sm.tot)+(sm.tot?' (ธุรกิจ '+money(tot)+' · '+(PLAYER?'ขายปลาและผัก ':'ร้านเล็กและสวน ')+money(sm.tot)+')':''));if(st.cat==='biz')fillTray();},500);
function hud(){const ppl=['walker','jogger','cyclist','picnic','sandcastle','dogfetch','sitter','swimmer','sunbather','fisher'].reduce((n,k)=>n+(doc.life[k]|0),0);
  $('hud').innerHTML=`<span class=nm>${doc.name}</span><span class=cash>💰 ${doc.gm?'∞':money(doc.money)}</span><span>📅 ${doc.day||1}</span><span>💼 ${(doc.biz||[]).length}</span><span>🏠 ${doc.bld.length}</span><span>🛣️ ${doc.roads.length}</span><span>🌳 ${doc.trees.length}</span><span>👥 ${ppl}</span><span id=bdgB style="cursor:pointer">🏅 ${Object.keys(doc.badges||{}).length}/${BADGES.length}</span>`;$('bdgB').onclick=badgePanel;if(!hud.busy){hud.busy=1;setTimeout(()=>{hud.busy=0;checkBadges();},50);}}
function doUndo(){if(pend){cancelPend();return;}if(!undo.length){toast('ไม่มีอะไรให้ย้อน');return;}redo.push(JSON.stringify(doc));doc=JSON.parse(undo.pop());deselect();rebuild();save();hud();if(st.cat)fillTray();toast('ย้อนกลับแล้ว');__undoUI();}
function doRedo(){if(!redo.length){toast('ไม่มีอะไรให้ทำซ้ำ');return;}undo.push(JSON.stringify(doc));doc=JSON.parse(redo.pop());deselect();rebuild();save();hud();if(st.cat)fillTray();toast('ทำซ้ำแล้ว');__undoUI();}
window.__undoUI=()=>{$('undoB').classList.toggle('off',!undo.length);$('redoB').classList.toggle('off',!redo.length);};
{const sep=document.createElement('span');sep.className='sep';bar.appendChild(sep);[['undoB','↶','ย้อน',doUndo],['redoB','↷','ทำซ้ำ',doRedo]].forEach(([id,ic,nm,f])=>{const b=document.createElement('button');b.className='cat ur';b.id=id;b.innerHTML=`<span class=ic>${ic}</span><span class=nm>${nm}</span>`;b.onclick=f;bar.appendChild(b);});__undoUI();}$('daynight').onclick=()=>{doc.sky.hour=doc.sky.hour>18||doc.sky.hour<6?11:20.5;save();};
const menu=$('menu');$('menuBtn').onclick=()=>{menu.classList.toggle('on');if(menu.classList.contains('on'))menuTab('file');};
function menuTab(t){menu.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));const box=$('menuBody');
  if(t==='file')box.innerHTML=`<label>ชื่อ map <input id=m_name value="${doc.name}"></label><div class=row><label><input type=checkbox id=m_cost ${doc.costs?'checked':''}> คิดค่าก่อสร้าง</label><label><input type=checkbox id=m_gm ${doc.gm?'checked':''}> เงินไม่จำกัด (ทดสอบ)</label><button id=m_money>💰 เริ่มเงินใหม่ $25,000</button></div><div class=row><button id=m_exp>📋 คัดลอก map</button><button id=m_imp>📥 วาง map</button><button id=m_new>🏝️ เกาะใหม่</button></div><textarea id=m_txt placeholder="PPLMAP1 {...}"></textarea><p class=hint>"คัดลอก map" แล้วส่งข้อความ PPLMAP1 ให้ Claude สร้างเป็น map ในเกม ทุกอย่างบันทึกเองในเครื่องนี้</p>`;
  if(t==='layers'){let h='';Object.keys(LAYER_ENG).forEach(k=>{const e=E[k];if(!e||!e.layers)return;const L=doc.layers[k]||{};h+=`<b>${LAYER_ENG[k]}</b><div class=grid>${e.layers.map(n=>`<label><input type=checkbox class=m_ly data-e=${k} data-n=${n} ${(n in L?L[n]:n!=='aurora')?'checked':''}> ${n}</label>`).join('')}</div>`;});box.innerHTML=h;}
  if(t==='help')box.innerHTML=`<p>เลือกหมวดด้านล่าง → เลือกการ์ด → แตะพื้น (วงเขียว = ได้, แดง = ไม่ได้) → กด ✓ เพื่อสร้างจริง หรือ ✕ ยกเลิก ทุกอย่าง (วาง วาดถนน ปั้นพื้น รื้อ ย้าย) ต้องกด ✓ ก่อนถึงจะเกิดจริง</p><p>↶ ย้อน / ↷ ทำซ้ำ อยู่ท้ายแถบล่าง (Ctrl+Z / Ctrl+Y)</p><p>ถนน/ทางเดิน: กดค้างแล้วลาก ปลายถนนจะต่อเข้าถนนเดิมให้เอง</p><p>กดค้างที่อาคารหรือของแล้วลาก = ย้ายทันที ปล่อยแล้วกด ✓ ยืนยัน อาคารที่อยู่ใกล้ถนนจะหันหน้าเข้าถนนและชิดขอบทางเท้าให้เอง</p><p>ไม่ได้เลือกการ์ด: แตะของเพื่อเลือก แล้ว หมุน ⟳ ย้าย ✥ คัดลอก ⧉ รื้อ 🗑</p><p>กล้อง: ลาก = เลื่อน, คลิกขวาลาก/สองนิ้ว = หมุน, ล้อเมาส์/ถ่างนิ้ว = ซูม</p><p>💼 ธุรกิจ: ซื้อร้าน บ้านให้เช่า (5 ระดับ ยิ่งแพงยิ่งหรู ค่าเช่าต่อคืนสูงขึ้น) และเรือ ทุก 30 วินาทีคือ 1 วัน ธุรกิจจ่ายเงินเข้ากระเป๋า แตะธุรกิจเพื่ออัปเกรด ⬆ ได้ถึง ★★★ หรือขาย 💲 ได้คืน 60%</p><p>สร้างอาคาร ถนน ต้นไม้ มีค่าใช้จ่าย ปิดได้ในเมนู (คิดค่าก่อสร้าง / เงินไม่จำกัด)</p><p>คีย์ลัด: Enter ยืนยัน, Esc ยกเลิก, R หมุน, Delete รื้อ, Ctrl+Z ย้อน, Ctrl+Y ทำซ้ำ</p>`;
  const q=s=>box.querySelector(s);
  if(q('#m_cost'))q('#m_cost').onchange=e=>{doc.costs=e.target.checked;save();hud();};if(q('#m_gm'))q('#m_gm').onchange=e=>{doc.gm=e.target.checked;save();hud();};if(q('#m_money'))q('#m_money').onclick=()=>{snap();doc.money=25000;save();hud();toast('เงิน $25,000');};
  if(q('#m_name'))q('#m_name').oninput=e=>{doc.name=e.target.value;save();hud();};
  if(q('#m_exp'))q('#m_exp').onclick=()=>{const t='PPLMAP1 '+JSON.stringify(doc);q('#m_txt').value=t;q('#m_txt').select();const kb=Math.round(t.length/1024);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('คัดลอกแล้ว ('+kb+' KB)'),()=>toast('เลือกข้อความแล้ว กด Ctrl+C'));};
  if(q('#m_imp'))q('#m_imp').onclick=()=>{try{const d=JSON.parse(q('#m_txt').value.trim().replace(/^PPLMAP1\s*/,''));if(!d.h||d.h.length!==N*N)throw Error('ไม่มีข้อมูลพื้น');snap();doc=Object.assign(starter(),d);rebuild();save();hud();menu.classList.remove('on');}catch(e){toast('อ่าน map ไม่ได้: '+e.message);}};
  if(q('#m_new'))q('#m_new').onclick=()=>{if(!confirmNew())return;snap();doc=starter();rebuild();save();hud();menu.classList.remove('on');};
  box.querySelectorAll('.m_ly').forEach(i=>i.onchange=()=>{const k=i.dataset.e;doc.layers[k]=doc.layers[k]||{};doc.layers[k][i.dataset.n]=i.checked;applyLayers(k);save();});}
menu.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>menuTab(b.dataset.t));$('menuX').onclick=()=>menu.classList.remove('on');
let newArm=0;function confirmNew(){if(Date.now()-newArm<3000)return true;newArm=Date.now();toast('กดอีกครั้งเพื่อยืนยันเกาะใหม่');return false;}

/* ---------- start ---------- */
Sky.setWeather(doc.sky.wx||'sunny');rebuild();try{settleOffRoads();}catch(e){console.error(e);}setMode();hud();
let last=performance.now();window.__ed={doc:()=>doc,E,rebuild,cam,ctl};
(function loop(){requestAnimationFrame(loop);ctl.update();const now=performance.now(),t=now/1000,dt=Math.min(.1,(now-last)/1000);last=now;
  if(down&&down.brush)brush(down.brush,dt*.6);
  for(let i=puffs.length-1;i>=0;i--){const s=puffs[i],u=s.userData;u.t+=dt;s.position.x+=u.vx*dt;s.position.z+=u.vz*dt;s.position.y+=dt*.8;s.scale.setScalar(.6+u.t*2);s.material.opacity=.8*(1-u.t/.6);if(u.t>.6){scene.remove(s);puffs.splice(i,1);}}
  if(pend&&cf.classList.contains('on')){const v=new THREE.Vector3(pend.x,Math.max(Hg(pend.x,pend.z),doc.sea)+2.5,pend.z).project(cam);cf.style.left=Math.max(110,Math.min(innerWidth-110,(v.x+1)/2*innerWidth))+'px';cf.style.top=Math.max(70,(1-v.y)/2*innerHeight)+'px';}
  if(st.sel&&bub.classList.contains('on')){const p=selPos(st.sel),v=new THREE.Vector3(p.x,Hg(p.x,p.z)+3,p.z).project(cam);bub.style.left=((v.x+1)/2*innerWidth)+'px';bub.style.top=((1-v.y)/2*innerHeight)+'px';}
  if(E.biz)E.biz.list.forEach((G,i)=>{if(!G.userData.boat)return;G.position.y=doc.sea+Math.sin(t*1.3+i)*.07-.05;G.rotation.z=Math.sin(t*1.1+i)*.03;(G.userData.lights||[]).forEach((b,k)=>b.visible=((t*3+k)|0)%3!==0);});
  selRing.material.opacity=.6+Math.sin(t*5)*.3;okRing.material.opacity=.6+Math.sin(t*6)*.25;
  Sky.update(dt,{hour:+doc.sky.hour,target:ctl.target});if(Sky.animate)Sky.animate(t,dt,cam);const night=Sky.state.night;$('daynight').textContent=night>.5?'🌙':'☀️';
  E.terr&&E.terr.update&&E.terr.update(t);E.fol&&E.fol.update(t,ctl.target.x,ctl.target.z);E.wl&&E.wl.update(t,dt);
  if(E.props){E.props.night=night;E.props.update(t);}if(E.road){E.road.night=night;E.road.update(t,dt);}if(E.bike){E.bike.night=night;E.bike.update(t,dt);}if(E.veh){E.veh.night=night;E.veh.update(t,dt);}if(E.train){E.train.night=night;E.train.update(t,dt);}if(E.bld)E.bld.update(t,{night});if(E.life)E.life.update(t,dt,{night});
  if(E.water){E.water.setSun&&E.water.setSun(Sky.state.sunDir,Sky.state.sunColor,Sky.state.skyColor);E.water.render(t);}else R.render(scene,cam);})();
})();
