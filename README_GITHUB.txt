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
