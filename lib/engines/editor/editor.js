/* Map Editor (Paul Perth Library, Nov 2026): one page that edits a map with all eight engines.
   The map is one JSON document (PPLMAP1). Ground heights are a grid; everything else is a list the engines rebuild from.
   Left mouse = use the tool, right mouse = turn the camera, wheel = zoom, middle = pan. On a phone: one finger = tool, two = camera. */
(()=>{
const $=id=>document.getElementById(id);
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.outputEncoding=THREE.sRGBEncoding;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;$('view').appendChild(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fd3ea);const cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.3,900);cam.position.set(-30,48,62);
const ctl=new THREE.OrbitControls(cam,R.domElement);ctl.target.set(0,0,0);ctl.maxPolarAngle=1.45;ctl.enableDamping=true;
const hemi=new THREE.HemisphereLight(0xbfe4ff,0x8a7a58,.5),sun=new THREE.DirectionalLight(0xfff2dc,1.05);sun.position.set(-30,45,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.far=250;scene.add(hemi,sun,sun.target);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});

/* ---------- the map document ---------- */
const S=120,N=121;/* grid: one cell per unit from -60 to 60 */
const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};const vn=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),f=x-i,g=y-j,u=f*f*(3-2*f),v=g*g*(3-2*g);return(hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;};
const fbm=(x,y)=>{let s=0,a=.5;for(let o=0;o<4;o++){s+=vn(x,y)*a;x*=2.03;y*=2.03;a*=.5;}return s;};
function islandGrid(){const g=new Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=i-60,z=j-60,a=Math.atan2(z,x),r=Math.hypot(x*.9,z*1.1),R0=36+fbm(Math.cos(a)*2+5,Math.sin(a)*2+5)*16-6;
  const d=R0-r;let h=d<0?Math.max(-6,d*.2):Math.min(d*.22,1.2)+Math.max(0,d-6)*.05+(fbm(x*.06,z*.06)-.45)*1.6*Math.min(1,d/10);g[j*N+i]=+h.toFixed(2);}return g;}
const KINDS_LIFE=['walker','jogger','cyclist','quokka','kangaroo','gull','butterfly','pelican','dolphin','boat','kayak','picnic','sandcastle','dogfetch','flock','fishjump','sitter','swimmer','sunbather','fisher'];
function starter(){return{v:1,name:'New island',sea:0,h:islandGrid(),
  paths:[{pts:[[-22,6],[-10,2],[0,4],[12,0],[24,-4]],w:1.2,kind:'path'},{pts:[[0,4],[2,16],[-4,26]],w:1,kind:'path'},{pts:[[-18,-14],[-4,-12],[10,-16],[22,-14]],w:1.3,kind:'lane'}],
  roads:[{pts:[[-26,-4],[-12,-6],[4,-5],[20,-8]],type:'street'}],
  props:[{k:'bench',x:-6,z:4.5,r:0},{k:'lamp',x:4,z:6,r:0},{k:'bin',x:-2,z:5.6,r:0},{k:'picnic',x:8,z:6,r:.4},{k:'umbrella',x:8,z:6,r:0}],
  bld:[{s:'cafe',x:-8,z:-12,r:0,sign:'QUOKKA CAFE'},{s:'cottage',x:6,z:-12,r:0},{s:'shop',x:14,z:-1,r:Math.PI,sign:'ISLAND STORE'}],
  trees:[{k:'gum',x:-16,z:14},{k:'pine',x:14,z:14},{k:'pine',x:17,z:12},{k:'pepper',x:-20,z:-2},{k:'palm',x:2,z:22}],
  fol:{tuft:1.4,flower:.3,bush:.03,tree:.004},cars:4,
  life:{walker:6,jogger:2,cyclist:3,quokka:8,gull:6,butterfly:6,pelican:1,dolphin:3,boat:2,kayak:2,picnic:2,sandcastle:2,dogfetch:1,flock:1,fishjump:4,sitter:2,swimmer:3,sunbather:3,fisher:2},
  sky:{hour:10,wx:'sunny'},layers:{}};}
