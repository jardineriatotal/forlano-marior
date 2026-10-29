# Marior / HF Forlano · Web y catálogo 2026

Sitio estático sin dependencias de ejecución. Compatible con Vercel y alojamiento estático. Incluye 40 familias, 85 variantes y 42 rutas HTML.

## Ejecutar

Con Node.js 20 o superior:

```sh
npm run build
npm test
npm run dev
```

Abrir http://127.0.0.1:4173. Para Vercel, importar esta carpeta; `vercel.json` configura el comando de construcción y la carpeta `dist`.

## Editar

- `dist/catalog.json`: fuente estructurada de productos, variantes, presentaciones, especificaciones y página original. `sourcePage` identifica la página del PDF; los IDs de variantes son distintos de los códigos comerciales.
- `dist/config.js`: WhatsApp, origen para SEO y claves de almacenamiento.
- `src/index.html`: estructura de portada, navegación y contenido institucional. Ejecutar `npm run build` después de editarla.
- `dist/app.js`: navegación, tienda, filtros, fichas y pedido.
- `dist/domain.js`: búsqueda, validación y resumen comercial.
- `dist/style.css`: diseño responsive y accesibilidad.
- `dist/assets`: imágenes WebP optimizadas, logos, hero proporcionado por el usuario (con versión móvil) y PDF original.
- `build.mjs`: HTML por ruta, metadatos, datos estructurados, sitemap y robots.

El pedido se guarda en localStorage del navegador del visitante; se valida al restaurarlo. Cada combinación de ID de variante y presentación ocupa una línea diferente. La cantidad se expresa en cajas, paquetes o presentaciones a confirmar. Los datos opcionales se guardan localmente. El sitio prepara el enlace; el visitante revisa y envía el mensaje en WhatsApp. Abrirlo no borra el pedido.

Los enlaces de más de 7000 caracteres ofrecen copiar el resumen completo y abrir WhatsApp para pegarlo. No se implementaron pagos, cuentas, precios ni stock.

## Fuente y datos pendientes

Se revisaron las 12 páginas de `Catálogo 2026 forlano marior.pdf`. Las páginas están rasterizadas; se transcribieron visualmente las tablas. Los datos de producto provienen de las páginas 4 a 11. Las fotos de productos y los logos son recortes del PDF, nunca páginas completas. El hero utiliza la imagen nueva proporcionada por el usuario, con un archivo específico para celular.

Las otras 55 imágenes se optimizaron de 483.712 a 250.884 bytes en conjunto (48 % menos). El hero original de 2.114.321 bytes se sirve como WebP de 47.430 bytes en escritorio y 38.554 bytes en celular. Se conservaron las proporciones de los productos y logos. El catálogo PDF original conserva su archivo.

- Biopsia: el encabezado no identifica un código comercial inequívoco para cada tamaño. Se pide por nombre/medida; PM949-10 se registra por separado. No se asignó el código visible en la fotografía a todas las variantes.
- Sondas rectales, Nelaton y oxígeno: no se indican presentaciones de venta en sus bloques; quedan a confirmar. Las medidas/longitudes no documentadas no se dedujeron.
- KFT 95 y KFT 63: 2 y 3 m tienen tablas propias. Las otras longitudes se enumeran como opciones generales de la familia y se consultan sin crear combinaciones por modelo. En las filas de 3 m no se repiten dimensiones de caja no explicitadas.
- V-109 / V-107: conectores externo/interno y 1/2/4 vías aparecen a nivel de familia, sin correspondencia completa entre modelos. Se solicita detalle en observaciones y confirmación.
- Novedades (campo quirúrgico, látex, K-227/K-225): marca, medidas, presentaciones y otros datos no identificados se dejan a confirmar.
- Óbito pediátrica/neonatal: medidas y micronaje documentados; presentación y embalaje a confirmar.
- La modalidad de venta de todas las presentaciones queda sujeta a confirmación comercial; no se deduce venta por unidad.
- No faltan fotografías de familias: se extrajeron todas las imágenes requeridas. La resolución y el color corresponden al material recibido; se recomienda reemplazar por originales de mayor resolución cuando estén disponibles.
- La imagen del hero fue proporcionada por el usuario después de la primera entrega. La otra imagen institucional proviene del PDF. La web anterior devolvió un error al consultarla.

## Verificación

`npm test` cubre códigos requeridos, IDs únicos, fotos, variantes con código compartido, normalización de búsqueda, filtros combinados, cantidades positivas, restauración de líneas, mensaje y casos extensos. El recorrido de navegación, selección, carrito, edición y recarga se comprobó en navegador, junto con vistas de escritorio y celular. El detalle de la entrega acompaña la web.
