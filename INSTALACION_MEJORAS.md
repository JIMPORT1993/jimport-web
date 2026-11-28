# JIMPORT — actualización ampliada

1. Conserva una copia del repositorio actual y de tu base de datos. Este paquete parte de JIMPORT_RESTAURADA_SIN_MARKETING.zip.
2. En el proyecto Supabase EXISTENTE, comprueba que tu administrador puede iniciar sesión. Ejecuta únicamente mejoras.sql en SQL Editor. Requiere la función existente public.jimport_is_admin(). No ejecutes schema.sql de nuevo: contiene políticas antiguas.
3. Si SQL devuelve un error, no despliegues todavía; la transacción revierte los cambios. No borres tablas ni registros.
4. Extrae el ZIP y sube su contenido a la raíz de GitHub, reemplazando los archivos del mismo nombre. El antiguo assets/galaxia-jimport.png ya no se usa; puedes eliminarlo después de validar la nueva portada. Vercel desplegará según tu configuración existente.
5. Prueba en una ventana privada: catálogo, precios globales, WhatsApp, combos, favoritos, ficha, consulta de seguimiento y opiniones. En admin: acceso, venta verificada, stock, reporte original, nuevo registro de pedido, copia del UUID y consulta pública de ese UUID. Verifica que no se muestran los datos privados del pedido.
6. El nuevo centro comercial es independiente del registro de ventas: un pedido no descuenta stock ni registra ingresos. Confirma la venta mediante el mecanismo original. Registra gastos por separado. Las etiquetas y solicitudes de cotización utilizan Imprimir > Guardar como PDF; las cotizaciones no fijan precios.

## Alcance y límites
- Favoritos y recientes locales; sugerencias de búsqueda; búsqueda por texto de dispositivo (no certifica compatibilidad); enlaces relacionados por categoría; consultas de disponibilidad y garantía por WhatsApp, no notificaciones automáticas.
- Registros independientes de pedidos, clientes, proveedores, gastos y garantías. Seguimiento por código UUID; no consulta en tiempo real a Servientrega. Evita poner datos privados en el campo guía, que es público para quien tenga el código.
- Indicadores usan el reporte de ventas existente y gastos registrados. Hasta 1000 registros y hasta el límite de filas de Supabase por consulta de eventos (solicita 5000). Los resultados pueden ser parciales. Los eventos son orientativos, no antifraude; no se almacena texto de búsqueda arbitrario, solo coincidencias exactas de catálogo o contador genérico.
- Exportación JSON del nuevo módulo, no respaldo integral de Supabase. Calculadora de margen antes de impuestos. El botón de eliminación normal de producto ahora oculta; la herramienta preexistente de duplicados todavía permite borrado permanente.
- Manifest e iconos PWA, sin cache de información privada/precios; instalación depende del navegador. No es una app nativa ni funciona offline.
- Pendientes: compatibilidad estructurada, corrección ortográfica, cotización con precio actualizado, tarifas de envío, automatización de avisos, historial de inventario y auditoría completa, edición masiva, descuentos por cantidad, gráficos avanzados, garantía pública, SEO adicional y protección de eventos en servidor. No se ha probado en la base de datos real ni en Vercel. Se validó sintaxis JS y ZIP.
- La migración endurece solo las políticas conocidas de products, promotions y reviews; no constituye una auditoría completa de seguridad. Revisa políticas existentes y RPC, y limita la recogida de eventos según tu aviso de privacidad.
