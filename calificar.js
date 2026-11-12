(() => {
  const cfg=window.JIMPORT_CONFIG||{};
  const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith('PEGA_')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.startsWith('PEGA_');
  const client=configured&&window.supabase?.createClient?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const form=document.getElementById('reviewForm'), select=document.getElementById('reviewRating'), picker=document.getElementById('ratingPicker');
  const paint=()=>{const value=Number(select.value||0);picker.querySelectorAll('button').forEach(b=>{const chosen=Number(b.dataset.rating)<=value;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(Number(b.dataset.rating)===value));});};
  picker.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{select.value=b.dataset.rating;paint();}));
  select.addEventListener('change',paint);form.addEventListener('reset',()=>requestAnimationFrame(paint));paint();
  form.addEventListener('submit',async e=>{
    e.preventDefault();const msg=document.getElementById('reviewMessage'),btn=document.getElementById('reviewSubmit');
    if(!client){msg.textContent='No se pudo conectar con el sistema de calificaciones. Inténtalo más tarde.';return;}
    const first=document.getElementById('reviewName').value.trim(),last=document.getElementById('reviewLastName').value.trim(),name=`${first} ${last}`.trim(),code=document.getElementById('reviewCode').value.trim(),comment=document.getElementById('reviewComment').value.trim(),rating=Number(select.value);
    if(!first||!last||name.length>70||!code||comment.length<10||rating<1||rating>5){msg.textContent='Completa todos los campos correctamente.';return;}
    btn.disabled=true;msg.textContent='Verificando tu compra y enviando calificación…';
    const {error}=await client.rpc('submit_verified_review',{purchase_code:code,reviewer_name:name,review_rating:rating,review_comment:comment});
    btn.disabled=false;
    if(error){msg.textContent='No se pudo verificar la compra o el código ya fue utilizado. Comprueba el código recibido por WhatsApp.';return;}
    form.reset();msg.textContent='¡Gracias por calificar tu compra! Tu opinión fue recibida y se publicará después de su aprobación.';
  });
})();
