// Los accesos visuales llevan al catálogo y aplican una búsqueda útil para el producto elegido.
document.addEventListener('click', event => {
  const link = event.target.closest('[data-jp-search]');
  if (!link) return;
  const field = document.getElementById('search');
  if (!field) return;
  const brand = document.getElementById('brandFilter');
  const category = document.getElementById('categoryFilter');
  if (brand) brand.value = '';
  if (category) category.value = '';
  field.value = link.dataset.jpSearch || '';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  // Asegura que el usuario vea inmediatamente los resultados, incluso si el hash ya era #productos.
  requestAnimationFrame(() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});
