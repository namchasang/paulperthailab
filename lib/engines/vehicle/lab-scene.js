/* Vehicle Engine lab: a small town with roads (traffic keeps left), a rail line, a harbour full of boats, an airstrip, and a car park
   gallery with every road vehicle. Buttons jump between areas; "Follow" rides along with one vehicle. */
const LH=(x,z)=>{const coast=-42+Math.sin(z*.05)*4,d=x-coast;if(d<0)return Math.max(-6,d*.25);return Math.min(1,d*.12)*(.9+Math.sin(x*.05)*.25+Math.cos(z*.04)*.25);};/* always above the sea inland */
const flatAir=(x,z)=>x>50&&x<130&&z<-46&&z>-74;/* the airstrip apron is flat */
const H0=(x,z)=>{const h=LH(x,z);return flatAir(x,z)?Math.max(.3,Math.min(h,.35)):h;};
const S=SkyEngine.create({scene,renderer:R,sun,hemi,target:new THREE.Vector3(10,0,0)});
const N=RoadEngine.create({scene,heightAt:H0});
N.road([[-25,-20],[0,-20],[20,-20],[45,-18],[70,-22]],{type:'arterial'});
N.road([[20,-40],[20,-20],[20,0]],{type:'street'});N.road([[0,-40],[0,-20],[-2,10],[-10,30]],{type:'street'});
N.road([[45,-40],[45,-18],[40,-2]],{type:'street'});N.road([[20,0],[30,14],[50,24],[70,30]],{type:'street'});
N.road([[-25,28],[-10,30],[8,26],[20,34],[40,40]],{type:'island'});N.road([[-25,-20],[-30,0],[-25,28]],{type:'street'});
N.road([[0,-40],[20,-40],[45,-40],[60,-40]],{type:'street'});
N.build();
const HG=(x,z)=>N.groundAt(x,z,H0(x,z));
const T=TerrainEngine.create({size:[220,170],center:[20,-5],res:.6,heightAt:HG,seaLevel:0});scene.add(T.mesh);
const sea=WaterSea.create({renderer:R,scene,camera:cam,heightAt:HG,size:260,ground:null,level:0});
/* airstrip: a long pale runway with centre dashes */
{const rw=new THREE.Mesh(new THREE.PlaneGeometry(64,5),new THREE.MeshLambertMaterial({color:0x5a5f66}));rw.rotation.x=-Math.PI/2;rw.position.set(92,.37,-60);rw.receiveShadow=true;scene.add(rw);
  for(let x=64;x<120;x+=4){const d=new THREE.Mesh(new THREE.PlaneGeometry(2,.25),new THREE.MeshBasicMaterial({color:0xf2efe6}));d.rotation.x=-Math.PI/2;d.position.set(x,.38,-60);scene.add(d);}}
/* rail bed */
const RAILP=[[-20,52],[10,50],[40,54],[70,50],[100,52],[120,46]];
{const cv=new THREE.CatmullRomCurve3(RAILP.map(p=>new THREE.Vector3(p[0],0,p[1])));const P=cv.getSpacedPoints(160);P.forEach((p,i)=>{if(!i)return;const q=P[i-1],L=p.distanceTo(q),a=-Math.atan2(p.z-q.z,p.x-q.x);
  const bed=new THREE.Mesh(new THREE.BoxGeometry(L+.05,.12,1.9),new THREE.MeshLambertMaterial({color:0x8e8a82}));bed.position.set((p.x+q.x)/2,HG((p.x+q.x)/2,(p.z+q.z)/2)+.04,(p.z+q.z)/2);bed.rotation.y=a;bed.receiveShadow=true;scene.add(bed);
  [-.5,.5].forEach(s=>{const r=new THREE.Mesh(new THREE.BoxGeometry(L+.05,.06,.07),new THREE.MeshLambertMaterial({color:0x9aa0a6}));r.position.copy(bed.position);r.position.y+=.09;r.position.x+=Math.sin(a)*s;r.position.z+=Math.cos(a)*s;r.rotation.y=a;scene.add(r);});});}
