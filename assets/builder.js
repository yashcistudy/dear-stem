/* dear stem · build your own
   1 making it: each stem laid on the paper. 2 wrap it: she wraps it. 3 checking it: the bouquet standing in the cone, drag to turn.
   Stems are Shopify products; the bouquet goes in the bag as grouped lines (see sections/bouquet-builder.liquid). */
import * as THREE from 'three';

const root = document.querySelector('[data-builder]');
if (root) start();

function start() {
const DS = window.DS || {};
const D = JSON.parse(root.querySelector('[data-builder-json]').textContent);
const L = D.t;
const $ = id => document.getElementById('b-' + id);
const A = f => D.base + f;
const fill = (s, o) => String(s || '').replace(/\[(\w+)\]/g, (m, k) => o[k] != null ? o[k] : m);
const esc = DS.esc || (s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
const money = c => DS.fmt ? DS.fmt(c) : '$' + Math.round(c / 100);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = matchMedia('(max-width:860px)');
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

// ---------- what's in the cooler: real stem length and head width in cm, prices from Shopify ----------
const TABLE = [
  ['rose-garden_blush', 'Garden rose', 'blush', 7, 'focal', 44, 9], ['rose-standard_red', 'Rose', 'red', 4, 'focal', 49, 6], ['rose-standard_blush', 'Rose', 'blush', 4, 'focal', 49, 6],
  ['rose-standard_white', 'Rose', 'white', 4, 'focal', 49, 6], ['peony_blush', 'Peony', 'blush', 9, 'focal', 39, 12], ['hydrangea_white', 'Hydrangea', 'white', 8, 'focal', 39, 16],
  ['ranunculus_peach', 'Ranunculus', 'peach', 4, 'focal', 34, 6], ['ranunculus_white', 'Ranunculus', 'white', 4, 'focal', 34, 6], ['rose-spray_blush', 'Spray rose', 'blush', 6, 'filler', 49, 12],
  ['carnation_blush', 'Carnation', 'blush', 3, 'filler', 49, 6], ['lisianthus_white', 'Lisianthus', 'white', 5, 'filler', 44, 10], ['snapdragon_white', 'Snapdragon', 'white', 4, 'spike', 44, 6],
  ['gypsophila_white', "Baby's breath", 'white', 3, 'filler', 59, 15], ['eucalyptus-silver-dollar_grey-green', 'Eucalyptus', 'silver dollar', 3, 'green', 44, 14], ['ruscus-italian_green-glossy', 'Ruscus', 'glossy green', 3, 'green', 53, 12]
];
const STEMS = TABLE.map(([id, name, col, price, role, L, w]) => {
  const handle = 'stem-' + id.replace(/_/g, '-'), p = D.stems[handle];
  return { id, name, col, role, L, w, handle, v: p ? p.v : null, price: p ? p.price : price * 100, available: p ? p.available : true, lay: A(`lay_${id}.webp`) };
});
const byId = Object.fromEntries(STEMS.map(s => [s.id, s]));
const K = [.82, 1, 1.16];
const SIZES = D.sizes.map((z, i) => ({ id: 'size' + i, name: z.name, stems: +z.stems, h: +z.h, k: K[i] }));
const pn = L.papersFallback.split('|');
const PAPERS = D.papers.length
  ? D.papers.map(p => ({ id: /petal|pink/i.test(p.title) ? 'petal' : 'paper', name: p.title, v: p.v, price: p.price, available: p.available, swatch: /petal|pink/i.test(p.title) ? '#F1B9C4' : '#EFE5D6' }))
  : [{ id: 'paper', name: pn[0], price: 600, swatch: '#EFE5D6' }, { id: 'petal', name: pn[1], price: 600, swatch: '#F1B9C4' }];
const rn = L.ribbons.split('|');
const RIBBONS = [{ id: 'petal', name: rn[0], swatch: '#F1B9C4' }, { id: 'butter', name: rn[1], swatch: '#F2D98B' }, { id: 'plum', name: rn[2], swatch: '#3A2233' }];
const STARTS = String(D.starts || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
let size = SIZES[1] || SIZES[0], paper = PAPERS[0], ribbon = RIBBONS[0], step = 1, showHand = false;
const picked = []; // one entry per stem, in the order they were picked
let uid = 0;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) };

$('room').style.backgroundImage = `url(${D.room})`;
$('table').style.backgroundImage = `url(${A('scene_worktop_top.webp')})`;
$('sheet').style.backgroundImage = `url(${A('paper_' + paper.id + '.webp')})`;
root.style.setProperty('--b-hand', `url(${A('scale_hand_front.webp')})`);

// ---------- the panel ----------
const stemsEl = $('stems');
stemsEl.innerHTML = [['focal', L.focal], ['between', L.between], ['green', L.green]].map(([g, t]) => `<p class="lab b-gap6">${esc(t)}</p><div class="b-stems">${STEMS.filter(s => g === 'between' ? (s.role === 'filler' || s.role === 'spike') : s.role === g).map(s => `
  <div class="b-stem${s.available ? '' : ' out'}" id="b-st_${s.id}"><div class="pic"><img src="${s.lay}" alt="" loading="lazy" width="52" height="64"></div><div><b>${esc(s.name)}</b><span>${esc(s.col)} · ${s.available ? fill(L.perStem, { price: money(s.price) }) : esc(L.soldOut)} · ${s.L} cm</span></div>
  <div class="b-qty"><button type="button" aria-label="${esc(fill(L.less, { name: s.name + ', ' + s.col }))}" data-id="${s.id}" data-d="-1">−</button><output id="b-q_${s.id}">0</output><button type="button" aria-label="${esc(fill(L.more, { name: s.name + ', ' + s.col }))}" data-id="${s.id}" data-d="1"${s.available ? '' : ' disabled'}>+</button></div></div>`).join('')}</div>`).join('');
stemsEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-id]'); if (!b) return; const id = b.dataset.id;
  if (+b.dataset.d > 0) { if (picked.length >= 40) return say(esc(L.tooMany)); picked.push({ id, u: ++uid }); changed(id, true) }
  else { for (let i = picked.length - 1; i >= 0; i--) if (picked[i].id === id) { picked.splice(i, 1); changed(id, false); break } }
});
function radios(sel, list, cur, label, set) {
  root.querySelectorAll(sel).forEach(el => {
    el.innerHTML = list.map(o => `<button type="button" class="b-pick" role="radio" aria-checked="${o === cur()}" data-v="${o.id}">${o.swatch ? `<i style="background:${o.swatch}"></i>` : ''}<span>${esc(o.name)}${label ? `<small>${esc(label(o))}</small>` : ''}</span></button>`).join('');
    el.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; set(list.find(o => o.id === b.dataset.v)); radios(sel, list, cur, label, set) };
  });
}
radios('#b-sizes', SIZES, () => size, o => fill(L.sizeSub, { stems: o.stems, h: o.h }), o => { size = o; wrapW = 1; buildCone(); fitWrap(); layoutHeads(); summary() });
radios('.b-papers', PAPERS, () => paper, o => money(o.price), o => { paper = o; $('sheet').style.backgroundImage = `url(${A('paper_' + o.id + '.webp')})`; buildCone(); summary() });
radios('#b-ribbons', RIBBONS, () => ribbon, null, o => { ribbon = o; setBow() });
const card = $('card');
$('starts').innerHTML = STARTS.map(t => `<button type="button">${esc(t)}</button>`).join('');
$('starts').onclick = e => { const b = e.target.closest('button'); if (b) card.value = b.textContent };
$('hand').onclick = e => { showHand = !showHand; e.currentTarget.setAttribute('aria-checked', showHand); hand.visible = showHand; frame() };

