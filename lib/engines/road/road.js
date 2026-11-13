/* Road Engine (Paul Perth Library, Nov 2026) — a road network as real 3D for three.js r128.
   const N=RoadEngine.create({scene,heightAt});
   N.road(pts,{type:'street'|'arterial'|'highway'|'lane',lanes,kerb:true,footpath:true,median:false})  -> id
   N.bridge(pts,{height,type})   N.build()   // finds junctions, cuts the roads back, fills each junction with its own pad,
                                             // adds zebra crossings on streets, stop lines, kerb returns and a roundabout where 4+ meet
   Smooth driving (default; smooth:false keeps raw ground): 1 sample the ground along each road every 2 units, 2 average over ~20 units,
   3 limit the grade (maxGrade, default 6%) with no sudden changes, 4 cars and ribbons follow that profile, 5 N.groundAt(x,z,ground) cuts/fills
   the land to the road bed (+1.5 shoulder) and blends back over 5 units, 6 irons out small bumps for 10 more units so hills stay broad.
   N.cars(n) adds simple traffic that drives the lanes (left-hand traffic, Australia).  N.update(t,dt)
   Roads are smooth Catmull-Rom ribbons that follow the ground (or ramp up to bridge decks), with painted lines drawn into one
   asphalt texture per road type: centre line (dashed or double), lane lines, edge lines; kerbs and footpaths are raised strips. */
