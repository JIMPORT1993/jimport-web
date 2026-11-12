(() => {
  const cfg = window.JIMPORT_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !String(cfg.SUPABASE_URL).startsWith('PEGA_');
  const client = configured && window.supabase?.createClient ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const qs = sel => document.querySelector(sel);
  const byId = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('es-EC',{style:'currency',currency:cfg.CURRENCY || 'USD',maximumFractionDigits:2}).format(Number(n || 0));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const waBase = `https://wa.me/${String(cfg.WHATSAPP_NUMBER || '').replace(/\D/g,'')}?text=`;
  const productPrice = p => Number(p?.price || 0);

  let products = [], promotions = [], combos = [], reviews = [];
  let filtered = [], visibleCount = 12;

  function wa(text){ return waBase + encodeURIComponent(text); }

  function updateWhatsAppLinks(){
    ['waHeader','waHero','waContact','waFloating'].forEach(id => {
      const el = byId(id);
      if(el) el.href = wa('Hola JIMPORT, quiero información sobre sus productos.');
    });
  }

  function uniqueValues(items, field){
    return [...new Set(items.map(item => String(item?.[field] ?? '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  }

  async function fetchProducts(){
    if(!client) return [];
    const batch = 500;
    const rows = [];
    for(let offset = 0; offset < 5000; offset += batch){
      const { data, error } = await client.from('products').select('*').order('created_at',{ascending:false}).range(offset, offset + batch - 1);
      if(error) throw error;
      rows.push(...(data || []));
      if(!data || data.length < batch) break;
    }
    return rows.filter(p => p.active !== false);
  }

  async function fetchPromotions(){
    if(!client) return [];
    const { data, error } = await client.from('promotions').select('*').eq('active', true).order('created_at',{ascending:false});
    if(error) return [];
    return data || [];
  }

  async function fetchCombos(){
    if(!client) return [];
    const { data, error } = await client.from('jimport_super_combos').select('*').eq('active', true).order('created_at',{ascending:false});
    if(error) return [];
    return data || [];
  }

  async function fetchReviews(){
    if(!client) return [];
    const { data, error } = await client.from('reviews').select('name,rating,comment,created_at,verified_purchase').eq('approved', true).order('created_at',{ascending:false}).limit(12);
    if(error) return [];
    return data || [];
  }

  function updateStats(){
    byId('statProducts').textContent = products.length;
    byId('statCategories').textContent = uniqueValues(products,'category').length;
    byId('statBrands').textContent = uniqueValues(products,'brand').length;
  }

  function renderCategories(){
    const categories = uniqueValues(products,'category').slice(0,8);
    const counts = categories.map(cat => ({ name: cat, count: products.filter(p => normalize(p.category) === normalize(cat)).length }));
    const grid = byId('categoryGrid');
    if(!counts.length){ grid.innerHTML = '<article class="empty-card">No se encontraron categorías.</article>'; return; }
    grid.innerHTML = counts.map(cat => `
      <article class="category-card" data-category="${escapeHtml(cat.name)}">
        <strong>${escapeHtml(cat.name)}</strong>
        <span>${cat.count} producto(s)</span>
      </article>
    `).join('');
    grid.querySelectorAll('[data-category]').forEach(card => card.addEventListener('click', () => {
      byId('categorySelect').value = card.dataset.category;
      applyFilters(true);
      document.getElementById('catalogo').scrollIntoView({behavior:'smooth', block:'start'});
    }));
  }

  function renderPromotionCard(promo, fallbackProduct){
    const title = promo.title || fallbackProduct?.name || 'Promoción especial';
    const description = promo.description || fallbackProduct?.description || 'Aprovecha esta oferta por tiempo limitado.';
    const regular = promo.regular_price || fallbackProduct?.old_price;
    const sale = promo.sale_price || fallbackProduct?.price || 0;
    const image = promo.image_url || fallbackProduct?.image_url || 'assets/hero-azul-productos.webp';
    const waText = `Hola JIMPORT, quiero información sobre la promoción: ${title} por ${money(sale)}.`;
    return `
      <article class="promo-card">
        <span class="promo-badge">Promoción activa</span>
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description).slice(0,160)}</p>
        </div>
        <div>
          <div class="promo-prices"><strong>${money(sale)}</strong>${regular ? `<del>${money(regular)}</del>` : ''}</div>
          <a class="btn btn-secondary" target="_blank" rel="noopener" href="${wa(waText)}">Consultar promoción</a>
        </div>
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">
      </article>
    `;
  }

  function renderPromotions(){
    const grid = byId('promoGrid');
    if(!promotions.length){
      grid.innerHTML = '<article class="empty-card">No hay promociones activas por el momento.</article>';
      return;
    }
    grid.innerHTML = promotions.slice(0,3).map(promo => {
      const product = products.find(p => String(p.id) === String(promo.product_id));
      return renderPromotionCard(promo, product);
    }).join('');
  }

  function renderCombos(){
    const grid = byId('comboGrid');
    if(!combos.length){
      grid.innerHTML = '<article class="empty-card">Los Super Combos estarán disponibles próximamente.</article>';
      return;
    }
    grid.innerHTML = combos.slice(0,4).map(combo => {
      const ids = Array.isArray(combo.items) ? combo.items : [];
      const selected = ids.map(id => products.find(p => String(p.id) === String(id))).filter(Boolean);
      const images = selected.slice(0,4).map(p => `<img src="${escapeHtml(p.image_url || 'assets/hero-azul-productos.webp')}" alt="${escapeHtml(p.name)}" loading="lazy">`).join('');
      const itemsText = selected.slice(0,3).map(p => escapeHtml(p.name)).join(' · ');
      return `
        <article class="combo-card">
          <div class="combo-images">${images || '<img src="assets/hero-azul-productos.webp" alt="Combo JIMPORT">'}</div>
          <span class="eyebrow">Super Combo</span>
          <h3>${escapeHtml(combo.name || 'Combo JIMPORT')}</h3>
          <p>${escapeHtml(combo.description || itemsText || 'Combina tus accesorios favoritos con un mejor precio.')}</p>
          <div class="price-line">
            <strong>${money(combo.combo_price || 0)}</strong>
            <a class="btn btn-primary" target="_blank" rel="noopener" href="${wa(`Hola JIMPORT, quiero información del Súper Combo: ${combo.name} por ${money(combo.combo_price || 0)}.`)}">Pedir combo</a>
          </div>
        </article>
      `;
    }).join('');
  }

  function stockClass(stock){
    const value = normalize(stock);
    if(value.includes('agot')) return 'agotado';
    if(value.includes('lleg')) return 'llegando';
    return '';
  }

  function createProductCard(product){
    const image = product.image_url || 'assets/hero-azul-productos.webp';
    const regularPrice = Number(product.old_price || 0);
    const currentPrice = productPrice(product);
    return `
      <article class="product-card" data-id="${escapeHtml(product.id)}">
        <div class="product-thumb">
          <span class="brand-badge">${escapeHtml(product.brand || 'JIMPORT')}</span>
          <span class="stock-badge ${stockClass(product.stock)}">${escapeHtml(product.stock || 'Disponible')}</span>
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description || 'Accesorio disponible en JIMPORT.').slice(0,110)}</p>
        <div class="product-meta">
          ${product.category ? `<span>${escapeHtml(product.category)}</span>` : ''}
          ${product.model ? `<span>Modelo ${escapeHtml(product.model)}</span>` : ''}
        </div>
        <div class="product-price">
          <strong>${money(currentPrice)}</strong>
          ${regularPrice && regularPrice > currentPrice ? `<del>${money(regularPrice)}</del>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-buy="${escapeHtml(product.id)}">Comprar</button>
          <button class="btn btn-secondary" type="button" data-view="${escapeHtml(product.id)}">Ver más</button>
        </div>
      </article>
    `;
  }

  function renderFeatured(){
    const featured = [...products].sort((a,b) => Number(b.price || 0) - Number(a.price || 0)).slice(0,8);
    byId('featuredGrid').innerHTML = featured.map(createProductCard).join('') || '<article class="empty-card">No hay productos para mostrar.</article>';
  }

  function populateFilters(){
    const brands = uniqueValues(products,'brand');
    const categories = uniqueValues(products,'category');
    byId('brandSelect').innerHTML = '<option value="">Todas las marcas</option>' + brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
    byId('categorySelect').innerHTML = '<option value="">Todas las categorías</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  function applyFilters(resetCount = false){
    const query = normalize(byId('searchInput').value);
    const brand = normalize(byId('brandSelect').value);
    const category = normalize(byId('categorySelect').value);
    const sort = byId('sortSelect').value;

    filtered = products.filter(product => {
      const fullText = normalize([product.name, product.brand, product.model, product.category, product.description].join(' '));
      const matchesQuery = !query || fullText.includes(query);
      const matchesBrand = !brand || normalize(product.brand) === brand;
      const matchesCategory = !category || normalize(product.category) === category;
      return matchesQuery && matchesBrand && matchesCategory;
    });

    filtered.sort((a,b) => {
      if(sort === 'price-asc') return productPrice(a) - productPrice(b);
      if(sort === 'price-desc') return productPrice(b) - productPrice(a);
      if(sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'es');
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    if(resetCount) visibleCount = 12;
    renderCatalog();
  }

  function renderCatalog(){
    const items = filtered.slice(0, visibleCount);
    byId('productGrid').innerHTML = items.length ? items.map(createProductCard).join('') : '<article class="empty-card">No se encontraron productos con esos filtros.</article>';
    byId('productsCount').textContent = filtered.length;
    byId('statusText').textContent = filtered.length ? `${filtered.length} producto(s) encontrados.` : 'No se encontraron productos.';
    byId('loadMoreBtn').style.display = filtered.length > visibleCount ? 'inline-flex' : 'none';
    attachProductActions();
  }

  function renderBrands(){
    const strip = byId('brandStrip');
    const brands = uniqueValues(products,'brand');
    const logos = {
      ugreen:'assets/ugreen.svg', anker:'assets/anker.svg', dji:'assets/dji.svg', marvo:'assets/marvo.svg'
    };
    strip.innerHTML = brands.map(brand => {
      const logo = logos[normalize(brand)];
      return `<article class="brand-pill">${logo ? `<img src="${logo}" alt="${escapeHtml(brand)}">` : escapeHtml(brand)}</article>`;
    }).join('') || '<article class="empty-card">No hay marcas disponibles.</article>';
  }

  function renderReviews(){
    const summary = byId('reviewSummary');
    const grid = byId('reviewsGrid');
    if(!reviews.length){
      summary.textContent = 'Todavía no hay opiniones publicadas. Sé la primera persona en compartir tu experiencia.';
      grid.innerHTML = '<article class="empty-card">Sin opiniones disponibles por ahora.</article>';
      return;
    }
    const avg = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    summary.innerHTML = `<strong>★ ${avg.toFixed(1)} / 5</strong> · ${reviews.length} opiniones recientes publicadas`;
    grid.innerHTML = reviews.map(review => `
      <article class="review-card">
        ${review.verified_purchase ? '<span class="verified-pill">Compra verificada</span>' : ''}
        <strong>${escapeHtml(review.name || 'Cliente JIMPORT')}</strong>
        <div class="review-stars">${'★'.repeat(Number(review.rating || 0))}${'☆'.repeat(5 - Number(review.rating || 0))}</div>
        <p>${escapeHtml(review.comment || '')}</p>
        <small>${new Date(review.created_at).toLocaleDateString('es-EC')}</small>
      </article>
    `).join('');
  }

  function attachProductActions(){
    document.querySelectorAll('[data-buy]').forEach(button => button.onclick = () => {
      const product = products.find(item => String(item.id) === String(button.dataset.buy));
      if(!product) return;
      const msg = `Hola JIMPORT, quiero comprar este producto:%0A• ${product.name}%0A• Precio: ${money(productPrice(product))}%0A• Stock: ${product.stock || 'Disponible'}${product.image_url ? `%0A• Imagen: ${product.image_url}` : ''}`;
      window.open(wa(decodeURIComponent(msg)), '_blank', 'noopener');
    });
    document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => openProductDialog(button.dataset.view));
  }

  function openProductDialog(id){
    const product = products.find(item => String(item.id) === String(id));
    const dialog = byId('productDialog');
    if(!product || !dialog) return;
    dialog.innerHTML = `
      <div class="dialog-wrap">
        <div class="dialog-media"><img src="${escapeHtml(product.image_url || 'assets/hero-azul-productos.webp')}" alt="${escapeHtml(product.name)}"></div>
        <div class="dialog-content">
          <button class="dialog-close" type="button" data-close-dialog>✕</button>
          <span class="eyebrow">${escapeHtml(product.brand || 'JIMPORT')}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <div class="product-price"><strong>${money(productPrice(product))}</strong>${product.old_price && Number(product.old_price) > productPrice(product) ? `<del>${money(product.old_price)}</del>` : ''}</div>
          <p>${escapeHtml(product.description || 'Producto disponible en JIMPORT.')}</p>
          <ul>
            ${product.category ? `<li>Categoría: ${escapeHtml(product.category)}</li>` : ''}
            ${product.model ? `<li>Modelo: ${escapeHtml(product.model)}</li>` : ''}
            ${product.stock ? `<li>Disponibilidad: ${escapeHtml(product.stock)}</li>` : ''}
            ${product.wholesale_price ? `<li>Precio mayorista: ${money(product.wholesale_price)}</li>` : ''}
          </ul>
          <div class="card-actions">
            <a class="btn btn-primary" target="_blank" rel="noopener" href="${wa(`Hola JIMPORT, quiero información del producto ${product.name}. Precio: ${money(productPrice(product))}.`)}">Comprar por WhatsApp</a>
            <button class="btn btn-secondary" type="button" data-close-dialog>Cerrar</button>
          </div>
        </div>
      </div>`;
    dialog.querySelectorAll('[data-close-dialog]').forEach(el => el.onclick = () => dialog.close());
    dialog.showModal();
  }

  function bindEvents(){
    byId('topSearchForm').addEventListener('submit', e => {
      e.preventDefault();
      applyFilters(true);
      byId('catalogo').scrollIntoView({behavior:'smooth'});
    });
    ['brandSelect','categorySelect','sortSelect'].forEach(id => byId(id).addEventListener('change', () => applyFilters(true)));
    byId('searchInput').addEventListener('input', () => applyFilters(true));
    byId('clearFilters').addEventListener('click', () => {
      byId('searchInput').value = '';
      byId('brandSelect').value = '';
      byId('categorySelect').value = '';
      byId('sortSelect').value = 'recent';
      applyFilters(true);
    });
    byId('loadMoreBtn').addEventListener('click', () => { visibleCount += 12; renderCatalog(); });
    byId('menuToggle').addEventListener('click', () => {
      const menu = byId('mainMenu');
      const expanded = menu.classList.toggle('open');
      byId('menuToggle').setAttribute('aria-expanded', String(expanded));
    });
    byId('reviewForm').addEventListener('submit', submitReview);
    byId('year').textContent = new Date().getFullYear();
  }

  async function submitReview(event){
    event.preventDefault();
    const message = byId('reviewMessage');
    const button = byId('reviewSubmit');
    if(!client){ message.textContent = 'La conexión con Supabase no está configurada.'; return; }
    const firstName = byId('reviewName').value.trim();
    const lastName = byId('reviewLastName').value.trim();
    const code = byId('reviewCode').value.trim();
    const rating = Number(byId('reviewRating').value);
    const comment = byId('reviewComment').value.trim();
    if(!firstName || !lastName || !code || rating < 1 || rating > 5 || comment.length < 10){
      message.textContent = 'Completa correctamente todos los campos.';
      return;
    }
    button.disabled = true;
    message.textContent = 'Enviando opinión…';
    const { error } = await client.rpc('submit_verified_review', {
      purchase_code: code,
      reviewer_name: `${firstName} ${lastName}`.trim(),
      review_rating: rating,
      review_comment: comment
    });
    button.disabled = false;
    if(error){
      message.textContent = 'No se pudo verificar la compra o el código ya fue utilizado.';
      return;
    }
    byId('reviewForm').reset();
    message.textContent = '¡Gracias! Tu opinión fue recibida y quedará pendiente de aprobación.';
  }

  async function init(){
    updateWhatsAppLinks();
    bindEvents();
    if(!client){
      byId('statusText').textContent = 'No se pudo conectar con Supabase. Revisa config.js.';
      return;
    }
    try{
      [products, promotions, combos, reviews] = await Promise.all([
        fetchProducts(), fetchPromotions(), fetchCombos(), fetchReviews()
      ]);
      updateStats();
      populateFilters();
      renderCategories();
      renderPromotions();
      renderCombos();
      renderFeatured();
      renderBrands();
      renderReviews();
      applyFilters(true);
      attachProductActions();
    }catch(error){
      console.error('JIMPORT Blue Redesign error', error);
      byId('statusText').textContent = 'No se pudieron cargar los datos del catálogo.';
      byId('productGrid').innerHTML = '<article class="empty-card">Ocurrió un error al cargar el catálogo. Revisa la conexión con Supabase.</article>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
