/* Visitante único aproximado por navegador y día; no guarda IP ni GPS. */
(async()=>{try{
 const key='jimport_visitor_id';let id=localStorage.getItem(key);
 if(!id){id=crypto.randomUUID();localStorage.setItem(key,id);}
 const response=await fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:id})});
 if(!response.ok){ // Compatibilidad con despliegues que todavía no configuraron el endpoint.
  const c=window.JIMPORT_CONFIG;
  if(c?.SUPABASE_URL&&c?.SUPABASE_ANON_KEY&&window.supabase){
   const client=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
   await client.rpc('jimport_record_visit',{p_visitor_id:id});
  }
 }
}catch(e){console.warn('Estadísticas de visitas no disponibles');}})();
