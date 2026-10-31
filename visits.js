/* Conteo anónimo: una visita por navegador y día (zona horaria Ecuador). */
(async()=>{try{
 const c=window.JIMPORT_CONFIG;if(!c?.SUPABASE_URL||!c?.SUPABASE_ANON_KEY||!window.supabase)return;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const key='jimport_visitor_id';let id=localStorage.getItem(key);
 if(!id){id=crypto.randomUUID();localStorage.setItem(key,id);}
 const client=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
 await client.rpc('jimport_record_visit',{p_visitor_id:id});
}catch(e){console.warn('No se pudo registrar la visita:',e?.message||e);}})();