// ---------- 1 · making it: each stem laid on the paper, stems crossing where they will be tied ----------
const table = $('table'), sheet = $('sheet'), laysEl = $('lays');
const layEls = new Map(), natural = {};
let T = {}; // table geometry in px
function measure() {
  const r = table.getBoundingClientRect(), S = Math.min(r.width * .74, r.height * .9);
  T = { w: r.width, h: r.height, S, s: S / 70, cx: r.width / 2, cy: r.height / 2 + r.height * .02, bx: r.width / 2, by: r.height / 2 + S * .2 };
  Object.assign(sheet.style, { width: S + 'px', height: S + 'px', left: (T.cx - S / 2) + 'px', top: (T.cy - S / 2) + 'px', transform: 'rotate(-3deg)' });
}
const ROLEW = { focal: 0, spike: .15, filler: .5, green: 1 };
function fanOrder() { return picked.map((p, i) => ({ p, i, w: ROLEW[byId[p.id].role] + hash(p.u) * .3 })).sort((a, b) => a.w - b.w) }
function layoutLays(gather = 0) {
  const N = picked.length, order = fanOrder(), st = Math.min(10, 62 / Math.max(1, N - 1));
  order.forEach((o, k) => {
    const s = byId[o.p.id], el = layEls.get(o.p.u); if (!el) return;
    const nat = natural[s.id] || { w: 1, h: 4 }, h = s.L * T.s, w = h * nat.w / nat.h;
    const side = k % 2 ? 1 : -1, ang = (side * Math.ceil(k / 2) * st + (hash(o.p.u + 7) - .5) * 5) * (1 - gather);
    const off = ({ focal: 3, spike: 5, filler: 1, green: -2 }[s.role] + (hash(o.p.u + 3) - .5) * 3) * T.s * (1 - gather * .7);
    Object.assign(el.style, { width: w + 'px', height: h + 'px', left: (T.bx - w / 2) + 'px', top: (T.by - h * .72) + 'px', zIndex: o.i + 1 });
    el.dataset.t = `rotate(${ang}deg) translateY(${-off}px)`; el._g = { ang, off, w, h, u: o.p.u, z: o.i };
    if (!el.classList.contains('drop')) el.style.transform = el.dataset.t;
  });
}
function addLay(p) {
  const s = byId[p.id], el = new Image(); el.src = s.lay; el.alt = `${s.name}, ${s.col}`; el.className = 'b-lay drop'; el.draggable = false;
  el.onload = () => { natural[s.id] = { w: el.naturalWidth, h: el.naturalHeight }; layoutLays() };
  laysEl.appendChild(el); layEls.set(p.u, el); layoutLays();
  el.style.transform = (el.dataset.t || '') + ' translateY(-46px) scale(1.06)';
  requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.remove('drop'); el.style.transform = el.dataset.t }));
}
// tapping takes off the stem you actually touched: the top one whose photo is solid under your finger
const alphaCache = {};
function alphaAt(src, img, fx, fy) {
  let a = alphaCache[src];
  if (!a) { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); try { a = alphaCache[src] = { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height } } catch (e) { return 255 } }
  const x = Math.floor(fx * a.w), y = Math.floor(fy * a.h); if (x < 0 || y < 0 || x >= a.w || y >= a.h) return 0; return a.d[(y * a.w + x) * 4 + 3];
}
function stemAt(cx, cy) {
  const r = laysEl.getBoundingClientRect(); let best = null;
  for (const el of layEls.values()) {
    const g = el._g; if (!g || !el.complete) continue;
    const dx = cx - r.left - T.bx, dy = cy - r.top - T.by, a = -g.ang * Math.PI / 180;
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a) + g.off;
    const fx = (lx + g.w / 2) / g.w, fy = (ly + g.h * .72) / g.h;
    if (alphaAt(el.src, el, fx, fy) > 60 && (!best || g.z > best._g.z)) best = el;
  }
  return best;
}
table.addEventListener('click', e => { if (step !== 1) return; const el = stemAt(e.clientX, e.clientY); if (!el) return; const u = el._g.u, i = picked.findIndex(x => x.u === u); if (i > -1) { const id = picked[i].id; picked.splice(i, 1); changed(id, false) } });
table.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || step !== 1) return; laysEl.classList.toggle('hit', !!stemAt(e.clientX, e.clientY)) });
function syncLays() {
  const have = new Set(picked.map(p => p.u));
  for (const [u, el] of layEls) if (!have.has(u)) { el.style.opacity = 0; el.style.transform = el.dataset.t + ' translateY(-30px)'; setTimeout(() => el.remove(), reduce ? 0 : 300); layEls.delete(u) }
  picked.forEach(p => { if (!layEls.has(p.u)) addLay(p) }); layoutLays();
}

