// Build web-ready CC0 human characters for the Paul Perth Library from Quaternius packs
// (Universal Base Characters + Modular Character Outfits + Universal Animation Library), all CC0 1.0.
//   node build-human.mjs <quaternius dir> <out dir>
// Output: ppl-human-m.glb, ppl-human-f.glb (one shared 65-bone UE-style rig each), ppl-anims.glb (clips only).
// Clothes use greyscale fabric textures in materials named Shirt / Pants / Shoes so a game tints them freely.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, resample, weld, unpartition, meshopt, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { PropertyType } from '@gltf-transform/core';
import sharp from 'sharp';
import path from 'node:path';

const [SRC, OUT] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptEncoder.ready; io.registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const P = f => path.join(SRC, f);

async function img(tex, size, fmt, fn) {
  let s = sharp(Buffer.from(tex.getImage())).resize(size, size);
  if (fn) s = await fn(s);
  const buf = fmt === 'png' ? await s.png({ compressionLevel: 9, palette: false }).toBuffer() : await s.flatten({ background: '#808080' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  tex.setImage(new Uint8Array(buf)).setMimeType(fmt === 'png' ? 'image/png' : 'image/jpeg').setURI('');
}
const grey = async s => s.greyscale().linear(1.15, 70); // keep fabric folds, lift so a tint shows its true colour

function headOnly(doc, prim) {
  // keep triangles whose three vertices are mostly weighted to Head / neck_01
  const skinJoints = doc.getRoot().listSkins()[0].listJoints().map(j => j.getName());
  const keepJ = new Set(['Head', 'neck_01'].map(n => skinJoints.indexOf(n)));
  const J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0'), I = prim.getIndices();
  const isHead = v => { let w = 0; const j = J.getElement(v, []), ww = W.getElement(v, []); for (let k = 0; k < 4; k++) if (keepJ.has(j[k])) w += ww[k]; return w > .5; };
  const src = I.getArray(), out = [];
  for (let t = 0; t < src.length; t += 3) if (isHead(src[t]) && isHead(src[t + 1]) && isHead(src[t + 2])) out.push(src[t], src[t + 1], src[t + 2]);
  I.setArray(new Uint32Array(out));
  return out.length / 3;
}

async function build(sex) {
  const M = sex === 'm';
  const doc = await io.read(P(`outfits/${M ? 'Male' : 'Female'}_Peasant.gltf`));
  const root = doc.getRoot(), skin = root.listSkins()[0], jointNames = skin.listJoints().map(j => j.getName());
  const extra = [`base/Superhero_${M ? 'Male' : 'Female'}_FullBody.gltf`, M ? 'hair/Hair_SimpleParted.gltf' : 'hair/Hair_Long.gltf', `hair/Eyebrows_${M ? 'Regular' : 'Female'}.gltf`];
  if (M) extra.push('hair/Hair_Beard.gltf');
  const before = new Set(root.listNodes());
  for (const f of extra) { const d = await io.read(P(f)), stem = path.basename(f, '.gltf'); d.getRoot().listMeshes().forEach(m => m.setName(stem)); d.getRoot().listNodes().forEach(n => { if (n.getMesh()) n.setName(stem); }); mergeDocuments(doc, d); }
  const mainScene = root.listScenes()[0], armature = mainScene.listChildren()[0];
  // re-home every merged skinned mesh onto the outfit's skeleton, drop the merged skeletons
  for (const n of root.listNodes()) {
    if (before.has(n)) continue;
    const s = n.getSkin();
    if (s && s !== skin) {
      const names = s.listJoints().map(j => j.getName());
      if (names.join() !== jointNames.join()) throw new Error('rig mismatch in ' + n.getName());
      n.setSkin(skin); armature.addChild(n);
      const m = n.getMesh();
      if (m) for (const p of m.listPrimitives()) if (p.getMaterial() && /Superhero/.test(p.getMaterial().getName()) && p.getIndices().getCount() > 3000) console.log(sex, 'head tris', headOnly(doc, p));
    }
  }
  for (const s of root.listScenes()) if (s !== mainScene) s.dispose();
  root.setDefaultScene(mainScene);
  for (const s of root.listSkins()) if (s !== skin) s.dispose();
  // materials: split the outfit atlas into tintable Shirt / Pants / Shoes, lighter roughness, no metal
  const outfitMat = root.listMaterials().find(m => m.getName() === 'MI_Peasant');
  const greyTex = outfitMat.getBaseColorTexture();
  for (const [meshPart, name] of [['_Arms', 'Shirt'], ['_Body', 'Shirt'], ['_Legs', 'Pants'], ['_Feet', 'Shoes']]) {
    const mesh = root.listMeshes().find(m => m.getName().endsWith(meshPart)); if (!mesh) continue;
    let mat = root.listMaterials().find(m => m.getName() === name);
    if (!mat) mat = doc.createMaterial(name).setBaseColorTexture(greyTex).setRoughnessFactor({ Shirt: .85, Pants: .8, Shoes: .55 }[name]).setMetallicFactor(0);
    for (const p of mesh.listPrimitives()) if (p.getMaterial() === outfitMat) p.setMaterial(mat);
  }
  for (const m of root.listMaterials()) {
    m.setMetallicRoughnessTexture(null).setNormalTexture(null).setMetallicFactor(0);
    if (/Superhero|Regular/.test(m.getName())) m.setName(/Superhero/.test(m.getName()) ? 'Face' : 'Skin').setRoughnessFactor(.6);
    if (/Hair/.test(m.getName())) m.setName('Hair').setAlphaMode('MASK').setAlphaCutoff(.4).setDoubleSided(true).setRoughnessFactor(.7);
    if (/Eyes/.test(m.getName())) m.setName('Eyes').setRoughnessFactor(.2);
  }
  await doc.transform(prune(), dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }), weld());
  for (const t of root.listTextures()) {
    const used = root.listMaterials().filter(m => m.getBaseColorTexture() === t).map(m => m.getName());
    if (!used.length) { t.dispose(); continue; }
    if (used.includes('Shirt')) await img(t, 1024, 'jpg', grey);
    else if (used.includes('Hair') || used.includes('Eyes')) await img(t, used.includes('Eyes') ? 256 : 512, 'png');
    else await img(t, used.includes('Face') ? 1024 : 512, 'jpg');
  }
  await doc.transform(prune());
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }), unpartition());
  const out = path.join(OUT, `ppl-human-${sex}.glb`);
  await io.write(out, doc);
  console.log('wrote', out, root.listMaterials().map(m => m.getName()).join(','));
}

