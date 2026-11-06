(() => {
 const el=id=>document.getElementById(id), cfg=window.JIMPORT_CONFIG||{};
 const client=window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 if(!client)return;
 const money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(n)||0);
 const localDay=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const date=localDay();el('reportStart').value=date;el('reportEnd').value=date;
 let records=[];
 const status=el('dailyReportStatus');
 function draw(){
  const byDay=new Map();for(const r of records){const x=byDay.get(r.sale_day)||{qty:0,revenue:0,cost:0,profit:0,refs:new Set()};x.qty+=Number(r.quantity);x.revenue+=Number(r.revenue);x.cost+=Number(r.cost_total);x.profit+=Number(r.profit);x.refs.add(r.sale_reference);byDay.set(r.sale_day,x);}
  const totals=[...byDay.values()].reduce((a,x)=>({qty:a.qty+x.qty,revenue:a.revenue+x.revenue,cost:a.cost+x.cost,profit:a.profit+x.profit,sales:a.sales+x.refs.size}),{qty:0,revenue:0,cost:0,profit:0,sales:0});
  el('reportTotals').textContent=`${totals.sales} ventas · ${totals.qty} unidades · Ingresos ${money(totals.revenue)} · Costo de llegada ${money(totals.cost)} · Ganancia bruta ${money(totals.profit)}`;
  const days=el('reportDays');days.replaceChildren();for(const [day,x] of [...byDay].sort((a,b)=>b[0].localeCompare(a[0]))){const row=document.createElement('div');row.className='daily-report-day';row.textContent=`${day}  |  ${x.refs.size} ventas · ${x.qty} unidades · Ingresos ${money(x.revenue)} · Costo ${money(x.cost)} · Ganancia ${money(x.profit)}`;days.append(row);}
  const body=el('reportRows');body.replaceChildren();const renderedRefs=new Set();for(const r of records){const tr=document.createElement('tr');for(const v of [r.sale_day,r.sale_reference,r.brand+' · '+r.product_name,r.quantity,money(r.unit_price),money(r.unit_cost),money(r.revenue),money(r.cost_total),money(r.profit)]){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}const action=document.createElement('td');if(!renderedRefs.has(r.sale_reference)){renderedRefs.add(r.sale_reference);const button=document.createElement('button');button.type='button';button.className='button button-danger jimport-delete-sale';button.dataset.reference=r.sale_reference;button.textContent='Eliminar venta';button.title='Eliminar toda la venta y reintegrar sus productos al inventario';action.append(button);}else{action.textContent='—';}tr.append(action);body.append(tr);}
  if(!records.length)status.textContent='No hay ventas registradas en este período.';
 }
 async function load(){const start=el('reportStart').value,end=el('reportEnd').value;if(!start||!end||end<start){status.textContent='Selecciona fechas válidas.';return;}status.textContent='Consultando ventas…';const {data,error}=await client.rpc('jimport_daily_sales_report',{p_start:start,p_end:end});if(error){status.textContent='No se pudo consultar el reporte: '+error.message+'. Ejecuta REPORTE_DIARIO_VENTAS_SUPABASE.sql en Supabase.';return;}records=data||[];status.textContent='Reporte actualizado.';draw();}
 el('reportLoad').addEventListener('click',load);
 el('reportRows').addEventListener('click',async event=>{
  const button=event.target.closest('.jimport-delete-sale');if(!button)return;
  const reference=button.dataset.reference;if(!reference)return;
  if(!confirm(`¿Eliminar la venta ${reference}?\n\nSe reintegrarán al inventario todas las cantidades de los productos incluidos en esta venta. La operación no se puede deshacer.`))return;
  button.disabled=true;button.textContent='Procesando…';status.textContent='Reintegrando productos y eliminando la venta…';
  const {data,error}=await client.rpc('jimport_delete_sale_restore_inventory',{p_sale_reference:reference});
  if(error){status.textContent='No se pudo eliminar la venta: '+error.message+'. Ejecuta ELIMINAR_VENTA_REINTEGRAR_INVENTARIO.sql en Supabase.';button.disabled=false;button.textContent='Eliminar venta';return;}
  status.textContent=`Venta ${reference} eliminada. Se reintegraron ${Number(data?.products_count||0)} productos y ${Number(data?.units_restored||0)} unidades al inventario.`;
  await load();setTimeout(()=>location.reload(),700);
 });
 el('reportExport').addEventListener('click',()=>{if(!records.length){status.textContent='No hay datos para exportar.';return;}const headers=['Fecha','Referencia','Marca','Producto','Cantidad','Precio unitario','Costo llegada unitario','Ingresos','Costo total','Ganancia bruta'];const data=records.map(r=>[r.sale_day,r.sale_reference,r.brand,r.product_name,r.quantity,r.unit_price,r.unit_cost,r.revenue,r.cost_total,r.profit]);const esc=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const csv='\ufeff'+[headers,...data].map(row=>row.map(esc).join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`jimport-ventas-${el('reportStart').value}-${el('reportEnd').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-section="reporte"] summary'))load();});
})();
