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
    setTime(h){hour=h;sky();},setWeather(n){wxT=Object.assign({},WX[n]||WX.sunny);},get wind(){return wx.wind;},get hour(){return hour;}};}
g.SkyEngine={create,WEATHERS:Object.keys(WX)};})(typeof window!=='undefined'?window:this);
