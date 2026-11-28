/* JIMPORT: secciones plegables del panel, sin modificar formularios ni lógica de ventas. */
document.addEventListener('DOMContentLoaded', () => {
 const dashboard=document.getElementById('dashboard'); if(!dashboard)return;
 const groups=[
  ['combos','Súper Combos','Crear y editar combos', '#jxComboAdmin','#jxComboAdmin'],
  ['visitas','Estadísticas de visitas','Visitas y ubicaciones', '.visits-panel','.visits-panel'],
  ['duplicados','Productos duplicados','Revisar y eliminar duplicados', '[aria-labelledby="duplicateTitle"]','[aria-labelledby="duplicateTitle"]'],
  ['catalogo','Catálogo y existencias','Productos, búsqueda, filtros e inventario', '#newProduct','#adminProducts'],
  ['marcas','Marcas y categorías','Crear o quitar marcas y categorías', '#brandsPanel','#managedCategories'],
  ['promociones','Promociones','Ofertas y promociones de portada', '#newPromotion','#adminPromotions'],
  ['reporte','Reporte de ventas y ganancias','Ingresos, costo de llegada y utilidad por día', '#dailySalesReport','#dailySalesReport'],
  ['ventas','Compras verificadas','Registrar ventas y descontar stock', '[aria-labelledby="salesTitle"]','[aria-labelledby="salesTitle"]'],
  ['opiniones','Opiniones de clientes','Aprobar y administrar reseñas', '[aria-labelledby="reviewsAdminTitle"]','[aria-labelledby="reviewsAdminTitle"]']
 ];
 // Se agrupan nodos originales; sus IDs y eventos permanecen intactos.
 const pick=(selector)=>dashboard.querySelector(selector);
 const moveRange=(start,end,body)=>{let node=start;while(node){const next=node.nextElementSibling;body.appendChild(node);if(node===end)break;node=next;}};
 // Los encabezados de catálogo/promociones son contenedores sin ID propio.
 const toolbarCatalog=pick('#newProduct')?.closest('.admin-toolbar');
 const toolbarPromos=pick('#newPromotion')?.closest('.admin-toolbar');
 const mapping={combos:[pick('#jxComboAdmin'),pick('#jxComboAdmin')],visitas:[pick('.visits-panel'),pick('.visits-panel')],duplicados:[pick('[aria-labelledby="duplicateTitle"]'),pick('[aria-labelledby="duplicateTitle"]')],catalogo:[toolbarCatalog,pick('#adminProducts')],marcas:[pick('#brandsPanel'),pick('#managedCategories')],promociones:[toolbarPromos,pick('#adminPromotions')],reporte:[pick('#dailySalesReport'),pick('#dailySalesReport')],ventas:[pick('[aria-labelledby="salesTitle"]'),pick('[aria-labelledby="salesTitle"]')],opiniones:[pick('[aria-labelledby="reviewsAdminTitle"]'),pick('[aria-labelledby="reviewsAdminTitle"]')]};
 // Marcas/categorías están originalmente dentro del bloque del catálogo: extraer primero.
 const order=['combos','visitas','duplicados','marcas','catalogo','promociones','ventas','reporte','opiniones'];
 const blocks=new Map();
 for(const id of order){const [start,end]=mapping[id]||[];if(!start||!end)continue;const frag=document.createDocumentFragment();moveRange(start,end,frag);blocks.set(id,frag);}
 const nav=document.createElement('div');nav.className='compact-admin-intro';nav.innerHTML='<h2>Panel de administración</h2><p>Selecciona una sección para ver sus herramientas. Las demás permanecerán ocultas.</p>';
 dashboard.prepend(nav);
 const wrapper=document.createElement('div');wrapper.className='compact-admin-sections';nav.after(wrapper);
 for(const [id,title,subtitle] of groups){if(!blocks.has(id))continue;const details=document.createElement('details');details.className='compact-admin-section';details.dataset.section=id;const summary=document.createElement('summary');summary.innerHTML='<span class="compact-admin-title"></span><span class="compact-admin-subtitle"></span><span class="compact-admin-arrow" aria-hidden="true">⌄</span>';summary.querySelector('.compact-admin-title').textContent=title;summary.querySelector('.compact-admin-subtitle').textContent=subtitle;const body=document.createElement('div');body.className='compact-admin-body';body.appendChild(blocks.get(id));details.append(summary,body);wrapper.append(details);details.addEventListener('toggle',()=>{if(!details.open)return;wrapper.querySelectorAll('details').forEach(other=>{if(other!==details)other.open=false;});});}
 // Mostrar automáticamente el formulario adecuado al pulsar una acción que lo necesita.
 [['newProduct','catalogo'],['newPromotion','promociones']].forEach(([buttonId,section])=>{const btn=document.getElementById(buttonId);btn?.addEventListener('click',()=>{const d=wrapper.querySelector(`[data-section="${section}"]`);if(d)d.open=true;});});
});
