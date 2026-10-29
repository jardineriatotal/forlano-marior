import fs from 'node:fs';
import path from 'node:path';
import {CONFIG} from './dist/config.js';
const products=JSON.parse(fs.readFileSync('dist/catalog.json','utf8'));
const template=fs.readFileSync('src/index.html','utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c');
function page(url,title,desc,body,schema){
 let html=template.replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(desc)}">`).replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${esc(title)}">`).replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${esc(desc)}">`);
 html=html.replace('</head>',`<link rel="canonical" href="${CONFIG.origin+url}"><meta property="og:url" content="${CONFIG.origin+url}"><script type="application/ld+json">${json(schema)}</script></head>`);
 html=html.replace('<div class="loading container">Cargando catálogo…</div>',body);
 if(url==='/')html=html.replace('<body>','<body class="home-page">');
 const dir=path.join('dist',url);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
}
const org={'@context':'https://schema.org','@type':'Organization',name:'Bio-Descartables Marior S.R.L. / HF Forlano',foundingDate:'1970',url:CONFIG.origin,telephone:'+54 11 4692-0079',email:'ventas@forlano-marior.com.ar',address:{'@type':'PostalAddress',streetAddress:'Gervasio Pavón 4251',addressLocality:'Castelar',addressRegion:'Buenos Aires',addressCountry:'AR'}};
const homeBody=template.match(/<template id="home-template">([\s\S]*?)<\/template>/)[1];
page('/','Marior / HF Forlano — Productos médicos desde 1970','Fabricación, distribución y logística de productos médicos y domiciliarios desde 1970. Explorá el catálogo 2026 y armá tu pedido por WhatsApp.',homeBody,org);
page('/tienda','Catálogo 2026 | Marior / HF Forlano','Explorá todas las familias y variantes del catálogo 2026. Bolsas colectoras, sondas, cirugía, cuidados y accesorios médicos. Pedidos por WhatsApp.',`<div class="container section"><h1>Catálogo online 2026</h1><p>Productos médicos y domiciliarios. Consultá cotización y disponibilidad por WhatsApp.</p>${products.map(p=>`<p><a href="/productos/${p.id}">${esc(p.name)}</a></p>`).join('')}</div>`,org);
for(const p of products){
 const body=`<article class="container section"><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p><img src="${p.image}" alt="${esc(p.name)}" width="400" height="400"><p>${esc(p.brand||'')} · ${esc(p.category)}</p>${p.variants.map(v=>`<h2>${esc(v.label)}</h2><p>Código: ${esc(v.code||'No indicado')}</p><dl>${Object.entries(v.specs).map(([k,val])=>`<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join('')}</dl><p>${v.presentations.map(esc).join(' / ')}</p>`).join('')}<a href="/tienda">Volver al catálogo</a></article>`;
 page('/productos/'+p.id,p.name+' | Marior / HF Forlano',p.description,body,{'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,image:CONFIG.origin+p.image,category:p.category,...(p.brand?{brand:{'@type':'Brand',name:p.brand}}:{}),...(p.variants.length===1&&p.variants[0].code?{sku:p.variants[0].code}:{})});
}
const urls=['/','/tienda',...products.map(p=>'/productos/'+p.id)];
fs.writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${CONFIG.origin+u}</loc></url>`).join('')+'</urlset>');
fs.writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${CONFIG.origin}/sitemap.xml\n`);
console.log(`Generadas ${urls.length} rutas estáticas. Catálogo: ${products.length} familias / ${products.reduce((n,p)=>n+p.variants.length,0)} variantes.`);
