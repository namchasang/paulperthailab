/* Quokka Cafe Radio: the music engine from Quokka Cafe and Friends (namchasang.github.io/quokka-cafe). Every note is synthesised live with Web Audio.
   Built by tools/build-radio.js from the game's code. */
(function(){'use strict';
const RADIO={ctx:null,master:null,rev:null,st:'off',vol:.5,timer:null,next:0,step:0,bar:0,nodes:[],wave:null,crackle:null};
const RSTATIONS={
 seaside:{name:'Seaside Piano',desc:'Gentle piano and soft waves, like a slow morning on the jetty.',bpm:72},
 beats:{name:'Lo-fi Beats',desc:'30 original lo-fi hip hop tracks for work and study: jazzy chords, boom-bap drums, vinyl crackle.',bpm:86},
 lofi:{name:'Island Lo-fi',desc:'30 original lo-fi tracks: 15 to study and work to, 15 slow ones with soft rain on the roof.',bpm:78},
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
 {t:'Island Overture',key:62,mode:'maj',bpm:80,m:4,style:'harp',lead:'flute',A:['I','V','vi','iii','IV','I','ii','V'],B:['IV','V','iii','vi','ii','V','I','I'],mA:[[3,1],[5,1],[8,2],[7,1],[9,1],[5,2]],mB:[[6,1.5],[5,.5],[4,1],[3,1],[2,2],[1,2]]},
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
 {t:'Goodnight, Rottnest',key:62,mode:'maj',bpm:88,m:3,style:'waltz',lead:'flute',A:['I','vi','IV','V','I','iii','IV','V'],B:['IV','V','iii','vi','ii','V','I','I'],mA:[[5,2],[3,1],[2,1],[1,1],[3,1]],mB:[[8,1.5],[7,.5],[6,1],[5,2],[3,1]]},
 {"t":"Morning Tide","key":64,"mode":"maj","bpm":76,"m":4,"style":"harp","lead":"flute","A":["I","IV","vi","V","I","IV","ii","V"],"B":["vi","IV","I","V","ii","IV","V","I"],"mA":[[5,1],[3,0.5],[5,0.5],[6,2],[5,1],[8,1],[6,2]],"mB":[[3,1],[4,1],[5,1.5],[4,0.5],[3,2],[2,2]]},
 {"t":"Pink Lake Lullaby","key":65,"mode":"maj","bpm":62,"m":3,"style":"musicbox","lead":"bell","A":["I","vi","ii","V","I","IV","V","I"],"B":["IV","iii","vi","V","IV","I","V","I"],"mA":[[5,1],[3,1],[1,1],[2,2],[5,1]],"mB":[[6,1],[5,1],[4,1],[3,3]]},
 {"t":"Island Express","key":69,"mode":"maj","bpm":120,"m":4,"style":"march","lead":"flute","A":["I","IV","V","I","vi","IV","ii","V"],"B":["IV","V","vi","iii","IV","I","ii","V"],"mA":[[1,0.5],[1,0.5],[5,1],[4,0.5],[3,0.5],[2,1],[3,1],[5,1],[1,2]],"mB":[[6,1],[8,1],[7,1],[5,1],[6,1.5],[5,0.5],[3,2]]},
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
        ev.push({b:(bar+g*2)*m+bb,k:'lead',n:tr.key+crSemi(tr,dd)+12*oct,d:du,v:vol});if(dbl){let bn=tr.key+crSemi(tr,dd)+12*(oct+1);while(bn>100)bn-=12;ev.push({b:(bar+g*2)*m+bb,k:'bell',n:bn,d:du,v:vol*.5});}});
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
// ---------- Island Lo-fi: 30 original lo-fi tracks (composed for Quokka Cafe) ----------
// set 'study' = lofi to study & work (warm e-piano, boom-bap drums, vinyl crackle)
// set 'rain'  = soft rain + slow lofi (slow piano, half-time brushes, rain on the roof)
// Chords: [semitones above the key, quality]. Every track is built the same way each time it plays.
const LF_V={maj7:[4,7,11,14],maj9:[4,7,11,14],m7:[3,7,10,14],m9:[3,7,10,14],'7':[4,10,14,21],'9sus':[5,10,14,19],'13':[4,10,14,21],m6:[3,7,9,14],'69':[4,9,14,19],m11:[3,10,14,17],add9:[4,7,14,16]};
const LF_P={
 a:[[0,'maj9'],[9,'m9'],[2,'m9'],[7,'9sus']],
 b:[[5,'maj7'],[4,'m7'],[2,'m7'],[0,'maj9']],
 c:[[2,'m9'],[7,'13'],[0,'maj9'],[9,'m9']],
 d:[[9,'m9'],[5,'maj9'],[0,'maj7'],[7,'9sus']],
 e:[[0,'maj7'],[0,'7'],[5,'maj7'],[5,'m6']],
 f:[[4,'m7'],[9,'m9'],[2,'m9'],[7,'13']],
 g:[[5,'maj7'],[7,'9sus'],[4,'m7'],[9,'m9']],
 h:[[0,'m9'],[5,'m9'],[10,'9sus'],[3,'maj7']],
 i:[[0,'m9'],[8,'maj7'],[3,'maj7'],[10,'69']],
 j:[[0,'m11'],[3,'maj7'],[5,'m9'],[7,'9sus']],
 k:[[5,'maj9'],[5,'m6'],[0,'maj9'],[0,'69']],
 l:[[2,'m9'],[4,'m7'],[5,'maj9'],[7,'9sus']]};
const LOFI=[
 {t:'Flat White Focus',set:'study',key:62,bpm:82,A:'a',B:'c',lead:'ep',sw:.16,r:0,len:236,seed:11},
 {t:'Notes on the Ferry',set:'study',key:65,bpm:78,A:'b',B:'f',lead:'pluck',sw:.18,r:1,len:240,seed:23},
 {t:'Thomson Bay Homework',set:'study',key:60,bpm:86,A:'c',B:'g',lead:'ep',sw:.14,r:2,len:232,seed:37},
 {t:'Pencil Shavings',set:'study',key:63,bpm:80,A:'e',B:'b',lead:'bell',sw:.17,r:3,len:238,seed:41},
 {t:'Library at the Settlement',set:'study',key:57,bpm:76,A:'h',B:'j',lead:'piano',sw:.15,r:4,len:244,seed:53},
 {t:'Espresso & Index Cards',set:'study',key:64,bpm:88,A:'g',B:'a',lead:'pluck',sw:.16,r:0,len:230,seed:67},
 {t:'Kip’s Study Desk',set:'study',key:61,bpm:84,A:'d',B:'l',lead:'ep',sw:.18,r:2,len:236,seed:71},
 {t:'Lighthouse Wi-Fi',set:'study',key:59,bpm:80,A:'f',B:'c',lead:'bell',sw:.15,r:1,len:240,seed:83},
 {t:'Salt Air Deadlines',set:'study',key:58,bpm:90,A:'i',B:'h',lead:'pluck',sw:.13,r:3,len:228,seed:97},
 {t:'Bike Bell Break',set:'study',key:65,bpm:86,A:'k',B:'e',lead:'ep',sw:.17,r:4,len:234,seed:101},
 {t:'Afternoon Lamington',set:'study',key:62,bpm:78,A:'l',B:'d',lead:'piano',sw:.18,r:0,len:242,seed:113},
 {t:'Quiet Hours at the Café',set:'study',key:60,bpm:74,A:'b',B:'k',lead:'ep',sw:.16,r:1,len:238,seed:127},
 {t:'Postcard Draft',set:'study',key:64,bpm:82,A:'j',B:'i',lead:'bell',sw:.15,r:2,len:236,seed:131},
 {t:'Mango Smoothie Pomodoro',set:'study',key:67,bpm:88,A:'a',B:'g',lead:'pluck',sw:.14,r:3,len:230,seed:149},
 {t:'Last Ferry, Last Chapter',set:'study',key:63,bpm:76,A:'d',B:'b',lead:'ep',sw:.17,r:4,len:244,seed:151},
 {t:'Rain on the Awning',set:'rain',key:62,bpm:68,A:'b',B:'d',lead:'piano',sw:.12,r:5,len:236,seed:163},
 {t:'Wet Sand, Warm Mug',set:'rain',key:60,bpm:64,A:'k',B:'a',lead:'ep',sw:.1,r:6,len:240,seed:167},
 {t:'Grey Morning at Geordie Bay',set:'rain',key:57,bpm:66,A:'h',B:'i',lead:'piano',sw:.12,r:7,len:238,seed:173},
 {t:'Drizzle on the Jetty',set:'rain',key:64,bpm:70,A:'a',B:'f',lead:'bell',sw:.11,r:5,len:234,seed:179},
 {t:'Window Seat',set:'rain',key:65,bpm:62,A:'e',B:'k',lead:'piano',sw:.1,r:8,len:244,seed:181},
 {t:'Umbrella for Two',set:'rain',key:63,bpm:68,A:'g',B:'b',lead:'ep',sw:.12,r:6,len:236,seed:191},
 {t:'Storm over the Salt Lakes',set:'rain',key:59,bpm:64,A:'j',B:'h',lead:'piano',sw:.1,r:7,len:240,seed:193},
 {t:'Foggy Lighthouse',set:'rain',key:61,bpm:66,A:'i',B:'j',lead:'bell',sw:.11,r:8,len:238,seed:197},
 {t:'Kip Naps Through the Rain',set:'rain',key:60,bpm:60,A:'d',B:'e',lead:'piano',sw:.1,r:5,len:246,seed:199},
 {t:'Damp Postcards',set:'rain',key:62,bpm:70,A:'c',B:'l',lead:'ep',sw:.12,r:6,len:232,seed:211},
 {t:'Steam from the Teapot',set:'rain',key:65,bpm:64,A:'f',B:'a',lead:'piano',sw:.11,r:7,len:240,seed:223},
 {t:'Slow Ferry in the Rain',set:'rain',key:58,bpm:62,A:'h',B:'k',lead:'ep',sw:.1,r:8,len:244,seed:227},
 {t:'Rainy Day Reading',set:'rain',key:64,bpm:66,A:'l',B:'c',lead:'piano',sw:.12,r:5,len:238,seed:229},
 {t:'Puddles by the Bakery',set:'rain',key:67,bpm:68,A:'b',B:'g',lead:'bell',sw:.11,r:6,len:236,seed:233},
 {t:'After the Storm',set:'rain',key:60,bpm:62,A:'a',B:'d',lead:'piano',sw:.1,r:8,len:238,seed:239}];
// two-bar melody rhythms: [start beat, length in beats]
const LF_R=[
 [[0,1.5],[1.5,.5],[2,1],[3.5,.5],[4,2],[6.5,1.5]],
 [[.5,.5],[1,1],[2,.5],[2.5,1.5],[4.5,.5],[5,2]],
 [[0,.75],[.75,.75],[1.5,1],[3,1],[4,3]],
 [[1,.5],[1.5,.5],[2,1.5],[4,.5],[4.5,.5],[5,1],[6,1.5]],
 [[0,2],[2.5,.5],[3,1],[4,1.5],[6,1]],
 [[0,1],[2,2],[4.5,.5],[5,2.5]],
 [[0,3],[3.5,.5],[4,1],[5,2.5]],
 [[1,1],[2,2],[5,1],[6,2]],
 [[0,2.5],[3,1],[4.5,3]]];
function lfRng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function lfVoice(key,ch,prev){const iv=LF_V[ch[1]],root=key+ch[0];let best=null,bd=1e9;
  for(let o=-24;o<=24;o+=12){const ns=iv.map(x=>root+x+o).sort((a,b)=>a-b);const c=ns.reduce((a,b)=>a+b,0)/ns.length;const d=Math.abs(c-(prev||66));if(ns[0]>=52&&ns[ns.length-1]<=79&&d<bd){bd=d;best=ns;}}
  return best||iv.map(x=>root+x);}
function lfCompile(tr){const R=lfRng(tr.seed),ev=[],rain=tr.set==='rain',spbar=4;
  const minor=['h','i','j'].includes(tr.A);const pent=minor?[0,3,5,7,10]:[0,2,4,7,9];
  const scale=[];for(let o=-12;o<=36;o+=12)pent.forEach(p=>scale.push(tr.key+p+o));
  const lo=tr.key+9,hi=tr.key+24;
  // song form, sized to tr.len seconds
  const target=Math.round(tr.len*tr.bpm/60/spbar);const form=[['I',4],['A',8]];let used=12;
  while(used+16+8<=target){form.push(['M',8],['N',8]);used+=16;if(used+4+16+8<=target&&form.filter(f=>f[0]==='M').length%2===1){form.push(['K',4]);used+=4;}}
  while(used+8+4<=target){form.push(['A',8]);used+=8;}
  while(used+4+4<=target){form.push(['K',4]);used+=4;}
  form.push(['O',4]);used+=4;
  const motifs=[0,1].map(()=>{const r=LF_R[(tr.r+Math.floor(R()*3))%LF_R.length];let s=0;return r.map(()=>{s+=R()<.5?(R()<.5?-1:1):(R()<.5?-2:2);if(s>4)s-=3;if(s<-4)s+=3;return s;}).map((s,i)=>[r[i][0],r[i][1],s]);});
  let bar=0,prevV=66;
  const near=(m,arr)=>arr.reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a);
  form.forEach(([sec,n],si)=>{const prog=LF_P[sec==='N'?tr.B:tr.A];
    const drums=sec==='A'||sec==='M'||sec==='N'||(sec==='O'&&!rain);
    for(let k=0;k<n;k++){const B=(bar+k)*spbar,ch=prog[(bar+k)%4],root=tr.key+ch[0];
      const fade=sec==='O'?1-k/n*.55:sec==='I'?.7+k/n*.3:1;
      const v=lfVoice(tr.key,ch,prevV);prevV=v.reduce((a,b)=>a+b,0)/v.length;
      const last=sec==='O'&&k===n-1;
      // chords
      if(rain){ev.push({b:B,k:'ep',ns:v,d:last?6:3.8,v:.42*fade});
        [0,2,1,3].forEach((j,q)=>{if(q<3||R()<.6)ev.push({b:B+q*1+(q%2?tr.sw*.5:0)+.02,k:'pn',n:v[j]+12>84?v[j]:v[j]+12,d:1.6,v:.32*fade});});}
      else{ev.push({b:B,k:'ep',ns:v,d:last?6:1.6,v:.55*fade});if(!last){ev.push({b:B+2.5+tr.sw*.5,k:'ep',ns:v.slice(1),d:1,v:.38*fade});if(R()<.35)ev.push({b:B+3.5+tr.sw*.5,k:'ep',ns:v.slice(2),d:.5,v:.28*fade});}}
      // bass
      if(sec!=='I'||k>=2){let bn=root;while(bn>45)bn-=12;while(bn<33)bn+=12;
        if(rain){ev.push({b:B,k:'bass',n:bn,d:last?5:3.4,v:.19*fade});if(R()<.4&&!last)ev.push({b:B+3,k:'bass',n:bn+7,d:.9,v:.11*fade});}
        else{ev.push({b:B,k:'bass',n:bn,d:1.4,v:.21*fade});if(!last){ev.push({b:B+2.5+tr.sw*.5,k:'bass',n:R()<.5?bn+7:bn+12,d:.8,v:.15*fade});if(R()<.3)ev.push({b:B+3.5+tr.sw*.5,k:'bass',n:bn+10,d:.4,v:.1*fade});}}}
      // drums
      if(drums&&!last){
        if(rain){ev.push({b:B,k:'kick',v:.75});if(R()<.5)ev.push({b:B+2.5+tr.sw*.5,k:'kick',v:.5});ev.push({b:B+2,k:'rim',v:.8});
          for(let h=0;h<8;h++){if(h%2===0||R()<.35)ev.push({b:B+h*.5+(h%2?tr.sw:0),k:'hat',v:h%2?.35:.55});}}
        else{ev.push({b:B,k:'kick',v:1});if(R()<.6)ev.push({b:B+1.5+tr.sw*.5,k:'kick',v:.6});ev.push({b:B+2.5+tr.sw*.5,k:'kick',v:.85});
          ev.push({b:B+1,k:'snare',v:1});ev.push({b:B+3,k:'snare',v:1});if(R()<.25)ev.push({b:B+3.75,k:'snare',v:.3});
          for(let h=0;h<8;h++){ev.push({b:B+h*.5+(h%2?tr.sw:0),k:'hat',v:h%2?.55:(h%4===0?1:.75)});}}}
    }
    // melody: two-bar motif, answered, repeated, then a held cadence
    if(sec==='M'||sec==='N'||(sec==='K'&&!rain)||(sec==='O'&&rain)){const mo=motifs[sec==='N'?1:0];
      for(let g=0;g<n/2;g++){const b0=(bar+g*2)*spbar,ch=prog[(bar+g*2)%4];const ct=LF_V[ch[1]].map(x=>tr.key+ch[0]+x);
        let base=near(tr.key+17+(g%2?2:0),scale.filter(m=>m>=lo&&m<=hi));
        const cad=g===n/2-1;
        mo.forEach(([st,du,s],ni)=>{if(sec==='K'&&ni%2)return;if(cad&&st>=4)return;
          let idx=scale.indexOf(base)+s+(g===2&&ni===mo.length-1?1:0);idx=Math.max(0,Math.min(scale.length-1,idx));let m=scale[idx];
          while(m>hi)m-=12;while(m<lo)m+=12;
          if(du>=1&&Number.isInteger(st)){const c=ct.map(x=>{while(x<lo)x+=12;while(x>hi)x-=12;return x;});const cn=near(m,c);if(Math.abs(cn-m)<=2)m=cn;}
          ev.push({b:b0+st+(st%1?tr.sw*.5:0),k:'lead',n:m,d:du,v:(rain?.55:.6)});});
        if(cad){const c=ct.map(x=>{while(x<lo)x+=12;while(x>hi)x-=12;return x;});ev.push({b:b0+4,k:'lead',n:near(base,c),d:3.5,v:rain?.5:.55});}}}
    bar+=n;});
  const beats=used*spbar+(rain?2:1);
  ev.push({b:0,k:'bed',kind:rain?'rain':'crackle',d:beats});
  ev.sort((a,b)=>a.b-b.b);return{ev,beats};}
