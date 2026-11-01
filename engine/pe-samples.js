/* ==== Paul Engine sample scenes: start points for the editor and the shop template ==== */
(function(){
const PE = window.PE, has = id => !!PE.assets[id];
const row = (a, x0, x1, z, step, extra) => { const o = []; for (let x = x0; x <= x1 + 1e-6; x += step) o.push(Object.assign({ a, x, z }, extra || {})); return o; };
const pick = (...ids) => ids.find(has);

PE.SAMPLES = {
  cafe: { name: 'คาเฟ่ริมท่าเรือ Rottnest', build: () => ({
    name: 'Quokka Jetty Cafe', ground: { w: 44, d: 32, color: '#d9c99a' }, time: 10, style: { mode: 'smooth', palette: 40 }, view: { zoom: 1.15, tx: 0, tz: 1 },
    game: { cur: '$', unit: 1, money: 300, items: [{ k: 'C', name: 'กาแฟ', enName: 'Flat white', jaName: 'コーヒー', price: 5, col: '#7d532e' }, { k: 'S', name: 'สมูทตี้', enName: 'Smoothie', jaName: 'スムージー', price: 7, col: '#e2608a' }, { k: 'T', name: 'โทสต์', enName: 'Toastie', jaName: 'トースト', price: 8, col: '#d4a02a' }],
      extras: [{ k: '+', name: 'มัฟฟิน', enName: 'Muffin', jaName: 'マフィン', price: 4 }, { k: '+', name: 'คุกกี้', enName: 'Cookie', jaName: 'クッキー', price: 3 }] },
    objects: [].concat(
      row('tile-water', -20, 20, -14, 4), row('tile-water', -20, 20, -10, 4), row('tile-wood', 6, 6, -10, 4), row('tile-wood', 6, 6, -14, 4),
      row('tile-paving', -20, 20, 10, 4), row('tile-paving', -4, 4, 2, 4), row('tile-paving', -4, 4, 6, 4), row('tile-grass', -20, -12, -2, 4), row('tile-grass', 12, 20, -2, 4),
      [{ a: 'kiosk', x: 0, z: -2, c: '#2f8f83', t: 'QUOKKA CAFE' }, { a: 'menu-board', x: 3.2, z: 1, t: 'MENU' },
       { a: 'umbrella-table', x: -6, z: 3, c: '#e2608a' }, { a: 'umbrella-table', x: 6.5, z: 3, c: '#2f73b0' }, { a: 'umbrella-table', x: -6.5, z: 7.5, c: '#e9b62c' }, { a: 'table-set', x: 7, z: 7.5 },
       { a: 'palm', x: -11, z: 2 }, { a: 'palm', x: 12, z: 1, seed: 9 }, { a: pick('ppl-peppermint', 'tree-round'), x: -16, z: -1 }, { a: pick('ppl-peppermint', 'tree-round'), x: 17, z: -2, seed: 3 },
       { a: 'bush', x: -9, z: -3 }, { a: 'flowerbed', x: 9, z: -4 }, { a: 'bench', x: -14, z: 8 }, { a: 'bench', x: 14, z: 8 }, { a: 'street-lamp', x: -4.5, z: 12 }, { a: 'street-lamp', x: 9, z: 12 },
       { a: 'quokka', x: -3, z: 5 }, { a: 'quokka', x: 10, z: 5 }, { a: 'quokka', x: -12, z: 5, r: 2 }, { a: 'bicycle', x: 15, z: 4, r: 1 }, { a: 'bin', x: 3.5, z: 5 }, { a: 'sign', x: -18, z: 13, t: 'WADJEMUP', c: '#2f8f83' },
       { a: 'spawn-walk', x: -19, z: 12 }, { a: 'spawn-walk', x: 19, z: 12 }]),
    paths: [{ kind: 'walk', pts: [[-21, 14], [21, 14]], n: 3, loop: 'pp' }, { kind: 'animal', pts: [[-16, 6], [-10, 9], [-4, 7]], n: 1, sp: .5, loop: 'pp' }] }) },

  gas: { name: 'ปั๊มน้ำมันชานเมืองโอซาก้า', build: () => ({
    name: 'KAZE Station', ground: { w: 52, d: 40, color: '#8e8b86' }, time: 16, style: { mode: 'pixel', palette: 40 }, view: { zoom: 1.05, tx: 0, tz: 1 },
    game: { cur: '¥', unit: 100, money: 300, carItems: [{ k: 'R', name: 'ธรรมดา', enName: 'Regular', jaName: 'レギュラー', price: 42, col: '#d43a2c' }, { k: 'H', name: 'ไฮออกเทน', enName: 'High-octane', jaName: 'ハイオク', price: 55, col: '#d99a00' }, { k: 'D', name: 'ดีเซล', enName: 'Diesel', jaName: '軽油', price: 36, col: '#2fae55' }],
      carExtras: [{ k: '+', name: 'ล้างรถ', enName: 'Car wash', jaName: '洗車', price: 9 }, { k: '+', name: 'เติมลม', enName: 'Tyres', jaName: '空気圧', price: 3 }] },
    objects: [].concat(
      row('tile-road', -24, 24, 16, 4, { r: 0 }), row('tile-footpath', -24, 24, 12, 4), row('tile-asphalt', -16, 16, 8, 4), row('tile-asphalt', -16, 16, 4, 4), row('tile-asphalt', -16, 16, 0, 4), row('tile-asphalt', -16, 16, -4, 4), row('tile-paving', -16, 16, -8, 4),
      [{ a: 'gas-canopy', x: 0, z: 0, c: '#1c3f8f', t: 'KAZE' }, { a: 'pump', x: -5, z: -1 }, { a: 'pump', x: 0, z: -1 }, { a: 'pump', x: 5, z: -1 },
       { a: 'shop-front', x: -17, z: -12, c: '#1c3f8f', t: 'KAZE MART' }, { a: 'garage', x: 17, z: -12, t: 'TUNE' }, { a: 'vending', x: -11.5, z: -9 }, { a: 'vending', x: -10.5, z: -9, c: '#2f73b0' },
       { a: 'house-jp', x: -20, z: -27 }, { a: 'house-jp', x: -12, z: -27, c: '#d8cfc0' }, { a: 'apartment', x: 2, z: -28 }, { a: 'house-jp', x: 16, z: -27, c: '#c9cfd6' },
       { a: 'tyre-stack', x: 11, z: -8 }, { a: 'tyre-stack', x: 11.8, z: -8 }, { a: 'cone', x: -8, z: 9 }, { a: 'cone', x: 8, z: 9 },
       { a: 'nobori', x: -12, z: 10.5, c: '#d43a2c' }, { a: 'nobori', x: -9, z: 10.5, c: '#9be02f' }, { a: 'nobori', x: 9, z: 10.5, c: '#d43a2c' }, { a: 'nobori', x: 12, z: 10.5, c: '#9be02f' },
       { a: 'sign', x: 19, z: 10, t: 'R 168 H 179', c: '#18181c' }, { a: 'power-pole', x: -22, z: 19.5 }, { a: 'power-pole', x: 0, z: 19.5 }, { a: 'power-pole', x: 22, z: 19.5 },
       { a: 'street-lamp', x: -14, z: 11 }, { a: 'street-lamp', x: 14, z: 11 }, { a: 'tree-round', x: -22, z: -8 }, { a: 'tree-round', x: 23, z: 2 }, { a: 'car-tuner', x: 17, z: -11, r: 1 },
       { a: 'spawn-car', x: -24, z: 15 }, { a: 'spawn-car', x: 24, z: 17 }]),
    paths: [{ kind: 'car', pts: [[-26, 15], [26, 15]], n: 2, sp: 9 }, { kind: 'car', pts: [[26, 17.2], [-26, 17.2]], n: 2, sp: 10 }, { kind: 'walk', pts: [[-25, 12.6], [25, 12.6]], n: 3, loop: 'pp' }] }) },

  thai: { name: 'ร้านอาหารไทยใน Perth (แซ่บอีหลี)', build: () => ({
    name: 'แซ่บอีหลี · Zap-ily', ground: { w: 44, d: 34, color: '#8fae6a' }, time: 18.4, style: { mode: 'smooth', palette: 40 }, view: { zoom: 1.1, tx: 0, tz: 2 },
    game: { cur: '$', unit: 1, money: 300, items: [{ k: 'ส', name: 'ส้มตำ', enName: 'Som tam', jaName: 'ソムタム', price: 14, col: '#2f8f3c' }, { k: 'ล', name: 'ลาบ', enName: 'Larb', jaName: 'ラープ', price: 16, col: '#c8452f' }, { k: 'ก', name: 'ไก่ย่าง', enName: 'Grilled chicken', jaName: 'ガイヤーン', price: 18, col: '#d4a02a' }],
      extras: [{ k: '+', name: 'ข้าวเหนียว', enName: 'Sticky rice', jaName: 'もち米', price: 4 }, { k: '+', name: 'ชาไทย', enName: 'Thai tea', jaName: 'タイティー', price: 6 }] },
    objects: [].concat(
      row('tile-road', -20, 20, 14, 4), row('tile-footpath', -20, 20, 10, 4), row('tile-paving', -12, 12, 6, 4), row('tile-paving', -12, 12, 2, 4),
      [{ a: 'restaurant', x: 0, z: -6, c: '#c8452f', t: 'แซ่บอีหลี' }, { a: 'counter', x: -2.5, z: -.6, c: '#7d532e' }, { a: 'stall', x: 4, z: -.4, c: '#d43a2c' },
       { a: 'table-set', x: -8, z: 3 }, { a: 'table-set', x: -8, z: 7 }, { a: 'table-set', x: 8, z: 3, c: '#7d532e' }, { a: 'table-set', x: 8, z: 7, c: '#7d532e' },
       { a: 'paper-lantern', x: -5, z: 2 }, { a: 'paper-lantern', x: 5, z: 2 }, { a: 'paper-lantern', x: -11, z: 5 }, { a: 'paper-lantern', x: 11, z: 5 },
       { a: pick('verandah-shop', 'shop-front'), x: -15, z: -7 }, { a: 'shop-front', x: 15, z: -7, c: '#2f6b4a', t: 'GROCER' },
       { a: pick('ppl-gum', 'tree-round'), x: -19, z: 3 }, { a: pick('ppl-gum', 'tree-round'), x: 19, z: 4, seed: 4 }, { a: 'planter', x: -3, z: 8.5 }, { a: 'planter', x: 3, z: 8.5 },
       { a: 'street-lamp', x: -12, z: 11.5 }, { a: 'street-lamp', x: 12, z: 11.5 }, { a: pick('kangaroo', 'dog'), x: -17, z: -14 }, { a: 'menu-board', x: 1, z: 1.4, t: 'เมนู' },
       { a: 'spawn-walk', x: -19, z: 11 }, { a: 'spawn-walk', x: 19, z: 11 }]),
    paths: [{ kind: 'car', pts: [[-23, 13.2], [23, 13.2]], n: 2 }, { kind: 'car', pts: [[23, 15.2], [-23, 15.2]], n: 2 }, { kind: 'walk', pts: [[-21, 10.8], [21, 10.8]], n: 3, loop: 'pp' }] }) },

  blank: { name: 'ฉากว่าง', build: () => ({ name: 'ฉากใหม่', ground: { w: 40, d: 30, color: '#a6b58a' }, time: 11, style: { mode: 'smooth', palette: 40 }, objects: [], paths: [] }) }
};
})();