const V=VehicleEngine.create({scene,heightAt:HG,waterLevel:0});window.__lab={cam,ctl,N,V};
/* traffic */
const roadKinds=['hatch','sedan','ute','suv','van','taxi','campervan','truck','islandbus','citybus','foodtruck','icecream','pipmini','rangerlux','sedan','hatch','suv','pipmini','taxi','ute'];
const traffic=roadKinds.map((k,i)=>V.drive(V.add(k,0,0),N,{road:i%N.roads.length,t:(i*.37)%1,dir:i%2?1:-1}));
/* a car towing the caravan: the caravan follows the car */
const tow=V.drive(V.add('suv',0,0,{color:'#d8d2c0'}),N,{road:6,t:.2,dir:1});const van=V.add('caravan',0,0);
/* bikes on the island road */
const bikes=[0,1,2].map(i=>V.drive(V.add('bike',0,0),N,{road:5,t:.2+i*.25,dir:i%2?1:-1,speed:2.2}));
/* trains */
V.rail(V.add('islandtrain',-20,52,{cars:3}),RAILP,{speed:3.5,stops:[.3,.8]});
V.rail(V.add('suburban',100,52,{cars:4}),RAILP.slice().reverse(),{speed:5,s:40});
/* boats */
const loop=(cx,cz,rx,rz,n)=>{const P=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;P.push([cx+Math.cos(a)*rx,cz+Math.sin(a)*rz]);}return P;};
V.sail(V.add('ferry',-90,0),loop(-95,0,30,40,12),{speed:3.2});V.sail(V.add('catamaran',-110,30),loop(-110,10,22,30,10),{speed:4.5,s:30});
V.sail(V.add('fishingboat',-70,-30),loop(-75,-30,12,10,8),{speed:1.8});V.sail(V.add('speedboat',-60,20),loop(-68,25,14,10,8),{speed:7});
V.sail(V.add('yacht',-120,-30),loop(-125,-30,18,14,9),{speed:2});V.sail(V.add('superyacht',-140,10),loop(-150,5,15,30,10),{speed:1.6});
V.sail(V.add('partyboat',-90,40),loop(-88,45,14,8,8),{speed:1.4});V.sail(V.add('fishbuyer',-110,-50),loop(-110,-55,16,8,8),{speed:1.5});
V.sail(V.add('houseboat',-55,-5),loop(-55,-8,5,6,8),{speed:.6});V.sail(V.add('kayak',-48,10),loop(-49,12,3,5,8),{speed:.8});
V.sail(V.add('tanker',-180,-60),[[-200,-70],[-140,-75],[-200,-80]],{speed:2.2,loop:true});V.sail(V.add('cruiseship',-190,60),loop(-185,70,25,12,10),{speed:1.8});
/* planes */
V.fly(V.add('lightplane',64,-60),{runway:[[64,-60],[120,-60]],alt:12,radius:30});
V.fly(V.add('airliner',64,-62,{}),{runway:[[66,-62],[122,-62]],alt:24,radius:60});V.all[V.all.length-1].ph='back';V.all[V.all.length-1].ps=-30;
V.fly(V.add('seaplane',-70,-70),{runway:[[-70,-70],[-120,-70]],alt:10,radius:26});
/* gallery: every road vehicle parked in a row with its name */
const GAL=Object.keys(VehicleEngine.ROAD);const gx0=-10,gz=-52;GAL.forEach((k,i)=>{const x=gx0+i*4.2,v=V.add(k,x,gz,{rot:Math.PI/2});const c=document.createElement('canvas');c.width=256;c.height=48;const g2=c.getContext('2d');g2.fillStyle='rgba(20,28,40,.8)';g2.fillRect(0,0,256,48);g2.fillStyle='#fff';g2.font='bold 22px system-ui';g2.textAlign='center';g2.fillText(VehicleEngine.KINDS[k].name,128,32);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));sp.scale.set(3.6,.68,1);sp.position.set(x,3.4,gz);scene.add(sp);});
{const pk=new THREE.Mesh(new THREE.PlaneGeometry(GAL.length*4.2+4,8),new THREE.MeshLambertMaterial({color:0x6a6e74}));pk.rotation.x=-Math.PI/2;pk.position.set(gx0+(GAL.length-1)*2.1,HG(20,gz)+.05,gz);pk.receiveShadow=true;scene.add(pk);
  GAL.forEach((k,i)=>{if(!i)return;const l=new THREE.Mesh(new THREE.PlaneGeometry(.1,5),new THREE.MeshBasicMaterial({color:0xf2efe6}));l.rotation.x=-Math.PI/2;l.position.set(gx0+i*4.2-2.1,pk.position.y+.01,gz);scene.add(l);});}