// ---------- 3 · checking it: photo heads on a real dome inside the cone, turning with you ----------
const glBox = $('gl'), mini = $('mini');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, 1, 2000);
const loader = new THREE.TextureLoader(), cache = {};
function tex(src) { return cache[src] ||= new Promise(res => loader.load(src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t) }, undefined, () => res(null))) }
const PX = 15; // the photos are 15 px to the cm
const ANG = ['000', '045', '090', '135', '180', '225', '270', '315'];
const DIR = -1; // picture 3 of each sheet faces left, so a head on the right of the dome uses picture 7
const fixed = new THREE.Group(), heads = new THREE.Group(); scene.add(fixed, heads);
function photoPlane(src, wCm, anchorY, z, order) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .5, depthWrite: true }));
  m.renderOrder = order; m.position.z = z; m.visible = false;
  tex(src).then(t => { if (!t) return; m.material.map = t; m.material.needsUpdate = true; const w = wCm || t.image.width / PX, h = w * t.image.height / t.image.width; m.scale.set(w, h, 1); m.userData = { w, h }; m.position.y = anchorY + h / 2; m.visible = true; frame() });
  return m;
}
let C = {}; // cone geometry in cm
// light fixed to the camera, from the upper left like the photos, so turning never breaks the lighting
scene.add(new THREE.HemisphereLight(0xFFF8F2, 0xC9AE9C, 2.6));
const sun = new THREE.DirectionalLight(0xFFF1E4, 2.4); sun.position.set(-40, 70, 60); scene.add(sun);
let cone, coneIn, fillMesh, bundle, bow, hand;
const rimAt = ph => C.hf + (C.hb - C.hf) * (1 - Math.cos(ph)) / 2;
// kept a touch inside the photographed cone's outline, so it only ever hides stems behind real paper
const radAt = (y, th) => { const t = y / C.hb, w = C.photo ? 0 : 1; return C.r0 + (C.R * (C.photo ? .94 : 1) - C.r0) * y / C.hf + w * ((Math.sin(th * 5 + 1.3) * .4 + Math.sin(th * 11 + y * .35) * .2) * t + Math.max(0, y / rimAt(th) - .86) * 6 + .35 * Math.exp(-((wrapPi(th - .7) / .05) ** 2))) };
function coneGeo() {
  const S = 120, Rw = 28, pos = [], uv = [], idx = [];
  for (let j = 0; j <= Rw; j++) for (let i = 0; i <= S; i++) { const th = i / S * Math.PI * 2, y = j / Rw * rimAt(th), r = radAt(y, th); pos.push(r * Math.sin(th), y, r * Math.cos(th)); uv.push(i / S * 2.2, y / 38) }
  for (let j = 0; j < Rw; j++) for (let i = 0; i < S; i++) { const a = j * (S + 1) + i, b = a + S + 1; idx.push(a, b, a + 1, b, b + 1, a + 1) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
let wrapW = 1; // how tightly she rolls the paper: a small bunch gets a smaller cone
function buildCone() {
  const k = size.k * wrapW; [cone, coneIn, bundle, bow].forEach(m => m && m.parent && m.parent.remove(m));
  // measured from the photographed cones (front edge, back edge, radius of the opening, in cm)
  const F = { paper: { hf: 27.5, hb: 29.8, R: 11.5, flat: .62 }, petal: { hf: 27.8, hb: 29.2, R: 13.8, flat: .47 } }[paper.id];
  C = { k, hf: F.hf * k, hb: F.hb * k, R: F.R * k, r0: .5 * k, photo: true, flat: F.flat, base: F.R * size.k }; C.rimY = C.hf; C.top = Math.max(size.h - 12, C.hb + 6);
  const g = coneGeo();
  cone = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ roughness: .96, side: THREE.FrontSide }));
  coneIn = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.BackSide, color: 0xD9CABE }));
  tex(A(`paper_${paper.id}.webp`)).then(t => { if (!t) return; t.wrapS = t.wrapT = THREE.RepeatWrapping; cone.material.map = coneIn.material.map = t; cone.material.needsUpdate = coneIn.material.needsUpdate = true; frame() });
  // the photographed cone is a flattened wrap, wide from the front and narrow from the side, so everything inside is squeezed the same way
  cone.scale.z = coneIn.scale.z = C.flat;
  heads.add(cone, coneIn);
  // the cone photographed from 8 sides is what you see; the 3D cone stays only as an invisible wall
  coneTex(paper.id).then(t => {
    if (!t || t.some(x => !x) || cone.parent !== heads) return; conePhoto.userData.tex = t; conePhoto.userData.f = -1;
    cone.material.colorWrite = false; cone.renderOrder = 1; coneIn.visible = false; conePhoto.visible = true; frame();
  });
  conePhoto.visible = false; cone.material.colorWrite = true; coneIn.visible = true;
  bundle = photoPlane(A('stem-bundle_m_front.webp'), 5.6 * k, -13 * k, 0, 1); fixed.add(bundle); setBow(); layoutHeads();
}
const coneTexs = {};
function coneTex(id) { return coneTexs[id] ||= Promise.all(ANG.map(a => tex(A(`cone_${id}_${a}.webp`)))) }
const conePhoto = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, depthWrite: false })); conePhoto.renderOrder = -1; conePhoto.center.set(.5, 0); conePhoto.visible = false; scene.add(conePhoto);
function poseCone() {
  const d = conePhoto.userData; if (!conePhoto.visible || !d.tex) return; const f = ((Math.round(wrapPi(yaw) / (Math.PI / 4)) * DIR) % 8 + 8) % 8, t = d.tex[f];
  if (f !== d.f) { d.f = f; conePhoto.material.map = t; conePhoto.material.needsUpdate = true } conePhoto.scale.set(t.image.width / PX * C.k, t.image.height / PX * C.k, 1);
}
function setBow() { if (bow && bow.parent) bow.parent.remove(bow); const y = C.hf * .2; bow = photoPlane(A(`ribbon-bow_${ribbon.id}_front.webp`), 10 * C.k, y - 5 * C.k, radAt(y, 0) + .5, 4); fixed.add(bow); useBowPhoto(); frame() }
// the ribbon photographed tied round the stems from 8 sides replaces the flat bow and the stem bundle
const bowTexs = {};
function bowTex(id) { return bowTexs[id] ||= Promise.all(ANG.map(a => tex(A(`bow_${id}_${a}.webp`)))) }
const bowPhoto = new THREE.Sprite(new THREE.SpriteMaterial({ alphaTest: .5, depthWrite: true, transparent: false })); bowPhoto.center.set(.5, 1); bowPhoto.renderOrder = 3; bowPhoto.visible = false; scene.add(bowPhoto);
function useBowPhoto() { const want = ribbon.id; bowTex(want).then(t => { if (want !== ribbon.id) return; const ok = t && t.every(Boolean); bowPhoto.userData = { tex: ok ? t : null, f: -1 }; bowPhoto.visible = !!ok; if (bundle) bundle.visible = !ok; if (bow) bow.userData.photo = !!ok; frame() }) }
function poseBowPhoto() {
  const d = bowPhoto.userData; if (!bowPhoto.visible || !d || !d.tex) return; const f = ((Math.round(wrapPi(yaw) / (Math.PI / 4)) * DIR) % 8 + 8) % 8, t = d.tex[f];
  if (f !== d.f) { d.f = f; bowPhoto.material.map = t; bowPhoto.material.needsUpdate = true } bowPhoto.scale.set(t.image.width / PX * C.k, t.image.height / PX * C.k, 1); bowPhoto.position.set(0, .6 * C.k, 0); if (bundle) bundle.visible = false;
}
function poseBow() { if (!bow || !bow.userData.w) return; if (bow.userData.photo) { bow.visible = false; return } const c = Math.cos(yaw), y = C.hf * .2, r = radAt(y, 0) * .7 + .5; bow.position.x = r * Math.sin(yaw); bow.position.z = r * c; bow.scale.x = bow.userData.w * Math.max(.05, c); bow.visible = c > .12 }
hand = photoPlane(A('scale_hand_front.webp'), null, -13, 0, 1); hand.position.x = -30; fixed.add(hand);
// heads: one sprite per stem, showing the photo taken from the side that faces you
const hs = new Map();
const textures = {};
function headTex(id) { return textures[id] ||= Promise.all(ANG.map(a => tex(A(`head_${id}_${a}.webp`)))) }
const stemMat = new THREE.MeshStandardMaterial({ color: 0x5E7A47, roughness: .8 });
function makeHead(p) {
  const s = byId[p.id], mat = new THREE.SpriteMaterial({ alphaTest: .5, depthWrite: true, transparent: false }), sp = new THREE.Sprite(mat);
  sp.visible = false; sp.renderOrder = 2; sp.center.set(.5, s.role === 'green' || s.role === 'spike' ? .08 : .22);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, 1, 5), stemMat); stem.visible = false;
  heads.add(sp, stem); const h = { sprite: sp, stem, s, p, frame: -1, tex: null, sc: .92 + hash(p.u + 11) * .16 }; hs.set(p.u, h);
  headTex(s.id).then(t => { h.tex = t; h.frame = -1; layoutHeads() }); return h;
}
function fitWrap() {
  let a = 0; for (const h of hs.values()) { const r = h.s.w * h.sc / 2 * (h.s.role === 'green' ? .75 : .95); a += (1.24 * r) ** 2 * .87 }
  const need = Math.sqrt(a / Math.PI), base = C.base || 12.6 * size.k, w = Math.round(Math.min(1, Math.max(.7, need / (base * .9))) / .04) * .04;
  if (Math.abs(w - wrapW) < .03) return false; wrapW = w; buildCone(); return true;
}
function syncHeads() {
  const have = new Set(picked.map(p => p.u));
  for (const [u, h] of hs) if (!have.has(u)) { heads.remove(h.sprite, h.stem); h.sprite.material.dispose(); hs.delete(u) }
  picked.forEach(p => { if (!hs.has(p.u)) makeHead(p) }); if (!fitWrap()) layoutHeads();
}
// the dome: heads start on a spiral, then settle so they just touch and lean in, like stems held in one hand
const GOLD = Math.PI * (3 - Math.sqrt(5));
function layoutHeads() {
  if (!C.hf) return; const order = fanOrder(), N = order.length, Rc = C.R * 1.15, Hd = Math.max(4, C.top - C.hf - 5);
  const P = order.map((o, i) => {
    const h = hs.get(o.p.u), g = h && h.s.role === 'green', t = Math.sqrt((i + .5) / Math.max(1, N)), ph = i * GOLD + hash(o.p.u) * .5;
    return { h, g, x: C.R * .6 * t * Math.sin(ph), z: C.R * .6 * t * Math.cos(ph) * C.flat, rad: (h ? h.s.w * h.sc : 8) / 2 * (g ? .75 : .95) };
  });
  for (let it = 0; it < 70; it++) {
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const Pa = P[a], Pb = P[b], dx = Pb.x - Pa.x, dz = Pb.z - Pa.z, d = Math.hypot(dx, dz) || .01, m = (Pa.rad + Pb.rad) * .62;
      if (d < m) { const q = (m - d) / 2 / d; Pa.x -= dx * q; Pa.z -= dz * q; Pb.x += dx * q; Pb.z += dz * q }
    }
    for (const p of P) { const pull = p.g ? .004 : .02; p.x *= 1 - pull; p.z *= 1 - pull; const r = Math.hypot(p.x, p.z / C.flat), lim = C.R * (p.g ? 1 : .88); if (r > lim) { p.x *= lim / r; p.z *= lim / r } }
  }
  let reach = 0; const reachAll = P.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.z / C.flat) + p.rad), 0);
  P.forEach(p => {
    const h = p.h; if (!h) return; const rr = Math.min(1.3, Math.hypot(p.x, p.z / C.flat) / Rc), ph = Math.atan2(p.x, p.z), rim = rimAt(ph);
    const lift = Math.min(1, Math.max(.25, (reachAll / Rc) ** 1.3));
    let y = rim - 4.5 + Hd * lift * Math.cos(Math.min(1, rr) * Math.PI / 2) ** .9;
    if (p.g) y -= 2.5; if (h.s.role === 'spike') y += 2;
    h.slot = { th: Math.min(1.3, rr * 1.15), ph, x: p.x, z: p.z, y, rim }; h.sprite.position.set(p.x, y, p.z); if (!p.g) reach = Math.max(reach, Math.hypot(p.x, p.z / C.flat));
    const top = new THREE.Vector3(p.x, y, p.z), base = new THREE.Vector3(0, C.hf * .35, 0), dir = base.clone().sub(top);
    const f = (y - (rim - 1)) / (y - base.y), len = dir.length() * Math.max(0, f);
    h.stem.visible = false; h.stem.scale.set(1, len, 1); h.stem.position.copy(top).addScaledVector(dir.normalize(), len / 2);
    h.stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); h.frame = -1;
  });
  // shade between the heads: a dark leafy dome under them, only as wide as the flowers reach
  if (fillMesh) { heads.remove(fillMesh); fillMesh.geometry.dispose() }
  if (N >= 3) {
    const S = 48, Rw = 10, pos = [], idx = [], R2 = Math.min(C.R * .88, reach + 2);
    for (let j = 0; j <= Rw; j++) for (let i = 0; i <= S; i++) {
      const th = i / S * Math.PI * 2, rr = j / Rw, r = rr * R2, rim = rimAt(th), y = rim - 6 + Math.max(0, (Hd * Math.min(1, Math.max(.25, (reachAll / Rc) ** 1.3)) - 4)) * Math.cos(Math.min(1, r / Rc) * Math.PI / 2) ** .9;
      pos.push(r * Math.sin(th), y, r * Math.cos(th));
    }
    for (let j = 0; j < Rw; j++) for (let i = 0; i < S; i++) { const a = j * (S + 1) + i, b = a + S + 1; idx.push(a, b, a + 1, b, b + 1, a + 1) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    fillMesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x34402A, roughness: 1, side: THREE.DoubleSide })); fillMesh.scale.z = C.flat; heads.add(fillMesh);
  } else fillMesh = null;
  frame();
}
function wrapPi(a) { return Math.atan2(Math.sin(a), Math.cos(a)) }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
function poseHeads() {
  const sy = Math.sin(yaw), cy = Math.cos(yaw), Rc = C.R * 1.15;
  for (const h of hs.values()) {
    if (!h.tex || !h.slot) continue;
    const rel = wrapPi(h.slot.ph + yaw), w = smooth(.15, .65, h.slot.th);
    const f = ((Math.round(rel * w / (Math.PI / 4)) * DIR) % 8 + 8) % 8, t = h.tex[f] || h.tex[0]; if (!t) continue;
    if (f !== h.frame) { h.frame = f; h.sprite.material.map = t; h.sprite.material.needsUpdate = true; h.sprite.scale.set(t.image.width / PX * h.sc, t.image.height / PX * h.sc, 1) }
    // heads at the back and down near the paper sit in the bouquet's own shade
    const zc = -h.slot.x * sy + h.slot.z * cy, back = Math.min(1, Math.max(0, -zc / Rc)), low = Math.min(1, Math.max(0, (h.slot.rim + 5 - h.slot.y) / 8));
    h.sprite.material.color.setScalar(1 - .26 * back - .14 * low);
    h.sprite.material.rotation = -Math.sin(h.slot.ph + yaw) * h.slot.th * .5; h.sprite.visible = true;
  }
}