function rim(t,v){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=4;const g=c.createGain();g.gain.setValueAtTime(.11*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);s.connect(bp);bp.connect(g);s.start(t,Math.random());s.stop(t+.09);out(g,.6,.35);
  const o=c.createOscillator();o.type='triangle';o.frequency.value=820;const og=c.createGain();og.gain.setValueAtTime(.05*v,t);og.gain.exponentialRampToValueAtTime(.001,t+.04);o.connect(og);o.start(t);o.stop(t+.05);out(og,.6,.2);}
function lkick(t,v){const c=RADIO.ctx;const o=c.createOscillator();o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);const g=c.createGain();g.gain.setValueAtTime(.3*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.34);o.connect(g);o.start(t);o.stop(t+.36);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;g.connect(lp);out(lp,1,0);}
function lsnare(t,v){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1600;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200;const g=c.createGain();g.gain.setValueAtTime(.085*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);s.connect(bp);bp.connect(lp);lp.connect(g);s.start(t,Math.random());s.stop(t+.22);out(g,.65,.3);
  const o=c.createOscillator();o.type='triangle';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);const og=c.createGain();og.gain.setValueAtTime(.06*v,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(og);o.start(t);o.stop(t+.12);out(og,.7,.1);}
function lhat(t,v){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=6500;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=10000;const g=c.createGain();g.gain.setValueAtTime(.035*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(hp);hp.connect(lp);lp.connect(g);s.start(t,Math.random());s.stop(t+.07);out(g,.7,0);}
// rain on the roof, or vinyl crackle, under a whole track
function lbedBuf(c){if(RADIO.bedCtx!==c){const n=c.sampleRate*9,b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}RADIO.bedBuf=b;RADIO.bedCtx=c;}return RADIO.bedBuf;}
function lbed(t,dur,kind){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=lbedBuf(c);s.loop=true;const g=c.createGain();const lvl=kind==='rain'?.06:.016;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+3);g.gain.setValueAtTime(lvl,t+Math.max(3,dur-3));g.gain.linearRampToValueAtTime(0,t+dur+1);
  if(kind==='rain'){const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3800;const pk=c.createBiquadFilter();pk.type='peaking';pk.frequency.value=1400;pk.gain.value=-6;s.connect(hp);hp.connect(lp);lp.connect(pk);pk.connect(g);
    const s2=c.createBufferSource();s2.buffer=lbedBuf(c);s2.loop=true;s2.playbackRate.value=.5;const lp2=c.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=420;const g2=c.createGain();g2.gain.value=.7;s2.connect(lp2);lp2.connect(g2);g2.connect(g);s2.start(t,Math.random());s2.stop(t+dur+1.2);
    const l=c.createOscillator();l.frequency.value=.07;const lg=c.createGain();lg.gain.value=lvl*.25;l.connect(lg);lg.connect(g.gain);l.start(t);l.stop(t+dur+1.2);}
  else{const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;s.connect(hp);hp.connect(g);}
  s.start(t,Math.random());s.stop(t+dur+1.2);g.connect(RADIO.master);}
