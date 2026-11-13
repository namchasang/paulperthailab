scene.background=null;const T=TerrainEngine.create({size:[90,70],center:[4,0],res:.4,heightAt:H,seaLevel:0,paths:PATHS});scene.add(T.mesh);
const S=SkyEngine.create({scene,renderer:R,sun,hemi,target:new THREE.Vector3(4,0,4)});
const sea=WaterSea.create({renderer:R,scene,camera:cam,heightAt:H,size:200,ground:null,level:0});
const F=FoliageEngine.create({scene,bounds:[-41,-35,49,35],heightAt:H,kindAt:kind,radius:40,density:{tuft:1.2,flower:.25,bush:.03,tree:.012}});
ui('<div>Time: <input type="range" id="hr" min="5" max="21" step=".05" value="17.6"> <span id="hv"></span></div><label><input type="checkbox" id="run"> Run the day (1 hour = 4 s)</label><div>Weather: <select id="wx">'+SkyEngine.WEATHERS.map(w=>'<option>'+w+'</option>').join('')+'</select></div><div style="margin-top:4px"><b style="font-size:12px">Layers</b></div>'+S.layers.map(n=>'<label><input type="checkbox" '+(n==='aurora'?'':'checked')+' data-l="'+n+'"> '+n+'</label>').join(''));
document.querySelectorAll('[data-l]').forEach(c=>c.onchange=()=>S.setLayer(c.dataset.l,c.checked));
const hr=document.getElementById('hr'),hv=document.getElementById('hv');let h=+hr.value;hr.oninput=()=>{h=+hr.value;};document.getElementById('wx').onchange=e=>S.setWeather(e.target.value);
onFrame((t,dt)=>{if(document.getElementById('run').checked){h+=dt/4;if(h>21)h=5;hr.value=h;}hv.textContent=Math.floor(h)+':'+String(Math.floor(h%1*60)).padStart(2,'0');
  S.update(dt,{hour:h});S.animate(t,dt,cam);F.setWind(S.wind);F.update(t,ctl.target.x,ctl.target.z);sea.setSun(S.state.sunDir,S.state.sunColor,S.state.skyColor);});setRender(t=>sea.render(t));