// ---------- camera, turning and drawing ----------
let yaw = 0, vel = 0, drag = null, elev = .2, elevGoal = .2, dirty = true;
const frame = () => dirty = true;
function place(el) { el.appendChild(renderer.domElement); resize() }
function resize() {
  const host = renderer.domElement.parentElement; if (!host) return; const r = host.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); frame();
}
function aim() {
  let top = C.rimY + 6; for (const h of hs.values()) if (h.sprite.visible) top = Math.max(top, h.sprite.position.y + h.sprite.scale.y * (1 - h.sprite.center.y) * .9);
  const big = step !== 1, low = -15 * C.k, hi = top + 3, cy = (low + hi) / 2, span = hi - low;
  const halfW = (showHand && big ? C.R + 24 : C.R + 10), vt = Math.tan(THREE.MathUtils.degToRad(13));
  const dist = Math.max(span / 2 / vt * (big ? 1.15 : 1.05), halfW / (vt * camera.aspect)) + C.R;
  camera.position.set(showHand && big ? -6 : 0, cy + dist * Math.sin(elev), dist * Math.cos(elev)); camera.lookAt(showHand && big ? -6 : 0, cy, 0);
}
const cv = renderer.domElement;
cv.addEventListener('pointerdown', e => { drag = { x: e.clientX }; cv.setPointerCapture(e.pointerId) });
cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.x = e.clientX; vel = dx * .009; yaw += vel; frame() });
cv.addEventListener('pointerup', () => drag = null); cv.addEventListener('pointercancel', () => drag = null);
cv.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { yaw -= .3; frame() } if (e.key === 'ArrowRight') { yaw += .3; frame() } });
cv.tabIndex = 0; cv.setAttribute('aria-label', L.canvas);
let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (step === 1 && phone.matches) return;
  if (!drag && Math.abs(vel) > 1e-4) { vel *= .92; yaw += vel; dirty = true }
  if (Math.abs(elevGoal - elev) > 1e-3) { elev += (elevGoal - elev) * (reduce ? 1 : 1 - Math.exp(-dt * 3.2)); dirty = true }
  if (!dirty) return; dirty = false;
  heads.rotation.y = yaw; poseHeads(); poseCone(); poseBow(); poseBowPhoto(); hand.visible = showHand && step !== 1; aim(); renderer.render(scene, camera);
});

