(() => {
  const cfg = window.JIMPORT_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("PEGA_") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const grid = document.getElementById("productGrid"), status = document.getElementById("status");
  const search = document.getElementById("search"), brandFilter = document.getElementById("brandFilter"), categoryFilter = document.getElementById("categoryFilter");
  const money = n => new Intl.NumberFormat("es-EC", {style:"currency",currency:cfg.CURRENCY || "USD"}).format(Number(n || 0));
  const productPhoto = p => p?.image_url ? "\n📷 Fotografía: " + p.image_url : "";
  const wa = (msg="Hola JIMPORT, quisiera información sobre sus productos.") => `https://wa.me/${(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
  ["headerWhatsapp","contactWhatsapp","floatWhatsapp"].forEach(id => { const el=document.getElementById(id); el.href=wa(); });
  document.getElementById("year").textContent = new Date().getFullYear();
  let products = [], heroIndex = 0, heroTimer = null, promotedProductIds = new Set(), displayPriceMode = "retail", blackFridayEnabled = false, blackFridayPercent = 6, liveShowDiscount = true;
  const displayPrice = p => displayPriceMode === "wholesale" ? Number(p.wholesale_price ?? p.price ?? 0) : displayPriceMode === "live" ? livePrice(p) : Number(p.price || 0);
  const displayPriceText = p => money(displayPrice(p));
  const retailPrice = p => Number(p?.price || 0);
  const livePrice = p => { const r=retailPrice(p), w=Number(p?.wholesale_price ?? p?.price ?? 0); return r>0 && w>0 ? Math.floor((r+w)/2) : (r||w||0); };
  const liveDiscount = p => { const r=retailPrice(p), l=livePrice(p); return r>0 && l<r ? Math.round((r-l)/r*100) : 0; };
  const livePriceMarkup = p => { const l=livePrice(p), d=liveDiscount(p); return `<strong class="teaser-price jp-live-price">${money(l)}</strong>${liveShowDiscount&&d>0?`<span class="jp-live-discount">-${d}% LIVE</span>`:""}`; };
  const wholesalePrice = p => Number(p?.wholesale_price ?? p?.price ?? 0);
  const blackFridayPrice = p => wholesalePrice(p) > 0 ? wholesalePrice(p) : retailPrice(p);
  const blackFridayRegularPrice = p => Math.ceil(blackFridayPrice(p) * (1 + blackFridayPercent / 100) - 1e-9);
  const blackFridayDiscount = p => blackFridayPrice(p) > 0 ? blackFridayPercent : 0;
  const blackFridayPriceText = p => money(blackFridayPrice(p));
  const blackFridayBadge = discount => discount>0 ? `<span class="bf-discount-badge">-${discount}%</span>` : '';
  const blackFridayProductPrice = p => {
    if(!blackFridayEnabled) return displayPriceMode==='live' ? livePriceMarkup(p) : `<strong class="teaser-price">${displayPriceText(p)}</strong>${p.old_price?`<del class="teaser-old-price">${money(p.old_price)}</del>`:''}`;
    const d=blackFridayDiscount(p), regular=blackFridayRegularPrice(p), sale=blackFridayPrice(p);
    return d>0 ? `${blackFridayBadge(d)}<del class="bf-regular-price">${money(regular)}</del><strong class="teaser-price bf-sale-price">${money(sale)}</strong>` : `<strong class="teaser-price">${money(sale)}</strong>`;
  };
  const blackFridayComboSale = c => Number(c.combo_price||0);
  const blackFridayComboRegular = c => Math.ceil(blackFridayComboSale(c) * (1 + blackFridayPercent / 100) - 1e-9);
  const blackFridayComboDiscount = c => blackFridayEnabled && blackFridayComboSale(c)>0 ? blackFridayPercent : 0;
  const blackFridayPromoSale = p => Number(p.sale_price||0);
  const blackFridayPromoRegular = p => Math.ceil(blackFridayPromoSale(p) * (1 + blackFridayPercent / 100) - 1e-9);
  const blackFridayPromoDiscount = p => blackFridayEnabled && blackFridayPromoSale(p)>0 ? blackFridayPercent : 0;
  const knownBrands=[]; // Las marcas se obtienen de los productos reales, no de una lista fija.
  const demo = [
    {id:"demo1",name:"Hub USB-C 6 en 1",brand:"UGREEN",model:"Ejemplo",price:29.90,old_price:null,stock:"En stock",image_url:"",description:"Conecta tus dispositivos con una sola solución.",demo:true},
    {id:"demo2",name:"Cargador rápido USB-C",brand:"Anker",model:"Ejemplo",price:24.90,old_price:null,stock:"Bajo pedido",image_url:"",description:"Carga práctica para tus dispositivos compatibles.",demo:true},
    {id:"demo3",name:"Cable USB-C",brand:"UGREEN",model:"Ejemplo",price:8.50,old_price:null,stock:"Agotado",image_url:"",description:"Accesorio para uso diario.",demo:true}
  ];
  // Recupera todos los productos publicados, incluso si el proyecto contiene más de 1000.
  // No se modifica ni se borra ningún registro de Supabase.
  async function load() {
    if (!client) { products=[]; status.textContent="No se pudo conectar con el catálogo. Comprueba config.js."; render(); return; }
    try {
      const {data:priceSettings,error:settingsError}=await client.from('jimport_store_settings').select('display_price_mode,black_friday_enabled,black_friday_percent,live_show_discount').eq('id','main').maybeSingle();
      if(!settingsError){displayPriceMode=priceSettings?.display_price_mode||'retail';blackFridayEnabled=priceSettings?.black_friday_enabled===true;blackFridayPercent=Number(priceSettings?.black_friday_percent??6);liveShowDiscount=priceSettings?.live_show_discount!==false;document.body.classList.toggle('black-friday-active',blackFridayEnabled);document.body.classList.toggle('live-price-active',displayPriceMode==='live'&&!blackFridayEnabled);}
      const all=[]; const batchSize=500;
      for(let offset=0;offset<50000;offset+=batchSize){
        const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false}).range(offset,offset+batchSize-1);
        if(error) throw error;
        all.push(...(data||[]));
        if(!data || data.length<batchSize) break;
      }
      // Los productos antiguos sin columna active se consideran visibles.
      products=uniqueProducts(all.filter(p=>p.active!==false));
      render();
    } catch(error){
      console.error("JIMPORT: error al cargar productos",error);
      products=[];
      render();
      status.textContent="No se pudieron recuperar los productos de Supabase. Revisa la conexión y los permisos de lectura.";
    }
  }
  function norm(v){return String(v??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");}
  // Busca por palabras clave en todos los datos visibles del producto.
  // Ej.: "100w", "100 W" y "100 watts" encuentran los artículos de 100 W.
  function searchable(v){return norm(v).replace(/(\d+)\s*(watts?|w)(?![a-z])/g,"$1w").replace(/[^a-z0-9]+/g," ").trim();}
  function matchesSearch(p, query){
    const content=searchable([p.name,p.brand,p.model,p.description,p.category,p.sku,p.specifications,p.features].filter(v=>typeof v==="string"||typeof v==="number").join(" "));
    const terms=searchable(query).split(/\s+/).filter(Boolean);
    return terms.every(term=>content.includes(term));
  }
  // Una ficha por modelo/SKU en la interfaz; los registros originales permanecen en Supabase.
  // Evita fichas repetidas sin modificar registros de inventario en Supabase.
  // Para el Nano Charger naranja, conserva la ficha que NO está marcada "En stock".
  function uniqueProducts(rows){
    const normalizeName=v=>norm(v).replace(/[^a-z0-9]+/g," ").replace(/\\s+/g," ").trim();
    const groups=new Map();
    for(const p of rows){
      const brand=normalizeName(p.brand);
      const name=normalizeName(p.name);
      const sku=normalizeName(p.sku||p.codigo||p.code);
      const model=normalizeName(p.model);
      const nanoOrange=/\\bnano\\b/.test(name+" "+model) && /\\bcharger\\b|\\bcargador\\b/.test(name+" "+model) && /\\bnaranja\\b|\\borange\\b/.test(name+" "+model+" "+normalizeName(p.description));
      // El nombre exacto de producto prima sobre códigos diferentes en registros duplicados.
      const key=nanoOrange?"nano-charger-naranja":brand+"|"+(name?"name:"+name:sku?"sku:"+sku:"model:"+model);
      const existing=groups.get(key);
      if(!existing){groups.set(key,p);continue;}
      const isInStock=x=>/^(en stock|disponible)$/i.test(String(x.stock||"").trim());
      const score=x=>(x.image_url?2:0)+(x.description?1:0)+(x.specifications?1:0);
      if(nanoOrange){
        if(isInStock(existing)&&!isInStock(p))groups.set(key,p);
        else if(isInStock(existing)===isInStock(p)&&score(p)>score(existing))groups.set(key,p);
      }else if(score(p)>score(existing))groups.set(key,p);
    }
    return [...groups.values()];
  }
  function productInfo(p){
    const parts=[p.description,p.specifications,p.features].filter(Boolean).map(v=>typeof v==='string'?v:JSON.stringify(v));
    return parts.length?parts.join('\n\n'):'Consulta las características con nuestro equipo de JIMPORT.';
  }
  // Ficha inteligente local: organiza y redacta los datos reales del catálogo sin API externa,
  // sin cuenta de ChatGPT y sin límites de consultas. No inventa especificaciones ausentes.
  function smartProductCopy(p){
    const raw=[p.description,p.specifications,p.features].filter(Boolean).map(v=>typeof v==='string'?v:JSON.stringify(v));
    const details=raw.join('\n\n').trim();
    const category=String(p.category||'accesorios').toLocaleLowerCase('es');
    const name=String(p.name||'este producto').trim();
    const intro=`${name} de ${p.brand||'JIMPORT'}${p.model?' · modelo '+p.model:''}.`;
    const benefits={
      cargadores:'Ideal para mantener tus dispositivos cargados. Verifica la potencia y el tipo de puerto de tu equipo antes de comprar.',
      cables:'Una solución práctica para conectar y cargar dispositivos compatibles. Revisa el tipo de conector y la potencia admitida.',
      audio:'Diseñado para acompañar tus actividades de entretenimiento, trabajo o comunicación. La experiencia depende de la compatibilidad del dispositivo.',
      hubs:'Permite ampliar las conexiones disponibles en equipos compatibles. Comprueba el tipo de puerto y las funciones admitidas por tu computadora.',
      'power banks':'Una alternativa portátil para disponer de energía cuando estás fuera de casa. La capacidad y velocidad dependen de las especificaciones del modelo.'
    };
    const key=Object.keys(benefits).find(k=>category.includes(k));
    return {intro,description:details||'JIMPORT todavía no ha registrado una descripción técnica detallada para este producto.',benefit:benefits[key]||'Accesorio seleccionado por JIMPORT. Consulta las especificaciones registradas y confirma la compatibilidad con tu equipo antes de realizar la compra.',hasDetails:!!details};
  }

  // IA generativa compartida: cachea respuestas para no consumir cuota repetidamente.
  window.JIMPORT_AI_GENERATE = async function(source, cacheId){
    const key='jimport-ai-v2-'+String(cacheId||source.name||'item')+'-'+btoa(unescape(encodeURIComponent(JSON.stringify(source)))).slice(0,48);
    try{const cached=localStorage.getItem(key);if(cached)return JSON.parse(cached);}catch(_){ }
    const response=await fetch('/api/product-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:source})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'La IA no está disponible temporalmente.');
    const result=payload.result;
    if(!result||!result.description)throw new Error('La IA devolvió una respuesta incompleta.');
    try{localStorage.setItem(key,JSON.stringify(result));}catch(_){ }
    return result;
  };
  window.JIMPORT_AI_RENDER = function(target,data){
    const list=v=>Array.isArray(v)?v.filter(Boolean):[];
    const section=(title,items)=>items.length?`<h4>${title}</h4><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
    target.innerHTML=`<div class="jp-ai-generated"><span class="jp-ai-generated-label">✦ CONTENIDO GENERADO CON IA</span><p>${esc(data.description)}</p>${section('Características principales',list(data.features))}${section('Compatibilidad',list(data.compatibility))}${section('Usos recomendados',list(data.use_cases))}${data.caution?`<p class="jp-ai-note">${esc(data.caution)}</p>`:''}</div>`;
  };
  async function generateProductDescriptionWithAI(p,dlg){
    const target=dlg.querySelector('#jpAiGenerated');if(!target)return;
    const source={name:p.name||'',brand:p.brand||'',model:p.model||'',category:p.category||'',description:p.description||'',specifications:p.specifications||'',features:p.features||'',sku:p.sku||''};
    target.innerHTML='<p class="jp-ai-loading"><span class="jp-ai-spinner"></span> La IA está preparando la ficha completa…</p>';
    try{const result=await window.JIMPORT_AI_GENERATE(source,'product-'+p.id);if(!dlg.isConnected||!target.isConnected)return;window.JIMPORT_AI_RENDER(target,result);}
    catch(error){if(target.isConnected)target.innerHTML=`<p class="jp-ai-note">${esc(error.message||'La IA no está disponible en este momento.')} Se muestra la ficha inteligente de respaldo.</p>`;}
  }

  function productGallery(p){
    const extras=Array.isArray(p.gallery_images)?p.gallery_images:(Array.isArray(p.images)?p.images:[]);
    const urls=[p.image_url,...extras].filter(v=>typeof v==='string'&&/^https?:\/\//i.test(v));
    return [...new Set(urls)].slice(0,12);
  }
  function openProductInfo(p){
    let dlg=document.getElementById('jimportProductInfoDialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='jimportProductInfoDialog';dlg.className='jimport-product-dialog';document.body.appendChild(dlg);dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});}
    const sale=blackFridayPrice(p), regular=blackFridayRegularPrice(p), discount=blackFridayEnabled?blackFridayDiscount(p):0;
    const live=livePrice(p), livePct=liveDiscount(p);
    const priceBlock=blackFridayEnabled&&discount>0
      ? `<div class="jimport-dialog-bf"><span class="jimport-dialog-bf-tag">BLACK FRIDAY</span><p class="jimport-dialog-model">Precio anterior <del>${money(regular)}</del></p><strong class="jimport-dialog-price">Precio especial ${money(sale)}</strong><small class="jimport-dialog-save">-${discount}% BLACK FRIDAY</small></div>`
      : displayPriceMode==='live' ? `<div class="jimport-dialog-live"><span>PRECIO LIVE</span><strong class="jimport-dialog-price">${money(live)}</strong>${liveShowDiscount&&livePct>0?`<small>Ahorras ${livePct}% frente al precio público</small>`:''}</div>`
      : `<strong class="jimport-dialog-price">${displayPriceText(p)}</strong>`;
    const waPrice=blackFridayEnabled&&discount>0?`Precio anterior: ${money(regular)}\nPrecio Black Friday: ${money(sale)}\nDescuento: ${discount}%`:displayPriceMode==='live'?`Precio público: ${money(retailPrice(p))}\nPrecio LIVE: ${money(live)}${liveShowDiscount&&livePct>0?`\nAhorro: ${livePct}%`:''}`:`Precio mostrado: ${displayPriceText(p)}`;
    const smart=smartProductCopy(p), gallery=productGallery(p);
    const galleryHtml=gallery.length?`<div class="jp-ai-gallery" aria-label="Fotografías del producto">${gallery.map((url,i)=>`<button type="button" class="jp-ai-photo ${i===0?'is-active':''}" data-gallery-index="${i}" aria-label="Ver fotografía ${i+1}"><img src="${esc(url)}" alt="${esc(p.name)} fotografía ${i+1}" loading="lazy"></button>`).join('')}</div>`:'<p class="jp-ai-no-photos">No hay fotografías adicionales registradas todavía.</p>';
    dlg.innerHTML=`<div class="jimport-dialog-head"><strong>✨ Ficha inteligente JIMPORT</strong><button type="button" aria-label="Cerrar características" class="jimport-dialog-close">✕</button></div><div class="jp-ai-main-photo">${gallery[0]?`<img id="jpAiMainPhoto" src="${esc(gallery[0])}" alt="${esc(p.name)}">`:'<div class="jp-ai-photo-empty">📦 Fotografía no disponible</div>'}</div>${galleryHtml}<h3>${esc(p.name)}</h3><p class="jimport-dialog-model">${esc(p.brand||'JIMPORT')} ${p.model?'· '+esc(p.model):''} ${p.category?'· '+esc(p.category):''}</p><section class="jp-ai-section"><h4>Descripción del producto</h4><p>${esc(smart.intro)}</p><p class="jimport-dialog-text">${esc(smart.description)}</p><div id="jpAiGenerated" aria-live="polite"><p class="jp-ai-loading">Preparando la ficha inteligente…</p></div></section><section class="jp-ai-section"><h4>Características y beneficios</h4><p>${esc(smart.benefit)}</p>${p.specifications?`<p class="jimport-dialog-text"><b>Especificaciones:</b> ${esc(typeof p.specifications==='string'?p.specifications:JSON.stringify(p.specifications))}</p>`:''}${p.features?`<p class="jimport-dialog-text"><b>Funciones:</b> ${esc(typeof p.features==='string'?p.features:JSON.stringify(p.features))}</p>`:''}</section>${priceBlock}<a class="button" target="_blank" rel="noopener" href="${wa('Hola JIMPORT, deseo información sobre '+p.name+'\n'+waPrice+productPhoto(p))}">Consultar por WhatsApp ↗</a>`;
    dlg.querySelectorAll('[data-gallery-index]').forEach(btn=>btn.addEventListener('click',()=>{const url=gallery[Number(btn.dataset.galleryIndex)];const main=dlg.querySelector('#jpAiMainPhoto');if(main&&url)main.src=url;dlg.querySelectorAll('.jp-ai-photo').forEach(x=>x.classList.toggle('is-active',x===btn));}));
    dlg.querySelector('.jimport-dialog-close').onclick=()=>dlg.close();dlg.showModal();
    generateProductDescriptionWithAI(p,dlg);
  }
  
function render() {
    const q=norm(search.value), currentBrand=brandFilter.value, currentCategory=categoryFilter?.value||"";
    // Sugerencias de búsqueda inteligentes construidas con el catálogo real.
    let smartList=document.getElementById("jimportSearchSuggestions");
    if(!smartList){smartList=document.createElement("datalist");smartList.id="jimportSearchSuggestions";search.setAttribute("list",smartList.id);search.insertAdjacentElement("afterend",smartList);}
    const suggestions=new Set();
    products.forEach(p=>[p.name,p.brand,p.model,p.category].forEach(v=>{const s=String(v||"").trim();if(s.length>1)suggestions.add(s);}));
    smartList.innerHTML=[...suggestions].slice(0,500).map(v=>`<option value="${esc(v)}"></option>`).join("");
    const brands=[...new Map(products.map(p=>String(p.brand||"").trim()).filter(Boolean).map(b=>[norm(b),b.toLocaleUpperCase("es")])).values()].sort((a,b)=>a.localeCompare(b,"es"));
    brandFilter.innerHTML='<option value="">Todas las marcas</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("");
    brandFilter.value=brands.find(b=>norm(b)===norm(currentBrand))||"";
    const categories=[...new Map([...products.map(p=>String(p.category||"VARIOS").trim()||"VARIOS"),...(window.JIMPORT_EXTRA_CATEGORIES||[])].map(c=>[norm(c),c])).values()].sort((a,b)=>a.localeCompare(b,"es"));
    if(categoryFilter){
      categoryFilter.innerHTML='<option value="">Todas las categorías</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
      categoryFilter.value=categories.find(c=>norm(c)===norm(currentCategory))||"";
    }
    const brand=brandFilter.value, category=categoryFilter?.value||"";
    const list=uniqueProducts(products.filter(p=>!promotedProductIds.has(String(p.id))&&(!q||matchesSearch(p,q))&&(!brand||norm(p.brand)===norm(brand))&&(!category||norm(p.category||"VARIOS")===norm(category))));
    renderCatalogTeasers();
    renderShowcaseProducts();
    if(!brand && !category && !q){
      grid.innerHTML='<div class="empty catalog-welcome"><strong>¿Qué estás buscando?</strong><p>Selecciona una marca o categoría para explorar nuestros productos.</p></div>';
      status.textContent=products.length?`${products.length} productos disponibles. Selecciona una marca o categoría.`:'Selecciona una marca o categoría para ver los productos.';
      renderHero();return;
    }
    grid.classList.add("catalog-same-design");
    function filteredStatus(p){const raw=String(p.stock||"").toLowerCase().trim();if(raw.includes("agot")||raw.includes("sin stock"))return ["Agotado","out"];if(raw.includes("lleg")||raw.includes("próxim")||raw.includes("proxim")||raw.includes("pedido"))return ["Llegando","coming"];if(raw.includes("stock")||raw.includes("disponib"))return ["En stock","available"];return ["Consultar","unknown"];}
    grid.innerHTML=list.map(p=>`<article class="catalog-teaser catalog-teaser-clickable" data-catalog-product="${esc(p.id)}" tabindex="0" role="button" aria-label="Ver descripción de ${esc(p.name)}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="catalog-teaser-image"><span class="placeholder-icon">✳</span></div>`}<span>${esc(p.name)}</span><small>${esc(p.brand)}</small>${blackFridayProductPrice(p)}<em class="teaser-stock teaser-stock--${filteredStatus(p)[1]}"><i class="teaser-stock-dot" aria-hidden="true"></i><span>${filteredStatus(p)[0]}</span></em><button type="button" class="teaser-brand-button" data-product-cart="${esc(p.id)}">＋ Añadir al pedido</button></article>`).join("");
    grid.querySelectorAll("[data-catalog-product]").forEach(card=>{
      const open=()=>{const p=list.find(x=>String(x.id)===card.dataset.catalogProduct);if(p)openProductInfo(p);};
      card.addEventListener("click",e=>{if(e.target.closest("[data-product-cart]"))return;open();});
      card.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("[data-product-cart]")){e.preventDefault();open();}});
    });
    grid.querySelectorAll("[data-product-cart]").forEach(b=>b.addEventListener("click",()=>{if(window.JIMPORT_CART_ADD){window.JIMPORT_CART_ADD(b.dataset.productCart);b.textContent="✓ Añadido al pedido";setTimeout(()=>b.textContent="＋ Añadir al pedido",1600);}else alert("El pedido todavía está cargando. Inténtalo nuevamente.");}));
    if(!list.length)grid.innerHTML='<div class="empty">No hay productos para esta selección. <button type="button" id="emptyReset" class="clear-filters">Elegir otra marca o categoría</button></div>';
    document.getElementById("emptyReset")?.addEventListener("click",clearFilters);
    status.textContent=q?`Resultados de búsqueda: ${list.length} producto(s) encontrado(s)`:`Mostrando ${list.length} de ${products.length} productos disponibles`;
    renderHero();
  }
  // La portada usa exclusivamente las fotografías registradas en Supabase.
  function renderShowcaseProducts(){
    const target=document.getElementById('jpShowcaseTrack');
    if(!target) return;
    const allProducts=uniqueProducts(products.filter(p=>p.active!==false));
    if(!allProducts.length){
      target.innerHTML='<p class="showcase-loading">Explora nuestros productos en el catálogo</p>';
      return;
    }
    const ordered=allProducts.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es'));
    const renderCard=(p, hidden=false)=>{
      const state=String(p.stock||'').toLowerCase().includes('agot')?'Agotado':(String(p.stock||'').toLowerCase().includes('lleg')||String(p.stock||'').toLowerCase().includes('pedido')?'Llegando':'Disponible');
      const img=p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">`:`<div class="jp-showcase-image-placeholder" aria-hidden="true">✦</div>`;
      return `<article class="jp-showcase-card jp-showcase-product-card" data-showcase-product="${esc(p.id)}" ${hidden?'aria-hidden="true"':''}>
        <div class="jp-showcase-visual">${img}</div>
        <div class="jp-showcase-copy"><span class="jp-showcase-brand">${esc(p.brand||'JIMPORT')}</span><b>${esc(p.name)}</b><small>${esc(p.model||state)}</small>${blackFridayEnabled&&blackFridayDiscount(p)>0?`<span class="bf-discount-badge">-${blackFridayDiscount(p)}% BLACK FRIDAY</span>`:(!blackFridayEnabled&&displayPriceMode==='live'&&liveShowDiscount&&liveDiscount(p)>0?`<span class="jp-live-discount">-${liveDiscount(p)}% LIVE</span>`:'')}</div>
      </article>`;
    };
    const duplicated=ordered.concat(ordered);
    target.innerHTML=duplicated.map((p,i)=>renderCard(p,i>=ordered.length)).join('');
    target.querySelectorAll('[data-showcase-product]').forEach(card=>card.addEventListener('click',ev=>{
      if(ev.target.closest('a')) return;
      const p=ordered.find(x=>String(x.id)===String(card.dataset.showcaseProduct));
      if(p)openProductInfo(p);
    }));
    target.querySelectorAll('.jp-showcase-card').forEach(card=>card.addEventListener('keydown',ev=>{
      if(ev.key==='Enter' || ev.key===' '){ev.preventDefault(); const p=ordered.find(x=>String(x.id)===String(card.dataset.showcaseProduct)); if(p)openProductInfo(p);}
    }));
    target.querySelectorAll('.jp-showcase-card').forEach(card=>card.setAttribute('tabindex','0'));
  }
  let teaserTimer=null, teaserPosition=0;

  function renderCatalogTeasers(){
    const el=document.getElementById("catalogTeasers"); if(!el)return;
    const withImages=products.filter(p=>p.active!==false);
    el.hidden=Boolean(brandFilter.value || categoryFilter?.value || search.value.trim());
    if(teaserTimer){clearInterval(teaserTimer);teaserTimer=null;}
    if(!withImages.length){el.innerHTML='<p class="catalog-teaser-empty">Todavía no hay productos publicados en el catálogo.</p>';return;}
    const ordered=[...withImages].sort((a,b)=>norm(a.brand).localeCompare(norm(b.brand),'es') || norm(a.name).localeCompare(norm(b.name),'es'));
    teaserPosition=0;
    el.innerHTML=`<p class="catalog-teaser-title">Todos nuestros productos · ${ordered.length} artículos. Explora el carrusel y selecciona cualquiera para ver sus características.</p><div class="teaser-carousel"><button class="teaser-arrow" type="button" data-teaser-dir="-1" aria-label="Productos anteriores">&#10094;</button><div class="catalog-teaser-row" aria-live="off"></div><button class="teaser-arrow" type="button" data-teaser-dir="1" aria-label="Productos siguientes">&#10095;</button></div><div class="teaser-progress" aria-hidden="true"><span></span></div>`;
    const row=el.querySelector('.catalog-teaser-row');
    function teaserStatus(p){const raw=String(p.stock||'').toLowerCase().trim();if(raw.includes('agot')||raw.includes('sin stock'))return ['Agotado','out'];if(raw.includes('lleg')||raw.includes('próxim')||raw.includes('proxim')||raw.includes('pedido'))return ['Llegando','coming'];if(raw.includes('stock')||raw.includes('disponib'))return ['En stock','available'];return ['Consultar','unknown'];}
    function paint(){const count=Math.min(12,Math.max(0,ordered.length-teaserPosition));row.innerHTML=ordered.slice(teaserPosition,teaserPosition+count).map(p=>`<article class="catalog-teaser catalog-teaser-clickable" data-teaser-product="${esc(p.id)}" tabindex="0" role="button" aria-label="Ver descripción de ${esc(p.name)}">${p.image_url && /^https?:\/\//i.test(p.image_url)?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="catalog-teaser-image"><span class="placeholder-icon">✳</span></div>`}<span>${esc(p.name)}</span><small>${esc(p.brand)}</small>${blackFridayProductPrice(p)}<em class="teaser-stock teaser-stock--${teaserStatus(p)[1]}"><i class="teaser-stock-dot" aria-hidden="true"></i><span>${teaserStatus(p)[0]}</span></em><button type="button" class="teaser-brand-button" data-teaser-cart="${esc(p.id)}">＋ Añadir al pedido</button></article>`).join('');el.querySelector('.teaser-progress span').style.width=`${Math.max(8,100*(teaserPosition+1)/ordered.length)}%`;row.querySelectorAll('[data-teaser-product]').forEach(card=>{const open=()=>{const p=ordered.find(x=>String(x.id)===card.dataset.teaserProduct);if(p)openProductInfo(p);};card.addEventListener('click',e=>{if(e.target.closest('[data-teaser-cart]'))return;open();});card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-teaser-cart]')){e.preventDefault();open();}});});row.querySelectorAll('[data-teaser-cart]').forEach(b=>b.addEventListener('click',()=>{if(window.JIMPORT_CART_ADD){window.JIMPORT_CART_ADD(b.dataset.teaserCart);b.textContent='✓ Añadido al pedido';setTimeout(()=>b.textContent='＋ Añadir al pedido',1600);}else alert('El pedido todavía está cargando. Inténtalo nuevamente.');}));}
    let turning=false;
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    function step(dir){
      if(turning)return;
      turning=true;
      if(reduceMotion.matches){
        teaserPosition=dir>0?(teaserPosition+12>=ordered.length?0:teaserPosition+12):(teaserPosition===0?Math.floor((ordered.length-1)/12)*12:Math.max(0,teaserPosition-12));
        paint();turning=false;return;
      }
      row.classList.remove('wave-out','wave-in');
      row.style.setProperty('--wave-direction',dir>0?'1':'-1');
      row.classList.add('wave-out');
      setTimeout(()=>{
        teaserPosition=dir>0?(teaserPosition+12>=ordered.length?0:teaserPosition+12):(teaserPosition===0?Math.floor((ordered.length-1)/12)*12:Math.max(0,teaserPosition-12));
        paint();row.classList.remove('wave-out');row.classList.add('wave-in');
        setTimeout(()=>{row.classList.remove('wave-in');turning=false;},760);
      },760);
    }
    function autoplay(){} // Navegación exclusivamente manual.
    el.querySelectorAll('[data-teaser-dir]').forEach(b=>b.addEventListener('click',()=>{step(Number(b.dataset.teaserDir));autoplay();}));
    paint();autoplay();
  }
  function renderHero(){
    const standard=document.getElementById('jpStandardHero');
    const blackFriday=document.getElementById('jpBlackFridayHero');
    const liveHero=document.getElementById('jpLiveHero');
    const liveActive=displayPriceMode==='live'&&!blackFridayEnabled;
    if(standard)standard.hidden=blackFridayEnabled||liveActive;
    if(blackFriday)blackFriday.hidden=!blackFridayEnabled;
    if(liveHero)liveHero.hidden=!liveActive;
    if(liveActive){renderLiveHero();if(heroTimer){clearInterval(heroTimer);heroTimer=null;}return;}
    if(!blackFridayEnabled){
      const featured=products.filter(p=>p.active!==false && !promotedProductIds.has(String(p.id)));
      const visual=document.getElementById('heroProductVisual'), name=document.getElementById('heroProductName'), brand=document.getElementById('heroProductBrand'), dots=document.getElementById('heroDots');
      if(visual&&name&&brand&&dots){
        if(!featured.length){visual.innerHTML='<div class="device">✦</div>';name.textContent='Tecnología para tu día a día';brand.textContent='UGREEN · Anker';dots.innerHTML='';}
        else{
          heroIndex=((heroIndex%featured.length)+featured.length)%featured.length;const p=featured[heroIndex];
          visual.innerHTML=p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" onerror="this.outerHTML='<div class=&quot;device&quot;>✦</div>'">`:'<div class="device">✦</div>';
          name.textContent=p.name+(p.stock==='Agotado'?' · Agotado':'');brand.textContent=`${p.brand||'JIMPORT'} · ${displayPriceText(p)}`;
          dots.innerHTML=featured.map((_,i)=>`<button type="button" class="hero-dot ${i===heroIndex?'active':''}" data-index="${i}" aria-label="Ver producto ${i+1}"></button>`).join('');
          dots.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{heroIndex=Number(b.dataset.index);renderHero();restartHero();}));
        }
      }
      if(heroTimer){clearInterval(heroTimer);heroTimer=null;}
      return;
    }
    const discounted=uniqueProducts(products.filter(p=>p.active!==false)).filter(p=>blackFridayPrice(p)>0).sort((a,b)=>blackFridayPrice(a)-blackFridayPrice(b));
    const topDiscount=document.getElementById('heroTopDiscount');
    const dealCount=document.getElementById('heroDealCount');
    const track=document.getElementById('heroBlackFridayTrack');
    if(topDiscount) topDiscount.textContent=discounted.length?`Hasta ${Math.max(...discounted.map(blackFridayDiscount))}% OFF`:'Precios especiales';
    if(dealCount) dealCount.textContent=`${discounted.length} ofertas con descuento`;
    if(!track)return;
    const featured=(discounted.length?discounted:uniqueProducts(products.filter(p=>p.active!==false))).slice(0,6);
    if(!featured.length){track.innerHTML='<p class="showcase-loading">No hay productos publicados para mostrar.</p>';return;}
    track.innerHTML=featured.map(p=>{
      const discount=blackFridayDiscount(p), regular=blackFridayRegularPrice(p), sale=blackFridayPrice(p);
      return `<article class="jp-bf-card" data-bf-product="${esc(p.id)}" tabindex="0" role="button" aria-label="Ver oferta de ${esc(p.name)}">${discount?`<span class="jp-bf-card-badge">-${discount}%</span>`:''}<div class="jp-bf-card-media">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">`:`<div class="jp-bf-card-placeholder">✦</div>`}</div><div class="jp-bf-card-copy"><small>${esc(p.brand||'JIMPORT')}</small><h3>${esc(p.name)}</h3>${discount?`<p class="jp-bf-card-prices"><del>${money(regular)}</del><strong>${money(sale)}</strong></p><span class="jp-bf-card-save">BLACK FRIDAY</span>`:`<p class="jp-bf-card-prices"><strong>${displayPriceText(p)}</strong></p><span class="jp-bf-card-save">Precio especial</span>`}</div></article>`;
    }).join('');
    track.querySelectorAll('[data-bf-product]').forEach(card=>{
      const open=()=>{const p=featured.find(x=>String(x.id)===card.dataset.bfProduct);if(p)openProductInfo(p);};
      card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }
  function renderLiveHero(){
    const active=uniqueProducts(products.filter(p=>p.active!==false));
    const count=document.getElementById('heroLiveCount'),track=document.getElementById('heroLiveTrack');
    if(count)count.textContent=`${active.length} disponibles`;
    if(!track)return;
    const featured=active.filter(p=>livePrice(p)>0).slice(0,6);
    if(!featured.length){track.innerHTML='<p class="showcase-loading">No hay productos con precios disponibles.</p>';return;}
    track.innerHTML=featured.map(p=>{const d=liveDiscount(p),price=livePrice(p);return `<article class="jp-bf-card jp-live-card" data-live-product="${esc(p.id)}" tabindex="0" role="button" aria-label="Ver ${esc(p.name)} con precio LIVE">${liveShowDiscount&&d>0?`<span class="jp-bf-card-badge">-${d}%</span>`:''}<div class="jp-bf-card-media">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:'<div class="jp-bf-card-placeholder">✦</div>'}</div><div class="jp-bf-card-copy"><small>${esc(p.brand||'JIMPORT')}</small><h3>${esc(p.name)}</h3><p class="jp-bf-card-prices">${liveShowDiscount&&d>0?`<del>${money(retailPrice(p))}</del>`:''}<strong>${money(price)}</strong></p><span class="jp-bf-card-save">PRECIO LIVE</span></div></article>`;}).join('');
    track.querySelectorAll('[data-live-product]').forEach(card=>{const open=()=>{const p=featured.find(x=>String(x.id)===card.dataset.liveProduct);if(p)openProductInfo(p);};card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
  }
  function stepHero(dir){}
  function restartHero(){if(heroTimer)clearInterval(heroTimer);heroTimer=null;}
  document.getElementById('heroPrev')?.addEventListener('click',()=>stepHero(-1));document.getElementById('heroNext')?.addEventListener('click',()=>stepHero(1));

  let promotions = [], promoIndex = 0, promoTimer = null;
  async function loadPromotions(){
    if(!client){ initPromoControls(); return; }
    const {data,error}=await client.from("promotions").select("*").eq("active",true).order("created_at",{ascending:false});
    if(error){ console.warn("Promociones: ejecuta el bloque actualizado de schema.sql en Supabase.",error); initPromoControls(); return; }
    promotions=data||[]; promotedProductIds=new Set(promotions.filter(p=>p.product_id).map(p=>String(p.product_id))); renderPromotion(); initPromoControls(); render();
  }
  const moneyPromo=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD"}).format(Number(n));
  function showPromotionInfo(p){
    let dlg=document.getElementById('jimportPromotionInfoDialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='jimportPromotionInfoDialog';dlg.className='jimport-product-dialog';document.body.appendChild(dlg);dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});}
    const promoDiscount=blackFridayEnabled?blackFridayPromoDiscount(p):0;
    const price=p.sale_price!=null?`${promoDiscount?`<span class="bf-discount-badge">-${promoDiscount}% BLACK FRIDAY</span>`:''}<strong class="jimport-dialog-price">${moneyPromo(p.sale_price)}</strong>`:'';
    const old=p.sale_price!=null?`<p class="jimport-dialog-model"><del>${moneyPromo(blackFridayEnabled?blackFridayPromoRegular(p):(p.regular_price??p.sale_price))}</del></p>`:'';
    dlg.innerHTML=`<div class="jimport-dialog-head"><strong>Descripción de la promoción</strong><button type="button" class="jimport-dialog-close" aria-label="Cerrar descripción">✕</button></div>${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.title)}" style="width:100%;max-height:230px;object-fit:contain">`:''}<h3>${esc(p.title)}</h3><p class="jimport-dialog-text">${esc(p.description||'Consulta los detalles de esta promoción con nuestro equipo.')}</p><section class="jp-ai-section"><h4>Detalles inteligentes de la promoción</h4><div id="jpPromoAIContent" aria-live="polite"><p class="jp-ai-loading">Preparando información…</p></div></section>${old}${price}<a class="button" target="_blank" rel="noopener noreferrer" href="${wa(`Hola JIMPORT, deseo información sobre la promoción ${p.title}${p.sale_price!=null?'\nPrecio: '+moneyPromo(p.sale_price):''}`)}">Consultar por WhatsApp ↗</a>`;
    dlg.querySelector('.jimport-dialog-close').onclick=()=>dlg.close();
    dlg.showModal();
    const target=dlg.querySelector('#jpPromoAIContent');
    const source={name:p.title||'Promoción JIMPORT',brand:'JIMPORT',category:'Promoción',description:p.description||'',specifications:'',features:'Oferta promocional. Precio y condiciones se muestran en la ficha.'};
    window.JIMPORT_AI_GENERATE(source,'promotion-'+(p.id||p.title)).then(result=>{if(target?.isConnected)window.JIMPORT_AI_RENDER(target,result);}).catch(error=>{if(target?.isConnected)target.innerHTML=`<p class="jp-ai-note">${esc(error.message||'IA no disponible. Se mantiene la información registrada de la promoción.')}</p>`;});
  }
  function renderPromotion(){
    const slide=document.getElementById("promoSlide"), dots=document.getElementById("promoDots");
    if(!slide||!dots)return;
    if(!promotions.length){
      slide.innerHTML='<div class="promo-art"><div class="promo-orbit"></div><span class="promo-spark">✦</span></div><div class="promo-copy"><span class="promo-kicker">JIMPORT · PROMOCIONES</span><h3>Ofertas especiales te esperan</h3><p>Pronto encontrarás aquí nuestras promociones. Escríbenos para conocer las ofertas actuales.</p><a class="button" href="'+wa()+'" target="_blank" rel="noopener">Consultar ofertas ↗</a></div>';
      dots.innerHTML=""; return;
    }
    promoIndex=((promoIndex%promotions.length)+promotions.length)%promotions.length;
    const p=promotions[promoIndex];
    const whatsappHref=wa(`Hola JIMPORT, vi la promoción "${p.title}" en su página web.${p.sale_price!=null?`\n💵 Precio de promoción: ${moneyPromo(p.sale_price)}`:""} ¿Podrían darme más información y confirmar disponibilidad?`);
    slide.innerHTML=`<div class="promo-art"><img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy" onerror="this.style.display='none'"><div class="promo-orbit"></div></div><div class="promo-copy"><span class="promo-kicker">JIMPORT · OFERTA ESPECIAL</span><h3>${esc(p.title)}</h3><p class="promo-hint">Pulsa la promoción para ver su descripción y detalles</p>${p.sale_price!=null?`<p class="promo-price">${blackFridayEnabled&&blackFridayPromoDiscount(p)>0?`<span class="bf-discount-badge">-${blackFridayPromoDiscount(p)}% BLACK FRIDAY</span>`:""}<del>${p.regular_price!=null?esc(moneyPromo(p.regular_price)):""}</del> <strong>${esc(moneyPromo(p.sale_price))}</strong></p>`:""}</div>`;
    slide.style.cursor='pointer';
    slide.onclick=()=>showPromotionInfo(p);
    slide.setAttribute('role','button');slide.setAttribute('tabindex','0');
    slide.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showPromotionInfo(p);}};
    dots.innerHTML=promotions.map((_,i)=>`<button type="button" class="promo-dot ${i===promoIndex?"active":""}" data-index="${i}" aria-label="Ver promoción ${i+1}"></button>`).join("");
    dots.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{promoIndex=Number(b.dataset.index);renderPromotion();restartPromo();}));
  }
  function stepPromo(dir){if(!promotions.length)return;promoIndex=(promoIndex+dir+promotions.length)%promotions.length;renderPromotion();restartPromo();}
  function restartPromo(){if(promoTimer)clearInterval(promoTimer);promoTimer=null;}
  function initPromoControls(){
    document.getElementById("promoPrev")?.addEventListener("click",()=>stepPromo(-1));
    document.getElementById("promoNext")?.addEventListener("click",()=>stepPromo(1));
    renderPromotion(); restartPromo();
  }
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  document.querySelectorAll('[data-brand]').forEach(link=>link.addEventListener('click',()=>{
    search.value=''; if(categoryFilter)categoryFilter.value='';
    const selected=link.dataset.brand;
    const match=[...brandFilter.options].find(o=>norm(o.value)===norm(selected));
    brandFilter.value=match?match.value:selected; render();
  }));
  const reviewForm=document.getElementById('reviewForm'), reviewsList=document.getElementById('reviewsList');
  async function loadReviews(){
    if(!client){reviewsList.textContent='Las opiniones estarán disponibles cuando se conecte la base de datos.';return;}
    const {data,error}=await client.from('reviews').select('name,rating,comment,created_at,verified_purchase').eq('approved',true).order('created_at',{ascending:false}).limit(30);
    if(error){reviewsList.textContent='Las opiniones estarán disponibles cuando se configure la tabla de reseñas.';return;}
    const summary=document.getElementById('reviewSummary');
    const ratings=(data||[]).map(r=>Math.max(1,Math.min(5,Number(r.rating)||1)));
    const avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0;
    if(summary)summary.textContent=data.length?`${avg.toFixed(1)} de 5 estrellas · ${data.length} opiniones publicadas (últimas 30)`:'Sé la primera persona en compartir tu experiencia';
    if(!data.length){reviewsList.textContent='Todavía no hay opiniones publicadas. ¡Sé la primera persona en compartir tu experiencia!';return;}
    const getInitials=name=>String(name||'Cliente').trim().split(/\s+/).slice(0,2).map(w=>w.charAt(0).toUpperCase()).join('');
    const card=r=>{
      const rating=Math.max(1,Math.min(5,Number(r.rating)||1));
      return `<article class="jm-op-card" aria-label="Opinión de ${esc(r.name)}, ${rating} de 5 estrellas">
        <span class="jm-op-avatar" aria-hidden="true">${esc(getInitials(r.name))}</span>
        <div class="jm-op-content"><div class="jm-op-top"><strong>${esc(r.name)}</strong>${r.verified_purchase?'<span class="jm-op-check" title="Compra verificada" aria-label="Compra verificada">✓</span>':''}<span class="jm-op-stars" aria-label="${rating} de 5 estrellas">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span></div><p title="${esc(r.comment)}">${esc(r.comment)}</p></div>
      </article>`;
    };
    const rows=[data.filter((_,i)=>i%2===0),data.filter((_,i)=>i%2===1)];
    if(!rows[1].length)rows[1]=[...rows[0]];
    reviewsList.innerHTML=`<div class="jm-op-marquee" aria-label="Opiniones verificadas publicadas por clientes de JIMPORT">${rows.map((row,i)=>{
      const normalized=row.length===1?Array(4).fill(row[0]):row.length===2?[...row,...row]:row;
      const items=normalized.map(card).join('');
      return `<div class="jm-op-viewport"><div class="jm-op-track jm-op-track-${i+1}"><div class="jm-op-set">${items}</div><div class="jm-op-set" aria-hidden="true">${items}</div></div></div>`;
    }).join('')}</div>`;
  }
  reviewForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const msg=document.getElementById('reviewMessage'), btn=document.getElementById('reviewSubmit');
    if(!client){msg.textContent='El formulario requiere configurar Supabase.';return;}
    const firstName=document.getElementById('reviewName').value.trim(), lastName=document.getElementById('reviewLastName').value.trim(), name=`${firstName} ${lastName}`.trim(), comment=document.getElementById('reviewComment').value.trim(), rating=Number(document.getElementById('reviewRating').value);
    if(!firstName||!lastName||name.length>70||comment.length<10||rating<1||rating>5){msg.textContent='Completa todos los campos correctamente.';return;}
    btn.disabled=true;msg.textContent='Enviando opinión…';
    const code=document.getElementById('reviewCode').value.trim();
    const {error}=await client.rpc('submit_verified_review',{purchase_code:code,reviewer_name:name,review_rating:rating,review_comment:comment});
    btn.disabled=false;
    if(error){msg.textContent='No se pudo verificar la compra o el código ya fue utilizado. Comprueba el código y vuelve a intentarlo.';return;}
    reviewForm.reset();msg.textContent='¡Gracias! Tu opinión fue recibida y se publicará después de su aprobación.';
  });
  const ratingPicker=document.getElementById('ratingPicker'), ratingSelect=document.getElementById('reviewRating');
  function paintRating(){const value=Number(ratingSelect?.value||0);ratingPicker?.querySelectorAll('button').forEach(button=>{const selected=Number(button.dataset.rating)<=value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(Number(button.dataset.rating)===value));});}
  ratingPicker?.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{ratingSelect.value=button.dataset.rating;paintRating();}));
  ratingSelect?.addEventListener('change',paintRating);reviewForm?.addEventListener('reset',()=>requestAnimationFrame(paintRating));paintRating();
  if(reviewsList) loadReviews();
  function clearFilters(){search.value="";brandFilter.value="";if(categoryFilter)categoryFilter.value="";render();}
  document.getElementById("clearFilters")?.addEventListener("click",clearFilters);
  const initialSearch=new URLSearchParams(location.search).get("buscar");
  if(initialSearch){search.value=initialSearch;brandFilter.value="";if(categoryFilter)categoryFilter.value="";}
  search.addEventListener("input",render); brandFilter.addEventListener("change",render); categoryFilter?.addEventListener("change",render); load().then(restartHero); loadPromotions();
})();
