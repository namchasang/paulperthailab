/* Quokka Cafe Radio: the music engine from Quokka Cafe and Friends (namchasang.github.io/quokka-cafe). Every note is synthesised live with Web Audio. */
(function(){'use strict';
const RADIO={ctx:null,master:null,rev:null,st:'off',vol:.5,timer:null,next:0,step:0,bar:0,nodes:[],wave:null,crackle:null};
const RSTATIONS={
 seaside:{name:'Seaside Piano',desc:'Gentle piano and soft waves, like a slow morning on the jetty.',bpm:72},
 lofi:{name:'Island Lo-fi',desc:'Warm electric piano, lazy drums and vinyl crackle.',bpm:78},
 breeze:{name:'Asian Breeze',desc:'Pentatonic plucks like a koto or guzheng over a calm pad.',bpm:66},
 crystal:{name:'Crystal Harbour',desc:'33 original orchestral tracks in the style of classic 90s RPGs: harp, flute, strings and music box.',bpm:80},
 off:{name:'Radio off',desc:'Just the island.'}};
function radioInit(){if(RADIO.ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;try{const c=new AC();RADIO.ctx=c;RADIO.master=c.createGain();RADIO.master.gain.value=0;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;RADIO.master.connect(comp);RADIO.an=c.createAnalyser();RADIO.an.fftSize=256;comp.connect(RADIO.an);RADIO.an.connect(c.destination);
  const len=c.sampleRate*2.6,ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  RADIO.rev=c.createConvolver();RADIO.rev.buffer=ir;const rg=c.createGain();rg.gain.value=.35;RADIO.rev.connect(rg);rg.connect(RADIO.master);
  const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;RADIO.noise=nb;return true;}catch(e){return false;}}
function out(node,dry,wet){const c=RADIO.ctx;const g=c.createGain();g.gain.value=dry;node.connect(g);g.connect(RADIO.master);if(wet){const w=c.createGain();w.gain.value=wet;node.connect(w);w.connect(RADIO.rev);}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function piano(t,m,dur,vel){const c=RADIO.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22*vel,t+.008);g.gain.exponentialRampToValueAtTime(.06*vel,t+.35);g.gain.exponentialRampToValueAtTime(.0008,t+dur+1.2);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(9000,f*7),t);lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*2),t+1.2);
  [[1,'triangle',1],[2,'sine',.35],[3.01,'sine',.12]].forEach(([h,type,a])=>{const o=c.createOscillator();o.type=type;o.frequency.value=f*h;o.detune.value=(Math.random()-.5)*6;const og=c.createGain();og.gain.value=a;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+1.3);});
  lp.connect(g);out(g,.8,.45);}
function epiano(t,m,dur,vel){const c=RADIO.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*vel,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+dur+.6);
  const o=c.createOscillator();o.type='sine';o.frequency.value=f;const o2=c.createOscillator();o2.type='sine';o2.frequency.value=f*2.001;const g2=c.createGain();g2.gain.value=.18;o2.connect(g2);g2.connect(g);o.connect(g);
  const trem=c.createOscillator();trem.frequency.value=4.5;const tg=c.createGain();tg.gain.value=.04*vel;trem.connect(tg);tg.connect(g.gain);[o,o2,trem].forEach(x=>{x.start(t);x.stop(t+dur+.7);});
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;g.connect(lp);out(lp,.75,.3);}
function pluck(t,m,vel){const c=RADIO.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2*vel,t+.004);g.gain.exponentialRampToValueAtTime(.0008,t+1.8);
  const o=c.createOscillator();o.type='triangle';o.frequency.setValueAtTime(f*1.012,t);o.frequency.exponentialRampToValueAtTime(f,t+.08);const o2=c.createOscillator();o2.type='sawtooth';o2.frequency.value=f;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.2,t+.5);
  const g2=c.createGain();g2.gain.value=.25;o2.connect(g2);g2.connect(lp);o.connect(lp);lp.connect(g);[o,o2].forEach(x=>{x.start(t);x.stop(t+1.9);});out(g,.7,.55);}
function pad(t,ms,dur,vol){const c=RADIO.ctx;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.35);g.gain.linearRampToValueAtTime(0,t+dur);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;
  ms.forEach(m=>[-7,7].forEach(d=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(lp);o.start(t);o.stop(t+dur+.1);}));lp.connect(g);out(g,.5,.6);}
