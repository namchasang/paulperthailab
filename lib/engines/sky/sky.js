/* Sky & Weather Engine (Paul Perth Library, Nov 2026) — sky, sun, light and weather for three.js r128.
   const S=SkyEngine.create({scene,renderer,sun:DirectionalLight,hemi:HemisphereLight,fog:true,lat:-32,radius:400});
   each frame: S.update(dt,{hour:0..24, target:Vector3})   // moves the sun, sets light colours, sky dome, fog, stars, clouds
   S.setWeather('sunny'|'breezy'|'golden'|'clear-night')   S.setTime(hour)   S.state -> {sunDir,sunColor,skyColor,night}
   What it does: a sky dome with a real gradient (deep blue overhead to pale haze at the horizon), a soft sun disc and glow, warm
   dawn and dusk bands, stars and a moon at night, a few high fair-weather clouds that drift with the wind. The sun light follows the
   time of day (warm and low at the ends, white at noon), the hemisphere light takes the sky and ground bounce colours, fog matches
   the horizon. Weathers only change wind, cloud and haze (Paul: no rain or grey days). */
(function(g){
const C=h=>new THREE.Color(h);
const WX={sunny:{cloud:.18,haze:.25,wind:.6},breezy:{cloud:.3,haze:.2,wind:1.4},golden:{cloud:.12,haze:.45,wind:.4},'clear-night':{cloud:.05,haze:.15,wind:.3}};
function create(o){const scene=o.scene,sun=o.sun,hemi=o.hemi,RADIUS=o.radius||400;let hour=o.hour==null?10:o.hour,wx=Object.assign({},WX.sunny),wxT=Object.assign({},WX.sunny),cloudOff=0;
  const U={uSun:{value:new THREE.Vector3(0,1,0)},uTop:{value:C('#2f7fd6')},uHor:{value:C('#bfe4f6')},uGlow:{value:C('#ffd9a0')},uNight:{value:0},uCloud:{value:.2},uT:{value:0},uOff:{value:new THREE.Vector2()}};
  const dome=new THREE.Mesh(new THREE.SphereGeometry(RADIUS,48,24),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w*.9999;}',
    fragmentShader:`varying vec3 vD;uniform vec3 uSun,uTop,uHor,uGlow;uniform float uNight,uCloud,uT;uniform vec2 uOff;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(uHor,uTop,pow(y,.55));
  float sd=max(dot(d,normalize(uSun)),0.);c+=uGlow*pow(sd,8.)*.45+uGlow*pow(sd,64.)*.6;c+=vec3(1.,.97,.9)*smoothstep(.9994,.9998,sd)*(1.-uNight);
  float band=exp(-y*7.)*smoothstep(-.2,.15,uSun.y)*(1.-smoothstep(.15,.45,uSun.y));c=mix(c,uGlow*1.05,band*.55);
  if(uNight>.01){vec2 sp=d.xz/(d.y+.3)*90.;float st=step(.996,h(floor(sp)))*smoothstep(.0,.2,y);c+=vec3(st)*uNight*(.6+.4*sin(uT*3.+h(floor(sp))*40.));
    vec3 md=normalize(-uSun+vec3(.2,.0,.1));float m=smoothstep(.9988,.9993,max(dot(d,md),0.));c+=vec3(.95,.95,.85)*m*uNight;}
  if(d.y>.02){vec2 cp=d.xz/d.y*.6+uOff;float cl=fb(cp*.9);float k=smoothstep(1.-uCloud-.32,1.-uCloud+.1,cl)*smoothstep(.02,.18,d.y);vec3 cc=mix(vec3(1.),uGlow,.35*(1.-smoothstep(0.,.5,uSun.y)));cc=mix(cc,vec3(.25,.28,.38),uNight*.8);c=mix(c,cc,k*.85);}
  gl_FragColor=vec4(c,1.);}`}));dome.frustumCulled=false;dome.renderOrder=-10;dome.name='skyDome';scene.add(dome);scene.background=null;
  if(o.fog!==false&&!scene.fog)scene.fog=new THREE.Fog(0xbfe4f6,60,300);
  /* ---- detail layers ---- */
  const LAY={cumulus:true,flare:true,fireflies:true,dust:true,birds:true,shootingstars:true,godrays:true,aurora:false};const root=new THREE.Group();root.name='skyLayers';scene.add(root);
  // cumulus: puffy 3D clouds of soft spheres drifting high up
  const cum=new THREE.Group();root.add(cum);{const mm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:new THREE.Color(.25,.27,.3),transparent:true,opacity:.92});let s=5;const r=()=>(s=(s*16807)%2147483647)/2147483647;
    for(let c=0;c<9;c++){const G=new THREE.Group(),n=6+r()*6|0;for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(3+r()*4,12,8),mm);m.position.set((r()-.5)*14,(r()-.3)*3,(r()-.5)*7);m.scale.y=.6;G.add(m);}
      const a=r()*6.28,d=90+r()*90;G.position.set(Math.cos(a)*d,45+r()*25,Math.sin(a)*d);G.userData.v=.4+r()*.6;cum.add(G);}}
  // lens flare: soft discs along the line from the sun through the screen centre (placed in 3D in front of the camera)
  const flare=new THREE.Group();root.add(flare);{const fm=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.18,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});[[.6,0xfff0c0],[.25,0xffc080],[.4,0xa0d0ff],[.15,0xffffff],[.8,0xffe0a0]].forEach(([r,c],i)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(r,24),fm(c));m.userData.k=i;m.renderOrder=999;flare.add(m);});}
  // fireflies at dusk and night, dust motes in golden light
  const pts=(n,col,size)=>{const g2=new THREE.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*40;g2.setAttribute('position',new THREE.BufferAttribute(p,3));const m=new THREE.PointsMaterial({color:col,size,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});const P=new THREE.Points(g2,m);P.frustumCulled=false;root.add(P);return P;};
  const ff=pts(90,0xd8ff70,.14),dust=pts(260,0xfff2d0,.05);
  // a distant flock of birds in a loose V
  const birds=new THREE.Group();root.add(birds);{const bm=new THREE.MeshBasicMaterial({color:0x2a2e36,side:THREE.DoubleSide,fog:false});for(let i=0;i<9;i++){const b=new THREE.Group();[-1,1].forEach(s2=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.25),bm);w.position.x=s2*.6;w.userData.s=s2;b.add(w);});const k=Math.ceil(i/2)*(i%2?1:-1);b.position.set(Math.abs(k)*-2.2,0,k*2);birds.add(b);}}
  // shooting stars
  const shoot=new THREE.Mesh(new THREE.PlaneGeometry(14,.12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,fog:false,depthWrite:false}));root.add(shoot);let shootT=-1;
  // god rays: soft light shafts slanting down from the sun (wide transparent planes)
  const rays=new THREE.Group();root.add(rays);{const rm=new THREE.MeshBasicMaterial({color:0xfff2d0,transparent:true,opacity:.05,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false});for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2+i%3,80),rm);m.position.set((i-3)*5,0,(i%2)*4);rays.add(m);}}
  // aurora (off by default): a green-pink curtain low in the southern night sky
  const aur=new THREE.Mesh(new THREE.PlaneGeometry(260,40,60,1),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uT:U.uT,uN:U.uNight},vertexShader:'varying vec2 vU;void main(){vU=uv;vec3 p=position;p.z+=sin(p.x*.05)*12.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'varying vec2 vU;uniform float uT,uN;void main(){float w=sin(vU.x*20.+uT*.5)*.5+.5;vec3 c=mix(vec3(.2,1.,.5),vec3(1.,.3,.7),vU.y);gl_FragColor=vec4(c,(1.-vU.y)*vU.y*4.*w*.5*uN);}'}));aur.position.set(0,40,200);root.add(aur);
  const lerpC=(a,b,t)=>a.clone().lerp(b,t),st={sunDir:new THREE.Vector3(),sunColor:new THREE.Color(),skyColor:new THREE.Color(),night:0};
  function sky(){const t=(hour-6)/12,a=t*Math.PI,el=Math.sin(a),az=Math.cos(a);const sd=new THREE.Vector3(-az*.9,el,.35).normalize();if(hour<5.5||hour>18.5)sd.set(.3,-.4,.2).normalize();
    const day=Math.max(0,Math.min(1,(el+.08)/.35)),low=1-Math.max(0,Math.min(1,el/.45)),night=1-Math.max(0,Math.min(1,(el+.12)/.18));
    const top=lerpC(lerpC(C('#1e5fae'),C('#2f7fd6'),day),C('#0b1530'),night),hor=lerpC(lerpC(C('#bfe4f6'),C('#f4c9a0'),low*.8*day),C('#1c2a48'),night).lerp(C('#ffffff'),wx.haze*.25*day);
    const glow=lerpC(C('#fff1d8'),C('#ff9a50'),low);U.uSun.value.copy(sd);U.uTop.value.copy(top);U.uHor.value.copy(hor);U.uGlow.value.copy(glow);U.uNight.value=night;U.uCloud.value=wx.cloud;
    if(sun){sun.color.copy(lerpC(C('#fff6e6'),C('#ffb070'),low));sun.intensity=(.15+1.05*day)*(1-night*.85);const tg=o.target||sun.target.position;sun.position.copy(tg).addScaledVector(sd.y>0?sd:new THREE.Vector3(-.3,.6,.2),80);if(sun.target)sun.target.position.copy(tg);}
    if(hemi){hemi.color.copy(lerpC(top,hor,.5)).lerp(C('#3a4a70'),night*.7);hemi.groundColor.copy(lerpC(C('#7a7050'),C('#202430'),night));hemi.intensity=.35+.25*day;}
    if(scene.fog){scene.fog.color.copy(hor);}st.sunDir.copy(sd);st.sunColor.copy(sun?sun.color:glow).multiplyScalar(sun?sun.intensity:1);st.skyColor.copy(hor);st.night=night;}
  sky();
  return{dome,uniforms:U,state:st,
    update(dt,op){op=op||{};if(op.hour!=null)hour=op.hour;if(op.target)o.target=op.target;for(const k in wx)wx[k]+=(wxT[k]-wx[k])*Math.min(1,dt*.5);cloudOff+=dt*wx.wind*.01;U.uOff.value.set(cloudOff,cloudOff*.4);U.uT.value+=dt;
      if(o.target||op.target)dome.position.copy(o.target||op.target);sky();},
    layers:Object.keys(LAY),setLayer(n,on){LAY[n]=!!on;},
    animate(t,dt,camera){const c=o.target||new THREE.Vector3();root.position.set(0,0,0);const sd=st.sunDir,night=st.night,day=1-night,low=1-Math.max(0,Math.min(1,sd.y/.45));
      cum.visible=LAY.cumulus&&night<.8;cum.children.forEach(G=>{G.position.x+=G.userData.v*dt*(wx.wind+.3);if(G.position.x>220)G.position.x=-220;G.children.forEach(m=>{m.material.color.copy(lerpC(C('#ffffff'),C('#ffc8a0'),low*.7)).lerp(C('#30344a'),night);});});
      ff.visible=LAY.fireflies&&night>.25;ff.position.copy(c);ff.material.opacity=Math.min(1,night*1.4)*(.6+.4*Math.sin(t*3));{const p=ff.geometry.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,1+Math.abs(Math.sin(t*.5+i))*2.5);p.setX(i,p.getX(i)+Math.sin(t+i)*.01);}p.needsUpdate=true;}
      dust.visible=LAY.dust&&day>.5;dust.position.copy(c);dust.material.opacity=.25+.5*low;{const p=dust.geometry.attributes.position;for(let i=0;i<p.count;i++){let y=p.getY(i)+dt*.08;if(y>12)y=0;p.setY(i,y);}p.needsUpdate=true;}
      birds.visible=LAY.birds&&night<.5;const ba=t*.04;birds.position.set(c.x+Math.cos(ba)*70,30+Math.sin(t*.2)*3,c.z+Math.sin(ba)*70);birds.rotation.y=-ba;birds.children.forEach((b,i)=>b.children.forEach(w=>w.rotation.x=0,b.children.forEach(w=>{w.rotation.z=w.userData.s*Math.sin(t*5+i)*.5;})));
      shoot.visible=LAY.shootingstars&&night>.6;if(shoot.visible){if(shootT<0&&Math.random()<dt*.15){shootT=0;const a=Math.random()*6.28;shoot.position.set(c.x+Math.cos(a)*120,70+Math.random()*30,c.z+Math.sin(a)*120);shoot.lookAt(c.x,shoot.position.y,c.z);shoot.rotation.z=-.3;}
        if(shootT>=0){shootT+=dt;shoot.translateX(dt*60);shoot.material.opacity=Math.max(0,1-shootT*1.5);if(shootT>.8)shootT=-1;}}
      rays.visible=LAY.godrays&&day>.4&&sd.y>.15;if(rays.visible){rays.position.copy(c).addScaledVector(sd,10);rays.lookAt(c.x+sd.x*100,c.y+sd.y*100,c.z+sd.z*100);rays.rotateX(Math.PI/2);rays.children.forEach((m,i)=>{m.material.opacity=.035+.02*Math.sin(t*.3+i)+.03*low;});}
      aur.visible=LAY.aurora&&night>.5;
      flare.visible=LAY.flare&&camera&&day>.3;if(flare.visible){const sp=camera.position.clone().addScaledVector(sd,100),v=sp.clone().project(camera);const on=v.z<1&&Math.abs(v.x)<1.2&&Math.abs(v.y)<1.2;flare.visible=on;
        if(on){const cdir=new THREE.Vector3();camera.getWorldDirection(cdir);flare.children.forEach((m,i)=>{const k=[0,.4,.8,1.3,1.8][i],nd=new THREE.Vector3(v.x*(1-k),v.y*(1-k),.5).unproject(camera);m.position.copy(camera.position).add(nd.sub(camera.position).normalize().multiplyScalar(6));m.quaternion.copy(camera.quaternion);});}}},
    setTime(h){hour=h;sky();},setWeather(n){wxT=Object.assign({},WX[n]||WX.sunny);},get wind(){return wx.wind;},get hour(){return hour;}};}
g.SkyEngine={create,WEATHERS:Object.keys(WX)};})(typeof window!=='undefined'?window:this);
