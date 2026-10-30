(() => {
  const cfg=window.JIMPORT_CONFIG||{};
  const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith("PEGA_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id), loginPanel=$("loginPanel"), dashboard=$("dashboard"), form=$("productForm"), message=$("adminMessage");
  let rows=[];
  const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:cfg.CURRENCY||"USD"}).format(Number(n||0));
  function note(t){message.textContent=t;message.hidden=false;}
  function setLoggedIn(ok){loginPanel.hidden=ok;dashboard.hidden=!ok; if(ok){refresh();refreshPromotions();refreshReviews();refreshInventory();refreshFinance();}}
  if(!client){note("Falta configurar Supabase. Abre config.js y pega la URL y la clave pública del proyecto.");}
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client)return;const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){note("No se pudo iniciar sesión: revisa correo y contraseña.");return;}note("Sesión iniciada.");setLoggedIn(true);});
  $("logout").addEventListener("click",async()=>{await client.auth.signOut();setLoggedIn(false);form.hidden=true;note("Sesión cerrada.");});
  $("newProduct").addEventListener("click",()=>openForm());
  $("cancelForm").addEventListener("click",()=>form.hidden=true);
  async function refresh(){const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false});if(error){note("Error al cargar productos. Revisa que hayas ejecutado schema.sql en Supabase.");return;}rows=data||[];draw();populatePromoProducts();populateSaleProducts();movementProducts();refreshInventory();refreshMovements();refreshFinance();}
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
    else if(["producto llegando","llegando","proximamente","próximamente"].includes(stockRaw)) stock="Producto llegando";
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
  function populatePromoProducts(){
    const sel=$("promoProduct"), current=sel.value;
    sel.innerHTML='<option value="">Selecciona un producto del catálogo (opcional)</option>'+rows.map(p=>`<option value="${safe(p.id)}">${safe(p.brand)} · ${safe(p.name)} · ${money(p.price)}</option>`).join("");
    sel.value=current;
  }
  function showSelectedPromoProduct(){
    const p=rows.find(p=>p.id===$("promoProduct").value);
    $("promoProductInfo").innerHTML=p?`<div class="admin-row"><div class="mini-img">${p.image_url?`<img src="${safe(p.image_url)}" alt="">`:"📦"}</div><div class="admin-row-info"><b>${safe(p.name)}</b><span>${safe(p.brand)} · ${money(p.price)}</span><small>Los cambios de esta promoción no modifican el producto del catálogo.</small></div></div>`:"";
  }
  $("promoProduct").addEventListener("change",()=>{
    const p=rows.find(p=>p.id===$("promoProduct").value);
    showSelectedPromoProduct();if(!p)return;
    $("promoTitle").value=p.name;
    $("promoDescription").value=p.description||`${p.brand} · ${p.model||""} · Precio: ${money(p.price)}`;
    $("promoImage").value=p.image_url||"";
    $("promoLink").value="";
    $("promoButton").value="Ver producto";
    $("promoRegularPrice").value=p.price??"";
    $("promoSalePrice").value="";
  });
  $("newPromotion").addEventListener("click",()=>openPromotion());
  $("cancelPromotion").addEventListener("click",()=>promoForm.hidden=true);
  async function refreshPromotions(){
    if(!client)return;
    const {data,error}=await client.from("promotions").select("*").order("created_at",{ascending:false});
    if(error){
      console.error("Error al cargar promociones:",error);
      $("adminPromotions").innerHTML=`<div class="notice">No se pudieron cargar las promociones: ${safe(error.message||error.code||"Error desconocido")}. Si falta la tabla, ejecuta <b>promociones_supabase.sql</b> en Supabase → SQL Editor. No elimina tus productos.</div>`;
      return;
    }
    promoRows=data||[];drawPromotions();
  }
  function drawPromotions(){
    const el=$("adminPromotions");
    if(!promoRows.length){el.innerHTML='<div class="empty">Todavía no hay promociones. Pulsa “Añadir promoción” y selecciona un producto registrado.</div>';return;}
    el.innerHTML=promoRows.map(p=>`<article class="admin-row"><div class="mini-img">${p.image_url?`<img src="${safe(p.image_url)}" alt="">`:"✦"}</div><div class="admin-row-info"><b>${safe(p.title)}</b><span>${safe(p.description||"Sin descripción")}</span><strong>${p.sale_price!=null?`${money(p.sale_price)} (antes ${money(p.regular_price)}) · `:""}${p.active?"Visible en portada":"Oculta"}</strong></div><button class="button button-outline promo-edit" data-id="${safe(p.id)}" type="button">Editar</button><button class="button button-outline promo-toggle" data-id="${safe(p.id)}" type="button">${p.active?"Ocultar":"Activar"}</button><button class="button button-danger promo-delete" data-id="${safe(p.id)}" type="button">Eliminar</button></article>`).join("");
    el.querySelectorAll(".promo-edit").forEach(b=>b.onclick=()=>openPromotion(promoRows.find(p=>p.id===b.dataset.id)));
    el.querySelectorAll(".promo-delete").forEach(b=>b.onclick=()=>removePromotion(b.dataset.id));
    el.querySelectorAll(".promo-toggle").forEach(b=>b.onclick=async()=>{const p=promoRows.find(p=>p.id===b.dataset.id);const {error}=await client.from("promotions").update({active:!p.active}).eq("id",p.id);if(error)note("No se pudo cambiar la visibilidad: "+error.message);else await refreshPromotions();});
  }
  function openPromotion(p=null){
    populatePromoProducts();$("promoProduct").value="";showSelectedPromoProduct();
    $("promotionFormTitle").textContent=p?"Editar promoción":"Nueva promoción";
    $("promotionId").value=p?.id||"";$("promoTitle").value=p?.title||"";$("promoDescription").value=p?.description||"";
    $("promoImage").value=p?.image_url||"";$("promoLink").value=p?.link_url||"";$("promoButton").value=p?.button_text||"Ver oferta";
    $("promoRegularPrice").value=p?.regular_price??"";$("promoSalePrice").value=p?.sale_price??"";
    $("promoActive").checked=p?.active!==false;promoForm.hidden=false;promoForm.scrollIntoView({behavior:"smooth",block:"start"});
  }
  promoForm.addEventListener("submit",async e=>{
    e.preventDefault();if(!client)return;
    const id=$("promotionId").value;
    const product=rows.find(p=>p.id===$("promoProduct").value);
    const image=$("promoImage").value.trim();
    if(!image){note("Añade una imagen al producto o pega una URL de imagen para esta promoción.");return;}
    const regular=$("promoRegularPrice").value, sale=$("promoSalePrice").value;
    if(sale!=="" && regular!=="" && Number(sale)>=Number(regular)){note("El precio promocional debe ser menor que el precio normal.");return;}
    const item={regular_price:regular===""?null:Number(regular),sale_price:sale===""?null:Number(sale),title:$("promoTitle").value.trim(),description:$("promoDescription").value.trim()||null,image_url:image,link_url:$("promoLink").value.trim()||(product?`index.html?buscar=${encodeURIComponent(product.model||product.name)}#productos`:null),button_text:$("promoButton").value.trim()||"Ver oferta",active:$("promoActive").checked};
    const result=id?await client.from("promotions").update(item).eq("id",id):await client.from("promotions").insert(item);
    if(result.error){note("No se pudo guardar la promoción: "+(result.error.message||"Error desconocido")+". Comprueba la tabla y los permisos en Supabase.");console.error(result.error);return;}
    promoForm.hidden=true;note("Promoción guardada correctamente.");await refreshPromotions();
  });
  async function removePromotion(id){
    const p=promoRows.find(x=>x.id===id);if(!p||!confirm(`¿Eliminar la promoción “${p.title}”?`))return;
    const {error}=await client.from("promotions").delete().eq("id",id);
    if(error){note("No se pudo eliminar la promoción: "+error.message);return;}note("Promoción eliminada.");refreshPromotions();
  }
  let reviewRows=[];
  const reviewStatus=$('reviewAdminStatus');

  function populateSaleProducts(){const sel=$('saleProduct');if(!sel)return;sel.innerHTML='<option value="">Seleccionar producto</option>'+rows.map(p=>`<option value="${safe(p.id)}">${safe(p.brand)} · ${safe(p.name)}</option>`).join('');}
  $('verifiedSaleForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const out=$('saleResult');out.textContent='Generando código…';
    const productId=$('saleProduct').value,reference=$('saleReference').value.trim(),customer=$('saleCustomer').value.trim();
    if(!productId||!reference){out.textContent='Selecciona un producto e indica la referencia de venta.';return;}
    const {data,error}=await client.rpc('create_verified_purchase',{sold_product_id:productId,sale_reference:reference,customer_label:customer});
    if(error){out.textContent='No se pudo generar el código: '+error.message;return;}
    const code=String(data||'');const url=new URL('index.html',location.href);url.hash='opiniones';
    out.innerHTML='';const heading=document.createElement('strong');heading.textContent='Código generado: '+code;out.append(heading);
    const share=document.createElement('a');share.className='button button-outline';share.target='_blank';share.rel='noopener noreferrer';share.textContent='Compartir por WhatsApp ↗';share.href='https://wa.me/?text='+encodeURIComponent('Gracias por comprar en JIMPORT. Puedes dejar tu opinión de compra verificada aquí: '+url.href+' Código: '+code);out.append(document.createElement('br'),share);
    $('verifiedSaleForm').reset();
  });

  $('reloadReviews').addEventListener('click',refreshReviews);
  async function refreshReviews(){
    if(!client)return;
    reviewStatus.textContent='Cargando opiniones…';
    const {data,error}=await client.from('reviews').select('id,name,rating,comment,approved,created_at').order('created_at',{ascending:false}).limit(200);
    if(error){reviewStatus.textContent='No se pudieron cargar las opiniones: '+(error.message||error.code||'Error desconocido')+'. Ejecuta REPARAR_PROMOCIONES_Y_OPINIONES.sql en el proyecto correcto de Supabase.';return;}
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

  // Historial de movimientos: la función SQL realiza el cambio de forma atómica.
  function movementProducts(){const sel=$("movementProduct");if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">Selecciona un producto</option>'+rows.map(p=>`<option value="${safe(p.id)}">${safe(p.brand)} · ${safe(p.name)} · ${safe(p.model||"")}</option>`).join("");sel.value=old;}
  async function refreshMovements(){if(!client)return;const box=$("movementHistory"),msg=$("movementMessage");const {data,error}=await client.from("inventory_movements").select("id,product_id,movement_type,quantity,reference,notes,created_at").order("created_at",{ascending:false}).limit(100);if(error){msg.textContent="No se pudo leer el historial. Ejecuta MOVIMIENTOS_INVENTARIO_SUPABASE.sql. "+error.message;return;}box.innerHTML=(data||[]).map(m=>{const product=rows.find(p=>p.id===m.product_id);return `<div class="inventory-row"><div><b>${safe(product?.name||"Producto eliminado")}</b><small>${safe(m.movement_type)} · ${m.quantity} unidad(es) · ${safe(m.reference||"Sin referencia")}</small><small>${safe(m.notes||"")}</small></div><small>${new Date(m.created_at).toLocaleString("es-EC")}</small></div>`}).join("")||'<p>No hay movimientos registrados todavía.</p>';}
  $("reloadMovements").addEventListener("click",refreshMovements);
  $("movementForm").addEventListener("submit",async e=>{e.preventDefault();const msg=$("movementMessage"),btn=$("movementSave"),qty=Number($("movementQty").value);if(!$("movementProduct").value||!Number.isSafeInteger(qty)||qty<1){msg.textContent="Selecciona un producto y una cantidad entera mayor que cero.";return;}btn.disabled=true;const {error}=await client.rpc("record_inventory_movement",{p_product_id:$("movementProduct").value,p_movement_type:$("movementType").value,p_quantity:qty,p_reference:$("movementRef").value.trim()||null,p_notes:$("movementNotes").value.trim()||null});btn.disabled=false;if(error){msg.textContent="No se pudo registrar el movimiento: "+error.message;return;}msg.textContent="Movimiento registrado y existencias actualizadas.";$("movementQty").value="";$("movementRef").value="";$("movementNotes").value="";await refreshInventory();await refreshMovements();await refreshFinance();});
  // Finanzas: costos almacenados en tabla privada con RLS; no se publican en la tienda.
  let financeCosts=[];
  const finMoney=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(n);
  async function refreshFinance(){
    if(!client||!$("financeProducts")||dashboard.hidden)return;
    const msg=$("financeMessage"),box=$("financeProducts");
    const {data,error}=await client.from('private_product_costs').select('product_id,unit_cost');
    if(error){msg.textContent='No se pudieron cargar los costos privados. Ejecuta FINANZAS_PRIVADAS_SUPABASE.sql y autoriza al administrador. '+error.message;box.innerHTML='';return;}
    financeCosts=data||[];const costs=new Map(financeCosts.map(c=>[c.product_id,Number(c.unit_cost)]));
    const quantities=new Map(inventoryEntries.map(i=>[i.product_id,Number(i.quantity)]));
    let invested=0,retail=0,expected=0;
    for(const p of rows){const qty=quantities.get(p.id)||0,cost=costs.get(p.id)||0,price=Number(p.price)||0;invested+=qty*cost;retail+=qty*price;expected+=qty*(price-cost);}
    $("financeSummary").innerHTML=`<div class="inventory-stat"><b>${finMoney(invested)}</b><small>Capital en inventario (costo)</small></div><div class="inventory-stat"><b>${finMoney(retail)}</b><small>Valor de venta potencial</small></div><div class="inventory-stat"><b>${finMoney(expected)}</b><small>Margen bruto potencial (antes de gastos)</small></div>`;
    box.innerHTML=rows.map(p=>{const qty=quantities.get(p.id)||0,cost=costs.get(p.id),price=Number(p.price)||0,margin=cost===undefined?'—':finMoney(price-cost),pct=cost===undefined||price<=0?'—':((price-cost)/price*100).toFixed(1)+'%';return `<div class="inventory-row"><div><b>${safe(p.name)}</b><small>${safe(p.brand)} · ${safe(p.model||'Sin SKU')} · ${qty} unidades</small><small>Precio venta: ${finMoney(price)} · Ganancia bruta/unidad: ${margin} · Margen: ${pct}</small><small>Capital: ${finMoney(qty*(cost||0))}</small></div><div class="inventory-controls"><label>Costo unitario USD <input class="fin-cost" type="number" min="0" step="0.01" value="${cost??''}" placeholder="0.00"></label><button type="button" class="button button-outline fin-save" data-id="${safe(p.id)}">Guardar costo</button></div></div>`}).join('')||'<p>No hay productos.</p>';
    box.querySelectorAll('.fin-save').forEach(btn=>btn.addEventListener('click',async()=>{const raw=btn.closest('.inventory-row').querySelector('.fin-cost').value.trim();const cost=Number(raw);if(raw===''||!Number.isFinite(cost)||cost<0){msg.textContent='Introduce un costo válido mayor o igual a cero.';return;}btn.disabled=true;const {error}=await client.from('private_product_costs').upsert({product_id:btn.dataset.id,unit_cost:Math.round(cost*100)/100,updated_at:new Date().toISOString()},{onConflict:'product_id'});btn.disabled=false;if(error){msg.textContent='Error al guardar: '+error.message;return;}await refreshFinance();msg.textContent='Costo guardado correctamente.';}));
    msg.textContent='Datos financieros visibles únicamente para administradores autorizados. Las utilidades son estimadas, no ganancias netas realizadas.';
  }
  $("reloadFinance").addEventListener('click',refreshFinance);
  // Inventario: tabla separada y protegida por políticas RLS de Supabase.
  let inventoryEntries=[];
  $("reloadInventory").addEventListener("click",refreshInventory);
  async function refreshInventory(){
    const box=$("inventoryProducts"),msg=$("inventoryMessage");
    if(!client)return;
    const {data,error}=await client.from("private_inventory").select("product_id,quantity,min_quantity,updated_at");
    if(error){msg.textContent="Inventario privado no disponible: ejecuta INVENTARIO_PRIVADO_SUPABASE.sql y autoriza tu usuario. Detalle: "+error.message;box.innerHTML="";return;}
    inventoryEntries=data||[];msg.textContent="Inventario protegido: las unidades son privadas y solo se editan aquí.";
    const inv=new Map(inventoryEntries.map(x=>[x.product_id,x]));
    const total=rows.reduce((a,p)=>a+Number(inv.get(p.id)?.quantity||0),0);
    const low=rows.filter(p=>inv.has(p.id)&&Number(inv.get(p.id).quantity)<=Number(inv.get(p.id).min_quantity)).length;
    $("inventorySummary").innerHTML=`<div class="inventory-stat"><b>${rows.length}</b><small>Productos registrados</small></div><div class="inventory-stat"><b>${total}</b><small>Unidades contabilizadas</small></div><div class="inventory-stat"><b>${low}</b><small>Productos con stock bajo</small></div>`;
    box.innerHTML=rows.map(p=>{const i=inv.get(p.id);const qty=i?.quantity??0;const min=i?.min_quantity??2;return `<div class="inventory-row"><div><b>${safe(p.name)}</b><small>${safe(p.brand)} · ${safe(p.model||"Sin SKU")} · ${safe(p.stock||"Sin estado")}</small>${i&&qty<=min?'<small class="inventory-warning">⚠ Existencias bajas</small>':''}</div><div class="inventory-controls"><label>Unidades <input type="number" min="0" step="1" class="inv-qty" value="${qty}" aria-label="Unidades de ${safe(p.name)}"></label><label>Mínimo <input type="number" min="0" step="1" class="inv-min" value="${min}" aria-label="Mínimo de ${safe(p.name)}"></label><button type="button" class="button button-outline inv-save" data-id="${safe(p.id)}">Guardar</button></div></div>`}).join("");
    refreshFinance();
    box.querySelectorAll(".inv-save").forEach(btn=>btn.addEventListener("click",async()=>{const parent=btn.closest(".inventory-row");const quantity=Number(parent.querySelector(".inv-qty").value);const min_quantity=Number(parent.querySelector(".inv-min").value);if(!Number.isSafeInteger(quantity)||quantity<0||!Number.isSafeInteger(min_quantity)||min_quantity<0){msg.textContent="Introduce cantidades enteras no negativas.";return;}btn.disabled=true;const {error}=await client.from("private_inventory").upsert({product_id:btn.dataset.id,quantity,min_quantity,updated_at:new Date().toISOString()},{onConflict:"product_id"});btn.disabled=false;if(error){msg.textContent="No se pudo guardar: "+error.message;return;}msg.textContent="Cantidad guardada correctamente.";await refreshInventory();}));
  }
})();