# JIMPORT — logos editables

Los tres logos del sitio están en formato **SVG vectorial**, para que puedas cambiar texto, colores, tamaños y formas sin perder calidad.

## Archivos
- `assets/logo-jimport.svg`: logo principal (símbolo, nombre y eslogan separados).
- `assets/ugreen.svg`: logo UGREEN de la sección de marcas.
- `assets/anker.svg`: logo Anker de la sección de marcas.

También están copiados en la carpeta `LOGOS_EDITABLES` para encontrarlos fácilmente.

## Cómo modificarlos
1. Abre el SVG con **Inkscape** (gratuito), Adobe Illustrator o un editor compatible con SVG.
2. Selecciona el elemento que quieras cambiar. En Inkscape, abre `Objeto > Objetos` para elegir las capas/grupos: `simbolo`, `texto-marca`, `fondo` o `marca`.
3. Para cambiar el texto, usa la herramienta de texto. Para cambiar colores, selecciona la forma/texto y cambia el relleno.
4. Guarda como SVG y reemplaza el archivo del mismo nombre dentro de `assets`.
5. Sube los archivos actualizados al hosting junto con el sitio. Recarga la web con `Ctrl + F5` para ver los cambios.

## Importante
- `index.html` ahora usa `assets/logo-jimport.svg` en el encabezado y pie de página; ya no depende del PNG para esos espacios.
- Mantén los nombres de archivo para que la página encuentre los logos automáticamente.
- Los SVG de UGREEN y Anker incluidos aquí son versiones tipográficas editables de muestra, no archivos oficiales de marca. Si necesitas el diseño oficial exacto, reemplázalos por los archivos oficiales autorizados, conservando los nombres.
- Si editas el texto y tu editor lo sustituye por contornos, el texto puede dejar de ser editable como texto; guarda una copia antes de convertirlo a trazados.
