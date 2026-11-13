/* Foliage Engine (Paul Perth Library, Nov 2026) — grass tufts, flowers, bushes and trees for three.js r128.
   const F=FoliageEngine.create({scene,bounds:[x0,z0,x1,z1],heightAt,kindAt:(x,z)=>'grass'|'sand'|'path'|'water'|'none',
                                  density:{tuft:2.2,flower:.35,bush:.03,tree:.012},keepOut:(x,z)=>bool,seed:1,chunk:10,radius:40,palette});
   each frame: F.update(time,camX,camZ)   // builds chunks near the camera, drops far ones, sways everything in the wind
   F.setWind(strength)  F.setQuality(0..2)  F.addTree(x,z,{kind:'gum'|'pine'|'peppermint'|'palm',size})
   What it does: everything is instanced (one draw per kind per chunk). Tufts and flowers are crossed painted cards; bushes and tree
   crowns are leaf-card clusters with crown-shaped normals (they shade like soft balls) and cast dappled shadows through the cards.
   Grass bends from the root, crowns sway from the trunk; the wind is a travelling gust field so neighbours move together. */
(function(g){
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
function rnd(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tuftTex(flowers,pal){const c=canvas(128,128),x=c.getContext('2d'),r=rnd(flowers?7:3);
  for(let i=0;i<40;i++){const x0=64+(r()-.5)*30,a=-Math.PI/2+(r()-.5)*1.2,l=50+r()*64;x.strokeStyle=pal.blades[(r()*pal.blades.length)|0];x.lineWidth=2.5+r()*2;x.lineCap='round';x.beginPath();x.moveTo(x0,128);
    x.quadraticCurveTo(x0+Math.cos(a)*l*.45,128+Math.sin(a)*l*.5,x0+Math.cos(a)*l,128+Math.sin(a)*l);x.stroke();}
  if(flowers)for(let i=0;i<8;i++){const fx=24+r()*80,fy=14+r()*46,col=pal.flowers[(r()*pal.flowers.length)|0];x.strokeStyle='#4f7a3a';x.lineWidth=1.6;x.beginPath();x.moveTo(fx,fy);x.lineTo(fx+(r()-.5)*6,128);x.stroke();
    x.fillStyle=col;for(let k=0;k<5;k++){const a=k/5*6.283;x.beginPath();x.arc(fx+Math.cos(a)*3.4,fy+Math.sin(a)*3.4,3,0,6.283);x.fill();}x.fillStyle='#f0b030';x.beginPath();x.arc(fx,fy,2,0,6.283);x.fill();}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function leafTex(cols,seed){const c=canvas(128,128),x=c.getContext('2d'),r=rnd(seed);for(let i=0;i<70;i++){const px=14+r()*100,py=14+r()*100;if(Math.hypot(px-64,py-64)>54)continue;const a=r()*6.283;x.save();x.translate(px,py);x.rotate(a);
    x.fillStyle=cols[(r()*cols.length)|0];x.beginPath();x.ellipse(0,0,10,4.5,0,0,6.283);x.fill();x.restore();}const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
const WIND=`uniform float uT,uWind;vec2 windAt(vec2 p){float g=sin(p.x*.13+uT*1.1)*.5+sin(p.y*.17+uT*.8+p.x*.05)*.5;return vec2(.8,.3)*(.35+.65*(g*.5+.5))*uWind;}`;
function swayMat(map,opts){const m=new THREE.MeshLambertMaterial(Object.assign({map,alphaTest:.5,side:THREE.DoubleSide},opts.mat||{}));const U=opts.U;
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=WIND+'\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    {vec4 wp=modelMatrix*instanceMatrix*vec4(transformed,1.);float k=${opts.bend};float w=pow(max(transformed.y,0.)/${opts.h.toFixed(3)},${opts.pow.toFixed(2)})*k;vec2 d=windAt(wp.xz)*w;
     d+=vec2(sin(uT*3.1+wp.x*1.7),cos(uT*2.7+wp.z*1.9))*.04*w*uWind;mat3 IR=transpose(mat3(instanceMatrix));transformed+=IR*vec3(d.x,0.,d.y);}`);
    /* crowns: normals point out from the crown centre (plus a little up) so the cluster shades like one soft ball */
    if(opts.crown)s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(position-vec3(0.,'+opts.cy+',0.)+vec3(0.,.35,0.));');};
  m.customProgramCacheKey=()=>'fol'+opts.key;return m;}
function cards(n,r0,h,seed){/* crossed cards for tufts: two quads */const P=[],U=[],I=[];for(let k=0;k<n;k++){const a=k/n*Math.PI,cx=Math.cos(a)*r0,cz=Math.sin(a)*r0,b=k*4;
    [[-1,0,0,0],[1,0,1,0],[1,h,1,1],[-1,h,0,1]].forEach(([s,y,u,v])=>{P.push(cx*s,y,cz*s);U.push(u,v);});I.push(b,b+1,b+2,b,b+2,b+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
  const nr=g.attributes.normal;for(let i=0;i<nr.count;i++)nr.setXYZ(i,0,1,.2);return g;}
function crown(R,n,cy,seed){/* leaf cards spread over a ball of radius R at height cy */const r=rnd(seed),P=[],U=[],I=[];for(let k=0;k<n;k++){let x,y,z;do{x=r()*2-1;y=r()*2-1;z=r()*2-1;}while(x*x+y*y+z*z>1);
    const px=x*R,py=cy+y*R*.8,pz=z*R,s=R*(.45+r()*.3),a=r()*6.283,b=r()*6.283;const ax=new THREE.Vector3(Math.cos(a),0,Math.sin(a)),ay=new THREE.Vector3(Math.sin(b)*.3,1,Math.cos(b)*.3).normalize();const base=k*4;
    [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]].forEach(([u,v,tu,tv])=>{P.push(px+ax.x*u*s+ay.x*v*s,py+ax.y*u*s+ay.y*v*s,pz+ax.z*u*s+ay.z*v*s);U.push(tu,tv);});I.push(base,base+1,base+2,base,base+2,base+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return g;}
function merge(geos){const P=[],U=[],N=[],I=[];let o=0;geos.forEach(g=>{const p=g.attributes.position,u=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));U.push(u?u.getX(i):0,u?u.getY(i):0);N.push(n.getX(i),n.getY(i),n.getZ(i));}
    const ix=g.index?g.index.array:[...Array(p.count).keys()];ix.forEach(v=>I.push(v+o));o+=p.count;});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setIndex(I);return g;}
const DEFPAL={blades:['#3f6e34','#558841','#6a9a4a','#85b25a','#9fc56a'],flowers:['#ffffff','#f6e27a','#c9a2f0','#f5a3c0','#ffffff','#f08a5a'],
  bush:['#2f5a2a','#3e6e34','#4f8240','#5f9448'],gum:['#4a6a44','#5a7a50','#6b8a5a','#7c9a68'],pine:['#22462e','#2c5636','#376640','#2a4a32'],pepper:['#3c6a36','#4c7c40','#5e8e4c','#6f9e56'],palm:['#3f7a3a','#4f8c44','#5f9c4e'],
  bark:{gum:'#d8cfc0',pine:'#5a3a26',pepper:'#6a4a32',palm:'#8a7458'}};
function create(o){const scene=o.scene,H=o.heightAt,K=o.kindAt,B=o.bounds,CS=o.chunk||10,RAD=o.radius||40,pal=Object.assign({},DEFPAL,o.palette||{}),D=Object.assign({tuft:2.2,flower:.35,bush:.03,tree:.012},o.density||{});
  const U={uT:{value:0},uWind:{value:o.wind==null?1:o.wind}};let Q=2;
  const tuftG=cards(2,.32,.5),tM=swayMat(tuftTex(false,pal),{U,bend:'.28',h:.5,pow:1.6,key:'t'}),fM=swayMat(tuftTex(true,pal),{U,bend:'.3',h:.5,pow:1.6,key:'f'});
  const bushG=crown(.55,26,.45,5),bM=swayMat(leafTex(pal.bush,11),{U,bend:'.05',h:1,pow:1,crown:true,cy:'.45',key:'b',mat:{emissive:lin('#0a1406')}});
  const KINDS={gum:{h:6.5,R:2.2,n:70,trunk:.22},pine:{h:7.5,R:1.6,n:60,trunk:.2,cone:true},pepper:{h:4.2,R:2,n:60,trunk:.18,droop:true},palm:{h:5.5,R:1.8,n:30,trunk:.16,fronds:true}};
  const TR={};for(const k in KINDS){const s=KINDS[k];let cg;
    if(s.cone){const parts=[];for(let t=0;t<5;t++){const y=s.h*.35+t*s.h*.13,R=s.R*(1-t*.17);parts.push(crown(R,Math.round(s.n/5),y,20+t));}cg=merge(parts);}
    else if(s.fronds){const P=[],U2=[],I=[];for(let f=0;f<9;f++){const a=f/9*6.283,base=f*4,L=s.R*1.4,dx=Math.cos(a),dz=Math.sin(a);[[0,s.h,0,0,0],[dx*L,s.h-.9,dz*L,1,0],[dx*L-dz*.35,s.h-.7,dz*L+dx*.35,1,1],[-dz*.35,s.h+.1,dx*.35,0,1]].forEach(([x,y,z,u,v])=>{P.push(x,y,z);U2.push(u,v);});I.push(base,base+1,base+2,base,base+2,base+3);}
      cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));cg.setAttribute('uv',new THREE.Float32BufferAttribute(U2,2));cg.setIndex(I);cg.computeVertexNormals();}
    else{const parts=[crown(s.R,s.n,s.h*.72,30+k.length)];for(let t=0;t<3;t++){const a=t*2.1;const c=crown(s.R*.6,Math.round(s.n*.3),0,40+t);c.translate(Math.cos(a)*s.R*.7,s.h*(s.droop?.55:.62),Math.sin(a)*s.R*.7);parts.push(c);}cg=merge(parts);}
    const lt=leafTex(pal[k==='pepper'?'pepper':k],60+k.length);const cm=swayMat(lt,{U,bend:'.12',h:s.h,pow:2,crown:true,cy:(s.h*.7).toFixed(2),key:'c'+k,mat:{emissive:lin('#081004')}});
    const dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lt,alphaTest:.5});
    const tg=new THREE.CylinderGeometry(s.trunk*.6,s.trunk,s.h*.78,7);tg.translate(0,s.h*.39,0);const tm=new THREE.MeshLambertMaterial({color:lin(pal.bark[k])});
    TR[k]={s,cg,cm,dm,tg,tm};}
  const chunks=new Map(),extra=[];
  function inst(geo,mat,list,shadow,depth){if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);
    list.forEach((e,i)=>{q.setFromAxisAngle(Y,e[3]);m4.compose(new THREE.Vector3(e[0],e[1],e[2]),q,new THREE.Vector3(e[4],e[4]*(e[5]||1),e[4]));im.setMatrixAt(i,m4);});
    im.receiveShadow=true;im.castShadow=!!shadow;if(depth)im.customDepthMaterial=depth;im.frustumCulled=false;im.__pxSkip=1;scene.add(im);return im;}
  function build(ci,cj){const r=rnd((ci*73856093)^(cj*19349663)^(o.seed||1)),L={t:[],f:[],b:[]},T={};for(const k in TR)T[k]=[];const area=CS*CS;
    const place=(n,cb)=>{for(let k=0;k<n;k++){const x=(ci+r())*CS,z=(cj+r())*CS;if(x<B[0]||x>B[2]||z<B[1]||z>B[3])continue;if(o.keepOut&&o.keepOut(x,z))continue;cb(x,z,K(x,z));}};
    const qm=Q===0?.35:Q===1?.65:1;
    place(Math.round(area*D.tuft*qm),(x,z,k)=>{if(k!=='grass')return;L.t.push([x,H(x,z),z,r()*6.28,.7+r()*.6,.8+r()*.5]);});
    place(Math.round(area*D.flower*qm),(x,z,k)=>{if(k!=='grass')return;L.f.push([x,H(x,z),z,r()*6.28,.7+r()*.4,1]);});
    place(Math.round(area*D.bush+r()),(x,z,k)=>{if(k!=='grass'&&k!=='sand')return;L.b.push([x,H(x,z)-.05,z,r()*6.28,.7+r()*.7,.8+r()*.3]);});
    place(Math.round(area*D.tree+r()*.6),(x,z,k)=>{if(k!=='grass')return;const ks=o.treeKinds||['gum','pepper','pine'];const kk=ks[(r()*ks.length)|0];T[kk].push([x,H(x,z),z,r()*6.28,.75+r()*.5,1]);});
    const ms=[inst(tuftG,tM,L.t),inst(tuftG,fM,L.f),inst(bushG,bM,L.b,true)];for(const k in T){if(!T[k].length)continue;ms.push(inst(TR[k].tg,TR[k].tm,T[k],true),inst(TR[k].cg,TR[k].cm,T[k],true,TR[k].dm));}
    return ms.filter(Boolean);}
  let lx=1e9,lz=1e9;
  return{uniforms:U,
    update(t,x,z){U.uT.value=t;if(Math.hypot(x-lx,z-lz)<3)return;let made=0;
      const i0=Math.floor((x-RAD)/CS),i1=Math.floor((x+RAD)/CS),j0=Math.floor((z-RAD)/CS),j1=Math.floor((z+RAD)/CS);
      for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i+','+j;if(chunks.has(k)||made>=4)continue;if((i+1)*CS<B[0]||i*CS>B[2]||(j+1)*CS<B[1]||j*CS>B[3]){chunks.set(k,[]);continue;}chunks.set(k,build(i,j));made++;}
      if(made>=4)lx=1e9;else{lx=x;lz=z;}
      chunks.forEach((ms,k)=>{const[i,j]=k.split(',').map(Number);if(Math.hypot((i+.5)*CS-x,(j+.5)*CS-z)>RAD+CS*2){ms.forEach(m=>{scene.remove(m);m.dispose();});chunks.delete(k);}});},
    setWind:w=>{U.uWind.value=w;},setQuality(q){Q=q;chunks.forEach(ms=>ms.forEach(m=>{scene.remove(m);m.dispose();}));chunks.clear();lx=1e9;},
    addTree(x,z,op){op=op||{};const k=TR[op.kind||'gum'];const e=[[x,H(x,z),z,op.rot||0,op.size||1,1]];extra.push(inst(k.tg,k.tm,e,true),inst(k.cg,k.cm,e,true,k.dm));},
    count(){let n=0;chunks.forEach(ms=>ms.forEach(m=>n+=m.count));return n;}};}
g.FoliageEngine={create};})(typeof window!=='undefined'?window:this);
