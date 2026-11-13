// dear stem · the journey: when and where, Ask the counter, the cooler, product, vases, bag, checkout
// Every screen opens in the same side panel, from a dot in the shop or a card in the simple view.

export const BQ = [
 {id:'b01',name:'Red classic',img:'img/bq/b01-red-classic.jpg',feel:'round',price:55,occ:['birthday','sorry','just','congrats'],who:['partner'],line:'Red roses, round and full, with a little eucalyptus.'},
 {id:'b02',name:'Blush garden',img:'img/bq/b02-blush-garden.jpg',feel:'garden',price:65,occ:['birthday','thanks','just','congrats'],who:['mom','friend','partner'],line:'Garden roses, ranunculus and lisianthus, loose like they were just picked.'},
 {id:'b03',name:'White and calm',img:'img/bq/b03-white-calm.jpg',feel:'round',price:60,occ:['sympathy','sorry','thanks'],who:['grieving','colleague','mom'],line:'All white and green. Quiet and kind.'},
 {id:'b04',name:'Peach ranunculus',img:'img/bq/b04-peach-ranunculus.jpg',feel:'sweet',price:45,occ:['thanks','just','birthday'],who:['friend','colleague','me'],line:'Peach ranunculus with soft greens.'},
 {id:'b05',name:'Sunny',img:'img/bq/b05-sunny.jpg',feel:'garden',price:50,occ:['congrats','birthday','thanks'],who:['friend','colleague','me'],line:'Yellow and white, bright enough for good news.'},
 {id:'b09',name:'Bright birthday',img:'img/bq/b09-bright-birthday.jpg',feel:'tall',price:70,occ:['birthday','congrats'],who:['friend','partner','me'],line:'Tall and colourful, for a birthday that deserves a fuss.'},
 {id:'b10',name:'Petite sweet',img:'img/bq/b10-petite-sweet.jpg',feel:'sweet',price:35,occ:['just','thanks','sorry'],who:['friend','mom','me','colleague'],line:'A small handful of blush and cream. Easy to carry.'}
];
// honest sizes: stem count and height from the cut end to the tallest head
export const SIZES = {petite:{name:'Petite',stems:8,h:40,k:.7},classic:{name:'Classic',stems:12,h:50,k:1},grand:{name:'Grand',stems:18,h:60,k:1.45}};
const priceOf=(b,s)=>Math.round(b.price*SIZES[s].k/5)*5;
// vases rendered from the Poly Haven models at one shared scale, heights from the models
export const VASES = [
 {id:'brass_vase_03',name:'Small brass bud vase',h:20,price:18},{id:'ceramic_vase_02',name:'Wide white jar',h:31,price:26},
 {id:'ceramic_vase_04',name:'White jug',h:34,price:26},{id:'ceramic_vase_01',name:'White bottle vase',h:40,price:28},
 {id:'ceramic_vase_03',name:'Slim white vase',h:41,price:24},{id:'antique_ceramic_vase_01',name:'Blue and white vase',h:44,price:38},
 {id:'brass_vase_02',name:'Tall brass ewer',h:53,price:42}
].map(v=>Object.assign(v,{img:`img/vases/${v.id}.jpg`}));
// a vase suits a bouquet when it is about half to three quarters of its height
const fits=(v,h)=>v.h>=h*.45&&v.h<=h*.78;
const WHO=[['mom','Mom'],['partner','My partner'],['friend','A friend'],['grieving','Someone grieving'],['colleague','A colleague'],['me','Me'],['other','Someone else']];
const OCC=[['birthday','Birthday'],['thanks','Thank you'],['sorry','Sorry'],['sympathy','Sympathy'],['just','Just because'],['congrats','Congrats'],['other','Something else']];
const FEEL=[['garden','Loose garden','like it was just picked'],['round','Round classic','full and even'],['tall','Tall dramatic','long stems, big presence'],['sweet','Small sweet','a little handful'],['other','Something else','tell me in your words']];
// 'other' answers: typed in their own words, matched to our tags where we can, and always passed to the florist
const OTHER_HINT={who:'My neighbour, my teacher, a new dad',occ:'An anniversary, a new home, a first show',feel:'All white, wild and bright, only greens'};
const GUESS={
 who:[[/mom|mum|mother|grand|aunt/i,'mom'],[/wife|husband|girl|boy|partner|fianc/i,'partner'],[/boss|cowork|colleague|team|teacher|client/i,'colleague'],[/friend|neighbo|sister|brother|cousin/i,'friend'],[/loss|griev|passed/i,'grieving']],
 occ:[[/sorry|apolog/i,'sorry'],[/funeral|loss|passed|memorial|condolence/i,'sympathy'],[/thank/i,'thanks'],[/birth|bday/i,'birthday'],[/congrat|graduat|promot|job|baby|wedding|engag|home|open|show/i,'congrats'],[/anniver|love|valentine|date|miss/i,'just']],
 feel:[[/white|calm|quiet|soft|simple/i,'round'],[/wild|loose|garden|natural|bright|sunny|colou?r/i,'garden'],[/tall|big|dramatic|statement/i,'tall'],[/small|little|tiny|cute/i,'sweet']]};
