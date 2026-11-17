// Sitemap dinámico de JIMPORT. Replica la lógica de visibilidad del catálogo público.
// No usa service_role: solo la clave publishable/anon de la tienda.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jzthabpvevvustttlreb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_i90Ns7-JD-iNInfajvHy8Q_3_TzOMUK';
const SITE_URL = 'https://jimport-web.vercel.app';

function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function readProducts(select) {
  const products = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 50000; offset += pageSize) {
    const endpoint = new URL('/rest/v1/products', SUPABASE_URL);
    endpoint.searchParams.set('select', select);
    // La visibilidad se filtra en JavaScript, igual que en app.js.
    // Así no dependemos de que PostgREST admita filtros sobre columnas opcionales.
    const response = await fetch(endpoint.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        // La clave sb_publishable_* no es un JWT. No debe enviarse como Bearer.
        // Para lectura pública usamos únicamente la cabecera apikey.
        Range: `${offset}-${offset + pageSize - 1}`,
        'Range-Unit': 'items'
      }
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(`Supabase respondió ${response.status}: ${detail.slice(0, 500)}`);
      error.status = response.status;
      throw error;
    }
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Supabase no devolvió una lista de productos.');
    products.push(...batch);
    if (batch.length < pageSize) break;
  }
  return products;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method Not Allowed');
  }
  try {
    let products;
    try {
      // Caso normal: conserva la exclusión de productos explícitamente inactivos.
      products = await readProducts('id,active');
    } catch (firstError) {
      // Compatibilidad con catálogos antiguos donde la columna active no existe.
      // Si el problema es RLS/credenciales, el segundo intento también fallará.
      if (/active|column|schema cache|42703|PGRST/i.test(firstError.message)) {
        products = await readProducts('id');
      } else {
        throw firstError;
      }
    }

    const uniqueIds = [...new Set(products
      .filter(item => item && item.active !== false)
      .map(item => String(item.id || '').trim())
      .filter(Boolean))];

    const urls = [
      `  <url><loc>${xmlEscape(SITE_URL + '/')}</loc></url>`,
      ...uniqueIds.map(id => `  <url><loc>${xmlEscape(`${SITE_URL}/?producto=${encodeURIComponent(id)}`)}</loc></url>`)
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(xml);
  } catch (error) {
    console.error('JIMPORT sitemap error:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send('No se pudo generar el sitemap. Revisa los registros de la función en Vercel y los permisos públicos SELECT de la tabla products en Supabase.');
  }
};
