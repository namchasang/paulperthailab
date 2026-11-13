/* Water Life layers for the Water Sea Engine (Paul Perth Library, Nov 2026).
   const WL=WaterLife.create({scene,heightAt,level:0,bounds:[x0,z0,x1,z1]});  each frame WL.update(t,dt)   WL.setLayer(name,on)
   Layers: seagrass (swaying blades on the sandy shelf), fishschools (little silver fish that turn together), kelp (floating weed
   at the surface), searocks (limestone reef rocks with weed and foam rings), shells (shells and starfish on the seabed),
   jellyfish (slow see-through bells out deeper), glints (sun sparkles on the water), stingray (a ray gliding over the sand). */
(function(g){
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
function rnd(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function create(o){const scene=o.scene,H=o.heightAt,L=o.level||0,B=o.bounds||[-60,-60,60,60],r=rnd(o.seed||3),root=new THREE.Group();root.name='waterLife';scene.add(root);const LAY={};const add=(n,obj)=>{LAY[n]=obj;root.add(obj);return obj;};
  const where=(d0,d1)=>{for(let i=0;i<60;i++){const x=B[0]+r()*(B[2]-B[0]),z=B[1]+r()*(B[3]-B[1]),d=L-H(x,z);if(d>d0&&d<d1)return[x,z,d];}return null;};
  const U={uT:{value:0}};
  // seagrass: instanced ribbons that sway
  {const n=1600,geo=new THREE.PlaneGeometry(.06,.7,1,4);geo.translate(0,.35,0);const m=new THREE.MeshLambertMaterial({color:lin('#3f7a4a'),side:THREE.DoubleSide});
    m.onBeforeCompile=s=>{s.uniforms.uT=U.uT;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);float k=transformed.y/.7;transformed.x+=sin(uT*1.3+wp.x*.7+wp.z*.4)*.18*k*k;transformed.z+=cos(uT*1.1+wp.x*.5)*.1*k*k;');};
    const im=new THREE.InstancedMesh(geo,m,n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);let k=0;for(let i=0;i<n*3&&k<n;i++){const p=where(.5,2.6);if(!p)break;const cx=p[0],cz=p[1];for(let j=0;j<8&&k<n;j++){const x=cx+(r()-.5)*1.4,z=cz+(r()-.5)*1.4;q.setFromAxisAngle(Y,r()*6.28);const s=.6+r()*.7;m4.compose(new THREE.Vector3(x,H(x,z),z),q,new THREE.Vector3(1,s,1));im.setMatrixAt(k++,m4);}}im.count=k;add('seagrass',im);}
  // fish schools
  const schools=[];{const fg=new THREE.ConeGeometry(.05,.22,5);fg.rotateX(Math.PI/2);const fm=new THREE.MeshLambertMaterial({color:lin('#c8d4dc'),emissive:lin('#203038')});const G=new THREE.Group();
    for(let s=0;s<5;s++){const p=where(.8,3);if(!p)continue;const n=24,im=new THREE.InstancedMesh(fg,fm,n);const f=[];for(let i=0;i<n;i++)f.push([(r()-.5)*1.6,(r()-.5)*.3,(r()-.5)*1.6,r()*6]);schools.push({im,c:[p[0],p[1]],f,a:r()*6,R:2+r()*3,v:.25+r()*.2});G.add(im);}add('fishschools',G);}
  // kelp: floating dark weed rafts
  {const G=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:lin('#5a4a22'),transparent:true,opacity:.85,side:THREE.DoubleSide});for(let i=0;i<14;i++){const p=where(1.2,6);if(!p)break;const sh=new THREE.Shape();const n=9;for(let k=0;k<=n;k++){const a=k/n*6.28,rr=.6+r()*.7;k?sh.lineTo(Math.cos(a)*rr*1.6,Math.sin(a)*rr):sh.moveTo(Math.cos(a)*rr*1.6,Math.sin(a)*rr);}
    const me=new THREE.Mesh(new THREE.ShapeGeometry(sh),m);me.rotation.x=-Math.PI/2;me.position.set(p[0],L+.02,p[1]);me.userData.ph=r()*6;G.add(me);}add('kelp',G);}
  // sea rocks: reef outcrops breaking the surface
  {const G=new THREE.Group(),rm=new THREE.MeshLambertMaterial({color:lin('#8a8070'),flatShading:true}),wm=new THREE.MeshLambertMaterial({color:lin('#3e5a2e')});for(let i=0;i<7;i++){const p=where(.6,2.2);if(!p)break;const R=.6+r()*1.1,geo=new THREE.IcosahedronGeometry(R,1),pp=geo.attributes.position;for(let k=0;k<pp.count;k++){const v=new THREE.Vector3().fromBufferAttribute(pp,k);v.multiplyScalar(.75+r()*.45);pp.setXYZ(k,v.x,v.y*.7,v.z);}geo.computeVertexNormals();
    const me=new THREE.Mesh(geo,rm);me.position.set(p[0],L-p[2]*.25,p[1]);me.castShadow=true;G.add(me);const w=new THREE.Mesh(new THREE.TorusGeometry(R*.9,.12,6,14),wm);w.rotation.x=Math.PI/2;w.position.set(p[0],L-.18,p[1]);G.add(w);}add('searocks',G);}
  // shells and starfish on the seabed
  {const G=new THREE.Group(),cols=['#f4e8d8','#f2b8a0','#e8d0a8','#f08a5a'];for(let i=0;i<70;i++){const p=where(.05,1.8);if(!p)break;let me;if(r()<.3){const sh=new THREE.Shape();for(let k=0;k<=10;k++){const a=k/10*6.28,rr=k%2?.05:.14;k?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}me=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshLambertMaterial({color:lin('#e8743a')}));me.rotation.x=-Math.PI/2;}
    else{me=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshLambertMaterial({color:lin(cols[i%4])}));me.scale.set(1.2,.5,1);}me.position.set(p[0],H(p[0],p[1])+.02,p[1]);G.add(me);}add('shells',G);}
  // jellyfish
  {const G=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:lin('#d8c8f0'),transparent:true,opacity:.45,emissive:lin('#403050')});for(let i=0;i<8;i++){const p=where(2,6);if(!p)break;const J=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8,0,6.28,0,1.6),m);J.add(b);for(let k=0;k<5;k++){const tt=new THREE.Mesh(new THREE.CylinderGeometry(.008,.004,.5,4),m);tt.position.set(Math.cos(k*1.25)*.12,-.25,Math.sin(k*1.25)*.12);J.add(tt);}J.position.set(p[0],L-.6-r()*.8,p[1]);J.userData={ph:r()*6,b};G.add(J);}add('jellyfish',G);}
  // glints: twinkling sparkles on the surface
  {const n=400,gg=new THREE.BufferGeometry(),pp=new Float32Array(n*3),ph=new Float32Array(n);for(let i=0;i<n;i++){const p=where(.3,99)||[0,0];pp[i*3]=p[0];pp[i*3+1]=L+.03;pp[i*3+2]=p[1];ph[i]=r()*6.28;}gg.setAttribute('position',new THREE.BufferAttribute(pp,3));gg.setAttribute('ph',new THREE.BufferAttribute(ph,1));
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:U,vertexShader:'attribute float ph;uniform float uT;varying float vA;void main(){vA=pow(max(0.,sin(uT*2.3+ph*7.)),12.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=10.*vA*(30./-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying float vA;void main(){vec2 d=gl_PointCoord-.5;float c=max(0.,1.-length(d)*2.);c=pow(c,3.)+max(0.,1.-abs(d.x)*14.)*max(0.,1.-abs(d.y)*2.)*.6+max(0.,1.-abs(d.y)*14.)*max(0.,1.-abs(d.x)*2.)*.6;gl_FragColor=vec4(vec3(1.,.98,.9),c*vA);}'});const P=new THREE.Points(gg,m);P.frustumCulled=false;add('glints',P);}
  // stingray
  {const p=where(.6,2)||[0,0,1];const sh=new THREE.Shape();sh.moveTo(0,.5);sh.quadraticCurveTo(.7,.2,.8,-.1);sh.quadraticCurveTo(.3,-.2,0,-.45);sh.quadraticCurveTo(-.3,-.2,-.8,-.1);sh.quadraticCurveTo(-.7,.2,0,.5);const me=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshLambertMaterial({color:lin('#6a6058'),side:THREE.DoubleSide}));me.rotation.x=-Math.PI/2;
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.01,.02,.9,4),me.material);t.rotation.x=Math.PI/2;t.position.set(0,0,-.8);const G=new THREE.Group();G.add(me,t);G.userData={c:[p[0],p[1]]};add('stingray',G);}
  const api={layers:Object.keys(LAY),setLayer(n,on){if(LAY[n])LAY[n].visible=on;},
    update(t,dt){U.uT.value=t;const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
      schools.forEach(S=>{S.a+=dt*S.v;const cx=S.c[0]+Math.cos(S.a)*S.R,cz=S.c[1]+Math.sin(S.a)*S.R,h=Math.atan2(-Math.sin(S.a),Math.cos(S.a))+Math.PI/2,bed=H(cx,cz),y=(L+bed)/2;
        S.f.forEach((f,i)=>{e.set(0,-S.a+Math.PI,Math.sin(t*6+f[3])*.15);q.setFromEuler(e);m4.compose(new THREE.Vector3(cx+f[0]+Math.sin(t+f[3])*.1,y+f[1],cz+f[2]),q,new THREE.Vector3(1,1,1));S.im.setMatrixAt(i,m4);});S.im.instanceMatrix.needsUpdate=true;});
      LAY.kelp.children.forEach(k=>{k.position.y=L+.02+Math.sin(t+k.userData.ph)*.03;k.rotation.z=Math.sin(t*.2+k.userData.ph)*.2;});
      LAY.jellyfish.children.forEach(J=>{const u=J.userData;J.position.y+=Math.sin(t*1.2+u.ph)*.002;u.b.scale.set(1+Math.sin(t*2+u.ph)*.12,1-Math.sin(t*2+u.ph)*.1,1+Math.sin(t*2+u.ph)*.12);});
      {const G=LAY.stingray,c=G.userData.c,a=t*.15;G.position.set(c[0]+Math.cos(a)*4,0,c[1]+Math.sin(a)*4);G.position.y=H(G.position.x,G.position.z)+.15;G.rotation.y=-a;G.children[0].rotation.y=Math.sin(t*2)*.12;}}};return api;}
g.WaterLife={create};})(typeof window!=='undefined'?window:this);