let doc;try{doc=JSON.parse(localStorage.getItem('ppl-mapedit')||'null');}catch(e){}if(!doc||!doc.h||doc.h.length!==N*N)doc=starter();
const Hfn=(x,z)=>{const fx=x+60,fz=z+60;if(fx<0||fz<0||fx>=S||fz>=S)return -6;const i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,g=doc.h,a=g[j*N+i],b=g[j*N+i+1],c=g[(j+1)*N+i],d=g[(j+1)*N+i+1];return(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;};
const segD=(x,z,a,b)=>{const vx=b[0]-a[0],vz=b[1]-a[1],L=vx*vx+vz*vz||1e-6;let t=((x-a[0])*vx+(z-a[1])*vz)/L;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);};
const lineD=(x,z,pts)=>{let m=1e9;for(let i=1;i<pts.length;i++)m=Math.min(m,segD(x,z,pts[i-1],pts[i]));return m;};
const RW={street:3.3,arterial:5,highway:4.6,lane:1.6,bridge:4.6};
const inBld=(x,z,m)=>doc.bld.some(b=>{const c=Math.cos(b.r||0),s=Math.sin(b.r||0),dx=x-b.x,dz=z-b.z,lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<4+m&&Math.abs(lz)<4.5+m;});
const kindAt=(x,z)=>{const h=Hfn(x,z);if(h<doc.sea)return'water';if(doc.paths.some(p=>lineD(x,z,p.pts)<p.w/2+.3))return'path';if(doc.roads.some(r=>lineD(x,z,r.pts)<RW[r.type]))return'path';if(inBld(x,z,0))return'none';if(h<doc.sea+.9)return'sand';return'grass';};
const keepOut=(x,z)=>inBld(x,z,.5)||doc.roads.some(r=>lineD(x,z,r.pts)<RW[r.type]+.6)||doc.props.some(p=>Math.hypot(p.x-x,p.z-z)<1.2);

/* ---------- engines, each in its own group so it can be rebuilt alone ---------- */
const G={};['terr','water','fol','wl','props','road','bld','life'].forEach(k=>{G[k]=new THREE.Group();G[k].name=k;scene.add(G[k]);});
const clear=g=>{while(g.children.length){const c=g.children.pop();c.traverse&&c.traverse(o=>{if(o.geometry)o.geometry.dispose();});}};
const E={};const Sky=SkyEngine.create({scene,renderer:R,sun,hemi,target:ctl.target});E.sky=Sky;
const BOUNDS=[-60,-60,60,60];
const mk={
  terr(){clear(G.terr);E.terr=TerrainEngine.create({size:[S,S],center:[0,0],res:.5,heightAt:Hfn,seaLevel:doc.sea,paths:doc.paths.map(p=>({pts:p.pts,w:p.w,kind:p.kind}))});G.terr.add(E.terr.mesh);},
  water(){if(E.water&&E.water.dispose)E.water.dispose();clear(G.water);E.water=WaterSea.create({renderer:R,scene,camera:cam,heightAt:Hfn,size:220,ground:null,level:doc.sea,parent:G.water});},
  fol(){clear(G.fol);E.fol=FoliageEngine.create({scene:G.fol,bounds:BOUNDS,heightAt:Hfn,kindAt,keepOut,density:doc.fol,radius:46});doc.trees.forEach(t=>E.fol.addTree(t.x,t.z,{kind:t.k,size:t.s||1}));},
  wl(){clear(G.wl);E.wl=WaterLife.create({scene:G.wl,heightAt:Hfn,level:doc.sea,bounds:BOUNDS});},
  props(){clear(G.props);E.props=PropsEngine.create({scene:G.props,heightAt:Hfn});doc.props.forEach(addProp);},
  road(){clear(G.road);E.road=RoadEngine.create({scene:G.road,heightAt:Hfn});doc.roads.forEach(r=>{if(r.pts.length<2)return;if(r.type==='bridge')E.road.bridge(r.pts,{type:'highway',height:4});else E.road.road(r.pts,{type:r.type});});E.road.build();if(doc.roads.length)E.road.cars(doc.cars||0);},
  bld(){clear(G.bld);E.bld=BuildingKit.create({scene:G.bld,heightAt:Hfn});doc.bld.forEach(addBld);},
  life(){clear(G.life);E.life=LifeEngine.create({scene:G.life,heightAt:Hfn,kindAt,paths:doc.paths.map(p=>p.pts),water:(x,z)=>Hfn(x,z)<doc.sea,bounds:[-55,-55,55,55]});
    KINDS_LIFE.forEach(k=>{const n=doc.life[k]|0;if(!n)return;if(!doc.paths.length&&(k==='walker'||k==='jogger'||k==='cyclist'))return;try{E.life.spawn(k,n);}catch(e){console.warn(k,e);}});}};