function lfPlay(tr,e,t,spb){
  if(e.k==='ep')e.ns.forEach((m,i)=>epiano(t+i*.018,m,e.d*spb,e.v));
  else if(e.k==='pn')piano(t,e.n,e.d*spb,e.v);
  else if(e.k==='lead'){if(tr.lead==='ep')epiano(t,e.n,e.d*spb*.95,e.v);else if(tr.lead==='piano')piano(t,e.n,e.d*spb,e.v*.9);else if(tr.lead==='pluck')pluck(t,e.n,e.v*.8);else bell(t,e.n,e.d*spb,e.v*.8);}
  else if(e.k==='bass')bass(t,e.n,e.d*spb,e.v);
  else if(e.k==='kick')lkick(t,e.v);else if(e.k==='snare')lsnare(t,e.v);else if(e.k==='rim')rim(t,e.v);else if(e.k==='hat')lhat(t,e.v);
  else if(e.k==='bed')lbed(t,e.d*spb,e.kind);}
// ---------- Lo-fi Beats: 30 original lo-fi hip hop tracks for work and study ----------
// Jazzy chord loops chopped into stabs, swung 16th hats, a boom-bap kick and snare with ghost notes,
// a round bass with approach notes, and a melody on e-piano, guitar, vibes, flute or a reedy lead.
const HP_P={
 iiVI:[[2,'m9'],[7,'13'],[0,'maj9'],[0,'69']],
 viiiV:[[9,'m9'],[2,'m9'],[7,'13'],[0,'maj9']],
 four:[[5,'maj9'],[4,'m7'],[9,'m9'],[2,'m9']],
 dor:[[0,'m9'],[5,'7'],[0,'m9'],[5,'7']],
 desc:[[0,'m11'],[10,'69'],[8,'maj7'],[7,'7']],
 turn:[[4,'m7'],[9,'7'],[2,'m9'],[7,'13']],
 lift:[[5,'maj7'],[7,'9sus'],[0,'maj9'],[9,'m9']],
 night:[[0,'m9'],[3,'maj7'],[8,'maj7'],[7,'7']]};
