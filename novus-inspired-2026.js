/* Navegación por categorías: respeta los filtros originales, el stock y los precios de Supabase. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.novus-category[data-category-query]').forEach(button => {
    button.addEventListener('click', () => {
      const term = button.dataset.categoryQuery || '';
      const search = document.getElementById('search');
      const brand = document.getElementById('brandFilter');
      const category = document.getElementById('categoryFilter');
      if (!search) return;
      if (brand) { brand.value = ''; brand.dispatchEvent(new Event('change', {bubbles:true})); }
      if (category) category.value = '';
      search.value = term;
      search.dispatchEvent(new Event('input', {bubbles:true}));
      document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});
    });
  });
});
