(function(){
 const win=document.querySelector('.jp-showcase-window');
 if(!win) return;
 let timer=null,paused=false;
 const step=()=>{if(paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const card=win.querySelector('.jp-showcase-card');if(!card)return;const gap=11;const max=win.scrollWidth-win.clientWidth;if(win.scrollLeft+win.clientWidth>=max-8){win.scrollTo({left:0,behavior:'smooth'});}else{win.scrollBy({left:card.getBoundingClientRect().width+gap,behavior:'smooth'});}};
 const start=()=>{if(window.innerWidth<=800&&!timer)timer=setInterval(step,3200);};
 const stop=()=>{if(timer){clearInterval(timer);timer=null;}};
 win.addEventListener('touchstart',()=>{paused=true;},{passive:true});
 win.addEventListener('touchend',()=>{paused=false;},{passive:true});
 win.addEventListener('mouseenter',()=>paused=true);win.addEventListener('mouseleave',()=>paused=false);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
 window.addEventListener('resize',()=>{stop();start();});start();
})();
