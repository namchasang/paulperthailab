/* Vehicle Engine (Paul Perth Library, Nov 2026) — every vehicle in the games as real low-poly toon 3D for three.js r128.
   const V=VehicleEngine.create({scene,heightAt,waterLevel:0});
   V.add(kind,x,z,{rot,color,roof:'rack'|'surf'|null,livery:'TEXT',plate:'ABC·123',seed}) -> vehicle {g,kind,cat,...} (parked)
   V.drive(v,N,{road,speed})            road vehicles drive a RoadEngine network N: keep left (Australia), slow at junctions,
                                        give way inside a junction, indicators before a turn, brake lights, steering, wheel spin
   V.rail(v,pts,{cars,speed,loop,stops})  train: a loco/cab plus carriages that each follow the polyline on their own
   V.sail(v,pts,{speed,loop})           boats: follow a route on the water, bob and roll with the swell, leave a wake
   V.fly(v,{runway:[[x,z],[x,z]],alt,radius})  planes: take off, fly a circuit, land, taxi back, repeat
   V.update(t,dt)   V.night=0..1 (headlights, tail lights, cabin and nav lights switch on)
   V.setLayer(name,on), V.layers: lights, plates, roofitems, passengers, wakes, dirt, shadows
   Kinds: VehicleEngine.KINDS (road, rail, water, air, bike). Fictional names only: no real brands, badges, grilles or operators. */
(function(g){
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const MC={},m=(c,o)=>{const k=c+(o?JSON.stringify(o):'');return MC[k]||(MC[k]=new THREE.MeshLambertMaterial(Object.assign({color:lin(c)},o||{})));};
const GLASS=()=>m('#24384a',{emissive:lin('#000000')});
const mesh=(G,geo,mat,x,y,z,sh)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x||0,y||0,z||0);o.castShadow=sh!==false;o.receiveShadow=true;G.add(o);return o;};
const box=(G,w,h,d,c,x,y,z)=>mesh(G,new THREE.BoxGeometry(w,h,d),typeof c==='string'?m(c):c,x,y,z);
const cyl=(G,r1,r2,h,c,x,y,z,seg,rx,rz)=>{const o=mesh(G,new THREE.CylinderGeometry(r1,r2,h,seg||12),typeof c==='string'?m(c):c,x,y,z);if(rx)o.rotation.x=rx;if(rz)o.rotation.z=rz;return o;};
/* a side profile [[x,y],...] (x along the length, y up) extruded across width w, centred, with soft bevels */
function prof(G,pts,w,c,y0,bev){const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));const b=bev==null?.06:bev;
  const geo=new THREE.ExtrudeGeometry(s,{depth:w-b*2,bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:4});geo.translate(0,0,-(w-b*2)/2);const o=mesh(G,geo,typeof c==='string'?m(c):c,0,y0||0,0);return o;}
/* text canvas (livery, plates, signs), drawn crisp at 4x */
function tex(lines,bg,fg,wpx,hpx){const S=4,c=document.createElement('canvas');c.width=wpx*S;c.height=hpx*S;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';
  lines.forEach((l,i)=>{let fs=hpx*S/lines.length*.72;x.font=`bold ${fs}px system-ui,sans-serif`;while(x.measureText(l).width>c.width*.92&&fs>6)x.font=`bold ${(fs-=S)}px system-ui,sans-serif`;x.fillText(l,c.width/2,(i+.5)*c.height/lines.length);});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const decal=(G,t,w,h,x,y,z,ry,L)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:t,transparent:true,polygonOffset:true,polygonOffsetFactor:-2}));o.position.set(x,y,z);o.rotation.y=ry||0;G.add(o);if(L)L.push(o);return o;};
const rnd=s=>()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0)>>>0)/4294967296;
const PAINT=['#c8344a','#f4f2ec','#2f6a74','#e8b860','#3e7d5c','#1d3a6e','#9aa0a6','#2a2a30','#e86a3a','#7aa6c8','#b8211c','#d8d2c0'];

/* ---------- road vehicles: side profiles (length L along +x = front) ---------- */
const ROAD={
  hatch:{name:'Wren City Hatch',L:2.3,W:1.05,body:[[-1.15,.18],[1.15,.18],[1.17,.5],[.95,.62],[-1.12,.66],[-1.15,.4]],cab:[[-1.05,.6],[.75,.62],[.38,1.02],[-.92,1.04],[-1.07,.78]],wb:.72,wr:.2},
  sedan:{name:'Corella Sedan',L:2.6,W:1.06,body:[[-1.3,.18],[1.3,.18],[1.32,.48],[1.0,.58],[-1.2,.62],[-1.32,.42]],cab:[[-.82,.58],[.62,.58],[.28,.98],[-.52,1.0],[-.95,.62]],wb:.85,wr:.2},
  ute:{name:'Kestrel Ute',L:2.8,W:1.1,body:[[-1.4,.22],[1.4,.22],[1.42,.58],[1.1,.68],[-1.38,.7],[-1.42,.45]],cab:[[-.15,.66],[.82,.66],[.48,1.12],[-.08,1.14]],tray:true,wb:.95,wr:.24},
  suv:{name:'Outback Cruiser',L:2.7,W:1.15,body:[[-1.35,.28],[1.35,.28],[1.37,.68],[1.1,.78],[-1.33,.8],[-1.37,.5]],cab:[[-1.25,.76],[.72,.76],[.42,1.26],[-1.2,1.28]],wb:.92,wr:.27},
  van:{name:'Delivery Van',L:2.9,W:1.15,body:[[-1.45,.22],[1.45,.22],[1.47,.6],[1.2,.75],[-1.45,.78],[-1.47,.5]],cab:[[-1.42,.74],[1.05,.74],[.75,1.42],[-1.42,1.46]],wb:1.0,wr:.23,panel:true},
  taxi:{name:'City Cab',L:2.6,W:1.06,body:[[-1.3,.18],[1.3,.18],[1.32,.48],[1.0,.58],[-1.2,.62],[-1.32,.42]],cab:[[-.82,.58],[.62,.58],[.28,.98],[-.52,1.0],[-.95,.62]],wb:.85,wr:.2,taxi:true,color:'#f2c230'},
  campervan:{name:'Swagman Camper',L:3.0,W:1.18,body:[[-1.5,.24],[1.5,.24],[1.52,.62],[1.25,.78],[-1.5,.8],[-1.52,.5]],cab:[[-1.48,.76],[1.12,.76],[.86,1.36],[-1.48,1.6]],wb:1.0,wr:.24,popTop:true,color:'#f2ead6',two:'#2f8a8a'},
  caravan:{name:'Tow Caravan',L:2.6,W:1.15,body:[[-1.3,.3],[1.3,.3],[1.32,1.35],[1.15,1.5],[-1.2,1.5],[-1.32,1.3]],wb:0,wr:.22,trailer:true,color:'#f4f2ec',two:'#e86a3a'},
  truck:{name:'Delivery Truck',L:4.2,W:1.3,body:[[.75,.32],[2.1,.32],[2.12,.8],[1.95,1.5],[.75,1.55]],cab:[[1.05,1.0],[1.98,1.0],[1.94,1.42],[1.05,1.45]],box:[-2.1,.7,2.8,1.9],wb:1.5,wr:.3,color:'#f4f2ec'},
  islandbus:{name:'Island Loop bus',L:5.6,W:1.35,body:[[-2.8,.3],[2.8,.3],[2.82,1.8],[2.7,1.95],[-2.75,1.95],[-2.82,1.8]],wb:1.9,wr:.3,bus:true,color:'#f2f0e8',two:'#2f8a8a',livery:'ISLAND LOOP'},
  citybus:{name:'City bus',L:6.2,W:1.4,body:[[-3.1,.28],[3.1,.28],[3.12,1.9],[3.0,2.02],[-3.05,2.02],[-3.12,1.9]],wb:2.2,wr:.3,bus:true,color:'#e8e6e0',two:'#1d4f9c',livery:'CITY ROUTES'},
  foodtruck:{name:'Food truck',L:3.4,W:1.25,body:[[-1.7,.28],[1.7,.28],[1.72,.7],[1.45,.85],[-1.7,.88],[-1.72,.55]],cab:[[.55,.84],[1.3,.84],[1.05,1.4],[.55,1.42]],box:[-1.7,.85,2.2,1.55],wb:1.15,wr:.27,hatchSide:true,color:'#e8b860',livery:'TACOS & COFFEE'},
  icecream:{name:'Ice-cream van',L:3.0,W:1.18,body:[[-1.5,.24],[1.5,.24],[1.52,.62],[1.25,.78],[-1.5,.8],[-1.52,.5]],cab:[[-1.48,.76],[1.05,.76],[.78,1.4],[-1.48,1.44]],wb:1.0,wr:.24,hatchSide:true,cone:true,color:'#f6d6e0',two:'#7ac8d8',livery:'SCOOPS'},
  /* Paul's two (14 Nov 2026): look-alike styles with fictional names, no logos, badges or grille copies */
  pipmini:{name:'Pip Mini',L:2.05,W:1.06,body:[[-1.02,.17],[1.02,.17],[1.05,.48],[.82,.6],[-1.0,.62],[-1.04,.4]],cab:[[-.96,.6],[.6,.6],[.42,1.0],[-.9,1.0]],wb:.72,wr:.19,whiteRoof:true,roundLights:true,stripes:true,color:'#2e6a46'},
  rangerlux:{name:'Ranger Lux',L:3.0,W:1.22,body:[[-1.5,.34],[1.5,.34],[1.52,.82],[1.38,.9],[-1.48,.92],[-1.52,.6]],cab:[[-1.42,.88],[1.0,.88],[.86,1.46],[-1.4,1.48]],wb:1.08,wr:.3,floatRoof:true,slimLights:true,color:'#3a4048'}
};
/* every vehicle kind, by category, with its nice name */
const KINDS={};for(const k in ROAD)KINDS[k]={cat:'road',name:ROAD[k].name};
Object.assign(KINDS,{islandtrain:{cat:'rail',name:'Island train'},suburban:{cat:'rail',name:'Suburban train'},
  ferry:{cat:'water',name:'Passenger ferry'},catamaran:{cat:'water',name:'Fast catamaran'},fishingboat:{cat:'water',name:'Fishing boat'},speedboat:{cat:'water',name:'Speed boat'},houseboat:{cat:'water',name:'Houseboat'},
  yacht:{cat:'water',name:'Sailing yacht'},superyacht:{cat:'water',name:'Super yacht'},partyboat:{cat:'water',name:'Party boat'},fishbuyer:{cat:'water',name:'Fish-buyer boat'},tanker:{cat:'water',name:'Tanker'},cruiseship:{cat:'water',name:'Cruise ship'},kayak:{cat:'water',name:'Kayak'},
  lightplane:{cat:'air',name:'Light plane'},seaplane:{cat:'air',name:'Seaplane'},airliner:{cat:'air',name:'Airliner'},bike:{cat:'bike',name:'Bike'}});

