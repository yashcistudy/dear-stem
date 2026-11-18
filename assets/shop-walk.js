// dear stem · the shop walk. One photo and one depth map per spot, pushed into 3D so a drag turns your head a little.
import * as THREE from 'three';

const sec = document.querySelector('[data-walk]');
if (sec) start(sec);

function start(sec) {
  const C = JSON.parse(sec.querySelector('[data-walk-json]').textContent);
  const STANDS = C.stands;
  const DS = window.DS || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (matchMedia('(hover:none)').matches) sec.classList.add('touch');
  const q = s => sec.querySelector(s);
  const stage = q('[data-stage]'), fade = q('[data-fade]'), back = q('[data-back]'), hereT = q('[data-here]'), tip = q('[data-tip]'), jump = q('[data-jump]');

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }) } catch (e) { sec.classList.add('nogl'); return }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xFBF8F3);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 50);
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src });
  const cache = {};
  let owner = null;
  const ray = new THREE.Raycaster();
  let W = 1, H = 1;

  function shadowTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(40,20,20,.55)'); r.addColorStop(1, 'rgba(40,20,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  async function build(id) {
    if (cache[id]) return cache[id];
    const s = STANDS[id], [photo, dimg] = await Promise.all([loadImg(s.img), loadImg(s.depth)]);
    const c = document.createElement('canvas'); c.width = dimg.width; c.height = dimg.height;
    const g = c.getContext('2d'); g.drawImage(dimg, 0, 0);
    const dd = g.getImageData(0, 0, c.width, c.height).data;
    const TH = Math.tan(s.fov * Math.PI / 360), TV = TH / (photo.width / photo.height);
    const depthAt = (u, v) => { const x = Math.min(c.width - 1, Math.max(0, Math.round(u * (c.width - 1)))), y = Math.min(c.height - 1, Math.max(0, Math.round(v * (c.height - 1)))); return dd[(y * c.width + x) * 4] / 255 };
    // white = near (1.4 m), black = far (about 7 m)
    const point = (u, v) => { const d = 1.4 + Math.pow(1 - depthAt(u, v), 1.15) * 5.6; return new THREE.Vector3((u * 2 - 1) * TH * d, (1 - 2 * v) * TV * d, -d) };
    const geo = new THREE.PlaneGeometry(1, 1, 240, 160), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const v3 = point(uv.getX(i), 1 - uv.getY(i)); p.setXYZ(i, v3.x, v3.y, v3.z) }
    geo.computeBoundingSphere();
    const tex = new THREE.Texture(photo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
    cache[id] = { mesh, hots: s.hots.map(h => Object.assign({}, h, { p3: point(h.u, h.v) })) };
    // the owner stands in the empty middle of the entrance, about two steps in front of you
    if (id === 'door' && C.owner) {
      let v = .98; while (v > .55 && 1.4 + Math.pow(1 - depthAt(.5, v), 1.15) * 5.6 < 2.9) v -= .01;
      // the floor sits about one eye height below the camera, so measure in eye heights
      const f0 = point(.5, v), u = Math.min(3, Math.max(.6, -f0.y / 1.6)), D = (W < H ? 1.5 : 1.75) * u, feet = new THREE.Vector3(f0.x * D / -f0.z, f0.y, -D), Hh = 1.66 * u;
      const ow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .02, color: 0xFFF4EE }));
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: shadowTex() }));
      sh.rotation.x = -Math.PI / 2; sh.scale.set(.8 * u, .32 * u, 1); sh.position.set(feet.x + .04, feet.y + .01, feet.z + .02); mesh.add(sh, ow);
      const L = new THREE.TextureLoader(), poses = {};
      L.setCrossOrigin('anonymous');
      const pose = k => {
        const go = t => { ow.material.map = t; ow.material.needsUpdate = true; const w = Hh * t.image.width / t.image.height; ow.scale.set(w, Hh, 1); ow.position.set(feet.x, feet.y + Hh / 2, feet.z + .05) };
        if (poses[k]) go(poses[k]); else L.load(C.owner[k], t => { t.colorSpace = THREE.SRGBColorSpace; poses[k] = t; go(t) });
      };
      pose(DS.whereSet && DS.whereSet() ? 'thisway' : 'welcome');
      document.addEventListener('ds:where', () => pose('thisway'));
      owner = { mesh: ow, shadow: sh, a: 1 };
    }
    return cache[id];
  }

  // ---------- looking: a drag leans and turns your head a little ----------
  let t = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, hov = { x: 0, y: 0 }, drag = null, walking = false, here = null, dots = [];
  const el = renderer.domElement;
  const rel = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } };
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; el.setPointerCapture(e.pointerId); tip.hidden = true });
  el.addEventListener('pointermove', e => {
    const p = rel(e); hov.x = p.x / W * 2 - 1; hov.y = p.y / H * 2 - 1;
    if (owner && !drag) el.style.cursor = here === 'door' && onOwner(e) ? 'pointer' : '';
    if (!drag) return;
    drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    t.x = Math.max(-1, Math.min(1, t.x - (e.clientX - drag.x) / W * 2.2));
    t.y = Math.max(-1, Math.min(1, t.y - (e.clientY - drag.y) / H * 2));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  el.addEventListener('pointerup', e => { const tap = drag && drag.moved < 8; drag = null; if (tap && here === 'door' && onOwner(e)) act(C.owner.a === 'counter' ? { a: 'stand', go: 'counter' } : { a: 'ask' }) });
  el.addEventListener('pointerleave', () => { hov.x = hov.y = 0 });
  function onOwner(e) {
    if (!owner || owner.a < .5) return false;
    const p = rel(e); ray.setFromCamera({ x: p.x / W * 2 - 1, y: -(p.y / H * 2 - 1) }, camera);
    const hit = ray.intersectObject(owner.mesh)[0];
    if (!hit || !hit.uv || !owner.mesh.material.map) return false;
    // count a tap on her, not on the clear space around her
    const img = owner.mesh.material.map.image;
    const c = onOwner.c || (onOwner.c = document.createElement('canvas'));
    if (c.src !== img.src) { c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); c.src = img.src }
    try { return c.getContext('2d').getImageData(Math.floor(hit.uv.x * img.width), Math.floor((1 - hit.uv.y) * img.height), 1, 1).data[3] > 40 } catch (err) { return true }
  }
  sec.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') t.x = Math.max(-1, t.x - .15); if (e.key === 'ArrowRight') t.x = Math.min(1, t.x + .15) });

  // ---------- what a dot does ----------
  function act(h) {
    if (h.a === 'stand' && STANDS[h.go]) return goTo(h.go);
    if (h.a === 'ask') return DS.open && (DS.open('panel-ask') || (location.hash = 'ask'));
    if (h.a === 'where') return DS.open && DS.open('panel-where');
    if (h.a === 'cart') return DS.open && (DS.open('cart-drawer') || (location.href = DS.cartUrl));
    if (h.url) location.href = h.url;
  }
  const name = h => h.a === 'stand' ? `${C.go} ${h.t.replace(/^The /, 'the ')}` : h.t;
  function placeDots(st) {
    dots.forEach(d => d.el.remove());
    jump.innerHTML = st.hots.map((h, i) => `<button type="button" data-j="${i}">${DS.esc ? DS.esc(name(h)) : name(h)}</button>`).join('');
    jump.onclick = e => { const b = e.target.closest('[data-j]'); if (b) act(st.hots[+b.dataset.j]) };
    dots = st.hots.map(h => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'hot' + (h.a === 'stand' ? ' go' : '');
      b.innerHTML = `<i></i><b></b>`; b.querySelector('b').textContent = name(h); b.setAttribute('aria-label', name(h));
      b.onclick = () => act(h); sec.appendChild(b); return { el: b, p3: h.p3 };
    });
  }
  async function goTo(id) {
    if (here === id) return;
    if (DS.close) DS.close(true);
    if (here) { fade.style.opacity = 1; walking = true; await new Promise(r => setTimeout(r, reduce ? 0 : 320)) }
    const st = await build(id);
    if (here) scene.remove(cache[here].mesh);
    scene.add(st.mesh); here = id; t = { x: 0, y: 0 }; cur = { x: 0, y: 0 }; walking = false; camera.position.z = reduce ? 0 : .35;
    placeDots(st); hereT.textContent = STANDS[id].title; back.hidden = id === 'door';
    fade.style.opacity = 0; sec.classList.add('ready');
    Object.keys(STANDS).forEach(k => build(k).catch(() => {}));
  }
  back.onclick = () => goTo('door');

  function size() {
    const r = stage.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H); camera.aspect = W / H; camera.fov = camera.aspect < 1 ? 78 : 62; camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  // only draw while the walk is on screen
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting }).observe(sec);
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!visible || !here) return;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    const open = DS.isOpen && DS.isOpen() && W > 720;
    const gx = t.x + (drag || reduce ? 0 : hov.x * .12) + (open ? .35 : 0), gy = t.y + (drag || reduce ? 0 : hov.y * .08);
    cur.x += (gx - cur.x) * k; cur.y += (gy - cur.y) * k;
    // a short step forward when you walk to the next spot
    const z = camera.position.z + ((walking ? -.45 : 0) - camera.position.z) * k;
    camera.position.set(cur.x * .18 * (camera.aspect < 1 ? .5 : 1), .02 - cur.y * .06, z);
    const half = STANDS[here].fov * Math.PI / 360, camHalf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect), yawMax = Math.max(.16, half - camHalf - .06);
    camera.rotation.set(-cur.y * .08 - .04, -cur.x * yawMax, 0);
    // she steps aside while you look around, and comes back when you face her
    if (owner) {
      const want = here === 'door' && !(drag && drag.moved > 12) && Math.abs(t.x) < .22 ? 1 : 0;
      owner.a += (want - owner.a) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
      owner.mesh.material.opacity = owner.shadow.material.opacity = owner.a;
      owner.mesh.visible = owner.shadow.visible = owner.a > .02;
    }
    renderer.render(scene, camera);
    dots.forEach(d => {
      const p = d.p3.clone().project(camera), vis = p.z < 1 && Math.abs(p.x) < .94 && Math.abs(p.y) < .86;
      d.el.style.display = vis ? 'flex' : 'none';
      if (vis) { d.el.style.left = (p.x + 1) / 2 * W + 'px'; d.el.style.top = (1 - p.y) / 2 * H + 'px' }
    });
  });

  goTo('door').catch(() => sec.classList.add('nogl'));
  window.DS_WALK = { goTo };
}