function bass(t,m,dur,vol){const c=RADIO.ctx;const o=c.createOscillator();o.type='sine';o.frequency.value=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);o.start(t);o.stop(t+dur+.05);out(g,.9,0);}
function kick(t){const c=RADIO.ctx;const o=c.createOscillator();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);const g=c.createGain();g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);o.start(t);o.stop(t+.32);out(g,.9,0);}
function hat(t,v){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000;const g=c.createGain();g.gain.setValueAtTime(.05*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);s.connect(hp);hp.connect(g);s.start(t,Math.random());s.stop(t+.08);out(g,.8,0);}
function snare(t){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800;const g=c.createGain();g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);s.connect(bp);bp.connect(g);s.start(t,Math.random());s.stop(t+.2);out(g,.7,.3);}
function loopNoise(kind){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;s.loop=true;const g=c.createGain();
  if(kind==='wave'){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;g.gain.value=.05;const l=c.createOscillator();l.frequency.value=.11;const lg=c.createGain();lg.gain.value=.04;l.connect(lg);lg.connect(g.gain);l.start();s.connect(lp);lp.connect(g);RADIO.nodes.push(l);}
  else{const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;g.gain.value=.012;s.connect(hp);hp.connect(g);}
  g.connect(RADIO.master);s.start();RADIO.nodes.push(s);}

