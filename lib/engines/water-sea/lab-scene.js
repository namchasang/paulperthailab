const T=TerrainEngine.create({size:[90,70],center:[4,0],res:.4,heightAt:H,seaLevel:0,paths:PATHS});scene.add(T.mesh);
const sea=WaterSea.create({renderer:R,scene,camera:cam,heightAt:H,size:200,ground:null,level:0});sea.setSun(sun.position.clone(),sun.color.clone(),new THREE.Color(0x9fd3ea));
const WL=WaterLife.create({scene,heightAt:H,level:0,bounds:[-45,-35,-8,35]});
ui('<div style="margin-top:4px"><b style="font-size:12px">Layers</b></div>'+WL.layers.map(n=>'<label><input type="checkbox" checked data-l="'+n+'"> '+n+'</label>').join(''));
document.querySelectorAll('[data-l]').forEach(c=>c.onchange=()=>WL.setLayer(c.dataset.l,c.checked));
cam.position.set(-6,10,14);ctl.target.set(-18,0,0);onFrame((t,dt)=>WL.update(t,dt));setRender(t=>sea.render(t));
