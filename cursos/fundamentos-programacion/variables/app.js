(() => {
  'use strict';
  const vars={
    edad:{type:'int',value:'20',address:'0x2000',bytes:4},
    temperatura:{type:'float',value:'22.5',address:'0x2004',bytes:4},
    inicial:{type:'char',value:"'J'",address:'0x2008',bytes:1}
  };
  const select=document.getElementById('variableSelect'), input=document.getElementById('variableValue'), rack=document.getElementById('variableRack'), status=document.getElementById('variableStatus');
  function render(){ const current=select.value; rack.innerHTML=Object.entries(vars).map(([name,v])=>`<div class="ram-cell ${name===current?'active':''}"><span class="ram-address">${v.address}</span><strong class="ram-value">${v.value}</strong><span class="ram-meta">${v.type} ${name} · ${v.bytes} byte${v.bytes>1?'s':''}</span></div>`).join(''); const v=vars[current]; input.value=v.value.replace(/^'|'$/g,''); status.className='memory-status'; status.textContent=`${v.type} ${current} vive en ${v.address} y actualmente contiene ${v.value}.`; }
  select.addEventListener('change',render);
  document.getElementById('assignVariable').addEventListener('click',()=>{ const name=select.value, v=vars[name], raw=input.value; if(v.type==='int'){v.value=String(Math.trunc(Number(raw)||0));} else if(v.type==='float'){v.value=String(Number(raw)||0);} else {v.value=`'${(raw||' ').charAt(0)}'`;} render(); status.className='memory-status ok'; status.textContent=`Asignación realizada: ${name} ahora contiene ${v.value}. La dirección ${v.address} no cambió.`; });
  render();
})();
