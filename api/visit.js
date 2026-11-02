// Vercel serverless endpoint: geolocation from Vercel request headers, no raw IP stored.
const {createHash}=require('crypto');
module.exports=async(req,res)=>{
 if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
 const id=String(req.body?.visitorId||'');
 if(!/^[a-zA-Z0-9-]{20,100}$/.test(id))return res.status(400).json({error:'ID inválido'});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({error:'Configura variables del servidor'});
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const visitor_hash=createHash('sha256').update(id).digest('hex');
 const country=String(req.headers['x-vercel-ip-country']||'Desconocido').slice(0,80);
 const city=String(req.headers['x-vercel-ip-city']||'Desconocida').slice(0,100);
 try{
  const result=await fetch(url+'/rest/v1/jimport_daily_visitors?on_conflict=visit_day,visitor_hash',{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'},
   body:JSON.stringify({visit_day:day,visitor_hash,country,city})
  });
  if(!result.ok)throw new Error('Error de registro');
  res.status(200).json({ok:true});
 }catch{res.status(500).json({error:'No se pudo registrar'});}
};
