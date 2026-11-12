(function(){
  const win=document.querySelector('.jp-showcase-window');
  if(!win) return;
  const track=win.querySelector('.jp-showcase-track');
  if(!track) return;
  let last=0,paused=false,resumeTimer=0,desktopOffset=0;
  const desktopSpeed=22; // velocidad normal y cómoda para PC
  const mobileSpeed=22;  // velocidad normal y cómoda para móvil
  const isMobile=()=>window.matchMedia('(max-width: 800px)').matches;
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now){
    if(reduced()||document.hidden){last=now;requestAnimationFrame(frame);return;}
    if(!paused && last){
      const delta=Math.min((now-last)/1000,.05);
      const loopPoint=track.scrollWidth/2;
      if(loopPoint>0){
        if(isMobile()){
          win.scrollLeft+=mobileSpeed*delta;
          if(win.scrollLeft>=loopPoint)win.scrollLeft-=loopPoint;
        }else{
          desktopOffset+=desktopSpeed*delta;
          if(desktopOffset>=loopPoint)desktopOffset-=loopPoint;
          track.style.transform=`translate3d(${-desktopOffset}px,0,0)`;
        }
      }
    }
    last=now;requestAnimationFrame(frame);
  }
  function pauseBriefly(){paused=true;clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{paused=false;last=0;},1800);}
  win.addEventListener('touchstart',()=>{paused=true;clearTimeout(resumeTimer);},{passive:true});
  win.addEventListener('touchend',pauseBriefly,{passive:true});
  win.addEventListener('touchcancel',pauseBriefly,{passive:true});
  win.addEventListener('pointerdown',()=>{paused=true;clearTimeout(resumeTimer);},{passive:true});
  win.addEventListener('pointerup',pauseBriefly,{passive:true});
  win.addEventListener('mouseenter',()=>{if(!isMobile())paused=true;});
  win.addEventListener('mouseleave',()=>{if(!isMobile())paused=false;last=0;});
  document.addEventListener('visibilitychange',()=>{last=0;});
  window.addEventListener('resize',()=>{last=0;});
  if(!reduced())requestAnimationFrame(frame);
})();