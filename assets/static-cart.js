/* dear stem · the static copy of the Shopify theme on GitHub Pages.
   Shopify keeps the bag on its servers and renders it with Liquid. Here the bag lives in this browser,
   and the same Liquid files render it with liquidjs, so the bag looks and works the same as on Shopify.
   Only on the GitHub Pages copy: the Shopify theme never loads this file. */
(function () {
  const KIT = window.DS_KIT, KEY = 'ds-static-cart';
  const B = KIT.base; // '/dear-stem'
  const byVariant = {};
  KIT.products.forEach(p => p.variants.forEach(v => { byVariant[v.id] = { v, p } }));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { items: [], attributes: {} } } catch (e) { return { items: [], attributes: {} } } };
  const save = c => { try { localStorage.setItem(KEY, JSON.stringify(c)) } catch (e) {} };
  let cart = load();
  const keyOf = (id, props) => { const s = id + JSON.stringify(props || {}); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return id + ':' + (h >>> 0).toString(16) };
  function cartObj() {
    const items = cart.items.filter(it => byVariant[it.id]).map(it => {
      const { v, p } = byVariant[it.id];
      return { key: it.key, id: v.id, variant_id: v.id, variant: v, product: p, title: p.title + (p.has_only_default_variant ? '' : ' - ' + v.title), quantity: it.quantity,
        properties: it.properties, price: v.price, final_price: v.price, line_price: v.price * it.quantity, final_line_price: v.price * it.quantity,
        image: v.featured_image || p.featured_image, url: v.url, product_title: p.title, variant_title: v.title };
    });
    return { items, item_count: items.reduce((a, i) => a + i.quantity, 0), total_price: items.reduce((a, i) => a + i.final_line_price, 0), attributes: cart.attributes, note: '', currency: 'USD' };
  }

  // ---------- the same Liquid, in the browser ----------
  const { Liquid, Tag } = window.liquidjs, T = KIT.templates;
  const fs = { readFileSync: f => T[f], readFile: async f => T[f], existsSync: f => f in T, exists: async f => f in T, resolve: (r, f, ext) => f.endsWith(ext) ? f : f + ext, contains: () => true, dirname: f => f.replace(/\/[^/]*$/, ''), sep: '/' };
  const engine = new Liquid({ root: [''], extname: '.liquid', fs, jsTruthy: false });
  engine.registerTag('schema', class extends Tag { constructor(t, r, l) { super(t, r, l); while (r.length) { if (r.shift().name === 'endschema') return } } *render() {} });
  const tr = (key, args = {}) => {
    let v = key.split('.').reduce((o, k) => o && o[k], KIT.locale);
    if (v && typeof v === 'object') v = args.count === 1 ? v.one : v.other;
    return typeof v === 'string' ? v.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => args[k] != null ? args[k] : '') : key;
  };
  const kw = a => Object.fromEntries(a.filter(x => Array.isArray(x)));
  const money = (c, dec = true) => { const s = ((+c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return dec ? s : s.replace(/\.00$/, '') };
  const F = {
    t: (k, ...a) => tr(k, kw(a)),
    asset_url: f => `${B}/assets/${f}`,
    image_url: img => !img ? null : (typeof img === 'string' ? img : img.src + (img.width ? `#${img.width}x${img.height}` : '')),
    image_tag: (url, ...a) => {
      if (!url) return ''; const o = kw(a), m = String(url).match(/#(\d+)x(\d+)/);
      const extra = Object.entries(o).filter(([k]) => !['widths', 'width', 'height'].includes(k)).map(([k, v]) => v === '' ? k : `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
      return `<img src="${String(url).replace(/#.*/, '')}" width="${m ? m[1] : o.width || ''}" height="${m ? m[2] : o.height || ''}" ${extra}>`;
    },
    money: c => '$' + money(c), money_without_currency: c => money(c), money_without_trailing_zeros: c => '$' + money(c, false), money_with_currency: c => '$' + money(c) + ' USD',
  };
  Object.entries(F).forEach(([k, f]) => engine.registerFilter(k, f));
  async function sections(ids) {
    const out = {}, globals = { settings: KIT.settings, routes: KIT.routes, shop: KIT.shop, cart: cartObj(), request: { page_type: 'cart' } };
    for (const id of String(ids || '').split(',').filter(Boolean)) {
      const type = id === 'cart-drawer' ? 'cart-drawer' : 'main-cart', set = id === 'cart-drawer' ? {} : (KIT.sectionSettings[id] || {});
      const html = await engine.renderFile('sections/' + type, { section: { id, settings: set, blocks: [] } }, { globals });
      out[id] = `<div id="shopify-section-${id}" class="shopify-section">${html}</div>`;
    }
    return out;
  }

  // ---------- Shopify's AJAX cart, answered in the browser ----------
  const realFetch = window.fetch.bind(window);
  const reply = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url, m = url.match(/\/cart(?:\/(add|update|change|clear))?\.js(\?|$)/);
    if (!m) return realFetch(input, init);
    const b = init.body ? JSON.parse(init.body) : {}, act = m[1];
    if (act === 'add') {
      const added = [];
      for (const it of b.items || [{ id: b.id, quantity: b.quantity, properties: b.properties }]) {
        const vv = byVariant[+it.id];
        if (!vv) return reply({ status: 404, description: 'Cannot find variant' }, 404);
        if (!vv.v.available) return reply({ status: 422, description: `${vv.p.title} is sold out.` }, 422);
        const key = keyOf(+it.id, it.properties), ex = cart.items.find(x => x.key === key);
        if (ex) ex.quantity += +it.quantity || 1; else cart.items.unshift({ key, id: +it.id, quantity: +it.quantity || 1, properties: it.properties || {} });
        added.push(key);
      }
      save(cart);
      return reply({ items: cartObj().items.filter(i => added.includes(i.key)), sections: await sections(b.sections) });
    }
    if (act === 'update') {
      Object.entries(b.updates || {}).forEach(([k, q]) => { const it = cart.items.find(x => x.key === k); if (it) it.quantity = +q });
      if (b.attributes) Object.assign(cart.attributes, b.attributes);
    }
    if (act === 'change') { const it = cart.items.find(x => x.key === b.id); if (it) it.quantity = +b.quantity }
    if (act === 'clear') cart = { items: [], attributes: {} };
    cart.items = cart.items.filter(x => x.quantity > 0); save(cart);
    return reply({ ...cartObj(), sections: await sections(b.sections) });
  };

  // ---------- what this browser remembers, painted in before the theme starts ----------
  window.DS = window.DS || {};
  const a = cart.attributes;
  window.DS.where = { mode: a['Delivery or pickup'] || '', zip: a['ZIP code'] || '', day: a['Day'] || '' };

  // ---------- the parts Shopify's servers do: filters, sorting, search, checkout ----------
  function note(text) {
    let d = document.getElementById('static-note');
    if (!d) {
      d = document.createElement('div'); d.id = 'static-note'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
      d.innerHTML = '<div><p class="lab">dear stem</p><p data-t></p><button class="btn" type="button">OK</button></div>';
      d.querySelector('button').onclick = () => { d.hidden = true };
      document.body.appendChild(d);
    }
    d.querySelector('[data-t]').textContent = text; d.hidden = false; d.querySelector('button').focus();
  }
  document.addEventListener('submit', e => {
    const f = e.target, act = f.getAttribute('action') || '';
    if (/\/cart\/?$/.test(act)) { e.preventDefault(); note(KIT.copy.checkout) }
    else if (/\/contact\/?$/.test(act)) { e.preventDefault(); note(KIT.copy.contact) }
  }, true);

  document.addEventListener('DOMContentLoaded', async () => {
    const DS = window.DS;
    DS.render(await sections(DS.sectionIds().join(',')));
    const q = new URLSearchParams(location.search);
    // collection filters and sort
    const grid = document.querySelector('.fc-g .cards'), form = document.querySelector('[data-filters]');
    if (grid && form) {
      const cards = [...grid.querySelectorAll('.pc')], av = q.getAll('filter.v.availability'), lo = parseFloat(q.get('filter.v.price.gte')), hi = parseFloat(q.get('filter.v.price.lte')), sort = q.get('sort_by') || 'manual';
      form.querySelectorAll('input[type=checkbox]').forEach(i => { i.checked = av.includes(i.value) });
      const set = (n, v) => { const i = form.querySelector(`[name="${n}"]`); if (i && !isNaN(v)) i.value = v };
      set('filter.v.price.gte', lo); set('filter.v.price.lte', hi);
      const sel = form.querySelector('[name=sort_by]'); if (sel) sel.value = sort;
      const keep = c => { const p = +c.dataset.price / 100, ok = c.dataset.available === 'true'; return (!av.length || av.includes(ok ? '1' : '0')) && !(p < lo) && !(p > hi) };
      const shown = cards.filter(keep);
      if (sort === 'price-ascending') shown.sort((x, y) => x.dataset.price - y.dataset.price);
      if (sort === 'price-descending') shown.sort((x, y) => y.dataset.price - x.dataset.price);
      cards.forEach(c => { c.hidden = true }); shown.forEach(c => { c.hidden = false; grid.appendChild(c) });
    }
    // search
    if (document.body.classList.contains('t-search')) {
      const term = (q.get('q') || '').trim(), h = document.querySelector('.srch h1'), input = document.querySelector('.srch [name=q]'), res = document.querySelector('.srch .fc-g');
      if (input) input.value = term;
      if (!term) { if (h) h.textContent = tr('search.title'); if (res) res.hidden = true; return }
      if (h) h.textContent = tr('search.results', { terms: term });
      let n = 0; document.querySelectorAll('.srch .cards .pc').forEach(c => { const hit = c.textContent.toLowerCase().includes(term.toLowerCase()); c.hidden = !hit; n += hit });
      if (!n && res) { res.innerHTML = `<p class="muted">${tr('search.none').replace(/</g, '&lt;')}</p>` }
    }
  });
})();