function create(o){const scene=o.scene,H=o.heightAt||(()=>0),WL=o.waterLevel||0,root=new THREE.Group();root.name='vehicles';scene.add(root);
  const LAYERS={lights:true,plates:true,roofitems:true,passengers:true,wakes:true,dirt:false,shadows:true};const all=[];let night=0;
  const R=rnd(o.seed||7);
  /* lamps: one material per kind of lamp so night switches them all at once */
  const LM={head:new THREE.MeshLambertMaterial({color:lin('#f4f0e0'),emissive:lin('#fff3c8'),emissiveIntensity:0}),tail:new THREE.MeshLambertMaterial({color:lin('#8a1a1a'),emissive:lin('#ff2a1a'),emissiveIntensity:.15}),
    ind:new THREE.MeshLambertMaterial({color:lin('#c87a1a'),emissive:lin('#ffa020'),emissiveIntensity:0}),cabin:new THREE.MeshLambertMaterial({color:lin('#3a4a5a'),emissive:lin('#ffd890'),emissiveIntensity:0}),
    navR:new THREE.MeshBasicMaterial({color:0xff3030}),navG:new THREE.MeshBasicMaterial({color:0x30ff60}),white:new THREE.MeshBasicMaterial({color:0xffffff})};
  const beamTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,240,200,.55)');gr.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=gr;x.beginPath();x.moveTo(26,0);x.lineTo(38,0);x.lineTo(64,128);x.lineTo(0,128);x.fill();return new THREE.CanvasTexture(c);})();
  const beamM=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0});
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,248,220,1)');gr.addColorStop(.25,'rgba(255,230,170,.6)');gr.addColorStop(1,'rgba(255,220,150,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const glowM=new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}),glowR=new THREE.SpriteMaterial({map:glowTex,color:0xff4030,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0});
  const glow=(o,red,sz)=>{const sp=new THREE.Sprite(red?glowR:glowM);sp.scale.setScalar(sz||.7);sp.position.copy(o.position);o.parent.add(sp);return sp;};
  function wheel(G,x,z,r,w,list){const W=new THREE.Group();W.position.set(x,r,z);G.add(W);const t=cyl(W,r,r,w,'#1d1d22',0,0,0,14,Math.PI/2);const hub=cyl(W,r*.55,r*.55,w+.02,'#c8ccd0',0,0,0,10,Math.PI/2);
    const sp=box(hub,r*.9,r*.12,.02,'#8a9096',0,0,0);sp.position.y=0;list.push(W);return W;}
  function lamp(G,mat,w,h,d,x,y,z,list){const o=box(G,w,h,d,mat,x,y,z);o.castShadow=false;if(list)list.push(o);return o;}
  /* ---------- builders ---------- */
  function roadCar(kind,op){const D=ROAD[kind],G=new THREE.Group(),body=new THREE.Group();G.add(body);const col=op.color||D.color||PAINT[(R()*PAINT.length)|0],two=D.two||col;
    const v={g:G,body,kind,cat:'road',wheels:[],front:[],L:D.L,W:D.W,lamps:{head:[],tail:[],indL:[],indR:[]},roofItems:[],plates:[],people:[]};
    const W=D.W,L=D.L,dark='#2a2e33';
    if(D.body)prof(body,D.body,W,col);
    if(D.cab){prof(body,D.cab,W*.9,GLASS(),0,.04);/* pillars and roof in body colour (or white roof / dark floating roof) */
      const top=D.cab.reduce((a,p)=>Math.max(a,p[1]),0),xs=D.cab.filter(p=>p[1]>top-.06).map(p=>p[0]),x0=Math.min(...xs),x1=Math.max(...xs);
      box(body,x1-x0+.04,.06,W*.92,D.whiteRoof?'#f4f2ec':D.floatRoof?'#1d2126':D.popTop?two:col,(x0+x1)/2,top+.02,0);
      if(D.floatRoof){[x0+.05,x1-.05].forEach(px=>box(body,.07,top-.8,W*.91,'#1d2126',px,(top+.8)/2,0));}
      if(D.whiteRoof){/* white roof sits on dark pillars */[x0+.03,(x0+x1)/2,x1-.03].forEach(px=>box(body,.06,top-.6,W*.905,'#2a2e33',px,(top+.6)/2,0));}}
    if(D.box){const[bx,by,bl,bh]=D.box;box(body,bl+.2,.14,W*.7,'#2a2e33',bx+bl/2+.1,by-.07,0);/* chassis under the box */box(body,bl,bh,W,two===col?'#f4f2ec':col,bx+bl/2,by+bh/2,0);}
    if(D.tray){box(body,1.1,.05,W*.96,'#3a3e44',-.85,.72,0);[[-.3,1],[-1.4,1]].forEach(([x])=>box(body,.05,.22,W*.96,col,x,.82,0));[-1,1].forEach(s=>box(body,1.12,.22,.05,col,-.85,.82,s*W*.47));}
    if(D.bus){/* windows band, doors, destination */box(body,L*.92,.62,W+.02,GLASS(),0,1.32,0);box(body,L*.98,.18,W+.03,two,0,.62,0);box(body,.06,1.3,.04,'#20262c',L*.38,1.0,W/2+.01);box(body,.06,1.3,.04,'#20262c',L*.33,1.0,W/2+.01);
      box(body,.05,.9,W*.9,GLASS(),L/2+.005,1.25,0);v.dest=decal(body,tex([D.livery||'LOOP'],'#111','#ffb020',160,24),W*.8,.16,L/2+.03,1.78,0,Math.PI/2);
      for(let i=0;i<6;i++){const p=box(body,.22,.3,.22,['#e8b088','#8a5a3a','#f0c8a0','#c08860'][i%4],-L*.35+i*L*.12,1.2,(i%2?.3:-.3));v.people.push(p);}}
    if(D.livery){const t=tex([op.livery||D.livery],'rgba(0,0,0,0)',D.bus?'#1d3a4a':'#2a2e33',220,40);[1,-1].forEach(s=>decal(body,t,L*.55,.3,D.bus?-.1:D.box?D.box[0]+D.box[2]/2:-.2,D.bus?.95:D.box?D.box[1]+D.box[3]*.6:.9,s*(W/2+.012),s>0?0:Math.PI));}
    if(D.stripes){[-.14,.14].forEach(z=>box(body,L*.7,.012,.09,'#f4f2ec',.05,D.body[3][1]+.01,z));}
    if(D.taxi){const s=box(body,.42,.14,.24,'#f6f2e0',-.1,1.08,0);v.taxiSign=s;decal(body,tex(['TAXI'],'#f6f2e0','#1a1a1a',60,20),.4,.12,-.1,1.08,.125,0);}
    if(D.popTop){prof(body,[[-1.3,1.6],[.5,1.6],[.3,1.9],[-1.3,1.9]],W*.86,'#f4f2ec',0,.03);}
    if(D.hatchSide){box(body,.9,.42,.04,'#20262c',-.4,1.1,W/2+.01);const aw=box(body,1.0,.04,.4,'#f4f2ec',-.4,1.36,W/2+.2);aw.rotation.x=-.25;}
    if(D.cone){const c=new THREE.Group();c.position.set(-.6,1.5,0);body.add(c);cyl(c,.12,0,.36,'#e0b070',0,.1,0,8,Math.PI);mesh(c,new THREE.SphereGeometry(.15,10,8),m('#f6d6e0'),0,.32,0);}
    if(D.panel){box(body,.04,.5,W*.8,'#20262c',-L/2-.01,.95,0);}
    if(D.trailer){box(body,.7,.08,.08,dark,L/2+.35,.36,0);box(body,1.2,.42,.04,GLASS(),.2,1.0,W/2+.005);box(body,L*.9,.12,W+.02,two,0,.62,0);}
    if(kind==='rangerlux'){/* a spare wheel on the tailgate and a clamshell line */cyl(body,.27,.27,.16,'#1d1d22',-L/2-.06,.75,0,14,0,Math.PI/2);box(body,1.1,.015,W*.98,'#1d2126',1.0,.86,0);}
    /* bumpers, lamps */
    box(body,.08,.16,W*.98,'#3a3e44',L/2+.02,.3,0);box(body,.08,.16,W*.98,'#3a3e44',-L/2-.02,.3,0);
    const hy=D.trailer?.55:(D.body?D.body[2][1]-.1:.5);
    [-1,1].forEach(s=>{if(D.roundLights){const h=cyl(body,.09,.09,.04,LM.head,L/2+.01,hy,s*W*.32,12,0,Math.PI/2);v.lamps.head.push(h);}
      else if(!D.trailer)v.lamps.head.push(lamp(body,LM.head,.03,D.slimLights?.06:.11,.22,L/2+.01,hy,s*W*.33));
      v.lamps.tail.push(lamp(body,LM.tail,.03,.12,.18,-L/2-.03,hy,s*W*.34));(s>0?v.lamps.indL:v.lamps.indR).push(lamp(body,LM.ind,.03,.06,.08,L/2+.015,hy-.12,s*W*.42),lamp(body,LM.ind,.03,.06,.08,-L/2-.035,hy-.12,s*W*.42));});
    v.lamps.head.forEach(h=>glow(h,false,.75));v.lamps.tail.forEach(h=>glow(h,true,.45));
    if(!D.trailer)v.beamAt=L/2+3.1;/* the headlight beam on the road is made the first time it gets dark (keeps day thumbnails and bounds tight) */
    /* plates */
    const pl=tex([op.plate||('W'+String.fromCharCode(65+(R()*26|0))+String.fromCharCode(65+(R()*26|0))+'·'+(100+(R()*899|0)))],'#ffffff','#1d4f9c',80,22);
    [[L/2+.065,0],[-L/2-.065,Math.PI]].forEach(([x,r])=>{v.plates.push(decal(body,pl,.34,.09,x,.3,0,r+Math.PI/2));});
    /* wheels */
    const wr=D.wr,ww=.16;if(D.trailer){[.0].forEach(x=>[-1,1].forEach(s=>wheel(G,x,s*(W/2-.04),wr,ww,v.wheels)));}
    else[[D.wb,1],[-D.wb,0]].forEach(([x,f])=>[-1,1].forEach(s=>{const w=wheel(G,x,s*(W/2-.04),wr,ww,v.wheels);if(f)v.front.push(w);}));
    if(D.truck||kind==='truck'||kind==='citybus'||kind==='islandbus'){/* second rear axle look */}
    /* roof items */
    const roof=op.roof===undefined?(kind==='suv'||kind==='ute'||kind==='rangerlux'?'rack':kind==='hatch'&&R()<.3?'surf':null):op.roof;
    if(roof&&D.cab){const top=D.cab.reduce((a,p)=>Math.max(a,p[1]),0)+.06,rg=new THREE.Group();rg.position.y=top;body.add(rg);[-.35,.35].forEach(x=>box(rg,.05,.06,W*.9,'#2a2e33',x,.03,0));
      if(roof==='surf'){const b=box(rg,1.9,.05,.36,'#f4f2ec',0,.1,0);box(rg,1.7,.052,.05,'#3a8ad0',0,.1,0);b.scale.x=1;}else{box(rg,1.0,.16,W*.7,'#3a4048',0,.13,0);}v.roofItems.push(rg);}
    return v;}

  /* water: a hull (pointed bow) plus decks */
  function hull(G,L,W,D,col,stripe){const s=new THREE.Shape(),h=W/2;s.moveTo(-L/2,-h);s.lineTo(L*.22,-h);s.quadraticCurveTo(L*.46,-h*.7,L/2,0);s.quadraticCurveTo(L*.46,h*.7,L*.22,h);s.lineTo(-L/2,h);s.lineTo(-L/2,-h);
    const geo=new THREE.ExtrudeGeometry(s,{depth:D,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:1});geo.rotateX(-Math.PI/2);geo.translate(0,-D*.55,0);const o=mesh(G,geo,m(col));
    if(stripe){const g2=geo.clone();g2.scale(1.004,.12,1.004);const st=mesh(G,g2,m(stripe));st.position.y=D*.33;}
    const deck=geo.clone();deck.scale(.98,.04,.98);mesh(G,deck,m('#c8a878'),0,D*.47,0);return o;}
  function boat(kind,op){const G=new THREE.Group(),body=new THREE.Group();G.add(body);const v={g:G,body,kind,cat:'water',wheels:[],front:[],lamps:{head:[],tail:[],indL:[],indR:[]},roofItems:[],plates:[],people:[],L:4};
    const c=op.color;const cabin=(x,y,l,h,w,col,win)=>{box(body,l,h,w,col||'#f4f2ec',x,y+h/2,0);if(win!==false){box(body,l*.86,h*.36,w+.02,GLASS(),x,y+h*.62,0);v.lamps.head.push(lamp(body,LM.cabin,l*.84,h*.3,w+.03,x,y+h*.62,0));}};
    if(kind==='ferry'){v.L=12;hull(body,12,3.4,1.4,c||'#f4f2ec','#1f5fae');cabin(-.8,.75,7.2,1.2,3.0,'#f4f2ec');cabin(-.6,1.95,5.0,.9,2.6,'#f4f2ec');box(body,2.2,.1,2.7,'#1f5fae',-.6,2.92,0);cyl(body,.25,.3,.9,'#1f5fae',-2.4,3.3,0);
      [1,-1].forEach(s=>decal(body,tex([op.livery||'ISLAND FERRIES'],'rgba(0,0,0,0)','#1f5fae',260,30),5,.5,-.6,.55,s*1.71,s>0?0:Math.PI));}
    else if(kind==='catamaran'){v.L=13;[-1.3,1.3].forEach(z=>{const hh=new THREE.Group();hh.position.z=z;body.add(hh);hull(hh,13,1.2,1.2,'#f4f2ec','#e86a3a');});box(body,10,.3,3.6,'#f4f2ec',-.6,.8,0);cabin(-1,.95,7,1.3,3.4,'#f4f2ec');cabin(-.4,2.25,3.6,.8,2.8,'#f4f2ec');}
    else if(kind==='fishingboat'){v.L=6;hull(body,6,2,1.0,c||'#2f6a74','#f4f2ec');cabin(.9,.5,1.6,1.1,1.5,'#f4f2ec');cyl(body,.05,.05,2.6,'#3a3e44',-1,1.8,0);box(body,.05,.05,2.4,'#3a3e44',-1.6,2.4,0).rotation.z=.5;box(body,1.2,.4,1.2,'#e86a3a',-1.6,.7,0);}
    else if(kind==='speedboat'){v.L=4;hull(body,4,1.5,.7,c||'#f4f2ec','#c8344a');const ws=box(body,.05,.3,1.2,GLASS(),.5,.65,0);ws.rotation.z=-.5;box(body,1.2,.3,1.2,'#e8e2d4',-.6,.45,0);}
    else if(kind==='houseboat'){v.L=7;[-1,1].forEach(z=>{const hh=new THREE.Group();hh.position.z=z;body.add(hh);hull(hh,7,.8,.6,'#9aa0a6');});box(body,6.6,.2,2.8,'#c8a878',0,.4,0);cabin(-.2,.5,4.4,1.4,2.4,c||'#f2ead6');prof(body,[[-2.6,1.9],[2.2,1.9],[2.2,2.1],[-.2,2.6],[-2.6,2.1]],2.6,'#b8562e',0,.03);}
    if(kind==='yacht'){v.L=6;hull(body,6,1.9,.9,c||'#f4f2ec','#1d3a6e');box(body,1.6,.4,1.2,'#f4f2ec',-.2,.65,0);cyl(body,.06,.06,6.5,'#d8d8d8',.6,3.6,0);
      const sail=(pts,col)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));const o=mesh(body,new THREE.ShapeGeometry(s),new THREE.MeshLambertMaterial({color:lin(col),side:THREE.DoubleSide}));v.sails=(v.sails||[]).concat(o);return o;};
      sail([[.55,.9],[.55,6.6],[-2.3,1.0]],'#f6f4ee');sail([[.7,1.0],[.7,6.2],[2.9,.8]],'#eef2f6');}
    else if(kind==='superyacht'){v.L=14;hull(body,14,3.6,1.6,'#f4f2ec','#2a2e33');cabin(-.6,.85,8.6,1.1,3.2,'#f4f2ec');cabin(-.8,1.95,6.0,1.0,2.9,'#f4f2ec');cabin(-.6,2.95,3.6,.8,2.4,'#f4f2ec');box(body,1.6,.2,1.6,'#2a2e33',-.6,3.85,0);mesh(body,new THREE.SphereGeometry(.35,10,8),m('#f4f2ec'),-.6,4.2,0);}
    else if(kind==='partyboat'){v.L=12;hull(body,12,4.6,1.2,'#f6f6f2','#e86a3a');cabin(-.5,.6,8,1.2,4.2,'#f6f6f2');box(body,8.4,.12,4.4,'#e86a3a',-.5,2.95,0);for(let i=0;i<6;i++)cyl(body,.04,.04,1.1,'#d8d8d8',-4.2+i*1.5,2.35,2.1);
      const bulbs=[];for(let i=0;i<14;i++){const b=mesh(body,new THREE.SphereGeometry(.07,6,5),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(i/14,.8,.6)}),-4.5+i*.62,2.9,2.25,false);bulbs.push(b);}v.party=bulbs;}
    else if(kind==='fishbuyer'){v.L=9;hull(body,9,3.2,1.3,'#f4f2ec','#2f6a74');cabin(1.6,.7,2.6,1.4,2.6,'#f4f2ec');box(body,3.4,.9,2.6,'#9ac8d8',-1.8,1.1,0);decal(body,tex(['FRESH FISH BOUGHT'],'#2f6a74','#ffffff',200,30),3,.4,-1.8,1.2,1.32,0);}
    else if(kind==='tanker'){v.L=30;hull(body,30,5.4,2.6,'#b8342a','#2a2e33');box(body,22,.3,5,'#5a6a3a',-1,1.3,0);for(let i=0;i<5;i++)cyl(body,.25,.25,4.6,'#e8e4d8',-9+i*4.4,1.7,0,8,Math.PI/2);cabin(-12.5,1.4,3,3.6,4.6,'#f4f2ec');cyl(body,.5,.6,2,'#2a2e33',-13.5,6.2,0);}
    else if(kind==='cruiseship'){v.L=36;hull(body,36,7,3,'#f4f2ec','#1d3a6e');for(let d=0;d<5;d++)cabin(-2-d*.4,1.5+d*1.1,26-d*3.2,1.1,6.4-d*.4,'#f4f2ec');cyl(body,1,1.2,2.6,'#1d3a6e',-8,8.6,0);}
    else if(kind==='kayak'){v.L=2.6;const geo=new THREE.SphereGeometry(.5,14,8);geo.scale(2.6,.32,.62);mesh(body,geo,m(c||'#f2c230'),0,.05,0);box(body,.5,.06,.36,'#2a2e33',0,.18,0);const pd=box(body,.04,.04,1.8,'#3a3e44',.1,.45,0);pd.rotation.x=.4;v.paddle=pd;
      const p=box(body,.26,.4,.26,'#e8b088',0,.4,0);v.people.push(p);}
    if(kind!=='kayak'){/* nav lights: port red, starboard green, masthead white */const s=v.L/2*.55;[[navM('R'),1],[navM('G'),-1]].forEach(([mt,sd])=>{const b=mesh(body,new THREE.SphereGeometry(.09,6,5),mt,s*.2,1.0,sd*.5,false);v.lamps.tail.push(b);});}
    /* wake: a fading V behind */
    const wk=new THREE.Mesh(new THREE.PlaneGeometry(1,1),wakeM());wk.rotation.x=-Math.PI/2;wk.position.y=.03;G.add(wk);v.wake=wk;wk.scale.set(v.L*1.8,v.L*.7,1);wk.position.x=-v.L*1.1;
    return v;}
  function navM(k){return k==='R'?LM.navR:LM.navG;}
  let WM=null;function wakeM(){if(WM)return WM;const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');for(let i=0;i<220;i++){const u=Math.random(),sp=u*.5;const a=Math.random()<.5?1:-1;const px=256*(1-u),py=64+a*sp*120*(.4+Math.random()*.6);x.fillStyle=`rgba(255,255,255,${(1-u)*.5})`;x.beginPath();x.arc(px,py,2+4*(1-u),0,7);x.fill();}
    const gr=x.createLinearGradient(256,0,0,0);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,56,256,16);
    const t=new THREE.CanvasTexture(c);WM=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:.9});return WM;}
  function train(kind,op){const G=new THREE.Group();const v={g:G,body:G,kind,cat:'rail',cars:[],lamps:{head:[],tail:[],indL:[],indR:[]},wheels:[],front:[],roofItems:[],plates:[],people:[],L:4};
    const n=op.cars||(kind==='islandtrain'?3:4);for(let i=0;i<n;i++){const C=new THREE.Group();root.add(C);const isLoco=kind==='islandtrain'&&i===0,cab=kind==='suburban'&&(i===0||i===n-1);
      if(kind==='islandtrain'){const L=isLoco?2.6:3.0,col=isLoco?'#2f6a74':'#c8344a';box(C,L,.12,1.25,'#2a2e33',0,.38,0);
        if(isLoco){box(C,1.4,.7,1.0,col,-.4,.8,0);box(C,1.0,1.0,1.1,col,.75,.95,0);box(C,.9,.4,1.12,GLASS(),.75,1.15,0);cyl(C,.12,.15,.5,'#2a2e33',-.9,1.4,0);v.lamps.head.push(lamp(C,LM.head,.04,.14,.3,1.3,.85,0));}
        else{box(C,L,.12,1.2,'#f4f2ec',0,.5,0);[-1,1].forEach(s=>box(C,L,.5,.05,col,0,.75,s*.58));for(let k=0;k<4;k++)cyl(C,.035,.035,.9,'#e8e4d8',-L/2+.2+k*(L-.4)/3,.95,.55*1,6),cyl(C,.035,.035,.9,'#e8e4d8',-L/2+.2+k*(L-.4)/3,.95,-.55,6);
          prof(C,[[-L/2-.1,1.4],[L/2+.1,1.4],[L/2+.1,1.48],[0,1.62],[-L/2-.1,1.48]],1.35,'#f4f2ec',0,.02);for(let k=0;k<4;k++){const p=box(C,.22,.3,.22,['#e8b088','#8a5a3a','#f0c8a0'][k%3],-L/2+.5+k*.65,.75,(k%2?.25:-.25));v.people.push(p);}}
        [-L/2+.45,L/2-.45].forEach(x=>[-1,1].forEach(s=>wheel(C,x,s*.5,.18,.1,v.wheels)));C.userData.L=L;}
      else{const L=4.4;box(C,L,1.35,1.3,'#e8e6e0',0,1.05,0);box(C,L*.96,.42,1.32,GLASS(),0,1.28,0);box(C,L,.14,1.32,'#c8344a',0,.62,0);box(C,L,.1,1.32,'#1d4f9c',0,1.62,0);
        for(let k=0;k<2;k++)box(C,.5,.95,.02,'#3a4048',-L/4+k*L/2,.95,.66);v.lamps.head.push(lamp(C,LM.cabin,L*.94,.36,1.33,0,1.28,0));
        if(cab){const f=i===0?1:-1;const nose=prof(C,[[0,.4],[.5,.4],[.5,1.0],[.25,1.7],[0,1.72]],1.28,'#e8e6e0',0,.04);nose.position.x=f*L/2;if(f<0)nose.scale.x=-1;v.lamps.head.push(lamp(C,LM.head,.03,.12,.25,f*(L/2+.5),.75,.4),lamp(C,LM.head,.03,.12,.25,f*(L/2+.5),.75,-.4));}
        [-L/2+.6,L/2-.6].forEach(x=>[-1,1].forEach(s=>wheel(C,x,s*.52,.2,.1,v.wheels)));C.userData.L=L+(cab?.5:0);}
      v.cars.push(C);}
    v.g=v.cars[0];return v;}
  function plane(kind,op){const G=new THREE.Group(),body=new THREE.Group();G.add(body);const v={g:G,body,kind,cat:'air',wheels:[],front:[],lamps:{head:[],tail:[],indL:[],indR:[]},roofItems:[],plates:[],people:[],L:6};
    const col=op.color||(kind==='airliner'?'#f4f2ec':'#f4f2ec'),acc=op.accent||(kind==='airliner'?'#1d4f9c':'#c8344a');
    if(kind==='airliner'){v.L=16;const f=new THREE.CylinderGeometry(.95,.95,14,16);f.rotateZ(Math.PI/2);mesh(body,f,m(col),0,2.2,0);const nose=new THREE.SphereGeometry(.95,16,10,0,Math.PI*2,0,Math.PI/2);nose.rotateZ(-Math.PI/2);mesh(body,nose,m(col),7,2.2,0);
      const tl=new THREE.ConeGeometry(.95,3,16);tl.rotateZ(Math.PI/2);mesh(body,tl,m(col),-8.5,2.4,0).scale.set(1,.85,1);box(body,.4,.06,15,m(col),-.2,1.9,0);box(body,2.4,.1,15,m(col),-.4,1.9,0).rotation.y=0;
      [-1,1].forEach(s=>{const e=cyl(body,.42,.42,1.6,acc,.6,1.45,s*3.6,12,0,Math.PI/2);});prof(body,[[-9.4,2.6],[-7.8,2.6],[-8.6,5.4],[-9.6,5.4]],.18,acc,0,.02);box(body,1.4,.08,5.4,m(col),-9,2.7,0);
      box(body,10,.28,1.92,GLASS(),.5,2.55,0).scale.set(1,1,1);box(body,1.2,.24,1.5,GLASS(),6.6,2.75,0);
      [[5.5,0],[-1,1.5],[-1,-1.5]].forEach(([x,z])=>{cyl(body,.06,.06,1.2,'#9aa0a6',x,.9,z);wheel(body,x,z,.32,.24,v.wheels);});
      v.lamps.tail.push(mesh(body,new THREE.SphereGeometry(.12,6,5),LM.navR,-.4,1.95,7.5,false),mesh(body,new THREE.SphereGeometry(.12,6,5),LM.navG,-.4,1.95,-7.5,false));}
    else{const sea=kind==='seaplane';v.L=4.4;const f=prof(body,[[-2.2,1.0],[1.3,.85],[1.7,1.15],[1.6,1.55],[.6,1.8],[-1.4,1.55],[-2.3,1.5]],.9,col,0,.08);box(body,1.1,.36,.92,GLASS(),.65,1.55,0);
      box(body,1.0,.06,6.4,m(col),.4,1.82,0);box(body,1.0,.065,1.0,acc,.4,1.83,2.7);box(body,1.0,.065,1.0,acc,.4,1.83,-2.7);prof(body,[[-2.3,1.5],[-1.6,1.5],[-2.0,2.4],[-2.4,2.4]],.1,acc,0,.01);box(body,.6,.05,1.9,m(col),-2.0,1.55,0);
      const pr=new THREE.Group();pr.position.set(1.75,1.2,0);body.add(pr);box(pr,.04,1.4,.12,'#2a2e33',0,0,0);mesh(pr,new THREE.SphereGeometry(.12,8,6),m(acc),.05,0,0);v.prop=pr;
      if(sea){[-.75,.75].forEach(z=>{const fl=new THREE.SphereGeometry(.5,12,8);fl.scale(3.2,.4,.45);mesh(body,fl,m('#e8e4d8'),0,.2,z);cyl(body,.04,.04,.75,'#9aa0a6',.4,.6,z);cyl(body,.04,.04,.75,'#9aa0a6',-.8,.6,z);});}
      else{[[1.0,0],[-.3,.7],[-.3,-.7]].forEach(([x,z])=>{cyl(body,.04,.04,.6,'#9aa0a6',x,.55,z);wheel(body,x,z,.2,.12,v.wheels);});}
      v.lamps.tail.push(mesh(body,new THREE.SphereGeometry(.08,6,5),LM.navR,.4,1.85,3.2,false),mesh(body,new THREE.SphereGeometry(.08,6,5),LM.navG,.4,1.85,-3.2,false));
      v.float=sea;}
    return v;}
  function bike(op){const G=new THREE.Group(),body=new THREE.Group();G.add(body);const v={g:G,body,kind:'bike',cat:'bike',wheels:[],front:[],lamps:{head:[],tail:[],indL:[],indR:[]},roofItems:[],plates:[],people:[],L:1.1};const col=op.color||PAINT[(R()*PAINT.length)|0];
    [[.42,1],[-.42,0]].forEach(([x,f])=>{const W=new THREE.Group();W.position.set(x,.3,0);body.add(W);const t=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,6,18),m('#1d1d22'));W.add(t);const sp=box(W,.5,.012,.012,'#c8ccd0',0,0,0);v.wheels.push(W);if(f)v.front.push(W);});
    const bar=(a,b,c)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],0),L=d.length(),o=cyl(body,.022,.022,L,c||col,(a[0]+b[0])/2,(a[1]+b[1])/2,0,6);o.rotation.z=Math.atan2(d.y,d.x)-Math.PI/2;return o;};
    bar([-.42,.3],[-.05,.3]);bar([-.05,.3],[.3,.68]);bar([-.12,.7],[.3,.68]);bar([-.42,.3],[-.12,.7]);bar([-.05,.3],[-.12,.7]);bar([.42,.3],[.3,.75]);box(body,.06,.03,.4,'#2a2e33',.3,.78,0);box(body,.2,.04,.1,'#2a2e33',-.14,.75,0);
    if(op.basket!==false){const b=box(body,.22,.14,.26,'#c8a060',.5,.66,0);}v.lamps.head.push(lamp(body,LM.head,.03,.05,.06,.5,.55,0));v.lamps.tail.push(lamp(body,LM.tail,.03,.05,.06,-.62,.5,0));return v;}

  /* ---------- api ---------- */
  function add(kind,x,z,op){op=op||{};const K=KINDS[kind];if(!K)throw new Error('VehicleEngine: unknown kind '+kind);let v;
    if(K.cat==='road')v=roadCar(kind,op);else if(K.cat==='water')v=boat(kind,op);else if(K.cat==='rail')v=train(kind,op);else if(K.cat==='air')v=plane(kind,op);else v=bike(op);
    v.name=K.name;v.mode='park';v.speed=0;v.sp=0;v.t=0;v.dist=0;v.rot=op.rot||0;
    if(v.cat==='rail'){let off=0;v.cars.forEach(C=>{C.position.set(x-off,H(x-off,z),z);C.rotation.y=v.rot;off+=(C.userData.L||4)+.25;});}
    else{root.add(v.g);v.g.position.set(x,v.cat==='water'?WL:H(x,z),z);v.g.rotation.y=v.rot;}
    v.g.userData.vehicle={kind,cat:v.cat,name:v.name};all.push(v);applyLayers(v);return v;}
  function applyLayers(v){v.plates.forEach(p=>p.visible=LAYERS.plates);v.roofItems.forEach(p=>p.visible=LAYERS.roofitems);v.people.forEach(p=>p.visible=LAYERS.passengers);if(v.wake)v.wake.visible=LAYERS.wakes&&v.mode!=='park';
    const sh=LAYERS.shadows;(v.cars||[v.g]).forEach(G=>G.traverse(o=>{if(o.isMesh&&o.material!==beamM&&!o.material.transparent)o.castShadow=sh;}));
    if(LAYERS.dirt){(v.cars||[v.g]).forEach(G=>G.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial&&!o.userData.clean&&o.material.color){if(!o.userData.dirt){o.userData.dirt=o.material;o.material=o.material.clone();o.material.color.lerp(lin('#8a7a5a'),.18);}}}));}
    else(v.cars||[v.g]).forEach(G=>G.traverse(o=>{if(o.userData&&o.userData.dirt){o.material=o.userData.dirt;delete o.userData.dirt;}}));}
  /* road driving: keep left, junction turns with a smooth curve across the pad */
  function drive(v,N,op){op=op||{};const rs=N.roads||[];if(!rs.length)return v;v.N=N;v.mode='drive';v.ri=op.road!=null?op.road:(R()*rs.length)|0;v.t=op.t!=null?op.t:R();v.dir=op.dir||(R()<.5?1:-1);v.vmax=op.speed||(rs[v.ri].type==='highway'?9:rs[v.ri].type==='bikepath'?3:5)*(.85+R()*.3);v.sp=v.vmax;v.cross=null;v.nj=null;v.pick=undefined;if(v.wake)v.wake.visible=false;return v;}
  function rail(v,pts,op){op=op||{};v.mode='rail';v.path=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])),!!op.loop,'centripetal');v.plen=v.path.getLength();v.s=op.s||0;v.vmax=op.speed||4;v.sp=v.vmax;v.loop=!!op.loop;v.dir=1;v.stops=op.stops||[];v.wait=0;return v;}
  function sail(v,pts,op){op=op||{};v.mode='sail';v.path=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])),op.loop!==false,'centripetal');v.plen=v.path.getLength();v.s=op.s||0;v.vmax=op.speed||(v.kind==='kayak'?.8:v.L>20?2.5:v.kind==='speedboat'?7:3.2);v.sp=v.vmax;v.loop=op.loop!==false;v.dir=1;if(v.wake)v.wake.visible=LAYERS.wakes;return v;}
  function fly(v,op){op=op||{};const[a,b]=op.runway;v.mode='fly';v.rw={a,b,alt:op.alt||(v.kind==='airliner'?26:14),r:op.radius||(v.kind==='airliner'?70:34)};v.ph='taxi';v.ps=0;v.vmax=v.kind==='airliner'?16:9;v.sp=0;v.float=v.float||false;return v;}
  /* poses */
  const tmpV=new THREE.Vector3();
  function poseOnRoad(v){const r=v.N.roads[v.ri],cv=r.cv,p=cv.getPointAt(Math.max(0,Math.min(1,v.t))),tg=cv.getTangentAt(Math.max(0,Math.min(1,v.t))),nx=-tg.z,nz=tg.x;
    const lanes=r.t.lanes||2,lw=r.t.lw||1.5,off=(lanes>=4?lw*1.5:lanes===1?0:lw*.5)*(v.dir>0?-1:1);/* left of the travel direction */
    const x=p.x+nx*off,z=p.z+nz*off,y=r.yfn?r.yfn(p,v.t):H(x,z);return{x,y,z,a:-Math.atan2(tg.z*v.dir,tg.x*v.dir)};}
  /* the next junction ahead on this road: the exit we will arrive through points back at us (dir = -our dir) and lies ahead */
  function endJunction(v){const J=v.N.junctions||[];let best=null,bd=1e9;
    J.forEach(j=>{(j.exits||[]).forEach(e=>{if(e.k!==v.ri||e.dir!==-v.dir)return;const d=(e.t-v.t)*v.dir;if(d>=-1e-4&&d<bd){bd=d;best={j,e};}});});return best;}
  function stepDrive(v,dt){const N=v.N,r=N.roads[v.ri],L=r.cv.getLength();
    if(v.cross){const c=v.cross;c.u+=Math.max(.5,v.sp)*dt/c.len;const u=Math.min(1,c.u),a=c.p0,b=c.pc,e=c.p1,x=(1-u)*(1-u)*a[0]+2*(1-u)*u*b[0]+u*u*e[0],z=(1-u)*(1-u)*a[1]+2*(1-u)*u*b[1]+u*u*e[1];
      const dx=2*(1-u)*(b[0]-a[0])+2*u*(e[0]-b[0]),dz=2*(1-u)*(b[1]-a[1])+2*u*(e[1]-b[1]);const y=(1-u)*c.y0+u*c.y1;const ang=-Math.atan2(dz,dx);
      v.steer=((ang-v.g.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI)*8;v.g.position.set(x,y,z);v.g.rotation.y=ang;v.dist+=v.sp*dt;v.sp=Math.min(v.vmax*.55,v.sp+3*dt);v.brake=false;
      if(u>=1){v.cross=null;v.blink=0;if(c.j.busy===v)c.j.busy=null;}return;}
    if(v.nj===undefined||v.nj===null)v.nj=endJunction(v)||{none:1};const nj=v.nj;
    const toEnd=nj.none?(v.dir>0?1-v.t:v.t)*L:(nj.e.t-v.t)*v.dir*L;let target=v.vmax;
    if(!nj.none){if(toEnd<6)target=Math.min(target,v.vmax*.45);if(toEnd<1.6&&nj.j.busy&&nj.j.busy!==v)target=0;/* give way: someone is already crossing */}
    else if(toEnd<4)target=Math.min(target,1.2);
    /* keep a gap to the car ahead on the same road and direction */
    for(const o of all){if(o===v||o.mode!=='drive'||o.ri!==v.ri||o.dir!==v.dir||o.cross)continue;const gap=(o.t-v.t)*v.dir*L;if(gap>0&&gap<v.L+2)target=Math.min(target,Math.max(0,(gap-v.L-.6)*1.5));}
    v.brake=target<v.sp-.3;v.sp+=Math.max(-8*dt,Math.min(3*dt,target-v.sp));v.t+=v.dir*v.sp*dt/L;v.dist+=v.sp*dt;
    const P=poseOnRoad(v);const da=((P.a-v.g.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;v.steer=da*6;v.g.position.set(P.x,P.y,P.z);v.g.rotation.y+=da*Math.min(1,dt*12);
    if(!nj.none&&v.pick===undefined&&toEnd<9){/* choose the next road now so the indicator can blink */const ex=(nj.j.exits||[]).filter(e=>e!==nj.e);v.pick=ex.length?ex[(R()*ex.length)|0]:null;
      if(v.pick){const r2=N.roads[v.pick.k],t2=r2.cv.getTangentAt(v.pick.t),t1=r.cv.getTangentAt(Math.max(0,Math.min(1,nj.e.t)));const cr=(t1.x*v.dir)*(t2.z*v.pick.dir)-(t1.z*v.dir)*(t2.x*v.pick.dir);v.blink=Math.abs(cr)<.35?0:cr<0?-1:1;}}
    const atEnd=nj.none?(v.t>=1||v.t<=0):toEnd<=0;
    if(atEnd){v.t=Math.max(0,Math.min(1,v.t));
      if(nj.none||!v.pick){v.dir*=-1;v.nj=null;v.pick=undefined;v.blink=0;return;}/* dead end: turn round */
      if(nj.j.busy&&nj.j.busy!==v){v.sp=0;return;}
      const e=v.pick,p0=[P.x,P.z],j=nj.j;j.busy=v;v.ri=e.k;v.t=e.t;v.dir=e.dir;const P1=poseOnRoad(v);const jc=j.c||{x:(p0[0]+P1.x)/2,z:(p0[1]+P1.z)/2};
      const pc=[(jc.x*2+p0[0]+P1.x)/4,(jc.z*2+p0[1]+P1.z)/4];const len=Math.hypot(pc[0]-p0[0],pc[1]-p0[1])+Math.hypot(P1.x-pc[0],P1.z-pc[1])+.01;
      v.cross={p0,pc,p1:[P1.x,P1.z],y0:P.y,y1:P1.y,u:0,len,j};v.nj=null;v.pick=undefined;}}
  function stepPath(v,dt,t){const L=v.plen;let target=v.vmax;
    if(v.mode==='rail'&&v.stops.length){for(const s of v.stops){const d=((s*L-v.s)*v.dir+L)%L;if(d<5)target=Math.min(target,Math.max(.3,d*.7));if(d<.15&&v.wait<=0&&!v.atStop){v.wait=op_wait;v.atStop=s;}}if(v.atStop!=null&&((v.atStop*L-v.s)*v.dir+L)%L>1&&((v.atStop*L-v.s)*v.dir+L)%L<L-1)v.atStop=null;}
    if(v.wait>0){v.wait-=dt;target=0;v.sp=0;}
    v.sp+=Math.max(-4*dt,Math.min(1.5*dt,target-v.sp));v.s+=v.sp*dt*v.dir;v.dist+=v.sp*dt;
    if(v.loop)v.s=((v.s%L)+L)%L;else if(v.s>L||v.s<0){v.dir*=-1;v.s=Math.max(0,Math.min(L,v.s));}
    const place=(G,s,yaw0)=>{const u=v.loop?((s%L)+L)%L/L:Math.max(0,Math.min(1,s/L));const p=v.path.getPointAt(u),tg=v.path.getTangentAt(u);G.position.set(p.x,v.cat==='water'?WL:H(p.x,p.z),p.z);G.rotation.y=-Math.atan2(tg.z*v.dir,tg.x*v.dir);};
    if(v.mode==='rail'){let off=0;v.cars.forEach((C,i)=>{place(C,v.s-off*v.dir);off+=(C.userData.L||4)+.25;});}
    else{place(v.g,v.s);const b=v.g;const sw=v.L>20?.15:v.kind==='kayak'?.5:.35;b.position.y=WL+Math.sin(t*1.3+v.L)*.06*sw*3;v.body.rotation.x=Math.sin(t*1.1+v.L*.7)*.04*sw;v.body.rotation.z=Math.sin(t*.9+v.L)*.025*sw+(v.kind==='speedboat'?-.06*Math.min(1,v.sp/5):0);
      if(v.wake){v.wake.material.opacity=Math.min(.9,v.sp/v.vmax);v.wake.visible=LAYERS.wakes&&v.sp>.2;}if(v.paddle)v.paddle.rotation.y=Math.sin(t*3)*.6;if(v.sails)v.sails.forEach((s,i)=>s.rotation.y=Math.sin(t*.4+i)*.05);}}
  const op_wait=4;
  function stepFly(v,dt,t){const W=v.rw,a=W.a,b=W.b,dx=b[0]-a[0],dz=b[1]-a[1],RL=Math.hypot(dx,dz),ux=dx/RL,uz=dz/RL,ang=-Math.atan2(uz,ux);const gy=(x,z)=>v.float?WL:H(x,z);
    const G=v.g;let x=G.position.x,z=G.position.z,y=G.position.y;
    if(v.ph==='taxi'){v.ps+=dt;v.sp=Math.min(v.vmax*.15,v.sp+dt);x=a[0];z=a[1];y=gy(x,z);G.rotation.y=ang;if(v.ps>2.5){v.ph='roll';v.ps=0;}}
    if(v.ph==='roll'){v.sp=Math.min(v.vmax,v.sp+v.vmax*.25*dt);v.ps+=v.sp*dt;x=a[0]+ux*v.ps;z=a[1]+uz*v.ps;y=gy(x,z);G.rotation.y=ang;v.body.rotation.z=Math.min(.12,Math.max(0,(v.ps-RL*.45)/RL))*1.2;if(v.ps>RL*.6){v.ph='climb';v.ps=0;}}
    if(v.ph==='climb'||v.ph==='circuit'){/* an oval circuit: out along the runway, round, back down */if(v.ph==='climb'){v.ps+=v.sp*dt;x=a[0]+ux*(RL*.6+v.ps);z=a[1]+uz*(RL*.6+v.ps);y=gy(x,z)+Math.min(W.alt,v.ps*.25);v.body.rotation.z=.12;G.rotation.y=ang;if(y-gy(x,z)>=W.alt*.95){v.ph='circuit';v.ps=0;v.c0=[x,z];}}
      else{v.ps+=v.sp*dt/W.r;const k=v.ps;const cx=v.c0[0]-uz*W.r,cz=v.c0[1]+ux*W.r;/* turn left round a circle of radius r, half way = downwind */const a0=Math.atan2(v.c0[1]-cz,v.c0[0]-cx);const aa=a0+k;x=cx+Math.cos(aa)*W.r;z=cz+Math.sin(aa)*W.r;y=gy(a[0],a[1])+W.alt;
        G.rotation.y=-Math.atan2(Math.cos(aa),-Math.sin(aa));v.body.rotation.x=-.25;v.body.rotation.z=0;if(k>Math.PI*2){v.ph='final';v.ps=0;v.f0=[x,z];v.y0=y;}}}
    if(v.ph==='final'){/* head back to the runway threshold and descend */const tx=a[0],tz=a[1],ddx=tx-v.f0[0],ddz=tz-v.f0[1],D=Math.hypot(ddx,ddz)||1;v.ps+=v.sp*dt;const u=Math.min(1,v.ps/D);x=v.f0[0]+ddx*u;z=v.f0[1]+ddz*u;y=v.y0+(gy(tx,tz)-v.y0)*u;
      const ta=-Math.atan2(ddz,ddx);G.rotation.y+=(((ta-G.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*2);v.body.rotation.x*=.95;v.body.rotation.z=-.06;if(u>=1){v.ph='rollout';v.ps=0;}}
    if(v.ph==='rollout'){v.sp=Math.max(v.vmax*.12,v.sp-v.vmax*.3*dt);v.ps+=v.sp*dt;x=a[0]+ux*v.ps;z=a[1]+uz*v.ps;y=gy(x,z);G.rotation.y=ang;v.body.rotation.z=0;if(v.ps>RL*.7){v.ph='back';v.ps=0;}}
    if(v.ph==='back'){v.sp=v.vmax*.12;v.ps+=v.sp*dt;const s=RL*.7-v.ps;x=a[0]+ux*s;z=a[1]+uz*s;y=gy(x,z);G.rotation.y=ang+Math.PI;if(s<=0){v.ph='taxi';v.ps=0;G.rotation.y=ang;}}
    G.position.set(x,y,z);v.dist+=v.sp*dt;if(v.prop)v.prop.rotation.x+=dt*(v.ph==='taxi'||v.ph==='back'?12:40);}
  function update(t,dt){dt=Math.min(dt||.016,.1);const on=LAYERS.lights;
    LM.head.emissiveIntensity=on?night*1.6:0;glowM.opacity=on?Math.max(0,night-.15)*1.1:0;glowR.opacity=on?Math.max(0,night-.15)*.8:0;LM.cabin.emissiveIntensity=on?night*1.1:0;LM.tail.emissiveIntensity=on?.15+night*.9:.1;beamM.opacity=on?night*.7:0;
    const blinkOn=(t*2.4%1)<.5;
    for(const v of all){
      if(v.mode==='drive')stepDrive(v,dt);else if(v.mode==='rail'||v.mode==='sail')stepPath(v,dt,t);else if(v.mode==='fly')stepFly(v,dt,t);
      else if(v.cat==='water'){v.g.position.y=WL+Math.sin(t*1.3+v.L)*.04;v.body.rotation.z=Math.sin(t*.9+v.L)*.02;}
      /* wheels spin by distance, front wheels steer */
      if(v.wheels.length){const r=v.cat==='bike'?.27:.25;const a=(v.dist||0)/r;v.wheels.forEach(w=>{w.rotation.z=-a;});v.front.forEach(w=>{w.rotation.y=Math.max(-.5,Math.min(.5,(v.steer||0)*.4));});}
      if(v.cat==='road'&&v.body){v.body.position.y=Math.sin(t*9+v.L*3)*.008*Math.min(1,v.sp/3);v.body.rotation.z=v.brake?-.02:0;}
      /* brake lights and indicators (per car: own small material swap avoided by scaling the emissive of shared mats is not possible, so tint) */
      if(v.lamps){const br=v.brake||v.sp<.05&&v.mode==='drive';v.lamps.tail.forEach(l=>{l.scale.setScalar(br?1.25:1);});
        const bl=v.blink||0;v.lamps.indL.forEach(l=>l.visible=!(bl===-1)||blinkOn);v.lamps.indR.forEach(l=>l.visible=!(bl===1)||blinkOn);
        if(bl){(bl===-1?v.lamps.indL:v.lamps.indR).forEach(l=>{l.material=blinkOn?IND_ON:LM.ind;l.visible=true;});}else{v.lamps.indL.concat(v.lamps.indR).forEach(l=>{if(l.material!==LM.ind)l.material=LM.ind;});}}
      if(v.beamAt&&!v.beam&&night>.05){const bm=new THREE.Mesh(new THREE.PlaneGeometry(2.4,6),beamM);bm.rotation.x=-Math.PI/2;bm.rotation.z=Math.PI/2;bm.position.set(v.beamAt,.04,0);v.g.add(bm);v.beam=bm;}
      if(v.party)v.party.forEach((b,i)=>b.visible=night>.2||((t*3+i)|0)%2===0);}}
  const IND_ON=new THREE.MeshBasicMaterial({color:0xffb030});
  return{root,add,drive,rail,sail,fly,update,all,kinds:Object.keys(KINDS),KINDS,
    set night(v){night=v;},get night(){return night;},
    layers:Object.keys(LAYERS),setLayer(n,on){LAYERS[n]=!!on;all.forEach(applyLayers);},
    remove(v){const i=all.indexOf(v);if(i>=0)all.splice(i,1);(v.cars||[v.g]).forEach(G=>root.remove(G));}};}
g.VehicleEngine={create,KINDS,kinds:Object.keys(KINDS),ROAD};})(typeof window!=='undefined'?window:this);