// ---------- fullness, in the counter's voice ----------
const sayEl = $('say');
function say(html) { sayEl.innerHTML = html }
const faceEl = $('face');
function setFace(k) { const u = DS.faces && DS.faces[k]; if (u) faceEl.style.backgroundImage = `url(${u})` }
['building', 'crowded', 'wrapping', 'forthem', 'counter'].forEach(k => { if (DS.faces && DS.faces[k]) { const i = new Image(); i.src = DS.faces[k] } });
function fullness() { const area = picked.reduce((a, p) => a + byId[p.id].w ** 2 * .8, 0), R = (C.base || 12.6 * size.k) * 1.12; return area / (Math.PI * R * R * 1.3) }
function total() { return picked.reduce((a, p) => a + byId[p.id].price, 0) + (picked.length ? paper.price : 0) }
function changed(id, added) {
  $('q_' + id).textContent = picked.filter(p => p.id === id).length; $('st_' + id).classList.toggle('on', picked.some(p => p.id === id));
  syncLays(); syncHeads(); summary(added ? byId[id] : null);
}
function summary(added) {
  const n = picked.length, f = fullness();
  const greens = picked.filter(p => byId[p.id].role === 'green').length, focal = picked.filter(p => byId[p.id].role === 'focal').length;
  $('count').textContent = `· ${fill(n === 1 ? L.stem1 : L.stemN, { n })}${n ? fill(L.holds, { size: size.name.toLowerCase(), stems: size.stems }) : ''}`;
  $('total').textContent = money(total());
  $('fill').style.width = Math.min(100, f / 1.6 * 100) + '%';
  const nx = $('next'); nx.textContent = step === 1 ? L.wrapIt : `${L.add} · ${money(total())}`; nx.disabled = n < 3;
  let line;
  if (!n) line = esc(L.start);
  else if (n < 3) line = added ? esc(fill(L.lovely, { name: added.name })) : esc(L.addMore);
  else if (f < .6) line = esc(L.thin);
  else if (f > 1.35) line = esc(L.crowded);
  else if (focal && !greens) line = esc(L.greens);
  else line = esc(L.good);
  const st = n < 3 ? -1 : f < .6 ? 0 : f > 1.35 ? 2 : 1; [...$('fit').children].forEach((el, i) => el.classList.toggle('on', i === st));
  // on phones the fullness waits until it stands up in the cone
  if (step === 1 && phone.matches && n >= 3) line = esc(added ? fill(L.phoneOn, { name: added.name, n }) : fill(L.phoneN, { n })) + ' ' + esc(L.phoneWrap);
  setFace(step === 2 ? 'wrapping' : f > 1.35 && n >= 3 ? 'crowded' : step === 3 && n >= 3 && f >= .6 ? 'forthem' : n >= 3 && f < .6 && !(step === 1 && phone.matches) ? 'counter' : 'building');
  say(line);
  const w = DS.whereLine ? DS.whereLine() : ''; $('where').textContent = w; $('where').hidden = !w;
}
document.addEventListener('ds:where', () => summary());

