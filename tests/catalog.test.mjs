import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalize,positiveInteger,filterProducts,resolveLine,orderMessage} from '../dist/domain.js';
const products=JSON.parse(fs.readFileSync('dist/catalog.json','utf8'));
test('cobertura de códigos de las nueve páginas de productos, IDs y fotos',()=>{
 const codes=products.flatMap(p=>p.variants.map(v=>v.code));
 const required=['F-2000 A','F-2000 B','F-2002','F-2005','F-2001','F-2000 R','F-225','F-2007','F-2000 T','F-350','LY 9','LY 10','LY 11','LY 30','LY 31','LY 33','LY 35','LY 29','LY 29 P','LY 30 P','LY 31 P','LY 32','LY 32 P','LY 33 P','LY 41','LY 42','LY 43','LY 44','LY 27','LY 27 P','LY 27 N','V-109','V-107','KFT 95','KFT 63','K-227','K-225'];
 for(let n=92;n<=99;n++)required.push('LY '+n,'LY '+n+' F');
 required.forEach(c=>assert.ok(codes.includes(c),c));
 assert.equal(products.length,40);assert.equal(new Set(products.map(p=>p.id)).size,40);
 const variants=products.flatMap(p=>p.variants);assert.equal(new Set(variants.map(v=>v.id)).size,variants.length);
 for(const p of products){assert.ok(p.sourcePage>=4&&p.sourcePage<=11);assert.ok(fs.existsSync('dist'+p.image));for(const v of p.variants)assert.ok(v.presentations.length);}
 assert.equal(products.find(p=>p.id==='cuna').variants.length,3);
 assert.equal(products.find(p=>p.id==='rectal').variants.length,8);
 assert.equal(products.find(p=>p.id==='nelaton').variants.length,16);
 for(const id of ['campo','latex','toracico'])assert.equal(products.find(p=>p.id===id).brand,null);
});
test('búsqueda tolerante y filtros combinados',()=>{
 const base={query:'f 2000 - a',category:'Bolsas colectoras de orina',brand:'Marior / HF Forlano'};
 assert.equal(filterProducts(products,base)[0]?.id,'f2000a');
 assert.equal(filterProducts(products,{query:'BIOPSÍA',brand:'Marior / HF Forlano'}).length,4);
 assert.equal(filterProducts(products,{query:'ly92f',brand:'Lymed',category:'Sondas'})[0]?.id,'nelaton');
 assert.equal(filterProducts(products,{...base,brand:'Kit Medical'}).length,0);
 assert.equal(filterProducts(products,{query:'sonda',option:'LY 41 · 0,20 m'})[0]?.id,'rectal');
});
test('variantes con código compartido y presentaciones conservan líneas distintas',()=>{
 const p=products.find(p=>p.id==='rectal');
 const lines=p.variants.slice(0,2).map(v=>({productId:p.id,variantId:v.id,presentation:v.presentations[0],quantity:2}));
 assert.equal(lines[0].productId,lines[1].productId);assert.notEqual(lines[0].variantId,lines[1].variantId);
 const msg=orderMessage(products,JSON.parse(JSON.stringify(lines)),{name:'José & Ana',city:'Morón',notes:''});
 assert.match(msg,/0,20 m/);assert.match(msg,/0,45 m/);assert.match(msg,/José & Ana/);assert.doesNotMatch(msg,/Observaciones:/);assert.doesNotMatch(msg,/Institución \/ empresa:/);
 assert.equal(decodeURIComponent(encodeURIComponent(msg)),msg);
 assert.equal(msg.match(/Código: LY 41/g).length,2);
});
test('cantidades válidas y rechazo de datos de carrito dañados',()=>{
 for(const x of [0,-1,1.5,'abc',Infinity,1000000])assert.equal(positiveInteger(x),false);
 for(const x of [1,999999,'3'])assert.equal(positiveInteger(x),true);
 assert.equal(resolveLine(products,{productId:'inexistente',quantity:1}),null);
 assert.equal(resolveLine(products,{productId:'rectal',variantId:'rectal-1',presentation:'Caja inventada',quantity:1}),null);
});
test('pedido extenso conserva todos los productos y PDF original disponible',()=>{
 const cart=products.flatMap(p=>p.variants.map(v=>({productId:p.id,variantId:v.id,presentation:v.presentations[0],quantity:1})));
 const text=orderMessage(products,cart,{});assert.match(text,/85\./);assert.ok(encodeURIComponent(text).length>7000);
 assert.equal(fs.readFileSync('dist/assets/catalogo-2026.pdf').subarray(0,4).toString(),'%PDF');
});
