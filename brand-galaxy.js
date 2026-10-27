(() => {
  const canvas = document.getElementById('brandGalaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=0,h=0,dpr=1,particles=[],frame=0,raf=0;
  const colors=['#00a650','#1469f5','#7c3aed','#4cc9f0','#a3e635','#f59e0b'];
  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); w=r.width; h=r.height;
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    particles=[]; const cx=w*.5,cy=h*.48; const count=Math.min(190,Math.max(90,Math.round(w/6)));
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const speed=0.35+Math.random()*2.4;particles.push({a,speed,dist:Math.random()*Math.max(w,h)*.62,size:.7+Math.random()*2.1,color:colors[i%colors.length],phase:Math.random()*Math.PI*2,orbit:Math.random()*1.3});}
    draw(true);
  }
  function draw(still=false){
    ctx.clearRect(0,0,w,h); const cx=w*.5,cy=h*.49;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.48);
    glow.addColorStop(0,'rgba(80,140,255,.10)');glow.addColorStop(.42,'rgba(115,70,220,.055)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    const pulse=still?1:(.72+Math.sin(frame*.035)*.16);
    particles.forEach((p,i)=>{
      const explode=(frame%240)/240; const radius=(p.dist+explode*38*p.speed+Math.sin(frame*.018+p.phase)*5)*pulse;
      const x=cx+Math.cos(p.a+frame*.001*p.orbit)*radius; const y=cy+Math.sin(p.a+frame*.001*p.orbit)*radius*.47;
      const alpha=Math.max(.12,.55-(radius/Math.max(w,h))*.48);ctx.globalAlpha=alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
      if(i%4===0){ctx.globalAlpha=alpha*.26;ctx.strokeStyle=p.color;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(cx+Math.cos(p.a)*radius*.25,cy+Math.sin(p.a)*radius*.12);ctx.lineTo(x,y);ctx.stroke();}
    });
    ctx.globalAlpha=1;
    // Bright expanding ring gives the impression of a galaxy bursting outward.
    const ring=(frame%180)/180;ctx.beginPath();ctx.ellipse(cx,cy,20+ring*w*.42,12+ring*h*.35,0,0,Math.PI*2);ctx.strokeStyle=`rgba(20,105,245,${.18*(1-ring)})`;ctx.lineWidth=1.2;ctx.stroke();
    if(!still&&!reduceMotion){frame++;raf=requestAnimationFrame(()=>draw(false));}
  }
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){if(!raf&&!reduceMotion)draw(false);}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.05});observer.observe(canvas);}else if(!reduceMotion){draw(false);}
  window.addEventListener('resize',resize,{passive:true});resize();
})();