function addProp(p){const o={rot:p.r||0};if(p.k==='fence'){const c=Math.cos(p.r||0),s=Math.sin(p.r||0);o.lines=[[p.x-c*2,p.z+s*2],[p.x+c*2,p.z-s*2]];}if(p.k==='jetty'){const c=Math.cos(p.r||0),s=Math.sin(p.r||0);o.lines=[[p.x,p.z],[p.x+s*10,p.z+c*10]];}return E.props.add(p.k,p.x,p.z,o);}
function addBld(b){return E.bld.build({style:b.s,x:b.x,z:b.z,rot:b.r||0,sign:b.sign||undefined,wall:b.wall||undefined});}
const LAYER_ENG={terr:'Ground',fol:'Plants',sky:'Sky',wl:'Sea life',road:'Roads',bld:'Buildings'};
function applyLayers(k){const e=E[k],L=doc.layers[k];if(!e||!e.setLayer||!L)return;Object.keys(L).forEach(n=>e.setLayer(n,L[n]));}
const ORDER=['terr','water','fol','wl','props','road','bld','life'];
function rebuild(list){const t0=performance.now();(list||ORDER).forEach(k=>{try{mk[k]();applyLayers(k);}catch(e){console.error(k,e);status('Error in '+k+': '+e.message);}});status('Rebuilt '+(list||['all']).join(', ')+' in '+Math.round(performance.now()-t0)+' ms');}

/* ---------- undo / save ---------- */
const undo=[];const snap=()=>{undo.push(JSON.stringify(doc));if(undo.length>30)undo.shift();};
const save=()=>{try{localStorage.setItem('ppl-mapedit',JSON.stringify(doc));}catch(e){}};
const status=t=>{$('st').textContent=t;};