const HP_MINOR=['dor','desc','night'];
const HOP=[
 {t:'Espresso Shot Beats',key:62,bpm:88,A:'iiVI',B:'four',lead:'ep',sw:.2,r:0,len:214,seed:301},
 {t:'Notebook Margins',key:65,bpm:84,A:'viiiV',B:'lift',lead:'vib',sw:.22,r:1,len:222,seed:307},
 {t:'Highlighter Yellow',key:60,bpm:90,A:'four',B:'turn',lead:'pluck',sw:.18,r:2,len:210,seed:311},
 {t:'Deadline in Daylight',key:57,bpm:86,A:'dor',B:'desc',lead:'flute',sw:.21,r:3,len:218,seed:313},
 {t:'Laptop by the Jetty',key:63,bpm:82,A:'lift',B:'viiiV',lead:'ep',sw:.23,r:4,len:226,seed:317},
 {t:'Inbox Zero',key:64,bpm:92,A:'turn',B:'iiVI',lead:'vib',sw:.19,r:5,len:208,seed:331},
 {t:'Coffee Ring Notes',key:61,bpm:85,A:'iiVI',B:'lift',lead:'reed',sw:.22,r:6,len:220,seed:337},
 {t:'Cold Brew Focus',key:59,bpm:80,A:'night',B:'dor',lead:'ep',sw:.24,r:7,len:230,seed:347},
 {t:'Sticky Note Wall',key:65,bpm:88,A:'four',B:'iiVI',lead:'pluck',sw:.2,r:8,len:214,seed:349},
 {t:'Ferry Wi-Fi Study',key:62,bpm:84,A:'viiiV',B:'turn',lead:'flute',sw:.21,r:0,len:222,seed:353},
 {t:'Café Corner Booth',key:60,bpm:86,A:'lift',B:'four',lead:'vib',sw:.22,r:1,len:218,seed:359},
 {t:'Late Lecture Rewind',key:58,bpm:82,A:'desc',B:'night',lead:'reed',sw:.23,r:2,len:226,seed:367},
 {t:'Bike Lane Commute',key:67,bpm:92,A:'iiVI',B:'viiiV',lead:'pluck',sw:.18,r:3,len:208,seed:373},
 {t:'Overtime at the Counter',key:63,bpm:84,A:'dor',B:'night',lead:'ep',sw:.22,r:4,len:222,seed:379},
 {t:'Pomodoro Twenty-Five',key:64,bpm:90,A:'turn',B:'lift',lead:'vib',sw:.2,r:5,len:210,seed:383},
 {t:'Thesis Draft Three',key:61,bpm:80,A:'viiiV',B:'four',lead:'flute',sw:.24,r:6,len:230,seed:389},
 {t:'Quokka on a Coffee Break',key:65,bpm:88,A:'lift',B:'iiVI',lead:'pluck',sw:.2,r:7,len:214,seed:397},
 {t:'Reading Room by the Sea',key:59,bpm:82,A:'night',B:'desc',lead:'ep',sw:.23,r:8,len:226,seed:401},
 {t:'Steam Wand Swing',key:62,bpm:94,A:'iiVI',B:'turn',lead:'reed',sw:.19,r:0,len:206,seed:409},
 {t:'Spreadsheet Sunset',key:57,bpm:84,A:'desc',B:'dor',lead:'vib',sw:.22,r:1,len:222,seed:419},
 {t:'Library Card',key:64,bpm:86,A:'four',B:'viiiV',lead:'flute',sw:.21,r:2,len:218,seed:421},
 {t:'Golden Hour Homework',key:60,bpm:82,A:'lift',B:'turn',lead:'ep',sw:.23,r:3,len:226,seed:431},
 {t:'Index Card Shuffle',key:66,bpm:90,A:'turn',B:'iiVI',lead:'pluck',sw:.19,r:4,len:210,seed:433},
 {t:'Quiet Desk, Loud Ideas',key:63,bpm:86,A:'night',B:'dor',lead:'reed',sw:.22,r:5,len:218,seed:439},
 {t:'Second Flat White',key:65,bpm:88,A:'iiVI',B:'four',lead:'vib',sw:.2,r:6,len:214,seed:443},
 {t:'Saltwater Study Hall',key:61,bpm:84,A:'viiiV',B:'lift',lead:'flute',sw:.22,r:7,len:222,seed:449},
 {t:'Coastline Commute',key:62,bpm:92,A:'four',B:'turn',lead:'pluck',sw:.18,r:8,len:208,seed:457},
 {t:'Midnight Revision',key:58,bpm:80,A:'dor',B:'desc',lead:'ep',sw:.24,r:0,len:230,seed:461},
 {t:'Clocking Off',key:60,bpm:84,A:'lift',B:'viiiV',lead:'vib',sw:.22,r:1,len:222,seed:463},
 {t:'Tomorrow’s To-Do List',key:63,bpm:82,A:'iiVI',B:'night',lead:'reed',sw:.23,r:2,len:226,seed:467}];
