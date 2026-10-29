(() => {
  const cfg=window.JIMPORT_CONFIG||{};
  const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith("PEGA_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id), loginPanel=$("loginPanel"), dashboard=$("dashboard"), form=$("productForm"), message=$("adminMessage");
  let rows=[];
  const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:cfg.CURRENCY||"USD"}).format(Number(n||0));
  function note(t){message.textContent=t;message.hidden=false;}
  function setLoggedIn(ok){loginPanel.hidden=ok;dashboard.hidden=!ok; if(ok){refresh();refreshPromotions();refreshReviews();}}
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

  // Importación masiva desde la plantilla Excel de JIMPORT o un CSV equivalente.
  const importButton=$("importProducts"), importInput=$("productImportFile"), importStatus=$("importStatus");
  function importNote(t){importStatus.textContent=t;importStatus.hidden=false;}
  importButton.addEventListener("click",()=>{
    if(!window.XLSX){note("No se pudo cargar el lector de Excel. Comprueba tu conexión e inténtalo de nuevo.");return;}
    importInput.value="";importInput.click();
  });
  function normHeader(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[_/]+/g," ").replace(/\s+/g," ");}
  function getVal(row,aliases){
    for(const alias of aliases){const key=normHeader(alias);for(const original of Object.keys(row)){if(normHeader(original)===key && row[original]!==undefined && row[original]!==null && String(row[original]).trim()!=="")return row[original];}}
    return "";
  }
  function asBool(v,defaultValue=true){
    if(v===undefined||v===null||String(v).trim()==="")return defaultValue;
    return ["si","sí","yes","true","1","activo","activa"].includes(String(v).trim().toLowerCase());
  }
  function asNumber(v,defaultValue=null){
    if(v===undefined||v===null||String(v).trim()==="")return defaultValue;
    if(typeof v==="number")return Number.isFinite(v)?v:defaultValue;
    const n=Number(String(v).trim().replace(/\s/g,"").replace(/\$/g,"").replace(",","."));
    return Number.isFinite(n)?n:defaultValue;
  }
  function mapImportRow(r,index){
    const name=String(getVal(r,["Nombre del producto","Nombre","Producto","name"])).trim();
    const brand=String(getVal(r,["Marca","brand"])).trim();
    const price=asNumber(getVal(r,["Precio de venta","Precio","Precio (USD)","price"]),null);
    const category=String(getVal(r,["Categoría","Categoria","category"])||"VARIOS").trim().toUpperCase();
    const oldPrice=asNumber(getVal(r,["Precio anterior (opcional)","Precio anterior","old_price"]),null);
    const qty=asNumber(getVal(r,["Stock / Cantidad","Cantidad","Stock","quantity"]),null);
    const stockRaw=String(getVal(r,["Disponibilidad","Estado de stock","stock"])||"").trim().toLowerCase();
    let stock="En stock";
    if(["agotado","sin stock","out of stock"].includes(stockRaw) || qty===0) stock="Agotado";
    else if(["bajo pedido","por pedido","on order"].includes(stockRaw)) stock="Bajo pedido";
    else if(["en stock","disponible","in stock"].includes(stockRaw)) stock="En stock";
    const active=asBool(getVal(r,["Estado (activo/inactivo)","Estado","active"]),true);
    const model=String(getVal(r,["Modelo","Modelo / SKU","SKU / Código","SKU","Código","model"])).trim();
    const image=String(getVal(r,["URL de imagen principal","URL de imagen","Imagen","image_url"])).trim();
    return {rowNumber:index+2,item:{name,brand,model:model||null,price,old_price:oldPrice,stock,category,image_url:image||null,description:String(getVal(r,["Descripción","Descripcion","description"])).trim()||null,active}};
  }
  importInput.addEventListener("change",async()=>{
    const file=importInput.files&&importInput.files[0];if(!file)return;
    if(!client){note("Supabase no está configurado.");return;}
    if(!window.XLSX){note("No se pudo cargar el lector de Excel.");return;}
    try{
      importNote("Leyendo archivo…");
      const data=await file.arrayBuffer();
      const book=window.XLSX.read(data,{type:"array"});
      const sheet=book.Sheets[book.SheetNames[0]];
      const raw=window.XLSX.utils.sheet_to_json(sheet,{defval:"",raw:true});
      if(!raw.length){importNote("El archivo no contiene filas de productos.");return;}
      const mapped=raw.map((r,i)=>mapImportRow(r,i)).filter(x=>Object.values(x.item).some(v=>v!==null&&v!==""&&v!==undefined));
      const errors=[];
      for(const x of mapped){
        if(!x.item.name)errors.push(`Fila ${x.rowNumber}: falta el nombre del producto.`);
        if(!x.item.brand)errors.push(`Fila ${x.rowNumber}: falta la marca.`);
        if(x.item.price===null||x.item.price<0)errors.push(`Fila ${x.rowNumber}: el precio de venta debe ser un número igual o mayor que 0.`);
        if(x.item.old_price!==null&&x.item.old_price<0)errors.push(`Fila ${x.rowNumber}: el precio anterior no puede ser negativo.`);
        if(x.item.category&&!["CABLES","CARGADORES","TECLADOS MECÁNICOS","MICRÓFONOS","HUBS","POWER BANKS","AUDIO","PERIFÉRICOS","ACCESORIOS PARA CELULARES","VARIOS"].includes(x.item.category))errors.push(`Fila ${x.rowNumber}: categoría no reconocida (${x.item.category}).`);
        if(x.item.image_url&&!/^https?:\/\//i.test(x.item.image_url))errors.push(`Fila ${x.rowNumber}: la URL de imagen debe empezar por http:// o https://.`);
      }
      if(errors.length){importNote("No se importó ningún producto. Corrige estos errores y vuelve a intentarlo: "+errors.slice(0,8).join(" ")+(errors.length>8?` Y ${errors.length-8} error(es) más.`:""));return;}
      if(!mapped.length){importNote("No se encontraron filas con productos. Usa la hoja Productos de la plantilla JIMPORT.");return;}
      const count=mapped.length;
      if(!confirm(`Se van a importar ${count} producto(s). Los productos se agregarán al catálogo existente; no se eliminará ningún producto. ¿Continuar?`)){importNote("Importación cancelada.");return;}
      importButton.disabled=true;importNote(`Importando ${count} producto(s)…`);
      // Insert in batches to avoid request-size limits.
      let inserted=0;
      for(let i=0;i<mapped.length;i+=25){
        const batch=mapped.slice(i,i+25).map(x=>x.item);
        const {error}=await client.from("products").insert(batch);
        if(error){
          console.error("Error importando productos:",error);
          importNote(`Se importaron ${inserted} de ${count} producto(s). Falló el siguiente grupo: ${error.message||"error de base de datos"}. Revisa los datos y vuelve a importar solo los que faltan para evitar duplicados.`);
          await refresh();return;
        }
        inserted+=batch.length;
      }
      importNote(`Importación completada: ${inserted} producto(s) agregados correctamente.`);
      note(`Importación completada: ${inserted} producto(s) agregados correctamente.`);
      await refresh();
    }catch(err){console.error(err);importNote("No se pudo leer el archivo: "+(err?.message||String(err)));}
    finally{importButton.disabled=false;}
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
  let reviewRows=[];
  const reviewStatus=$('reviewAdminStatus');
  $('reloadReviews').addEventListener('click',refreshReviews);
  async function refreshReviews(){
    if(!client)return;
    reviewStatus.textContent='Cargando opiniones…';
    const {data,error}=await client.from('reviews').select('id,name,rating,comment,approved,created_at').order('created_at',{ascending:false}).limit(200);
    if(error){reviewStatus.textContent='No se pudieron cargar las opiniones. Ejecuta el schema.sql actualizado y comprueba los permisos de administrador.';return;}
    reviewRows=data||[];
    const pending=reviewRows.filter(r=>!r.approved).length;
    reviewStatus.textContent=`${pending} pendiente(s) de aprobación · ${reviewRows.length} opinión(es) en total (máximo 200 recientes).`;
    const el=$('adminReviews');
    el.innerHTML=reviewRows.length?reviewRows.map(r=>`<article class="admin-row" style="align-items:start"><div class="admin-row-info"><b>${safe(r.name)} · ${'★'.repeat(Math.max(0,Math.min(5,r.rating)))}</b><span>${new Date(r.created_at).toLocaleDateString('es-EC')} · ${r.approved?'Publicada':'Pendiente'}</span><p style="white-space:pre-wrap;overflow-wrap:anywhere">${safe(r.comment)}</p></div><button type="button" class="button button-outline review-toggle" data-id="${r.id}">${r.approved?'Ocultar':'Aprobar'}</button><button type="button" class="button button-danger review-delete" data-id="${r.id}">Eliminar</button></article>`).join(''):'<p>Todavía no hay opiniones.</p>';
    el.querySelectorAll('.review-toggle').forEach(b=>b.addEventListener('click',()=>toggleReview(b.dataset.id,b)));
    el.querySelectorAll('.review-delete').forEach(b=>b.addEventListener('click',()=>deleteReview(b.dataset.id,b)));
  }
  async function toggleReview(id,button){
    const review=reviewRows.find(r=>String(r.id)===String(id));if(!review)return;
    button.disabled=true;
    const {error}=await client.from('reviews').update({approved:!review.approved}).eq('id',id);
    if(error){reviewStatus.textContent='No se pudo cambiar el estado de la opinión. Revisa los permisos de Supabase.';button.disabled=false;return;}
    await refreshReviews();
  }
  async function deleteReview(id,button){
    if(!confirm('¿Eliminar definitivamente esta opinión?'))return;
    button.disabled=true;
    const {error}=await client.from('reviews').delete().eq('id',id);
    if(error){reviewStatus.textContent='No se pudo eliminar la opinión. Revisa los permisos de Supabase.';button.disabled=false;return;}
    await refreshReviews();
  }
  if(client)client.auth.getSession().then(({data})=>setLoggedIn(!!data.session));
})();