// ---------- 2 · wrap it: the stems gather, the paper folds, the bouquet stands up ----------
const stage = $('stage');
function setStep(n) {
  step = n; stage.dataset.step = n; root.classList.toggle('checking', n === 3);
  stage.querySelectorAll('.b-steps li').forEach(li => li.classList.toggle('on', +li.dataset.s === n));
  root.querySelectorAll('[data-p]').forEach(el => { el.hidden = +el.dataset.p !== (n === 2 ? 1 : n) });
  place(n === 1 && !phone.matches ? mini : glBox); summary();
}
async function wrapIt() {
  if (picked.length < 3 || step !== 1) return;
  const top = root.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 0);
  if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  $('next').disabled = true;
  // the stems gather where they'll be tied, then she takes it and wraps it
  layoutLays(.85); say(esc(L.wrapping)); setFace('wrapping'); await wait(600);
  setStep(2); await wait(1700);
  elev = .75; elevGoal = .2; yaw = -.5; vel = .035; setStep(3);
  // on phones the column under the bouquet starts again from its heading
  if (phone.matches) { const t = root.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 0); scrollTo({ top: Math.max(0, t), behavior: 'auto' }) }
}
function unwrap() { layoutLays(); elev = elevGoal = .2; setStep(1) }
$('back').onclick = unwrap;
stage.querySelector('.b-steps').onclick = e => { const li = e.target.closest('li'); if (!li) return; if (li.dataset.s === '1' && step === 3) unwrap(); if (li.dataset.s !== '1' && step === 1) wrapIt() };
$('next').onclick = () => { if (step === 1) wrapIt(); else if (step === 3) addToBag() };