// ---------- Crystal Harbour: 10 original RPG-style tracks (composed for Quokka Cafe) ----------
const CR_SCALES={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
const CR_ROOT={I:1,i:1,ii:2,II:2,iii:3,III:3,IV:4,iv:4,V:5,v:5,vi:6,VI:6,vii:7,VII:7};
const CRYSTAL=[
 {t:'Wadjemup Overture',key:62,mode:'maj',bpm:80,m:4,style:'harp',lead:'flute',A:['I','V','vi','iii','IV','I','ii','V'],B:['IV','V','iii','vi','ii','V','I','I'],mA:[[3,1],[5,1],[8,2],[7,1],[9,1],[5,2]],mB:[[6,1.5],[5,.5],[4,1],[3,1],[2,2],[1,2]]},
 {t:'Lanterns on the Jetty',key:67,mode:'maj',bpm:100,m:3,style:'waltz',lead:'bell',A:['I','IV','I','V','vi','IV','V','I'],B:['IV','I','ii','V','vi','IV','V','I'],mA:[[5,2],[6,1],[5,1],[3,1],[1,1]],mB:[[4,2],[3,1],[2,1.5],[3,.5],[5,1]]},
 {t:'Kip’s Promise',key:65,mode:'maj',bpm:64,m:4,style:'ballad',lead:'flute',A:['I','iii','IV','I','ii','V','I','V'],B:['vi','iii','IV','I','ii','V','I','I'],mA:[[5,1.5],[6,.5],[5,1],[3,1],[2,3],[1,1]],mB:[[8,2],[7,1],[6,1],[5,3],[3,1]]},
 {t:'Salt Lake Reverie',key:69,mode:'min',bpm:72,m:4,style:'harp',lead:'oboe',A:['i','VI','III','VII','i','iv','V','i'],B:['iv','i','VI','III','iv','V','i','i'],mA:[[5,1],[4,.5],[3,.5],[1,2],[2,1],[3,1],[5,2]],mB:[[6,2],[5,1],[4,1],[3,1.5],[2,.5],[0,2]]},
 {t:'Ferry to the City',key:72,mode:'maj',bpm:116,m:4,style:'march',lead:'flute',A:['I','V','IV','V','I','vi','ii','V'],B:['IV','I','IV','V','iii','vi','ii','V'],mA:[[1,.5],[3,.5],[5,1],[5,.5],[6,.5],[5,1],[8,2],[7,2]],mB:[[6,1],[5,1],[4,1],[3,1],[2,1],[3,1],[5,2]]},
 {t:'Starlit Settlement',key:63,mode:'maj',bpm:84,m:3,style:'musicbox',lead:'bell',A:['I','vi','IV','V','I','iii','IV','V'],B:['vi','IV','I','V','ii','V','I','I'],mA:[[3,1],[5,1],[8,1],[7,2],[5,1]],mB:[[6,1.5],[5,.5],[4,1],[3,2],[2,1]]},
 {t:'Old Lighthouse Waltz',key:62,mode:'min',bpm:108,m:3,style:'waltz',lead:'oboe',A:['i','iv','VII','III','VI','iv','V','i'],B:['VI','III','iv','i','VI','iv','V','V'],mA:[[1,1],[3,1],[5,1],[4,2],[3,1]],mB:[[6,2],[5,1],[4,1],[2,1],[0,1]]},
 {t:'Fremantle Market Day',key:70,mode:'maj',bpm:104,m:4,style:'march',lead:'bell',A:['I','IV','V','I','vi','ii','V','I'],B:['IV','V','iii','vi','ii','V','I','V'],mA:[[5,.5],[5,.5],[6,1],[5,1],[8,1],[7,2],[5,2]],mB:[[4,1],[6,1],[8,1],[6,1],[5,2],[3,2]]},
 {t:'Quokka Village Campfire',key:67,mode:'maj',bpm:76,m:4,style:'harp',lead:'flute',A:['I','IV','I','V','I','IV','V','I'],B:['vi','IV','I','V','vi','IV','V','I'],mA:[[1,1],[2,1],[3,1],[5,1],[6,2],[5,2]],mB:[[8,1],[6,1],[5,1],[3,1],[2,2],[1,2]]},
 {t:'Letter to Mum & Dad',key:72,mode:'maj',bpm:60,m:4,style:'ballad',lead:'flute',A:['I','V','vi','iii','IV','I','IV','V'],B:['vi','iii','IV','I','ii','V','I','I'],mA:[[3,1],[2,.5],[1,.5],[2,2],[5,1],[3,1],[1,2]],mB:[[6,2],[5,1],[4,1],[3,2],[2,1],[1,1]]},
 {t:'Morning Ferry Bell',key:65,mode:'maj',bpm:92,m:4,style:'harp',lead:'bell',A:['I','iii','IV','V','I','vi','ii','V'],B:['IV','I','vi','V','IV','I','V','I'],mA:[[5,1],[3,.5],[5,.5],[8,1],[7,1],[6,2],[5,2]],mB:[[4,1],[5,1],[6,1],[8,1],[7,2],[5,2]]},
 {t:'Tidepools at Parakeet Bay',key:64,mode:'min',bpm:70,m:4,style:'harp',lead:'oboe',A:['i','VI','iv','V','i','III','iv','V'],B:['VI','VII','III','i','iv','i','V','i'],mA:[[1,1],[2,1],[3,2],[5,1],[4,1],[3,2]],mB:[[6,2],[5,1],[3,1],[4,1.5],[3,.5],[2,2]]},
 {t:'Bicycle Bell Polka',key:69,mode:'maj',bpm:112,m:4,style:'march',lead:'flute',A:['I','V','I','IV','I','V','ii','V'],B:['IV','I','V','vi','IV','I','V','I'],mA:[[3,.5],[4,.5],[5,1],[8,1],[5,1],[6,.5],[5,.5],[4,1],[3,2]],mB:[[6,1],[8,1],[5,1],[3,1],[4,1],[2,1],[1,2]]},
 {t:'Lantern Moths',key:68,mode:'maj',bpm:72,m:3,style:'musicbox',lead:'bell',A:['I','IV','vi','V','I','IV','ii','V'],B:['vi','iii','IV','I','ii','IV','V','I'],mA:[[5,1],[6,1],[8,1],[7,1.5],[6,.5],[5,1]],mB:[[3,2],[4,1],[5,1.5],[4,.5],[3,1]]},
 {t:'Rain on the Tin Roof',key:65,mode:'min',bpm:66,m:4,style:'ballad',lead:'flute',A:['i','VII','VI','V','i','iv','VII','III'],B:['VI','iv','i','V','VI','iv','V','i'],mA:[[5,1.5],[4,.5],[3,1],[1,1],[2,2],[5,2]],mB:[[6,1],[5,1],[4,1],[3,1],[2,1.5],[1,.5],[2,2]]},
 {t:'Goodnight, Wadjemup',key:62,mode:'maj',bpm:88,m:3,style:'waltz',lead:'flute',A:['I','vi','IV','V','I','iii','IV','V'],B:['IV','V','iii','vi','ii','V','I','I'],mA:[[5,2],[3,1],[2,1],[1,1],[3,1]],mB:[[8,1.5],[7,.5],[6,1],[5,2],[3,1]]},
 {"t":"Morning Tide","key":64,"mode":"maj","bpm":76,"m":4,"style":"harp","lead":"flute","A":["I","IV","vi","V","I","IV","ii","V"],"B":["vi","IV","I","V","ii","IV","V","I"],"mA":[[5,1],[3,0.5],[5,0.5],[6,2],[5,1],[8,1],[6,2]],"mB":[[3,1],[4,1],[5,1.5],[4,0.5],[3,2],[2,2]]},
 {"t":"Pink Lake Lullaby","key":65,"mode":"maj","bpm":62,"m":3,"style":"musicbox","lead":"bell","A":["I","vi","ii","V","I","IV","V","I"],"B":["IV","iii","vi","V","IV","I","V","I"],"mA":[[5,1],[3,1],[1,1],[2,2],[5,1]],"mB":[[6,1],[5,1],[4,1],[3,3]]},
 {"t":"Rottnest Express","key":69,"mode":"maj","bpm":120,"m":4,"style":"march","lead":"flute","A":["I","IV","V","I","vi","IV","ii","V"],"B":["IV","V","vi","iii","IV","I","ii","V"],"mA":[[1,0.5],[1,0.5],[5,1],[4,0.5],[3,0.5],[2,1],[3,1],[5,1],[1,2]],"mB":[[6,1],[8,1],[7,1],[5,1],[6,1.5],[5,0.5],[3,2]]},
 {"t":"Café Opening Bell","key":67,"mode":"maj","bpm":108,"m":3,"style":"waltz","lead":"bell","A":["I","V","IV","I","ii","V","I","V"],"B":["vi","iii","IV","I","ii","V","I","I"],"mA":[[8,1],[7,1],[5,1],[6,2],[4,1]],"mB":[[3,1],[5,1],[8,1],[7,1.5],[6,0.5],[5,1]]},
 {"t":"Sea Breeze Promenade","key":70,"mode":"maj","bpm":92,"m":4,"style":"harp","lead":"flute","A":["I","iii","vi","IV","I","V","IV","V"],"B":["ii","V","iii","vi","ii","IV","V","I"],"mA":[[3,1.5],[4,0.5],[5,1],[8,1],[7,1],[6,1],[5,2]],"mB":[[4,1],[5,1],[6,2],[5,1],[3,1],[2,2]]},
 {"t":"Market Lanterns","key":72,"mode":"maj","bpm":100,"m":4,"style":"musicbox","lead":"bell","A":["I","IV","I","V","vi","IV","V","I"],"B":["IV","V","iii","vi","IV","V","I","I"],"mA":[[5,0.5],[6,0.5],[5,0.5],[3,0.5],[1,1],[2,1],[3,2],[5,2]],"mB":[[6,1],[6,1],[5,1],[4,1],[3,1.5],[2,0.5],[1,2]]},
 {"t":"Homeward Ferry","key":65,"mode":"maj","bpm":68,"m":4,"style":"harp","lead":"oboe","A":["I","vi","IV","V","I","iii","IV","V"],"B":["vi","IV","I","V","vi","ii","V","I"],"mA":[[1,1],[3,1],[5,1],[6,1],[5,2],[3,2]],"mB":[[8,2],[6,1],[5,1],[4,1.5],[3,0.5],[2,2]]},
 {"t":"Sunrise Over Thomson Bay","key":64,"mode":"maj","bpm":88,"m":4,"style":"harp","lead":"flute","A":["I","V","vi","IV","I","V","IV","V"],"B":["IV","V","iii","vi","ii","V","I","I"],"mA":[[1,1],[3,1],[5,1],[8,1],[7,1.5],[6,0.5],[5,2]],"mB":[[6,1],[5,1],[4,1],[3,1],[2,1],[3,1],[1,2]]},
 {"t":"Picnic at Pinky Beach","key":67,"mode":"maj","bpm":96,"m":3,"style":"waltz","lead":"bell","A":["I","IV","V","I","vi","IV","ii","V"],"B":["IV","V","iii","vi","ii","V","I","I"],"mA":[[5,1],[8,1],[7,1],[6,2],[5,1]],"mB":[[4,1],[6,1],[5,1],[3,2],[1,1]]},
 {"t":"Best Friends Forever","key":62,"mode":"maj","bpm":100,"m":4,"style":"march","lead":"flute","A":["I","iii","IV","V","I","iii","IV","V"],"B":["vi","IV","I","V","vi","IV","V","I"],"mA":[[5,0.5],[5,0.5],[6,1],[8,1],[7,0.5],[6,0.5],[5,1],[3,1],[5,2]],"mB":[[6,1],[8,1],[7,1],[5,1],[6,1.5],[7,0.5],[8,2]]},
 {"t":"The Day Mum and Dad Arrived","key":65,"mode":"maj","bpm":84,"m":4,"style":"ballad","lead":"flute","A":["I","V","vi","iii","IV","I","ii","V"],"B":["IV","V","iii","vi","ii","V","I","I"],"mA":[[3,1],[5,1],[8,2],[7,1],[6,1],[5,2]],"mB":[[6,1.5],[5,0.5],[4,1],[3,1],[2,1],[1,1],[3,2]]},
 {"t":"Hand in Hand on the Jetty","key":63,"mode":"maj","bpm":90,"m":3,"style":"musicbox","lead":"bell","A":["I","vi","IV","V","I","iii","IV","V"],"B":["vi","IV","I","V","ii","V","I","I"],"mA":[[3,1],[5,1],[8,1],[7,2],[6,1]],"mB":[[5,1.5],[4,0.5],[3,1],[2,2],[1,1]]},
 {"t":"Warm Bread, Warm Hearts","key":70,"mode":"maj","bpm":82,"m":4,"style":"harp","lead":"oboe","A":["I","IV","I","V","vi","IV","ii","V"],"B":["IV","I","IV","V","iii","vi","V","I"],"mA":[[1,1],[2,1],[3,1],[5,1],[6,2],[5,2]],"mB":[[8,2],[6,1],[5,1],[4,1],[3,1],[2,2]]},
 {"t":"Quokka Parade","key":69,"mode":"maj","bpm":98,"m":4,"style":"march","lead":"bell","A":["I","V","IV","V","I","vi","ii","V"],"B":["IV","V","iii","vi","IV","V","I","I"],"mA":[[1,0.5],[3,0.5],[5,1],[6,1],[5,1],[8,1.5],[7,0.5],[5,2]],"mB":[[6,1],[5,1],[4,1],[3,1],[5,1],[2,1],[1,2]]},
 {"t":"Fireworks Over the Swan","key":60,"mode":"maj","bpm":94,"m":4,"style":"harp","lead":"flute","A":["vi","IV","I","V","vi","IV","V","V"],"B":["IV","V","iii","vi","ii","V","I","I"],"mA":[[6,1],[5,1],[8,2],[9,1],[8,1],[5,2]],"mB":[[4,1],[5,1],[6,1.5],[5,0.5],[3,1],[2,1],[1,2]]},
 {"t":"Lighthouse Keeper’s Thank-You","key":62,"mode":"min","bpm":86,"m":3,"style":"waltz","lead":"oboe","A":["i","VI","III","VII","i","iv","V","V"],"B":["VI","VII","III","VI","iv","V","i","i"],"mA":[[1,1],[3,1],[5,1],[6,2],[5,1]],"mB":[[4,1],[3,1],[2,1],[3,3]]},
 {"t":"Home Is Where You Are","key":67,"mode":"maj","bpm":80,"m":4,"style":"ballad","lead":"flute","A":["I","V","vi","IV","I","V","IV","V"],"B":["vi","IV","I","V","ii","IV","V","I"],"mA":[[5,1],[6,1],[8,2],[7,1],[5,1],[6,2]],"mB":[[8,1.5],[7,0.5],[6,1],[5,1],[3,1],[2,1],[1,2]]}];
function crSemi(tr,deg){const sc=CR_SCALES[tr.mode],i=deg-1,o=Math.floor(i/7),k=((i%7)+7)%7;return sc[k]+12*o;}
function crChord(tr,ch){const r=CR_ROOT[ch];const degs=[r,r+2,r+4];return degs.map((d,j)=>{let s=crSemi(tr,d);if(tr.mode==='min'&&(ch==='V')&&j===1)s+=1;return s;});}
function crChordDegSet(ch){const r=CR_ROOT[ch];return[r,r+2,r+4].map(d=>((d-1)%7+7)%7);}
function crCompile(tr){const ev=[],m=tr.m;let bar=0;const melody=(sec,mot,oct,vol,dbl)=>{for(let g=0;g<4;g++){const c0=sec[g*2],c1=sec[g*2+1];let sh=CR_ROOT[c0]-CR_ROOT[sec[0]];if(sh>3)sh-=7;if(sh<-3)sh+=7;let b=0;const notes=mot.map(([d,du])=>[d+sh,du]);
      const fin=g===3;notes.forEach(([d,du],ni)=>{const bb=b;b+=du;if(fin&&bb>=m)return;const chNow=bb<m?c0:c1;let dd=d;if(Math.abs(bb-Math.round(bb))<1e-6&&du>=1){const set=crChordDegSet(chNow);let best=dd,bd=9;for(let x=-2;x<=2;x++){if(set.includes((((dd+x)-1)%7+7)%7)&&Math.abs(x)<bd){bd=Math.abs(x);best=dd+x;}}dd=best;}
        ev.push({b:(bar+g*2)*m+bb,k:'lead',n:tr.key+crSemi(tr,dd)+12*oct,d:du,v:vol});if(dbl)ev.push({b:(bar+g*2)*m+bb,k:'bell',n:tr.key+crSemi(tr,dd)+12*(oct+1),d:du,v:vol*.5});});
      if(fin){const set=crChordDegSet(c1);let d=sec[7]==='I'||sec[7]==='i'?8:5;ev.push({b:(bar+g*2+1)*m,k:'lead',n:tr.key+crSemi(tr,d)+12*oct,d:m,v:vol});}}};
  const accomp=(sec,nb)=>{for(let i=0;i<nb;i++){const ch=sec[i%sec.length],tones=crChord(tr,ch),root=tr.key-24+tones[0],B=(bar+i)*m;
      if(tr.style==='harp'){for(let k=0;k<m*2;k++){const o=k%6,idx=[0,1,2,0,1,2][o]+ (o>=3?3:0);const n=tr.key-12+tones[idx%3]+12*Math.floor(idx/3);ev.push({b:B+k*.5,k:'harp',n,v:k%2?.45:.6});}ev.push({b:B,k:'bass',n:root,d:m,v:.14});ev.push({b:B,k:'strings',ns:tones.map(t=>tr.key-12+t),d:m,v:.008});}
      else if(tr.style==='waltz'){ev.push({b:B,k:'bass',n:root,d:1,v:.16});for(const q of [1,2])tones.forEach(t=>ev.push({b:B+q,k:'piano',n:tr.key-12+t,d:.8,v:.32}));}
      else if(tr.style==='march'){ev.push({b:B,k:'bass',n:root,d:1.5,v:.17});ev.push({b:B+2,k:'bass',n:root+7,d:1.5,v:.13});for(const q of [1,3])tones.forEach(t=>ev.push({b:B+q,k:'piano',n:tr.key-12+t,d:.5,v:.3}));for(let q=0;q<m;q++)ev.push({b:B+q,k:'hat',v:q%2?.5:.8});ev.push({b:B+3.5,k:'hat',v:.4});}
      else if(tr.style==='ballad'){ev.push({b:B,k:'bass',n:root,d:m,v:.13});ev.push({b:B,k:'strings',ns:tones.map(t=>tr.key-12+t),d:m,v:.011});for(let q=0;q<m;q++)ev.push({b:B+q,k:'piano',n:tr.key-12+tones[[0,1,2,1][q]]+(q===2?12:0),d:1.4,v:.35});}
      else if(tr.style==='musicbox'){ev.push({b:B,k:'bass',n:root,d:m,v:.12});for(let k=0;k<m*2;k++)ev.push({b:B+k*.5,k:'bell',n:tr.key+tones[k%3]+(k%6>=3?12:0),d:.5,v:.25});}}};
  accomp(tr.A,2);bar+=2;
  // second half: a varied verse, a bridge on new chords, the B theme up an octave and a last A, so each piece runs about 2-4 minutes
  const vary=mot=>{const o=[];mot.forEach(([d,du],i)=>{if(du>=2){o.push([d,du/2]);o.push([d+(i%2?-1:1),du/2]);}else o.push([d,du]);});return o;};
  const BR=tr.mode==='min'?['VI','VII','III','i','iv','VI','V','V']:['vi','iii','IV','I','ii','vi','IV','V'];
  const run=([sec,mot,oct,vol,dbl])=>{accomp(sec,8);melody(sec,mot,oct,vol,dbl);bar+=8;};
  [[tr.A,tr.mA,0,.55,false],[tr.A,tr.mA,1,.5,true],[tr.B,tr.mB,0,.55,false],[tr.A,tr.mA,0,.55,true]].forEach(run);
  accomp(tr.B.slice(0,4),4);bar+=4;
  [[tr.A,vary(tr.mA),0,.5,false],[BR,vary(tr.mB).map(([d,du])=>[d+2,du]),0,.5,false],[tr.B,tr.mB,1,.48,true],[tr.A,tr.mA,0,.55,true]].forEach(run);
  accomp([tr.A[0]],2);ev.push({b:bar*m,k:'lead',n:tr.key+crSemi(tr,8),d:m*2,v:.45});bar+=2;
  ev.sort((a,b)=>a.b-b.b);return{ev,beats:bar*m};}
function flute(t,mi,dur,vel){const c=RADIO.ctx,f=mtof(mi);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13*vel,t+.07);g.gain.setValueAtTime(.11*vel,t+Math.max(.08,dur-.08));g.gain.linearRampToValueAtTime(0,t+dur+.15);
  const o=c.createOscillator();o.type='sine';o.frequency.value=f;const o2=c.createOscillator();o2.type='triangle';o2.frequency.value=f*2;const g2=c.createGain();g2.gain.value=.12;o2.connect(g2);g2.connect(g);o.connect(g);
  const vib=c.createOscillator();vib.frequency.value=5.2;const vg=c.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*.006,t+Math.min(.5,dur));vib.connect(vg);vg.connect(o.frequency);
  [o,o2,vib].forEach(x=>{x.start(t);x.stop(t+dur+.2);});out(g,.75,.5);}
