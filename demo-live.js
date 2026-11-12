/* JIMPORT: interfaz de la demostración, datos reales desde Supabase.
 * La tienda pública no escribe ni modifica productos, promociones o inventario.
 * El panel original admin.html conserva los flujos de escritura autenticados.
 */
(() => {
'use strict';
const cfg=window.JIMPORT_CONFIG||{};
const db=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase?.createClient
  ?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>String(s??'');
const money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(n||0));
const norm=s=>text(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const photo=p=>esc(p?.image_url||'');
const wa=message=>'https://wa.me/'+text(cfg.WHATSAPP_NUMBER||'').replace(/\D/g,'')+'?text='+encodeURIComponent(message);
let products=[], promotions=[], combos=[], reviews=[], cart=[], limit=16, priceMode='retail';
const status=s=>{$('loadStatus').textContent=s||'';};
const available=p=>!norm(p?.stock).includes('agotad') && !norm(p?.stock).includes('llegando') && !(p?.quantity!==undefined&&p?.quantity!==null&&Number(p.quantity)===0);
const productPrice=p=>priceMode==='wholesale'?Number(p?.wholesale_price??p?.price??0):Number(p?.price??0);
const category=p=>text(p?.category||'OTROS').toUpperCase().trim();
const unique=arr=>[...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
function safeImg(p){return `<img loading="lazy" src="${photo(p)}" alt="${esc(p?.name||'Producto')}" onerror="this.style.visibility='hidden'">`;}
function categorySet(c){$('categoryFilter').value=c;limit=16;render();$('catalog').scrollIntoView({behavior:'smooth'});}
function render(){
 const q=norm($('search').value).trim(),c=$('categoryFilter').value,b=$('brandFilter').value;
 let arr=products.filter(p=>(!c||category(p)===c)&&(!b||p.brand===b)&&(!q||norm([p.name,p.brand,p.model,p.category,p.description].join(' ')).includes(q)));
 $('resultcount').textContent=arr.length+' productos en el catálogo';
 $('products').innerHTML=arr.slice(0,limit).map(p=>{
 const off=!available(p),price=productPrice(p),old=Number(p.old_price||0);
 return `<article class="product"><div class="photo">${safeImg(p)}<span class="tag ${off?'out':''}">${off?(norm(p.stock).includes('llegando')?'Llegando':'Agotado'):'Disponible'}</span></div><div class="body"><div class="brand">${esc(p.brand||'JIMPORT')}</div><h3>${esc(p.name)}</h3><div class="price ${price===0?'zero-price':''}">${price>0?money(price):'Consultar precio'}${old>price&&price>0?`<del>${money(old)}</del>`:''}</div><div class="actions"><button type="button" data-add="${esc(p.id)}" ${off||price<=0?'disabled':''}>🛒 Agregar</button><button type="button" data-detail="${esc(p.id)}">Ver detalle</button></div></div></article>`;
 }).join('')||'<p>No hay productos para esta búsqueda.</p>';
 $('loadMore').classList.toggle('hidden',arr.length<=limit);
 $('cartCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}
function renderCategories(){
 const cats=unique(products.map(category));
 $('categoryFilter').innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 const brands=unique(products.map(p=>p.brand||'JIMPORT'));
 $('brandFilter').innerHTML='<option value="">Todas las marcas</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');
 $('categories').innerHTML=cats.slice(0,6).map(c=>{const p=products.find(p=>category(p)===c&&p.image_url);return `<button class="cat" data-category="${esc(c)}">${safeImg(p||{})}<b>${esc(c)}</b></button>`;}).join('')||'<p>Sin categorías registradas.</p>';
 const hero=products.filter(p=>p.image_url&&available(p)&&Number(p.price)>0);
 $('heroProducts').innerHTML=hero.slice(0,2).map(safeImg).join('');
}
function renderPromotions(){
 $('livePromos').innerHTML=promotions.length?promotions.map(p=>{
 const real=products.find(x=>String(x.id)===String(p.product_id)),sale=Number(p.sale_price??real?.price??0),regular=Number(p.regular_price??real?.price??0);
 return `<article class="promo-live">${safeImg({image_url:p.image_url||real?.image_url,name:p.title})}<div><span class="eyebrow">OFERTA ACTIVA</span><h3>${esc(p.title||real?.name||'Promoción')}</h3><p>${esc(text(p.description).slice(0,140))}</p><b>${sale>0?money(sale):'Consultar precio'}</b>${regular>sale&&sale>0?` <del>${money(regular)}</del>`:''}<p><a class="primary" target="_blank" rel="noopener" href="${wa('Hola JIMPORT, quiero consultar la promoción '+(p.title||real?.name||'')+'. Precio: '+money(sale))}">Consultar promoción</a></p></div></article>`;
 }).join(''):'<p>No hay promociones activas en este momento.</p>';
}
function comboItems(c){return (Array.isArray(c.items)?c.items:[]).map(id=>products.find(p=>String(p.id)===String(typeof id==='object'?(id.product_id||id.id):id))).filter(Boolean);}
function renderCombos(){
 $('liveCombos').innerHTML=combos.length?combos.map(c=>{
 const ps=comboItems(c),price=Number(c.combo_price||0);
 return `<article class="combo-live"><div>${ps.slice(0,3).map(safeImg).join('')}</div><span class="eyebrow">SUPER COMBO</span><h3>${esc(c.name||'Combo JIMPORT')}</h3><p class="small">${esc(c.description||ps.map(p=>p.name).join(' + ')||'Consulta los artículos incluidos.')}</p><b>${price>0?money(price):'Consultar precio'}</b><a class="primary" target="_blank" rel="noopener" href="${wa('Hola JIMPORT, quiero consultar el Super Combo '+c.name+' por '+money(price))}">Consultar combo</a></article>`;
 }).join(''):'<p>Los Super Combos estarán disponibles próximamente.</p>';
}
function renderReviews(){
 if(!reviews.length){$('reviewsSummary').textContent='Aún no hay opiniones publicadas.';$('reviewsList').innerHTML='';return;}
 const avg=reviews.reduce((s,r)=>s+Number(r.rating||0),0)/reviews.length;
 $('reviewsSummary').textContent='★ '+avg.toFixed(1)+' / 5 · '+reviews.length+' opiniones recientes publicadas';
 $('reviewsList').innerHTML=reviews.map(r=>`<article class="review-live"><b>${esc(r.name||'Cliente')}</b> ${r.verified_purchase?'<small>✓ Compra verificada</small>':''}<div class="stars">${'★'.repeat(Math.max(0,Math.min(5,Number(r.rating)||0)))}</div><p>${esc(r.comment)}</p></article>`).join('');
}
function modal(s){$('modal').innerHTML='<button class="close" data-close>×</button>'+s;$('overlay').style.display='flex';}
function hideModal(){$('overlay').style.display='none';}
function find(id){return products.find(p=>String(p.id)===String(id));}
function detail(id){
 const p=find(id);if(!p)return;
 modal(`<div class="detail"><div class="detailimg">${safeImg(p)}</div><div><div class="brand">${esc(p.brand||'JIMPORT')} · ${esc(p.model||'')}</div><h2>${esc(p.name)}</h2><div class="price">${Number(productPrice(p))>0?money(productPrice(p)):'Consultar precio'}</div><p>${esc(p.description||'Consulta disponibilidad y características por WhatsApp.')}</p><p><b>Estado:</b> ${esc(p.stock||'Consultar')} · <b>Categoría:</b> ${esc(p.category||'')}</p><button class="primary" type="button" data-add="${esc(p.id)}" ${available(p)&&productPrice(p)>0?'':'disabled'}>Agregar al carrito</button><p class="small"><a href="${wa('Hola JIMPORT, quiero consultar '+p.name+' · '+(p.model||'')+' · '+money(productPrice(p))+' · Imagen: '+(p.image_url||''))}" target="_blank" rel="noopener">Consultar producto por WhatsApp ↗</a></p></div></div>`);
}
function addCart(id){const p=find(id);if(!p||!available(p)||productPrice(p)<=0)return;const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({id,qty:1});render();hideModal();}
function showCart(){
 const rows=cart.map(x=>{const p=find(x.id);return p?`<p>${esc(p.name)} × ${x.qty} — ${money(productPrice(p)*x.qty)} <button type="button" data-remove="${esc(x.id)}">Quitar</button></p>`:''}).join('');
 const total=cart.reduce((s,x)=>s+productPrice(find(x.id))*x.qty,0);
 modal('<h2>Tu carrito</h2>'+(cart.length?rows+'<h3>Total estimado: '+money(total)+'</h3><button class="primary" data-send>Consultar por WhatsApp ↗</button>':'Tu carrito está vacío.'));
}
function sendCart(){if(!cart.length)return;const lines=cart.map(x=>{const p=find(x.id);return '- '+p.name+' × '+x.qty+' · '+money(productPrice(p)*x.qty)+'\n  Imagen: '+(p.image_url||'');});const total=cart.reduce((s,x)=>s+productPrice(find(x.id))*x.qty,0);window.open(wa('Hola JIMPORT, deseo confirmar mi pedido:\n'+lines.join('\n')+'\nTotal estimado: '+money(total)+'\n¿Me confirman disponibilidad y envío?'),'_blank','noopener');}
async function pages(table,fields='*',where=null){
 const all=[];for(let i=0;i<20000;i+=500){let query=db.from(table).select(fields).range(i,i+499);if(where)query=where(query);const {data,error}=await query;if(error)throw error;all.push(...(data||[]));if(!data||data.length<500)break;}return all;
}
async function submitReview(e){
 e.preventDefault();const msg=$('reviewMessage'),button=e.submitter;
 if(!db){msg.textContent='No está disponible la conexión con el sistema.';return;}
 const first=$('reviewFirst').value.trim(),last=$('reviewLast').value.trim(),code=$('reviewCode').value.trim(),rating=Number($('reviewRating').value),comment=$('reviewComment').value.trim();
 if(!first||!last||!code||comment.length<10||rating<1||rating>5){msg.textContent='Completa los campos correctamente.';return;}
 button.disabled=true;msg.textContent='Enviando…';
 try{const {error}=await db.rpc('submit_verified_review',{purchase_code:code,reviewer_name:(first+' '+last).trim(),review_rating:rating,review_comment:comment});if(error)throw error;e.target.reset();msg.textContent='¡Gracias! Tu opinión fue recibida para su revisión.';}
 catch(err){console.error(err);msg.textContent='No se pudo verificar el código de compra. Revisa el código y vuelve a intentarlo.';}finally{button.disabled=false;}
}
async function init(){
 $('reviewMessage').textContent='';$('verifiedReviewForm').addEventListener('submit',submitReview);
 document.querySelector('.whatsapp').href=wa('Hola JIMPORT, quisiera información sobre sus productos.');
 if(!db){status('No se pudo configurar la conexión a Supabase. Revisa config.js.');return;}
 try{
  const [catalog,setting]=await Promise.all([pages('products'),db.from('jimport_store_settings').select('display_price_mode').eq('id','main').maybeSingle()]);
  products=catalog.filter(p=>p.active!==false);
  if(!setting.error && setting.data?.display_price_mode==='wholesale')priceMode='wholesale';
  $('priceMode').value=priceMode==='wholesale'?'wholesale':'public';$('priceMode').disabled=true;$('priceMode').title='El administrador decide el modo de precios global de la tienda';
  renderCategories();render();status('');
  const requests=await Promise.allSettled([
    pages('promotions','*',q=>q.eq('active',true).order('created_at',{ascending:false})),
    pages('jimport_super_combos','*',q=>q.eq('active',true).order('created_at',{ascending:false})),
    pages('reviews','name,rating,comment,created_at,verified_purchase',q=>q.eq('approved',true).order('created_at',{ascending:false}).limit(30))
  ]);
  promotions=requests[0].status==='fulfilled'?requests[0].value:[];
  combos=requests[1].status==='fulfilled'?requests[1].value:[];
  reviews=requests[2].status==='fulfilled'?requests[2].value:[];
  requests.forEach((r,i)=>{if(r.status==='rejected')console.warn('JIMPORT módulo '+['promociones','combos','opiniones'][i],r.reason);});
  renderPromotions();renderCombos();renderReviews();
 }catch(error){console.error('JIMPORT:',error);status('No se pudieron cargar los productos desde Supabase. Revisa la conexión y permisos del catálogo.');}
}
// Delegación: no inyecta HTML escrito por el visitante en rutas o consultas.
document.addEventListener('click',e=>{
 const cat=e.target.closest('[data-category]'),add=e.target.closest('[data-add]'),view=e.target.closest('[data-detail]'),close=e.target.closest('[data-close]'),remove=e.target.closest('[data-remove]'),send=e.target.closest('[data-send]');
 if(cat)categorySet(cat.dataset.category);else if(add)addCart(add.dataset.add);else if(view)detail(view.dataset.detail);else if(close)hideModal();else if(remove){cart=cart.filter(i=>i.id!==remove.dataset.remove);showCart();render();}else if(send)sendCart();
});
window.render=()=>{limit=16;render()};window.setCategory=categorySet;window.showCart=showCart;window.hideModal=hideModal;
window.showAdmin=()=>{location.href='admin.html'};
window.addCart=addCart;window.detail=detail;
window.addEventListener('DOMContentLoaded',init);
})();