GAL.forEach((k,i)=>{const v=V.all.find(q=>q.kind===k&&q.mode==='park');if(v){v.g.position.y=HG(v.g.position.x,gz)+.05;}});
/* ---------- UI ---------- */
ui('<div>Time: <input type="range" id="hr" min="5" max="21" step=".05" value="10"> <span id="hrv"></span></div>'+
 '<div style="margin:4px 0"><b style="font-size:12px">Go to</b><br><button data-go="town">Town</button><button data-go="gallery">Car park</button><button data-go="rail">Rail</button><button data-go="sea">Harbour</button><button data-go="air">Airstrip</button></div>'+
 '<div>Follow: <select id="fol"><option value="">(free camera)</option></select></div>'+
 '<div style="margin-top:4px"><b style="font-size:12px">Layers</b></div><div id="ly" style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px"></div>'+
 '<div style="opacity:.75;margin-top:6px">'+VehicleEngine.kinds.length+' kinds: road '+Object.keys(VehicleEngine.ROAD).length+', rail 2, water 12, air 3, bike 1. Traffic keeps left, gives way at junctions and blinks before turning. Lights come on at dusk.</div>');
const hr=document.getElementById('hr'),hrv=document.getElementById('hrv');
const GO={town:[[-20,34,40],[15,0,-8]],gallery:[[14,7,-40],[20,.5,-52]],rail:[[30,16,72],[40,0,50]],sea:[[-40,30,40],[-95,0,0]],air:[[70,26,-20],[92,4,-60]]};
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{fol.value='';const g=GO[b.dataset.go];cam.position.set(...g[0]);ctl.target.set(...g[1]);});
const fol=document.getElementById('fol');V.all.forEach((v,i)=>{if(v.mode==='park')return;const o=document.createElement('option');o.value=i;o.textContent=v.name;fol.appendChild(o);});
const ly=document.getElementById('ly');V.layers.forEach(n=>{const l=document.createElement('label');l.innerHTML='<input type=checkbox '+(n==='dirt'?'':'checked')+'> '+n;l.firstChild.onchange=e=>V.setLayer(n,e.target.checked);ly.appendChild(l);});
cam.position.set(-20,34,40);ctl.target.set(15,0,-8);
const off=new THREE.Vector3();
onFrame((t,dt)=>{S.update(dt,{hour:+hr.value});hrv.textContent=(+hr.value|0)+':'+String(Math.round((+hr.value%1)*60)).padStart(2,'0');V.night=S.state.night;N.night=S.state.night;V.update(t,dt);N.update(t,dt);
  /* the caravan rides behind the tow car */{const g=tow.g,a=g.rotation.y;van.g.position.set(g.position.x-Math.cos(a)*3.2,g.position.y,g.position.z+Math.sin(a)*3.2);van.g.rotation.y=a;}
  sea.setSun(S.state.sunDir,S.state.sunColor,S.state.skyColor);
  if(fol.value!==''){const v=V.all[+fol.value],G=v.g;const back=v.cat==='air'?14:v.cat==='water'?Math.max(10,v.L*1.4):v.cat==='rail'?10:7;off.set(-Math.cos(G.rotation.y)*back,v.cat==='air'?5:back*.5,Math.sin(G.rotation.y)*back);
    const tg=G.getWorldPosition(new THREE.Vector3());ctl.target.lerp(tg,.15);cam.position.lerp(tg.clone().add(off),.08);}});
setRender(t=>sea.render(t));
