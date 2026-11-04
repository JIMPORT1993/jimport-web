(()=>{'use strict';
const cfg=window.JIMPORT_CONFIG||{},db=window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY),$=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(n||0));
let products=[],combos=[],registeredBrands=[],registeredCategories=[],selected=[],editing='',loading=false;
const status=t=>{const el=$('jxAdminStatus');if(el)el.textContent=t;};
const productBrand=p=>String(p?.brand??p?.brand_name??p?.marca??'').trim();
const extractBrandValue=row=>String(row?.name??row?.brand??row?.brand_name??row?.marca??'').trim();
const normalizedKey=value=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('es');
const getAvailableBrands=()=>[...new Set([...registeredBrands,...products.map(productBrand)].map(x=>String(x||'').trim()).filter(Boolean))];
async function ready(){if(loading||!db)return;try{const {data,error}=await db.auth.getSession();if(error)throw error;if(!data?.session)return;const {data:admin,error:adminError}=await db.rpc('jimport_is_admin');if(adminError||!admin)return;await load();}catch(err){status('No se pudo cargar Súper Combos: '+(err?.message||err));}}
async function load(){if(!db||loading)return;loading=true;try{
 const [a,b,c,d]=await Promise.all([
  db.from('products').select('*').order('name').limit(3000),
  db.from('jimport_super_combos').select('*').order('created_at',{ascending:false}),
  db.from('jimport_brands').select('name').order('name'),
  db.from('jimport_categories').select('name').order('name')
 ]);
 if(a.error){status('Error al cargar productos: '+a.error.message);return;}
 products=a.data||[];combos=b.error?[]:(b.data||[]);
 registeredBrands=c.error?[]:(c.data||[]).map(extractBrandValue).filter(Boolean);
 registeredCategories=d.error?[]:(d.data||[]).map(x=>String(x?.name||'').trim()).filter(Boolean);
 drawBrands();drawCategories();drawChoices();drawList();
 if(b.error)status('No se pudieron cargar los combos: '+b.error.message);
 else if(c.error||d.error)status('Los filtros se cargaron con las marcas y categorías de los productos. '+[c.error,d.error].filter(Boolean).map(e=>e.message).join(' · '));
 else status('Productos y filtros actualizados.');
 }catch(err){status('Error al actualizar los filtros: '+(err?.message||err));}finally{loading=false;}}
