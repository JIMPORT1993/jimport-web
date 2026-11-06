(()=>{'use strict';
const cfg=window.JIMPORT_CONFIG||{},db=window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY),$=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(n||0)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=[],combos=[],cart=[],compare=[],displayPriceMode="retail";
const displayPrice=p=>displayPriceMode==="wholesale"?Number(p?.wholesale_price??p?.price??0):Number(p?.price||0);
const photo=p=>p?.image_url?'\n📷 '+p.image_url:'';
const wa=msg=>'https://wa.me/'+String(cfg.WHATSAPP_NUMBER||'').replace(/\D/g,'')+'?text='+encodeURIComponent(msg);
function visible(p){return p.active!==false;}
async function start(){if(!db)return;const [a,b,c]=await Promise.all([db.from('products').select('*').limit(3000),db.from('jimport_super_combos').select('*').eq('active',true).order('created_at',{ascending:false}),db.from('jimport_store_settings').select('display_price_mode').eq('id','main').maybeSingle()]);if(!c.error)displayPriceMode=c.data?.display_price_mode||'retail';if(!a.error)products=(a.data||[]).filter(visible);if(!b.error)combos=b.data||[];else $('jxCombos').textContent='Los Súper Combos estarán disponibles próximamente. Activa su tabla en Supabase.';drawCombos();drawCompare();enhanceCards();new MutationObserver(()=>enhanceCards()).observe($('productGrid'),{childList:true,subtree:false});}
function get(id){return products.find(p=>String(p.id)===String(id));}
function cartAdd(id,qty=1){const p=get(id);if(!p||p.stock==='Agotado')return;const found=cart.find(x=>x.id===String(id));if(found)found.qty+=qty;else cart.push({id:String(id),qty});drawCart();}
window.JIMPORT_CART_ADD=cartAdd;
function comboAdd(c){const ids=c.items||[];const label=c.name;cart.push({comboId:c.id,label,price:Number(c.combo_price),ids});drawCart();}
function drawCart(){const bar=$('jxCartBar');if(!bar)return;const total=cart.reduce((s,x)=>s+(x.comboId?x.price:displayPrice(get(x.id))*x.qty),0);bar.hidden=!cart.length;if(!cart.length)return;bar.innerHTML=`<div><b>🛒 Mi pedido · ${cart.length} selección(es)</b><span>Total estimado: ${money(total)}</span></div><button type="button" data-jx="view">Ver pedido</button><button type="button" data-jx="send">Enviar por WhatsApp</button>`;bar.querySelector('[data-jx="view"]').onclick=showCart;bar.querySelector('[data-jx="send"]').onclick=sendCart;}
function showCart(){let d=$('jxCartDialog');if(!d){d=document.createElement('dialog');d.id='jxCartDialog';d.className='jx-dialog';document.body.append(d);}d.innerHTML=`<h2>Tu pedido</h2>${cart.map((x,i)=>`<div class="jx-cart-line"><span>${esc(x.comboId?'🔥 '+x.label:(get(x.id)?.name||'Producto')+' × '+x.qty)}</span><b>${money(x.comboId?x.price:displayPrice(get(x.id))*x.qty)}</b><button type="button" data-remove="${i}" aria-label="Quitar">✕</button></div>`).join('')}<p>El precio final, stock y entrega se confirman por WhatsApp.</p><div class="jx-actions"><button class="button" data-send>Enviar pedido</button><button class="button button-outline" data-close>Cerrar</button></div>`;d.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);drawCart();showCart();});d.querySelector('[data-send]').onclick=sendCart;d.querySelector('[data-close]').onclick=()=>d.close();if(!d.open)d.showModal();}
function sendCart(){if(!cart.length)return;const lines=cart.map(x=>x.comboId?`• Súper Combo: ${x.label} — ${money(x.price)} (${x.ids.length} artículos)`:`• ${get(x.id)?.name||'Producto'} × ${x.qty} — ${money(displayPrice(get(x.id))*x.qty)+photo(get(x.id))}`);const total=cart.reduce((s,x)=>s+(x.comboId?x.price:displayPrice(get(x.id))*x.qty),0);window.open(wa('Hola JIMPORT, quisiera confirmar este pedido:\n'+lines.join('\n')+'\nTotal estimado: '+money(total)+'\n¿Me confirman disponibilidad, garantía y entrega?'),'_blank','noopener');}
function showComboInfo(c){
 const ps=(Array.isArray(c.items)?c.items:[]).map(get).filter(Boolean);
 let dlg=document.getElementById('jimportComboInfoDialog');
 if(!dlg){dlg=document.createElement('dialog');dlg.id='jimportComboInfoDialog';dlg.className='jimport-product-dialog';document.body.appendChild(dlg);dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});}
 const desc=c.description?`<p class="jimport-dialog-text">${esc(c.description)}</p>`:'';
 const list=ps.map(p=>`<li>${esc(p.name)}</li>`).join('');
 dlg.innerHTML=`<div class="jimport-dialog-head"><strong>Descripción del Súper Combo</strong><button type="button" class="jimport-dialog-close" aria-label="Cerrar descripción">✕</button></div><h3>${esc(c.name)}</h3>${desc}<p class="jimport-dialog-model">Productos incluidos:</p><ul class="jx-combo-dialog-items">${list}</ul><strong class="jimport-dialog-price">${money(c.combo_price)}</strong><a class="button" target="_blank" rel="noopener noreferrer" href="${wa('Hola JIMPORT, deseo información sobre el Súper Combo '+c.name+'\n💵 Precio del combo: '+money(c.combo_price))}">Consultar por WhatsApp ↗</a>`;
 dlg.querySelector('.jimport-dialog-close').onclick=()=>dlg.close();
 dlg.showModal();
}
function drawCombos(){
 const el=$('jxCombos');if(!el)return;
 if(!combos.length){el.innerHTML='<p class="jx-empty">Próximamente publicaremos nuestros Súper Combos.</p>';return;}
 el.innerHTML=combos.map(c=>{
  const ps=(Array.isArray(c.items)?c.items:[]).map(get).filter(Boolean);
  if(ps.length<2)return '';
  const details=[c.description?`<p>${esc(c.description)}</p>`:'',`<ul>${ps.map(p=>`<li>${esc(p.name)}</li>`).join('')}</ul>`].join('');
  const images=ps.slice(0,4).map(p=>p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<span class="jx-combo-placeholder" aria-label="Sin fotografía">📦</span>`).join('');
  const query='Hola JIMPORT, quiero consultar el Súper Combo '+c.name+' por '+money(c.combo_price)+'\n'+ps.map(p=>p.name+photo(p)).join('\n');
  return `<article class="jx-combo jx-combo-compact"><div class="jx-combo-images jx-combo-photo-grid">${images}</div><div class="jx-combo-content"><span class="jx-combo-tag">🔥 SÚPER COMBO</span><h3 title="${esc(c.name)}">${esc(c.name)}</h3><div class="jx-price"><strong>${money(c.combo_price)}</strong></div><button type="button" class="jx-combo-info-button teaser-info-button" data-combo-info="${esc(c.id)}">Ver descripción ＋</button><button type="button" class="button jx-combo-add" data-combo="${esc(c.id)}">Añadir al pedido</button><a class="jx-quick" target="_blank" rel="noopener noreferrer" href="${wa(query)}">Consultar por WhatsApp</a></div></article>`;
 }).join('');
 el.querySelectorAll('[data-combo-info]').forEach(b=>b.onclick=()=>{const c=combos.find(x=>String(x.id)===b.dataset.comboInfo);if(c)showComboInfo(c);});
 el.querySelectorAll('[data-combo]').forEach(b=>b.onclick=()=>{const c=combos.find(x=>String(x.id)===b.dataset.combo);if(c)comboAdd(c);});
}

function enhanceCards(){document.querySelectorAll('#productGrid .product-card').forEach((card,i)=>{if(card.querySelector('.jx-card-actions'))return;const title=card.querySelector('h3')?.textContent?.trim(),p=products.find(x=>x.name===title);if(!p)return;const actions=document.createElement('div');actions.className='jx-card-actions';actions.innerHTML=`<button type="button" class="jx-add">+ Añadir al pedido</button><button type="button" class="jx-compare-add">Comparar</button>`;card.querySelector('.product-info')?.append(actions);actions.querySelector('.jx-add').onclick=()=>cartAdd(p.id);actions.querySelector('.jx-compare-add').onclick=()=>{const id=String(p.id);compare=compare.includes(id)?compare.filter(x=>x!==id):[...compare.slice(-1),id];drawCompare();$('jxCompareSection').scrollIntoView({behavior:'smooth'});};});}
function clean(v){return String(v??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function localAnalysis(a,b){
 const av=displayPrice(a),bv=displayPrice(b),diff=Math.abs(av-bv);
 const txt=p=>[p.name,p.model,p.description,typeof p.specifications==='string'?p.specifications:JSON.stringify(p.specifications||{})].filter(Boolean).join(' ');
 const A=txt(a),B=txt(b),spec=(t,re)=>{const m=t.match(re);return m?Number(m[1]):null;};
 const watts=[spec(A,/(\d+(?:[.,]\d+)?)\s*W(?:atts?)?\b/i),spec(B,/(\d+(?:[.,]\d+)?)\s*W(?:atts?)?\b/i)];
 const parts=[];
 if(av>0&&bv>0){const cheap=av<=bv?a:b;parts.push('Precio: '+cheap.name+' es '+(av===bv?'igual de económico que la otra opción.':'la opción más económica por '+money(diff)+'.'));}
 if(watts.every(v=>v!==null)&&watts[0]!==watts[1]){const powerful=watts[0]>watts[1]?a:b;parts.push('Potencia anunciada: '+powerful.name+' indica '+Math.max(...watts)+' W frente a '+Math.min(...watts)+' W. Más potencia no garantiza compatibilidad con todos los dispositivos.');}
 else parts.push('No hay datos de potencia comparables suficientes para concluir cuál ofrece más rendimiento.');
 if(String(a.category||'').toLowerCase()!==String(b.category||'').toLowerCase())parts.push('Son categorías diferentes; revisa que ambos accesorios resuelvan la misma necesidad.');
 parts.push('Recomendación: prioriza compatibilidad con tu dispositivo, conectores y garantía. '+(av>0&&bv>0?'Si ambos cumplen los requisitos, '+(av<=bv?a.name:b.name)+' tiene el menor precio registrado.':'Confirma los datos faltantes con JIMPORT.'));
 return parts;
}
function drawCompare(){const el=$('jxCompare');if(!el)return;const selected=compare.map(get).filter(Boolean);
 el.innerHTML=selected.length?`<div class="jx-compare-grid">${selected.map(p=>`<article><img src="${esc(p.image_url||'')}" alt="${esc(p.name)}"><h3>${esc(p.name)}</h3><p>${esc(p.brand||'')} · ${esc(p.model||'')}</p><strong>${money(p.price)}</strong><p>${esc(clean(p.description||'Sin descripción'))}</p><p>${esc(clean(typeof p.specifications==='string'?p.specifications:JSON.stringify(p.specifications||'')))}</p></article>`).join('')}</div><div class="jx-compare-tools"><button type="button" class="button" id="jxCompareNow" ${selected.length!==2?'disabled':''}>✨ Compara ahora</button><button type="button" class="jx-quick" id="jxClearCompare">Limpiar comparación</button></div><div id="jxCompareResult" class="jx-compare-result" role="status" aria-live="polite">${selected.length<2?'Selecciona un segundo producto para obtener el análisis.':'Presiona «Compara ahora» para recibir una recomendación.'}</div>`:'<p>En el catálogo, elige «Comparar» en dos productos y pulsa «Compara ahora» para ver la recomendación aquí mismo.</p>';
 if($('jxClearCompare'))$('jxClearCompare').onclick=()=>{compare=[];drawCompare();};
 if($('jxCompareNow'))$('jxCompareNow').onclick=()=>{const [a,b]=selected;const result=$('jxCompareResult');result.replaceChildren();const title=document.createElement('h3');title.textContent='Análisis de compra JIMPORT';result.append(title);for(const line of localAnalysis(a,b)){const p=document.createElement('p');p.textContent=line;result.append(p);}const note=document.createElement('small');note.textContent='Comparación automática basada en los datos registrados en el catálogo. No utiliza un modelo de IA generativa ni verifica especificaciones externas.';result.append(note);};
}

start();
})();