/* ---------- tools ---------- */
const TOOLS={ground:'พื้นดิน',path:'ทางเดิน',road:'ถนน',plant:'ต้นไม้',prop:'ของประดับ',bld:'อาคาร',erase:'ลบ',life:'สิ่งมีชีวิต',sky:'ฟ้า/ทะเล',layers:'Layers',file:'ไฟล์',cam:'กล้อง'};
const st={tool:'ground',gmode:'raise',rad:5,str:.6,pathKind:'path',pathW:1.2,roadType:'street',tree:'gum',treeSize:1,prop:'bench',rot:0,bstyle:'cottage',bsign:'',bwall:'',line:[]};
const tb=$('tabs');Object.keys(TOOLS).forEach(k=>{const b=document.createElement('button');b.textContent=TOOLS[k];b.dataset.k=k;b.onclick=()=>setTool(k);tb.appendChild(b);});
const opt=(arr,v,lab)=>arr.map(a=>`<option value="${a}"${a===v?' selected':''}>${lab?lab[a]||a:a}</option>`).join('');
function panel(){const p=$('opts'),t=st.tool;let h='';
  if(t==='ground')h=`<div class=row>${['raise','lower','flatten','smooth','beach','sea','noise'].map(m=>`<button class="mode${st.gmode===m?' on':''}" data-m="${m}">${{raise:'ยกขึ้น',lower:'กดลง',flatten:'ปรับเรียบ',smooth:'ลบเหลี่ยม',beach:'ทำหาดทราย',sea:'ขุดเป็นทะเล',noise:'ขรุขระ'}[m]}</button>`).join('')}</div>
    <label>ขนาดแปรง <input type=range id=o_rad min=1 max=16 step=.5 value=${st.rad}> <span>${st.rad}</span></label><label>แรง <input type=range id=o_str min=.1 max=1.5 step=.05 value=${st.str}></label><p class=hint>ลากบนพื้นเพื่อแก้ ปล่อยเมาส์แล้วทุก engine จะสร้างใหม่ตามพื้น</p>`;
  if(t==='path')h=`<label>แบบ <select id=o_pk>${opt(['path','lane','gravel'],st.pathKind,{path:'ทางเดิน',lane:'เลนจักรยาน',gravel:'ทางกรวด'})}</select></label><label>กว้าง <input type=range id=o_pw min=.6 max=3 step=.1 value=${st.pathW}></label>
    <div class=row><button id=o_fin>จบเส้น</button><button id=o_can>ยกเลิก</button></div><p class=hint>คลิกทีละจุดตามแนว แล้วกด "จบเส้น" (หรือ Enter / ดับเบิลคลิก)</p>`;
  if(t==='road')h=`<label>แบบ <select id=o_rt>${opt(['street','arterial','highway','lane','bridge'],st.roadType,{street:'ถนนในเมือง',arterial:'ถนนใหญ่',highway:'ทางหลวง',lane:'ถนนชนบท',bridge:'สะพานยกระดับ'})}</select></label>
    <label>รถวิ่ง <input type=range id=o_cars min=0 max=30 step=1 value=${doc.cars||0}> <span>${doc.cars||0}</span></label><div class=row><button id=o_fin>จบเส้น</button><button id=o_can>ยกเลิก</button></div><p class=hint>คลิกทีละจุด ทางแยกและทางม้าลายสร้างเอง</p>`;
  if(t==='plant')h=`<label>ต้นไม้ <select id=o_tr>${opt(['gum','pine','pepper','palm'],st.tree,{gum:'ยูคาลิปตัส',pine:'สน',pepper:'เปปเปอร์มินต์',palm:'ปาล์ม'})}</select></label><label>ขนาด <input type=range id=o_ts min=.5 max=2 step=.1 value=${st.treeSize}></label>
    <p class=hint>คลิกเพื่อปลูกทีละต้น</p><b>ความหนาแน่นทั้ง map</b>${['tuft','flower','bush','tree'].map(k=>`<label>${{tuft:'หญ้า',flower:'ดอกไม้',bush:'พุ่มไม้',tree:'ต้นไม้สุ่ม'}[k]} <input type=range class=o_den data-k=${k} min=0 max=${{tuft:3,flower:1,bush:.12,tree:.03}[k]} step=${{tuft:.1,flower:.05,bush:.005,tree:.001}[k]} value=${doc.fol[k]}></label>`).join('')}`;
  if(t==='prop')h=`<label>ของ <select id=o_pr>${opt(PropsEngine.kinds,st.prop)}</select></label><label>หมุน <input type=range id=o_rot min=0 max=6.28 step=.05 value=${st.rot}></label><p class=hint>คลิกเพื่อวาง กด R หมุน 45°</p>`;
  if(t==='bld')h=`<label>สไตล์ <select id=o_bs>${opt(BuildingKit.STYLES,st.bstyle)}</select></label><label>ป้าย <input id=o_sign value="${st.bsign}" placeholder="ชื่อร้าน (ไม่ใส่ก็ได้)"></label><label>สีผนัง <input type=color id=o_wall value="${st.bwall||'#f6f0e2'}"> <input type=checkbox id=o_wallon ${st.bwall?'checked':''}> ใช้สีนี้</label>
    <label>หมุน <input type=range id=o_rot min=0 max=6.28 step=.05 value=${st.rot}></label><p class=hint>คลิกเพื่อวาง หน้าอาคารหันตามมุมหมุน กด R หมุน 45°</p>`;
  if(t==='erase')h=`<p class=hint>คลิกที่ของ อาคาร ต้นไม้ ทางเดิน หรือถนนที่อยากลบ (ลบทั้งเส้น)</p>`;
  if(t==='life')h=`<div class=grid>${KINDS_LIFE.map(k=>`<label>${k} <input type=number class=o_life data-k=${k} min=0 max=40 value=${doc.life[k]|0}></label>`).join('')}</div><button id=o_lifego>ใช้จำนวนนี้</button>`;
  if(t==='sky')h=`<label>เวลา <input type=range id=o_hr min=5 max=21 step=.1 value=${doc.sky.hour}> <span>${(+doc.sky.hour).toFixed(1)}</span></label><label>อากาศ <select id=o_wx>${opt(['sunny','breezy','golden','clear-night'],doc.sky.wx)}</select></label>
    <label>ระดับทะเล <input type=range id=o_sea min=-1 max=1 step=.05 value=${doc.sea}> <span>${doc.sea}</span></label><label>ชื่อ map <input id=o_name value="${doc.name}"></label>`;
  if(t==='layers'){h='';Object.keys(LAYER_ENG).forEach(k=>{const e=E[k];if(!e||!e.layers)return;const L=doc.layers[k]||{};h+=`<b>${LAYER_ENG[k]}</b><div class=grid>${e.layers.map(n=>`<label><input type=checkbox class=o_ly data-e=${k} data-n=${n} ${(n in L?L[n]:n!=='aurora')?'checked':''}> ${n}</label>`).join('')}</div>`;});}
  if(t==='file')h=`<div class=row><button id=o_save>บันทึก (ในเครื่องนี้)</button><button id=o_exp>คัดลอก map</button></div><div class=row><button id=o_imp>วาง map</button><button id=o_new>เกาะใหม่</button></div>
    <textarea id=o_txt placeholder="PPLMAP1 {...}"></textarea><p class=hint>"คัดลอก map" ได้ข้อความ PPLMAP1 ส่งให้ Claude สร้างเป็น map ในเกมได้เลย</p>`;
  if(t==='cam')h=`<p class=hint>นิ้วเดียว/คลิกซ้ายหมุนกล้อง ใช้โหมดนี้บนมือถือเวลาอยากหมุนดู</p><div class=row><button id=o_top>มุมบน</button><button id=o_low>มุมต่ำ</button></div>`;
  p.innerHTML=h;bind();}
