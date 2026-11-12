// Usa el buscador existente para que las categorías lleven a resultados reales.
document.querySelectorAll('[data-jp-search]').forEach(link=>link.addEventListener('click',()=>{
  const field=document.getElementById('search');if(!field)return;
  field.value=link.dataset.jpSearch;
  field.dispatchEvent(new Event('input',{bubbles:true}));
}));
