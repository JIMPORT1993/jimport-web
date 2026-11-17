// Sitemap dinámico de JIMPORT. Publica únicamente productos activos
// que tienen una ficha accesible mediante ?producto=ID.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jzthabpvevvustttlreb.supabase.co';
// Clave publishable/anon ya utilizada por la tienda en el navegador.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_i90Ns7-JD-jNInfajvHy8Q_3_TzOMUK';
const SITE_URL = 'https://jimport-web.vercel.app';

function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method Not Allowed');
  }
  try {
    const products = [];
    const pageSize = 1000;
    for (let offset = 0; offset < 50000; offset += pageSize) {
      const endpoint = new URL('/rest/v1/products', SUPABASE_URL);
      endpoint.searchParams.set('select', 'id,active');
      endpoint.searchParams.set('or', '(active.eq.true,active.is.null)');
      endpoint.searchParams.set('order', 'created_at.desc');
      const response = await fetch(endpoint.toString(), {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${offset}-${offset + pageSize - 1}`,
          'Range-Unit': 'items'
        }
      });
      if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
      const batch = await response.json();
      products.push(...(Array.isArray(batch) ? batch : []));
      if (!Array.isArray(batch) || batch.length < pageSize) break;
    }

    const uniqueIds = [...new Set(products.map(item => String(item.id || '').trim()).filter(Boolean))];
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
    return res.status(500).send('No se pudo generar el sitemap de JIMPORT. Revisa la conexión pública de lectura de Supabase.');
  }
};