function drawBrands(){const select=$('jxBrandFilter');if(!select)return;const previous=select.value;const names=new Map();for(const name of [...registeredBrands,...products.map(productBrand)]){const raw=String(name||'').trim();const key=normalizedKey(raw);if(key&&!names.has(key))names.set(key,raw.toLocaleUpperCase('es'));}select.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Todas las marcas';select.append(all);for(const [key,name] of [...names.entries()].sort((a,b)=>a[1].localeCompare(b[1],'es'))){const option=document.createElement('option');option.value=key;option.textContent=name;select.append(option);}select.value=names.has(previous)?previous:'';}
function drawCategories(){const select=$('jxCategoryFilter');if(!select)return;const previous=select.value;const names=new Map();for(const name of [...registeredCategories,...products.map(p=>p.category)]){const raw=String(name||'').trim()||'VARIOS';const key=normalizedKey(raw);if(key&&!names.has(key))names.set(key,raw.toLocaleUpperCase('es'));}select.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Todas las categorías';select.append(all);for(const [key,name] of [...names.entries()].sort((a,b)=>a[1].localeCompare(b[1],'es'))){const option=document.createElement('option');option.value=key;option.textContent=name;select.append(option);}select.value=names.has(previous)?previous:'';}
function drawChoices(){
 const q=($('jxProductSearch')?.value||'').trim().toLocaleLowerCase('es'),brand=$('jxBrandFilter')?.value||'',category=$('jxCategoryFilter')?.value||'',sort=$('jxProductSort')?.value||'name';
 const shown=products.filter(p=>p.active!==false&&(!brand||normalizedKey(productBrand(p))===brand)&&(!category||normalizedKey(p.category||'VARIOS')===category)&&[p.name,productBrand(p),p.model,p.category].join(' ').toLowerCase().includes(q));
 shown.sort((a,b)=>sort==='price-asc'?Number(a.price||0)-Number(b.price||0):sort==='price-desc'?Number(b.price||0)-Number(a.price||0):String(a.name||'').localeCompare(String(b.name||''),'es'));
 const target=$('jxProductChoices');target.replaceChildren();
 for(const p of shown){
  const label=document.createElement('label');label.className='jx-choice jx-choice-photo';
  const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.includes(String(p.id));
  cb.onchange=()=>{selected=cb.checked?[...selected,String(p.id)]:selected.filter(id=>id!==String(p.id));label.classList.toggle('jx-choice-selected',cb.checked);estimate();};
  label.classList.toggle('jx-choice-selected',cb.checked);
  const photo=document.createElement('div');photo.className='jx-choice-image';
  if(p.image_url&&/^https?:\/\//i.test(p.image_url)){
   const img=document.createElement('img');img.src=p.image_url;img.alt='Fotografía de '+p.name;img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>{photo.textContent='Sin foto';img.remove();};photo.append(img);
  }else photo.textContent='Sin foto';
  const details=document.createElement('div');details.className='jx-choice-details';
  const name=document.createElement('strong');name.textContent=p.name;
  const model=document.createElement('small');model.textContent=[productBrand(p),p.model,p.category||'VARIOS'].filter(Boolean).join(' · ');
  const price=document.createElement('b');price.textContent=money(p.price);
  details.append(name,model,price);label.append(cb,photo,details);target.append(label);
 }
 if(!shown.length){const empty=document.createElement('p');empty.className='jx-empty';empty.textContent='No hay productos con estos filtros.';target.append(empty);}
 estimate();
}
function estimate(){const sum=selected.reduce((s,id)=>s+Number(products.find(p=>String(p.id)===id)?.price||0),0);const price=Number($('jxComboPrice').value||0);$('jxComboEstimate').textContent=`${selected.length} productos · Precio individual total: ${money(sum)} · Precio combo: ${money(price)}${price>0&&price<sum?' · Ahorro: '+money(sum-price):''}`;}
function unifyComboInfo(){
 const chosen=selected.map(id=>products.find(p=>String(p.id)===id)).filter(Boolean);
 if(chosen.length<2){status('Selecciona al menos dos productos para unificar la información.');return;}
 const unique=(arr)=>[...new Set(arr.map(v=>String(v||'').trim()).filter(Boolean))];
 const brands=unique(chosen.map(productBrand));
 const names=chosen.map(p=>p.name).filter(Boolean);
 const models=unique(chosen.map(p=>p.model));
 const generatedName='Combo '+(brands.length?brands.join(' + ')+' · ':'')+names.join(' + ');
 const details=chosen.map(p=>{
   const bits=[p.name,p.model&&'Modelo: '+p.model,p.description,p.specifications&&'Características: '+p.specifications].filter(Boolean);
   return bits.join(' — ');
 });
 const generatedDescription=details.join(' | ');
 $('jxComboName').value=generatedName.slice(0,120);
 $('jxComboDescription').value=generatedDescription.slice(0,450);
 const preview=$('jxComboUnifiedPreview');
 if(preview){preview.replaceChildren();const title=document.createElement('strong');title.textContent='Un solo Súper Combo: '+generatedName;const desc=document.createElement('p');desc.textContent=generatedDescription;preview.append(title,desc);}
 status('Información de los productos unificada en un solo combo. Puedes editar el nombre y la descripción antes de guardar.');
}
function reset(){editing='';selected=[];$('jxComboForm').reset();$('jxComboId').value='';$('jxComboActive').checked=true;drawChoices();}
function drawList(){const el=$('jxComboList');el.replaceChildren();if(!combos.length){el.textContent='Todavía no has creado Súper Combos.';return;}combos.forEach(c=>{const row=document.createElement('div');row.className='jx-admin-row';const label=document.createElement('div');const strong=document.createElement('strong');strong.textContent=c.name+' · '+money(c.combo_price);const small=document.createElement('small');small.textContent=(c.items||[]).length+' productos · '+(c.active?'Publicado':'Oculto');label.append(strong,small);const edit=document.createElement('button');edit.className='button button-outline';edit.textContent='Editar';edit.onclick=()=>{editing=c.id;selected=(c.items||[]).map(String);$('jxComboId').value=c.id;$('jxComboName').value=c.name;$('jxComboPrice').value=c.combo_price;$('jxComboDescription').value=c.description||'';$('jxComboActive').checked=c.active;drawChoices();$('jxComboAdmin').scrollIntoView({behavior:'smooth'});};const toggle=document.createElement('button');toggle.className='button button-outline';toggle.textContent=c.active?'Ocultar':'Publicar';toggle.onclick=async()=>{const {error}=await db.from('jimport_super_combos').update({active:!c.active}).eq('id',c.id);if(error)status(error.message);else await load();};const del=document.createElement('button');del.className='button button-outline';del.textContent='Eliminar';del.onclick=async()=>{if(!confirm('¿Eliminar el Súper Combo «'+c.name+'»? No se borrarán los productos.'))return;const {error}=await db.from('jimport_super_combos').delete().eq('id',c.id);if(error)status(error.message);else await load();};row.append(label,edit,toggle,del);el.append(row);});}
$('jxComboForm').addEventListener('submit',async e=>{e.preventDefault();if(selected.length<2){status('Selecciona al menos dos productos distintos.');return;}const price=Number($('jxComboPrice').value);if(!(price>0)){status('Ingresa un precio promocional válido.');return;}const payload={name:$('jxComboName').value.trim(),description:$('jxComboDescription').value.trim(),items:selected,combo_price:price,active:$('jxComboActive').checked};const result=editing?await db.from('jimport_super_combos').update(payload).eq('id',editing):await db.from('jimport_super_combos').insert(payload);if(result.error){status('No se pudo guardar: '+result.error.message);return;}status('Súper Combo guardado. Ya puedes verlo publicado si está activado.');reset();await load();});
$('jxProductSearch')?.addEventListener('input',drawChoices);$('jxBrandFilter')?.addEventListener('change',drawChoices);$('jxCategoryFilter')?.addEventListener('change',drawChoices);$('jxProductSort')?.addEventListener('change',drawChoices);$('jxComboPrice')?.addEventListener('input',estimate);$('jxUnifyCombo')?.addEventListener('click',unifyComboInfo);if($('jxComboCancel'))$('jxComboCancel').onclick=reset;if($('jxReload'))$('jxReload').onclick=load;window.addEventListener('jimport-admin-ready',ready);ready();
})();