function oboe(t,mi,dur,vel){const c=RADIO.ctx,f=mtof(mi);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07*vel,t+.05);g.gain.setValueAtTime(.06*vel,t+Math.max(.06,dur-.06));g.gain.linearRampToValueAtTime(0,t+dur+.12);
  const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;const bp=c.createBiquadFilter();bp.type='lowpass';bp.frequency.value=Math.min(4200,f*4);bp.Q.value=2;
  const vib=c.createOscillator();vib.frequency.value=5.6;const vg=c.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*.005,t+Math.min(.4,dur));vib.connect(vg);vg.connect(o.frequency);
  o.connect(bp);bp.connect(g);[o,vib].forEach(x=>{x.start(t);x.stop(t+dur+.2);});out(g,.7,.5);}
function bell(t,mi,dur,vel){const c=RADIO.ctx,f=mtof(mi);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12*vel,t+.004);g.gain.exponentialRampToValueAtTime(.0008,t+1.6);
  [[1,1],[2.76,.35],[5.4,.12]].forEach(([h,a])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f*h;const og=c.createGain();og.gain.value=a;o.connect(og);og.connect(g);o.start(t);o.stop(t+1.7);});out(g,.65,.6);}
function harp(t,mi,vel){const c=RADIO.ctx,f=mtof(mi);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.14*vel,t+.003);g.gain.exponentialRampToValueAtTime(.0008,t+2.2);
  const o=c.createOscillator();o.type='triangle';o.frequency.value=f;const o2=c.createOscillator();o2.type='sine';o2.frequency.value=f*2;const g2=c.createGain();g2.gain.value=.3;o2.connect(g2);g2.connect(g);o.connect(g);[o,o2].forEach(x=>{x.start(t);x.stop(t+2.3);});out(g,.6,.6);}
