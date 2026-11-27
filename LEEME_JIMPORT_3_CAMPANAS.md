# JIMPORT 3.0 – Campañas programadas

## Qué incluye
- Campos de campaña, etiqueta visible, fecha/hora de inicio y fecha/hora de finalización en el administrador de promociones.
- Las promociones programadas solo se muestran en la tienda dentro de su período.
- Las promociones sin fechas conservan el comportamiento anterior.
- Validación para impedir que la fecha final sea anterior al inicio.
- Conserva las tablas, datos, productos, ventas, inventario, opiniones y demás módulos actuales.

## Instalación
1. Haz una copia de seguridad de Supabase y del repositorio.
2. En Supabase > SQL Editor, ejecuta `JIMPORT_3_CAMPANAS_PROGRAMADAS.sql`.
3. Sube el contenido de esta carpeta a la rama de pruebas/revisión de GitHub, manteniendo la estructura.
4. Verifica el administrador: crea una promoción de prueba con fecha futura y finalización futura; comprueba que no se muestre antes de iniciar y que se oculte al vencer.
5. Comprueba promociones existentes sin fechas: deben seguir visibles si están activas.
6. Solo después de probar, integra a la rama de producción y confirma el despliegue de Vercel.

## Uso del calendario comercial
Fechas recomendadas para campañas editables (no se crean descuentos automáticamente):
- Febrero: San Valentín / regalos tecnológicos.
- Marzo–abril: temporada de regreso a clases según calendario local.
- Mayo: Día de la Madre (Ecuador).
- Junio: Día del Padre.
- Agosto–septiembre: regreso a clases Sierra y Amazonía, según calendario oficial.
- Noviembre: Black Friday y Cyber Monday (confirmar fechas anuales).
- Diciembre: Navidad y fin de año.
- Todo el año: Semana UGREEN, Semana ANKER, Semana DJI, ofertas 24/48 horas y liquidación de stock.

Importante: las fechas de feriados y eventos móviles deben confirmarse cada año. El sistema no cambia precios de productos por sí solo; la promoción muestra el precio especial que el administrador introduce.
