# JIMPORT AI Marketing — instalación

1. Descomprime el ZIP y reemplaza los archivos del repositorio. No subas secretos a GitHub. Conserva los respaldos anteriores. El ZIP contiene la web completa, incluida la sección Marketing Studio existente.
2. En Supabase > SQL Editor ejecuta `marketing-ai.sql` una vez. Usa la función existente `jimport_is_admin()` (si no existe, instala primero la configuración de administradores de tu proyecto). Crea historial y un bucket público exclusivo para imágenes publicitarias; no guardes datos privados en él.
3. En Vercel > proyecto > Settings > Environment Variables añade las variables que correspondan a tu caso (Production y Preview solo si deseas usar ambas). Realiza un nuevo deploy. Los valores de tokens deben permanecer en el servidor.

| Variable | Valor |
|---|---|
| OPENAI_API_KEY | Clave de API con facturación habilitada (https://platform.openai.com/api-keys) |
| OPENAI_TEXT_MODEL | Opcional; por defecto gpt-4.1-mini |
| OPENAI_IMAGE_MODEL | Opcional; por defecto gpt-image-1 |
| META_GRAPH_VERSION | Versión de Graph API compatible con tu app, ej. v27.0; verifica en Meta Developers |
| FB_PAGE_ID | ID de la página comercial |
| FB_PAGE_TOKEN | Token de página con permisos de publicación (pages_manage_posts y permisos de acceso correspondientes) |
| IG_USER_ID | ID de cuenta profesional de Instagram vinculada a la página mediante Facebook Login |
| IG_ACCESS_TOKEN | Token autorizado para publicar en esa cuenta, con instagram_basic, instagram_content_publish y permisos de página pertinentes |
| TELEGRAM_BOT_TOKEN | Token de BotFather |
| TELEGRAM_CHAT_ID | ID o @nombre del canal, donde el bot tiene permiso de publicar |

Meta: https://developers.facebook.com/ — configura una app y concede permisos oficiales; según tu caso puede requerir revisión de app, verificación empresarial y renovación de tokens. Telegram: https://core.telegram.org/bots/api#sendphoto. OpenAI: https://platform.openai.com/docs/guides/tools-web-search y https://platform.openai.com/docs/guides/image-generation. La API se factura aparte de ChatGPT Plus. Configura presupuestos/alertas y revisa consumo. El botón de comprobación indica presencia de variables, no valida tokens ni permisos.

## Uso
Admin > Marketing Studio > JIMPORT AI Marketing. Selecciona producto (busca nombre, marca, modelo, SKU si existe), genera investigación y revisa fuentes, genera fondo IA, revisa diseño, precio y texto. El producto y el logotipo originales se componen encima del fondo generado; no se regeneran. Escoge formato cuadrado para compartir entre redes, retrato para Instagram si lo deseas. Descarga PNG HD o comprueba configuración, marca redes y pulsa Publicar ahora. Las redes seleccionadas reciben la misma imagen y textos específicos (edición del texto actual afecta a la red seleccionada en el selector de formato). Publicación directa de fotografías en Facebook, Instagram feed y Telegram; las demás conservan opciones manuales. El calendario anterior es local, no ejecuta publicaciones programadas.

Si la foto del catálogo no permite lectura por CORS, carga la foto original con el control existente. Los resultados de búsqueda de IA son orientativos: confirma que el SKU coincide y que las fuentes sustentan las afirmaciones. Si no existe SKU, usa marca/modelo. El estado pendiente/no confirmado exige verificar la cuenta antes de intentar de nuevo. No crees una nueva campaña para repetir un envío incierto. El historial impide duplicar el mismo identificador de campaña por plataforma, no todas las campañas similares. Las imágenes públicas de Instagram se conservan en el bucket; puedes administrar su retención manualmente después de comprobar la publicación. La publicación no se agenda ni se hace sin pulsar el botón. No se implementa OAuth dentro de la web; las credenciales se configuran en Vercel.

## Verificación
Se han comprobado sintaxis JS, integridad del ZIP y rutas/controles. Debes probar en tu despliegue con una cuenta de prueba, revisar permisos, facturación, resultado visual, límites de duración Vercel y compatibilidad del modelo. No se han realizado publicaciones reales ni llamadas con credenciales privadas.