function hpCompile(tr){const R=lfRng(tr.seed),ev=[],bar4=4,sw=tr.sw;
  const S16=b=>{const f=b%.5;return b+(Math.abs(f-.25)<1e-6?sw*.5:0);};// swing the off 16ths
  const minor=HP_MINOR.includes(tr.A);const pent=minor?[0,3,5,7,10]:[0,2,4,7,9];
  const scale=[];for(let o=-12;o<=36;o+=12)pent.forEach(p=>scale.push(tr.key+p+o));
  const lo=tr.key+9,hi=tr.key+24;
  // form: intro, groove, theme, answer, break, theme, answer..., outro (sized to tr.len)
  const target=Math.round(tr.len*tr.bpm/60/bar4);const form=[['I',4],['A',8]];let used=12;
  while(used+16+4<=target){form.push(['M',8],['N',8]);used+=16;if(used+4+16+4<=target&&form.filter(f=>f[0]==='M').length%2===1){form.push(['K',4]);used+=4;}}
  while(used+8+4<=target){form.push(['A',8]);used+=8;}
  form.push(['O',4]);used+=4;
  const motifs=[0,1].map(()=>{const r=LF_R[(tr.r+Math.floor(R()*4))%LF_R.length];let s=0;return r.map(()=>{s+=R()<.55?(R()<.5?-1:1):(R()<.5?-2:2);if(s>4)s-=3;if(s<-4)s+=3;return s;}).map((s,i)=>[r[i][0],r[i][1],s]);});
  const near=(m,arr)=>arr.reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a);
  const kickPat=[[0,1],[.75,R()<.5?.55:0],[2.5,.9],[2.75,R()<.4?.5:0]].filter(k=>k[1]>0);
  let bar=0,prevV=64;
  form.forEach(([sec,n])=>{const prog=HP_P[sec==='N'?tr.B:tr.A];
    const drums=sec==='A'||sec==='M'||sec==='N';
    for(let k=0;k<n;k++){const B=(bar+k)*bar4,ch=prog[(bar+k)%4],root=tr.key+ch[0];
      const fade=sec==='O'?1-k/n*.6:sec==='I'?.65+k/n*.35:1;const last=sec==='O'&&k===n-1;
      const v=lfVoice(tr.key,ch,prevV);prevV=v.reduce((a,b)=>a+b,0)/v.length;
      // chopped chord stabs
      if(last)ev.push({b:B,k:'ep',ns:v,d:6,v:.5*fade});
      else{ev.push({b:B,k:'ep',ns:v,d:1.2,v:.52*fade});ev.push({b:S16(1.75)+B,k:'ep',ns:v.slice(1),d:.45,v:.34*fade});ev.push({b:B+2.5,k:'ep',ns:v,d:.9,v:.42*fade});if(R()<.45)ev.push({b:S16(3.25)+B,k:'ep',ns:v.slice(2),d:.4,v:.26*fade});}
      // bass: root, push, root, approach note into the next chord
      if(sec!=='I'||k>=2){let bn=root;while(bn>45)bn-=12;while(bn<33)bn+=12;const nx=tr.key+prog[(bar+k+1)%4][0];let an=nx-1;while(an>bn+7)an-=12;while(an<bn-7)an+=12;
        if(last)ev.push({b:B,k:'bass',n:bn,d:4,v:.2*fade});
        else{ev.push({b:B,k:'bass',n:bn,d:.8,v:.22*fade});ev.push({b:S16(1.75)+B,k:'bass',n:bn+12,d:.25,v:.12*fade});ev.push({b:B+2.5,k:'bass',n:bn+(R()<.5?7:0),d:.9,v:.18*fade});ev.push({b:S16(3.75)+B,k:'bass',n:an,d:.25,v:.13*fade});}}
      // boom-bap drums
      if(drums&&!last){kickPat.forEach(([b,vv])=>ev.push({b:B+b,k:'kick',v:vv}));
        ev.push({b:B+1,k:'snare',v:1});ev.push({b:B+3,k:'snare',v:1});if(R()<.35)ev.push({b:S16(1.75)+B,k:'snare',v:.22});if(R()<.3)ev.push({b:S16(3.75)+B,k:'snare',v:.28});
        for(let h=0;h<16;h++){const hb=h*.25;if(h%2===1&&R()<.35)continue;ev.push({b:S16(hb)+B,k:'hat',v:h%4===0?.9:h%2===0?.6:.32});}
        if((bar+k)%2===1)ev.push({b:B+3.5,k:'ohat',v:.5});}
      else if(sec==='K'&&!last){ev.push({b:B,k:'kick',v:.5});for(let h=0;h<8;h++)ev.push({b:B+h*.5+(h%2?sw:0),k:'hat',v:h%2?.25:.4});}}
    // melody: theme and answer over two-bar motifs, held note to end each phrase
    if(sec==='M'||sec==='N'||sec==='K'){const mo=motifs[sec==='N'?1:0];
      for(let g=0;g<n/2;g++){const b0=(bar+g*2)*bar4,ch=prog[(bar+g*2)%4];const ct=LF_V[ch[1]].map(x=>tr.key+ch[0]+x);
        const base=near(tr.key+17+(g%2?2:0),scale.filter(m=>m>=lo&&m<=hi));const cad=g===n/2-1;
        mo.forEach(([st,du,s],ni)=>{if(sec==='K'&&ni%2)return;if(cad&&st>=4)return;
          let idx=scale.indexOf(base)+s+(g===2&&ni===mo.length-1?1:0);idx=Math.max(0,Math.min(scale.length-1,idx));let m=scale[idx];while(m>hi)m-=12;while(m<lo)m+=12;
          if(du>=1&&Number.isInteger(st)){const c=ct.map(x=>{while(x<lo)x+=12;while(x>hi)x-=12;return x;});const cn=near(m,c);if(Math.abs(cn-m)<=2)m=cn;}
          ev.push({b:b0+st+(st%1?sw*.5:0),k:'lead',n:m,d:du,v:.58});});
        if(cad){const c=ct.map(x=>{while(x<lo)x+=12;while(x>hi)x-=12;return x;});ev.push({b:b0+4,k:'lead',n:near(base,c),d:3.2,v:.52});}}}
    bar+=n;});
  const beats=used*bar4+1;ev.push({b:0,k:'bed',kind:'crackle',d:beats});
  ev.sort((a,b)=>a.b-b.b);return{ev,beats};}
