/* dear stem · panels, where and when, the bag, the product form and Ask the counter */
(() => {
  const DS = window.DS || (window.DS = {});
  const T = DS.t || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }
  };
  DS.store = store;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  DS.esc = esc;

  // money in the shop's format, without trailing zeros ($55, not $55.00)
  DS.fmt = cents => {
    const f = DS.moneyFormat || '${{amount}}', n = cents / 100;
    return f.replace(/\{\{\s*(\w+)\s*\}\}/, (m, k) => {
      if (k === 'amount_no_decimals') return Math.round(n).toLocaleString('en-US');
      if (k.includes('comma')) return n.toFixed(2).replace('.', ',').replace(/,00$/, '');
      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
    });
  };


  // the header's real height, so sticky things below it line up on every screen
  const hdr = $('.shopify-section--hdr') || $('[data-hdr]');
  if (hdr) { const setH = () => document.documentElement.style.setProperty('--hh', hdr.offsetHeight + 'px'); setH(); if (window.ResizeObserver) new ResizeObserver(setH).observe(hdr) }

  // ---------- panels ----------
  let openId = null, lastFocus = null;
  const scrim = $('.scrim');
  DS.open = (id, detail = {}) => {
    const p = document.getElementById(id);
    if (!p) return false;
    if (openId && openId !== id) DS.close(true);
    lastFocus = document.activeElement;
    p.classList.add('open');
    openId = id;
    if (scrim) scrim.hidden = innerWidth > 720;
    p.dispatchEvent(new CustomEvent('ds:open', { detail }));
    document.dispatchEvent(new CustomEvent('ds:panel', { detail: { id, open: true } }));
    setTimeout(() => { const f = p.querySelector('[data-autofocus]') || p.querySelector('.x'); if (f) f.focus({ preventScroll: true }) }, 80);
    return true;
  };
  DS.close = quiet => {
    if (!openId) return;
    const p = document.getElementById(openId);
    if (p) p.classList.remove('open');
    document.dispatchEvent(new CustomEvent('ds:panel', { detail: { id: openId, open: false } }));
    openId = null;
    if (scrim) scrim.hidden = true;
    if (!quiet && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  DS.isOpen = () => openId;

  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open-panel]');
    if (o) { e.preventDefault(); DS.open(o.dataset.openPanel); return }
    const c = e.target.closest('[data-open-cart]');
    if (c && $('#cart-drawer') && !document.body.classList.contains('t-cart')) { e.preventDefault(); DS.open('cart-drawer'); return }
    if (e.target.closest('[data-close-panel]')) { DS.close(); return }
    const m = e.target.closest('[data-menu]');
    if (m) { const n = $('#hd-nav'), on = !n.classList.contains('open'); n.classList.toggle('open', on); m.setAttribute('aria-expanded', on) }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') DS.close() });

  // ---------- the bag (Shopify AJAX cart + Section Rendering API) ----------
  DS.sectionIds = () => ['cart-drawer', ...$$('[data-cart-section]').map(e => e.dataset.cartSection)];
  const setCount = n => $$('[data-bag-n]').forEach(el => { el.textContent = n ? `${T.bag} · ${n}` : T.bag });
  DS.render = sections => {
    if (!sections) return;
    Object.entries(sections).forEach(([id, html]) => {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (id === 'cart-drawer') {
        const nb = doc.querySelector('[data-cart-body]'), ob = $('#cart-drawer [data-cart-body]');
        if (nb && ob) ob.innerHTML = nb.innerHTML;
        const c = doc.querySelector('[data-bag-count]');
        if (c) setCount(+c.textContent.trim());
      } else {
        const el = $(`[data-cart-section="${id}"]`), ne = doc.querySelector(`[data-cart-section="${id}"]`);
        if (el && ne) el.innerHTML = ne.innerHTML;
      }
    });
  };
  DS.post = (url, body) => fetch(url + '.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(Object.assign({}, body, { sections: DS.sectionIds().join(','), sections_url: location.pathname }))
  }).then(async r => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.description || d.message || T.error);
    return d;
  });
  DS.add = items => DS.post(DS.cartAdd, { items }).then(d => { DS.render(d.sections); return d });

  document.addEventListener('click', e => {
    const r = e.target.closest('[data-remove]'), q = e.target.closest('[data-qty]');
    if (!r && !q) return;
    e.preventDefault();
    const list = (r || q).closest('ul.bag');
    if (list) list.style.opacity = .5;
    let p;
    if (r) { const updates = {}; r.dataset.remove.split(',').filter(Boolean).forEach(k => { updates[k] = 0 }); p = DS.post(DS.cartUpdate, { updates }) }
    else p = DS.post(DS.cartChange, { id: q.dataset.qty, quantity: Math.max(0, +q.dataset.q) });
    p.then(d => DS.render(d.sections)).catch(() => { if (list) list.style.opacity = 1 });
  });

  // ---------- where it's going, and when (cart attributes) ----------
  const wp = $('#panel-where');
  const fmtDay = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  DS.where = DS.where || {};
  DS.whereSet = () => !!DS.where.mode;
  DS.whereLine = () => {
    const w = DS.where, day = (w.day || '').split(',')[0].toLowerCase();
    return w.mode === 'Pickup' ? `Pickup at the shop, ${day}` : w.mode ? `Delivery to ${w.zip}, ${day}` : '';
  };
  const paintChips = () => {
    const w = DS.where, day = (w.day || '').split(',')[0].toLowerCase();
    $$('[data-where-chip]').forEach(el => {
      el.innerHTML = w.mode ? `${w.mode === 'Pickup' ? esc(T.pickup) : esc(w.zip)} · ${esc(day)} <span class="full">${esc(T.change)}</span>` : esc(T.ask);
    });
  };
  if (DS.whereSet()) paintChips();
  if (wp) {
    const today = new Date(), tmr = new Date(Date.now() + 864e5), max = new Date(Date.now() + 30 * 864e5);
    const st = { mode: DS.where.mode || 'Delivery', zip: DS.where.zip || '', day: 'today', date: '' };
    const d0 = DS.where.day || '';
    if (/^tomorrow/i.test(d0)) st.day = 'tomorrow'; else if (d0 && !/^today/i.test(d0)) st.day = 'pick';
    $('[data-tomorrow]', wp).textContent = fmtDay(tmr);
    const zipI = $('#w-zip', wp), dateI = $('#w-date', wp), msg = $('[data-zip-msg]', wp);
    zipI.value = st.zip; dateI.min = iso(today); dateI.max = iso(max);
    const zipOk = z => String(DS.localZips || '').split(/[\s,]+/).filter(Boolean).some(p => p.endsWith('*') ? z.startsWith(p.slice(0, -1)) : z === p);
    const zipMsg = () => {
      const z = zipI.value.trim();
      if (st.mode !== 'Delivery' || z.length < 5) { msg.hidden = true; return true }
      msg.hidden = false;
      if (!/^\d{5}$/.test(z)) { msg.textContent = T.zipBad; return false }
      msg.textContent = zipOk(z) ? T.zipOk : T.zipOut;
      return zipOk(z);
    };
    const paint = () => {
      $$('[data-mode]', wp).forEach(b => b.setAttribute('aria-checked', b.dataset.mode === st.mode));
      $$('[data-day]', wp).forEach(b => b.setAttribute('aria-checked', b.dataset.day === st.day));
      $('[data-zip-wrap]', wp).hidden = st.mode !== 'Delivery';
      $('[data-date-wrap]', wp).hidden = st.day !== 'pick';
      zipMsg();
    };
    wp.addEventListener('click', e => {
      const m = e.target.closest('[data-mode]'), d = e.target.closest('[data-day]');
      if (m) { st.mode = m.dataset.mode; paint() }
      if (d) { st.day = d.dataset.day; paint(); if (st.day === 'pick') dateI.focus() }
      if (e.target.closest('[data-where-save]')) save();
    });
    zipI.addEventListener('input', zipMsg);
    zipI.addEventListener('keydown', e => { if (e.key === 'Enter') save() });
    wp.addEventListener('ds:open', e => { $('[data-where-first]', wp).hidden = !(e.detail && e.detail.first); paint() });
    function save() {
      const z = zipI.value.trim();
      if (st.mode === 'Delivery' && !(/^\d{5}$/.test(z) && zipOk(z))) { msg.hidden = false; msg.textContent = /^\d{5}$/.test(z) ? T.zipOut : T.zipBad; zipI.focus(); return }
      if (st.day === 'pick' && !dateI.value) { dateI.focus(); return }
      const day = st.day === 'today' ? `${T.today}, ${fmtDay(today)}` : st.day === 'tomorrow' ? `${T.tomorrow}, ${fmtDay(tmr)}` : fmtDay(new Date(dateI.value + 'T12:00'));
      DS.where = { mode: st.mode, zip: st.mode === 'Delivery' ? z : '', day };
      store.set('ds-where-seen', 1);
      paintChips();
      DS.post(DS.cartUpdate, { attributes: { 'Delivery or pickup': st.mode, 'ZIP code': DS.where.zip, 'Day': day } }).then(d => DS.render(d.sections)).catch(() => {});
      document.dispatchEvent(new CustomEvent('ds:where', { detail: DS.where }));
      DS.close();
    }
    // first visit on the home page: ask before stepping in
    if ($('[data-ask-where-first]') && !DS.whereSet() && !store.get('ds-where-seen', 0)) {
      store.set('ds-where-seen', 1);
      setTimeout(() => DS.open('panel-where', { first: true }), 700);
    }
  }


  // ---------- collection filters: apply as soon as something changes ----------
  document.documentElement.classList.add('js');
  $$('[data-filters]').forEach(f => {
    let t;
    f.addEventListener('change', e => { clearTimeout(t); t = setTimeout(() => f.requestSubmit ? f.requestSubmit() : f.submit(), e.target.type === 'number' ? 600 : 0) });
    f.addEventListener('submit', () => { $$('input[type=number]', f).forEach(i => { if (!i.value) i.disabled = true }) });
  });

  // ---------- product page: size, vase, card, notes ----------
  $$('[data-product]').forEach(sec => {
    const form = $('[data-product-form]', sec), data = JSON.parse(($('[data-product-json]', sec) || {}).textContent || '{}');
    if (!form) return;
    const btn = $('[data-add]', sec), btnT = $('[data-add-t]', sec), msg = $('[data-msg]', sec), vrow = $('[data-vases]', sec);
    let vase = null;
    const cur = () => { const i = $('input[name="id"]:checked', form) || $('[name="id"]', form); return data.variants.find(v => String(v.id) === String(i && i.value)) || data.variants[0] };
    const paintVases = h => {
      if (!vrow || !data.vases) return;
      const fit = data.vases.filter(v => !h || (v.h >= h * .45 && v.h <= h * .78));
      if (vase && !fit.some(v => v.id === vase)) vase = null;
      vrow.innerHTML = fit.length ? fit.map(v => `<button type="button" class="vpick" aria-pressed="${v.id === vase}" data-vase="${v.id}"><img src="${esc(v.img)}" alt="" width="200" height="200" loading="lazy"><b>${esc(v.title)}</b><span>${v.h} cm · ${DS.fmt(v.price)}</span></button>`).join('') : `<p class="muted" style="margin:0;grid-column:1/-1">${esc(vrow.dataset.none)}</p>`;
    };
    const paint = () => {
      const v = cur(), h = v.h || 0;
      $$('.ruler .bar', sec).forEach(b => b.classList.toggle('on', +b.dataset.h === h));
      const extra = vase ? (data.vases.find(x => x.id === vase) || {}).price || 0 : 0;
      if (btnT) btnT.textContent = v.available ? `${btn.dataset.label} · ${DS.fmt(v.price + extra)}` : T.soldOut;
      btn.disabled = !v.available;
      paintVases(h);
    };
    form.addEventListener('change', e => {
      if (e.target.name === 'id') {
        paint(); const u = new URL(location.href); u.searchParams.set('variant', e.target.value); history.replaceState(null, '', u);
        const v = cur(), main = $('[data-main]', sec);
        if (main && v.img) { main.removeAttribute('srcset'); main.src = v.img }
      }
    });
    sec.addEventListener('click', e => {
      const v = e.target.closest('[data-vase]');
      if (v) { const id = +v.dataset.vase; vase = vase === id ? null : id; paint(); return }
      const s = e.target.closest('[data-start]');
      if (s) { const ta = $('textarea', form); if (ta) { ta.value = s.textContent; ta.focus() } }
    });
    // what they typed at the counter travels to the florist
    const note = $('[data-note]', form), carried = store.get('ds-notes', '');
    if (note && carried && !note.value) note.value = carried;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form), props = {};
      for (const [k, val] of fd.entries()) { const m = k.match(/^properties\[(.+)\]$/); if (m && String(val).trim()) props[m[1]] = String(val).trim() }
      const items = [{ id: +fd.get('id'), quantity: 1, properties: props }];
      if (vase) items.push({ id: vase, quantity: 1 });
      btn.disabled = true; if (msg) msg.hidden = true;
      DS.add(items).then(() => {
        if (btnT) btnT.textContent = T.added;
        DS.open('cart-drawer');
        setTimeout(paint, 1600);
      }).catch(err => { if (msg) { msg.hidden = false; msg.textContent = err.message } paint() });
    });
    paint();
  });

  // ---------- Ask the counter: four questions, three bouquets ----------
  const ask = $('[data-ask]');
  if (ask) {
    const D = JSON.parse($('[data-ask-json]', ask).textContent);
    const body = $('[data-ask-body]', ask);
    const A = { who: null, occ: null, feel: null, whoT: '', occT: '', feelT: '', budget: D.budget || 65 };
    const KEYS = ['who', 'occ', 'feel'];
    const GUESS = {
      who: [[/mom|mum|mother|grand|aunt/i, 'mom'], [/wife|husband|girl|boy|partner|fianc/i, 'partner'], [/boss|cowork|colleague|team|teacher|client/i, 'colleague'], [/friend|neighbo|sister|brother|cousin/i, 'friend'], [/loss|griev|passed/i, 'grieving']],
      occ: [[/sorry|apolog/i, 'sorry'], [/funeral|loss|passed|memorial|condolence/i, 'sympathy'], [/thank/i, 'thanks'], [/birth|bday/i, 'birthday'], [/congrat|graduat|promot|job|baby|wedding|engag|home|open|show/i, 'congrats'], [/anniver|love|valentine|date|miss/i, 'just']],
      feel: [[/white|calm|quiet|soft|simple/i, 'round'], [/wild|loose|garden|natural|bright|sunny|colou?r/i, 'garden'], [/tall|big|dramatic|statement/i, 'tall'], [/small|little|tiny|cute/i, 'sweet']]
    };
    const guess = (k, t) => ((GUESS[k].find(([r]) => r.test(t || '')) || [])[1]) || null;
    const tag = k => A[k] === 'other' ? guess(k, A[k + 'T']) : A[k];
    const notes = () => KEYS.filter(k => A[k] === 'other' && A[k + 'T']).map(k => A[k + 'T']).join('; ');
    const label = k => { const c = D.choices[k].find(c => c.tag === A[k]); return A[k] === 'other' ? (A[k + 'T'] || 'them') : c ? c.label : 'them' };
    const whoName = () => label('who').replace(/^My /, 'your ').replace(/^Mom$/, 'your mom').replace(/^A /, 'a ').replace(/^Me$/, 'you');
    const fill = (s) => esc(s).replace('[who]', esc(whoName()));
    const guide = (line, face) => `<div class="g"><span class="face" aria-hidden="true" style="background-image:url(${DS.faces[face || 'counter']})"></span><p class="q">${line}</p></div>`;
    const dots = n => `<div class="dots" aria-label="${n} / 4">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
    const x = `<button class="x" type="button" data-close-panel aria-label="Close">×</button>`;
    const chips = k => `<div class="chips" role="radiogroup">${D.choices[k].map(c => `<button type="button" class="chipo" role="radio" aria-checked="${A[k] === c.tag}" data-a="${k}" data-v="${esc(c.tag)}"><b>${esc(c.label)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ''}</button>`).join('')}
      <button type="button" class="chipo" role="radio" aria-checked="${A[k] === 'other'}" data-a="${k}" data-v="other"><b>${esc(D.other[k].label)}</b><span>${esc(D.other[k].sub)}</span></button></div>
      ${A[k] === 'other' ? `<label class="f">${esc(D.other.field)}<input id="ask-other" maxlength="60" value="${esc(A[k + 'T'])}" placeholder="${esc(D.other[k].hint)}" data-autofocus></label><button type="button" class="btn" data-next="${k}">${esc(D.next)}</button>` : ''}`;
    const priceFor = (p, size) => { const v = p.variants.find(v => v.size === size); return v ? v.price : null };
    const step = n => {
      const back = n > 1 ? `<button type="button" class="link" data-step="${n - 1}">← ${esc(D.back)}</button>` : '';
      const Q = D.q[n - 1];
      if (n < 4) return `${x}${dots(n)}${back}${guide(fill(Q.line))}<h2 class="ct m">${esc(Q.title)}</h2>${chips(KEYS[n - 1])}`;
      const fits = D.sizes.filter(z => D.products.some(p => { const pr = priceFor(p, z.name); return pr && pr <= A.budget * 100 }));
      const top = fits[fits.length - 1];
      const hint = top ? D.budgetLine.replace('[size]', top.name.toLowerCase()).replace('[stems]', top.stems) : D.budgetLow;
      return `${x}${dots(4)}${back}${guide(fill(Q.line))}<h2 class="ct m">${esc(Q.title)}</h2>
        <label class="f">${esc(D.upTo)} <output style="font-size:24px;font-weight:500" data-bout>${DS.fmt(A.budget * 100)}</output><input type="range" min="${D.min}" max="${D.max}" step="5" value="${A.budget}" data-budget></label>
        <p class="muted" style="margin:0" data-bhint>${esc(hint)}</p><button type="button" class="btn" data-results>${esc(D.show)}</button>`;
    };
    const results = () => {
      const scored = D.products.map(p => {
        let sc = 0;
        if (p.tags.includes('occ:' + tag('occ'))) sc += 3;
        if (p.tags.includes('feel:' + tag('feel'))) sc += 3;
        if (p.tags.includes('who:' + tag('who'))) sc += 2;
        const v = p.variants.filter(v => v.available && v.price <= A.budget * 100).sort((a, b) => b.price - a.price)[0];
        return { p, sc, v };
      }).filter(r => r.v).sort((a, b) => b.sc - a.sc || b.v.price - a.v.price).slice(0, 3);
      store.set('ds-notes', notes());
      if (!scored.length) return `${x}<button type="button" class="link" data-step="4">← ${esc(D.back)}</button>${guide(esc(D.none))}<a class="btn" href="${esc(D.cooler)}">${esc(D.seeAll)}</a>`;
      const line = D.picked.replace('[who]', whoName()) + (notes() ? ' ' + D.noteLine : '');
      return `${x}<button type="button" class="link" data-step="4">← ${esc(D.back)}</button>${guide(esc(line), 'forthem')}
        <div class="picks">${scored.map(({ p, v }) => { const z = D.sizes.find(z => z.name.toLowerCase() === String(v.size).toLowerCase()); return `<a class="pickc" href="${esc(p.url)}?variant=${v.id}"><img src="${esc(p.img)}" alt="" width="96" height="120" loading="lazy"><span><b>${esc(p.title)}</b><em>${esc(v.size)}${z ? ` · ${z.stems} stems · ${z.h} cm` : ''}</em><strong>${DS.fmt(v.price)}</strong></span></a>` }).join('')}</div>`;
    };
    const show = h => { body.innerHTML = h; const p = ask.closest('.panel') || $('#panel-ask'); if (p) p.scrollTop = 0 };
    let n = 1;
    $('#panel-ask') && $('#panel-ask').addEventListener('ds:open', () => show(step(n)));
    body.addEventListener('click', e => {
      const c = e.target.closest('[data-a]');
      if (c) {
        const k = c.dataset.a; A[k] = c.dataset.v;
        if (c.dataset.v === 'other') { show(step(n)); const i = $('#ask-other', body); if (i) i.focus(); return }
        if (k === 'who' && A.who === 'grieving') A.occ = 'sympathy';
        n = KEYS.indexOf(k) + 2; show(step(n)); return;
      }
      const nx = e.target.closest('[data-next]');
      if (nx) { const k = nx.dataset.next, i = $('#ask-other', body), v = (i && i.value || '').trim(); if (!v) { i && i.focus(); return } A[k + 'T'] = v; if (k === 'who' && guess('who', v) === 'grieving') A.occ = 'sympathy'; n = KEYS.indexOf(k) + 2; show(step(n)); return }
      const s = e.target.closest('[data-step]');
      if (s) { n = +s.dataset.step; show(step(n)); return }
      if (e.target.closest('[data-results]')) show(results());
    });
    body.addEventListener('input', e => {
      if (!e.target.matches('[data-budget]')) return;
      A.budget = +e.target.value;
      $('[data-bout]', body).textContent = DS.fmt(A.budget * 100);
      const fits = D.sizes.filter(z => D.products.some(p => { const pr = priceFor(p, z.name); return pr && pr <= A.budget * 100 }));
      const top = fits[fits.length - 1];
      $('[data-bhint]', body).textContent = top ? D.budgetLine.replace('[size]', top.name.toLowerCase()).replace('[stems]', top.stems) : D.budgetLow;
    });
    body.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ask-other') { e.preventDefault(); const b = $('[data-next]', body); if (b) b.click() } });
    show(step(1));
  }
})();
