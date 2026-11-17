# JIMPORT — Sitemap dinámico y fichas de producto para Google

## Qué se modificó
- El sitemap se genera desde `api/sitemap.js` consultando los productos activos de Supabase.
- `vercel.json` dirige `/sitemap.xml` al endpoint dinámico.
- Cada producto publicado tiene una URL propia compartible: `https://jimport-web.vercel.app/?producto=ID`.
- Al abrir una ficha, la tienda actualiza el título, la descripción, la URL canónica y los datos estructurados `Product`.
- Si se abre directamente una URL de producto, la ficha se muestra después de cargar el catálogo.
- Se conserva `robots.txt` y su referencia al sitemap.

## Publicación
1. Descomprime el ZIP.
2. Sube el contenido de la carpeta `jimport-web-main` al repositorio GitHub conectado con Vercel, reemplazando los archivos correspondientes.
3. No borres `config.js`, no cambies las credenciales actuales y no ejecutes SQL: esta actualización no requiere migraciones.
4. Espera a que Vercel termine el despliegue.
5. Abre `https://jimport-web.vercel.app/sitemap.xml`. Debe mostrar la portada y las URLs de los productos activos.
6. Abre una URL de producto del sitemap. Debe cargar la tienda y abrir directamente su ficha.
7. En Google Search Console, entra en **Sitemaps**. Si el sitemap anterior aparece registrado, no hace falta borrarlo: vuelve a enviarlo como `sitemap.xml` para que Google lea la versión nueva.

## Importante
- El endpoint usa la clave publishable/anon que ya está expuesta en el frontend y las políticas públicas de lectura de la tabla `products`. Nunca se usa una clave `service_role`.
- El endpoint lista productos con `active=true` o `active` vacío, igual que la tienda, y excluye `active=false`.
- Si Supabase no permite lectura pública de esos registros o el campo `active` tiene otra configuración, Vercel devolverá un error y habrá que revisar las políticas de lectura; no se deben abrir permisos de escritura.
- Google puede tardar días o semanas en rastrear e indexar las URLs. Enviar el sitemap no garantiza la indexación.
