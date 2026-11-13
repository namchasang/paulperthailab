/* Water Sea Engine (Paul Perth Library, Nov 2026) — clear shallow sea for three.js r128.
   Made for Quokka Cafe (Rottnest), reusable in any game. One call:
     const sea=WaterSea.create({renderer,scene,camera,size:140,heightAt:(x,z)=>groundHeight,ground:groundMaterial,palette});
     each frame: sea.render(time)   // renders the scene twice: once without water (colour+depth), then with it
     sea.setLevel(y)                // raise or lower the sea: beaches flood, wet sand follows
   What it does: colour by real depth (seabed read from the depth buffer), see-through water with refraction,
   caustics + sand ripples + wet sand + backwash foam on the ground material, swash that runs up the beach and slides back,
   breaking waves over sand bars, foam rings round anything at the waterline (boats, rocks, posts), sun glints, sky reflection.
   Palette default = Rottnest (Paul's Thomson Bay / Bathurst photos). Quality: sea.setQuality(0) turns refraction off for old phones. */
(function(g){
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const SR=h=>{const c=C(h);return`vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`;};
function create(o){const R=o.renderer,scene=o.scene,cam=o.camera,S=o.size||140,H=o.heightAt;
  const P=Object.assign({shallow:'#5fe3d2',mid:'#20c3c8',deep:'#1593c4',sand:'#f2eedf',foam:'#fbfaf4'},o.palette||{});
  /* the seabed area: o.bounds {x0,z0,w,h} in world units (default: a square of side size round 0,0); outside it the sea is deep */
  const B=o.bounds||{x0:-S/2,z0:-S/2,w:S,h:S},HW=o.heightRes?(o.heightRes.length?o.heightRes[0]:o.heightRes):256,HH=o.heightRes&&o.heightRes.length?o.heightRes[1]:HW,hd=new Uint16Array(HW*HH*4),hf=THREE.DataUtils.toHalfFloat;
  for(let j=0;j<HH;j++)for(let i=0;i<HW;i++){const x=B.x0+(i+.5)/HW*B.w,z=B.z0+(j+.5)/HH*B.h;const k=(j*HW+i)*4;hd[k]=hf(Math.max(-10,Math.min(4,H(x,z))));hd[k+3]=hf(1);}
  /* seabed height as a half-float texture: smooth when filtered (two 8-bit bytes give stair steps between texels) */
  const hmT=new THREE.DataTexture(hd,HW,HH,THREE.RGBAFormat,THREE.HalfFloatType);hmT.magFilter=hmT.minFilter=THREE.LinearFilter;hmT.needsUpdate=true;
  const U={uLevel:{value:o.level||0},uT:{value:0},uOn:{value:1},tHM:{value:hmT},uS:{value:S},uHB:{value:new THREE.Vector4(B.x0,B.z0,B.w,B.h)},uRun:{value:o.run==null?1:o.run},uWS:{value:o.wetScale==null?1:o.wetScale}};
  const WAVE=`uniform sampler2D tHM;uniform float uS,uRun;uniform vec4 uHB;
float wh(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float wn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(wh(vec2(i,1.3)),wh(vec2(i+1.,1.3)),f);}
float bedAt(vec2 xz){vec2 uv=(xz-uHB.xy)/uHB.zw;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return -6.;return texture2D(tHM,uv).r;}
float runup1(vec2 xz,float t,float per,float off){float p=t/per+off+wn(xz.y*.045+off*3.)*.55;float c=fract(p);float r=c<.28?smoothstep(0.,.28,c):1.-smoothstep(.28,1.,c);return r*(.26+.22*wh(vec2(floor(p),off)));}
float runup(vec2 xz,float t){return max(runup1(xz,t,9.,0.),runup1(xz,t,13.,.37)*.8)*uRun;}`;
  if(o.ground){const gm=o.ground;gm.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vW;uniform float uLevel,uT,uOn,uWS;
${WAVE}
/* hash without sin: stays smooth far from 0,0 (big game maps) */float hh(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float fbmS(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),u.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),u.x),u.y);}
float cz(vec2 p){vec2 i=floor(p),f=fract(p);float m=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=vec2(hh(i+g),hh(i+g+7.3));o=.5+.45*sin(uT*.9+6.28*o);m=min(m,length(g+o-f));}return m;}`)
  .replace('#include <dithering_fragment>',`#include <dithering_fragment>
  float dep=uLevel-vW.y;
  if(uOn>.5){/* the sand stays dark where the last waves reached, drying out over a few seconds */
    float wet=0.;for(int k=0;k<6;k++){float tk=uT-float(k)*.8;float lv=uLevel+runup(vW.xz,tk);wet=max(wet,smoothstep(-.03*uWS,.02*uWS,lv-vW.y)*(1.-float(k)/7.));}
    gl_FragColor.rgb*=mix(1.,.78,wet*step(dep,.05)+smoothstep(-.02*uWS,.1*uWS,dep));
    /* thin foam trails the backwash leaves on the sand */
    float lvn=uLevel+runup(vW.xz,uT);float tr=exp(-pow((lvn-vW.y-.015)/.012,2.))*smoothstep(.45,.75,wn(vW.z*1.3+vW.x*2.+floor(uT/9.)*7.));gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.95),tr*.5*step(dep,.4));}
  if(uOn>.5&&dep>-.25){/* caustics underneath */
    if(dep>0.){float rip=sin(vW.x*3.2+sin(vW.z*.7)*1.6+fbmS(vW.xz*.4)*3.)*.5+.5;gl_FragColor.rgb*=1.-pow(rip,6.)*.16*smoothstep(0.,.3,dep);float c=pow(1.-cz(vW.xz*.55+vec2(uT*.08,uT*.05)),5.)+pow(1.-cz(vW.xz*.9-vec2(uT*.06,0.)),6.)*.6;gl_FragColor.rgb+=vec3(.55,.62,.6)*c*.45*exp(-dep*.35)*smoothstep(0.,.25,dep);}}`);};}
  const rt=new THREE.WebGLRenderTarget(2,2);rt.texture.encoding=THREE.sRGBEncoding;rt.depthTexture=new THREE.DepthTexture();rt.depthTexture.type=THREE.UnsignedIntType;
  const wm=new THREE.ShaderMaterial({transparent:false,uniforms:Object.assign({tCol:{value:rt.texture},tDep:{value:rt.depthTexture},uRes:{value:new THREE.Vector2()},uPI:{value:new THREE.Matrix4()},uCW:{value:new THREE.Matrix4()},uSun:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color()},uCam:{value:new THREE.Vector3()},uNear:{value:.5},uFar:{value:600},uNew:{value:1},uQ:{value:1},uSky:{value:new THREE.Color()}},U),
 vertexShader:`varying vec3 vW;varying float vRun;uniform float uT,uLevel;${WAVE}void main(){vec3 p=position;vec2 wxz=(modelMatrix*vec4(p,1.)).xz;float bed=bedAt(wxz);float d0=uLevel-bed;float near=1.-smoothstep(.8,3.5,d0);float ru=runup(wxz,uT)*near;vRun=ru;float cr=fract(d0*.55+uT*.16+wn(wxz.y*.05)*.4);float crest=exp(-pow((cr-.08)/.06,2.))*smoothstep(.2,.9,d0)*(1.-smoothstep(2.6,3.4,d0));p.y=uLevel+ru+crest*.09+sin(p.x*.25+uT*1.1)*.03*(1.-near)+sin(p.z*.31-uT*.9)*.03*(1.-near);vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`precision highp float;varying vec3 vW;varying float vRun;${WAVE}uniform sampler2D tCol,tDep;uniform vec2 uRes;uniform mat4 uPI,uCW;uniform vec3 uSun,uCam;uniform vec3 uSunC,uSky;uniform float uT,uLevel,uNear,uFar,uNew,uQ;
/* hash without sin: stays smooth far from 0,0 (big game maps) */float hh(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),u.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),u.x),u.y);}
/* each octave turned a different way so no square grid shows when the camera is close */float waves(vec2 p){vec2 q=mat2(.8,-.6,.6,.8)*p,r=mat2(.36,-.93,.93,.36)*p;return n2(p*.35+vec2(uT*.12,uT*.05))*.5+n2(q*.8-vec2(uT*.2,-uT*.11))*.3+n2(r*2.1+vec2(uT*.35,uT*.27))*.2;}
vec3 wpos(vec2 uv){float d=texture2D(tDep,uv).x;vec4 c=vec4(uv*2.-1.,d*2.-1.,1.);vec4 v=uPI*c;v/=v.w;return(uCW*v).xyz;}
vec3 sRGB(vec3 c){return pow(c,vec3(1./2.2));}
void main(){vec2 uv=gl_FragCoord.xy/uRes;
  float e=.15;float h0=waves(vW.xz),hx=waves(vW.xz+vec2(e,0.)),hz=waves(vW.xz+vec2(0.,e));vec3 nrm=normalize(vec3(-(hx-h0)/e*.55,1.,-(hz-h0)/e*.55));
  float lvl=uLevel+vRun;vec3 bedP=wpos(uv);float depth=max(0.,lvl-bedP.y);float bedH=bedAt(vW.xz);float d0=uLevel-bedH;float viewD=length(bedP-vW);
  vec2 off=nrm.xz*.025*uQ*smoothstep(0.,1.5,depth);vec3 bedP2=wpos(uv+off);if(bedP2.y>lvl)off=vec2(0.);vec3 bed=texture2D(tCol,uv+off).rgb;bed=pow(bed,vec3(2.2));
  float dd=depth*2.4;/* Rottnest palette: same colours as the island's sea, set by real depth */
  vec3 sh=${SR(P.shallow)},mid=${SR(P.mid)},deep=${SR(P.deep)};
  vec3 wc=mix(sh,mid,smoothstep(1.5,5.,dd));wc=mix(wc,deep,smoothstep(7.,14.,dd));
  float clear=exp(-depth*.32-viewD*.012);float wd=clamp(.12+dd*.055,0.,.9);
  vec3 c=uNew>.5?mix(bed*mix(vec3(1.),sh*1.25,.55),wc,wd):mix(${SR(P.sand)},wc,clamp(.25+dd*.07,0.,.95));
  if(uNew<.5){gl_FragColor=vec4(sRGB(c),1.);return;}
  /* light on the surface: sky reflection and sun glints */
  vec3 V=normalize(uCam-vW);float fr=pow(1.-max(dot(V,nrm),0.),4.)*.6;c=mix(c,uSky*.85,fr*smoothstep(0.,1.,depth));
  vec3 Hh=normalize(V+uSun);float sp=pow(max(dot(nrm,Hh),0.),220.)*2.2;c+=uSunC*sp*smoothstep(.0,.6,depth);
  /* foam: lace at the waterline that runs up and back, and rings round rocks, posts and the boat */
  float lace=smoothstep(.32,.72,n2(vW.xz*1.8+vec2(uT*.25,uT*.1)));float lace2=smoothstep(.45,.8,n2(vW.xz*4.+vec2(-uT*.4,0.)));
  float edgeD=lvl-bedH;/* the leading edge of each wash, white and frothy */float f1=smoothstep(.2,.0,edgeD)*(.55+.45*lace)+exp(-pow((edgeD-.28)/.06,2.))*lace2*.4;
  /* the thin sheet of a wash is milky with foam lace */float f2=(1.-smoothstep(.0,.25,edgeD))*vRun*2.2*(.35+.65*lace2);
  /* breaking crests: white lines that roll in from the sand bar and fade as they spread */float cr=fract(d0*.55+uT*.16+n2(vec2(vW.z*.05,1.))*.4);
  float brk=exp(-pow((d0-1.3)/.9,2.));/* waves break over the bar and fall apart into foam towards the sand */float broken=smoothstep(.3,.62,n2(vec2(vW.z*.35,d0*1.5)+vec2(0.,uT*.2)));
  float f3=exp(-pow((cr-.1)/.08,2.))*brk*broken*(.55+.45*lace)+exp(-pow((cr-.22)/.12,2.))*brk*lace2*broken*.5;
  /* a soft bubbly band behind the breakers */f3+=smoothstep(1.2,.3,d0)*smoothstep(.0,.3,d0)*lace*lace2*.35;
  float ring=smoothstep(.35,.0,viewD*abs(dot(V,vec3(0,1,0)))-.02)*(1.-smoothstep(1.2,2.5,depth+0.))*lace;
  float objF=0.;if(bedP.y>uLevel-.6&&depth<.6&&viewD<1.2)objF=0.;
  float hullF=(1.-smoothstep(.0,.14,lvl-bedP.y))*step(.5,d0)*(.5+.5*lace2);f3+=hullF;
  c=mix(c,${SR(P.foam)},clamp(f1+f2+f3,0.,.95));
  if(depth<.02)discard;
  gl_FragColor=vec4(sRGB(c),1.);}`});
  const MS=o.meshSize||S,mesh=new THREE.Mesh(new THREE.PlaneGeometry(MS,MS,o.meshSeg||160,o.meshSeg||160).rotateX(-Math.PI/2),wm);if(o.center)mesh.position.set(o.center[0],0,o.center[1]);mesh.frustumCulled=false;(o.parent||scene).add(mesh);
  const size=()=>{const v=R.getDrawingBufferSize(new THREE.Vector2());rt.setSize(v.x,v.y);wm.uniforms.uRes.value.copy(v);};size();
  return{mesh,uniforms:U,material:wm,resize:size,setLevel:y=>{U.uLevel.value=y;},setQuality:q=>{wm.uniforms.uQ.value=q;},
    setSun:(dir,col,sky)=>{wm.uniforms.uSun.value.copy(dir).normalize();wm.uniforms.uSunC.value.copy(col);wm.uniforms.uSky.value.copy(sky);},
    /* pre(t): the first pass only (scene without water into the engine's buffer), for games that draw the final frame themselves */
    pre:t=>{U.uT.value=t;cam.updateMatrixWorld();const v=R.getDrawingBufferSize(new THREE.Vector2());if(v.x!==rt.width||v.y!==rt.height)size();const was=R.getRenderTarget();mesh.visible=false;R.setRenderTarget(rt);R.render(scene,cam);R.setRenderTarget(was);mesh.visible=true;
      wm.uniforms.uPI.value.copy(cam.projectionMatrixInverse);wm.uniforms.uCW.value.copy(cam.matrixWorld);wm.uniforms.uCam.value.setFromMatrixPosition(cam.matrixWorld);wm.uniforms.uNear.value=cam.near;wm.uniforms.uFar.value=cam.far;},
    render(t){this.pre(t);R.render(scene,cam);},bedAt:(x,z)=>H(x,z),dispose:()=>{rt.dispose();hmT.dispose();wm.dispose();mesh.geometry.dispose();}};}
g.WaterSea={create};})(typeof window!=='undefined'?window:this);

/* PPL registration: same engine, also listed in the library */
(function(){if(typeof window!=="undefined"&&window.PPL&&PPL.reg)PPL.reg("water-sea",{group:"env",from:"quokka-cafe water lab (Nov 2026)",create:WaterSea.create});})();