function bind(){const q=s=>document.querySelector(s),qa=s=>document.querySelectorAll(s),on=(s,ev,f)=>{const e=q(s);if(e)e[ev]=f;};
  qa('.mode').forEach(b=>b.onclick=()=>{st.gmode=b.dataset.m;panel();});
  on('#o_rad','oninput',e=>{st.rad=+e.target.value;e.target.nextElementSibling.textContent=st.rad;});on('#o_str','oninput',e=>st.str=+e.target.value);
  on('#o_pk','onchange',e=>st.pathKind=e.target.value);on('#o_pw','oninput',e=>st.pathW=+e.target.value);on('#o_rt','onchange',e=>st.roadType=e.target.value);
  on('#o_cars','onchange',e=>{snap();doc.cars=+e.target.value;e.target.nextElementSibling.textContent=doc.cars;rebuild(['road']);save();});
  on('#o_fin','onclick',finishLine);on('#o_can','onclick',()=>{st.line=[];drawLine();});
  on('#o_tr','onchange',e=>st.tree=e.target.value);on('#o_ts','oninput',e=>st.treeSize=+e.target.value);
  qa('.o_den').forEach(i=>i.onchange=()=>{snap();doc.fol[i.dataset.k]=+i.value;rebuild(['fol']);save();});
  on('#o_pr','onchange',e=>st.prop=e.target.value);on('#o_rot','oninput',e=>st.rot=+e.target.value);
  on('#o_bs','onchange',e=>st.bstyle=e.target.value);on('#o_sign','oninput',e=>st.bsign=e.target.value.toUpperCase().slice(0,18));
  on('#o_wall','oninput',e=>{if(q('#o_wallon').checked)st.bwall=e.target.value;});on('#o_wallon','onchange',e=>st.bwall=e.target.checked?q('#o_wall').value:'');
  on('#o_lifego','onclick',()=>{snap();qa('.o_life').forEach(i=>doc.life[i.dataset.k]=Math.max(0,+i.value|0));rebuild(['life']);save();});
  on('#o_hr','oninput',e=>{doc.sky.hour=+e.target.value;e.target.nextElementSibling.textContent=doc.sky.hour.toFixed(1);save();});
  on('#o_wx','onchange',e=>{doc.sky.wx=e.target.value;Sky.setWeather(doc.sky.wx);save();});
  on('#o_sea','onchange',e=>{snap();doc.sea=+e.target.value;e.target.nextElementSibling.textContent=doc.sea;rebuild();save();});
  on('#o_name','oninput',e=>{doc.name=e.target.value;save();});
  qa('.o_ly').forEach(i=>i.onchange=()=>{const k=i.dataset.e;doc.layers[k]=doc.layers[k]||{};doc.layers[k][i.dataset.n]=i.checked;applyLayers(k);save();});
  on('#o_save','onclick',()=>{save();status('บันทึกแล้ว');});
  on('#o_exp','onclick',()=>{const t='PPLMAP1 '+JSON.stringify(doc);q('#o_txt').value=t;q('#o_txt').select();const kb=Math.round(t.length/1024);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>status('คัดลอกแล้ว ('+kb+' KB)'),()=>status('เลือกข้อความแล้ว กด Ctrl+C เพื่อคัดลอก'));});
  on('#o_imp','onclick',()=>{try{const t=q('#o_txt').value.trim().replace(/^PPLMAP1\s*/,'');const d=JSON.parse(t);if(!d.h||d.h.length!==N*N)throw Error('heights missing');snap();doc=Object.assign(starter(),d);rebuild();save();panel();}catch(e){status('อ่าน map ไม่ได้: '+e.message);}});
  on('#o_new','onclick',()=>{if(!confirmNew())return;snap();doc=starter();rebuild();save();panel();});
  on('#o_top','onclick',()=>{cam.position.set(0,110,10);ctl.target.set(0,0,0);});on('#o_low','onclick',()=>{cam.position.set(-20,6,30);ctl.target.set(0,1,0);});}