function strings(t,ns,dur,vol){const c=RADIO.ctx;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(1.2,dur*.4));g.gain.setValueAtTime(vol,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur+.4);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;
  ns.forEach(m=>[-9,0,9].forEach(d=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(lp);o.start(t);o.stop(t+dur+.5);}));lp.connect(g);out(g,.45,.7);}
function crStart(i){const tr=CRYSTAL[((i%CRYSTAL.length)+CRYSTAL.length)%CRYSTAL.length];RADIO.trk=CRYSTAL.indexOf(tr);RADIO.cr=crCompile(tr);RADIO.crI=0;RADIO.crT0=RADIO.ctx.currentTime+.15;RADIO.crSpb=60/tr.bpm;RADIO.crLoops=0;
  if(QCR.onTrack)QCR.onTrack();}
function crTick(){const c=RADIO.ctx;if(!RADIO.cr)crStart(RADIO.trk||0);const C=RADIO.cr,spb=RADIO.crSpb;const win=c.currentTime+.6;
  while(RADIO.crI<C.ev.length){const e=C.ev[RADIO.crI];const t=RADIO.crT0+e.b*spb;if(t>win)break;RADIO.crI++;if(t<c.currentTime-.05)continue;
    const tr=CRYSTAL[RADIO.trk];if(e.k==='lead'){(tr.lead==='flute'?flute:tr.lead==='oboe'?oboe:bell)(t,e.n,e.d*spb*.95,e.v*1.6);}else if(e.k==='bell')bell(t,e.n,e.d*spb,e.v*1.4);else if(e.k==='harp')harp(t,e.n,e.v);else if(e.k==='piano')piano(t,e.n,e.d*spb,e.v*1.4);else if(e.k==='bass')bass(t,e.n,e.d*spb,e.v*.65);else if(e.k==='strings')strings(t,e.ns,e.d*spb,e.v*.8);else if(e.k==='hat')hat(t,e.v*.6);}
  if(RADIO.crI>=C.ev.length&&c.currentTime>RADIO.crT0+C.beats*spb+1.2){crStart((RADIO.trk||0)+1);}}
