(()=>{
 const cfg=window.JIMPORT_CONFIG;const $=id=>document.getElementById(id);
 const client=cfg?.SUPABASE_URL&&cfg?.SUPABASE_ANON_KEY&&window.supabase?.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 async function load(){if(!client)return; $('visitsStatus').textContent='Actualizando…';
  const {data,error}=await client.rpc('jimport_admin_visit_stats');
  if(error){$('visitsStatus').textContent='No se pudieron cargar las estadísticas. Ejecuta ESTADISTICAS_VISITAS_SUPABASE.sql en Supabase. Detalle: '+error.message;return;}
  const rows=Array.isArray(data)?data:[];const vals=rows.map(x=>Number(x.visitors)||0);
  $('visitsToday').textContent=(vals[0]||0).toLocaleString('es-EC');$('visitsYesterday').textContent=(vals[1]||0).toLocaleString('es-EC');
  $('visitsWeek').textContent=vals.slice(0,7).reduce((a,b)=>a+b,0).toLocaleString('es-EC');$('visitsMonth').textContent=vals.reduce((a,b)=>a+b,0).toLocaleString('es-EC');
  $('visitsDays').replaceChildren(...rows.map(x=>{const r=document.createElement('div');r.className='visits-day';const d=document.createElement('span');d.textContent=x.day;const n=document.createElement('strong');n.textContent=Number(x.visitors||0).toLocaleString('es-EC');r.append(d,n);return r;}));
  $('visitsStatus').textContent='Última actualización: '+new Date().toLocaleTimeString('es-EC',{timeZone:'America/Guayaquil'});
 }
 window.addEventListener('jimport-admin-ready',load);$('refreshVisits')?.addEventListener('click',load);
 })();
