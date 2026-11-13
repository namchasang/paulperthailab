/* Terrain Engine (Paul Perth Library, Nov 2026) — natural ground for three.js r128.
   const T=TerrainEngine.create({size:[w,d],center:[x,z],res:0.5,heightAt:(x,z)=>h,seaLevel:0,paths:[{pts:[[x,z],...],w:1,kind:'path'|'lane'|'gravel'}],
                                 lakes:(x,z)=>0..1, palette:{...}});
   scene.add(T.mesh); each frame: T.update(time)
   What it does: one smooth ground mesh. Colour comes from what the ground is, worked out per pixel in the shader:
   - grass: five greens in soft patches (two noise layers), mowed stripes of light and dark, short blade strokes, a few dry tufts
   - sand: damp dark sand at the waterline, pale dry sand, golden at the back of the beach, speckles and wind ripples
   - dirt and rock on steep slopes; salt-lake pink where lakes(x,z) says so
   - paths, bike lanes and gravel beds baked into a mask texture, pressed slightly into the ground with soft worn edges
   Fields baked once on the CPU (height, slope, distance to water, path masks) into one texture, so the shader stays cheap.
   Quality: T.setQuality(0..2) changes the detail layers (blade strokes and speckles off on 0). */
(function(g){
const lin=h=>{const c=new THREE.Color(h);c.convertSRGBToLinear();return`vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`;};
const DEF={g0:'#44723a',g1:'#558841',g2:'#5f9146',g3:'#6a9b4b',g4:'#84aa5a',dry:'#a8a46a',sandW:'#b8ab8a',sand:'#f2ede0',sandB:'#e2d6b2',dirt:'#8a6a48',rock:'#9a948a',
  lake:'#e8a6b8',path:'#d9cfb4',pathE:'#bdb294',lane:'#7c7f82',laneL:'#f2efe6',gravel:'#8e8a82'};
function create(o){const P=Object.assign({},DEF,o.palette||{}),W=o.size[0],D=o.size[1],cx=(o.center||[0,0])[0],cz=(o.center||[0,0])[1],x0=cx-W/2,z0=cz-D/2,R=o.res||.5;
  const H=o.heightAt,SEA=o.seaLevel||0,NX=Math.ceil(W/R),NZ=Math.ceil(D/R);
  // ---- bake fields: r=height, g=distance to water (0..1 over 6 units), b=path kind mask, a=path edge softness ----
  const FW=Math.min(2048,Math.ceil(W*4)),FD=Math.min(2048,Math.ceil(D*4)),fd=new Float32Array(FW*FD*4),hf=THREE.DataUtils.toHalfFloat,hd=new Uint16Array(FW*FD*4);
  const wet=new Float32Array(FW*FD);for(let j=0;j<FD;j++)for(let i=0;i<FW;i++){const x=x0+(i+.5)/FW*W,z=z0+(j+.5)/FD*D,h=H(x,z);fd[(j*FW+i)*4]=h;wet[j*FW+i]=h<SEA?0:1e6;}
  {const s=W/FW,S2=Math.SQRT2;for(let j=0;j<FD;j++)for(let i=0;i<FW;i++){const k=j*FW+i;let d=wet[k];if(!d)continue;if(i)d=Math.min(d,wet[k-1]+1);if(j){d=Math.min(d,wet[k-FW]+1);if(i)d=Math.min(d,wet[k-FW-1]+S2);if(i<FW-1)d=Math.min(d,wet[k-FW+1]+S2);}wet[k]=d;}
    for(let j=FD-1;j>=0;j--)for(let i=FW-1;i>=0;i--){const k=j*FW+i;let d=wet[k];if(!d)continue;if(i<FW-1)d=Math.min(d,wet[k+1]+1);if(j<FD-1){d=Math.min(d,wet[k+FW]+1);if(i<FW-1)d=Math.min(d,wet[k+FW+1]+S2);if(i)d=Math.min(d,wet[k+FW-1]+S2);}wet[k]=d;}
    for(let k=0;k<wet.length;k++)fd[k*4+1]=Math.min(1,wet[k]*s/6);}
  const KIND={path:0,lane:1,gravel:2};const MW=Math.min(4096,Math.ceil(W*8)),MD=Math.min(4096,Math.ceil(D*8)),mk=new Float32Array(MW*MD*4);
  (o.paths||[]).forEach(p=>{const kv=KIND[p.kind||'path']||0,hw=(p.w||1)/2,pts=p.pts;for(let n=1;n<pts.length;n++){const a=pts[n-1],b=pts[n],mnx=Math.min(a[0],b[0])-hw-1,mxx=Math.max(a[0],b[0])+hw+1,mnz=Math.min(a[1],b[1])-hw-1,mxz=Math.max(a[1],b[1])+hw+1;
      const i0=Math.max(0,Math.floor((mnx-x0)/W*MW)),i1=Math.min(MW-1,Math.ceil((mxx-x0)/W*MW)),j0=Math.max(0,Math.floor((mnz-z0)/D*MD)),j1=Math.min(MD-1,Math.ceil((mxz-z0)/D*MD));
      const vx=b[0]-a[0],vz=b[1]-a[1],L2=vx*vx+vz*vz||1e-6;for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=x0+(i+.5)/MW*W,z=z0+(j+.5)/MD*D;let t=((x-a[0])*vx+(z-a[1])*vz)/L2;t=Math.max(0,Math.min(1,t));const d=Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);
        const e=1-Math.max(0,Math.min(1,(d-hw+.3)/.6));const k=(j*MW+i)*4+kv;if(e>mk[k])mk[k]=e;}}});
  if(o.lakes)for(let j=0;j<MD;j++)for(let i=0;i<MW;i++){mk[(j*MW+i)*4+3]=Math.max(0,Math.min(1,o.lakes(x0+(i+.5)/MW*W,z0+(j+.5)/MD*D)));}
  /* a small blur so every mask edge is soft at any scale */{const T=new Float32Array(mk.length);for(let pass=0;pass<2;pass++){const A=pass?T:mk,Bv=pass?mk:T;for(let j=0;j<MD;j++)for(let i=0;i<MW;i++)for(let c=0;c<4;c++){let a=0,n=0;for(let d=-1;d<=1;d++){const ii=pass?i:i+d,jj=pass?j+d:j;if(ii<0||jj<0||ii>=MW||jj>=MD)continue;a+=A[(jj*MW+ii)*4+c];n++;}Bv[(j*MW+i)*4+c]=a/n;}}}
  const mh=new Uint16Array(mk.length);for(let k=0;k<mk.length;k++)mh[k]=hf(mk[k]);const MT=new THREE.DataTexture(mh,MW,MD,THREE.RGBAFormat,THREE.HalfFloatType);MT.magFilter=MT.minFilter=THREE.LinearFilter;MT.needsUpdate=true;
  for(let k=0;k<fd.length;k++)hd[k]=hf(fd[k]);
  const FT=new THREE.DataTexture(hd,FW,FD,THREE.RGBAFormat,THREE.HalfFloatType);FT.magFilter=FT.minFilter=THREE.LinearFilter;FT.needsUpdate=true;
  // ---- mesh: heights from heightAt, paths pressed 3 cm in ----
  const geo=new THREE.PlaneGeometry(W,D,NX,NZ);geo.rotateX(-Math.PI/2);geo.translate(cx,0,cz);const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);let h=H(x,z);const u=Math.floor((x-x0)/W*FW),v=Math.floor((z-z0)/D*FD);{const mu=Math.floor((x-x0)/W*MW),mv=Math.floor((z-z0)/D*MD);if(mu>=0&&mv>=0&&mu<MW&&mv<MD){const k=(mv*MW+mu)*4;const pw=Math.max(mk[k],mk[k+1],mk[k+2]);h-=.03*pw;const lw=mk[k+3];h-=.12*lw;}}pos.setY(i,h);}
  geo.computeVertexNormals();
  const U={tM:{value:MT},tF:{value:FT},uB:{value:new THREE.Vector4(x0,z0,W,D)},uT:{value:0},uQ:{value:2},uSea:{value:SEA}};
  const m=new THREE.MeshLambertMaterial({color:0xffffff});
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
    s.vertexShader='varying vec3 vTW;varying vec3 vTN;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvTW=(modelMatrix*vec4(transformed,1.)).xyz;vTN=normalize(mat3(modelMatrix)*objectNormal);');
    s.fragmentShader=`varying vec3 vTW;varying vec3 vTN;uniform sampler2D tF,tM;uniform vec4 uB;uniform float uT,uQ,uSea;
float th(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float tn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(th(i),th(i+vec2(1,0)),f.x),mix(th(i+vec2(0,1)),th(i+1.),f.x),f.y);}
float tf(vec2 p){return tn(p)*.5+tn(p*2.03+7.)*.3+tn(p*4.1+3.)*.2;}
vec3 grass(vec2 q){float a=tf(q*.17),b=tf(q*.65+vec2(7.,3.)),sp=tn(q*6.)-.5;float t=a*.62+b*.38+sp*.18;
  vec3 c=t<.32?${lin(P.g0)}:t<.46?mix(${lin(P.g0)},${lin(P.g1)},smoothstep(.29,.35,t)):t<.6?mix(${lin(P.g1)},${lin(P.g2)},smoothstep(.43,.49,t)):t<.72?mix(${lin(P.g2)},${lin(P.g3)},smoothstep(.57,.63,t)):mix(${lin(P.g3)},${lin(P.g4)},smoothstep(.69,.75,t));
  if(uQ>.5){float bl=tn(vec2(q.x*7.,q.y*2.2))*.55+tn(vec2(q.x*2.4,q.y*8.))*.25+tn(q*21.)*.2;c*=.8+.4*bl;}
  c=mix(c,${lin(P.dry)},smoothstep(.78,.92,tf(q*.09+11.))*.45);c*=.93+.14*tn(q*.3);return c;}
vec3 sand(vec2 q,float u){vec3 c=u<.12?mix(${lin(P.sandW)},${lin(P.sand)},u/.12):u<.7?${lin(P.sand)}:mix(${lin(P.sand)},${lin(P.sandB)},(u-.7)/.3);
  if(uQ>.5){c*=.97+.06*tn(q*9.);float h=th(floor(q*24.));if(h>.985)c*=1.06;else if(h<.012)c*=.85;}c*=1.-.04*max(0.,sin(q.x*3.2+sin(q.y*.7)*1.6+tn(q*.4)*3.))*(1.-u);return c;}
`+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
{vec2 q=vTW.xz;vec4 F=texture2D(tF,(q-uB.xy)/uB.zw);float h=F.r,dw=F.g;float slope=1.-clamp(vTN.y,0.,1.);
 float beachW=.55+.2*tn(q*.3);/* 0..1 of 6 units: a 3-4 unit beach */float u=clamp(dw/beachW,0.,1.);/* 0 at the water .. 1 at the back of the beach */
 vec3 c=grass(q);float sa=1.-smoothstep(.85,1.,u);sa*=1.-smoothstep(uSea+1.3,uSea+2.2,h);c=mix(c,sand(q,u),sa);
 if(h<uSea)c=sand(q,0.)*mix(1.,.82,smoothstep(0.,1.,uSea-h));
 c=mix(c,${lin(P.dirt)}*(.85+.3*tn(q*3.)),smoothstep(.25,.4,slope)*(1.-sa));c=mix(c,${lin(P.rock)}*(.8+.4*tf(q*2.)),smoothstep(.45,.6,slope));
 vec4 Mk=texture2D(tM,(q-uB.xy)/uB.zw);
 /* salt lake: wet shore band and a pale salt crust ring blend softly into the grass */
 {float lw=Mk.a;if(lw>.002){vec3 lk=${lin(P.lake)}*(.92+.1*tn(q*.8));float crust=smoothstep(.05,.3,lw)*(1.-smoothstep(.35,.7,lw));vec3 rim=mix(vec3(.82,.78,.72),vec3(.97,.94,.92),tn(q*3.));
   vec3 wetg=c*.78;c=mix(c,wetg,smoothstep(.0,.15,lw));c=mix(c,rim,crust*.9);c=mix(c,lk,smoothstep(.4,.75,lw));}}
 /* gravel, then lane, then path on top: each by its own soft weight, so junctions meet smoothly */
 {float gw=Mk.b;if(gw>.002){vec3 gc=${lin(P.gravel)}*(.78+.44*th(floor(q*14.)));c=mix(c,gc,smoothstep(.15,.6,gw));}}
 {float lw=Mk.g;if(lw>.002){vec3 lc=${lin(P.lane)}*(.92+.12*tn(q*12.));float line=smoothstep(.45,.55,lw)*(1.-smoothstep(.62,.74,lw));lc=mix(lc,${lin(P.laneL)},line*.9);c=mix(c,lc,smoothstep(.2,.5,lw));}}
 {float pw=Mk.r;if(pw>.002){vec3 pc=${lin(P.path)}*(.9+.15*tn(q*5.)+.08*(th(floor(q*20.))-.5));pc=mix(${lin(P.pathE)},pc,smoothstep(.35,.75,pw));c=mix(c,pc,smoothstep(.15,.5,pw)*(1.-Mk.g*.0));}}
 diffuseColor.rgb=c;}`);};
  m.customProgramCacheKey=()=>'terrainE';
  const mesh=new THREE.Mesh(geo,m);mesh.receiveShadow=true;mesh.name='terrainEngine';
  return{mesh,material:m,uniforms:U,fields:FT,heightAt:H,update:t=>{U.uT.value=t;},setQuality:q=>{U.uQ.value=q;},dispose:()=>{geo.dispose();m.dispose();FT.dispose();MT.dispose();}};}
g.TerrainEngine={create};})(typeof window!=='undefined'?window:this);
