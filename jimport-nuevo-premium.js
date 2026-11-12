/* UI-only enhancements. Existing app.js and admin.js keep owning database changes. */
(() => {
 const topSearch=document.getElementById('jvSearch');
 const search=document.getElementById('search');
 const category=document.getElementById('categoryFilter');
 const brand=document.getElementById('brandFilter');
 if(topSearch&&search){
  topSearch.addEventListener('input',()=>{search.value=topSearch.value;search.dispatchEvent(new Event('input',{bubbles:true}));});
  search.addEventListener('input',()=>{if(topSearch.value!==search.value)topSearch.value=search.value;});
  document.getElementById('jvSearchButton')?.addEventListener('click',()=>document.getElementById('productos')?.scrollIntoView({behavior:'smooth'}));
  topSearch.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});});
 }
 document.querySelectorAll('[data-jv-category]').forEach(button=>button.addEventListener('click',()=>{
  if(!category)return;
  const value=button.dataset.jvCategory;
  const match=[...category.options].find(o=>o.value.toLocaleLowerCase('es')===value.toLocaleLowerCase('es'));
  if(match){category.value=match.value;}else{category.value='';}
  if(brand){brand.value='';brand.dispatchEvent(new Event('change',{bubbles:true}));}
  if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
  if(topSearch)topSearch.value='';
  category.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});
 }));
 document.getElementById('jvCartLink')?.addEventListener('click',e=>{
   const bar=document.getElementById('jxCartBar');if(!bar||bar.hidden){e.preventDefault();document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});return;}
   e.preventDefault();bar.querySelector('[data-jx="view"]')?.click();
 });
})();