const PROG={seaside:[[48,[60,64,67,71]],[45,[57,60,64,67]],[41,[57,60,65,69]],[43,[59,62,67,71]],[40,[59,64,67,71]],[45,[57,60,64,69]],[38,[57,62,65,69]],[43,[55,59,62,65]]],
 lofi:[[38,[60,62,65,69]],[43,[59,62,65,69]],[36,[59,62,64,67]],[45,[55,60,64,67]]],
 breeze:[[38,[50,57,62]],[34,[46,53,58]],[36,[48,55,60]],[33,[45,52,57]]]};
const SCALE={seaside:[72,74,76,79,81,84,86],lofi:[69,72,74,76,79,81],breeze:[62,64,65,69,70,74,76,77,81]};
function radioSchedule(){const c=RADIO.ctx;if(!c||RADIO.st==='off')return;if(RADIO.st==='crystal'){crTick();return;}const S2=RSTATIONS[RADIO.st],spb=60/S2.bpm,e=spb/2;
  while(RADIO.next<c.currentTime+.6){const t=RADIO.next,st=RADIO.step%16,P=PROG[RADIO.st],ch=P[RADIO.bar%P.length];
    if(RADIO.st==='seaside'){if(st===0){bass(t,ch[0],spb*3.6,.16);pad(t,ch[1].map(m=>m-12),spb*8,.012);}if(st===8)bass(t,ch[0]+7,spb*3.2,.1);
      const arp=[0,1,2,3,2,1,2,3][st%8];if(st%2===0||Math.random()<.3)piano(t+(Math.random()*.012),ch[1][arp]+(st>=8&&arp===3?12:0),e*1.6,st%4===0?.9:.6);
      if(Math.random()<.22){const sc=SCALE.seaside;piano(t+e*.5,sc[Math.floor(Math.random()*sc.length)],spb*1.5,.55);}}
    else if(RADIO.st==='lofi'){const sw=(st%2)?e*.18:0;if(st===0||st===10)kick(t);if(st===4||st===12)snare(t+sw);if(st%2===0||Math.random()<.4)hat(t+sw,st%4===0?1:.6);
      if(st===0){ch[1].forEach((m,i)=>epiano(t+i*.025,m,spb*3.5,.7));bass(t,ch[0],spb*2.8,.2);}if(st===8){ch[1].slice(1).forEach((m,i)=>epiano(t+sw+i*.02,m,spb*2,.5));bass(t,ch[0]+7,spb*1.8,.14);}
      if(st%4===2&&Math.random()<.45){const sc=SCALE.lofi;epiano(t+sw,sc[Math.floor(Math.random()*sc.length)],spb,.55);}}
    else if(RADIO.st==='breeze'){if(st===0){pad(t,ch[1],spb*8,.016);bass(t,ch[0],spb*6,.12);}const sc=SCALE.breeze;
      if(st%2===0&&Math.random()<.7){const i=Math.floor(Math.random()*sc.length);pluck(t,sc[i],st%8===0?.9:.6);if(Math.random()<.25)pluck(t+e*.5,sc[Math.min(sc.length-1,i+1)],.45);}
      if(st===14&&Math.random()<.35){for(let k=0;k<5;k++)pluck(t+k*.06,sc[Math.min(sc.length-1,k+2)],.35);}}
    RADIO.next+=e;RADIO.step++;if(RADIO.step%16===0)RADIO.bar++;}}

