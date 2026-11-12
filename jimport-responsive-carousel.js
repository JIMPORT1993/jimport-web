(function(){
  const win=document.querySelector('.jp-showcase-window');
  if(!win) return;
  const track=win.querySelector('.jp-showcase-track');
  if(!track) return;
  let raf=0,last=0,paused=false,resumeTimer=0;
  const speed=42; // desplazamiento continuo en píxeles por segundo
  const isMobile=()=>window.matchMedia('(max-width: 800px)').matches;
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now){
    if(!isMobile()||reduced()||document.hidden){last=now;raf=requestAnimationFrame(frame);return;}
    if(!paused){
      if(last){const delta=Math.min((now-last)/1000,.05);win.scrollLeft+=speed*delta;}
      const loopPoint=track.scrollWidth/2;
      if(loopPoint>0 && win.scrollLeft>=loopPoint) win.scrollLeft-=loopPoint;
    }
    last=now;raf=requestAnimationFrame(frame);
  }
  function pauseBriefly(){paused=true;clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{paused=false;last=0;},1800);}
  win.addEventListener('touchstart',()=>{paused=true;clearTimeout(resumeTimer);},{passive:true});
  win.addEventListener('touchend',pauseBriefly,{passive:true});
  win.addEventListener('touchcancel',pauseBriefly,{passive:true});
  win.addEventListener('pointerdown',()=>{if(isMobile()){paused=true;clearTimeout(resumeTimer);}},{passive:true});
  win.addEventListener('pointerup',pauseBriefly,{passive:true});
  win.addEventListener('mouseenter',()=>{if(!isMobile())paused=true;});
  win.addEventListener('mouseleave',()=>{if(!isMobile())paused=false;});
  document.addEventListener('visibilitychange',()=>{last=0;});
  window.addEventListener('resize',()=>{last=0;});
  if(!reduced()) raf=requestAnimationFrame(frame);
})();