const guess=(k,t)=>((GUESS[k].find(([r])=>r.test(t||''))||[])[1])||null;
const STARTS=['Thinking of you today.','Happy birthday. Have the loveliest day.','I am so proud of you.','Sorry, and I love you.','With you, always.'];

const listJoin=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={ get(k,d){ try{ const v=sessionStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } }, set(k,v){ try{ sessionStorage.setItem(k,JSON.stringify(v)) }catch(e){} } };

export function journey({panelIn, show, closePanel, S, setChip}){
  const bag = store.get('ds-bag',[]);
  const AC = {who:null,occ:null,feel:null,budget:65,whoT:'',occT:'',feelT:''};
  const notes=()=>[AC.who==='other'&&AC.whoT,AC.occ==='other'&&AC.occT,AC.feel==='other'&&AC.feelT].filter(Boolean).join('; ');
  const tag=k=>AC[k]==='other'?guess(k,AC[k+'T']):AC[k];
  const close='<button class="close" aria-label="Close" data-close>×</button>';
  // the owner guides each step; her stills replace the monogram when they arrive
  const guide=(line)=>`<div class="g"><span class="face" aria-hidden="true"></span><p class="q">${line}</p></div>`;
  const who=()=>AC.who==='other'?esc(AC.whoT||'them'):(WHO.find(w=>w[0]===AC.who)||[,'them'])[1].replace('My ','your ').replace(/^Mom$/,'your mom').replace(/^A /,'a ').replace(/^Me$/,'you');
  const money=n=>'$'+n;
  const updBag=()=>{ store.set('ds-bag',bag); const n=bag.length; document.getElementById('bagN').textContent=n?`Bag · ${n}`:'Bag' };
  updBag();
  const whenLine=()=>S.set?`${S.mode==='pickup'?'Pickup at the shop':'Delivery to '+esc(S.zip)}, ${S.day.toLowerCase()}`:'Choose where and when first';

  // ---------- when and where ----------
  function whenWhere(first){ return `${close}
   ${first?'<p class="lab">Before you step in</p>':''}<p class="q" style="font-size:24px">Where&#39;s it going, and when?</p>
   <p class="muted" style="margin:0;font-size:14px">We only show flowers we can get there in time.</p>
   <div class="seg" role="radiogroup" aria-label="Delivery or pickup"><button role="radio" aria-checked="${S.mode==='delivery'}" data-mode="delivery">Delivery</button><button role="radio" aria-checked="${S.mode==='pickup'}" data-mode="pickup">I&#39;ll pick it up</button></div>
   <label class="f">ZIP code<input id="zip" value="${esc(S.zip)}" inputmode="numeric" autocomplete="postal-code"></label>
   <div class="opts" role="radiogroup" aria-label="Day">${[['Today','order by 1 pm'],['Tomorrow','Fri, Nov 13'],['Pick a day','up to 30 days']].map(([a,b])=>`<button class="opt" role="radio" aria-checked="${S.day===a}" data-day="${a}"><b>${a}</b><span>${b}</span></button>`).join('')}</div>
   <button class="btn" data-go>Step inside</button>
   <p class="muted" style="margin:0;font-size:13px">Delivery around Portland is $9. Pickup at the shop is free.</p>` }

  // ---------- Ask the counter: four questions, then three bouquets ----------
  const steps=n=>`<div class="dots" aria-label="Question ${n} of 4">${[1,2,3,4].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
  const chips=(list,cur,key)=>`<div class="chips" role="radiogroup">${list.map(([v,l,s])=>`<button class="chipo" role="radio" aria-checked="${cur===v}" data-ac="${key}" data-v="${v}"><b>${l}</b>${s?`<span>${s}</span>`:''}</button>`).join('')}</div>
   ${cur==='other'?`<label class="f">In your words<input id="otherT" maxlength="60" value="${esc(AC[key+'T'])}" placeholder="${OTHER_HINT[key]}"></label><button class="btn" data-other="${key}">Next</button>`:''}`;
  function ask(n){
    const back=n>1?`<button class="link" data-ask="${n-1}">← Back</button>`:'';
    if(n===1) return `${close}${steps(1)}${guide('Hi, I&#39;m at the counter. Who are they for?')}<p class="ct" style="font-size:40px">Who is it for?</p>${chips(WHO,AC.who,'who')}`;
    if(n===2) return `${close}${steps(2)}${back}${guide(`Lovely. What&#39;s the occasion for ${who()}?`)}<p class="ct" style="font-size:40px">The occasion</p>${chips(OCC,AC.occ,'occ')}`;
    if(n===3) return `${close}${steps(3)}${back}${guide('And how should it feel when they open the door?')}<p class="ct" style="font-size:40px">The feeling</p>${chips(FEEL,AC.feel,'feel')}`;
    if(n===4){ const s=sizeFor(AC.budget); return `${close}${steps(4)}${back}${guide('Last one. What would you like to spend?')}<p class="ct" style="font-size:40px">Your budget</p>
      <label class="f">Up to <output id="bOut" style="font-size:28px;font-weight:500">${money(AC.budget)}</output><input type="range" id="budget" min="35" max="150" step="5" value="${AC.budget}"></label>
      <p class="muted" style="margin:0" id="bHint">${s}</p><button class="btn" data-results>Show me three</button>` }
  }
  function sizeFor(b){ return b<45?'That buys a petite one, about 8 stems.':b<80?'That buys a classic, about 12 stems.':'That buys a grand one, about 18 stems.' }
  function results(){
    const scored=BQ.map(b=>{ let sc=0; if(b.occ.includes(tag('occ'))) sc+=3; if(b.feel===tag('feel')) sc+=3; if(b.who.includes(tag('who'))) sc+=2;
      const size=['grand','classic','petite'].find(s=>priceOf(b,s)<=AC.budget); return {b,sc,size} }).filter(x=>x.size).sort((a,c)=>c.sc-a.sc||priceOf(c.b,c.size)-priceOf(a.b,a.size)).slice(0,3);
    if(!scored.length) return `${close}${guide('Under $35 is hard for a full bouquet. A single stem with a card works beautifully, though.')}<button class="btn" data-zone="cooler">See everything in the cooler</button><button class="link" data-ask="4">← Change the budget</button>`;
    return `${close}<button class="link" data-ask="4">← Back</button>${guide(`Here are three we&#39;d make for ${who()}. Each one is real, and you&#39;ll see a photo before it leaves.${notes()?' I&#39;ll pass your note to the florist too.':''}`)}
     <div class="picks">${scored.map(({b,size})=>`<button class="pickc" data-prod="${b.id}" data-size="${size}"><img src="${b.img}" alt=""><span><b>${b.name}</b><em>${SIZES[size].name} · ${SIZES[size].stems} stems · ${SIZES[size].h} cm</em><strong>${money(priceOf(b,size))}</strong></span></button>`).join('')}</div>`;
  }

  // ---------- the cooler: every ready bouquet ----------
  function cooler(){ return `${close}<p class="lab">The cooler</p><p class="ct" style="font-size:44px">Ready bouquets</p>
    ${guide(S.set?`All of these can reach ${S.mode==='pickup'?'the counter':esc(S.zip)} ${S.day.toLowerCase()}.`:'Tell me where it&#39;s going and I&#39;ll only show what gets there in time.')}
    <div class="grid2">${BQ.map(b=>`<button class="card" data-prod="${b.id}" data-size="classic"><img src="${b.img}" alt="" loading="lazy"><b>${b.name}</b><span>from ${money(priceOf(b,'petite'))}</span></button>`).join('')}</div>` }

  // ---------- one bouquet ----------
  let P=null;
  function product(id,size){ const b=BQ.find(x=>x.id===id); P=P&&P.b===b?P:{b,size:size||'classic',vase:null,backup:'florist',card:'',note:notes()}; if(size) P.size=size;
    const s=SIZES[P.size], vs=VASES.filter(v=>fits(v,s.h));
    return `${close}<button class="link" data-zone="cooler">← All bouquets</button>
    <img class="hero" src="${b.img}" alt="${b.name}"><div><p class="ct" style="font-size:40px">${b.name}</p><p style="margin:6px 0 0">${b.line}</p></div>
    <div><p class="lab">Size</p><div class="opts" role="radiogroup">${Object.entries(SIZES).map(([k,z])=>`<button class="opt" role="radio" aria-checked="${P.size===k}" data-size-set="${k}"><b>${z.name}</b><span>${z.stems} stems · ${z.h} cm<br>${money(priceOf(b,k))}</span></button>`).join('')}</div>
    <div class="ruler" aria-hidden="true"><span class="hand" style="height:${18/60*100}%"></span>${Object.entries(SIZES).map(([k,z])=>`<span class="bar${P.size===k?' on':''}" style="height:${z.h/60*100}%"><em>${z.h}</em></span>`).join('')}</div>
    <p class="muted" style="margin:6px 0 0;font-size:13px">Next to an 18 cm hand. Height runs from the cut end to the tallest flower.</p></div>
    <div><p class="lab">If a flower sells out</p><div class="seg" role="radiogroup"><button role="radio" aria-checked="${P.backup==='florist'}" data-backup="florist">Florist&#39;s choice</button><button role="radio" aria-checked="${P.backup==='ask'}" data-backup="ask">Text me first</button></div>
    <p class="muted" style="margin:6px 0 0;font-size:13px">We swap like for like: a round flower for a round one, same size, same price.</p></div>
    <div><p class="lab">Add a vase that fits</p><div class="vrow">${vs.map(v=>`<button class="vpick" aria-pressed="${P.vase===v.id}" data-vase="${v.id}"><img src="${v.img}" alt=""><b>${v.name}</b><span>${v.h} cm · ${money(v.price)}</span></button>`).join('')||'<p class="muted" style="margin:0">No vase on our shelf suits this size.</p>'}</div></div>
    <div><p class="lab">The card</p><textarea id="cardT" maxlength="180" placeholder="We copy it out by hand.">${esc(P.card)}</textarea><div class="starts">${STARTS.map(t=>`<button data-start>${t}</button>`).join('')}</div></div>
    <label class="f">Anything else the florist should know?<input id="noteT" maxlength="140" value="${esc(P.note)}" placeholder="A colour to avoid, an allergy, a flower they love"></label>
    <p class="muted" style="margin:0;font-size:14px">${whenLine()}. Before it leaves, we send you a photo of the real bouquet to approve.</p>
    <button class="btn" data-addp>Add to bag · ${money(priceOf(b,P.size)+(P.vase?VASES.find(v=>v.id===P.vase).price:0))}</button>` }

  // ---------- vases and extras ----------
  function shelf(){ return `${close}<p class="lab">The shelf</p><p class="ct" style="font-size:44px">Vases</p>
    ${guide('Every vase is shown at its real size, so you can see the difference.')}
    <div class="grid2">${VASES.map(v=>`<div class="card"><img src="${v.img}" alt="" loading="lazy"><b>${v.name}</b><span>${v.h} cm · ${money(v.price)}</span><span class="muted" style="font-size:12px">Fits ${listJoin(Object.values(SIZES).filter(z=>fits(v,z.h)).map(z=>z.name.toLowerCase()))||'single stems'}</span><button class="btn ghost sm" data-addv="${v.id}">Add</button></div>`).join('')}</div>` }

  // ---------- build your own ----------
  function wrap(){ return `${close}<p class="lab">The wrap station</p><p class="ct" style="font-size:44px">Build your own</p>
    ${guide('Pick every stem yourself, then the paper and a ribbon. I&#39;ll tell you if it&#39;s getting crowded.')}
    <img class="hero" src="stand/stand_04_wrap_master.jpg" alt="The ribbon wall and wrapping paper at the wrap station">
    <a class="btn" href="build/" style="text-decoration:none">Start building</a>` }

  // ---------- café ----------
  function cafe(){ return `${close}<p class="lab">The café</p><p class="ct" style="font-size:44px">Visit</p>
    <p style="margin:0">Coffee and pastries from the counter, in the shop only. Collect your order here or choose your flowers in person. Open every day, 8 to 6.</p>
    <img class="hero" src="stand/stand_03_counter_master.jpg" alt="The pastry counter">
    <p class="muted" style="margin:0;font-size:14px">A concept shop in Portland, Oregon.</p>` }

  // ---------- bag and checkout ----------
  function bagView(){ const sub=bag.reduce((a,x)=>a+x.price,0), del=S.mode==='delivery'&&bag.length?9:0;
    return `${close}<p class="lab">${bag.length} item${bag.length===1?'':'s'}</p><p class="ct" style="font-size:44px">Your bag</p>
    ${bag.length?`<ul class="bag">${bag.map((x,i)=>`<li><img src="${x.img}" alt=""><span><b>${esc(x.name)}</b><em>${esc(x.detail)}</em></span><strong>${money(x.price)}</strong><button class="link" data-rm="${i}" aria-label="Remove ${esc(x.name)}">Remove</button></li>`).join('')}</ul>
     <div class="tot"><span>${whenLine()}</span><span>${del?money(del):'Free'}</span></div><div class="tot big"><span>Total</span><span>${money(sub+del)}</span></div>
     <button class="btn" data-checkout>Checkout</button>`:`${guide('Nothing here yet. The cooler is a good place to start.')}<button class="btn ghost" data-zone="cooler">Go to the cooler</button>`}` }
  function checkout(){ const pick=S.mode==='pickup'; return `${close}<button class="link" data-bag>← Your bag</button><p class="ct" style="font-size:44px">Checkout</p>
    <form id="co" class="form"><label class="f">${pick?'Your name':'Who it&#39;s for'}<input required name="to" autocomplete="name"></label>
    ${pick?'':`<label class="f">Their address<input required name="addr" autocomplete="street-address"></label>`}
    <label class="f">Your email, for the photo before it leaves<input required type="email" name="email" autocomplete="email"></label>
    <p class="muted" style="margin:0;font-size:13px">dear stem is a concept shop. Nothing is charged and nothing you type here is sent anywhere.</p>
    <button class="btn" type="submit">Place order</button></form>` }
  function done(){ return `${close}${guide('Thank you. I&#39;ll send you a photo of the real bouquet before it leaves the shop.')}<p class="ct" style="font-size:44px">It&#39;s on its way</p>
    <p style="margin:0">${whenLine()}.</p><button class="btn ghost" data-close>Back to the shop</button>` }

  const Z={door:()=>whenWhere(false),counter:()=>ask(AC.who?1:1),cooler,shelf,wrap,cafe,bag:bagView};

  // ---------- one click handler for every screen ----------
  panelIn.addEventListener('click',e=>{ const t=e.target.closest('button,a'); if(!t) return; const d=t.dataset;
    if(d.ac&&d.v==='other'){ AC[d.ac]='other'; show(ask({who:1,occ:2,feel:3}[d.ac])); const i=panelIn.querySelector('#otherT'); if(i) i.focus(); return }
    if(d.other){ const i=panelIn.querySelector('#otherT'), v=(i&&i.value||'').trim(); if(!v){ i&&i.focus(); return } AC[d.other+'T']=v; if(d.other==='who'&&guess('who',v)==='grieving') AC.occ='sympathy'; show(ask({who:2,occ:3,feel:4}[d.other])); return }
    if(d.ac){ AC[d.ac]=d.v; if(d.ac==='who'&&d.v==='grieving') AC.occ='sympathy'; show(ask({who:2,occ:3,feel:4}[d.ac])); return }
    if(d.ask){ show(ask(+d.ask)); return }
    if(d.results!==undefined){ show(results()); return }
    if(d.zone){ show(Z[d.zone]()); return }
    if(d.prod){ P=null; show(product(d.prod,d.size)); return }
    if(d.sizeSet){ P.size=d.sizeSet; if(P.vase&&!fits(VASES.find(v=>v.id===P.vase),SIZES[P.size].h)) P.vase=null; keepCard(); show(product(P.b.id)); return }
    if(d.backup){ P.backup=d.backup; keepCard(); show(product(P.b.id)); return }
    if(d.vase){ P.vase=P.vase===d.vase?null:d.vase; keepCard(); show(product(P.b.id)); return }
    if(d.start!==undefined){ const ta=panelIn.querySelector('#cardT,#card'); if(ta) ta.value=t.textContent; return }
    if(d.addp!==undefined){ keepCard(); const b=P.b, s=SIZES[P.size];
      bag.push({name:b.name,detail:`${s.name}, ${s.stems} stems, ${s.h} cm${P.card?' · card':''}${P.backup==='ask'?' · text me first':''}${P.note?' · note: '+P.note:''}`,price:priceOf(b,P.size),img:b.img});
      if(P.vase){ const v=VASES.find(x=>x.id===P.vase); bag.push({name:v.name,detail:`${v.h} cm`,price:v.price,img:v.img}) }
      updBag(); show(bagView()); return }
    if(d.addv){ const v=VASES.find(x=>x.id===d.addv); bag.push({name:v.name,detail:`${v.h} cm`,price:v.price,img:v.img}); updBag(); t.textContent='Added'; return }
    if(d.rm){ bag.splice(+d.rm,1); updBag(); show(bagView()); return }
    if(d.checkout!==undefined){ if(!S.set){ show(whenWhere(false)); return } show(checkout()); return }
    if(d.bag!==undefined){ show(bagView()); return }
  });
  panelIn.addEventListener('input',e=>{ if(e.target.id==='budget'){ AC.budget=+e.target.value; panelIn.querySelector('#bOut').textContent=money(AC.budget); panelIn.querySelector('#bHint').textContent=sizeFor(AC.budget) } });
  panelIn.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='otherT'){ e.preventDefault(); const b=panelIn.querySelector('[data-other]'); if(b) b.click() } });
  panelIn.addEventListener('submit',e=>{ if(e.target.id==='co'){ e.preventDefault(); bag.splice(0); updBag(); show(done()) } });
  function keepCard(){ const ta=panelIn.querySelector('#cardT'), nt=panelIn.querySelector('#noteT'); if(ta&&P) P.card=ta.value; if(nt&&P) P.note=nt.value.trim() }
  // items added in the builder page arrive through the same bag
  return {Z, whenWhere, bagView};
}
