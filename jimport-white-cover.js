document.addEventListener('DOMContentLoaded',()=>{
 const cfg=window.JIMPORT_COVER||{};
 const image=document.getElementById('jxCoverImage');
 const video=document.getElementById('jxCoverVideo');
 const pause=document.getElementById('jxCoverPause');
 if(!image||!video)return;
 if(cfg.type==='video' && cfg.src){
   image.hidden=true;video.hidden=false;video.src=cfg.src;
   if(cfg.poster)video.poster=cfg.poster;
   video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;
   if(pause)pause.hidden=false;
   video.play().catch(()=>{video.controls=true;if(pause)pause.hidden=true;});
   if(pause)pause.addEventListener('click',()=>{if(video.paused){video.play();pause.textContent='Pausar video';}else{video.pause();pause.textContent='Reproducir video';}});
 }else{
   image.src=cfg.src||'assets/ugreen-portada-original.png';image.alt=cfg.alt||'Productos de JIMPORT';
   video.removeAttribute('src');video.hidden=true;if(pause)pause.hidden=true;
 }
 document.querySelectorAll('[data-category-keyword]').forEach(a=>a.addEventListener('click',()=>{const input=document.getElementById('search');if(!input)return;document.getElementById('clearFilters')?.click();input.value=a.dataset.categoryKeyword;input.dispatchEvent(new Event('input',{bubbles:true}));}));
});
