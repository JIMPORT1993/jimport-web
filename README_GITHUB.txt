JIMPORT – paquete depurado para GitHub

Contenido: página pública, administrador, estilos y scripts activos, imágenes usadas y función API de visitas.

Instalación: descomprime este ZIP y sube su contenido a la raíz del repositorio GitHub conectado a Vercel.

No se incluyen archivos antiguos sin referencias en index.html/admin.html ni el antiguo módulo de administración de videos.

CONFIGURAR_GALERIA_JIMPORT.sql se conserva como referencia de configuración de Supabase; no lo ejecutes de nuevo si ya configuraste esas tablas.


ACTUALIZACIÓN: INTERRUPTOR BLACK FRIDAY Y CALIFICACIONES PRIVADAS
1. Antes de publicar, abre Supabase > SQL Editor y ejecuta ACTUALIZAR_BLACK_FRIDAY_Y_CALIFICACIONES.sql.
2. Sube todos los archivos de este ZIP a GitHub, conservando carpetas y nombres.
3. En Administrador > Configuración general de precios de la tienda puedes elegir Precio al público o Precio al por mayor y marcar/desmarcar “Activar portada y modo Black Friday”. Pulsa Guardar configuración.
4. Al desactivar Black Friday vuelve la portada normal automáticamente; el selector público/mayorista continúa funcionando.
5. La portada ya no muestra sección de opiniones ni formulario. Después de registrar una venta con código, el administrador envía el enlace calificar.html y el código por WhatsApp, en mensajes separados. El formulario sigue validando el código de compra.
6. La sección de administración de opiniones permanece disponible dentro del panel privado.


ACTUALIZACIÓN: FICHA INTELIGENTE GRATUITA DE PRODUCTOS
1. En Supabase > SQL Editor ejecuta JIMPORT_FICHA_INTELIGENTE.sql una sola vez.
2. Sube todos los archivos del ZIP a la raíz del repositorio GitHub conectado a Vercel.
3. En Administrador > Productos, edita cada producto y agrega URLs HTTPS de fotografías adicionales (una por línea). Guarda el producto.
4. En la página, al abrir un producto se mostrará su ficha inteligente, descripción organizada y galería de fotos.

IMPORTANTE: esta primera versión funciona íntegramente en el navegador con reglas locales y datos guardados en el catálogo. No utiliza ChatGPT, claves de IA, cuotas ni servicios de pago; por eso no se detiene al agotarse un cupo externo. No es un modelo generativo conversacional: no inventa características técnicas y muestra un aviso cuando faltan datos.

ACTUALIZACIÓN: IA GENERATIVA REAL PARA DESCRIPCIONES DE PRODUCTOS
1. El paquete incluye api/product-ai.js. Vercel publicará esta función automáticamente al subir el ZIP a la raíz del repositorio.
2. Crea una clave gratuita en Google AI Studio: https://aistudio.google.com/app/apikey
3. En Vercel abre tu proyecto JIMPORT > Settings > Environment Variables. Crea la variable GEMINI_API_KEY y pega allí la clave. No pegues la clave en config.js, app.js, GitHub ni en el navegador.
4. Guarda la variable y realiza un nuevo Deploy (Redeploy) para que la función la reciba.
5. En la tienda, el cliente abre un producto y presiona “Generar descripción con IA”. El resultado incluye descripción, características confirmadas, compatibilidad disponible y usos recomendados. Se guarda en el navegador para no repetir la consulta desde ese mismo dispositivo.
6. La IA usa Gemini 3.5 Flash-Lite en el nivel gratuito disponible de Google AI Studio. El nivel gratuito tiene límites de uso y Google puede modificarlos. Si se alcanza el límite, la ficha inteligente local y la descripción original siguen funcionando; el cliente puede volver a intentarlo más tarde.
7. Las fotos adicionales NO se inventan: agrega URLs HTTPS reales en Administrador > Productos > Fotografías adicionales (una por línea). La ficha las mostrará como galería.
8. La clave queda en el servidor de Vercel, no expuesta en el código público. No compartas la clave ni la coloques en archivos del repositorio.
