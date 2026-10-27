(() => {
  const cfg = window.JIMPORT_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("PEGA_") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const grid = document.getElementById("productGrid"), status = document.getElementById("status");
  const search = document.getElementById("search"), brandFilter = document.getElementById("brandFilter");
  const money = n => new Intl.NumberFormat("es-EC", {style:"currency",currency:cfg.CURRENCY || "USD"}).format(Number(n || 0));
  const wa = (msg="Hola JIMPORT, quisiera información sobre sus productos.") => `https://wa.me/${(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
  ["headerWhatsapp","contactWhatsapp","floatWhatsapp"].forEach(id => { const el=document.getElementById(id); el.href=wa(); });
  document.getElementById("year").textContent = new Date().getFullYear();
  let products = [];
  const demo = [
    {id:"demo1",name:"Hub USB-C 6 en 1",brand:"UGREEN",model:"Ejemplo",price:29.90,old_price:null,stock:"En stock",image_url:"",description:"Conecta tus dispositivos con una sola solución.",demo:true},
    {id:"demo2",name:"Cargador rápido USB-C",brand:"Anker",model:"Ejemplo",price:24.90,old_price:null,stock:"Bajo pedido",image_url:"",description:"Carga práctica para tus dispositivos compatibles.",demo:true},
    {id:"demo3",name:"Cable USB-C",brand:"UGREEN",model:"Ejemplo",price:8.50,old_price:null,stock:"En stock",image_url:"",description:"Accesorio para uso diario.",demo:true}
  ];
  async function load() {
    if (!client) { products=demo; status.textContent="Vista de demostración. Configura Supabase para publicar tu catálogo real."; render(); return; }
    const {data,error}=await client.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
    if(error){ status.textContent="No se pudo cargar el catálogo. Revisa la configuración de Supabase."; console.error(error); return; }
    products=data||[]; status.textContent=products.length ? `${products.length} producto(s) disponibles` : "Estamos actualizando el catálogo. Escríbenos por WhatsApp para consultar.";
    render();
  }
  function render() {
    const q=(search.value||"").toLowerCase(), brand=brandFilter.value;
    const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();
    const old=brandFilter.value; brandFilter.innerHTML='<option value="">Todas las marcas</option>'+brands.map(b=>`<option>${esc(b)}</option>`).join(""); brandFilter.value=brands.includes(old)?old:"";
    const list=products.filter(p=>(!brand||p.brand===brand)&&[p.name,p.brand,p.model,p.description].join(" ").toLowerCase().includes(q));
    grid.innerHTML=list.map(p=>`<article class="product-card"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;placeholder-icon&quot;>✳</span>'">`:`<span class="placeholder-icon">✳</span>`}<span class="stock ${p.stock==="Agotado"?"out":p.stock==="Bajo pedido"?"order":""}">${esc(p.stock||"Consultar")}</span></div><div class="product-info"><span class="product-brand">${esc(p.brand||"JIMPORT")}</span><h3>${esc(p.name)}</h3><p class="product-model">${esc(p.model||"")}</p><p class="product-description">${esc(p.description||"Consulta detalles por WhatsApp.")}</p><div class="price-line"><strong>${money(p.price)}</strong>${p.old_price?`<del>${money(p.old_price)}</del>`:""}</div><a class="button product-cta" href="${wa(`Hola JIMPORT, me interesa: ${p.name}${p.model?" ("+p.model+")":""}. ¿Está disponible?`)}" target="_blank" rel="noopener">Consultar por WhatsApp ↗</a></div></article>`).join("");
    if(!list.length) grid.innerHTML='<div class="empty">No encontramos productos con esa búsqueda.</div>';
    if(products.length) status.textContent=`${products.length} producto(s) en catálogo`;
  }
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  search.addEventListener("input",render); brandFilter.addEventListener("change",render); load();
})();