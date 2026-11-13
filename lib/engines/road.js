/* Road Engine (Paul Perth Library, Nov 2026) — a road network as real 3D for three.js r128.
   const N=RoadEngine.create({scene,heightAt});
   N.road(pts,{type:'street'|'arterial'|'highway'|'lane',lanes,kerb:true,footpath:true,median:false})  -> id
   N.bridge(pts,{height,type})   N.build()   // finds junctions, cuts the roads back, fills each junction with its own pad,
                                             // adds zebra crossings on streets, stop lines, kerb returns and a roundabout where 4+ meet
   N.cars(n) adds simple traffic that drives the lanes (left-hand traffic, Australia).  N.update(t,dt)
   Roads are smooth Catmull-Rom ribbons that follow the ground (or ramp up to bridge decks), with painted lines drawn into one
   asphalt texture per road type: centre line (dashed or double), lane lines, edge lines; kerbs and footpaths are raised strips. */
(function(g){
const TY={street:{lanes:2,lw:1.5,line:'dash',kerb:.12,foot:1.2},arterial:{lanes:4,lw:1.6,line:'double',kerb:.14,foot:1.6,median:false},highway:{lanes:4,lw:1.8,line:'double',kerb:0,foot:0,median:true},lane:{lanes:2,lw:1.2,line:'none',kerb:.08,foot:0}};
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
  const api={
    road(pts,op){op=op||{};const t=Object.assign({},TY[op.type||'street'],op);const r={pts,t,type:op.type||'street',cv:new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal'),bridge:null};roads.push(r);return roads.length-1;},
    bridge(pts,op){const id=api.road(pts,op);roads[id].bridge=Object.assign({height:4},op);return id;},
    build(){/* junctions: where two roads come within a road width, both are cut back and a pad is laid */
      /* one junction per pair of roads, at their closest point; a bridge passes over the roads under it (no junction there) */
      const J=[],N=120;roads.forEach((a,ia)=>roads.forEach((b,ib)=>{if(ib<=ia)return;let best=1e9,ta=0,tb=0;const B=[];for(let k=0;k<=N;k++)B.push(b.cv.getPointAt(k/N));
        for(let i=0;i<=N;i++){const p=a.cv.getPointAt(i/N);for(let k=0;k<=N;k++){const d=p.distanceToSquared(B[k]);if(d<best){best=d;ta=i/N;tb=k/N;}}}
        if(Math.sqrt(best)>1.2)return;const lift=r=>r.bridge&&(t=>Math.min(t,1-t)*r.cv.getLength()>8);if((a.bridge&&lift(a)(ta))||(b.bridge&&lift(b)(tb)))return;
        const c=a.cv.getPointAt(ta).add(b.cv.getPointAt(tb)).multiplyScalar(.5);const near=J.find(j=>j.c.distanceTo(c)<3);
        if(near){[[ia,ta],[ib,tb]].forEach(e=>{if(!near.roads.some(q=>q[0]===e[0]))near.roads.push(e);});}else J.push({c,roads:[[ia,ta],[ib,tb]]});}));
      J.forEach(j=>{const ends=new Set();j.roads.forEach(([ri,t])=>{const r=roads[ri];if(t<.02||t>.98)ends.add(ri);});j.arms=j.roads.reduce((n,[ri,t])=>n+(t<.02||t>.98?1:2),0);});
      roads.forEach((r,ri)=>{const t=r.t,W=t.lanes*t.lw,L=r.cv.getLength();const cuts=[];J.forEach(j=>j.roads.forEach(([k,tt])=>{if(k===ri)cuts.push(tt);}));
        const brH=r.bridge?r.bridge.height:0;const yfn=(p,tt)=>{const g0=H(p.x,p.z);if(!brH)return g0;const ramp=Math.min(1,Math.min(tt,1-tt)*L/12);return Math.max(g0,g0+brH*Math.sin(ramp*Math.PI/2));};
        const segs=[];let s0=0;cuts.sort((a,b)=>a-b).forEach(c=>{const pad=(W/2+1.2)/L;if(c-pad>s0)segs.push([s0,c-pad]);s0=Math.min(1,c+pad);});if(s0<1)segs.push([s0,1]);
        segs.forEach(([a,b])=>{if(b-a<.002)return;ribbon(r.cv,a,b,-W/2,W/2,.03,yfn,8,mat(r.type),[0,1]);
          if(t.kerb){[-1,1].forEach(sd=>{wall(r.cv,a,b,sd*W/2,t.kerb,.0,yfn,'#c8c4ba');if(t.foot)ribbon(r.cv,a,b,sd*W/2,sd*(W/2+t.foot),t.kerb+.01,yfn,2,plain('#cfc9bc'),[0,1]);});}
          if(t.median)ribbon(r.cv,a,b,-.4,.4,.08,yfn,2,plain('#6a8a50'),[0,1]);
          if(brH){[-1,1].forEach(sd=>wall(r.cv,a,b,sd*(W/2+.2),.9,.03,yfn,'#d8d4cc'));const Lb=r.cv.getLength();for(let s=.1;s<.9;s+=10/Lb){const p=r.cv.getPointAt(s),y=yfn(p,s);if(y-H(p.x,p.z)<1)continue;const pier=new THREE.Mesh(new THREE.BoxGeometry(1,y,W*.8),plain('#bcb6aa'));pier.position.set(p.x,y/2,p.z);const tg=r.cv.getTangentAt(s);pier.rotation.y=-Math.atan2(tg.z,tg.x);pier.castShadow=true;group.add(pier);}}});
        r.yfn=yfn;r.W=W;});
      J.forEach(j=>{const r0=roads[j.roads[0][0]],W=Math.max(...j.roads.map(([k])=>roads[k].W)),y=H(j.c.x,j.c.z)+.03;const round=j.arms>=4&&W>=5&&j.roads.some(([k])=>roads[k].type==='arterial');
        const pad=new THREE.Mesh(new THREE.CircleGeometry(W/2+1.4,28),new THREE.MeshLambertMaterial({color:lin('#55585c'),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));pad.rotation.x=-Math.PI/2;pad.position.set(j.c.x,y,j.c.z);pad.receiveShadow=true;group.add(pad);
        if(round){const isl=new THREE.Mesh(new THREE.CylinderGeometry(W*.28,W*.3,.18,24),plain('#6a8a50'));isl.position.set(j.c.x,y+.09,j.c.z);group.add(isl);const kb=new THREE.Mesh(new THREE.TorusGeometry(W*.29,.06,6,32),plain('#e8e4dc'));kb.rotation.x=Math.PI/2;kb.position.set(j.c.x,y+.12,j.c.z);group.add(kb);}
        /* zebra crossings just outside the pad on streets */j.roads.forEach(([k,tt])=>{const r=roads[k];if(r.type!=='street'&&r.type!=='arterial')return;const L=r.cv.getLength();[-1,1].forEach(sd=>{const t2=tt+sd*(r.W/2+2.2)/L;if(t2<0||t2>1)return;const p=r.cv.getPointAt(t2),tg=r.cv.getTangentAt(t2),nx=-tg.z,nz=tg.x;
          for(let s=-r.W/2+.3;s<r.W/2-.2;s+=.6){const st=new THREE.Mesh(new THREE.PlaneGeometry(.35,1.4),new THREE.MeshLambertMaterial({color:0xf2efe6,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));st.rotation.x=-Math.PI/2;st.rotation.z=-Math.atan2(tg.z,tg.x)+Math.PI/2;st.position.set(p.x+nx*s,r.yfn(p,t2)+.05,p.z+nz*s);group.add(st);}});});});
      api.junctions=J;return J;},
    cars(n){const cols=['#c8344a','#f4f2ec','#2f6a74','#e8b860','#3e7d5c','#1d3a6e','#9aa0a6','#2a2a30'];for(let i=0;i<n;i++){const r=roads[i%roads.length];if(!r||r.bridge&&r.bridge.noCars)continue;const C=new THREE.Group(),c=cols[i%cols.length];
        const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.55,1),plain(c));b.position.y=.45;b.castShadow=true;C.add(b);const top=new THREE.Mesh(new THREE.BoxGeometry(1.2,.45,.9),plain('#2b3a4c'));top.position.set(-.15,.92,0);C.add(top);
        [[.7,.45],[.7,-.45],[-.7,.45],[-.7,-.45]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.16,10),plain('#1d1d22'));w.rotation.x=Math.PI/2;w.position.set(x,.22,z);C.add(w);});group.add(C);
        cars.push({C,r,t:Math.random(),dir:i%2?1:-1,v:(r.type==='highway'?9:5)*(.8+Math.random()*.4)});}},
    update(t,dt){cars.forEach(c=>{const L=c.r.cv.getLength();c.t+=c.dir*c.v*dt/L;if(c.t>1||c.t<0){c.dir*=-1;c.t=Math.max(0,Math.min(1,c.t));}const p=c.r.cv.getPointAt(c.t),tg=c.r.cv.getTangentAt(c.t),nx=-tg.z,nz=tg.x,lane=(c.r.t.lw*(c.r.t.lanes/4+.5))*(c.dir>0?-1:1);/* drive on the left */
      c.C.position.set(p.x+nx*lane,c.r.yfn?c.r.yfn(p,c.t):0,p.z+nz*lane);c.C.rotation.y=-Math.atan2(tg.z,tg.x)+(c.dir<0?Math.PI:0);});},group};return api;}
g.RoadEngine={create,TYPES:Object.keys(TY)};})(typeof window!=='undefined'?window:this);