let newArm=0;function confirmNew(){if(Date.now()-newArm<3000)return true;newArm=Date.now();status('กด "เกาะใหม่" อีกครั้งภายใน 3 วินาทีเพื่อยืนยัน');return false;}
function setTool(k){st.tool=k;st.line=[];drawLine();[...tb.children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  const camOnly=k==='cam'||k==='life'||k==='sky'||k==='layers'||k==='file';ctl.mouseButtons.LEFT=camOnly?THREE.MOUSE.ROTATE:-1;ctl.touches.ONE=camOnly?THREE.TOUCH.ROTATE:-1;ctl.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  ring.visible=k==='ground';ghost.visible=false;panel();}
ctl.mouseButtons={LEFT:-1,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.ROTATE};

/* ---------- picking, cursor, previews ---------- */
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function pick(e){const r=R.domElement.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mv,cam);
  const hit=E.terr&&ray.intersectObject(E.terr.mesh,false)[0];if(hit)return hit.point;plane.constant=-doc.sea;const p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null;}
const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:64},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.9}));ring.renderOrder=9;scene.add(ring);
function placeRing(p){const a=ring.geometry.attributes.position;for(let i=0;i<64;i++){const t=i/64*6.283,x=p.x+Math.cos(t)*st.rad,z=p.z+Math.sin(t)*st.rad;a.setXYZ(i,x,Math.max(Hfn(x,z),doc.sea)+.15,z);}a.needsUpdate=true;}
const ghost=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.1,20),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthTest:false}));ghost.renderOrder=9;scene.add(ghost);
const lineObj=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffe060,depthTest:false}));lineObj.renderOrder=9;scene.add(lineObj);
function drawLine(extra){const pts=st.line.concat(extra?[extra]:[]).map(p=>new THREE.Vector3(p[0],Math.max(Hfn(p[0],p[1]),doc.sea)+.3,p[1]));lineObj.geometry.dispose();lineObj.geometry=new THREE.BufferGeometry().setFromPoints(pts.length>1?pts:[]);}
function finishLine(){if(st.line.length<2){status('ต้องมีอย่างน้อย 2 จุด');return;}snap();if(st.tool==='path'){doc.paths.push({pts:st.line.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),w:st.pathW,kind:st.pathKind});st.line=[];drawLine();rebuild(['terr','fol','life']);}
  else{doc.roads.push({pts:st.line.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),type:st.roadType});st.line=[];drawLine();rebuild(['road','fol']);}save();}

