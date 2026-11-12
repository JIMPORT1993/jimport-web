/* Un único video principal. El primer MP4 activo del administrador reemplaza el video de muestra. */
(()=>{
  const video=document.getElementById('jmHeroVideo'); if(!video)return;
  const sample=video.querySelector('source')?.src || video.currentSrc;
  function useVideo(url,title){
    if(!url || !/^https:\/\//i.test(url))return;
    if(video.getAttribute('src')===url)return;
    video.setAttribute('src',url);
    video.setAttribute('aria-label',title || 'Video de accesorios');
    video.muted=true; video.defaultMuted=true; video.loop=true;
    video.autoplay=true; video.playsInline=true; video.controls=false;
    video.load(); const playing=video.play(); if(playing?.catch)playing.catch(()=>{});
  }
  video.muted=true;
  video.addEventListener('canplay',()=>{if(video.paused)video.play().catch(()=>{});});
  video.addEventListener('error',()=>{video.classList.add('jm-video-unavailable');});
  const cfg=window.JIMPORT_CONFIG || {};
  if(!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY)return;
  const db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  db.from('jimport_brand_media').select('title,media_type,media_url,sort_order').eq('active',true)
    .eq('media_type','video').order('sort_order',{ascending:true}).order('created_at',{ascending:false}).limit(1)
    .then(({data,error})=>{if(!error&&data?.length){video.classList.remove('jm-video-unavailable');useVideo(data[0].media_url,data[0].title);}})
    .catch(()=>{});
})();