const QCR={onTrack:null,
 get st(){return RADIO.st;},
 track(){return RADIO.st==='crystal'&&RADIO.trk!=null?CRYSTAL[RADIO.trk]:null;},
 trackNo(){return (RADIO.trk||0)+1;},
 count:CRYSTAL.length,
 stations:RSTATIONS,
 level(){if(!RADIO.an||RADIO.st==='off')return 0;const a=new Uint8Array(RADIO.an.fftSize);RADIO.an.getByteTimeDomainData(a);let m=0;for(const v of a)m=Math.max(m,Math.abs(v-128));return m/128;},
 play(st){RADIO.st=st;RADIO.nodes.forEach(n=>{try{n.stop();}catch(e){}});RADIO.nodes=[];
  if(!radioInit())return false;const c=RADIO.ctx;if(c.state==='suspended')c.resume();
  RADIO.master.gain.cancelScheduledValues(c.currentTime);RADIO.master.gain.setTargetAtTime(RADIO.vol*.9,c.currentTime,.4);
  RADIO.next=c.currentTime+.1;RADIO.step=0;RADIO.bar=Math.floor(Math.random()*4);
  if(st==='crystal'){RADIO.cr=null;if(RADIO.trk==null)RADIO.trk=Math.floor(Math.random()*CRYSTAL.length);}
  if(st==='seaside')loopNoise('wave');if(st==='lofi')loopNoise('crackle');
  if(!RADIO.timer)RADIO.timer=setInterval(radioSchedule,100);radioSchedule();if(QCR.onTrack)QCR.onTrack();return true;},
 off(){RADIO.st='off';RADIO.nodes.forEach(n=>{try{n.stop();}catch(e){}});RADIO.nodes=[];if(RADIO.master)RADIO.master.gain.setTargetAtTime(0,RADIO.ctx.currentTime,.25);clearInterval(RADIO.timer);RADIO.timer=null;},
 vol(v){RADIO.vol=v;if(RADIO.master&&RADIO.st!=='off')RADIO.master.gain.setTargetAtTime(v*.9,RADIO.ctx.currentTime,.1);},
 skip(d){if(RADIO.st!=='crystal'||!RADIO.ctx)return;crStart((RADIO.trk||0)+d);}
};
window.QCR=QCR;
})();
