// Rebuilds radio.js from the music code in the Quokka Cafe game.
// Usage: node tools/build-radio.js ../quokka-cafe/index.html
// Run it again whenever tracks are added to the game, then bump ?v= on radio.js in index.html.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || '../quokka-cafe/index.html', 'utf8');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('Marker not found: ' + (i < 0 ? a : b)); return src.slice(i, j); };
let code = cut('const RADIO=', 'function radioPlay(');
// game-only pieces: saved settings, studio playlists
code = code.replace(/^try\{const v=JSON\.parse\(localStorage.*\n/m, '');
code = code.replace(/^function radioSave\(\).*\n/m, '');
const p0 = code.indexOf('// ---------- Studio playlists'), p1 = code.indexOf('const PROG=');
code = code.slice(0, p0) + 'const PL_GAP=2;function plNext(){}\n' + code.slice(p1);
const must = (from, to) => { if (!code.includes(from)) throw new Error('Expected game code not found: ' + from.slice(0, 60)); code = code.replace(from, to); };
// level meter for the radio's tuning eye
must('RADIO.master.connect(comp);comp.connect(c.destination);', 'RADIO.master.connect(comp);RADIO.an=c.createAnalyser();RADIO.an.fftSize=256;comp.connect(RADIO.an);RADIO.an.connect(c.destination);');
// no in-game toasts on the website; tell the page instead
code = code.replace(/\n  try\{const n=\$\('#rdNow'\).*?toast\('♫ Now playing: '\+tr\.t,2\.6\);\}/, "\n  if(QCR.onTrack)QCR.onTrack();}");
if (/toast\(|renderRadio|\$\(/.test(code)) throw new Error('Game UI code left in radio.js');
const api = `
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
`;
const out = '/* Quokka Cafe Radio: the music engine from Quokka Cafe and Friends (namchasang.github.io/quokka-cafe). Every note is synthesised live with Web Audio.\n   Built by tools/build-radio.js from the game\'s code. */\n(function(){\'use strict\';\n' + code + api + '})();\n';
fs.writeFileSync(__dirname + '/../radio.js', out);
console.log('radio.js', out.length, 'bytes');