// ---------- the bag: one line for the wrap, one per stem, all sharing a _bouquet id ----------
function snapshot() {
  const c = document.createElement('canvas'), w = 240, h = 300; c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#F6EDE6'; g.fillRect(0, 0, w, h); const k = Math.min(w / cv.width, h / cv.height) * 1.1; g.drawImage(cv, (w - cv.width * k) / 2, (h - cv.height * k) / 2, cv.width * k, cv.height * k);
  try { return c.toDataURL('image/jpeg', .8) } catch (e) { return D.room }
}
let busy = false;
function addToBag() {
  if (busy) return;
  const counts = {}; picked.forEach(p => counts[p.id] = (counts[p.id] || 0) + 1);
  const ids = Object.keys(counts), missing = ids.filter(id => !byId[id].v);
  if (missing.length || !paper.v || !DS.add) { say(esc(L.missing)); setFace('counter'); return }
  const plural = (w, n) => n < 2 || /(s|us|breath)$/.test(w) ? w : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
  const what = ids.map(id => `${counts[id]} ${byId[id].col} ${plural(byId[id].name.toLowerCase(), counts[id])}`).join(', ');
  const bid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), note = $('note').value.trim(), msg = card.value.trim();
  const props = { Stems: what, Size: size.name, Ribbon: ribbon.name, _bouquet: bid };
  if (msg) props.Card = msg;
  if (note) props.Note = note;
  const items = [{ id: paper.v, quantity: 1, properties: props }, ...ids.map(id => ({ id: byId[id].v, quantity: counts[id], properties: { _bouquet: bid } }))];
  const img = snapshot(), nx = $('next');
  busy = true; nx.disabled = true; nx.textContent = L.adding;
  DS.add(items).then(() => {
    $('doneImg').src = img;
    $('doneS').textContent = fill(L.doneS, { n: picked.length, paper: paper.name.toLowerCase(), ribbon: ribbon.name.toLowerCase() }) + (msg ? L.doneCard : '') + '.';
    $('done').hidden = false; $('seebag').focus();
  }).catch(err => { say(esc(err && err.message || L.error)); setFace('counter') }).finally(() => { busy = false; summary() });
}
$('again').onclick = () => { $('done').hidden = true; $('next').focus() };
$('seebag').onclick = () => { $('done').hidden = true; if (!(DS.open && DS.open('cart-drawer')) && DS.cartUrl) location.href = DS.cartUrl };
$('done').addEventListener('keydown', e => { if (e.key === 'Escape') $('done').hidden = true });

// ---------- start ----------
buildCone(); measure(); setStep(1);
addEventListener('resize', () => { measure(); layoutLays(); resize() });
phone.addEventListener('change', () => setStep(step));
DS.builder = { picked, changed, wrapIt, unwrap, addToBag, setYaw: v => { yaw = v; frame() }, get yaw() { return yaw } };
root.dataset.ready = '1';
}