function lohat(t,v){const c=RADIO.ctx;const s=c.createBufferSource();s.buffer=RADIO.noise;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=6000;const g=c.createGain();g.gain.setValueAtTime(.03*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.28);s.connect(hp);hp.connect(g);s.start(t,Math.random());s.stop(t+.3);out(g,.7,.1);}
function hpPlay(tr,e,t,spb){
  if(e.k==='lead'){const d=e.d*spb;if(tr.lead==='ep')epiano(t,e.n,d*.95,e.v);else if(tr.lead==='pluck')pluck(t,e.n-12,e.v*.85);else if(tr.lead==='vib')bell(t,e.n,d,e.v*.75);else if(tr.lead==='flute')flute(t,e.n,d*.9,e.v*1.3);else oboe(t,e.n,d*.9,e.v*1.15);}
  else if(e.k==='ohat')lohat(t,e.v);
  else lfPlay(tr,e,t,spb);}
// Track stations: Crystal Harbour and Island Lo-fi play composed tracks in order.
function crPlay(tr,e,t,spb){if(e.k==='lead'){(tr.lead==='flute'?flute:tr.lead==='oboe'?oboe:bell)(t,e.n,e.d*spb*.95,e.v*1.6);}else if(e.k==='bell')bell(t,e.n,e.d*spb,e.v*1.4);else if(e.k==='harp')harp(t,e.n,e.v);else if(e.k==='piano')piano(t,e.n,e.d*spb,e.v*1.4);else if(e.k==='bass')bass(t,e.n,e.d*spb,e.v*.65);else if(e.k==='strings')strings(t,e.ns,e.d*spb,e.v*.8);else if(e.k==='hat')hat(t,e.v*.6);}
const TSTN={crystal:{list:CRYSTAL,compile:crCompile,play:crPlay},lofi:{list:LOFI,compile:lfCompile,play:lfPlay},beats:{list:HOP,compile:hpCompile,play:hpPlay}};
function tsOf(){return TSTN[RADIO.st]||TSTN.crystal;}
function crStart(i,t0){const T=tsOf(),L=T.list;const tr=L[((i%L.length)+L.length)%L.length];RADIO.trk=L.indexOf(tr);RADIO.trkSt=RADIO.st;RADIO.cr=T.compile(tr);RADIO.crI=0;RADIO.crT0=t0!=null?t0:RADIO.ctx.currentTime+.15;RADIO.crSpb=60/tr.bpm;RADIO.crLoops=0;
  if(QCR.onTrack)QCR.onTrack();}
