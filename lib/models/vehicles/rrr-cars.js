/* ==== PPL Roo Road cars: the six cars from Roo Road Rescue's garage (3d, low-poly) ====
   Kestrel V8 Ute, Brumby Trail 4x4, Corella Hybrid, Wren City Hatch, Swagman Camper Van, Outback Cruiser SUV.
   Fictional names, loosely inspired, no real models or logos. Approved by Paul for the Quokka Cafe car yard (Oct 2026).
   PPL.rrrCar(type) -> Group, ~4.6-6 long along z, front toward -z (scale .36 for Quokka Cafe units).
   userData: wheels[] (spin them), tail/head materials (brake + headlights), paint, W, rear. PPL.RRR_CARS lists names and colours. */
(function(){
const P = window.PPL;

function stdM(c,o){const m=new THREE.MeshStandardMaterial(Object.assign({flatShading:true,roughness:.9},o||{}));m.color=P.lin(c);if(o&&o.emissive)m.emissive=P.lin(o.emissive);return m}
function glowTex(inner,outer){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,inner);r.addColorStop(.22,inner);r.addColorStop(.3,outer);r.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
const CARS={
 kestrel:{name:'Kestrel V8 Ute',color:'#b8211c',hi:'#de4038',dark:'#6e130f',acc:1.18,slip:1,hit:.4},
 brumby:{name:'Brumby Trail 4x4',color:'#565d63',hi:'#737b82',dark:'#2a2f33',acc:.84,slip:1.9,hit:.46},
 corella:{name:'Corella Hybrid',color:'#e6e8ea',hi:'#ffffff',dark:'#9aa1a8',acc:1,slip:.72,hit:.36},
 wren:{name:'Wren City Hatch',color:'#1f9bb4',hi:'#45c0d6',dark:'#11697b',acc:1.18,slip:1.45,hit:.33},
 camper:{name:'Swagman Camper Van',color:'#f2f2ee',hi:'#ffffff',dark:'#1f8a8a',acc:.9,slip:1.1,hit:.4},
 suv:{name:'Outback Cruiser SUV',color:'#1f3f66',hi:'#2f5a8c',dark:'#0f2238',acc:.96,slip:1.65,hit:.45}
};
const PLATES={kestrel:{t:'ROO·168',s:'NSW',bg:'#ffd400',fg:'#111111'},brumby:{t:'BRM·4X4',s:'QUEENSLAND',bg:'#ffffff',fg:'#7a1430'},corella:{t:'CRL·001',s:'VICTORIA',bg:'#ffffff',fg:'#0b2a6f'},wren:{t:'WRN·007',s:'WESTERN AUSTRALIA',bg:'#ffffff',fg:'#1d4f9c'},camper:{t:'CMP·042',s:'NT · OUTBACK AUSTRALIA',bg:'#ffffff',fg:'#b5651d'},suv:{t:'SUV·888',s:'SOUTH AUSTRALIA',bg:'#ffffff',fg:'#111111'}};
function makeCar3(type){const c=CARS[type],g=new THREE.Group();
 const paint=stdM(c.color,{metalness:.18,roughness:.55,flatShading:false}),dark=stdM('#18191c',{roughness:.85}),trim=stdM('#2a2c30',{roughness:.7}),
  glass=stdM('#3d5b73',{metalness:.55,roughness:.08,flatShading:false,emissive:'#14283a',emissiveIntensity:.35}),chrome=stdM('#c9ccd1',{metalness:.75,roughness:.28,flatShading:false}),
  white=stdM('#f4f6f7',{roughness:.45}),amber=new THREE.MeshStandardMaterial({color:'#ff9a20',emissive:'#ff8a10',emissiveIntensity:.35}),
  rubber=stdM('#141416',{roughness:.95,flatShading:false}),stripe=stdM('#121316',{roughness:.6});
 const tail=new THREE.MeshStandardMaterial({color:'#b5120a',emissive:'#e01a0e',emissiveIntensity:.8,roughness:.3});
 const head=new THREE.MeshStandardMaterial({color:'#fff6d8',emissive:'#fff2c0',emissiveIntensity:.3,roughness:.2});
 const add=(m,cast)=>{if(cast!==false)m.castShadow=true;g.add(m);return m};
 const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);return add(b)};
 const cyl=(r,len,m,x,y,z,ax,seg)=>{const geo=new THREE.CylinderGeometry(r,r,len,seg||12);if(ax==='x')geo.rotateZ(Math.PI/2);else if(ax==='z')geo.rotateX(Math.PI/2);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);return add(o)};
 /* side profile (u = length, front is -u) extruded across the width, with rounded edges and real wheel arches */
 const prof=(top,W,m,bev,wheels,r,wrr,bottom)=>{const s=new THREE.Shape();top.forEach((p,k)=>k?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
  if(wheels)[...wheels].sort((a,b)=>b-a).forEach(cz=>{s.lineTo(cz+r,bottom);s.lineTo(cz+r,wrr);s.absarc(cz,wrr,r,0,Math.PI,false);s.lineTo(cz-r,bottom)});
  const geo=new THREE.ExtrudeGeometry(s,{depth:W-2*bev,bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.8,bevelSegments:3,curveSegments:14});
  geo.translate(0,0,-(W-2*bev)/2);geo.rotateY(-Math.PI/2);geo.computeVertexNormals();return add(new THREE.Mesh(geo,m))};
 /* thin panel laid between two profile points (windscreen, rear glass, stripes) */
 const slab=(a,b,w,m,th,lift)=>{const du=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(du,dy),o=new THREE.Mesh(new THREE.BoxGeometry(w,th||.03,L),m);
  o.position.set(0,(a[1]+b[1])/2+(lift||0),(a[0]+b[0])/2);o.rotation.x=-Math.atan2(dy,du);const sgn=du>=0?1:-1;if(m===glass)o.translateY(sgn*.055);add(o,false);
  if(m===glass){/* windscreen / rear window: black rubber frame + light glint so it reads as glass */
   const fr=new THREE.Mesh(new THREE.BoxGeometry(w+.08,(th||.03)*.7,L+.08),trim);fr.position.copy(o.position);fr.rotation.copy(o.rotation);fr.translateY(-sgn*.012);add(fr,false);
   [[-.26,.1,.8],[-.12,.05,.6]].forEach(([fx,fw,fl])=>{const gl=new THREE.Mesh(new THREE.BoxGeometry(w*fw,.004,L*fl),glint);gl.position.copy(o.position);gl.rotation.copy(o.rotation);gl.translateY(sgn*((th||.03)/2+.003));gl.translateX(w*fx);gl.rotateY(.35);add(gl,false)})}
  return o};
 const glint=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.32,depthWrite:false});
 /* flat side window, both sides */
 const sideWin=(pts,x)=>{const s=new THREE.Shape();pts.forEach((p,k)=>k?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
  [-1,1].forEach(sd=>{const geo=new THREE.ShapeGeometry(s);geo.rotateY(-Math.PI/2);const o=new THREE.Mesh(geo,glass);o.material.side=THREE.DoubleSide;o.position.x=sd*x;add(o,false)})};
 const arch=(cz,wrr,ri,ro,x,m,th)=>{const s=new THREE.Shape();s.absarc(0,0,ro,0,Math.PI,false);s.lineTo(-ri,0);s.absarc(0,0,ri,Math.PI,0,true);s.lineTo(ro,0);
  [-1,1].forEach(sd=>{const geo=new THREE.ExtrudeGeometry(s,{depth:th,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1,curveSegments:12});geo.rotateY(-Math.PI/2);
   const o=new THREE.Mesh(geo,m);o.position.set(sd*x+(sd>0?th:0),wrr,cz);add(o)})};
 const pair=(f)=>[-1,1].forEach(f);
 let wr,wz,W,rear,rimStyle;
 if(type==='kestrel'){ /* V8 coupe ute: long bonnet, low cab, tonneau and chrome sports bar */
  wr=.4;wz=[-1.45,1.5];W=1.84;rear=2.38;rimStyle='alloy';
  prof([[-2.35,.32],[-2.41,.5],[-2.37,.7],[-2.22,.8],[-1.2,.9],[-.9,.93],[.62,.97],[2.3,.99],[2.38,.93],[2.38,.32]],W,paint,.06,wz,.5,wr,.32);
  prof([[-.92,.92],[-.34,1.4],[.42,1.43],[.6,.96]],1.62,paint,.05);
  slab([-.9,.95],[-.37,1.37],1.46,glass,.05);slab([.59,1.0],[.45,1.37],1.4,glass,.05);
  sideWin([[-.78,1.0],[-.34,1.35],[.38,1.37],[.5,1.0]],.872);
  slab([-2.2,.81],[-.95,.93],.34,stripe,.02,.012);slab([-.3,1.43],[.4,1.45],.34,stripe,.02,.02);
  box(1.66,.025,1.55,trim,0,1.0,1.48);
  pair(s=>{cyl(.03,.36,chrome,s*.7,1.15,.72);});cyl(.03,1.44,chrome,0,1.33,.72,'x');pair(s=>{const t=cyl(.025,.42,chrome,s*.7,1.2,.9);t.rotation.x=-.9});
  box(.5,.06,.5,paint,0,.94,-1.55);box(.34,.05,.04,dark,0,.95,-1.79);
  pair(s=>cyl(.045,.22,chrome,s*.38,.36,2.42,'z'));
  box(1.9,.12,.12,chrome,0,.4,2.42);box(1.95,.18,.16,trim,0,.38,-2.4);
  box(1.08,.16,.06,dark,0,.58,-2.41);[.53,.6].forEach(y=>box(1.0,.018,.02,chrome,0,y,-2.44));
  pair(s=>{box(.4,.11,.05,head,s*.66,.69,-2.37);box(.12,.05,.05,amber,s*.86,.6,-2.36);box(.24,.24,.05,tail,s*.78,.79,2.4);box(.28,.04,.04,chrome,s*.78,.93,2.4)});
  pair(s=>{box(.04,.5,.02,trim,s*.925,.68,-.82);box(.12,.03,.03,chrome,s*.93,.88,.18)});
 }else if(type==='brumby'){ /* off-road dual cab: roo bar, snorkel, flares, roof rack, spotlights */
  wr=.47;wz=[-1.6,1.65];W=1.9;rear=2.58;rimStyle='steel';
  prof([[-2.55,.48],[-2.6,.7],[-2.58,1.0],[-2.46,1.14],[-1.22,1.22],[2.5,1.26],[2.56,1.2],[2.56,.48]],W,paint,.05,wz,.6,wr,.48);
  prof([[-1.22,1.21],[-.82,1.86],[1.0,1.89],[1.08,1.24]],1.8,paint,.04);
  slab([-1.18,1.26],[-.84,1.82],1.62,glass,.05);slab([1.07,1.3],[1.0,1.84],1.56,glass,.05);
  sideWin([[-1.03,1.3],[-.76,1.78],[.06,1.79],[.06,1.3]],.906);sideWin([[.17,1.3],[.17,1.8],[.94,1.81],[.98,1.3]],.906);
  box(1.74,.03,1.3,trim,0,1.27,1.82);
  pair(s=>box(.05,.42,.05,dark,s*.82,1.48,1.2));box(1.7,.05,.05,dark,0,1.7,1.2);
  pair(s=>box(.05,.05,1.8,dark,s*.78,1.95,.08));[-.65,0,.65].forEach(z=>box(1.6,.04,.05,dark,0,1.95,z+.1));
  box(.42,.34,.2,stdM('#c7372a'),-.5,2.12,.7);box(.08,.06,.06,dark,-.5,2.31,.7);
  cyl(.16,1.0,stdM('#4f6b3a'),.3,2.12,.15,'x');
  [-.3,0,.3].forEach(x=>box(.14,.07,.07,amber,x,1.95,-.72));
  pair(s=>box(.05,.68,.05,dark,s*.52,.82,-2.72));box(1.96,.06,.06,dark,0,.8,-2.74);box(1.96,.06,.06,dark,0,1.02,-2.74);
  {const bow=new THREE.Mesh(new THREE.TorusGeometry(.52,.035,6,16,Math.PI),dark);bow.position.set(0,1.0,-2.74);add(bow)}
  pair(s=>{const sp=cyl(.12,.1,chrome,s*.48,1.33,-2.76,'z',14);const lens=cyl(.1,.02,head,s*.48,1.33,-2.82,'z',14)});
  cyl(.012,1.1,dark,.86,1.6,-2.72);
  cyl(.06,1.0,dark,-.99,1.42,-1.08);box(.14,.12,.24,dark,-.99,1.95,-1.12);
  arch(wz[0],wr,.6,.7,.95,dark,.1);arch(wz[1],wr,.6,.7,.95,dark,.1);
  pair(s=>box(.16,.05,1.85,dark,s*.97,.55,.05));
  pair(s=>box(.3,.32,.03,rubber,s*.75,.38,wz[1]+.66));
  box(1.95,.2,.2,trim,0,.5,2.6);box(.12,.1,.24,dark,0,.44,2.74);
  box(1.3,.3,.06,dark,0,.85,-2.6);[.78,.86,.94].forEach(y=>box(1.2,.025,.02,chrome,0,y,-2.64));
  pair(s=>{box(.32,.2,.05,head,s*.74,.92,-2.6);box(.1,.06,.05,amber,s*.88,.78,-2.6);box(.2,.36,.05,tail,s*.84,.98,2.57)});
  pair(s=>{box(.04,.62,.02,trim,s*.955,.92,.12);box(.12,.03,.03,dark,s*.96,1.12,-.5);box(.12,.03,.03,dark,s*.96,1.12,.6)});
 }else if(type==='wren'){ /* city hatch: tall glasshouse, white roof, roof spoiler, round lamps */
  wr=.36;wz=[-1.25,1.25];W=1.72;rear=1.98;rimStyle='sport';
  prof([[-1.95,.3],[-1.99,.5],[-1.93,.72],[-1.7,.84],[-1.1,.92],[1.75,1.02],[1.92,.95],[1.97,.6],[1.95,.3]],W,paint,.07,wz,.44,wr,.3);
  prof([[-1.1,.91],[-.42,1.5],[1.5,1.52],[1.82,1.02]],1.58,paint,.05);
  slab([-1.06,.95],[-.45,1.46],1.4,glass,.05);slab([1.8,1.06],[1.52,1.47],1.3,glass,.05);
  sideWin([[-.92,.98],[-.42,1.44],[.35,1.45],[.35,.98]],.835);sideWin([[.45,.98],[.45,1.45],[1.45,1.46],[1.7,1.03]],.835);
  box(1.54,.06,1.92,white,0,1.555,.53);slab([1.4,1.58],[1.72,1.54],1.36,white,.05,.01);
  pair(s=>{cyl(.13,.06,head,s*.6,.76,-1.93,'z',16);cyl(.15,.04,chrome,s*.6,.76,-1.9,'z',16);box(.08,.05,.05,amber,s*.82,.62,-1.93);box(.3,.16,.05,tail,s*.66,.95,1.95)});
  box(.9,.14,.05,dark,0,.56,-1.98);box(1.8,.16,.16,trim,0,.36,-1.95);box(1.8,.16,.16,trim,0,.36,1.97);
  cyl(.04,.2,chrome,.5,.32,2.02,'z');box(.03,.03,.38,dark,0,1.3,1.86);
  pair(s=>{box(.04,.48,.02,trim,s*.86,.68,.4);box(.1,.03,.03,chrome,s*.865,.9,.0)});
 }else if(type==='camper'){ /* pop-top camper van: tall box, teal stripe, awning, ladder, bikes */
  wr=.4;wz=[-1.75,1.65];W=1.94;rear=2.62;rimStyle='steel';
  prof([[-2.6,.32],[-2.66,.6],[-2.58,.92],[-2.3,1.15],[-1.8,1.98],[-1.62,2.08],[2.55,2.12],[2.62,2.02],[2.62,.32]],W,paint,.07,wz,.5,wr,.32);
  box(1.84,.16,3.6,stdM('#e3e7ea'),0,2.2,.55);
  slab([-2.28,1.2],[-1.82,1.95],1.7,glass,.05);
  sideWin([[-1.85,1.2],[-1.62,1.9],[-.95,1.92],[-.95,1.2]],W/2+.004);sideWin([[-.75,1.25],[-.75,1.85],[.9,1.86],[.9,1.25]],W/2+.004);sideWin([[1.1,1.25],[1.1,1.86],[2.3,1.88],[2.3,1.25]],W/2+.004);
  pair(s=>{box(.02,.2,5.1,stdM(c.dark),s*(W/2+.005),1.02,0);box(.02,.05,5.1,stdM('#f4b81c'),s*(W/2+.006),.89,0)});
  cyl(.09,3.2,stdM('#6b7178'),-(W/2+.06),2.02,.4,'z');
  box(1.38,.42,.03,trim,0,1.62,rear+.075);box(1.3,.34,.03,glass,0,1.62,rear+.09);{const gl=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.005),glint);gl.position.set(-.35,1.63,rear+.11);gl.rotation.z=.4;add(gl,false)}
  pair(s=>box(.04,1.4,.04,stdM('#8a9097'),.5+s*.18,1.3,rear+.06));[.85,1.1,1.35,1.6,1.85].forEach(y=>box(.36,.03,.03,stdM('#8a9097'),.5,y,rear+.06));
  pair(s=>{box(.18,.42,.05,tail,s*.82,1.05,rear+.01);box(.34,.13,.05,head,s*.66,.78,-2.64);box(.1,.05,.05,amber,s*.86,.64,-2.64)});
  box(1.0,.2,.05,dark,0,.62,-2.66);box(1.98,.18,.2,trim,0,.38,-2.62);box(1.98,.18,.2,trim,0,.38,rear);
  {const bk=stdM('#2a2c30');[-.35,.35].forEach(x=>{const r1=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,6,16),bk);r1.rotation.y=Math.PI/2;r1.position.set(x,2.65,-.8);add(r1);const r2=r1.clone();r2.position.z=.4;add(r2);box(.03,.03,1.2,stdM('#d8312a'),x,2.75,-.2)});}
 }else if(type==='suv'){ /* full-size 4WD wagon: upright body, roof rails, chrome, side steps */
  wr=.45;wz=[-1.55,1.55];W=1.98;rear=2.5;rimStyle='alloy';
  prof([[-2.48,.45],[-2.54,.7],[-2.5,1.04],[-2.34,1.17],[-1.2,1.27],[-.95,1.29],[2.4,1.35],[2.5,1.29],[2.52,.45]],W,paint,.06,wz,.57,wr,.45);
  prof([[-.98,1.27],[-.52,1.95],[2.22,1.98],[2.46,1.34]],1.86,paint,.05);
  slab([-.95,1.31],[-.55,1.9],1.66,glass,.05);slab([2.44,1.38],[2.22,1.92],1.6,glass,.05);
  sideWin([[-.8,1.33],[-.48,1.86],[.3,1.87],[.3,1.33]],.935);sideWin([[.42,1.33],[.42,1.87],[1.3,1.88],[1.3,1.33]],.935);sideWin([[1.42,1.34],[1.42,1.88],[2.15,1.9],[2.32,1.36]],.935);
  pair(s=>box(.05,.06,2.6,dark,s*.8,2.03,.65));[0,1.2].forEach(z=>box(1.6,.04,.05,dark,0,2.05,z));
  box(1.3,.36,.06,chrome,0,.95,-2.55);[.85,.95,1.05].forEach(y=>box(1.2,.03,.02,dark,0,y,-2.59));
  pair(s=>{box(.36,.16,.05,head,s*.78,1.0,-2.52);box(.1,.06,.05,amber,s*.9,.82,-2.52);box(.3,.24,.05,tail,s*.78,1.18,2.52)});
  box(1.4,.04,.04,chrome,0,.98,2.54);
  pair(s=>box(.16,.05,2.4,trim,s*1.03,.5,0));
  box(2.0,.2,.2,trim,0,.48,-2.5);box(2.0,.2,.2,trim,0,.48,2.5);box(.1,.08,.26,dark,0,.42,2.66);
  arch(wz[0],wr,.57,.66,.95,dark,.08);arch(wz[1],wr,.57,.66,.95,dark,.08);
 }else{ /* corella hybrid sedan: smooth fastback, light bar, aero wheels */
  wr=.39;wz=[-1.45,1.5];W=1.82;rear=2.4;rimStyle='aero';
  prof([[-2.37,.3],[-2.43,.48],[-2.39,.64],[-2.2,.74],[-1.0,.86],[-.92,.87],[1.45,.95],[2.25,.96],[2.38,.86],[2.41,.55],[2.37,.3]],W,paint,.07,wz,.47,wr,.3);
  prof([[-.94,.86],[-.2,1.38],[.6,1.39],[1.48,.95]],1.62,paint,.05);
  slab([-.9,.9],[-.24,1.35],1.46,glass,.05);slab([1.44,.98],[.64,1.36],1.42,glass,.05);
  sideWin([[-.76,.93],[-.2,1.33],[.22,1.34],[.22,.93]],.866);sideWin([[.32,.93],[.32,1.34],[.6,1.35],[1.28,.96]],.866);
  box(1.4,.03,.12,paint,0,.99,2.27);box(1.7,.06,.04,tail,0,.82,2.42);pair(s=>box(.26,.13,.05,tail,s*.76,.82,2.41));
  box(.9,.12,.05,dark,0,.5,-2.42);pair(s=>{box(.5,.08,.05,head,s*.64,.66,-2.36);box(.1,.04,.05,amber,s*.87,.58,-2.35)});
  box(1.9,.15,.16,trim,0,.34,-2.36);box(1.9,.15,.16,trim,0,.34,2.38);box(.36,.04,.02,stdM('#1f6fb4',{emissive:'#1f6fb4',emissiveIntensity:.3}),.5,.95,2.415);
  pair(s=>{box(.04,.46,.02,trim,s*.915,.66,.27);box(.12,.03,.03,chrome,s*.92,.84,-.1);box(.12,.03,.03,chrome,s*.92,.84,.6)});
 }
 /* mirrors */
 const mz=type==='camper'?-1.7:type==='suv'?-.82:type==='brumby'?-.98:type==='wren'?-.9:type==='kestrel'?-.74:-.78,my=type==='camper'?1.4:type==='suv'?1.38:type==='brumby'?1.36:type==='wren'?1.05:1.0;
 pair(s=>{box(.2,.12,.08,trim,s*(W/2+.13),my,mz);box(.03,.1,.06,glass,s*(W/2+.24),my,mz+.02)});
 /* number plates front and back */
 const plateTex=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=72;const x=cv.getContext('2d');const PL=PLATES[type]||PLATES.kestrel;x.fillStyle=PL.bg;x.fillRect(0,0,256,72);x.strokeStyle=PL.fg;x.lineWidth=4;x.strokeRect(3,3,250,66);x.fillStyle=PL.fg;x.font='bold 13px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(PL.s,128,14);x.font='bold 40px system-ui,sans-serif';x.fillText(PL.t,128,44);return new THREE.CanvasTexture(cv)})();
 const pm=new THREE.MeshStandardMaterial({map:plateTex,roughness:.5}),py=type==='camper'?.62:type==='suv'?.7:type==='brumby'?.62:type==='wren'?.62:.55;g.userData.pm=pm;g.userData.ptex=plateTex;
 const pr=new THREE.Mesh(new THREE.BoxGeometry(.52,.15,.03),pm);pr.position.set(0,py,rear+.06);add(pr,false);
 const pf=new THREE.Mesh(new THREE.BoxGeometry(.52,.15,.03),pm);pf.position.set(0,type==='brumby'||type==='suv'?.62:.42,-rear-.06);add(pf,false);
 /* wheels: tyre, rim with spokes, hub */
 const rimM=rimStyle==='steel'?stdM('#2b2e33',{metalness:.4,roughness:.5}):rimStyle==='sport'?stdM('#f2f4f5',{metalness:.3,roughness:.35}):chrome;
 const wx=W/2-.08,wheels=[];
 [[-1,wz[0]],[1,wz[0]],[-1,wz[1]],[1,wz[1]]].forEach(([sd,z])=>{const w=new THREE.Group();
  const tg=new THREE.CylinderGeometry(wr,wr,.3,24);tg.rotateZ(Math.PI/2);const t=new THREE.Mesh(tg,rubber);t.castShadow=true;w.add(t);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(wr*.93,wr*.07,6,24),rubber);lip.rotation.y=Math.PI/2;lip.position.x=sd*.15;w.add(lip);
  const rg=new THREE.CylinderGeometry(wr*.66,wr*.66,.31,20);rg.rotateZ(Math.PI/2);w.add(new THREE.Mesh(rg,rimStyle==='aero'?stdM('#d9dde2',{metalness:.5,roughness:.3}):dark));
  const face=sd*.158;
  if(rimStyle==='aero'){const d=new THREE.Mesh(new THREE.CylinderGeometry(wr*.64,wr*.64,.01,20).rotateZ(Math.PI/2),rimM);d.position.x=face;w.add(d);
   for(let k=0;k<10;k++){const sl=new THREE.Mesh(new THREE.BoxGeometry(.012,wr*.32,.03),dark);const a=k/10*Math.PI*2;sl.position.set(face+sd*.004,Math.cos(a)*wr*.42,Math.sin(a)*wr*.42);sl.rotation.x=-a;w.add(sl)}}
  else{const n=rimStyle==='steel'?8:rimStyle==='sport'?6:5;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,sp=new THREE.Mesh(new THREE.BoxGeometry(.03,wr*.56,rimStyle==='steel'?.05:.08),rimM);
    sp.position.set(face,Math.cos(a)*wr*.32,Math.sin(a)*wr*.32);sp.rotation.x=-a;w.add(sp)}
   const ring=new THREE.Mesh(new THREE.TorusGeometry(wr*.62,wr*.05,6,24),rimM);ring.rotation.y=Math.PI/2;ring.position.x=face;w.add(ring)}
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(wr*.16,wr*.16,.04,12).rotateZ(Math.PI/2),rimM);hub.position.x=face+sd*.01;w.add(hub);
  w.position.set(sd*wx,wr,z);g.add(w);wheels.push(w)});
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(W+.8,rear*2.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:glowTex('rgba(0,0,0,.55)','rgba(0,0,0,.35)'),transparent:true,depthWrite:false}));sh.position.y=.04;g.add(sh);
 const spot={intensity:0};
 g.userData=Object.assign(g.userData,{tail,head,wheels,spot,wr,paint,type,W,rear,wz,base:paint.color.getHex()});return g}



P.RRR_CARS = CARS;
P.rrrCar = t => makeCar3(CARS[t] ? t : 'kestrel');
P.reg('rrr-cars', { group: 'models/vehicles', from: 'rooroadrescue:035 makeCar3' });
})();
