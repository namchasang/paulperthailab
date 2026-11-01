/* ==== Paul Engine: HD pixel set from the library ====
   The models live in lib/models/buildings/hd-pixel-set.js (PPL.HD). This file only lists them in the editor, category 'hd'. */
(function(){
'use strict';
const P = window.PPL, PE = window.PE;
if (!P || !P.HD) { console.warn('pe-hd needs lib/models/buildings/hd-pixel-set.js'); return; }
Object.values(P.HD).forEach(d => PE.reg(d.id, Object.assign({}, d, { name: d.name + ' (HD)', cat: 'hd', build: o => d.build(o) })));
PE.CATS.splice(1, 0, ['hd', 'HD พิกเซล (ทดลอง)']);
})();
