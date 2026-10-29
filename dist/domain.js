export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s\-–—×]/g, '');
export const positiveInteger = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 999999;
export const requestedUnit = presentation => presentation.startsWith('Caja') ? 'caja(s)' : presentation.startsWith('Paquete') ? 'paquete(s)' : 'presentación(es) a confirmar';
export function filterProducts(products, filters) {
  return products.filter(p => (!filters.category || p.category === filters.category) && (!filters.brand || (p.brand || 'Sin marca identificada') === filters.brand) && (!filters.option || p.variants.some(v => v.label === filters.option || v.presentations.includes(filters.option))) && (!filters.query || normalize([p.name,p.description,p.brand,p.id,p.notes,...p.variants.flatMap(v=>[v.code,v.label,...v.presentations,...Object.values(v.specs)])].join(' ')).includes(normalize(filters.query)))).sort((a,b)=>filters.sort==='za'?b.name.localeCompare(a.name,'es'):a.name.localeCompare(b.name,'es'));
}
export function resolveLine(products,line) {
  const p=products.find(p=>p.id===line.productId);const variant=p?.variants.find(v=>v.id===line.variantId);
  if(!p || !variant || !variant.presentations.includes(line.presentation) || !positiveInteger(line.quantity)) return null;
  return { ...line, product:p, variant, quantity:Number(line.quantity) };
}
export function orderMessage(products,cart,customer={}) {
  const lines=cart.map(l=>resolveLine(products,l)).filter(Boolean);
  return 'Hola, quisiera solicitar cotización y disponibilidad para este pedido:\n\n'+lines.map((l,i)=>`${i+1}. ${l.product.name} — Código: ${l.variant.code || 'No indicado en el catálogo'}\nVariante: ${l.variant.label}\nPresentación solicitada: ${l.presentation}\nCantidad: ${l.quantity} ${requestedUnit(l.presentation)}${l.variant.consult?'\nCombinación de modelo y longitud a confirmar.':''}`).join('\n\n')+'\n\n'+[['name','Nombre'],['institution','Institución / empresa'],['city','Localidad'],['notes','Observaciones']].filter(([key])=>customer[key]?.trim()).map(([key,label])=>`${label}: ${customer[key].trim()}\n`).join('')+'\nPresentaciones y modalidad de venta a confirmar.\n¿Podrían confirmarme el importe y las opciones de entrega?';
}
