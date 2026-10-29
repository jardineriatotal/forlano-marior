import { CONFIG } from '/config.js';
import { normalize, positiveInteger, requestedUnit, filterProducts, resolveLine, orderMessage } from '/domain.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeRead = (key,fallback) => { try {return JSON.parse(localStorage.getItem(key)) || fallback;} catch {return fallback;} };
const safeWrite = (key,value) => {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
let products=[];let cart=[];let customer={};let selectedProduct=null;let toastTimer;
const wa = text => `https://wa.me/${CONFIG.whatsapp}${text?'?text='+encodeURIComponent(text):''}`;
const categories=[
 ['Bolsas colectoras de orina','f2000a'],['Cirugía y biopsia','biopsiagrande'],['Cuidados y rehabilitación','almohada'],['Protección descartable','barbijo'],['Bolsas de óbito','obitoadulto'],['Sondas','intubacion'],['Irrigación y accesorios médicos','v109']
];
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function saveCart(){const saved=safeWrite(CONFIG.cartKey,cart);updateCount();if(!saved)toast('El pedido se conserva en esta visita; el navegador no permite guardarlo al recargar.');}
function updateCount(){$('#cart-count').textContent=cart.reduce((n,l)=>n+Number(l.quantity),0);$$('.cart-trigger').forEach(b=>b.setAttribute('aria-label',`Abrir mi pedido: ${cart.length} ${cart.length===1?'producto':'productos'}`));}
function productURL(p){return '/productos/'+p.id+(location.pathname.startsWith('/tienda')?'?desde='+encodeURIComponent('/tienda'+location.search):'');}
function productCard(p){
 const variants=p.variants;const code=variants.length>1?`${variants.length} variantes`:variants[0].code||variants[0].label;
 const choose=variants.length>1||variants[0].presentations.length>1;
 return `<article class="product-card"><a class="product-image" href="${esc(productURL(p))}" aria-label="Ver ${esc(p.name)}"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="300" height="280"></a><div class="product-body"><span class="brand-label">${esc(p.brand||'Catálogo 2026 · Novedad')}</span><h3><a href="${esc(productURL(p))}">${esc(p.name)}</a></h3><div class="product-code">${esc(code)}</div><p class="product-description">${esc(p.description)}</p><div class="price-inquiry">Consultar precio</div><div class="product-links"><a href="${esc(productURL(p))}">Ver producto ↗</a>${choose?`<a href="${esc(productURL(p))}" class="choose-options">Elegir opciones +</a>`:`<button type="button" data-quick-add="${p.id}">Agregar al pedido +</button>`}</div></div></article>`;
}
function bindQuickAdds(root=document){$$('[data-quick-add]',root).forEach(b=>b.addEventListener('click',()=>{const p=products.find(x=>x.id===b.dataset.quickAdd);addLine(p,p.variants[0],p.variants[0].presentations[0],1);}));}
function home(){
 $('#main').innerHTML=$('#home-template').innerHTML;
 $('#home-categories').innerHTML=categories.map(([name,id])=>`<a class="category-card" href="/tienda?categoria=${encodeURIComponent(name)}"><div class="category-photo"><img src="/assets/${id}.webp" alt="${esc(name)}" loading="lazy" width="300" height="180"></div><h3>${esc(name)} <span>↗</span></h3></a>`).join('')+'<a class="category-card all-categories" href="/tienda"><small>CATÁLOGO 2026</small><h3>Todo para<br>cada cuidado.</h3><b>→</b></a>';
 $('#featured').innerHTML=['f2000a','biopsiapremium','intubacion','v109'].map(id=>productCard(products.find(x=>x.id===id))).join('');
 const clients=[['omint','Omint'],['britanico','Hospital Británico'],['fleni','Fleni'],['materdei','Sanatorio Mater Dei'],['otamendi','Sanatorio Otamendi'],['galeno','Galeno'],['cemic','CEMIC'],['santacatalina','Santa Catalina'],['iadt','Instituto Argentino de Diagnóstico y Tratamiento'],['swiss','Swiss Medical']];
 $('#client-logos').innerHTML=clients.map(([id,name])=>`<img src="/assets/cliente-${id}.webp" alt="${name}" loading="lazy" width="200" height="70">`).join('');
 $('[data-nav=home]').classList.add('active');bindQuickAdds();bindWA();
 if(location.hash)requestAnimationFrame(()=>$(location.hash)?.scrollIntoView());
}
const readFilters=()=>{const s=new URLSearchParams(location.search);return {query:s.get('q')||'',category:s.get('categoria')||'',brand:s.get('marca')||'',option:s.get('opcion')||'',sort:s.get('orden')||'az'};};
function writeFilters(f){const s=new URLSearchParams();if(f.query)s.set('q',f.query);if(f.category)s.set('categoria',f.category);if(f.brand)s.set('marca',f.brand);if(f.option)s.set('opcion',f.option);if(f.sort==='za')s.set('orden','za');history.replaceState({},'','/tienda'+(s.size?'?'+s:''));}
function shop(){
 let f=readFilters();
 $('#main').innerHTML=`<section class="shop-intro"><div class="container"><div class="breadcrumb"><a href="/">Inicio</a><span>/</span><span>Catálogo online</span></div><div class="shop-title-row"><div><div class="eyebrow">CATÁLOGO 2026</div><h1>Productos para cada cuidado.</h1><p>Explorá nuestras líneas y armá tu pedido para solicitar una cotización.</p></div><a class="text-link" href="/assets/catalogo-2026.pdf" download>Descargar catálogo PDF ↓</a></div></div></section><div class="container shop-layout"><aside class="filters" id="filters" aria-label="Filtros del catálogo"></aside><section aria-label="Resultados del catálogo"><div class="shop-tools"><div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><input id="search" type="search" placeholder="Buscar por nombre, código o descripción…" aria-label="Buscar productos" value="${esc(f.query)}"><button id="clear-search" class="icon-button" aria-label="Borrar búsqueda">×</button></div><button class="mobile-filter" aria-controls="filters" aria-expanded="false">☷ Filtros</button><select id="sort" class="sort-select" aria-label="Orden de productos"><option value="az">Nombre: A a Z</option><option value="za">Nombre: Z a A</option></select></div><div class="active-filters" id="active-filters"></div><div class="result-row"><span id="result-count" role="status" aria-live="polite"></span><span>Precios a consultar</span></div><div id="shop-results"></div></section></div>`;
 $('#sort').value=f.sort;
 function renderFilters(){
 const brandNames=['Marior / HF Forlano','Lymed','Kit Medical','Sin marca identificada'];
 const baseProducts=products.filter(p=>(!f.category||p.category===f.category)&&(!f.brand||(p.brand||'Sin marca identificada')===f.brand));
 const options=[...new Set(baseProducts.flatMap(p=>p.variants.flatMap(v=>[...(v.label!=='Única'?[v.label]:[]),...v.presentations])))].sort((a,b)=>a.localeCompare(b,'es'));
 $('#filters').innerHTML=`<div class="filter-heading"><h2>Filtros</h2><button class="clear-button" id="clear-all">Limpiar filtros</button></div><fieldset class="filter-group"><legend>Categorías</legend>${[['','Todas las categorías'],...categories.map(([name])=>[name,name])].map(([val,label])=>`<label class="filter-radio"><input type="radio" name="category" value="${esc(val)}" ${f.category===val?'checked':''}>${esc(label)}</label>`).join('')}</fieldset><fieldset class="filter-group"><legend>Marca</legend>${[['','Todas las marcas'],...brandNames.map(x=>[x,x])].map(([val,label])=>`<label class="filter-radio"><input type="radio" name="brand" value="${esc(val)}" ${f.brand===val?'checked':''}>${esc(label)}</label>`).join('')}</fieldset><fieldset class="filter-group"><legend>Modelo, medida o presentación</legend><select id="option-filter" class="filter-select" aria-label="Modelo, medida o presentación"><option value="">Todas las opciones</option>${options.map(o=>`<option value="${esc(o)}" ${f.option===o?'selected':''}>${esc(o)}</option>`).join('')}</select></fieldset><p class="commerce-note">Las presentaciones del catálogo se solicitan a confirmar. Cotización y disponibilidad por WhatsApp.</p>`;
 $$('[name=category]').forEach(el=>el.addEventListener('change',()=>{f.category=el.value;f.option='';sync(true);}));
 $$('[name=brand]').forEach(el=>el.addEventListener('change',()=>{f.brand=el.value;f.option='';sync(true);}));
 $('#option-filter').addEventListener('change',e=>{f.option=e.target.value;sync();});$('#clear-all').addEventListener('click',clearAll);
 }
 function clearAll(){f={query:'',category:'',brand:'',option:'',sort:'az'};$('#search').value='';$('#sort').value='az';sync(true);}
 function sync(filters=false){
 writeFilters(f);if(filters)renderFilters();
 const result=filterProducts(products,f);$('#result-count').textContent=`${result.length} ${result.length===1?'familia de productos':'familias de productos'}${f.query?' para “'+f.query+'”':''}`;
 $('#active-filters').innerHTML=[['query',f.query],['category',f.category],['brand',f.brand],['option',f.option]].filter(([,val])=>val).map(([key,val])=>`<button class="chip" data-remove-filter="${key}" aria-label="Quitar filtro ${esc(val)}">${esc(val)} <span>×</span></button>`).join('');
 $$('[data-remove-filter]').forEach(b=>b.addEventListener('click',()=>{f[b.dataset.removeFilter]='';if(b.dataset.removeFilter==='query')$('#search').value='';sync(true);}));
 $('#shop-results').innerHTML=result.length?`<div class="product-grid shop-products">${result.map(productCard).join('')}</div>`:`<div class="empty-state"><h2>No encontramos esos productos</h2><p>Probá con otro nombre o código, o reiniciá los filtros.</p><button class="button" id="reset-results">Limpiar filtros</button></div>`;
 $('#reset-results')?.addEventListener('click',clearAll);bindQuickAdds($('#shop-results'));$('#clear-search').hidden=!f.query;
 }
 $('#search').addEventListener('input',e=>{f.query=e.target.value;sync();});
 $('#clear-search').addEventListener('click',()=>{f.query='';$('#search').value='';sync();$('#search').focus();});
 $('#sort').addEventListener('change',e=>{f.sort=e.target.value;sync();});
 $('.mobile-filter').addEventListener('click',e=>{const shown=$('#filters').classList.toggle('visible');e.currentTarget.setAttribute('aria-expanded',String(shown));if(shown)$('#filters').scrollIntoView({behavior:'smooth',block:'start'});});
 renderFilters();sync();
 window.addEventListener('popstate',()=>location.reload());
}
function productDetail(id){
 const p=products.find(p=>p.id===id);if(!p){$('#main').innerHTML='<div class="container section empty-state"><h1>Producto no encontrado</h1><p>Buscá el producto en nuestro catálogo.</p><a class="button" href="/tienda">Ver catálogo</a></div>';return;}
 selectedProduct=p;
 const from=new URLSearchParams(location.search).get('desde');const back=from&&/^\/tienda(?:\?|$)/.test(from)?from:'/tienda';
 const related=products.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,4);
 $('#main').innerHTML=`<div class="container product-page"><div class="breadcrumb"><a href="/">Inicio</a><span>/</span><a href="${esc(back)}">Tienda</a><span>/</span><a href="/tienda?categoria=${encodeURIComponent(p.category)}">${esc(p.category)}</a></div><div class="product-detail"><button class="detail-image" id="enlarge-photo" aria-label="Ampliar imagen de ${esc(p.name)}"><img src="${p.image}" alt="${esc(p.name)}" width="500" height="500"><span>⊕ Ampliar imagen</span></button><div class="detail-copy"><a class="detail-category" href="/tienda?categoria=${encodeURIComponent(p.category)}">${esc(p.category)}</a><h1>${esc(p.name)}</h1>${p.brand?`<a class="brand-label" href="/tienda?marca=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a>`:''}<p class="detail-description">${esc(p.description)}</p><div class="detail-code"><span>Código comercial</span><b id="variant-code"></b></div><form id="add-product" class="detail-controls"><label for="variant-select">${p.variants.length>1?'Elegí el modelo o la medida':'Modelo / medida'}</label><select id="variant-select" required>${p.variants.length>1?'<option value="" disabled selected>Seleccioná una variante</option>':''}${p.variants.map(v=>`<option value="${v.id}">${esc(v.label)}</option>`).join('')}</select><label for="presentation-select">Presentación solicitada</label><select id="presentation-select" required></select><div class="qty-add"><div><label for="product-quantity">Cantidad</label><input class="quantity-input" id="product-quantity" type="number" min="1" max="999999" step="1" value="1" required></div><button class="button" type="submit" id="add-product-button">Agregar al pedido <span>+</span></button></div><p class="commerce-note" id="quantity-unit"></p><p class="error-text" id="product-error" role="alert"></p></form><a class="button outline detail-wa" id="product-whatsapp" target="_blank" rel="noopener">Consultar este producto por WhatsApp ↗</a><p class="commerce-note">El precio, la disponibilidad y la entrega se coordinan por WhatsApp. La modalidad de venta y la presentación solicitada quedan sujetas a confirmación.</p>${p.notes?`<p class="detail-note">${esc(p.notes)}</p>`:''}</div></div><div class="spec-section"><div><h2>Especificaciones del producto</h2><table class="spec-table"><tbody id="specifications"></tbody></table><p class="spec-source">Fuente: <a class="text-link" href="/assets/catalogo-2026.pdf#page=${p.sourcePage}" target="_blank" rel="noopener">Catálogo original 2026, página ${p.sourcePage} ↗</a></p></div><div class="info-box"><h3>Atención que acompaña tu pedido</h3><p>Seleccioná la variante y la presentación que necesitás. Agregá la cantidad solicitada y enviá el resumen por WhatsApp para coordinar tu cotización.</p><a class="text-link" href="${esc(back)}">← Seguir explorando el catálogo</a></div></div>${related.length?`<section class="related"><div class="eyebrow">TAMBIÉN EN ESTA CATEGORÍA</div><h2>Productos relacionados</h2><div class="product-grid">${related.map(productCard).join('')}</div></section>`:''}</div>`;
 document.title=p.name+' | Marior / HF Forlano';
 function current(){return p.variants.find(v=>v.id===$('#variant-select').value);}
 function update(){
  const v=current();$('#variant-code').textContent=v?(v.code||'No indicado en el catálogo'):'Seleccioná una variante';
  $('#presentation-select').innerHTML=v?v.presentations.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''):'<option value="">Primero elegí una variante</option>';
  $('#presentation-select').disabled=!v;$('#add-product-button').disabled=!v;
  $('#specifications').innerHTML=Object.entries({...v?.specs,...(p.pm?{'Registro de producto':p.pm}:{}),...(v?{'Presentaciones del catálogo':v.presentations.join(' / ')}:{})}).map(([k,val])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(val)}</td></tr>`).join('') || '<tr><td>Seleccioná una variante para ver los datos disponibles.</td></tr>';
  $('#product-whatsapp').href=wa('Hola, quisiera consultar por '+p.name+(v?' — Código: '+(v.code||'no indicado')+'; variante: '+v.label+'; presentación solicitada: '+$('#presentation-select').value:'')+'.');
  updateUnit();
 }
 function updateUnit(){const pres=$('#presentation-select').value;$('#quantity-unit').textContent=pres?'Cantidad expresada en '+requestedUnit(pres)+'. Presentación solicitada a confirmar.':'';const v=current();if(v)$('#product-whatsapp').href=wa(`Hola, quisiera consultar por ${p.name} — Código: ${v.code||'no indicado'}; variante: ${v.label}; presentación solicitada: ${pres}.`);}
 $('#variant-select').addEventListener('change',update);$('#presentation-select').addEventListener('change',updateUnit);
 $('#add-product').addEventListener('submit',e=>{e.preventDefault();const v=current();const quantity=$('#product-quantity').value;$('#product-error').textContent='';if(!v||!positiveInteger(quantity)){$('#product-error').textContent='Seleccioná una variante y una cantidad entera positiva (hasta 999999).';return;}addLine(p,v,$('#presentation-select').value,Number(quantity));});
 $('#enlarge-photo').addEventListener('click',()=>{const img=$('#photo-dialog img');img.src=p.image;img.alt=p.name;$('#photo-dialog').showModal();});
 bindQuickAdds();update();
}
function addLine(p,v,presentation,quantity){
 const line={productId:p.id,variantId:v.id,presentation,quantity};if(!resolveLine(products,line))return;
 const existing=cart.find(l=>l.productId===p.id&&l.variantId===v.id&&l.presentation===presentation);
 if(existing){if(!positiveInteger(existing.quantity+quantity)){toast('La cantidad máxima por presentación es 999999.');return;}existing.quantity+=quantity;}else cart.push(line);
 saveCart();toast('Producto agregado a Mi pedido');
}
function openCart(){renderCart();$('#cart-dialog').showModal();}
function renderCart(){
 $('#cart-lines-count').textContent=`(${cart.length})`;
 if(!cart.length){$('#cart-content').innerHTML='<div class="cart-empty"><span>▧</span><h3>Tu pedido empieza acá</h3><p>Explorá el catálogo y agregá los productos<br>que necesitás cotizar.</p><a class="button" href="/tienda">Explorar catálogo →</a></div>';return;}
 $('#cart-content').innerHTML=cart.map((line,i)=>{
 const l=resolveLine(products,line);if(!l)return '';
 return `<article class="cart-item"><img src="${l.product.image}" alt="${esc(l.product.name)}"><div><h3>${esc(l.product.name)}</h3><p>Código: ${esc(l.variant.code||'No indicado')}<br>Variante: ${esc(l.variant.label)}<br>${esc(l.presentation)}</p><div class="cart-item-actions"><button data-decrease="${i}" aria-label="Restar cantidad de ${esc(l.product.name)}" ${l.quantity===1?'disabled':''}>−</button><input type="number" min="1" max="999999" step="1" value="${l.quantity}" data-line-quantity="${i}" aria-label="Cantidad de ${esc(l.product.name)}, ${esc(l.variant.label)}, ${esc(l.presentation)}"><button data-increase="${i}" aria-label="Sumar cantidad de ${esc(l.product.name)}">+</button><small>${requestedUnit(l.presentation)}</small><button class="remove" data-remove="${i}" aria-label="Eliminar ${esc(l.product.name)}, ${esc(l.variant.label)}">Eliminar</button></div></div></article>`;
 }).join('')+`<details class="customer-form" ${Object.values(customer).some(Boolean)?'open':''}><summary>Agregar datos de contacto (opcional)</summary><div class="customer-fields">${[['name','Nombre'],['institution','Institución / empresa'],['city','Localidad']].map(([key,label])=>`<label>${label}<input type="text" data-customer="${key}" value="${esc(customer[key]||'')}" maxlength="200" autocomplete="${key==='name'?'name':key==='institution'?'organization':'address-level2'}"></label>`).join('')}<label>Observaciones comerciales<textarea data-customer="notes" maxlength="15000" placeholder="Por ejemplo, conector, vías o longitud a consultar…">${esc(customer.notes||'')}</textarea></label></div></details><div class="cart-confirmation">El precio, la disponibilidad y la entrega se coordinan por WhatsApp.<br>Las presentaciones y la modalidad de venta se confirman al cotizar.</div><a id="send-order" class="button wide cart-send" target="_blank" rel="noopener">Enviar pedido por WhatsApp ↗</a><button class="copy-order" id="copy-order">Copiar resumen completo del pedido</button><div id="copy-fallback"></div><p class="cart-hint" id="long-order-note"></p><p class="cart-hint">Se abrirá WhatsApp con el texto preparado para que lo revises y lo envíes. Tu pedido seguirá guardado.</p>`;
 $$('[data-line-quantity]').forEach(el=>{
  const update=()=>{const i=Number(el.dataset.lineQuantity);if(!positiveInteger(el.value))return;cart[i].quantity=Number(el.value);saveCart();const minus=$(`[data-decrease="${i}"]`);if(minus)minus.disabled=cart[i].quantity===1;updateOrderLink();};
  el.addEventListener('input',update);
  el.addEventListener('change',()=>{if(!positiveInteger(el.value)){el.value=cart[Number(el.dataset.lineQuantity)].quantity;toast('Usá una cantidad entera positiva (hasta 999999).');return;}update();});
 });
 $$('[data-decrease]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.decrease);if(cart[i].quantity>1){cart[i].quantity--;saveCart();renderCart();}}));
 $$('[data-increase]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.increase);if(positiveInteger(cart[i].quantity+1)){cart[i].quantity++;saveCart();renderCart();}}));
 $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{cart.splice(Number(b.dataset.remove),1);saveCart();renderCart();}));
 $$('[data-customer]').forEach(el=>el.addEventListener('input',()=>{customer[el.dataset.customer]=el.value;safeWrite(CONFIG.customerKey,customer);updateOrderLink();}));
 $('#copy-order').addEventListener('click',copySummary);
 $('#send-order').addEventListener('click',e=>{if(wa(orderMessage(products,cart,customer)).length>7000){e.preventDefault();copySummary();toast('Pedido extenso: copiá el resumen completo y pegalo en WhatsApp.');}});
 updateOrderLink();
}
function updateOrderLink(){const msg=orderMessage(products,cart,customer);const url=wa(msg);$('#send-order').href=url.length>7000?wa():url;$('#long-order-note').textContent=url.length>7000?'Tu pedido es extenso. Copiá el resumen completo y abrí WhatsApp para pegarlo, sin perder productos.':'';if(url.length>7000)$('#long-order-note').innerHTML+=' <a class="text-link" href="'+wa()+'" target="_blank" rel="noopener">Abrir WhatsApp ↗</a>';}
async function copySummary(){const msg=orderMessage(products,cart,customer);try{await navigator.clipboard.writeText(msg);toast('Resumen completo copiado');}catch{$('#copy-fallback').innerHTML='<label class="commerce-note" for="manual-summary">Seleccioná y copiá este resumen completo:</label><textarea readonly id="manual-summary" class="copy-fallback"></textarea>';$('#manual-summary').value=msg;$('#manual-summary').focus();$('#manual-summary').select();}}
function bindWA(){$$('.wa-link').forEach(el=>{el.href=wa();el.target='_blank';el.rel='noopener';});}
function setupGlobal(){
 document.body.classList.toggle('home-page',location.pathname==='/'||location.pathname==='/index.html');
 $('#menu-toggle').addEventListener('click',()=>{const expanded=$('#navigation').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(expanded));$('#menu-toggle').setAttribute('aria-label',expanded?'Cerrar menú':'Abrir menú');});
 $$('#navigation a').forEach(a=>a.addEventListener('click',()=>{$('#navigation').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}));
 $$('.cart-trigger').forEach(b=>b.addEventListener('click',openCart));
 $$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
 $$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)d.close();}});d.addEventListener('close',()=>document.body.style.overflow='');d.addEventListener('cancel',()=>document.body.style.overflow='');});
 const observer=new MutationObserver(()=>{document.body.style.overflow=$('dialog[open]')?'hidden':'';});$$('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
 const updateHeader=()=>$('#header').classList.toggle('compact',scrollY>45);
 window.addEventListener('scroll',updateHeader,{passive:true});
 window.addEventListener('pageshow',updateHeader);
 updateHeader();
 bindWA();
}
async function init(){
 setupGlobal();
 try{const r=await fetch('/catalog.json');if(!r.ok)throw Error('catalog');products=await r.json();}catch{$('#main').innerHTML='<div class="container section empty-state"><h1>No pudimos cargar el catálogo</h1><p>Podés consultar el catálogo PDF o volver a intentar.</p><a class="button" href="/assets/catalogo-2026.pdf">Abrir catálogo PDF</a></div>';return;}
 const saved=safeRead(CONFIG.cartKey,[]);cart=Array.isArray(saved)?saved.filter(l=>resolveLine(products,l)).map(l=>({...l,quantity:Number(l.quantity)})):[];
 const savedCustomer=safeRead(CONFIG.customerKey,{});customer=savedCustomer&&typeof savedCustomer==='object'&&!Array.isArray(savedCustomer)?Object.fromEntries(Object.entries(savedCustomer).filter(([key,val])=>['name','institution','city','notes'].includes(key)&&typeof val==='string')):{};
 updateCount();
 const path=decodeURIComponent(location.pathname).replace(/\/$/,'');
 if(path==='/tienda')shop();else if(path.startsWith('/productos/'))productDetail(path.split('/').pop());else home();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-visible');observer.unobserve(entry.target);}}),{threshold:0.08});$$('.section').forEach(section=>{if(section.getBoundingClientRect().top>innerHeight){section.classList.add('reveal');observer.observe(section);}});}
}
init();
