# JIMPORT Marketing Gratis
No requiere OpenAI ni Gemini para Marketing Studio. Textos locales basados en inventario, enlaces manuales de búsqueda por SKU y fondos gráficos mediante Canvas. No es IA generativa ni investigación automática.

# JIMPORT AI Marketing — instalación

1. Descomprime el ZIP y reemplaza los archivos del repositorio. No subas secretos a GitHub. Conserva los respaldos anteriores. El ZIP contiene la web completa, incluida la sección Marketing Studio existente.
2. En Supabase > SQL Editor ejecuta `marketing-ai.sql` una vez. Usa la función existente `jimport_is_admin()` (si no existe, instala primero la configuración de administradores de tu proyecto). Crea historial y un bucket público exclusivo para imágenes publicitarias; no guardes datos privados en él.
3. En Vercel > proyecto > Settings > Environment Variables añade las variables que correspondan a tu caso (Production y Preview solo si deseas usar ambas). Realiza un nuevo deploy. Los valores de tokens deben permanecer en el servidor.

| Variable | Valor |
|---|---|
| META_GRAPH_VERSION | Versión de Graph API compatible con tu app, ej. v27.0; verifica en Meta Developers |
| FB_PAGE_ID | ID de la página comercial |
| FB_PAGE_TOKEN | Token de página con permisos de publicación (pages_manage_posts y permisos de acceso correspondientes) |
| IG_USER_ID | ID de cuenta profesional de Instagram vinculada a la página mediante Facebook Login |
| IG_ACCESS_TOKEN | Token autorizado para publicar en esa cuenta, con instagram_basic, instagram_content_publish y permisos de página pertinentes |
| TELEGRAM_BOT_TOKEN | Token de BotFather |
| TELEGRAM_CHAT_ID | ID o @nombre del canal, donde el bot tiene permiso de publicar |


## Uso


## Verificación
Para publicar directamente conserva las credenciales de redes y el SQL anterior; no se necesitan para generar flyers. Las cuotas gratuitas de alojamiento y almacenamiento dependen del proveedor. La ficha IA Gemini preexistente es independiente y opcional; no se usa en Marketing Studio.
