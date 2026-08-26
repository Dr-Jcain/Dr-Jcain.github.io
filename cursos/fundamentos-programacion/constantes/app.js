(() => {
  'use strict';
  const state={variable:{name:'contador',type:'int',value:0,address:'0x3000',locked:false},constant:{name:'LIMITE',type:'const int',value:100,address:'0x3004',locked:true}};
  const select=document.getElementById('objectSelect'), value=document.getElementById('objectValue'), rack=document.getElementById('objectRack'), status=document.getElementById('objectStatus');
  function render(){ const current=select.value; rack.innerHTML=Object.entries(state).map(([key,o])=>`<div class="ram-cell ${key===current?'active':''} ${o.locked?'locked':''}"><span class="ram-address">${o.address}</span><strong class="ram-value">${o.value}</strong><span class="ram-meta">${o.type} ${o.name}${o.locked?' · 🔒':''}</span></div>`).join(''); }
  document.getElementById('objectWrite').addEventListener('click',()=>{ const o=state[select.value]; if(o.locked){status.className='memory-status warn';status.textContent=`WRITE rechazado en la visualización: ${o.name} fue definido como const y conserva ${o.value}.`; } else {o.value=Math.trunc(Number(value.value)||0);status.className='memory-status ok';status.textContent=`WRITE realizado: ${o.name} ahora contiene ${o.value}.`; render();} });
  document.getElementById('objectRead').addEventListener('click',()=>{const o=state[select.value];status.className='memory-status ok';status.textContent=`READ: ${o.name} contiene ${o.value} en ${o.address}. Leer no modifica el valor.`;});
  select.addEventListener('change',render); render();
})();
