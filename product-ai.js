// JIMPORT - Gemini API proxy for Vercel
// Keep GEMINI_API_KEY only in Vercel Environment Variables.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      code: 'MISSING_API_KEY',
      error: 'Vercel no encuentra GEMINI_API_KEY. Revisa el nombre de la variable y vuelve a publicar (Redeploy).'
    });
  }

  const p = req.body?.product;
  if (!p || typeof p !== 'object' || !String(p.name || '').trim()) {
    return res.status(400).json({ code: 'INVALID_PRODUCT', error: 'Faltan los datos básicos del producto.' });
  }

  const clean = value => {
    if (typeof value === 'string') return value.slice(0, 1800);
    if (value == null) return '';
    try { return JSON.stringify(value).slice(0, 1800); } catch { return ''; }
  };

  const product = {
    name: clean(p.name), brand: clean(p.brand), model: clean(p.model),
    category: clean(p.category), sku: clean(p.sku),
    description: clean(p.description), specifications: clean(p.specifications),
    features: clean(p.features)
  };

  const prompt = `Eres el asesor técnico y comercial de JIMPORT, una tienda ecuatoriana de accesorios electrónicos premium. Redacta en español claro, profesional y atractivo. Usa SOLO los datos suministrados: no inventes potencia, puertos, compatibilidades, certificaciones, materiales, medidas, autonomía ni funciones. Si falta un dato, no lo afirmes. No menciones precios. Devuelve únicamente un objeto JSON con estas claves: description (párrafo comercial de 80 a 130 palabras), features (lista de hasta 6 características confirmadas), compatibility (lista de compatibilidades solo si están indicadas; si no, lista vacía), use_cases (hasta 4 usos razonables sin atribuir especificaciones no confirmadas), caution (nota breve para confirmar compatibilidad si faltan datos, o cadena vacía). Datos del producto: ${JSON.stringify(product)}`;

  let response;
  let data;
  try {
    response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' + encodeURIComponent(apiKey.trim()),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.25, responseMimeType: 'application/json', maxOutputTokens: 1100 }
        }),
        signal: AbortSignal.timeout(25000)
      }
    );
    data = await response.json().catch(() => ({}));
  } catch (error) {
    console.error('[JIMPORT IA] Error de conexión:', error?.name || 'fetch_error');
    return res.status(502).json({ code: 'PROVIDER_CONNECTION', error: 'Vercel no pudo conectarse con Gemini. Revisa el estado del servicio e inténtalo nuevamente.' });
  }

  if (!response.ok) {
    const googleMessage = String(data?.error?.message || 'Sin detalle del proveedor').slice(0, 500);
    const googleStatus = String(data?.error?.status || 'UNKNOWN');
    console.error('[JIMPORT IA] Gemini respondió', response.status, googleStatus, googleMessage);

    if (response.status === 400 && /FAILED_PRECONDITION|location|region|country|free tier/i.test(googleStatus + ' ' + googleMessage)) {
      return res.status(503).json({ code: 'FREE_TIER_REGION', error: 'Google indica que el nivel gratuito de Gemini no está habilitado para este proyecto o región. Revisa la disponibilidad del nivel gratuito en Google AI Studio.' });
    }
    if (response.status === 400) {
      return res.status(502).json({ code: 'BAD_REQUEST', error: 'Gemini rechazó el formato de la solicitud (400). Detalle: ' + googleMessage });
    }
    if (response.status === 401 || response.status === 403) {
      return res.status(503).json({ code: 'API_KEY_OR_ACCESS', error: 'Gemini rechazó la clave o el acceso del proyecto (HTTP ' + response.status + '). Comprueba que GEMINI_API_KEY sea una clave válida de AI Studio y que la API Gemini esté habilitada.' });
    }
    if (response.status === 404) {
      return res.status(502).json({ code: 'MODEL_NOT_FOUND', error: 'Gemini no reconoce el modelo configurado. Verifica el acceso al modelo gemini-3.5-flash-lite.' });
    }
    if (response.status === 429) {
      return res.status(429).json({ code: 'QUOTA_EXCEEDED', error: 'Se alcanzó el límite gratuito de Gemini. La ficha de respaldo seguirá disponible; vuelve a intentar cuando se restablezca la cuota.' });
    }
    if (response.status === 503 || response.status === 500) {
      return res.status(503).json({ code: 'PROVIDER_BUSY', error: 'Gemini está temporalmente ocupado (HTTP ' + response.status + '). Inténtalo nuevamente en unos minutos.' });
    }
    return res.status(502).json({ code: 'PROVIDER_ERROR', error: 'Gemini respondió con HTTP ' + response.status + '. Detalle: ' + googleMessage });
  }

  const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || '';
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || 'respuesta vacía';
    console.error('[JIMPORT IA] Gemini no devolvió texto:', reason);
    return res.status(502).json({ code: 'EMPTY_RESPONSE', error: 'Gemini no generó contenido (' + String(reason).slice(0, 100) + '). Revisa los datos del producto e inténtalo otra vez.' });
  }

  let result;
  try {
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    result = JSON.parse(jsonText);
  } catch {
    console.error('[JIMPORT IA] Gemini devolvió JSON inválido.');
    return res.status(502).json({ code: 'INVALID_AI_JSON', error: 'Gemini respondió, pero el formato generado no fue válido. Inténtalo nuevamente.' });
  }

  if (!result || typeof result.description !== 'string' || !result.description.trim()) {
    return res.status(502).json({ code: 'INCOMPLETE_AI_RESULT', error: 'Gemini devolvió una ficha incompleta. Inténtalo nuevamente.' });
  }

  return res.status(200).json({ result: {
    description: result.description.slice(0, 2500),
    features: Array.isArray(result.features) ? result.features.filter(x => typeof x === 'string').slice(0, 6) : [],
    compatibility: Array.isArray(result.compatibility) ? result.compatibility.filter(x => typeof x === 'string').slice(0, 6) : [],
    use_cases: Array.isArray(result.use_cases) ? result.use_cases.filter(x => typeof x === 'string').slice(0, 4) : [],
    caution: typeof result.caution === 'string' ? result.caution.slice(0, 500) : ''
  }});
}
