(() => {
  const cfg=window.JIMPORT_CONFIG||{};
  const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith("PEGA_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id), loginPanel=$("loginPanel"), dashboard=$("dashboard"), form=$("productForm"), message=$("adminMessage");
  let rows=[];
  const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:cfg.CURRENCY||"USD"}).format(Number(n||0));
  function note(t){message.textContent=t;message.hidden=false;}
  function setLoggedIn(ok){loginPanel.hidden=ok;dashboard.hidden=!ok; if(ok){refresh();refreshPromotions();}}
  if(!client){note("Falta configurar Supabase. Abre config.js y pega la URL y la clave pública del proyecto.");}
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client)return;const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){note("No se pudo iniciar sesión: revisa correo y contraseña.");return;}note("Sesión iniciada.");setLoggedIn(true);});
  $("logout").addEventListener("click",async()=>{await client.auth.signOut();setLoggedIn(false);form.hidden=true;note("Sesión cerrada.");});
  $("newProduct").addEventListener("click",()=>openForm());
  $("cancelForm").addEventListener("click",()=>form.hidden=true);
  async function refresh(){const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false});if(error){note("Error al cargar productos. Revisa que hayas ejecutado schema.sql en Supabase.");return;}rows=data||[];draw();}
  function draw(){const el=$("adminProducts");if(!rows.length){el.innerHTML='<div class="empty">Aún no hay productos. Pulsa “Añadir producto”.</div>';return;}el.innerHTML=rows.map(p=>`<article class="admin-row"><div class="mini-img">${p.image_url?`<img src="${safe(p.image_url)}" alt="">`:"✳"}</div><div class="admin-row-info"><b>${safe(p.name)}</b><span>${safe(p.brand)} · ${safe(p.model||"Sin modelo")} · Categoría: ${safe(p.category||"VARIOS")}</span><strong>${money(p.price)} ${p.active?"":"· Oculto"}</strong></div><span class="admin-stock">${safe(p.stock||"")}</span><button class="button button-outline edit" data-id="${p.id}">Editar</button><button class="button button-danger delete" data-id="${p.id}">Eliminar</button></article>`).join("");el.querySelectorAll(".edit").forEach(b=>b.onclick=()=>openForm(rows.find(p=>p.id===b.dataset.id)));el.querySelectorAll(".delete").forEach(b=>b.onclick=()=>remove(b.dataset.id));}
  function openForm(p=null){$("formTitle").textContent=p?"Editar producto":"Nuevo producto";$("productId").value=p?.id||"";$("pName").value=p?.name||"";$("pBrand").value=p?.brand||"";$("pModel").value=p?.model||"";$("pPrice").value=p?.price??"";$("pOldPrice").value=p?.old_price??"";$("pStock").value=p?.stock||"En stock";$("pCategory").value=p?.category||"VARIOS";$("pImage").value=p?.image_url||"";$("pDescription").value=p?.description||"";form.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"});}
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!client){note("Supabase no está configurado. Revisa config.js.");return;}
    const id=$("productId").value;
    const item={name:$("pName").value.trim(),brand:$("pBrand").value.trim(),model:$("pModel").value.trim()||null,price:Number($("pPrice").value),old_price:$("pOldPrice").value?Number($("pOldPrice").value):null,stock:$("pStock").value,category:$("pCategory").value,image_url:$("pImage").value.trim()||null,description:$("pDescription").value.trim()||null,active:true};
    const save=payload=>id?client.from("products").update(payload).eq("id",id):client.from("products").insert(payload);
    try {
      let result=await save(item);
      // Compatibility with an older database that has not yet received the category migration.
      if(result.error && /column .*category.* does not exist|could not find the .*category.* column/i.test(result.error.message||"")) {
        const legacyItem={...item}; delete legacyItem.category;
        result=await save(legacyItem);
        if(!result.error){form.hidden=true;note("Producto guardado, pero la categoría aún no se guardó porque falta actualizar Supabase. Ejecuta en SQL Editor: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'VARIOS';");await refresh();return;}
      }
      if(result.error){
        console.error("Error de Supabase al guardar producto:",result.error);
        const detail=[result.error.message,result.error.details,result.error.hint].filter(Boolean).join(" — ");
        note("No se pudo guardar el producto: "+(detail||result.error.code||"error desconocido")+". Revisa el mensaje para identificar qué corregir.");
        return;
      }
      form.hidden=true;note("Producto guardado correctamente.");await refresh();
    } catch(err) { console.error(err); note("Error inesperado al guardar: "+(err?.message||String(err))); }
  });
  async function remove(id){const p=rows.find(x=>x.id===id);if(!p)return;if(!confirm(`¿Eliminar “${p.name}” del catálogo?`))return;const {error}=await client.from("products").delete().eq("id",id);if(error){note("No se pudo eliminar el producto.");return;}note("Producto eliminado.");refresh();}
  function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  const promoForm=$("promotionForm");
  let promoRows=[];
  $("newPromotion").addEventListener("click",()=>openPromotion());
  $("cancelPromotion").addEventListener("click",()=>promoForm.hidden=true);
  async function refreshPromotions(){
    const {data,error}=await client.from("promotions").select("*").order("created_at",{ascending:false});
    if(error){$("adminPromotions").innerHTML='<div class="notice">No se pudo cargar promociones. Ejecuta el schema.sql actualizado en Supabase → SQL Editor.</div>';return;}
    promoRows=data||[];drawPromotions();
  }
  function drawPromotions(){
    const el=$("adminPromotions");
    if(!promoRows.length){el.innerHTML='<div class="empty">Todavía no hay promociones. Pulsa “Añadir promoción” para crear la primera.</div>';return;}
    el.innerHTML=promoRows.map(p=>`<article class="admin-row"><div class="mini-img">${p.image_url?`<img src="${safe(p.image_url)}" alt="">`:"✦"}</div><div class="admin-row-info"><b>${safe(p.title)}</b><span>${safe(p.description||"Sin descripción")}</span><strong>${p.active?"Visible en portada":"Oculta"}</strong></div><button class="button button-outline promo-edit" data-id="${p.id}" type="button">Editar</button><button class="button button-danger promo-delete" data-id="${p.id}" type="button">Eliminar</button></article>`).join("");
    el.querySelectorAll(".promo-edit").forEach(b=>b.onclick=()=>openPromotion(promoRows.find(p=>p.id===b.dataset.id)));
    el.querySelectorAll(".promo-delete").forEach(b=>b.onclick=()=>removePromotion(b.dataset.id));
  }
  function openPromotion(p=null){
    $("promotionFormTitle").textContent=p?"Editar promoción":"Nueva promoción";
    $("promotionId").value=p?.id||"";$("promoTitle").value=p?.title||"";$("promoDescription").value=p?.description||"";
    $("promoImage").value=p?.image_url||"";$("promoLink").value=p?.link_url||"";$("promoButton").value=p?.button_text||"Ver oferta";
    $("promoActive").checked=p?.active!==false;promoForm.hidden=false;promoForm.scrollIntoView({behavior:"smooth",block:"start"});
  }
  promoForm.addEventListener("submit",async e=>{
    e.preventDefault();if(!client)return;
    const id=$("promotionId").value;
    const item={title:$("promoTitle").value.trim(),description:$("promoDescription").value.trim()||null,image_url:$("promoImage").value.trim(),link_url:$("promoLink").value.trim()||null,button_text:$("promoButton").value.trim()||"Ver oferta",active:$("promoActive").checked};
    const result=id?await client.from("promotions").update(item).eq("id",id):await client.from("promotions").insert(item);
    if(result.error){note("No se pudo guardar la promoción. Verifica que ejecutaste el schema.sql actualizado en Supabase.");console.error(result.error);return;}
    promoForm.hidden=true;note("Promoción guardada. La portada se actualizará automáticamente.");await refreshPromotions();
  });
  async function removePromotion(id){
    const p=promoRows.find(x=>x.id===id);if(!p||!confirm(`¿Eliminar la promoción “${p.title}”?`))return;
    const {error}=await client.from("promotions").delete().eq("id",id);
    if(error){note("No se pudo eliminar la promoción.");return;}note("Promoción eliminada.");refreshPromotions();
  }
  if(client)client.auth.getSession().then(({data})=>setLoggedIn(!!data.session));
})();