(function(g){
const TY={street:{lanes:2,lw:1.5,line:'dash',kerb:.12,foot:1.2},arterial:{lanes:4,lw:1.6,line:'double',kerb:.14,foot:1.6,median:false},highway:{lanes:4,lw:1.8,line:'double',kerb:0,foot:0,median:true},lane:{lanes:2,lw:1.2,line:'none',kerb:.08,foot:0},
  /* island road: narrow, no centre line, no kerbs, sandy shoulders (Rottnest style, bikes and the loop bus) */island:{lanes:2,lw:1.3,line:'none',kerb:0,foot:0,shoulder:'#e4d8b8'}};
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
function asphalt(t){const S=4,w=64*S,h=t.lanes*16*S,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#55585c';x.fillRect(0,0,w,h);let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<w*h/60;i++){x.fillStyle=r()<.5?'rgba(30,32,36,.25)':'rgba(140,142,146,.22)';x.fillRect(r()*w,r()*h,1+r()*2*S/4,1+r()*2*S/4);}
  const L=(y,dash,col,wd)=>{x.fillStyle=col;if(dash)for(let k=0;k<w;k+=32*S)x.fillRect(k,y-wd/2,18*S,wd);else x.fillRect(0,y-wd/2,w,wd);};const lh=h/t.lanes;
  L(2*S,false,'#f2efe6',1.5*S);L(h-2*S,false,'#f2efe6',1.5*S);
  for(let i=1;i<t.lanes;i++){const y=i*lh;if(i===t.lanes/2){if(t.line==='double'){L(y-1.6*S,false,'#f2c94a',1.4*S);L(y+1.6*S,false,'#f2c94a',1.4*S);}else if(t.line==='dash')L(y,true,'#f2efe6',1.4*S);}else L(y,true,'#f2efe6',1.2*S);}
  const tx=new THREE.CanvasTexture(c);tx.wrapS=THREE.RepeatWrapping;tx.anisotropy=8;tx.encoding=THREE.sRGBEncoding;return tx;}
function create(o){const scene=o.scene,H=o.heightAt||(()=>0),roads=[],bridges=[],group=new THREE.Group();group.name='roads';scene.add(group);const M={},cars=[];
  const mat=k=>M[k]||(M[k]=new THREE.MeshLambertMaterial({map:asphalt(TY[k]),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  const plain=c=>M[c]||(M[c]=new THREE.MeshLambertMaterial({color:lin(c)}));
  function ribbon(cv,t0,t1,off0,off1,y0,yfn,uScale,material,vSpan){const L=cv.getLength()*(t1-t0),N=Math.max(2,Math.ceil(L/.5)),P=[],U=[],I=[];let acc=0,prev=null;
    for(let i=0;i<=N;i++){const t=t0+(t1-t0)*i/N,p=cv.getPointAt(t),tg=cv.getTangentAt(t);if(prev)acc+=p.distanceTo(prev);prev=p.clone();const nx=-tg.z,nz=tg.x,y=yfn(p,t);
      P.push(p.x+nx*off0,y+y0,p.z+nz*off0,p.x+nx*off1,y+y0,p.z+nz*off1);U.push(acc/uScale,vSpan[0],acc/uScale,vSpan[1]);}
    for(let i=0;i<N;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
    const m=new THREE.Mesh(g,material);m.receiveShadow=true;m.material.side=THREE.DoubleSide;group.add(m);return m;}
  function wall(cv,t0,t1,off,h,y0,yfn,col){/* a kerb face or a footpath edge */return ribbonV(cv,t0,t1,off,h,y0,yfn,col);}
  function ribbonV(cv,t0,t1,off,h,y0,yfn,col){const L=cv.getLength()*(t1-t0),N=Math.max(2,Math.ceil(L/.5)),P=[],I=[];for(let i=0;i<=N;i++){const t=t0+(t1-t0)*i/N,p=cv.getPointAt(t),tg=cv.getTangentAt(t),nx=-tg.z,nz=tg.x,y=yfn(p,t);P.push(p.x+nx*off,y+y0,p.z+nz*off,p.x+nx*off,y+y0+h,p.z+nz*off);}
    for(let i=0;i<N;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,plain(col));m.material.side=THREE.DoubleSide;m.castShadow=true;group.add(m);return m;}
  /* ---- detail layers (each a group; api.setLayer(name,on)) ---- */
  const LY={},LAYERS=['patches','cracks','manholes','arrows','parking','signs','lights','catseyes','leaves','skids','headlights'];
  const lg=n=>LY[n]||(LY[n]=(()=>{const g=new THREE.Group();g.name='road-'+n;group.add(g);return g;})());
  let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const ctex=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;};
  const dmat=(t,op)=>new THREE.MeshLambertMaterial(Object.assign({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6},op||{}));
  const at=(r,t,s)=>{const p=r.cv.getPointAt(t),tg=r.cv.getTangentAt(t),nx=-tg.z,nz=tg.x;return{x:p.x+nx*s,z:p.z+nz*s,y:r.yfn(p,t),a:-Math.atan2(tg.z,tg.x),nx,nz};};
  const decal=(L,m,w,h,P,rot,lift)=>{const d=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);d.rotation.order='YXZ';d.rotation.set(-Math.PI/2,P.a+(rot||0),0);d.position.set(P.x,P.y+(lift||.045),P.z);d.receiveShadow=true;lg(L).add(d);return d;};
  const nearJ=(J,P,R)=>J.some(j=>Math.hypot(j.c.x-P.x,j.c.z-P.z)<Math.max(R,(j.R||0)+1));
  function decor(J){
    const T={patch:ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,8,32,32,31);g.addColorStop(0,'rgba(48,50,54,.85)');g.addColorStop(.8,'rgba(52,54,58,.7)');g.addColorStop(1,'rgba(52,54,58,0)');x.fillStyle=g;x.beginPath();for(let i=0;i<12;i++){const a=i/12*6.28,r=22+Math.sin(i*2.3)*7;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}x.fill();}),
      crack:ctex(128,32,(x,w,h)=>{x.strokeStyle='rgba(28,28,30,.8)';x.lineWidth=1.4;for(let k=0;k<3;k++){x.beginPath();let y=16;x.moveTo(0,y);for(let i=0;i<=128;i+=8){y+=(Math.sin(i*.7+k*3)*4);x.lineTo(i,Math.max(2,Math.min(30,y)));}x.stroke();}}),
      man:ctex(64,64,(x)=>{x.fillStyle='#3a3c40';x.beginPath();x.arc(32,32,30,0,6.28);x.fill();x.strokeStyle='#6a6c70';x.lineWidth=3;x.stroke();x.strokeStyle='#4c4e52';x.lineWidth=2;for(let i=-24;i<=24;i+=6){x.beginPath();x.moveTo(32+i,8);x.lineTo(32+i,56);x.stroke();}}),
      arrow:ctex(32,96,(x)=>{x.fillStyle='rgba(242,239,230,.92)';x.fillRect(12,30,8,62);x.beginPath();x.moveTo(16,2);x.lineTo(30,32);x.lineTo(2,32);x.fill();}),
      bay:ctex(64,128,(x)=>{x.strokeStyle='rgba(242,239,230,.9)';x.lineWidth=4;x.beginPath();x.moveTo(2,0);x.lineTo(2,128);x.moveTo(62,0);x.lineTo(62,128);x.stroke();}),
      leaf:ctex(64,64,(x)=>{for(let i=0;i<40;i++){x.fillStyle=['#b06a2a','#c89a3a','#8a5a2a','#a87a3a'][i%4];x.save();x.translate(8+Math.random()*48,8+Math.random()*48);x.rotate(Math.random()*6);x.beginPath();x.ellipse(0,0,4,2,0,0,6.28);x.fill();x.restore();}}),
      skid:ctex(128,16,(x)=>{const g=x.createLinearGradient(0,0,128,0);g.addColorStop(0,'rgba(20,20,22,0)');g.addColorStop(.3,'rgba(20,20,22,.55)');g.addColorStop(1,'rgba(20,20,22,.1)');x.fillStyle=g;x.fillRect(0,2,128,4);x.fillRect(0,10,128,4);})};
    const M={patch:dmat(T.patch),crack:dmat(T.crack),man:dmat(T.man,{transparent:false}),arrow:dmat(T.arrow),bay:dmat(T.bay),leaf:dmat(T.leaf),skid:dmat(T.skid)};
    roads.forEach((r,ri)=>{const L=r.cv.getLength(),W=r.W,t=r.t;
      /* patches + cracks: worn asphalt */
      for(let d=6;d<L-6;d+=7+rnd()*9){const s=(rnd()-.5)*(W-1.2);const P=at(r,d/L,s);if(nearJ(J,P,W/2+2))continue;if(rnd()<.55)decal('patches',M.patch,1+rnd()*1.8,1+rnd()*1.4,P,rnd()*3);else decal('cracks',M.crack,2+rnd()*2.5,.5,P,(rnd()-.5)*.8,.047);}
      /* manholes on streets and arterials */
      if(r.type==='street'||r.type==='arterial')for(let d=14;d<L-8;d+=22+rnd()*10){const P=at(r,d/L,(rnd()<.5?-1:1)*t.lw*.5);if(!nearJ(J,P,W/2+2))decal('manholes',M.man,.75,.75,P,0,.05);}
      /* lane arrows into each junction */
      J.forEach(j=>j.roads.forEach(([k,tt])=>{if(k!==ri||r.type==='lane')return;[-1,1].forEach(sd2=>{const t2=tt+sd2*(W/2+4.5)/L;if(t2<.01||t2>.99)return;const lane=t.lw*(t.lanes/4+.5)*(sd2>0?-1:1)*-1;const P=at(r,t2,lane*(sd2>0?1:-1));decal('arrows',M.arrow,.45,1.4,P,sd2>0?Math.PI/2:-Math.PI/2,.05);});}));
      /* skid marks near junctions on arterials */
      if(r.type==='arterial'||r.type==='highway')for(let d=10;d<L-10;d+=30+rnd()*25){const P=at(r,d/L,(rnd()-.5)*W*.5);decal('skids',M.skid,3+rnd()*2,.35,P,(rnd()-.5)*.2,.048);}
      /* parking bays beside streets with a footpath */
      if(t.foot&&r.type==='street'&&!r.bridge){for(let d=8;d<L-8;d+=2.6){const P=at(r,d/L,W/2-1.1);if(nearJ(J,P,W/2+6))continue;decal('parking',M.bay,2.6,2.0,P,0,.049);}}
      /* gutter leaves along kerbs */
      if(t.kerb)for(let d=3;d<L-3;d+=3+rnd()*6){[-1,1].forEach(sg=>{if(rnd()<.5)return;const P=at(r,d/L,sg*(W/2-.35));decal('leaves',M.leaf,.9+rnd()*.8,.5,P,rnd()*.6,.052);});}
      /* cat's eyes: small studs on the centre line that glow at night */
      if(r.type==='highway'||r.type==='arterial'){const g=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.05,.12),new THREE.MeshBasicMaterial({color:0xf6e8a0}),Math.ceil(L/4));let n=0;const o=new THREE.Object3D();for(let d=2;d<L-2;d+=4){const P=at(r,d/L,0);if(nearJ(J,P,W/2+1.5))continue;o.position.set(P.x,P.y+.06,P.z);o.rotation.set(0,P.a,0);o.updateMatrix();g.setMatrixAt(n++,o.matrix);}g.count=n;lg('catseyes').add(g);g.userData.cat=1;}
    });
    /* signs at junction entries: give-way triangles on minor arms, stop on lanes */
    const post=(P,kind)=>{const G=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.2,6),plain('#9aa0a6'));p.position.y=1.1;G.add(p);let face;
      if(kind==='stop'){face=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.04,8),plain('#c8344a'));face.rotation.x=Math.PI/2;face.rotation.y=Math.PI/8;}
      else if(kind==='giveway'){face=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.04,3),plain('#f4f2ec'));face.rotation.x=Math.PI/2;face.rotation.z=Math.PI/2;const rim=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.03,3),plain('#c8344a'));rim.rotation.copy(face.rotation);rim.position.z=-.02;G.add(rim);}
      else{face=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.04,20),plain('#f4f2ec'));face.rotation.x=Math.PI/2;const rim=new THREE.Mesh(new THREE.TorusGeometry(.32,.04,6,20),plain('#c8344a'));rim.position.z=.03;G.add(rim);}
      face.position.y=2.1;G.add(face);G.children.forEach(c=>{if(c!==p&&c!==face)c.position.y=2.1;});G.position.set(P.x,P.y,P.z);G.rotation.y=P.a+Math.PI/2;G.traverse(c=>c.castShadow=true);lg('signs').add(G);};
    J.forEach(j=>{const main=Math.max(...j.roads.map(([k])=>roads[k].t.lanes));j.roads.forEach(([k,tt])=>{const r=roads[k];const L=r.cv.getLength();if(r.t.lanes>=main&&r.type!=='lane')return;[-1,1].forEach(sg=>{const t2=tt+sg*(r.W/2+3)/L;if(t2<0||t2>1)return;const P=at(r,t2,(r.W/2+.6)*-sg);post(P,r.type==='lane'?'stop':'giveway');});});});
    /* speed sign once per long road */
    roads.forEach(r=>{if(r.bridge||r.cv.getLength()<40)return;const P=at(r,.2,r.W/2+.8);post(P,'speed');});
    /* traffic lights at busy junctions without a roundabout */
    lights.length=0;J.forEach(j=>{if(j.arms<3||!j.roads.some(([k])=>roads[k].type==='arterial'))return;if(j.round)return;j.roads.forEach(([k,tt],ai)=>{const r=roads[k],L=r.cv.getLength();[-1,1].forEach(sg=>{const t2=tt+sg*(r.W/2+1.6)/L;if(t2<0||t2>1)return;const P=at(r,t2,(r.W/2+.5)*-sg);
      const G=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,3,8),plain('#2a2a30'));pole.position.y=1.5;G.add(pole);const hd=new THREE.Mesh(new THREE.BoxGeometry(.32,.9,.3),plain('#2a2a30'));hd.position.y=3.1;G.add(hd);
      const bulbs=['#e03a3a','#f2b23a','#3ac860'].map((c,i)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:lin(c)}));b.position.set(0,3.4-i*.3,.16);G.add(b);return b;});
      G.position.set(P.x,P.y,P.z);G.rotation.y=P.a+(sg>0?Math.PI/2:-Math.PI/2);G.traverse(c=>c.castShadow=true);lg('lights').add(G);lights.push({bulbs,phase:ai%2});});});});
    /* headlights: a small light cone in front of each car, shown at night */
    cars.forEach(c=>addLamps(c));
    LAYERS.forEach(n=>lg(n));}
  const lights=[];let night=0;
  const glow=ctex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,240,190,.9)');g.addColorStop(1,'rgba(255,240,190,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
  function addLamps(c){if(c.lamps)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.6),new THREE.MeshBasicMaterial({map:glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(2.6,.08,0);c.C.add(m);c.lamps=m;lg('headlights').add(new THREE.Object3D());}
  const api={
    road(pts,op){op=op||{};const t=Object.assign({},TY[op.type||'street'],op);const r={pts,t,type:op.type||'street',cv:new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal'),bridge:null};roads.push(r);return roads.length-1;},
    /* ground that fits the roads: inside the road + 1.5 shoulder the ground sits just under the road; it blends back to the
       natural ground over 'blend' units. Junction pads flatten a disc. Use it as the heightAt of terrain, plants, props, buildings. */
    groundAt(x,z,g0,blend){if(!api.junctions)return g0;blend=blend||5;let best=0,tgt=g0,dmin=1e9;
      for(const r of roads){if(r.bridge||!r.prof)continue;const W=r.W/2+1.5,ex=W+blend,ex2=ex+10;if(x<r.bb[0]-ex2||x>r.bb[2]+ex2||z<r.bb[1]-ex2||z>r.bb[3]+ex2)continue;
        let bd=1e9,bi=0;for(let i=0;i<=r.n;i++){const p=r.pts[i],d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);if(d<bd){bd=d;bi=i;}}
        const a=r.pts[Math.max(0,bi-1)],b=r.pts[Math.min(r.n,bi+1)],vx=b.x-a.x,vz=b.z-a.z,l2=vx*vx+vz*vz||1e-6;let t=((x-a.x)*vx+(z-a.z)*vz)/l2;t=Math.max(0,Math.min(1,t));
        const d=Math.hypot(a.x+vx*t-x,a.z+vz*t-z),ti=(Math.max(0,bi-1)+t*(Math.min(r.n,bi+1)-Math.max(0,bi-1)))/r.n;dmin=Math.min(dmin,d-W-blend);if(d>ex)continue;
        const w=d<W?1:.5+.5*Math.cos(Math.PI*(d-W)/blend);if(w>best){best=w;tgt=r.prof0(r,ti)-.03;}}
      for(const j of api.junctions){if(j.y==null)continue;const d=Math.hypot(j.c.x-x,j.c.z-z),W=j.R+1.5;if(d>W+blend)continue;const w=d<W?1:.5+.5*Math.cos(Math.PI*(d-W)/blend);if(w>=best){best=w;tgt=j.y-.065;}}
      /* step 6: next to the road corridor, iron out small bumps (local average) so the land rolls in broad, gentle hills */
      if(dmin<10&&best<1){const k=3,gl=(g0+H(x+k,z)+H(x-k,z)+H(x,z+k)+H(x,z-k)+H(x+2*k,z)+H(x-2*k,z)+H(x,z+2*k)+H(x,z-2*k))/9,w2=dmin<=0?1:.5+.5*Math.cos(Math.PI*Math.min(1,dmin/10));g0=g0+(gl-g0)*w2;}
      return g0+(tgt-g0)*best;},
    bridge(pts,op){const id=api.road(pts,op);roads[id].bridge=Object.assign({height:4},op);return id;},
    build(){/* junctions: crossings, T-junctions (a road that ends at the side of another) and corners all join.
         Each junction is one pad that follows the ground; road ends tuck under it; kerbs and footpaths run round it
         as a ring with gaps for each arm, so road, kerb and footpath are one piece. Four or more arms with an arterial: roundabout. */
      roads.forEach(r=>{r.W=r.t.lanes*r.t.lw;});
      const J=[],N=120;roads.forEach((a,ia)=>roads.forEach((b,ib)=>{if(ib<=ia)return;let best=1e9,ta=0,tb=0;const B=[];for(let k=0;k<=N;k++)B.push(b.cv.getPointAt(k/N));
        for(let i=0;i<=N;i++){const p=a.cv.getPointAt(i/N);for(let k=0;k<=N;k++){const d=p.distanceToSquared(B[k]);if(d<best){best=d;ta=i/N;tb=k/N;}}}
        const endA=ta<.02||ta>.98,endB=tb<.02||tb>.98,allow=1.2+(endA?b.W/2+.4:0)+(endB?a.W/2+.4:0);
        if(Math.sqrt(best)>allow)return;const lift=r=>r.bridge&&(t=>Math.min(t,1-t)*r.cv.getLength()>8);if((a.bridge&&lift(a)(ta))||(b.bridge&&lift(b)(tb)))return;
        const pa=a.cv.getPointAt(ta),pb=b.cv.getPointAt(tb);const c=endA&&!endB?pb.clone():endB&&!endA?pa.clone():pa.clone().add(pb).multiplyScalar(.5);
        const near=J.find(j=>j.c.distanceTo(c)<Math.max(3,(a.W+b.W)/4));
        if(near){[[ia,ta],[ib,tb]].forEach(e=>{if(!near.roads.some(q=>q[0]===e[0]))near.roads.push(e);});}else J.push({c,roads:[[ia,ta],[ib,tb]]});}));
      J.forEach(j=>{j.arms=j.roads.reduce((n,[ri,t])=>n+(t<.02||t>.98?1:2),0);j.W=Math.max(...j.roads.map(([k])=>roads[k].W));
        j.round=j.arms>=4&&j.W>=5&&j.roads.some(([k])=>roads[k].type==='arterial');j.R=j.round?j.W/2+2.8:j.W/2+1.6;j.exits=[];});
      /* smooth height profile per road: sample the ground every 2 units, average over ~20 units, limit the grade (6%),
         then pull each road to its junction height so pads are level with every arm. Cars and the ribbons follow this,
         not the raw ground, so driving is smooth; groundAt() lets the terrain fit itself to the roads. */
      const G6=(o.maxGrade||.06),SM=o.smooth!==false;
      roads.forEach(r=>{const L=r.cv.getLength(),n=Math.max(2,Math.ceil(L/2)),h=[],pts=[];for(let i=0;i<=n;i++){const p=r.cv.getPointAt(i/n);pts.push(p);h.push(H(p.x,p.z));}
        if(SM){const box=(a,R)=>a.map((_,i)=>{let s=0,c=0;for(let k=Math.max(0,i-R);k<=Math.min(a.length-1,i+R);k++){s+=a[k];c++;}return s/c;});let g=box(box(h,5),5);const st=G6*L/n;
          for(let i=1;i<g.length;i++)g[i]=Math.max(g[i-1]-st,Math.min(g[i-1]+st,g[i]));for(let i=g.length-2;i>=0;i--)g[i]=Math.max(g[i+1]-st,Math.min(g[i+1]+st,g[i]));r.prof=box(g,2);}else r.prof=h;
        r.pts=pts;r.n=n;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);});r.bb=[x0,z0,x1,z1];});
      const profAt=(r,t)=>{const f=Math.max(0,Math.min(1,t))*r.n,i=Math.min(r.n-1,Math.floor(f)),u=f-i;return r.prof[i]*(1-u)+r.prof[i+1]*u;};
      if(SM)J.forEach(j=>{j.y=j.roads.reduce((s,[k,tt])=>s+profAt(roads[k],tt),0)/j.roads.length;j.roads.forEach(([k,tt])=>{const r=roads[k],L=r.cv.getLength(),d0=profAt(r,tt);const reach=j.R+12;
        r.prof=r.prof.map((v,i)=>{const dist=Math.abs(i/r.n-tt)*L;if(dist>reach)return v;const w=dist<j.R?1:.5+.5*Math.cos(Math.PI*(dist-j.R)/(reach-j.R));return v+(j.y-d0)*w;});});});
      roads.forEach(r=>{r.prof0=profAt;});
      /* walk along a road from its junction point until it leaves a circle of radius rad */
      const leave=(r,t0,dir,c,rad)=>{const L=r.cv.getLength(),dt=.2/L;let t=t0;for(let n=0;n<4000;n++){const p=r.cv.getPointAt(Math.min(1,Math.max(0,t)));if(Math.hypot(p.x-c.x,p.z-c.z)>=rad)return t;t+=dir*dt;if(t<=0)return 0;if(t>=1)return 1;}return t;};
      roads.forEach((r,ri)=>{const t=r.t,W=r.W,L=r.cv.getLength();const cutA=[],cutK=[];
        J.forEach(j=>j.roads.forEach(([k,tt])=>{if(k!==ri)return;const lo=leave(r,tt,-1,j.c,j.R-.45),hi=leave(r,tt,1,j.c,j.R-.45);cutA.push([lo,hi]);cutK.push([leave(r,tt,-1,j.c,j.R+.02),leave(r,tt,1,j.c,j.R+.02)]);
          if(lo>0)j.exits.push({k,t:leave(r,tt,-1,j.c,j.R),dir:-1});if(hi<1)j.exits.push({k,t:leave(r,tt,1,j.c,j.R),dir:1});}));
        const brH=r.bridge?r.bridge.height:0;const yfn=(p,tt)=>{const g0=profAt(r,tt);if(!brH)return g0;const ramp=Math.min(1,Math.min(tt,1-tt)*L/12);return Math.max(g0,g0+brH*Math.sin(ramp*Math.PI/2));};
        const keep=cuts=>{const out=[];let s0=0;cuts.sort((a,b)=>a[0]-b[0]).forEach(([a,b])=>{if(a>s0)out.push([s0,a]);s0=Math.max(s0,b);});if(s0<1)out.push([s0,1]);return out.filter(([a,b])=>b-a>.002);};
        keep(cutA).forEach(([a,b])=>{ribbon(r.cv,a,b,-W/2,W/2,.03,yfn,8,mat(r.type),[0,1]);if(t.shoulder)[-1,1].forEach(sd=>ribbon(r.cv,a,b,sd*W/2,sd*(W/2+1),.02,yfn,2,plain(t.shoulder),[0,1]));if(t.median)ribbon(r.cv,a,b,-.4,.4,.08,yfn,2,plain('#6a8a50'),[0,1]);
          if(brH){[-1,1].forEach(sd=>wall(r.cv,a,b,sd*(W/2+.2),.9,.03,yfn,'#d8d4cc'));const Lb=r.cv.getLength();for(let s=.1;s<.9;s+=10/Lb){const p=r.cv.getPointAt(s),y=yfn(p,s);if(y-H(p.x,p.z)<1)continue;const pier=new THREE.Mesh(new THREE.BoxGeometry(1,y,W*.8),plain('#bcb6aa'));pier.position.set(p.x,y/2,p.z);const tg=r.cv.getTangentAt(s);pier.rotation.y=-Math.atan2(tg.z,tg.x);pier.castShadow=true;group.add(pier);}}});
        if(t.kerb)keep(cutK).forEach(([a,b])=>[-1,1].forEach(sd=>{wall(r.cv,a,b,sd*W/2,t.kerb,.0,yfn,'#c8c4ba');if(t.foot)ribbon(r.cv,a,b,sd*W/2,sd*(W/2+t.foot),t.kerb+.01,yfn,2,plain('#cfc9bc'),[0,1]);}));
        r.yfn=yfn;});
      /* ground-following strips round a junction: a flat ring (r0..r1) or a kerb face at r0, between two angles */
      const arc=(c,r0,r1,a0,a1,y0,y1,col,vertical)=>{const n=Math.max(2,Math.ceil((a1-a0)*r1/.4)),P=[],I=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,ca=Math.cos(a),sa=Math.sin(a);const x0=c.x+ca*r0,z0=c.z+sa*r0,x1=c.x+ca*r1,z1=c.z+sa*r1;
          if(vertical){const y=SM&&c.__y!=null?c.__y:H(x0,z0);P.push(x0,y+y0,z0,x0,y+y1,z0);}else P.push(x0,(SM&&c.__y!=null?c.__y:H(x0,z0))+y0,z0,x1,(SM&&c.__y!=null?c.__y:H(x1,z1))+y0,z1);}
        for(let i=0;i<n;i++){const k=i*2;I.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,plain(col));m.material.side=THREE.DoubleSide;m.receiveShadow=true;if(vertical)m.castShadow=true;group.add(m);return m;};
      const padMat=new THREE.MeshLambertMaterial({color:lin('#55585c'),polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
      J.forEach(j=>{const c=j.c,R=j.R;if(SM)c.__y=j.y;
        /* the pad: a disc whose every vertex sits on the ground, so it meets the road ends on slopes too */
        const pg=new THREE.CircleGeometry(R,Math.max(28,Math.ceil(R*8)),0,Math.PI*2).rotateX(-Math.PI/2);const pp=pg.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,(SM?j.y:H(c.x+pp.getX(i),c.z+pp.getZ(i)))+.035);pg.computeVertexNormals();
        const pad=new THREE.Mesh(pg,padMat);pad.position.set(c.x,0,c.z);pad.receiveShadow=true;group.add(pad);if(!SM)j.y=H(c.x,c.z);const jy=j.y;j.y=jy+.035;
        /* arm gaps (angles where asphalt enters) */
        const spans=j.exits.map(e=>{const r=roads[e.k],p=r.cv.getPointAt(e.t),a=Math.atan2(p.z-c.z,p.x-c.x),h=Math.asin(Math.min(.99,(r.W/2)/R));return[a-h,a+h,r];});
        const kerb=Math.max(0,...j.roads.map(([k])=>roads[k].t.kerb||0)),foot=Math.max(0,...j.roads.map(([k])=>roads[k].t.foot||0));
        if(kerb&&spans.length){spans.sort((a,b)=>a[0]-b[0]);for(let i=0;i<spans.length;i++){let a0=spans[i][1],a1=spans[(i+1)%spans.length][0];if(i===spans.length-1)a1+=Math.PI*2;if(a1-a0<.02)continue;
          arc(c,R,R,a0,a1,0,kerb,'#c8c4ba',true);if(foot)arc(c,R,R+foot,a0,a1,kerb+.01,0,'#cfc9bc',false);}}
        if(j.round){const ir=j.W*.3;const ig=new THREE.CylinderGeometry(ir,ir+.1,.2,32);const isl=new THREE.Mesh(ig,plain('#6a8a50'));isl.position.set(c.x,j.y+.1,c.z);isl.receiveShadow=true;group.add(isl);
          arc(c,ir+.1,ir+.1,0,Math.PI*2,0,.2,'#e8e4dc',true);
          /* painted circulating lane line and give-way lines at each entry */
          const dash=new THREE.MeshLambertMaterial({color:0xf2efe6,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-5});const mr=(ir+R)/2;for(let a=0;a<Math.PI*2;a+=.35){const d=new THREE.Mesh(new THREE.PlaneGeometry(.7,.12),dash);d.rotation.order='YXZ';d.rotation.set(-Math.PI/2,-a-Math.PI/2,0);const x=c.x+Math.cos(a)*mr,z=c.z+Math.sin(a)*mr;d.position.set(x,H(x,z)+.05,z);group.add(d);}
          spans.forEach(([a0,a1])=>{const am=(a0+a1)/2,x=c.x+Math.cos(am)*(R-.35),z=c.z+Math.sin(am)*(R-.35),w=(a1-a0)*R*.5;for(let s=-w/2;s<w/2;s+=.5){const px=x-Math.sin(am)*(s+.12),pz=z+Math.cos(am)*(s+.12);const d=new THREE.Mesh(new THREE.PlaneGeometry(.3,.15),dash);d.rotation.order='YXZ';d.rotation.set(-Math.PI/2,-am,0);d.position.set(px,H(px,pz)+.05,pz);group.add(d);}});}
        /* zebra crossings just outside the pad on streets */
        j.exits.forEach(e=>{const r=roads[e.k];if(r.type!=='street'&&r.type!=='arterial')return;const L=r.cv.getLength();const t2=e.t+e.dir*1.4/L;if(t2<0||t2>1)return;const p=r.cv.getPointAt(t2),tg=r.cv.getTangentAt(t2),nx=-tg.z,nz=tg.x;
          for(let s=-r.W/2+.3;s<r.W/2-.2;s+=.6){const st=new THREE.Mesh(new THREE.PlaneGeometry(.35,1.4),new THREE.MeshLambertMaterial({color:0xf2efe6,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));st.rotation.x=-Math.PI/2;st.rotation.z=-Math.atan2(tg.z,tg.x)+Math.PI/2;st.position.set(p.x+nx*s,r.yfn(p,t2)+.05,p.z+nz*s);group.add(st);}});});
      api.junctions=J;decor(J);return J;},
    cars(n){const cols=['#c8344a','#f4f2ec','#2f6a74','#e8b860','#3e7d5c','#1d3a6e','#9aa0a6','#2a2a30'];for(let i=0;i<n;i++){const r=roads[i%roads.length];if(!r||r.bridge&&r.bridge.noCars)continue;const C=new THREE.Group(),c=cols[i%cols.length];
        const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.55,1),plain(c));b.position.y=.45;b.castShadow=true;C.add(b);const top=new THREE.Mesh(new THREE.BoxGeometry(1.2,.45,.9),plain('#2b3a4c'));top.position.set(-.15,.92,0);C.add(top);
        [[.7,.45],[.7,-.45],[-.7,.45],[-.7,-.45]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.16,10),plain('#1d1d22'));w.rotation.x=Math.PI/2;w.position.set(x,.22,z);C.add(w);});group.add(C);
        const cc={C,r,t:Math.random(),dir:i%2?1:-1,v:(r.type==='highway'?9:5)*(.8+Math.random()*.4)};cars.push(cc);if(api.junctions)addLamps(cc);}},
    setLayer(n,on){lg(n).visible=!!on;},layers:LAYERS,
    set night(v){night=v;},get night(){return night;},
    update(t,dt){const ph=Math.floor(t/6)%2,am=(t%6)>4.8;lights.forEach(L=>{const go=(ph===L.phase);L.bulbs[0].visible=!go;L.bulbs[1].visible=go&&am;L.bulbs[2].visible=go&&!am;});const hv=night>.3&&LY.headlights&&LY.headlights.visible;cars.forEach(c=>{if(c.lamps)c.lamps.visible=!!hv;});if(LY.catseyes)LY.catseyes.children.forEach(g=>g.material.color.setScalar(night>.3?1:.55));cars.forEach(c=>{const L=c.r.cv.getLength();c.t+=c.dir*c.v*dt/L;if(c.t>1||c.t<0){c.dir*=-1;c.t=Math.max(0,Math.min(1,c.t));}const p=c.r.cv.getPointAt(c.t),tg=c.r.cv.getTangentAt(c.t),nx=-tg.z,nz=tg.x,lane=(c.r.t.lw*(c.r.t.lanes/4+.5))*(c.dir>0?-1:1);/* drive on the left */
      c.C.position.set(p.x+nx*lane,c.r.yfn?c.r.yfn(p,c.t):0,p.z+nz*lane);c.C.rotation.y=-Math.atan2(tg.z,tg.x)+(c.dir<0?Math.PI:0);});},group};return api;}
g.RoadEngine={create,TYPES:Object.keys(TY)};})(typeof window!=='undefined'?window:this);
