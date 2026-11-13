const T=TerrainEngine.create({size:[90,70],center:[4,0],res:.4,heightAt:H,seaLevel:0,paths:PATHS});scene.add(T.mesh);
const S=SkyEngine.create({scene,renderer:R,sun,hemi,target:new THREE.Vector3(2,0,2)});
const sea=WaterSea.create({renderer:R,scene,camera:cam,heightAt:H,size:200,ground:null,level:0});
const P=PropsEngine.create({scene,heightAt:H});
P.along('lamp',PATHS[0].pts,7,{offset:1});P.along('bench',PATHS[1].pts,9,{offset:-1.1,turn:Math.PI});P.along('bin',PATHS[1].pts,9,{offset:-1.1});
P.add('busstop',-1.5,3.5,{rot:-.2,text:['STOP 1','THOMSON BAY']});P.add('sign',2.5,-2.5,{text:['THE BASIN','SNORKEL TRAIL'],rot:.3});P.add('bikes',5,6,{rot:.5,n:3});P.add('planter',0,-4,{rot:.2});P.add('planter',1.6,-4.4,{rot:.2,color:'#c8b496'});
P.add('picnic',6,-6,{rot:.4});P.add('umbrella',6,-6,{color:'#e85a6a'});P.add('picnic',9,-3,{rot:-.3});P.add('umbrella',9,-3,{color:'#3a8ad0'});P.add('bollard',-3,5.5);P.add('bollard',-3,7);P.add('tap',4,-8);P.add('crate',-6,-2);P.add('rock',-8,10,{scale:2});
P.add('fence',0,0,{lines:[[10,-14],[16,-12],[20,-14]]});P.add('jetty',0,0,{lines:[[-12,-4],[-24,-6]],width:2.2});for(let i=0;i<4;i++)P.add('buoy',-26-i*3,-8+i*2,{color:i%2?'#e8c040':'#f08a2a'});
ui('<div>Time: <input type="range" id="hr" min="5" max="21" step=".05" value="10"></div><div style="opacity:.75">'+PropsEngine.kinds.length+' kinds: '+PropsEngine.kinds.join(', ')+'</div>');
const hr=document.getElementById("hr");ctl.target.set(-2,0,2);cam.position.set(-16,12,20);
onFrame((t,dt)=>{S.update(dt,{hour:+hr.value});P.night=S.state.night;P.update(t);sea.setSun(S.state.sunDir,S.state.sunColor,S.state.skyColor);});setRender(t=>sea.render(t));
P.add('surfrack',-4.5,3,{rot:1.2});P.add('towel',-7.5,-2,{rot:.3});P.add('towel',-8,0,{rot:.2,color:'#e85a6a'});P.add('deckchair',-6.5,-4,{rot:1.4});P.add('deckchair',-6,-6,{rot:1.5,color:'#f2c14e'});P.add('icecart',3,4);P.add('flagpole',-2,-6);P.add('fountain',12,8);P.add('postbox',-1,6);
P.add('arrowpost',4,-1);P.add('shower',-4.5,7);P.add('lifering',-5.5,9);P.add('kayakrack',-3.5,12,{rot:1});P.add('hedge',14,-8,{len:4});P.add('hedge',8,12,{len:3,rot:.4});

P.add('boardwalk',0,0,{lines:[[-14,14],[-10,17],[-6,16]]});P.add('lookout',10,14,{rot:.4});
P.add('foodtruck',6,9,{rot:-.4});