function crTick(){const c=RADIO.ctx;if(RADIO.pl&&(RADIO.pl.done||!RADIO.cr))return;if(!RADIO.cr||RADIO.trkSt!==RADIO.st)crStart(RADIO.trkSt===RADIO.st?(RADIO.trk||0):0);const C=RADIO.cr,spb=RADIO.crSpb,T=tsOf();const win=c.currentTime+.6;
  while(RADIO.crI<C.ev.length){const e=C.ev[RADIO.crI];const t=RADIO.crT0+e.b*spb;if(t>win)break;RADIO.crI++;if(t<c.currentTime-.05&&e.k!=='bed')continue;
    T.play(T.list[RADIO.trk],e,Math.max(t,c.currentTime),spb);}
  if(RADIO.pl){const end=RADIO.crT0+C.beats*spb+PL_GAP;if(RADIO.crI>=C.ev.length&&c.currentTime>end-.5)plNext(end);return;}
  if(RADIO.crI>=C.ev.length&&c.currentTime>RADIO.crT0+C.beats*spb+1.2){crStart((RADIO.trk||0)+1);}}
const PL_GAP=2;function plNext(){}
const PROG={seaside:[[48,[60,64,67,71]],[45,[57,60,64,67]],[41,[57,60,65,69]],[43,[59,62,67,71]],[40,[59,64,67,71]],[45,[57,60,64,69]],[38,[57,62,65,69]],[43,[55,59,62,65]]],
 lofi:[[38,[60,62,65,69]],[43,[59,62,65,69]],[36,[59,62,64,67]],[45,[55,60,64,67]]],
 breeze:[[38,[50,57,62]],[34,[46,53,58]],[36,[48,55,60]],[33,[45,52,57]]]};
