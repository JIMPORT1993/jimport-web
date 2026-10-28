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
  const demo = [
    {id:"demo1",name:"Hub USB-C 6 en 1",brand:"UGREEN",model:"Ejemplo",price:29.90,old_price:null,stock:"En stock",image_url:"",description:"Conecta tus dispositivos con una sola solución.",demo:true},
    {id:"demo2",name:"Cargador rápido USB-C",brand:"Anker",model:"Ejemplo",price:24.90,old_price:null,stock:"Bajo pedido",image_url:"",description:"Carga práctica para tus dispositivos compatibles.",demo:true},
    {id:"demo3",name:"Cable USB-C",brand:"UGREEN",model:"Ejemplo",price:8.50,old_price:null,stock:"Agotado",image_url:"",description:"Accesorio para uso diario.",demo:true}
  ];
  async function load() {
    if (!client) { products=demo; status.textContent="Vista de demostración. Configura Supabase para publicar tu catálogo real."; render(); return; }
    const {data,error}=await client.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
    if(error){ status.textContent="No se pudo cargar el catálogo. Revisa la configuración de Supabase."; console.error(error); return; }
    products=data||[]; status.textContent=products.length ? `${products.length} producto(s) disponibles` : "Estamos actualizando el catálogo. Escríbenos por WhatsApp para consultar.";
    render();
  }
  function render() {
    const q=(search.value||"").toLowerCase(), brand=brandFilter.value, category=categoryFilter?.value||"";
    const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();
    const old=brandFilter.value; brandFilter.innerHTML='<option value="">Todas las marcas</option>'+brands.map(b=>`<option>${esc(b)}</option>`).join(""); brandFilter.value=brands.includes(old)?old:"";
    const categories=[...new Set(products.map(p=>p.category||"VARIOS").filter(Boolean))].sort(); const oldCategory=categoryFilter?.value||""; if(categoryFilter){categoryFilter.innerHTML='<option value="">Todas las categorías</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");categoryFilter.value=categories.includes(oldCategory)?oldCategory:"";} const list=products.filter(p=>(!brand||p.brand===brand)&&(!category||(p.category||"VARIOS")===category)&&[p.name,p.brand,p.model,p.description,p.category].join(" ").toLowerCase().includes(q));
    grid.innerHTML=list.map(p=>{const out=p.stock==="Agotado";return `<article class="product-card ${out?"is-out-of-stock":""}"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;placeholder-icon&quot;>✳</span>'">`:`<span class="placeholder-icon">✳</span>`}<span class="stock ${out?"out":p.stock==="Bajo pedido"?"order":""}">${out?"Producto no disponible":esc(p.stock||"Consultar")}</span>${out?'<span class="unavailable-overlay">AGOTADO</span>':""}</div><div class="product-info"><span class="product-brand">${esc(p.brand||"JIMPORT")}</span><span class="product-category">${esc(p.category||"VARIOS")}</span><h3>${esc(p.name)}</h3><p class="product-model">${esc(p.model||"")}</p><p class="product-description">${esc(p.description||"Consulta detalles por WhatsApp.")}</p><div class="price-line"><strong>${money(p.price)}</strong>${p.old_price?`<del>${money(p.old_price)}</del>`:""}</div><a class="button product-cta ${out?"button-unavailable":""}" href="${wa(`Hola JIMPORT, me interesa: ${p.name}${p.model?" ("+p.model+")":""}. ${out?"¿Cuándo estará disponible nuevamente?":"¿Está disponible?"}`)}" target="_blank" rel="noopener">${out?"Consultar reposición ↗":"Consultar por WhatsApp ↗"}</a></div></article>`}).join("");
    if(!list.length) grid.innerHTML='<div class="empty">No encontramos productos con esa búsqueda.</div>';
    if(products.length) status.textContent=`${products.length} producto(s) en catálogo`;
    renderHero();
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
  search.addEventListener("input",render); brandFilter.addEventListener("change",render); categoryFilter?.addEventListener("change",render); load().then(restartHero); loadPromotions();
})();