/* ground brush: edits the grid, moves the ground mesh live, rebuilds the rest on release */
function brush(p,dt){const r=st.rad,s=st.str*dt*3,g=doc.h,i0=Math.max(0,Math.floor(p.x+60-r)),i1=Math.min(N-1,Math.ceil(p.x+60+r)),j0=Math.max(0,Math.floor(p.z+60-r)),j1=Math.min(N-1,Math.ceil(p.z+60+r));
  const flatTo=st.flat;const old=g.slice();
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=i-60,z=j-60,d=Math.hypot(x-p.x,z-p.z);if(d>r)continue;const w=Math.pow(1-d/r,1.5)*s,k=j*N+i;let h=g[k];
    if(st.gmode==='raise')h+=w;else if(st.gmode==='lower')h-=w;else if(st.gmode==='flatten')h+=(flatTo-h)*Math.min(1,w*2);
    else if(st.gmode==='smooth'){let a=0,n=0;for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const ii=i+u,jj=j+v;if(ii<0||jj<0||ii>=N||jj>=N)continue;a+=old[jj*N+ii];n++;}h+=(a/n-h)*Math.min(1,w*3);}
    else if(st.gmode==='beach')h+=(doc.sea+.35-h)*Math.min(1,w*2);else if(st.gmode==='sea')h+=(doc.sea-1.6-h)*Math.min(1,w*2);else if(st.gmode==='noise')h+=(hash(i*.37+performance.now()*.001,j*.41)-.5)*w*1.4;
    g[k]=Math.max(-8,Math.min(14,+h.toFixed(3)));}
  const m=E.terr.mesh,pos=m.geometry.attributes.position;for(let k=0;k<pos.count;k++){const x=pos.getX(k),z=pos.getZ(k);if(Math.abs(x-p.x)>r+1||Math.abs(z-p.z)>r+1)continue;pos.setY(k,Hfn(x,z));}pos.needsUpdate=true;m.geometry.computeBoundingSphere();}
function nearest(p){let best=null,bd=3;const test=(arr,type,R2)=>arr.forEach((o,i)=>{const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<(R2||bd)&&d<bd+(R2?R2-bd:0)){bd=d;best={type,i};}});
  test(doc.props,'props');test(doc.trees,'trees');test(doc.bld,'bld',5);
  doc.paths.forEach((l,i)=>{const d=lineD(p.x,p.z,l.pts);if(d<Math.max(1,l.w)&&d<bd){bd=d;best={type:'paths',i};}});doc.roads.forEach((l,i)=>{const d=lineD(p.x,p.z,l.pts);if(d<RW[l.type]&&d<bd){bd=d;best={type:'roads',i};}});return best;}
