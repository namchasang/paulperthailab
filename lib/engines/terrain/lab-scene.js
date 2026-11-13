const lake=(x,z)=>{const d=Math.hypot((x-14)/7,(z+12)/4.5)+(fbm(x*.2,z*.2)-.5)*.3;return Math.max(0,Math.min(1,(1-d)*1.5));};
const paths=PATHS.concat([{pts:[[24,-30],[20,-10],[26,6],[22,30]],w:1.8,kind:'gravel'}]);
const T=TerrainEngine.create({size:[90,70],center:[4,0],res:.4,heightAt:H,seaLevel:0,paths,lakes:lake});scene.add(T.mesh);
const sea=WaterSea.create({renderer:R,scene,camera:cam,heightAt:H,size:200,ground:null,level:0});sea.setSun(sun.position.clone(),sun.color.clone(),new THREE.Color(0x9fd3ea));
/* a few trees so the shade and leaf-litter layers have somewhere to show */const trees=[[8,8,2.6],[12,10,2.2],[0,16,2.8],[16,-2,2.4],[-2,-10,2.5],[30,10,2.6]];T.setShade(trees);
{const tm=new THREE.MeshLambertMaterial({color:0x6a4a32}),cm=new THREE.MeshLambertMaterial({color:new THREE.Color('#4f8240').convertSRGBToLinear()});trees.forEach(([x,z,r])=>{const y=H(x,z);const t=new THREE.Mesh(new THREE.CylinderGeometry(.15,.22,3,7),tm);t.position.set(x,y+1.5,z);t.castShadow=true;scene.add(t);const c=new THREE.Mesh(new THREE.SphereGeometry(r*.8,14,10),cm);c.position.set(x,y+3.6,z);c.castShadow=true;scene.add(c);});}
ui('<div style="margin-top:4px"><b style="font-size:12px">Layers</b></div>'+T.layers.map(n=>'<label><input type="checkbox" checked data-l="'+n+'"> '+n+'</label>').join('')+'<label><input type="checkbox" id="cDet" checked> blade strokes and speckles</label>');
document.querySelectorAll('[data-l]').forEach(c=>c.onchange=()=>T.setLayer(c.dataset.l,c.checked));document.getElementById('cDet').onchange=e=>T.setQuality(e.target.checked?2:0);
onFrame(t=>T.update(t));setRender(t=>sea.render(t));