async function anims() {
  const keepA = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Idle_Talking_Loop', 'Dance_Loop', 'Sitting_Idle_Loop', 'Driving_Loop', 'Interact'];
  const keepB = ['Yes', 'Idle_No_Loop', 'Idle_FoldArms_Loop', 'Idle_TalkingPhone_Loop'];
  const doc = await io.read(P('gaits.glb')), root = doc.getRoot();
  const kill = a => { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(x => x.dispose()); a.dispose(); };
  for (const a of root.listAnimations()) if (!keepA.includes(a.getName())) kill(a);
  const b = await io.read(P('animations.glb'));
  for (const a of b.getRoot().listAnimations()) if (!keepB.includes(a.getName())) kill(a);
  for (const m of b.getRoot().listMeshes()) m.dispose();
  const before = new Set(root.listNodes());
  mergeDocuments(doc, b);
  // point B's clips at A's bones (same names), so the file holds one skeleton
  const byName = new Map(); for (const n of before) byName.set(n.getName(), n);
  for (const a of root.listAnimations()) for (const ch of a.listChannels()) { const n = ch.getTargetNode(); if (n && !before.has(n) && byName.has(n.getName())) ch.setTargetNode(byName.get(n.getName())); }
  for (const n of root.listNodes()) if (!before.has(n)) n.dispose();
  for (const s of root.listScenes().slice(1)) s.dispose();
  for (const m of root.listMeshes()) m.dispose();
  for (const s of root.listSkins()) s.dispose();
  for (const t of root.listTextures()) t.dispose();
  for (const m of root.listMaterials()) m.dispose();
  /* fingers keep the bind pose: their tracks are most of the data and barely read at game distance */
  const FING = /^(index|middle|pinky|ring|thumb)_/;
  for (const a of root.listAnimations()) for (const ch of a.listChannels()) if (FING.test(ch.getTargetNode()?.getName() || '')) { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
  await doc.transform(resample({ tolerance: 1e-3 }), prune({ keepLeaves: true }), dedup());
  // drop translation tracks except the pelvis (keeps clips usable on other proportions, saves size)
  for (const a of root.listAnimations()) for (const ch of a.listChannels()) if (ch.getTargetPath() === 'translation' && ch.getTargetNode()?.getName() !== 'pelvis') { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
  await doc.transform(prune({ keepLeaves: true }));
  await doc.transform(unpartition());
  const out = path.join(OUT, 'ppl-anims.glb');
  await io.write(out, doc);
  console.log('wrote', out, root.listAnimations().map(a => a.getName()).join(','));
}
await build('m'); await build('f'); await anims();
