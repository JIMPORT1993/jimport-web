// Vercel serverless function: Gemini API key is stored only in Vercel Environment Variables.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
  const p = req.body?.product;
  if (!p || typeof p !== 'object' || !String(p.name || '').trim()) return res.status(400).json({ error: 'Datos de producto incompletos.' });
  const clean = value => typeof value === 'string' ? value.slice(0, 2500) : (value == null ? '' : JSON.stringify(value).slice(0, 2500));
  const product = {
    name: clean(p.name), brand: clean(p.brand), model: clean(p.model), category: clean(p.category),
    sku: clean(p.sku), description: clean(p.description), specifications: clean(p.specifications), features: clean(p.features)
  };
  const prompt = `Eres el asesor técnico y comercial de JIMPORT, una tienda ecuatoriana de accesorios electrónicos premium. Redacta en español ecuatoriano claro, profesional y atractivo. Usa SOLO la información suministrada. No inventes potencia, puertos, compatibilidades, certificaciones, materiales, medidas, autonomía ni funciones. Si un dato no consta, no lo afirmes. Distingue claramente características confirmadas de recomendaciones generales. Evita exageraciones y no menciones precios. Devuelve únicamente JSON válido con las claves: description (párrafo de 80 a 140 palabras), features (lista de hasta 6 características confirmadas), compatibility (lista de compatibilidades solo si están indicadas; si no, lista vacía), use_cases (hasta 4 usos razonables sin atribuir especificaciones no confirmadas), caution (una nota breve para confirmar compatibilidad si faltan datos, o cadena vacía). Producto: ${JSON.stringify(product)}`;
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, responseMimeType: 'application/json', maxOutputTokens: 900 } })
    });
    const data = await response.json();
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: response.status === 429 ? 'Se alcanzó temporalmente el límite gratuito de la IA. La ficha básica sigue funcionando; inténtalo más tarde.' : 'El proveedor de IA no respondió correctamente.' });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('') || '';
    let result;
    try { result = JSON.parse(text); } catch { return res.status(502).json({ error: 'La IA devolvió un formato no válido. Inténtalo nuevamente.' }); }
    if (!result.description || typeof result.description !== 'string') return res.status(502).json({ error: 'La IA no generó una descripción válida.' });
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(502).json({ error: 'No fue posible conectar con el servicio de IA.' });
  }
}
