(() => {
  const cfg=window.JIMPORT_CONFIG||{};
  const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith("PEGA_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith("PEGA_");
  const client=configured && window.supabase?.createClient ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id), loginPanel=$("loginPanel"), dashboard=$("dashboard"), form=$("productForm"), message=$("adminMessage");
  let rows=[]; let privateInventory={}; let authorized=false; let onlyLowStock=false; let adminPage=1; let saleDisplayPriceMode="retail";
  const baseCategories=[...document.querySelectorAll('#pCategory option')].map(o=>o.value);
  let customCategories=[];
  const categoryStoreKey='jimport_custom_categories_v1';
  function getCustomCategories(){
    try{return JSON.parse(localStorage.getItem(categoryStoreKey)||'[]').filter(x=>typeof x==='string');}catch{return [];}
  }
  function updateCategoryChoices(){
    const select=$('pCategory');if(!select)return;
    const previous=select.value;
    const values=[...new Set([...baseCategories,...customCategories,...rows.map(p=>String(p.category||'').trim()).filter(Boolean)])];
    select.replaceChildren(...values.map(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;return o;}));
    if(values.includes(previous))select.value=previous;
    const grid=$('managedCategories');if(!grid)return;
    grid.replaceChildren();
    for(const name of values){
      const count=rows.filter(p=>String(p.category||'').toUpperCase()===name.toUpperCase()).length;
      const item=document.createElement('div');item.className='managed-taxonomy-item';
      const label=document.createElement('span');label.textContent=name+' · '+count+' producto(s)';
      item.append(label);
      if(customCategories.includes(name)){
        const button=document.createElement('button');button.type='button';button.className='button button-danger';
        button.textContent='Quitar categoría';
        button.onclick=()=>removeTaxonomy('jimport_categories',name,count);
        item.append(button);
      }else{
        const note=document.createElement('small');note.textContent='Categoría original';item.append(note);
      }
      grid.append(item);
    }
  }
  async function loadCustomCategories(){
    if(!client||!authorized)return;
    const {data,error}=await client.from('jimport_categories').select('name').order('name');
    if(error){$('categoryCreateStatus').textContent='No se pudieron cargar categorías: '+error.message;return;}
    customCategories=(data||[]).map(x=>x.name);updateCategoryChoices();
  }
  async function removeTaxonomy(table,name,count){
    if(!authorized)return;
    const label=table==='jimport_brands'?'marca':'categoría';
    if(count){note('No se puede quitar '+label+' «'+name+'»: tiene '+count+' producto(s). Primero reasígnalos a otra '+label+'.');return;}
    if(!confirm('¿Quitar '+label+' «'+name+'» de las opciones? Esta acción se guardará en Supabase.'))return;
    const {error}=await client.from(table).delete().eq('name',name);
    if(error){note('No se pudo quitar '+label+': '+error.message);return;}
    note('Se quitó la '+label+' «'+name+'».');
    if(table==='jimport_brands')await refreshBrands();else await loadCustomCategories();
  }
  $('newCategoryForm')?.addEventListener('submit',async e=>{
    e.preventDefault();if(!authorized)return;
    const status=$('categoryCreateStatus');
    const name=$('newCategoryName').value.trim().replace(/\s+/g,' ').toUpperCase();
    if(name.length<2){status.textContent='Escribe al menos 2 caracteres.';return;}
    if([...baseCategories,...customCategories,...rows.map(p=>p.category)].some(v=>String(v||'').toUpperCase()===name)){status.textContent='Esta categoría ya existe.';return;}
    const {error}=await client.from('jimport_categories').insert({name});
    if(error){status.textContent='No se pudo guardar: '+error.message;return;}
    $('newCategoryName').value='';status.textContent='Categoría guardada correctamente.';
    await loadCustomCategories();$('pCategory').value=name;
  });
  const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:cfg.CURRENCY||"USD"}).format(Number(n||0));
  function note(t){message.textContent=t;message.hidden=false;}
  function setLoggedIn(ok){loginPanel.hidden=ok;dashboard.hidden=!ok; if(ok){refresh();loadCustomCategories();refreshPromotions();refreshReviews();window.dispatchEvent(new Event("jimport-admin-ready"));}}
  if(!client){note("No se pudo iniciar Supabase. Verifica config.js y la conexión a Internet; el formulario permanece disponible.");}
  async function checkAdmin(){const {data,error}=await client.rpc('jimport_is_admin');if(error){note('No se pudo comprobar el administrador: '+error.message+'. Ejecuta ACTUALIZACION_JIMPORT_SUPABASE.sql.');return false;}if(!data){note('Este usuario no está autorizado. Añade su UUID a public.jimport_admins desde SQL Editor.');return false;}return true;}
  async function loadPrivate(){const {data,error}=await client.from('jimport_inventory_private').select('product_id,quantity,min_quantity,landed_cost');if(error){note('Inventario privado: '+error.message);return;}privateInventory=Object.fromEntries((data||[]).map(x=>[x.product_id,x]));draw();}
  function showInventory(){const arr=rows.map(p=>({...p,...(privateInventory[p.id]||{})}));const low=arr.filter(p=>privateInventory[p.id] && Number(p.quantity)<=Number(p.min_quantity));const sum=arr.reduce((a,p)=>a+Number(p.quantity||0)*Number(p.landed_cost||0),0);const el=$('inventorySummary');el.hidden=false;el.innerHTML='<span>Productos: '+arr.length+'</span><span>Capital en inventario: '+money(sum)+'</span><span>Alertas: '+low.length+'</span>';const alert=$('inventoryAlerts');alert.hidden=!low.length;alert.textContent=low.length?'Stock bajo o agotado: '+low.map(p=>p.name+' ('+(p.quantity||0)+')').join(' · '):'';}
  async function initSession(){if(!client){setLoggedIn(false);return;}try{const {data,error}=await client.auth.getSession();if(error)note("Error de sesión: "+error.message);if(data?.session){authorized=await checkAdmin();if(authorized){setLoggedIn(true);return;}}setLoggedIn(false);}catch(err){setLoggedIn(false);note("No se pudo verificar la sesión: "+err.message);}}
  initSession();
  async function loadStorePriceMode(){if(!client)return;const {data,error}=await client.from('jimport_store_settings').select('display_price_mode').eq('id','main').maybeSingle();if(error){console.warn('No se pudo leer la configuración global de precios:',error.message);return;}saleDisplayPriceMode=data?.display_price_mode||'retail';if($('storeDisplayPriceMode'))$('storeDisplayPriceMode').value=saleDisplayPriceMode;}
  $('saveStorePriceMode')?.addEventListener('click',async()=>{if(!authorized||!client)return;const mode=$('storeDisplayPriceMode').value;const status=$('storePriceModeStatus');status.textContent='Guardando…';const {error}=await client.from('jimport_store_settings').upsert({id:'main',display_price_mode:mode,updated_at:new Date().toISOString()},{onConflict:'id'});if(error){status.textContent='No se pudo guardar: '+error.message;return;}saleDisplayPriceMode=mode;status.textContent='Configuración guardada. La tienda y Compras verificadas mostrarán '+(mode==='wholesale'?'precios al por mayor.':'precios al público.');populateSaleProducts();renderSaleSummary();});
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){note("No se cargó Supabase. Revisa config.js y tu conexión a Internet.");return;}const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){note("No se pudo iniciar sesión: revisa correo y contraseña.");return;}authorized=await checkAdmin();if(!authorized){await client.auth.signOut();return;}note("Sesión iniciada.");setLoggedIn(true);});
  $("logout").addEventListener("click",async()=>{await client.auth.signOut();authorized=false;setLoggedIn(false);form.hidden=true;note("Sesión cerrada.");});
  $("newProduct").addEventListener("click",()=>openForm());
  $("cancelForm").addEventListener("click",()=>form.hidden=true);
  async function refresh(){await loadStorePriceMode();const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false});if(error){note("Error al cargar productos. Revisa que hayas ejecutado schema.sql en Supabase.");return;}rows=data||[];await loadPrivate();updateAdminFilters();draw();populatePromoProducts();populateSaleProducts();await loadSaleCombos();await refreshBrands();updateCategoryChoices();}

  let extraBrands=[];
  async function refreshBrands(){
    if(!client||!authorized)return;
    const {data,error}=await client.from('jimport_brands').select('name').order('name');
    if(!error)extraBrands=(data||[]).map(x=>x.name);
    const normalize=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
    const groups=new Map();
    for(const name of [...rows.map(x=>x.brand).filter(Boolean),...extraBrands]){
      const key=normalize(name);if(!key)continue;
      if(!groups.has(key))groups.set(key,{name:String(name).trim().toLocaleUpperCase('es'),rawNames:new Set(),registered:[]});
      groups.get(key).rawNames.add(String(name).trim());
    }
    for(const name of extraBrands){const group=groups.get(normalize(name));if(group)group.registered.push(name);}
    const all=[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
    $('knownBrands').replaceChildren(...all.map(g=>{const el=document.createElement('option');el.value=g.name;return el;}));
    const list=$('brandsList');list.replaceChildren();
    for(const group of all){
      const count=rows.filter(p=>normalize(p.brand)===normalize(group.name)).length;
      const item=document.createElement('div');item.className='managed-taxonomy-item';
      const label=document.createElement('span');label.textContent=group.name+' · '+count+' producto(s)';item.append(label);
      if(group.rawNames.size>1){const detail=document.createElement('small');detail.textContent='Variantes detectadas: '+[...group.rawNames].join(' / ');item.append(detail);}
      if(group.registered.length){
        const button=document.createElement('button');button.type='button';button.className='button button-danger';button.textContent='Quitar marca';
        button.onclick=()=>removeTaxonomy('jimport_brands',group.registered[0],count);item.append(button);
      }else{
        const note=document.createElement('small');note.textContent=count?'Marca presente en productos (sin registro independiente)':'Marca sin registro';item.append(note);
      }
      list.append(item);
    }
    if(error)$('brandCreateStatus').textContent='No se pudieron cargar marcas de la tabla: '+error.message+'; se muestran las utilizadas por los productos.';
  }
  $('newBrandForm')?.addEventListener('submit',async e=>{
    e.preventDefault();if(!authorized)return;
    const name=$('newBrandName').value.trim().replace(/\s+/g,' ').toUpperCase();
    if(name.length<2)return;
    if([...rows.map(x=>x.brand),...extraBrands].some(v=>String(v).toUpperCase()===name)){$('brandCreateStatus').textContent='Esta marca ya existe.';return;}
    const {error}=await client.from('jimport_brands').insert({name});
    if(error){$('brandCreateStatus').textContent='No se pudo guardar: '+error.message;return;}
    $('brandCreateStatus').textContent='✓ Marca guardada en Supabase.';
    $('newBrandName').value='';$('pBrand').value=name;await refreshBrands();
  });
  // Auditoría privada de posibles duplicados: lectura solamente.
  const normalizeDuplicate=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  function duplicateGroups(items){
    const parent=items.map((_,i)=>i);
    const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
    const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
    const keys=new Map();
    items.forEach((p,i)=>{
      const brand=normalizeDuplicate(p.brand),name=normalizeDuplicate(p.name),model=normalizeDuplicate(p.model);
      if(!brand)return;
      for(const key of [name&&brand+'|nombre|'+name,model&&brand+'|modelo|'+model].filter(Boolean)){
        if(keys.has(key))union(i,keys.get(key));else keys.set(key,i);
      }
    });
    const groups=new Map();items.forEach((p,i)=>{const root=find(i);const g=groups.get(root)||[];g.push(p);groups.set(root,g);});
    return [...groups.values()].filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
  }
  async function toggleCatalogVisibility(p, button){
    if(!authorized||!client)return;
    const next=p.active===false;
    button.disabled=true;button.textContent='Guardando…';
    const {data,error}=await client.from('products').update({active:next}).eq('id',p.id).select('id,active').single();
    if(error){note('No se pudo cambiar la visibilidad: '+error.message);button.disabled=false;button.textContent='Reintentar';return;}
    p.active=data.active;
    note((next?'Producto visible':'Producto oculto')+' en el catálogo: '+p.name);
    draw();auditDuplicates();
  }
  function auditDuplicates(){
    const output=$('duplicateReport');if(!output)return;
    if(!authorized){output.textContent='Debes iniciar sesión como administrador.';return;}
    const groups=duplicateGroups(rows);
    output.replaceChildren();
    const summary=document.createElement('p');summary.textContent=groups.length?`Se encontraron ${groups.length} grupos de posibles duplicados (${groups.reduce((n,g)=>n+g.length,0)} registros). Revisa cada caso antes de eliminar.`:`No se encontraron coincidencias exactas por marca y modelo o nombre entre ${rows.length} registros. Pueden existir variantes con nombres distintos.`;output.append(summary);
    for(const group of groups){
      const section=document.createElement('div');section.className='duplicate-audit-group';
      const heading=document.createElement('h3');heading.textContent=group[0].name+' · '+group.length+' registros';section.append(heading);
      for(const p of group){
        const inv=privateInventory[p.id];const row=document.createElement('div');row.className='duplicate-audit-item';
        const info=document.createElement('span');info.textContent=`${p.brand||'Sin marca'} · Modelo: ${p.model||'—'} · Estado: ${p.stock||'—'} · Unidades: ${inv?.quantity??'sin registro'} · ${p.active?'Visible':'Oculto'} · ID: ${p.id}`;
        const edit=document.createElement('button');edit.type='button';edit.className='button button-outline';edit.textContent='Revisar / editar';edit.addEventListener('click',()=>openForm(p));
        const del=document.createElement('button');
        del.type='button';del.className='button button-danger';del.textContent='Eliminar este registro';
        del.addEventListener('click',async()=>{
          if(!authorized||!client)return;
          const sameGroup=duplicateGroups(rows).find(g=>g.some(x=>String(x.id)===String(p.id)));
          if(!sameGroup||sameGroup.length<2){note('Este producto ya no pertenece a un grupo duplicado.');auditDuplicates();return;}
          const ok=confirm(`¿Eliminar permanentemente este registro de Supabase?\\n\\n${p.name}\\nMarca: ${p.brand||'—'}\\nModelo: ${p.model||'—'}\\nUnidades: ${privateInventory[p.id]?.quantity??'sin registro'}\\nID: ${p.id}\\n\\nLos otros registros se conservarán. Esta acción no se puede deshacer.`);
          if(!ok)return;
          del.disabled=true;del.textContent='Eliminando…';
          const {error}=await client.from('products').delete().eq('id',p.id);
          if(error){note('No se pudo eliminar: '+error.message);del.disabled=false;del.textContent='Eliminar este registro';return;}
          note('Registro eliminado correctamente.');await refresh();auditDuplicates();
        });
        const visibility=document.createElement('button');visibility.type='button';
        visibility.className='button button-outline';visibility.textContent=p.active===false?'Mostrar en catálogo':'Ocultar del catálogo';
        visibility.addEventListener('click',()=>toggleCatalogVisibility(p,visibility));
        row.append(info,edit,visibility,del);section.append(row);
      }output.append(section);
    }
  }
  $('auditDuplicates')?.addEventListener('click',auditDuplicates);
  function updateAdminFilters(){
    for(const [id,key] of [['adminCategory','category'],['adminBrand','brand']]){
      const sel=$(id),current=sel.value;
      const values=[...new Set(rows.map(p=>String(p[key]|| (key==='category'?'VARIOS':'SIN MARCA')).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
      sel.innerHTML='<option value="">'+(key==='category'?'Todas las categorías':'Todas las marcas')+'</option>'+values.map(v=>'<option value="'+safe(v)+'">'+safe(v)+'</option>').join('');
      sel.value=values.includes(current)?current:'';
    }
  }
  for(const id of ['adminSearch','adminCategory','adminBrand','adminPageSize']) $(id).addEventListener(id==='adminSearch'?'input':'change',()=>{adminPage=1;draw();});
  $('adminClearFilters').addEventListener('click',()=>{$('adminSearch').value='';$('adminCategory').value='';$('adminBrand').value='';$('adminPageSize').value='10';onlyLowStock=false;$('filterLowStock').textContent='🔴 Ver solo stock bajo';$('filterLowStock').setAttribute('aria-pressed','false');adminPage=1;draw();});
  async function saveQuickAvailability(id,button){
    if(!authorized||!client)return;
    const product=rows.find(p=>String(p.id)===String(id));
    const select=document.querySelector(`.availability-select[data-id="${CSS.escape(String(id))}"]`);
    const feedback=document.querySelector(`.availability-feedback[data-feedback="${CSS.escape(String(id))}"]`);
    if(!product||!select)return;
    const next=select.value;
    button.disabled=true;button.textContent='Guardando…';
    if(feedback)feedback.textContent='';
    try{
      const {data,error}=await client.from('products').update({stock:next}).eq('id',id).select('*').single();
      if(error)throw error;
      Object.assign(product,data||{stock:next});
      if(feedback)feedback.textContent='✓ Guardado';
      note('Disponibilidad actualizada: '+product.name+' · '+next+'. La cantidad del inventario no se modificó.');
      draw();
    }catch(err){
      console.error('No se pudo guardar la disponibilidad:',err);
      if(feedback)feedback.textContent='No se pudo guardar';
      note('No se pudo guardar el estado de disponibilidad: '+(err?.message||String(err)));
      button.disabled=false;button.textContent='Reintentar';
    }
  }
  function draw(){
    const el=$('adminProducts');
    const query=$('adminSearch').value.trim().toLocaleLowerCase('es');
    const category=$('adminCategory').value,brand=$('adminBrand').value;
    const visible=rows.filter(p=>(!onlyLowStock||(privateInventory[p.id] && Number(privateInventory[p.id].quantity)<=Number(privateInventory[p.id].min_quantity)))&&(!category||(p.category||'VARIOS')===category)&&(!brand||(p.brand||'SIN MARCA')===brand)&&(!query||[p.name,p.model,p.brand,p.category,p.description].some(v=>String(v||'').toLocaleLowerCase('es').includes(query))));
    const size=Number($('adminPageSize').value)||10,pages=Math.max(1,Math.ceil(visible.length/size));adminPage=Math.min(adminPage,pages);
    $('adminResultCount').textContent=visible.length+' de '+rows.length+' productos encontrados';
    const pagination=$('adminPagination');pagination.innerHTML='<button type="button" id="adminPrev" '+(adminPage===1?'disabled':'')+'>← Anterior</button><span>Página '+adminPage+' de '+pages+'</span><button type="button" id="adminNext" '+(adminPage===pages?'disabled':'')+'>Siguiente →</button>';
    $('adminPrev').onclick=()=>{adminPage--;draw();};$('adminNext').onclick=()=>{adminPage++;draw();};
    const pageRows=visible.slice((adminPage-1)*size,adminPage*size);
    if(!visible.length){el.innerHTML='<div class="empty">'+(rows.length?'No se encontraron productos con estos filtros. Prueba otra búsqueda o limpia los filtros.':'Aún no hay productos. Pulsa “Añadir producto”.')+'</div>';showInventory();return;}
    el.innerHTML=pageRows.map(p=>{
      const inv=privateInventory[p.id], qty=inv?.quantity, minimum=inv?.min_quantity;
      const low=inv && qty<=minimum, empty=inv && qty===0;
      const tag=!inv?'Inventario sin registrar':empty?'AGOTADO · 0 unidades':low?'⚠ STOCK BAJO · '+qty+' unidades':'✓ '+qty+' unidades';
      const availability=['En stock','Producto llegando','Bajo pedido','Agotado'];
      const currentAvailability=availability.includes(p.stock)?p.stock:'En stock';
      return `<article class="admin-row ${low?'admin-low-stock':''} ${empty?'admin-no-stock':''}"><div class="mini-img">${p.image_url?`<img src="${safe(p.image_url)}" alt="">`:'✳'}</div><div class="admin-row-info"><b>${safe(p.name)}</b><span>${safe(p.brand)} · ${safe(p.model||'Sin modelo')} · Categoría: ${safe(p.category||'VARIOS')}</span><strong>${money(p.price)} · Mayorista: ${p.wholesale_price!=null?money(p.wholesale_price):"Igual al público"} · Costo: ${money(inv?.landed_cost||0)} · Utilidad bruta: ${money(Number(p.price)-Number(inv?.landed_cost||0))} · Mínimo: ${minimum??'—'} ${p.active?'':'· Oculto'}</strong><span class="admin-quantity-tag ${low?'critical':''}">${tag}</span></div><div class="admin-quick-availability"><label for="availability-${safe(p.id)}">Disponibilidad</label><select id="availability-${safe(p.id)}" class="availability-select" data-id="${safe(p.id)}">${availability.map(v=>`<option value="${safe(v)}" ${v===currentAvailability?'selected':''}>${safe(v)}</option>`).join('')}</select><button type="button" class="button button-outline save-availability" data-id="${safe(p.id)}">Guardar estado</button><small class="availability-feedback" data-feedback="${safe(p.id)}" aria-live="polite"></small></div><button class="button button-outline visibility" data-id="${safe(p.id)}">${p.active===false?"Mostrar en catálogo":"Ocultar del catálogo"}</button><button class="button button-outline edit" data-id="${safe(p.id)}">Editar</button><button class="button button-danger delete" data-id="${safe(p.id)}">Eliminar</button></article>`;
    }).join('');showInventory();
    el.querySelectorAll('.visibility').forEach(b=>b.onclick=()=>{const p=rows.find(p=>String(p.id)===b.dataset.id);if(p)toggleCatalogVisibility(p,b);});
    el.querySelectorAll('.save-availability').forEach(b=>b.onclick=()=>saveQuickAvailability(b.dataset.id,b));
    el.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openForm(rows.find(p=>p.id===b.dataset.id)));
    el.querySelectorAll('.delete').forEach(b=>b.onclick=()=>remove(b.dataset.id));
  }
  $('setAllMinimumOne').addEventListener('click',async()=>{
    if(!authorized||!client)return;
    if(!confirm('¿Establecer el stock mínimo de alerta en 1 para TODOS los productos? No se modificarán las cantidades disponibles.'))return;
    const button=$('setAllMinimumOne');button.disabled=true;
    try{
      const ids=rows.map(p=>p.id);
      let updated=0;
      for(let i=0;i<ids.length;i+=100){
        const chunk=ids.slice(i,i+100);
        const existing=chunk.filter(id=>privateInventory[id]);
        const missing=chunk.filter(id=>!privateInventory[id]);
        if(existing.length){const {error}=await client.from('jimport_inventory_private').update({min_quantity:1}).in('product_id',existing);if(error)throw error;updated+=existing.length;}
        if(missing.length){const {error}=await client.from('jimport_inventory_private').upsert(missing.map(id=>({product_id:id,quantity:0,min_quantity:1,landed_cost:0})),{onConflict:'product_id'});if(error)throw error;updated+=missing.length;}
      }
      await loadPrivate();note('Stock mínimo de alerta establecido en 1 para '+updated+' productos. Las cantidades existentes no cambiaron.');
    }catch(err){note('No se pudo completar la actualización: '+err.message+'; revisa los permisos de inventario.');await loadPrivate();}
    finally{button.disabled=false;}
  });
  $('filterLowStock').addEventListener('click',()=>{onlyLowStock=!onlyLowStock;$('filterLowStock').textContent=onlyLowStock?'Mostrar todos los productos':'🔴 Ver solo stock bajo';$('filterLowStock').setAttribute('aria-pressed',String(onlyLowStock));draw();});
  function openForm(p=null){$("formTitle").textContent=p?"Editar producto":"Nuevo producto";$("productId").value=p?.id||"";$("pName").value=p?.name||"";$("pBrand").value=p?.brand||"";$("pModel").value=p?.model||"";$("pPrice").value=p?.price??"";$("pWholesalePrice").value=p?.wholesale_price??"";$("pStock").value=p?.stock||"En stock";$("pQuantity").value=privateInventory[p?.id]?.quantity??0;$("pMinimum").value=privateInventory[p?.id]?.min_quantity??1;$("pCost").value=privateInventory[p?.id]?.landed_cost??0;$("pCategory").value=p?.category||"VARIOS";$("pImage").value=p?.image_url||"";$("pDescription").value=p?.description||"";updateCategoryChoices();form.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"});}
  let autosaveTimer=null, autosaving=false, pendingAutosave=false;
  const autoStatus=$('autosaveStatus');
  form.addEventListener('input',scheduleAutosave);
  form.addEventListener('change',scheduleAutosave);
  function scheduleAutosave(){
    clearTimeout(autosaveTimer);
    if(!$('productId').value)return;
    autoStatus.textContent='Cambios pendientes…';
    autosaveTimer=setTimeout(()=>{
      if(!form.checkValidity()){autoStatus.textContent='Completa los campos obligatorios para guardar.';return;}
      if(autosaving){pendingAutosave=true;return;}
      form.requestSubmit();
    },1500);
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!client){note("Supabase no está configurado. Revisa config.js.");return;}
    const id=$("productId").value;
    if(autosaving){pendingAutosave=true;return;}
    autosaving=true;autoStatus.textContent='Guardando cambios en Supabase…';
    const item={name:$("pName").value.trim(),brand:$("pBrand").value.trim(),model:$("pModel").value.trim()||null,price:Number($("pPrice").value),wholesale_price:$("pWholesalePrice").value===""?null:Number($("pWholesalePrice").value),stock:$("pStock").value,category:$("pCategory").value,image_url:$("pImage").value.trim()||null,description:$("pDescription").value.trim()||null,active:id?(rows.find(p=>String(p.id)===String(id))?.active!==false):true};
    if(!id)item.old_price=null;
    const save=payload=>id?client.from("products").update(payload).eq("id",id):client.from("products").insert(payload).select("id").single();
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
      {const inventory={product_id:id||result.data?.id,quantity:Number($('pQuantity').value),min_quantity:Number($('pMinimum').value),landed_cost:Number($('pCost').value)};const {error:invError}=await client.from('jimport_inventory_private').upsert(inventory,{onConflict:'product_id'});if(invError){note('Producto guardado, pero inventario no actualizado: '+invError.message);await refresh();return;}}
      if(!id)form.hidden=true;
      autoStatus.textContent='✓ Cambios guardados en Supabase.';
      note("Producto e inventario guardados correctamente.");await refresh();
    } catch(err) { console.error(err); note("Error inesperado al guardar: "+(err?.message||String(err))); }
    finally {autosaving=false;if(pendingAutosave){pendingAutosave=false;scheduleAutosave();}}
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
    // La disponibilidad explícita tiene prioridad para permitir marcar productos en camino,
    // incluso si todavía no tienen unidades físicas registradas.
    if(stockRaw.includes("lleg") || stockRaw.includes("próxim") || stockRaw.includes("proxim")) stock="Producto llegando";
    else if(["agotado","sin stock","out of stock"].includes(stockRaw) || qty===0) stock="Agotado";
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

        if(x.item.image_url&&!/^https?:\/\//i.test(x.item.image_url))errors.push(`Fila ${x.rowNumber}: la URL de imagen debe empezar por http:// o https://.`);
      }
      if(errors.length){importNote("No se importó ningún producto. Corrige estos errores y vuelve a intentarlo: "+errors.slice(0,8).join(" ")+(errors.length>8?` Y ${errors.length-8} error(es) más.`:""));return;}
      if(!mapped.length){importNote("No se encontraron filas con productos. Usa la hoja Productos de la plantilla JIMPORT.");return;}
      const incomingGroups=duplicateGroups([...rows,...mapped.map(x=>x.item)]);
      const existingIds=new Set(rows.map(p=>p.id));
      const risky=incomingGroups.filter(g=>g.some(p=>!existingIds.has(p.id)));
      if(risky.length){
        const names=risky.slice(0,5).map(g=>g[0].name).join(', ');
        importNote(`Importación detenida: se detectaron ${risky.length} posibles duplicados con el catálogo o dentro del Excel (${names}). Revisa los nombres y modelos antes de importar.`);
        return;
      }
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
    $("promotionId").value=p?.id||"";$("promoProduct").value=p?.product_id||"";showSelectedPromoProduct();$("promoTitle").value=p?.title||"";$("promoDescription").value=p?.description||"";
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
    const item={product_id:product?String(product.id):null,regular_price:regular===""?null:Number(regular),sale_price:sale===""?null:Number(sale),title:$("promoTitle").value.trim(),description:$("promoDescription").value.trim()||null,image_url:image,link_url:$("promoLink").value.trim()||(product?`index.html?buscar=${encodeURIComponent(product.model||product.name)}#productos`:null),button_text:$("promoButton").value.trim()||"Ver oferta",active:$("promoActive").checked};
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

  const saleSelections=new Map();
  const saleComboSelections=new Map();
  let saleCombos=[];
  async function loadSaleCombos(){
    if(!client)return;
    const {data,error}=await client.from('jimport_super_combos').select('id,name,items,combo_price,active').order('name');
    if(error){$('saleComboChoices').textContent='No se pudieron cargar los Súper Combos: '+error.message;return;}
    saleCombos=data||[];renderSaleCombos();
  }
  function renderSaleCombos(){
    const el=$('saleComboChoices');if(!el)return;
    el.replaceChildren();
    if(!saleCombos.length){el.textContent='No hay Súper Combos registrados.';return;}
    for(const c of saleCombos){
      const id=String(c.id),sel=saleComboSelections.get(id),parts=(c.items||[]).map(x=>rows.find(p=>String(p.id)===String(x))).filter(Boolean);
      const available=parts.length===(c.items||[]).length&&parts.every(p=>saleAvailable(p)!==null)?Math.min(...parts.map(p=>saleAvailable(p))):null;
      const card=document.createElement('article');card.className='sale-product-card'+(sel?' is-selected':'');
      const title=document.createElement('strong');title.textContent=c.name;
      const desc=document.createElement('small');desc.textContent=parts.map(p=>p.name).join(' + ')||'Revisa los productos del combo';
      const stock=document.createElement('span');stock.className='sale-stock';stock.textContent=available===null?'Revisar inventario':`Combos disponibles: ${available}`;
      const check=document.createElement('input');check.type='checkbox';check.checked=!!sel;check.disabled=available===0&&!sel;
      const label=document.createElement('label');label.append(check,document.createTextNode(' Seleccionar Súper Combo'));
      const qty=document.createElement('input');qty.type='number';qty.min='1';qty.step='1';qty.value=sel?.quantity||1;qty.disabled=!sel;qty.style.width='90px';
      check.addEventListener('change',()=>{if(check.checked){const prices={};parts.forEach(p=>prices[String(p.id)]='');saleComboSelections.set(id,{quantity:1,prices});}else saleComboSelections.delete(id);renderSaleCombos();renderSaleSummary();});
      qty.addEventListener('input',()=>{if(saleComboSelections.has(id)){saleComboSelections.get(id).quantity=Number(qty.value);renderSaleSummary();}});
      const fields=document.createElement('div');fields.style.display='grid';fields.style.gap='8px';fields.style.marginTop='8px';
      const qtyRow=document.createElement('label');qtyRow.textContent='Cantidad del combo: ';qtyRow.append(qty);fields.append(qtyRow);
      if(sel){
        const heading=document.createElement('small');heading.textContent='Ingresa el precio de venta manual de cada producto (no cambia con el modo público/mayorista):';fields.append(heading);
        parts.forEach(p=>{
          const row=document.createElement('label');row.style.display='flex';row.style.justifyContent='space-between';row.style.alignItems='center';row.style.gap='8px';
          const name=document.createElement('span');name.textContent=p.name;
          const price=document.createElement('input');price.type='number';price.min='0.01';price.step='0.01';price.placeholder='Precio $';price.value=sel.prices?.[String(p.id)]??'';price.style.width='120px';price.setAttribute('aria-label','Precio de venta de '+p.name);
          price.addEventListener('input',()=>{if(saleComboSelections.has(id)){saleComboSelections.get(id).prices[String(p.id)]=price.value;renderSaleSummary();}});
          row.append(name,price);fields.append(row);
        });
      }
      card.append(label,title,desc,stock,fields);el.append(card);
    }
  }

  const saleMoney=value=>'$'+Number(value||0).toFixed(2);
  const saleUnitPrice=p=>saleDisplayPriceMode==='wholesale'?Number(p?.wholesale_price??p?.price??0):Number(p?.price||0);
  function saleAvailable(p){const q=Number(p.quantity);return Number.isFinite(q)&&q>=0?q:null;}
  function populateSaleProducts(){
    const el=$('saleProductChoices');if(!el)return;
    const brandEl=$('saleBrandFilter');const oldBrand=brandEl?.value||'';
    const brands=[...new Set(rows.map(p=>String(p.brand||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    if(brandEl){brandEl.replaceChildren(new Option('Todas las marcas',''),...brands.map(x=>new Option(x,x)));brandEl.value=brands.includes(oldBrand)?oldBrand:'';}
    const term=($('saleProductSearch')?.value||'').toLocaleLowerCase().trim();const brand=brandEl?.value||'';
    const matches=rows.filter(p=>(!brand||p.brand===brand)&&[p.name,p.brand,p.model].join(' ').toLocaleLowerCase().includes(term));
    $('saleProductCount').textContent=matches.length+' productos';
    el.innerHTML=matches.map(p=>{const id=String(p.id),qty=saleSelections.get(id)||1,stock=saleAvailable(p),out=stock===0||String(p.stock||'').toLowerCase()==='agotado',selected=saleSelections.has(id),unitPrice=saleUnitPrice(p),missingPrice=unitPrice===null||!Number.isFinite(unitPrice);
      return `<article class="sale-product-card ${selected?'is-selected':''} ${out?'is-out':''}"><label class="sale-card-check"><input type="checkbox" data-sale-check="${safe(id)}" ${selected?'checked':''} ${((out&&!selected)||(missingPrice&&!selected))?'disabled':''}><span>Seleccionar</span></label><div class="sale-card-image">${p.image_url?`<img src="${safe(p.image_url)}" alt="${safe(p.name||'Producto')}" loading="lazy">`:'<span>📦</span>'}</div><div class="sale-card-info"><small>${safe(p.brand||'Sin marca')}</small><strong>${safe(p.name||'Producto')}</strong><b>${saleMoney(unitPrice)}</b><span class="sale-stock ${out||missingPrice?'empty':''}">${out?'Agotado':stock===null?'Existencias sin registrar':'Disponibles: '+stock}</span></div><label class="sale-card-quantity">Cantidad<input type="number" inputmode="numeric" data-sale-qty="${safe(id)}" min="1" ${stock!==null?'max="'+stock+'"':''} step="1" value="${qty}" ${selected?'':'disabled'}></label></article>`;}).join('')||'<p class="sale-empty">No se encontraron productos con estos filtros.</p>';
    el.querySelectorAll('[data-sale-check]').forEach(input=>input.addEventListener('change',()=>{const id=input.dataset.saleCheck;if(input.checked)saleSelections.set(id,1);else saleSelections.delete(id);populateSaleProducts();}));
    el.querySelectorAll('[data-sale-qty]').forEach(input=>input.addEventListener('input',()=>{const id=input.dataset.saleQty;if(saleSelections.has(id)){saleSelections.set(id,input.value===''?0:Number(input.value));renderSaleSummary();}}));
    renderSaleSummary();
  }
  function renderSaleSummary(){
    const summary=$('saleSelectedItems'),total=$('saleTotal');if(!summary||!total)return;
    const chosen=[...saleSelections].map(([id,qty])=>({p:rows.find(p=>String(p.id)===id),qty})).filter(x=>x.p);
    summary.replaceChildren();let amount=0;
    for(const {p,qty} of chosen){const line=document.createElement('div');line.className='sale-summary-line';const unitPrice=saleUnitPrice(p);const name=document.createElement('span');name.textContent=p.name+' × '+qty;const price=document.createElement('b');price.textContent=unitPrice===null?'Sin precio mayorista':saleMoney(unitPrice*qty);line.append(name,price);summary.append(line);if(unitPrice!==null)amount+=unitPrice*qty;}
    for(const [id,selection] of saleComboSelections){const c=saleCombos.find(x=>String(x.id)===id);if(!c)continue;const parts=(c.items||[]).map(x=>rows.find(p=>String(p.id)===String(x))).filter(Boolean);const subtotal=parts.reduce((sum,p)=>sum+Number(selection.prices?.[String(p.id)]||0),0);const complete=parts.length===(c.items||[]).length&&parts.every(p=>Number(selection.prices?.[String(p.id)]||0)>0);const line=document.createElement('div');line.className='sale-summary-line';const name=document.createElement('span');name.textContent='Súper Combo: '+c.name+' × '+selection.quantity;const price=document.createElement('b');price.textContent=complete?saleMoney(subtotal*selection.quantity):'Completa precios';line.append(name,price);summary.append(line);amount+=subtotal*selection.quantity;}
    if(!chosen.length&&!saleComboSelections.size)summary.textContent='Selecciona productos o Súper Combos para registrar la compra.';
    total.textContent='Total estimado: '+saleMoney(amount)+' · '+chosen.length+' producto(s) y '+saleComboSelections.size+' combo(s)';
  }
  $('saleProductSearch')?.addEventListener('input',populateSaleProducts);
  $('saleBrandFilter')?.addEventListener('change',populateSaleProducts);
  $('saleClearFilters')?.addEventListener('click',()=>{$('saleProductSearch').value='';$('saleBrandFilter').value='';populateSaleProducts();});
  $('saleClearSelection')?.addEventListener('click',()=>{saleSelections.clear();saleComboSelections.clear();populateSaleProducts();renderSaleCombos();});
  $('verifiedSaleForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const out=$('saleResult');
    const items=[...saleSelections].map(([product_id,quantity])=>({product_id,quantity}));
    const combos=[...saleComboSelections].map(([combo_id,v])=>({combo_id,quantity:v.quantity,items:Object.entries(v.prices||{}).map(([product_id,unit_price])=>({product_id,unit_price:Number(unit_price)}))}));
    const reference=$('saleReference').value.trim(),customer=$('saleCustomer').value.trim(),withCode=$('saleWithCode').checked;
    if((!items.length&&!combos.length)||!reference||items.some(x=>{const p=rows.find(p=>String(p.id)===String(x.product_id));return !p||saleUnitPrice(p)===null||!Number.isFinite(saleUnitPrice(p));})||combos.some(x=>!Number.isInteger(x.quantity)||x.quantity<1||!x.items.length||x.items.some(i=>!Number.isFinite(i.unit_price)||i.unit_price<=0))||items.some(x=>!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>100000)){out.textContent='Selecciona productos, ingresa un precio válido para cada componente de los Súper Combos y completa la referencia.';return;}
    const invalidStock=items.find(x=>{const p=rows.find(p=>String(p.id)===String(x.product_id));const stock=p&&saleAvailable(p);return stock!==null&&x.quantity>stock;});
    if(invalidStock){out.textContent='La cantidad supera las existencias disponibles. Revisa los productos seleccionados.';return;}
    if(!confirm('¿Confirmas la venta de '+items.length+' producto(s) y '+combos.length+' Súper Combo(s)? Se descontará el inventario de todos sus componentes.'))return;
    out.textContent='Registrando venta…';
    const {data,error}=await client.rpc('jimport_register_sale_with_combos',{sale_items:items,sale_combos:combos,sale_reference:reference,customer_label:customer,generate_code:withCode});
    if(error){out.textContent='No se pudo registrar la venta: '+error.message+'. Comprueba que ejecutaste JIMPORT_COMPRAS_COMBOS.sql en Supabase.';return;}
    const code=data?.code||null;const url=new URL('index.html',location.href);url.hash='opiniones';
    out.replaceChildren();const heading=document.createElement('strong');heading.textContent='Venta registrada. '+items.length+' producto(s) y '+combos.length+' Súper Combo(s). Inventario actualizado.';out.append(heading);
    if(code){const label=document.createElement('p');label.textContent='Código único para toda la compra: '+code;out.append(label);
      const productNames=items.map(x=>{const p=rows.find(p=>String(p.id)===String(x.product_id));return (p?.name||'Producto')+' × '+x.quantity;});
      productNames.push(...combos.map(x=>(saleCombos.find(c=>String(c.id)===x.combo_id)?.name||'Súper Combo')+' × '+x.quantity));
      const msg='Gracias por comprar en JIMPORT. Puedes calificar tu compra (todos los productos) con un solo código.\nProductos: '+productNames.join(', ')+'\nCódigo: '+code+'\nCalifícanos aquí: '+url.href;
      const share=document.createElement('a');share.className='button button-outline';share.target='_blank';share.rel='noopener noreferrer';share.textContent='Compartir código único por WhatsApp ↗';share.href='https://wa.me/?text='+encodeURIComponent(msg);out.append(share);
    }
    saleSelections.clear();saleComboSelections.clear();$('verifiedSaleForm').reset();await refresh();populateSaleProducts();renderSaleCombos();
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
  // No mostrar el panel hasta que checkAdmin confirme la autorización.
})();