const SCALE={seaside:[72,74,76,79,81,84,86],lofi:[69,72,74,76,79,81],breeze:[62,64,65,69,70,74,76,77,81]};
function radioSchedule(){const c=RADIO.ctx;if(!c||RADIO.st==='off')return;if(TSTN[RADIO.st]){crTick();return;}const S2=RSTATIONS[RADIO.st],spb=60/S2.bpm,e=spb/2;
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
 hasTracks(){return !!TSTN[RADIO.st];},
 track(){const T=TSTN[RADIO.st];return T&&RADIO.trk!=null&&RADIO.trkSt===RADIO.st?T.list[RADIO.trk]:null;},
 trackNo(){return (RADIO.trk||0)+1;},
 get count(){const T=TSTN[RADIO.st];return T?T.list.length:0;},
 stations:RSTATIONS,
 level(){if(!RADIO.an||RADIO.st==='off')return 0;const a=new Uint8Array(RADIO.an.fftSize);RADIO.an.getByteTimeDomainData(a);let m=0;for(const v of a)m=Math.max(m,Math.abs(v-128));return m/128;},
 play(st){RADIO.st=st;RADIO.nodes.forEach(n=>{try{n.stop();}catch(e){}});RADIO.nodes=[];
  if(!radioInit())return false;const c=RADIO.ctx;if(c.state==='suspended')c.resume();
  RADIO.master.gain.cancelScheduledValues(c.currentTime);RADIO.master.gain.setTargetAtTime(RADIO.vol*.9,c.currentTime,.4);
  RADIO.next=c.currentTime+.1;RADIO.step=0;RADIO.bar=Math.floor(Math.random()*4);
  if(TSTN[st]){RADIO.cr=null;if(RADIO.trkSt!==st){RADIO.trk=Math.floor(Math.random()*TSTN[st].list.length);RADIO.trkSt=st;}}
  if(st==='seaside')loopNoise('wave');
  if(!RADIO.timer)RADIO.timer=setInterval(radioSchedule,100);radioSchedule();if(QCR.onTrack)QCR.onTrack();return true;},
 off(){RADIO.st='off';RADIO.nodes.forEach(n=>{try{n.stop();}catch(e){}});RADIO.nodes=[];RADIO.cr=null;if(RADIO.master)RADIO.master.gain.setTargetAtTime(0,RADIO.ctx.currentTime,.25);clearInterval(RADIO.timer);RADIO.timer=null;},
 vol(v){RADIO.vol=v;if(RADIO.master&&RADIO.st!=='off')RADIO.master.gain.setTargetAtTime(v*.9,RADIO.ctx.currentTime,.1);},
 skip(d){if(!TSTN[RADIO.st]||!RADIO.ctx)return;crStart((RADIO.trk||0)+d);}
};
window.QCR=QCR;
})();
