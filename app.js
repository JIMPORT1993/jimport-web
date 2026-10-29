(() => {
  const cfg = window.JIMPORT_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("PEGA_") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const grid = document.getElementById("productGrid"), status = document.getElementById("status");
  const search = document.getElementById("search"), brandFilter = document.getElementById("brandFilter"), categoryFilter = document.getElementById("categoryFilter");
  const money = n => new Intl.NumberFormat("es-EC", {style:"currency",currency:cfg.CURRENCY || "USD"}).format(Number(n || 0));
  const wa = (msg="Hola JIMPORT, quisiera información sobre sus productos.") => `https://wa.me/${(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
  ["headerWhatsapp","contactWhatsapp","floatWhatsapp"].forEach(id => { const el=document.getElementById(id); el.href=wa(); });
  document.getElementById("year").textContent = new Date().getFullYear();
  let products = [], heroIndex = 0, heroTimer = null;
  const knownBrands=["UGREEN","Anker","DJI","Marvo"];
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
      const all=[]; const batchSize=500;
      for(let offset=0;offset<50000;offset+=batchSize){
        const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false}).range(offset,offset+batchSize-1);
        if(error) throw error;
        all.push(...(data||[]));
        if(!data || data.length<batchSize) break;
      }
      // Los productos antiguos sin columna active se consideran visibles.
      products=all.filter(p=>p.active!==false);
      render();
    } catch(error){
      console.error("JIMPORT: error al cargar productos",error);
      products=[];
      render();
      status.textContent="No se pudieron recuperar los productos de Supabase. Revisa la conexión y los permisos de lectura.";
    }
  }
  function norm(v){return String(v??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");}
  function render() {
    const q=norm(search.value), currentBrand=brandFilter.value, currentCategory=categoryFilter?.value||"";
    const brands=[...new Set([...knownBrands,...products.map(p=>String(p.brand||"").trim()).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,"es"));
    brandFilter.innerHTML='<option value="">Todas las marcas</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("");
    brandFilter.value=brands.find(b=>norm(b)===norm(currentBrand))||"";
    const categories=[...new Set(products.map(p=>String(p.category||"VARIOS").trim()||"VARIOS"))].sort((a,b)=>a.localeCompare(b,"es"));
    if(categoryFilter){
      categoryFilter.innerHTML='<option value="">Todas las categorías</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
      categoryFilter.value=categories.find(c=>norm(c)===norm(currentCategory))||"";
    }
    const brand=brandFilter.value, category=categoryFilter?.value||"";
    const list=products.filter(p=>(!brand||norm(p.brand)===norm(brand))&&(!category||norm(p.category||"VARIOS")===norm(category))&&(!q||norm([p.name,p.brand,p.model,p.description,p.category].join(" ")).includes(q)));
    renderCatalogTeasers();
    if(!brand && !category){
      grid.innerHTML='<div class="empty catalog-welcome"><strong>¿Qué estás buscando?</strong><p>Selecciona una marca o categoría para explorar nuestros productos.</p></div>';
      status.textContent=products.length?`${products.length} productos disponibles. Selecciona una marca o categoría.`:'Selecciona una marca o categoría para ver los productos.';
      renderHero();return;
    }
    grid.innerHTML=list.map(p=>{const out=p.stock==="Agotado";return `<article class="product-card ${out?"is-out-of-stock":""}"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;placeholder-icon&quot;>✳</span>'">`:`<span class="placeholder-icon">✳</span>`}<span class="stock ${out?"out":p.stock==="Bajo pedido"?"order":""}">${out?"Producto no disponible":esc(p.stock||"Consultar")}</span>${out?'<span class="unavailable-overlay">AGOTADO</span>':""}</div><div class="product-info"><span class="product-brand">${esc(p.brand||"JIMPORT")}</span><span class="product-category">${esc(p.category||"VARIOS")}</span><h3>${esc(p.name)}</h3><p class="product-model">${esc(p.model||"")}</p><p class="product-description">${esc(p.description||"Consulta detalles por WhatsApp.")}</p><div class="price-line"><strong>${money(p.price)}</strong>${p.old_price?`<del>${money(p.old_price)}</del>`:""}</div><a class="button product-cta ${out?"button-unavailable":""}" href="${wa(`Hola JIMPORT, me interesa: ${p.name}${p.model?" ("+p.model+")":""}. ${out?"¿Cuándo estará disponible nuevamente?":"¿Está disponible?"}`)}" target="_blank" rel="noopener">${out?"Consultar reposición ↗":"Consultar por WhatsApp ↗"}</a></div></article>`}).join("");
    if(!list.length)grid.innerHTML='<div class="empty">No hay productos para esta selección. <button type="button" id="emptyReset" class="clear-filters">Elegir otra marca o categoría</button></div>';
    document.getElementById("emptyReset")?.addEventListener("click",clearFilters);
    status.textContent=`Mostrando ${list.length} de ${products.length} productos disponibles`;
    renderHero();
  }
  function renderCatalogTeasers(){
    const el=document.getElementById("catalogTeasers"); if(!el)return;
    // Mostrar únicamente fotografías auténticas ya registradas en Supabase.
    const withImages=products.filter(p=>p.image_url && /^https?:\/\//i.test(p.image_url));
    const selected=[];
    for(const brand of knownBrands){const p=withImages.find(p=>p.brand?.toLowerCase()===brand.toLowerCase()&&!selected.includes(p));if(p)selected.push(p);if(selected.length===3)break;}
    for(const p of withImages){if(selected.length===3)break;if(!selected.includes(p))selected.push(p);}
    el.hidden=Boolean(brandFilter.value || categoryFilter?.value);
    if(!selected.length){el.innerHTML='<p class="catalog-teaser-empty">Elige UGREEN, Anker, DJI o Marvo para descubrir nuestro catálogo.</p>';return;}
    el.innerHTML='<p class="catalog-teaser-title">Un vistazo a nuestros productos. Elige una marca o categoría para ver más.</p><div class="catalog-teaser-row">'+selected.map(p=>`<button type="button" class="catalog-teaser" data-teaser-brand="${esc(p.brand)}" aria-label="Explorar productos ${esc(p.brand)}"><img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy"><span>${esc(p.name)}</span><small>${esc(p.brand)}</small></button>`).join('')+'</div>';
    el.querySelectorAll('[data-teaser-brand]').forEach(b=>b.addEventListener('click',()=>{brandFilter.value=[...brandFilter.options].find(o=>norm(o.value)===norm(b.dataset.teaserBrand))?.value||"";categoryFilter.value="";search.value="";render();}));
  }
  function renderHero(){
    const featured=products.filter(p=>p.active!==false);
    const visual=document.getElementById("heroProductVisual"), name=document.getElementById("heroProductName"), brand=document.getElementById("heroProductBrand"), dots=document.getElementById("heroDots");
    if(!visual||!name||!brand||!dots)return;
    if(!featured.length){visual.innerHTML='<div class="device">✦</div>';name.textContent="Tecnología para tu día a día";brand.textContent="UGREEN · Anker";dots.innerHTML="";return;}
    heroIndex=((heroIndex%featured.length)+featured.length)%featured.length;const p=featured[heroIndex];
    visual.innerHTML=p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" onerror="this.outerHTML='<div class=&quot;device&quot;>✦</div>'">`:'<div class="device">✦</div>';
    name.textContent=p.name+(p.stock==="Agotado"?" · Agotado":"");brand.textContent=`${p.brand||"JIMPORT"} · ${money(p.price)}`;
    dots.innerHTML=featured.map((_,i)=>`<button type="button" class="hero-dot ${i===heroIndex?"active":""}" data-index="${i}" aria-label="Ver producto ${i+1}"></button>`).join("");
    dots.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{heroIndex=Number(b.dataset.index);renderHero();restartHero();}));
  }
  function stepHero(dir){const featured=products.filter(p=>p.active!==false);if(!featured.length)return;heroIndex=(heroIndex+dir+featured.length)%featured.length;renderHero();restartHero();}
  function restartHero(){if(heroTimer)clearInterval(heroTimer);heroTimer=setInterval(()=>stepHero(1),4500);}
  document.getElementById("heroPrev")?.addEventListener("click",()=>stepHero(-1));document.getElementById("heroNext")?.addEventListener("click",()=>stepHero(1));

  let promotions = [], promoIndex = 0, promoTimer = null;
  async function loadPromotions(){
    if(!client){ initPromoControls(); return; }
    const {data,error}=await client.from("promotions").select("*").eq("active",true).order("created_at",{ascending:false});
    if(error){ console.warn("Promociones: ejecuta el bloque actualizado de schema.sql en Supabase.",error); initPromoControls(); return; }
    promotions=data||[]; renderPromotion(); initPromoControls();
  }
  function renderPromotion(){
    const slide=document.getElementById("promoSlide"), dots=document.getElementById("promoDots");
    if(!slide||!dots)return;
    if(!promotions.length){
      slide.innerHTML='<div class="promo-art"><div class="promo-orbit"></div><span class="promo-spark">✦</span></div><div class="promo-copy"><span class="promo-kicker">JIMPORT · PROMOCIONES</span><h3>Ofertas especiales te esperan</h3><p>Pronto encontrarás aquí nuestras promociones. Escríbenos para conocer las ofertas actuales.</p><a class="button" href="'+wa()+'" target="_blank" rel="noopener">Consultar ofertas ↗</a></div>';
      dots.innerHTML=""; return;
    }
    promoIndex=((promoIndex%promotions.length)+promotions.length)%promotions.length;
    const p=promotions[promoIndex], href=p.link_url||"#productos";
    slide.innerHTML=`<div class="promo-art"><img src="${esc(p.image_url)}" alt="${esc(p.title)}" onerror="this.style.display='none'"><div class="promo-orbit"></div></div><div class="promo-copy"><span class="promo-kicker">JIMPORT · OFERTA ESPECIAL</span><h3>${esc(p.title)}</h3><p>${esc(p.description||"Descubre esta promoción especial de JIMPORT.")}</p><a class="button" href="${esc(href)}" ${/^https?:\/\//i.test(href)?'target=\"_blank\" rel=\"noopener\"':''}>${esc(p.button_text||"Ver oferta")} ↗</a></div>`;
    dots.innerHTML=promotions.map((_,i)=>`<button type="button" class="promo-dot ${i===promoIndex?"active":""}" data-index="${i}" aria-label="Ver promoción ${i+1}"></button>`).join("");
    dots.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{promoIndex=Number(b.dataset.index);renderPromotion();restartPromo();}));
  }
  function stepPromo(dir){if(!promotions.length)return;promoIndex=(promoIndex+dir+promotions.length)%promotions.length;renderPromotion();restartPromo();}
  function restartPromo(){if(promoTimer)clearInterval(promoTimer);if(promotions.length>1)promoTimer=setInterval(()=>stepPromo(1),3000);}
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
    const {data,error}=await client.from('reviews').select('name,rating,comment,created_at').eq('approved',true).order('created_at',{ascending:false}).limit(30);
    if(error){reviewsList.textContent='Las opiniones estarán disponibles cuando se configure la tabla de reseñas.';return;}
    const summary=document.getElementById('reviewSummary'); if(summary){const avg=data.length?data.reduce((a,r)=>a+Number(r.rating),0)/data.length:0;summary.textContent=data.length?`★ ${avg.toFixed(1)} / 5 · ${data.length} opiniones publicadas (últimas 30)`:'Sé la primera persona en compartir tu experiencia';} reviewsList.innerHTML=data.length?data.map(r=>`<article class="review-card"><strong>${esc(r.name)}</strong><span class="review-stars" aria-label="${r.rating} de 5 estrellas">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><p>${esc(r.comment)}</p><small>${new Date(r.created_at).toLocaleDateString('es-EC')}</small></article>`).join(''):'Todavía no hay opiniones publicadas. ¡Sé el primero en compartir tu experiencia!';
  }
  reviewForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const msg=document.getElementById('reviewMessage'), btn=document.getElementById('reviewSubmit');
    if(!client){msg.textContent='El formulario requiere configurar Supabase.';return;}
    const firstName=document.getElementById('reviewName').value.trim(), lastName=document.getElementById('reviewLastName').value.trim(), name=`${firstName} ${lastName}`.trim(), comment=document.getElementById('reviewComment').value.trim(), rating=Number(document.getElementById('reviewRating').value);
    if(!firstName||!lastName||name.length>70||comment.length<10||rating<1||rating>5){msg.textContent='Completa todos los campos correctamente.';return;}
    btn.disabled=true;msg.textContent='Enviando opinión…';
    const {error}=await client.from('reviews').insert({name,comment,rating});
    btn.disabled=false;
    if(error){msg.textContent='No pudimos enviar tu opinión. Intenta nuevamente.';return;}
    reviewForm.reset();msg.textContent='¡Gracias! Tu opinión fue recibida y se publicará después de su aprobación.';
  });
  const ratingPicker=document.getElementById('ratingPicker'), ratingSelect=document.getElementById('reviewRating');
  function paintRating(){const value=Number(ratingSelect?.value||0);ratingPicker?.querySelectorAll('button').forEach(button=>{const selected=Number(button.dataset.rating)<=value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(Number(button.dataset.rating)===value));});}
  ratingPicker?.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{ratingSelect.value=button.dataset.rating;paintRating();}));
  ratingSelect?.addEventListener('change',paintRating);reviewForm?.addEventListener('reset',()=>requestAnimationFrame(paintRating));paintRating();
  loadReviews();
  function clearFilters(){search.value="";brandFilter.value="";if(categoryFilter)categoryFilter.value="";render();}
  document.getElementById("clearFilters")?.addEventListener("click",clearFilters);
  search.addEventListener("input",render); brandFilter.addEventListener("change",render); categoryFilter?.addEventListener("change",render); load().then(restartHero); loadPromotions();
})();