const REB={props:['props','fol'],trees:['fol'],bld:['bld','fol','life'],paths:['terr','fol','life'],roads:['road','fol']};
let down=null,lastT=0;const cv=R.domElement;cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;const camOnly=ctl.mouseButtons.LEFT===THREE.MOUSE.ROTATE;if(camOnly)return;const p=pick(e);if(!p)return;const t=st.tool;
  if(t==='ground'){snap();st.flat=Hfn(p.x,p.z);down={p};lastT=performance.now();brush(p,.05);}
  else if(t==='path'||t==='road'){st.line.push([p.x,p.z]);drawLine();}
  else if(t==='plant'){snap();const o={k:st.tree,x:+p.x.toFixed(2),z:+p.z.toFixed(2),s:st.treeSize};doc.trees.push(o);E.fol.addTree(o.x,o.z,{kind:o.k,size:o.s});save();}
  else if(t==='prop'){snap();const o={k:st.prop,x:+p.x.toFixed(2),z:+p.z.toFixed(2),r:+st.rot.toFixed(3)};doc.props.push(o);addProp(o);save();}
  else if(t==='bld'){snap();const o={s:st.bstyle,x:+p.x.toFixed(2),z:+p.z.toFixed(2),r:+st.rot.toFixed(3)};if(st.bsign)o.sign=st.bsign;if(st.bwall)o.wall=st.bwall;doc.bld.push(o);addBld(o);rebuild(['fol']);save();}
  else if(t==='erase'){const n=nearest(p);if(!n){status('ไม่มีอะไรตรงนี้');return;}snap();doc[n.type].splice(n.i,1);rebuild(REB[n.type]);save();}});
cv.addEventListener('pointermove',e=>{const p=(st.tool==='ground'||st.tool==='path'||st.tool==='road'||st.tool==='prop'||st.tool==='bld'||st.tool==='plant'||st.tool==='erase')?pick(e):null;if(!p){ghost.visible=false;return;}
  if(st.tool==='ground'){placeRing(p);if(down){const now=performance.now();brush(p,Math.min(.1,(now-lastT)/1000));lastT=now;down.p=p;}}
  else if(st.tool==='path'||st.tool==='road'){if(st.line.length)drawLine([p.x,p.z]);ghost.visible=true;ghost.position.set(p.x,p.y+.1,p.z);}
  else{ghost.visible=true;ghost.position.set(p.x,p.y+.1,p.z);ghost.material.color.set(st.tool==='erase'?0xff6060:0xffffff);}});
addEventListener('pointerup',()=>{if(down){down=null;rebuild();save();}});
cv.addEventListener('dblclick',()=>{if(st.tool==='path'||st.tool==='road'){st.line.pop();finishLine();}});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(e.key==='Enter')finishLine();if(e.key==='Escape'){st.line=[];drawLine();}
  if(e.key==='r'||e.key==='R'){st.rot=(st.rot+Math.PI/4)%(Math.PI*2);const r=$('o_rot');if(r)r.value=st.rot;}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();doUndo();}});
function doUndo(){if(!undo.length){status('ไม่มีอะไรให้ย้อน');return;}doc=JSON.parse(undo.pop());rebuild();save();panel();status('ย้อนกลับแล้ว');}
$('undo').onclick=doUndo;$('hide').onclick=()=>document.body.classList.toggle('mini');

/* ---------- start ---------- */
Sky.setWeather(doc.sky.wx||'sunny');rebuild();setTool('ground');
let last=performance.now();window.__ed={doc:()=>doc,E,rebuild};
(function loop(){requestAnimationFrame(loop);ctl.update();const now=performance.now(),t=now/1000,dt=Math.min(.1,(now-last)/1000);last=now;
  if(down&&st.tool==='ground'){brush(down.p,dt*.6);}
  Sky.update(dt,{hour:+doc.sky.hour,target:ctl.target});if(Sky.animate)Sky.animate(t,dt,cam);const night=Sky.state.night;
  E.terr&&E.terr.update&&E.terr.update(t);E.fol&&E.fol.update(t,ctl.target.x,ctl.target.z);E.wl&&E.wl.update(t,dt);
  if(E.props){E.props.night=night;E.props.update(t);}if(E.road){E.road.night=night;E.road.update(t,dt);}if(E.bld)E.bld.update(t,{night});if(E.life)E.life.update(t,dt,{night});
  if(E.water){E.water.setSun&&E.water.setSun(Sky.state.sunDir,Sky.state.sunColor,Sky.state.skyColor);E.water.render(t);}else R.render(scene,cam);})();
})();
