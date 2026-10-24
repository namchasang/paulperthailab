/* colour stops by sun elevation (deg): zenith, horizon, sun light, ambient sky, ambient ground, fog */
const STOPS = [
  { e: -8, zen: '#0b1424', hor: '#27324a', sun: '#30364a', sky: '#24304a', gnd: '#141414', sunI: 0, hemiI: .35 },
  { e: -1, zen: '#22305a', hor: '#c96a4a', sun: '#ff7a3c', sky: '#55608a', gnd: '#3a2a22', sunI: .2, hemiI: .45 },
  { e: 4, zen: '#2c4f8c', hor: '#ee9a5a', sun: '#ffa850', sky: '#7f98c4', gnd: '#5a4632', sunI: 1.8, hemiI: .5 },
  { e: 12, zen: '#2a5ea8', hor: '#e8b888', sun: '#ffd09a', sky: '#9ab6dc', gnd: '#66583e', sunI: 2.4, hemiI: .55 },
  { e: 30, zen: '#2563b8', hor: '#a9cbe8', sun: '#fff1dc', sky: '#b0cbea', gnd: '#6e6248', sunI: 2.8, hemiI: .62 },
  { e: 70, zen: '#2a64bc', hor: '#b4d2f0', sun: '#ffffff', sky: '#c0d6f0', gnd: '#706650', sunI: 3.0, hemiI: .7 }
];
const WX = {
  clear: { cloud: .18, grey: 0, fog: 1, rain: 0, sunK: 1 },
  hazy: { cloud: .35, grey: .15, fog: 1.8, rain: 0, sunK: .8 },
  overcast: { cloud: .9, grey: .7, fog: 2.4, rain: 0, sunK: .25 },
  rain: { cloud: 1, grey: .85, fog: 3.5, rain: 1, sunK: .12 }
};
function lerpStop(e){
  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) if (e >= STOPS[i].e && e <= STOPS[i + 1].e) { a = STOPS[i]; b = STOPS[i + 1]; break; }
  if (e < STOPS[0].e) b = a; if (e > b.e) a = b;
  const t = a === b ? 0 : (e - a.e) / (b.e - a.e), o = {};
  ['zen', 'hor', 'sun', 'sky', 'gnd'].forEach(k => o[k] = C(a[k]).lerp(C(b[k]), t));
  o.sunI = P.lerp(a.sunI, b.sunI, t); o.hemiI = P.lerp(a.hemiI, b.hemiI, t); return o;
}
P.skyWeather = (scene, renderer, opt = {}) => {
  const R = opt.radius || 4000, W = { hour: 17.3, weather: 'clear', sunAz: opt.sunAzimuth ?? 280 };
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opt.exposure || .9;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = opt.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  /* sky dome: gradient + sun disc + halo */
  const U = { zen: { value: C('#3f72b8') }, hor: { value: C('#f4cfa0') }, sunDir: { value: P.V3(0, .2, -1) }, sunCol: { value: C('#ffd6a0') }, grey: { value: 0 }, greyCol: { value: C('#8a9098') } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
    fragmentShader: `uniform vec3 zen,hor,sunDir,sunCol,greyCol;uniform float grey;varying vec3 vD;
      void main(){float h=max(vD.y,0.);vec3 c=mix(hor,zen,pow(h,.33));
      float sd=max(dot(vD,normalize(sunDir)),0.);
      c+=sunCol*(pow(sd,12.)*.22+pow(sd,90.)*.5)*(1.-grey*.8);
      c+=sunCol*smoothstep(.9994,.9997,sd)*3.*(1.-grey);
      c=mix(c,greyCol*(.75+.35*h),grey);
      if(vD.y<0.)c=mix(hor,hor*.7,clamp(-vD.y*4.,0.,1.));
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      }`
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  /* lights */
  const sun = new THREE.DirectionalLight('#fff', 2.5); sun.castShadow = true;
  const S = opt.shadowSize || 60; Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 900 });
  sun.shadow.mapSize.set(opt.shadowRes || 2048, opt.shadowRes || 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#bcd', '#654', .6); scene.add(hemi);
  scene.fog = new THREE.FogExp2('#cdd6dc', .00028);
  /* clouds: soft canvas billboards in a ring of sky */
  const cTex = P.ctex(256, 128, (x, w, h) => {
    for (let k = 0; k < 26; k++) {
      const cx = w * (.18 + Math.random() * .64), cy = h * (.45 + Math.random() * .25), r = 18 + Math.random() * 34;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    }
  });
  const clouds = new THREE.Group(); scene.add(clouds); const cl = [];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.SpriteMaterial({ map: cTex, transparent: true, depthWrite: false, fog: false, opacity: .8 });
    const s = new THREE.Sprite(m), a = Math.random() * 6.28, d = 700 + Math.random() * 2400;
    s.position.set(Math.cos(a) * d, 260 + Math.random() * 420, Math.sin(a) * d); const sc = 380 + Math.random() * 620; s.scale.set(sc, sc * .45, 1);
    s.userData.k = i / 46; clouds.add(s); cl.push(s);
  }
  /* rain streaks around the camera */
  const RN = 2600, rp = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = (Math.random() - .5) * 80, y = Math.random() * 40, z = (Math.random() - .5) * 80; rp.set([x, y, z, x + .05, y - .9, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#c8d4e0', transparent: true, opacity: .45, fog: false }));
  rain.frustumCulled = false; rain.visible = false; scene.add(rain);
  /* sky reflection map (water, wet or shiny things): rebuilt whenever time or weather changes */
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), sky.material);
  envScene.add(envSky); let envRT = null; W.env = null; W.onEnv = [];
  const rebuildEnv = () => { try { if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, 0, .1, 300); W.env = envRT.texture; W.onEnv.forEach(f => f(W.env)); } catch (e) { W.env = null; } };
  W.sun = sun; W.hemi = hemi; W.sky = sky; W.clouds = clouds; W.rain = rain;
  W.sunDir = P.V3(0, 1, 0);
  W.set = (o = {}) => {
    Object.assign(W, o.hour != null ? { hour: o.hour } : {}, o.weather ? { weather: o.weather } : {}, o.sunAzimuth != null ? { sunAz: o.sunAzimuth } : {});
    const wx = WX[W.weather] || WX.clear;
    /* simple sun path: rises in the east (az 80) at 6:00, sets in the west (W.sunAz) at 18:40, peak ~ 65 deg */
    const t = P.clamp((W.hour - 6) / 12.7, -.1, 1.1), elev = Math.sin(t * Math.PI) * 65 - 2;
    const az = THREE.MathUtils.degToRad(P.lerp(80, W.sunAz, t) );
    const el = THREE.MathUtils.degToRad(elev);
    W.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    const st = lerpStop(elev); W.preset = st; W.elev = elev;
    const grey = wx.grey, gcol = C('#8d949c').lerp(st.hor, .25).multiplyScalar(P.clamp(.35 + elev / 30, .25, 1));
    U.zen.value.copy(st.zen); U.hor.value.copy(st.hor).lerp(gcol, grey * .7); U.sunDir.value.copy(W.sunDir); U.sunCol.value.copy(st.sun); U.grey.value = grey; U.greyCol.value.copy(gcol);
    sun.color.copy(st.sun); sun.intensity = st.sunI * wx.sunK;
    hemi.color.copy(st.sky).lerp(gcol, grey * .6); hemi.groundColor.copy(st.gnd); hemi.intensity = st.hemiI * (1 + grey * .5);
    scene.fog.color.copy(st.hor).lerp(st.zen, .22).lerp(gcol, grey); scene.fog.density = .00013 * wx.fog;
    cl.forEach(s => { s.visible = s.userData.k < wx.cloud; s.material.color.copy(st.hor).lerp(C('#ffffff'), .55).lerp(gcol, grey * .8); s.material.opacity = .5 + grey * .45; });
    rain.visible = !!wx.rain;
    renderer.toneMappingExposure = (opt.exposure || .9) * (1 + grey * .25);
    rebuildEnv();
  };
  W.update = (dt, cam, focus) => {
    sky.position.copy(cam.position); clouds.position.set(cam.position.x, 0, cam.position.z);
    clouds.rotation.y += dt * .002;
    const f = focus || cam.position;
    sun.target.position.copy(f); sun.position.copy(f).addScaledVector(W.sunDir, 400); sun.target.updateMatrixWorld();
    if (rain.visible) { rain.position.set(cam.position.x, cam.position.y - 12, cam.position.z); const p = rain.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 6) { p[i + 1] -= dt * 26; p[i + 4] -= dt * 26; if (p[i + 4] < 0) { p[i + 1] += 40; p[i + 4] += 40; } } rain.geometry.attributes.position.needsUpdate = true; }
  };
  W.set();
  return W;
};
P.reg('skyWeather', { group: 'env', from: 'new (golf), ideas from Magpie Madness sky + Roo Road Look Lab weather' });
})();
